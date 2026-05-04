import re
import json
import asyncio
import traceback
import time
import yaml
import difflib
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from langchain_community.document_loaders import PyPDFLoader

from .vault_manager import VaultManager
from .deployer import OkaDeployer
from src.domains.ai.factory import ModelFactory
from .agents import ArchitectAgent, TheoryAgent, PractitionerAgent, QuestionAgent, CriticAgent, HubAgent, VerifierAgent, QuizAuditorAgent, DOMAIN_MATRIX
from .governor import TokenGovernor
from .schemas import SovereignPlan, AtomicNoteSchema, NoteContent, NoteSchema, ProbeEnrichment
import ruamel.yaml
import logging

logger = logging.getLogger("LifeOS")

# OKA-specific constants
OKA_TIMEOUT = 600       # 10 minutes — headroom for large PDFs
OKA_MAX_RETRIES = 10     # Retry on transient failures (524, timeout, rate-limit)
OKA_RETRY_BACKOFF = 15  # Seconds between retries (doubles each attempt)
MAX_SOURCE_CHARS = 150000  # Characters to include in prompt


class OkaService:
    """
    Main orchestrator for OKA.
    """
    _sessions: Dict[str, Dict[str, Any]] = {}
    _status: Dict[str, str] = {}  # Global status map
    _rate_limited: Dict[str, float] = {}  # session_id → timestamp when rate-limit hit
    _session_file = Path.home() / ".lifeos" / "oka" / "sessions.json"

    def __init__(self, secrets):
        self.secrets = secrets
        self.vm = VaultManager(secrets.vault_path, academic_root=secrets.academic_path)
        self.deployer = OkaDeployer(self.vm)
        self._ensure_session_dir()

        # Initialize LLM with extended timeout for OKA workloads
        self.llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.0, # ZERO temperature for strict structural planning
            timeout=OKA_TIMEOUT,
            request_timeout=OKA_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if secrets.ai_key else None

        # Initialize the Architect Agent for deterministic planning
        self.architect_agent = ArchitectAgent(llm=self.llm) if self.llm else None

        # Initialize Planner LLM for complex tasks like quiz generation
        planner_provider = secrets.planner_provider or secrets.ai_provider
        planner_key = secrets.planner_key or secrets.ai_key
        planner_model = secrets.planner_model or secrets.ai_model
        
        self.planner_llm = ModelFactory.get_model(
            provider=planner_provider,
            model_name=planner_model,
            api_key=planner_key,
            temperature=0.0, # ZERO temperature for planning
            timeout=OKA_TIMEOUT,
            request_timeout=OKA_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if planner_key else self.llm

        # Initialize the Writer Agent for creative generation
        self.llm_creative = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.0, # 0.0 for strict template execution
            timeout=OKA_TIMEOUT,
            request_timeout=OKA_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if secrets.ai_key else None
        
        self.writer_agent = None  # replaced by split agents
        self.critic_agent = CriticAgent(llm=self.llm_creative) if self.llm_creative else None
        self.hub_agent = HubAgent(llm=self.llm) if self.llm else None
        self.governor = TokenGovernor()
        
        from .validator import OkaValidator
        self.validator = OkaValidator()
        
        # Initialize YAML compiler
        self.yaml = ruamel.yaml.YAML()
        self.yaml.indent(mapping=2, sequence=4, offset=2)

    def _ensure_session_dir(self):
        self._session_file.parent.mkdir(parents=True, exist_ok=True)

    def _persist_session(self, session_id: str, data: Dict[str, Any]):
        """Saves session state to disk for recovery."""
        try:
            # We don't save the actual messages (too large/unserializable), just the metadata
            persist_data = {
                "path": data.get("path"),
                "metadata": data.get("metadata"),
                "current_batch": data.get("current_batch"),
                "total_batches": data.get("total_batches"),
                "target_hub": data.get("target_hub")
            }
            
            existing = {}
            if self._session_file.exists():
                with open(self._session_file, "r") as f:
                    existing = json.load(f)
            
            existing[session_id] = persist_data
            with open(self._session_file, "w") as f:
                json.dump(existing, f)
        except Exception as e:
            print(f"[OKA Service] Session persistence failed: {e}")

    async def _get_or_restore_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        if session_id in OkaService._sessions:
            return OkaService._sessions[session_id]
        
        # Try to restore from disk
        if self._session_file.exists():
            try:
                with open(self._session_file, "r") as f:
                    existing = json.load(f)
                if session_id in existing:
                    data = existing[session_id]
                    # We need to re-initialize messages from SI and initial prompt
                    # This is a bit tricky for multi-turn, but for OKA batches it's predictable
                    si_path = self.resolve_si_path()
                    si = await self._get_si(str(si_path))
                    data["messages"] = [SystemMessage(content=si)]
                    OkaService._sessions[session_id] = data
                    return data
            except Exception: pass
        return None

    @staticmethod
    def resolve_si_path() -> Path:
        # Resolve absolute root (LifeOs/)
        # Current file is apps/api/src/domains/oka/service.py
        # parent 1: oka/
        # parent 2: domains/
        # parent 3: src/
        # parent 4: api/
        # parent 5: apps/
        # parent 6: LifeOs/
        root = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        paths = [
            root / "OKA.md",
            root / ".system/prompts/OKA_System_Instruction.md"
        ]
        for p in paths:
            if p.exists(): return p
        raise FileNotFoundError(f"OKA System Instruction not found in: {[str(p) for p in paths]}")

    async def _get_si(self, path: str) -> str:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    async def _invoke_with_retry(self, messages: List[BaseMessage], session_id: str, phase: str = "AI Generation") -> AIMessage:
        """
        Wraps LLM calls with exponential-backoff retry.
        On 429 (rate limit): waits up to 5 minutes per attempt (10 attempts max).
        On key-swap recovery: re-reads secrets from disk and rebuilds the LLM.
        """
        attempt = 0
        last_error = None

        while attempt < OKA_MAX_RETRIES:
            try:
                attempt += 1
                OkaService._status[session_id] = f"{phase} (Attempt {attempt}/{OKA_MAX_RETRIES})..."
                return await self.llm.ainvoke(messages)
            except Exception as e:
                last_error = e
                error_str = str(e)
                print(f"[OKA Service] AI Attempt {attempt} failed: {error_str[:200]}")

                is_rate_limit = "429" in error_str or "rate_limit" in error_str.lower()
                is_transient = is_rate_limit or any(
                    c in error_str for c in ["503", "524", "timeout", "overloaded"]
                )

                if is_transient and attempt < OKA_MAX_RETRIES:
                    # Rate limits get much longer waits: 30s, 60s, 120s, 240s...
                    if is_rate_limit:
                        backoff = min(30 * (2 ** (attempt - 1)), 300)  # cap at 5 min
                        label = f"Rate Limited (429). Waiting {backoff}s before retry {attempt+1}/{OKA_MAX_RETRIES}..."
                    else:
                        backoff = OKA_RETRY_BACKOFF * (2 ** (attempt - 1))
                        label = f"{self._classify_error(error_str)}. Retrying in {backoff}s ({attempt}/{OKA_MAX_RETRIES})..."

                    OkaService._status[session_id] = label
                    print(f"[OKA Service] {label}")
                    await asyncio.sleep(backoff)
                else:
                    break

        raise last_error

    def _classify_error(self, error_str: str) -> str:
        if "429" in error_str: return "Rate Limited (429)"
        if "503" in error_str or "overloaded" in error_str.lower(): return "Server Overloaded (503)"
        if "524" in error_str or "timeout" in error_str.lower(): return "Gateway Timeout"
        return "Connection Error"

    def swap_api_key(self, new_api_key: str) -> None:
        """
        Hot-swap the API key without restarting the server.
        Call this after the user sets a new key in Settings.
        The next LLM call will use the new key immediately.
        """
        try:
            print("[OKA Service] Swapping API key...")
            self.llm = ModelFactory.get_model(
                provider=self.secrets.ai_provider,
                model_name=self.secrets.ai_model,
                api_key=new_api_key,
                temperature=0.0,
                timeout=OKA_TIMEOUT,
                request_timeout=OKA_TIMEOUT,
                max_retries=0,
                max_tokens=4096,
            )
            self.llm_creative = self.llm
            if self.critic_agent:
                self.critic_agent.llm = self.llm
            if self.hub_agent:
                self.hub_agent.llm = self.llm
            if self.architect_agent:
                self.architect_agent.llm = self.llm
                try:
                    self.architect_agent.llm_structured = self.llm.with_structured_output(
                        type(self.architect_agent.llm_structured).__mro__[0]
                    )
                except Exception:
                    pass
            print("[OKA Service] API key swapped successfully.")
        except Exception as e:
            print(f"[OKA Service] Key swap failed: {e}")

    def get_paused_sessions(self) -> List[Dict[str, Any]]:
        """Returns all sessions that were paused due to a rate limit."""
        paused = []
        for sid, ts in OkaService._rate_limited.items():
            session = OkaService._sessions.get(sid, {})
            paused.append({
                "session_id": sid,
                "paused_at": ts,
                "current_batch": session.get("current_batch", 0),
                "total_batches": session.get("total_batches", 0),
                "status": OkaService._status.get(sid, "rate_limited"),
            })
        return paused

    async def resume_paused_session(
        self, session_id: str, curriculum_override: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Resumes a session that was paused due to a rate limit.
        Safe to call even if the session is not paused (idempotent).
        """
        OkaService._rate_limited.pop(session_id, None)
        return await self.confirm_plan(
            session_id=session_id,
            command="Resume",
            curriculum_override=curriculum_override,
        )

    def _format_user_error(self, e: Exception) -> str:
        err_msg = str(e)
        if "429" in err_msg: return "Model is rate-limited. Retrying automatically..."
        if "503" in err_msg: return "Model is overloaded. Retrying automatically..."
        if "timeout" in err_msg.lower(): return "Request timed out. The document might be too large or the AI is slow."
        return f"System Error: {err_msg}"

    def _get_planner_path(self) -> Path:
        """Resolves the absolute path to the Study Planner database."""
        return Path(self.secrets.vault_path) / "3-Database" / "06 - Study Planner"

    def list_available_options(self) -> Dict[str, List[str]]:
        """Returns all available options for Course, Semester, Year, Hubs, and Units from the vault."""
        base_path = Path(self.secrets.vault_path) / "3-Database"
        
        courses = [f.stem for f in (base_path / "07 - Courses").glob("*.md") if not f.name.startswith("_")]
        semesters = [f.stem for f in (base_path / "08 - Semesters").glob("*.md") if not f.name.startswith("_")]
        years = [f.stem for f in (base_path / "09 - Years").glob("*.md") if not f.name.startswith("_")]
        hubs = [f.stem for f in (base_path / "06 - Study Planner").glob("*.md") if not f.name.startswith("_")]
        units = [f.stem for f in (base_path / "06 - Study Planner" / "_Units").glob("*.md")]
        
        # Sort units numerically if possible
        try: units.sort(key=lambda x: int(x))
        except Exception: units.sort()

        return {
            "courses": courses,
            "semesters": semesters,
            "years": years,
            "hubs": hubs,
            "units": units
        }

    def _clean_prop(self, val: Any) -> str:
        """Cleans a property value from Obsidian YAML — handles deeply nested lists and wikilinks.
        Obsidian sometimes returns [[value]] as [[[value]]] after multiple write cycles.
        """
        if val is None: return ""
        # Deep unwrap: recursively unpack nested lists
        while isinstance(val, list):
            if len(val) == 0: return ""
            val = val[0]
        # Now val is a scalar — strip all bracket/wikilink/quote artifacts
        s = str(val).strip()
        s = re.sub(r"[\[\]]+", "", s).strip("\"' ")
        if s.lower() in ("unknown", "none", ""): return ""
        return s

    def list_planner_hubs(self) -> List[Dict[str, Any]]:
        """Lists all existing hubs in the Study Planner with their metadata."""
        planner_path = self._get_planner_path()
        if not planner_path.exists():
            return []
        
        hubs = []
        for file in planner_path.glob("*.md"):
            if file.name.startswith("_"): continue
            
            metadata = {
                "id": file.name,
                "title": file.stem.replace("_", " "),
                "path": str(file.absolute())
            }
            
            try:
                with open(file, "r", encoding="utf-8") as f:
                    content = f.read()
                    data, _, err = self.vm.extract_yaml_and_content(content)
                    if not err:
                        metadata["course"] = self._clean_prop(data.get("course") or data.get("Course"))
                        metadata["unit"] = self._clean_prop(data.get("unit") or data.get("Unit"))
                        metadata["semester"] = self._clean_prop(data.get("semester") or data.get("Semester"))
            except Exception as e:
                print(f"[OKA Service] Error reading hub {file.name}: {e}")
            
            hubs.append(metadata)
        return hubs

    def _get_unit_dir(self, hub: Dict[str, Any]) -> Path:
        """Resolves the academic unit directory for a given hub.
        If the direct path (Semester/Course/Unit) doesn't exist, it performs a search.
        """
        hub_path = Path(hub["path"])
        semester = hub.get("semester") or "General"
        course = hub.get("course") or "General_Knowledge"
        unit_num = hub.get("unit", "")
        
        # Canonical names
        clean_hub_base = self.vm.super_clean(hub["title"])
        canonical_hub = self.vm.get_canonical_title(clean_hub_base)
        unit_prefix = f"{unit_num}_" if unit_num else ""
        unit_folder_name = f"{unit_prefix}{canonical_hub}"
        
        # 1. Try direct path
        academic_unit_dir = self.vm.academic_root / semester / self.vm.get_canonical_title(course) / unit_folder_name
        if academic_unit_dir.exists():
            return academic_unit_dir
            
        # 2. Try without semester (search inside academic root)
        # Search for a folder matching unit_folder_name inside 2-Academic
        try:
            matches = list(self.vm.academic_root.rglob(unit_folder_name))
            if matches:
                # Return the first directory match
                for m in matches:
                    if m.is_dir():
                        return m
        except Exception:
            pass

        # 3. Fallback to hub directory (though unlikely to have atomic notes there)
        return hub_path.parent

    def list_atomic_notes(self, hub_id: str) -> List[Dict[str, Any]]:
        """Lists atomic notes linked to a specific hub.
        STRICT: Extracts ordered links from the 'Connections' or 'Core Topologies' section.
        If no section is found, returns an empty list to enforce project structure.
        """
        hubs = self.list_planner_hubs()
        hub = next((h for h in hubs if h["id"] == hub_id), None)
        if not hub:
            return []
            
        hub_path = Path(hub["path"])
        unit_dir = self._get_unit_dir(hub)
        
        # 1. Try to extract ordered notes from Hub content
        if hub_path.exists():
            try:
                with open(hub_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Match Connections or Core Topologies sections
                conn_match = re.search(r"(?:#+\s*Core Topologies.*?|#+\s*Connections)\s*\n([\s\S]*?)(?=\n#+\s|$)", content, re.IGNORECASE)
                if conn_match:
                    section_text = conn_match.group(1)
                    # Extract [[Note Title]]
                    links = re.findall(r"\[\[(.*?)\]\]", section_text)
                    if links:
                        # Map titles to files in the unit directory for verification
                        dir_files = {f.stem.lower().replace("_", " "): f for f in unit_dir.glob("*.md")}
                        # Also index by canonical stem
                        for f in unit_dir.glob("*.md"):
                            dir_files[f.stem.lower()] = f

                        ordered_notes = []
                        for link in links:
                            title = link.split('|')[0].split('#')[0].strip()
                            title_key = title.lower().replace("_", " ")
                            
                            file = dir_files.get(title_key) or dir_files.get(title.lower())
                            if file and file.exists():
                                # STRICT FILTER: Only atomic notes, no hubs, no questions, no current hub
                                if file.name.endswith("_Hub.md") or "Possible_Questions" in file.name or "Practice" in file.name or file.name.startswith("_"):
                                    continue
                                if file.name == hub_path.name:
                                    continue
                                    
                                ordered_notes.append({
                                    "id": file.stem,
                                    "title": file.stem.replace("_", " "),
                                    "path": str(file.absolute())
                                })
                        
                        return ordered_notes
            except Exception as e:
                print(f"[OKA Service] Connection extraction failed: {e}")

        # If no connections section found or no links in it, return empty to enforce "strict Connections" rule
        return []

    def list_practices(self) -> List[Dict[str, Any]]:
        """Lists all existing practices by scanning known storage locations recursively."""
        hubs = self.list_planner_hubs()
        practices = []
        
        # 1. Identify all potential practice directories
        search_dirs = []
        
        # Root locations
        roots = [self._get_planner_path(), self.vm.academic_root]
        for root in roots:
            if root.exists():
                # Add the root's own Practice folder if it exists
                search_dirs.append(root / "Practice")
                # Find all nested Practice folders
                search_dirs.extend([p for p in root.rglob("Practice") if p.is_dir()])
        
        # Deduplicate and filter existing paths
        unique_dirs = list(set([str(d.absolute()) for d in search_dirs if d.exists()]))
        
        seen_files = set()
        for d_path in unique_dirs:
            pdir = Path(d_path)
            for file in pdir.glob("*.md"):
                if str(file.absolute()) in seen_files: continue
                seen_files.add(str(file.absolute()))
                
                try:
                    with open(file, "r", encoding="utf-8") as f:
                        content = f.read()
                        data, _, err = self.vm.extract_yaml_and_content(content)
                        
                        if not err and data.get("type") == "practice":
                            h_id = data.get("hub_id")
                            # Normalize hub_id (strip brackets/quotes if present)
                            if h_id:
                                h_id = h_id.replace("[[", "").replace("]]", "").strip("\"'")
                                
                            matching_hub = next((h for h in hubs if h["id"] == h_id), None)
                            
                            # Determine hub title from various sources
                            hub_title = "Unlinked Session"
                            if matching_hub:
                                hub_title = matching_hub.get("title")
                            elif h_id:
                                # Fallback: clean-up the ID itself for a readable title
                                hub_title = h_id.replace(".md", "").replace("_", " ").split("/")[-1]
                                if "Hub" not in hub_title: hub_title += " Hub"

                            # Extract metadata
                            metadata = {
                                "id": file.name,
                                "path": str(file.absolute()),
                                "hub_id": h_id,
                                "date": data.get("date"),
                                "difficulty": data.get("difficulty"),
                                "score": data.get("score"),
                                "completed": data.get("completed", False),
                                "question_types": data.get("question_types", [])
                            }
                            # Add enrichment
                            metadata["hub_title"] = hub_title
                            metadata["course"] = (matching_hub or {}).get("course", "General")
                            practices.append(metadata)
                except Exception as e:
                    print(f"[OKA Service] Error reading practice {file.name}: {e}")
        
        # Sort by ID (usually contains timestamp) descending
        practices.sort(key=lambda x: x.get("id", ""), reverse=True)
        return practices

    def update_practice_score(self, practice_path: str, score: int) -> bool:
        """Updates the score of a practice file."""
        p = Path(practice_path)
        if not p.exists(): return False
        try:
            with open(p, "r", encoding="utf-8") as f:
                content = f.read()
            yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
            if yaml_match:
                import yaml
                data = yaml.safe_load(yaml_match.group(1))
                if data:
                    data["score"] = f"{score}%"
                    data["completed"] = True
                    new_yaml = yaml.dump(data, sort_keys=False)
                    new_content = f"---\n{new_yaml}---\n" + content[yaml_match.end():]
                    with open(p, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    return True
        except Exception as e:
            print(f"[OKA Service] Error updating practice score {p.name}: {e}")
        return False

    async def generate_practice(
        self, 
        hub_id: str, 
        config_raw: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates personalized practice questions based on a Hub and its associated notes.
        Supports advanced pedagogical configurations and heterogeneous question types.
        """
        from .schemas import AdvancedPracticeConfig
        
        try:
            config = AdvancedPracticeConfig(**config_raw)
        except Exception:
            # Fallback for legacy requests or partial configs
            config = AdvancedPracticeConfig(
                hubId=hub_id,
                questionDistribution={
                    "multipleChoice": config_raw.get("question_count", 5) if config_raw.get("question_type") == "Multiple Choice" else 0,
                    "trueFalse": config_raw.get("question_count", 5) if config_raw.get("question_type") == "True/False" else 0,
                    "shortAnswer": config_raw.get("question_count", 5) if config_raw.get("question_type") == "Short Answer" else 0,
                    "scenario": config_raw.get("question_count", 5) if config_raw.get("question_type") == "Scenario-Based" else 0
                },
                difficulty=config_raw.get("difficulty", "L1") if config_raw.get("difficulty") != "Mixed" else "L2"
            )

        # CRITICAL FIX: The explicit hub_id parameter is always the authoritative source.
        # config.hubId can be empty string if frontend sent the default AdvancedPracticeConfig.
        if not config.hubId or config.hubId.strip() == '':
            config.hubId = hub_id

        if not self.planner_llm:
            raise ValueError("Planner AI is not configured. Go to Settings > AI Configuration and add your API key.")

        hubs = self.list_planner_hubs()
        hub = next((h for h in hubs if h["id"] == config.hubId), None)
        if not hub:
            # Fallback: try matching by stem (without .md extension)
            hub = next((h for h in hubs if h["id"].replace(".md", "") == config.hubId.replace(".md", "")), None)
        if not hub:
            available = [h["id"] for h in hubs]
            raise ValueError(f"Hub not found: '{config.hubId}'. Available hubs: {available}")
        
        hub_path = Path(hub["path"])
        
        unit_dir = self._get_unit_dir(hub)
        practice_dir = self.vm.academic_root / "Practice"
        practice_dir.mkdir(exist_ok=True)
        
        # 1. Gather Context
        # Budget: 20,000 chars total for the prompt context to fit in low TPM limits
        PRACTICE_MAX_CHARS = 20_000
        context_parts = []
        
        # Filter files based on config
        atomic_notes = list(unit_dir.glob("*.md"))
        selected_notes = config.selectedAtomicNotes
        
        notes_to_process = []
        for note_path in atomic_notes:
            if note_path.name == hub_path.name or "Possible_Questions" in note_path.name or "Practice" in note_path.name or note_path.name.startswith("_"):
                continue
            if selected_notes and note_path.stem not in selected_notes:
                continue
            notes_to_process.append(note_path)

        if not notes_to_process and not selected_notes:
             # If no specific notes selected, we might want the Hub itself
             with open(hub_path, "r", encoding="utf-8") as f:
                context_parts.append(f"## Hub Note: {hub['title']}\n{f.read()}")

        # Distribute budget
        if notes_to_process:
            budget_per_note = PRACTICE_MAX_CHARS // len(notes_to_process)
            found_selected = True
            for note_path in notes_to_process:
                with open(note_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    # Truncate note if it's too long for its share of the budget
                    if len(content) > budget_per_note:
                        content = content[:budget_per_note] + "... [Truncated for Context Limit]"
                    context_parts.append(f"### Atomic Note: {note_path.stem}\n{content}")
        else:
            found_selected = False

        # 2. Add Possible Questions only if no specific notes are selected (full unit mode)
        if not selected_notes:
            pq_file = next(unit_dir.glob("*_Possible_Questions.md"), None)
            if pq_file:
                with open(pq_file, "r", encoding="utf-8") as f:
                    context_parts.append(f"## Reference Questions\n{f.read()}")
        
        # STRICT ERROR: If notes were selected but none were found/processed, abort.
        if selected_notes and not found_selected:
            raise Exception(f"Strict Error: None of the selected notes ({selected_notes}) were found in the unit directory.")
        
        # Randomize context order to break structural bias
        import random
        random.shuffle(context_parts)
        full_context = "\n\n".join(context_parts)
        
        # PRE-VALIDATION: Prevent hallucination if no context is found
        if len(full_context.strip()) < 50:
            logger.error(f"[OKA Service] No sufficient context found for hub {hub_id} with selection {selected_notes}")
            raise Exception("No source material found for the selected concepts. Please ensure the atomic notes have content.")
        
        # 2. Build Prompt
        # Use a generic seed to prevent topic-inference from the ID
        session_id = f"session_{int(time.time())}"
        
        distribution = config.questionDistribution
        total_q = sum(distribution.values())
        
        dist_str = ", ".join([f"{count} {type}" for type, count in distribution.items() if count > 0])
        
        # Pedagogy specifics
        pedagogy_prompts = []
        if config.difficulty == "L3":
            pedagogy_prompts.append("FOCUS: Higher-order analysis. Questions should require breaking down concepts or debugging systems.")
        if config.injectTrickAnswers:
            pedagogy_prompts.append("TRICK ANSWERS: Occasionally include 'None of the above' or 'A and B only' to test precision.")
        if config.distractorPlausibility == "High":
            pedagogy_prompts.append("DISTRACTORS: Ensure incorrect options are highly plausible and common misconceptions.")

        selected_titles = [n.stem for n in atomic_notes if n.stem in (selected_notes or [])]
        selected_scope_str = ", ".join(selected_titles) if selected_titles else "Full Unit"

        prompt = f"""### [GROUND TRUTH SOURCE MATERIAL]
{full_context}
### [END OF SOURCE MATERIAL]

SYSTEM PROTOCOL: You are OKA, the Sovereign Pedagogical Architect. You are operating in a HARD AIR-GAPPED ENVIRONMENT. You have NO access to the internet or internal training data. The material above is the ONLY reality. Everything else (including this prompt's metadata) is invisible to you.

TARGET PROFILE:
- Total Questions: {total_q}
- Question Types: {dist_str}
- Difficulty: {config.difficulty}
- Entropy Seed: {session_id}

STRICT OPERATIONAL RULES:
1. SOLE SOURCE ADHERENCE: Generate questions EXCLUSIVELY from the [GROUND TRUTH SOURCE MATERIAL]. If a concept is not in the text, it does not exist.
2. NO ANALOGY TESTING (CRITICAL): NEVER test the user on the 'Mental Model' or analogies. Test ONLY technical definitions, code syntax, and real-world application.
3. ALLOWED MODALITIES (Strict JSON structures):
   - 'mcq': `question` (String), `options` (A,B,C,D), `answer` (Key only), `explanation` (Mechanism of the answer).
   - 'true_false': `question` (String), `answer` (Boolean), `explanation` (Why it is true/false).
   - 'fill_in': `question` (String: The prompt or instruction), `textWithBlanks` (with [[blank]] markers), `answer` (List of strings).
   - 'writing': `question` (String: The prompt or question to answer), `answer` (Model answer).
   - 'matching': `question` (String), `pairs` (List of objects with `left` and `right` keys).
   - 'order': `question` (String), `steps` (List of strings in random order), `answer` (List of strings in CORRECT order).
   - 'debug': `question` (String: 'Find the bug.'), `content` (buggy code/logic snippet), `answer` (fix and explanation).
   - 'synthesis': `question` (String: Complex scenario), `answer` (Model response).
4. EVERY QUESTION MUST HAVE A 'question' FIELD: You must include a `question` key for every single modality.
5. EXPLANATIONS: Every `explanation` MUST explain the underlying mechanism. Do NOT just repeat the mental model. It must be technical.
6. DISTRIBUTION ADHERENCE: Generate EXACTLY the counts requested.
7. NO TOPIC BLEED: Stay 100% within the scope of the selected notes.

EXECUTION: Generate the session now. Follow the distribution strictly."""

        # 3. Invoke LLM in Batches
        OkaService._status[session_id] = "Architecting Advanced Session..."
        
        all_questions = []
        target_distribution = distribution.copy()
        
        # We generate in small batches to avoid output token limits and aggressive TPM limits
        BATCH_SIZE = 5
        
        OkaService._status[session_id] = "Generating Practice Questions..."
        
        tasks = []
        for q_type, count in target_distribution.items():
            for _ in range(count):
                agent = QuestionAgent(self.planner_llm, q_type)
                import random
                seed = random.random()
                
                # To prevent redundancy, physically shuffle the context for each agent
                # and slice it so they literally see different text at the top,
                # ensuring the 3000 character cutoff in agents.py grabs different facts.
                shuffled_parts = list(context_parts)
                random.shuffle(shuffled_parts)
                tight_context = "\n\n".join(shuffled_parts)
                
                tasks.append(agent.generate(hub['title'], f"SEED: {seed}\n" + tight_context, config.difficulty))
                
        # Limit concurrency and rate to avoid groq/ollama rate limits
        from aiolimiter import AsyncLimiter
        import asyncio
        
        # Groq limits are often ~30 RPM on free tier, but TPM is easily hit. Limit to 5 per minute for wide safety.
        rate_limiter = AsyncLimiter(5, 60)
        
        async def run_agent(agent_task):
            max_retries = 5
            base_delay = 3.0
            for attempt in range(max_retries):
                try:
                    async with rate_limiter:
                        return await agent_task
                except Exception as e:
                    err_msg = str(e)
                    if "429" in err_msg or "rate limit" in err_msg.lower():
                        if attempt == max_retries - 1:
                            logger.error(f"[OKA Service] Max retries reached for question generation: {e}")
                            return {"error": "Rate limit exceeded after retries"}
                        
                        # Extract the required wait time from Groq error if available, else exponential backoff
                        delay = base_delay * (2 ** attempt)
                        import re
                        match = re.search(r'Please try again in ([0-9.]+)s', err_msg)
                        if match:
                            delay = float(match.group(1)) + 1.0 # Add a buffer
                        
                        logger.warning(f"[OKA Service] Rate limit hit (Attempt {attempt+1}/{max_retries}). Retrying in {delay:.2f}s... Error: {err_msg[:100]}")
                        await asyncio.sleep(delay)
                    else:
                        logger.error(f"[OKA Service] Non-retryable error during generation: {e}")
                        return {"error": str(e)}
                
        results = await asyncio.gather(*(run_agent(t) for t in tasks), return_exceptions=True)
        
        all_questions = []
        for idx, res in enumerate(results):
            if isinstance(res, dict) and "error" not in res and res.get("answer") != "N/A":
                res["id"] = len(all_questions) + 1
                all_questions.append(res)
            else:
                logger.error(f"[OKA Service] Failed to generate a question: {res}")

        questions = all_questions
        
        # --- CRITICAL POST-PROCESSING ---
        # Ensure every question has a valid 'type' for the frontend to render
        processed_questions = []
        for q in questions:
            if not isinstance(q, dict): continue
            # Normalizing type field
            q_raw_type = (q.get("type") or q.get("questionType") or q.get("question_type") or "").lower().replace("_", "")
            
            # Canonical mapping to the 8 UI modes
            mapping = {
                "mcq": "mcq",
                "multiplechoice": "mcq",
                "true_false": "true_false",
                "truefalse": "true_false",
                "fill_in": "fill_in",
                "fillin": "fill_in",
                "cloze": "fill_in",
                "clozedeletion": "fill_in",
                "writing": "writing",
                "short_answer": "writing",
                "shortanswer": "writing",
                "matching": "matching",
                "matchingmatrix": "matching",
                "order": "order",
                "sequencing": "order",
                "sequencingsteps": "order",
                "debug": "debug",
                "diagnostic": "debug",
                "diagnosticerror": "debug",
                "synthesis": "synthesis",
                "socratic": "synthesis",
                "socraticsynthesis": "synthesis"
            }
            
            q["type"] = mapping.get(q_raw_type, "writing")
            
            # Structural hard-fixes
            if q["type"] == "true_false":
                # Ensure answer is boolean or string representation of boolean
                if isinstance(q.get("answer"), str):
                    q["answer"] = q["answer"].lower() == "true"
            
            if q["type"] == "fill_in" and not q.get("textWithBlanks"):
                q["type"] = "writing"
            if q["type"] == "matching" and not q.get("pairs"):
                q["type"] = "writing"
            if q["type"] == "order" and (not q.get("steps") or not q.get("answer")):
                q["type"] = "writing"
            if q["type"] == "debug" and not q.get("content"):
                q["type"] = "writing"
            
            # MCQ Option labeling
            if q["type"] == "mcq" and isinstance(q.get("options"), (list, dict)):
                options = q["options"]
                if isinstance(options, list):
                    q["options"] = {chr(65+i): v for i, v in enumerate(options)}
                elif isinstance(options, dict):
                    new_opts = {}
                    for i, (k, v) in enumerate(options.items()):
                        new_key = chr(65+i) if len(k) > 1 or k.isdigit() else k.upper()
                        new_opts[new_key] = v
                    q["options"] = new_opts

            processed_questions.append(q)
        
        questions = processed_questions
            
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        quiz_title = f"{hub['title']} - {config.difficulty} Session"
        quiz_filename = f"Practice_{timestamp}.md"
        quiz_path = practice_dir / quiz_filename
        
        # Create YAML frontmatter
        yaml_data = {
            "type": "practice",
            "hub_id": hub_id,
            "date": datetime.now().strftime('%Y-%m-%d'),
            "difficulty": config.difficulty,
            "question_types": list(distribution.keys()),
            "config": config.model_dump(),
            "score": None,
            "completed": False
        }
        yaml_frontmatter = f"---\n{yaml.dump(yaml_data, sort_keys=False)}---\n"
        
        # Create Readable Markdown
        md_content = f"# {quiz_title}\n\n"
        for idx, q in enumerate(questions, 1):
            # Resolve question text
            q_text = q.get('question', '')
            if not q_text and q.get('type') == 'writing':
                q_text = q.get('answer', 'Answer the following:')
            
            md_content += f"### Q{idx} [{q.get('type')}]: {q_text}\n"
            
            if q.get('type') == 'mcq' and q.get('options'):
                options = q.get('options')
                if isinstance(options, dict):
                    for k, v in options.items():
                        md_content += f"- **{k})** {v}\n"
                elif isinstance(options, list):
                    for i, v in enumerate(options):
                        label = chr(65 + i) # A, B, C...
                        md_content += f"- **{label})** {v}\n"
            elif q.get('type') == 'fill_in':
                md_content += f"\n{q.get('textWithBlanks', '')}\n"
            elif q.get('type') == 'debug':
                md_content += f"\n```\n{q.get('content', '')}\n```\n"
            elif q.get('type') == 'order' and q.get('steps'):
                for i, step in enumerate(q.get('steps')):
                    md_content += f"- [ ] {step}\n"
            elif q.get('type') == 'matching' and q.get('pairs'):
                lefts = [p.get('left') for p in q.get('pairs') if p.get('left')]
                rights = [p.get('right') for p in q.get('pairs') if p.get('right')]
                import random
                random.shuffle(rights)
                for left, right in zip(lefts, rights):
                    md_content += f"- {left}  <-->  {right}\n"
            elif q.get('type') == 'code':
                md_content += f"\n```\n{q.get('codeSnippet', '')}\n```\n"
            md_content += "\n***\n\n"
        
        md_content += "## Session Data\n"
        md_content += "```json\n"
        md_content += json.dumps(questions, indent=2)
        md_content += "\n```\n"

        with open(quiz_path, "w", encoding="utf-8") as f:
            f.write(yaml_frontmatter + md_content)

        OkaService._status[session_id] = "Completed"
        return {"session_id": session_id, "questions": questions, "quiz_path": str(quiz_path)}

    def find_best_hub_match(self, source_text: str) -> Optional[Dict[str, Any]]:
        """Robustly matches source text against existing planner hubs using course + keyword + unit weight."""
        hubs = self.list_planner_hubs()
        if not hubs: return None
        
        sample = source_text[:10000].lower()
        best_match = None
        highest_score = 0

        for hub in hubs:
            score = 0
            course_val = str(hub.get("course", "")).lower()
            hub_title = hub["title"].lower().replace("hub", "").strip()
            unit_val = str(hub.get("unit", ""))

            # 1. Course Match (MANDATORY or HIGH WEIGHT)
            # If the course name is found in the text, give it a massive boost
            if course_val and course_val in sample:
                score += 15
            
            # 2. Topic/Keyword Match
            keywords = [k for k in hub_title.split('_') if len(k) > 3]
            for k in keywords:
                if k.lower() in sample: score += 10
            
            # 3. Unit Match (Only if topic or course also partially matches)
            # This prevents matching "Unit 2" of Programming to "Unit 2" of Sociology
            if unit_val and (f"unit {unit_val}" in sample or f"chapter {unit_val}" in sample):
                if score > 0: # Only count unit if we have some course/topic overlap
                    score += 10
                else:
                    score += 2 # Low weight for unit-only match

            if score > highest_score:
                highest_score = score
                best_match = hub

        # Require a minimum threshold of 15 points to avoid weak matches
        return best_match if highest_score >= 15 else None

    # ── Phase 1: Detection ──────────────────────────────────────
    async def detect_curriculum(self, file_path: str) -> Dict[str, Any]:
        """Phase 1: Pure detection + AI-assisted metadata extraction if no hub match."""
        try:
            path = Path(file_path)
            content_text = ""
            
            if path.suffix.lower() == ".pdf":
                loader = PyPDFLoader(str(path))
                # Load first 10 pages for better context coverage
                pages = loader.load_and_split()
                content_text = "\n".join([p.page_content for p in pages[:10]])
            else:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content_text = f.read(20000)

            # Try to match an existing hub
            target_hub = self.find_best_hub_match(content_text)
            
            # If no hub match, or if it matched but course seems wrong, use AI to detect
            detected_curriculum = await self._detect_metadata_with_ai(content_text)
            
            # --- SMART VAULT AWARENESS ---
            # 1. If target_hub exists, trust its internal metadata above all else
            if target_hub:
                h_course = target_hub.get("course")
                h_semester = target_hub.get("semester")
                h_year = target_hub.get("year")
                
                if h_course: detected_curriculum["course"] = h_course
                if h_semester: detected_curriculum["semester"] = h_semester
                if h_year: detected_curriculum["year"] = h_year
                
                print(f"[OKA Service] Smart-Anchor: Inherited metadata from Hub '{target_hub['id']}' -> {detected_curriculum['course']} | {detected_curriculum['semester']}")

            # 2. If we have a course (from AI or Hub) but missing semester/year, look at the Course Master
            if detected_curriculum.get("course"):
                course_name = detected_curriculum["course"]
                # Handle wiki-links in course name
                clean_course_name = self.vm.super_clean(course_name)
                course_file = Path(self.secrets.vault_path) / "3-Database" / "07 - Courses" / f"{clean_course_name}.md"
                
                if course_file.exists():
                    try:
                        with open(course_file, "r", encoding="utf-8") as f:
                            c_data, _, c_err = self.vm.extract_yaml_and_content(f.read())
                            if not c_err:
                                # Update detected curriculum if vault has better info
                                v_semester = self._clean_prop(c_data.get("semester") or c_data.get("Semester"))
                                v_year = self._clean_prop(c_data.get("year") or c_data.get("Year"))
                                
                                if v_semester and (not detected_curriculum.get("semester") or detected_curriculum["semester"] == "Unknown"):
                                    detected_curriculum["semester"] = v_semester
                                if v_year and (not detected_curriculum.get("year") or detected_curriculum["year"] == "Unknown"):
                                    detected_curriculum["year"] = v_year
                                    
                                print(f"[OKA Service] Smart-Aware: Synced Course '{clean_course_name}' settings from Vault.")
                    except Exception as e:
                        print(f"[OKA Service] Recursive course lookup failed: {e}")

            # 3. Final Reconciliation: Ensure no 'Unknown' or empty values if we can help it
            if not detected_curriculum.get("semester") or detected_curriculum["semester"] == "Unknown":
                detected_curriculum["semester"] = "General"
            if not detected_curriculum.get("year") or detected_curriculum["year"] == "Unknown":
                detected_curriculum["year"] = "General"

            # 4. If no target_hub was found initially, synthesize one using the finalized smart metadata
            if not target_hub:
                dc = detected_curriculum
                hub_title = dc.get("hub_title", "").strip()
                unit_num = dc.get("unit", "").strip()
                course = dc.get("course", "").strip()
                semester = dc.get("semester", "").strip()
                year = dc.get("year", "").strip()
                
                if hub_title and hub_title.lower() not in ("unknown", ""):
                    # Build the canonical hub filename
                    clean_ht = hub_title.replace(" ", "_")
                    hub_filename = f"{unit_num}_{clean_ht}_Hub.md" if unit_num else f"{clean_ht}_Hub.md"
                    planner_path = self._get_planner_path()
                    planner_path.mkdir(parents=True, exist_ok=True)
                    hub_file_path = planner_path / hub_filename
                    
                    # Create stub hub in Study Planner if it doesn't already exist
                    if not hub_file_path.exists():
                        print(f"[OKA Service] Creating smart-synced stub hub: {hub_filename}")
                        stub_yaml = (
                            f"---\n"
                            f"title: {hub_filename[:-3]}\n"
                            f"type: Hub\n"
                            f"course: {course}\n"
                            f"semester: {semester}\n"
                            f"year: {year}\n"
                            f"unit: {unit_num}\n"
                            f"source: \n"
                            f"source_pages: []\n"
                            f"status: Not Started\n"
                            f"confidence: null\n"
                            f"study_date: null\n"
                            f"generated: false\n"
                            f"---\n\n"
                            f"# {hub_title}\n\n"
                            f"> Auto-created smart-synced stub by OKA.\n"
                        )
                        with open(hub_file_path, "w", encoding="utf-8") as f:
                            f.write(stub_yaml)
                    
                    target_hub = {
                        "id": hub_filename,
                        "title": f"{unit_num} {hub_title} Hub" if unit_num else f"{hub_title} Hub",
                        "path": str(hub_file_path.absolute()),
                        "course": course,
                        "unit": unit_num,
                        "semester": semester,
                        "year": year
                    }
                    print(f"[OKA Service] Anchored to smart-synced hub: {hub_filename}")

            return {
                "anchored_hub": target_hub,
                "detected_curriculum": detected_curriculum,
                "available_hubs": self.list_planner_hubs(),
                "available_options": self.list_available_options(),
                "status": "detected"
            }
        except Exception as e:
            err_trace = traceback.format_exc()
            print(f"[OKA Service] Detection failed: {e}\n{err_trace}")
            return {
                "status": "error",
                "message": f"Detection Failed: {str(e)}",
                "trace": err_trace
            }

    async def _detect_metadata_with_ai(self, text: str) -> Dict[str, str]:
        """Uses AI to extract course, semester, year, unit, and hub_title from text.
        
        Critically important: year, course and semester must match EXACT stems from the vault
        database files (07 - Courses / 08 - Semesters / 09 - Years). The AI is shown these exact names
        and instructed to pick the CLOSEST match. If nothing matches, it invents a new value.
        """
        options = self.list_available_options()
        
        # Build numbered option lists so AI can pick by index or name
        course_list = "\n".join(f"  {i+1}. \"{c}\"" for i, c in enumerate(options['courses']))
        semester_list = "\n".join(f"  {i+1}. \"{s}\"" for i, s in enumerate(options['semesters']))
        year_list = "\n".join(f"  {i+1}. \"{y}\"" for i, y in enumerate(options.get('years', [])))
        hub_list = "\n".join(f"  {i+1}. \"{h}\"" for i, h in enumerate(options.get('hubs', [])))
        
        prompt = (
            "You are a Senior Academic Librarian. Your task is to analyze the following document excerpt and categorize it into the most appropriate academic hierarchy.\n\n"
            "Extract these fields and return ONLY a JSON object:\n"
            "{\n"
            "  \"year\": \"<exact year name from the list below, or closest match>\",\n"
            "  \"course\": \"<exact course name from the list below, or closest match>\",\n"
            "  \"semester\": \"<exact semester name from the list below, or closest match>\",\n"
            "  \"unit\": \"<chapter or unit NUMBER only, e.g. '5'>\",\n"
            "  \"hub_title\": \"<concise subject title for this chapter, NO unit numbers, NO 'Hub'. Check AVAILABLE HUBS to match if it already exists>\",\n"
            "  \"primary_language\": \"<primary technical language, e.g. 'C++', 'Python', 'SQL', or 'General'>\"\n"
            "}\n\n"
            "AVAILABLE YEARS:\n"
            f"{year_list}\n\n"
            "AVAILABLE COURSES (pick the CLOSEST match based on subject matter):\n"
            f"{course_list}\n\n"
            "AVAILABLE SEMESTERS (pick the most recent/likely based on context):\n"
            f"{semester_list}\n\n"
            "AVAILABLE HUBS (use as inspiration or exact match for 'hub_title' if the topic perfectly aligns):\n"
            f"{hub_list}\n\n"
            "MATCHING RULES:\n"
            "- Use the EXACT string from the list above if it matches the subject matter.\n"
            "- CATEGORY: [CS/TECH] \u2192 If covers C++, arrays, OOP, memory, SQL, databases \u2192 likely 'Computer Programming' or 'Database Systems'.\n"
            "- CATEGORY: [SOCIAL/HUMANITIES] \u2192 If covers Inclusion, Diversity, Ethics, Social Justice, Education, Rights \u2192 DO NOT use a Tech course. Use a Social Science or Humanities course name.\n"
            "- CATEGORY: [MATH] \u2192 If covers logic, sets, graphs, proofs \u2192 likely 'Discrete Mathematics'.\n"
            "- If no course matches well, invent a descriptive new course name.\n"
            "- If the document text mentions 'Unit X' or 'Chapter X', extract that number for 'unit'.\n"
            "- For 'hub_title', extract the core topic (e.g., 'Modular Programming', 'Inclusive Education').\n"
            "CRITICAL: Be extremely careful not to put social science topics (Inclusion/Diversity) into Computer Programming.\n"
            "RETURN ONLY JSON. NO MARKDOWN. NO EXPLANATION.\n\n"
            f"DOCUMENT TEXT (first 20000 chars):\n{text[:20000]}"
        )
        
        try:
            res = await self.llm.ainvoke([HumanMessage(content=prompt)])
            clean_content = res.content.strip()
            if "```json" in clean_content:
                clean_content = re.search(r"```json\s*(.*?)\s*```", clean_content, re.DOTALL).group(1)
            elif "```" in clean_content:
                clean_content = re.search(r"```\s*(.*?)\s*```", clean_content, re.DOTALL).group(1)
            
            data = json.loads(clean_content)
            
            detected_year = str(data.get("year", "")).strip()
            detected_course = str(data.get("course", "")).strip()
            detected_semester = str(data.get("semester", "")).strip()
            
            # Post-process: snap to closest existing value if AI returned something slightly off
            def _snap_to_existing(detected: str, existing: list) -> str:
                if not detected or not existing: return detected
                # Exact match first
                if detected in existing: return detected
                # Case-insensitive match
                d_low = detected.lower()
                for e in existing:
                    if e.lower() == d_low: return e
                # Fuzzy match using difflib
                matches = difflib.get_close_matches(detected, existing, n=1, cutoff=0.6)
                if matches: return matches[0]
                # Substring match (fallback)
                for e in existing:
                    if d_low in e.lower() or e.lower() in d_low: return e
                # Return original if no match (it's a new value)
                return detected
            
            final_year = _snap_to_existing(detected_year, options.get('years', []))
            final_course = _snap_to_existing(detected_course, options['courses'])
            final_semester = _snap_to_existing(detected_semester, options['semesters'])
            
            print(f"[OKA Service] AI detected: year='{final_year}', course='{final_course}', semester='{final_semester}', unit='{data.get('unit')}', hub='{data.get('hub_title')}', language='{data.get('primary_language', 'General')}'")
            
            return {
                "year": final_year,
                "course": final_course,
                "semester": final_semester,
                "unit": data.get("unit"),
                "hub_title": data.get("hub_title"),
                "primary_language": data.get("primary_language", "General")
            }

        except Exception as e:
            print(f"[OKA Service] AI Metadata detection failed: {e}")
            return {"course": "", "semester": "", "unit": "", "hub_title": "", "primary_language": "General"}

    # ── Phase 2: Planning ──────────────────────────────────────
    async def generate_plan(
        self, file_path: str, system_instruction_path: str, curriculum: Dict[str, Any], target_hub_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Phase 2: AI Planning using LOCKED metadata from the user."""
        path = Path(file_path)
        session_id = str(path.absolute())
        
        # Clear any existing session
        OkaService._sessions.pop(session_id, None)
        
        # Read full content for planning
        full_text = ""
        if path.suffix.lower() == ".pdf":
            loader = PyPDFLoader(str(path))
            pages = loader.load_and_split()
            full_text = "\n".join([f"[PAGE {p.metadata.get('page', 0) + 1}]\n{p.page_content}" for p in pages])
        else:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()

        # Clean curriculum values
        def _strip_val(v: str) -> str:
            s = str(v).replace("[[", "").replace("]]", "").strip().strip("\"'").strip()
            if s.lower() in ("unknown", "unknown_course", "unknown_semester", ""): return ""
            return s
        
        unit_num = _strip_val(curriculum.get("unit", ""))
        course = _strip_val(curriculum.get("course", ""))
        semester = _strip_val(curriculum.get("semester", ""))
        hub_title = _strip_val(curriculum.get("hub_title", ""))

        # Self-Healing: Check for existing notes
        path_semester = semester or "General"
        path_course = self.vm.get_canonical_title(course or "General_Knowledge")
        unit_prefix = f"{unit_num}_" if unit_num else ""
        canonical_hub_base = self.vm.get_canonical_title(hub_title.replace(" Hub", ""))
        unit_folder_name = f"{unit_prefix}{canonical_hub_base}"
        unit_dir = self.vm.academic_root / path_semester / path_course / unit_folder_name
        
        existing_notes = []
        if unit_dir.exists():
            existing_notes = [f.stem for f in unit_dir.glob("*.md")]

        # Invoke Architect Agent
        OkaService._status[session_id] = "Architecting Sovereign Plan..."
        
        # Build prompt enrichment with metadata and healing info
        context_enrichment = (
            f"CURRICULUM LOCK:\n- Course: {course}\n- Semester: {semester}\n- Unit: {unit_num}\n- Hub: {hub_title}\n"
        )
        if existing_notes:
            context_enrichment += f"\nEXISTING NOTES (Do not re-plan): {', '.join(existing_notes)}\n"

        primary_language = curriculum.get("primary_language", "General")
        if course == "Computer Programming" and primary_language == "General":
            primary_language = "C++"
        
        # --- CHUNKING LOGIC ---
        chunk_size = 15000
        text_chunks = [full_text[i:i+chunk_size] for i in range(0, min(len(full_text), MAX_SOURCE_CHARS), chunk_size)]
        all_atomic_notes = []
        all_pq_notes = []
        seen_titles = set(existing_notes)
        
        for idx, chunk in enumerate(text_chunks):
            OkaService._status[session_id] = f"Architecting Plan (Chunk {idx+1}/{len(text_chunks)})..."
            print(f"[OKA Service] Processing chunk {idx+1}/{len(text_chunks)}")
            try:
                partial_plan = await self.architect_agent.generate_partial_plan(
                    f"{context_enrichment}\n\nSOURCE TEXT CHUNK:\n{chunk}"
                )
                
                if not partial_plan.atomic_notes:
                    print(f"[OKA Service] Chunk {idx+1} returned zero notes. Context might be irrelevant.")
                    continue

                # Merge notes, avoiding duplicates
                for note in partial_plan.atomic_notes:
                    if note.title not in seen_titles:
                        print(f"[OKA Service] Adding concept: {note.title} (Mode: {note.mode})")
                        all_atomic_notes.append(note.model_dump())
                        seen_titles.add(note.title)

                for pq in partial_plan.possible_questions:
                    if pq.title not in seen_titles:
                        print(f"[OKA Service] Adding PQ: {pq.title}")
                        all_pq_notes.append(pq.model_dump())
                        seen_titles.add(pq.title)
                        
                # Hard limit to avoid rate-limit death
                if len(all_atomic_notes) >= 25:
                    print("[OKA Service] Reached maximum atomic notes (25), stopping chunking.")
                    break
                    
            except Exception as e:
                err_trace = traceback.format_exc()
                print(f"[OKA Service] CRITICAL: Chunk {idx+1} failed validation: {e}\n{err_trace}")
                OkaService._status[session_id] = f"Load Failed during Architecting: {str(e)}"
                raise e

        # Deduplicate Plan
        try:
            from .post_processing import deduplicate_plan
            print(f"[OKA Service] Deduplicating {len(all_atomic_notes)} concepts...")
            all_atomic_notes = deduplicate_plan(all_atomic_notes)
        except Exception as e:
            print(f"[OKA Service] Deduplication failed: {e}")

        # Synthesize the Hub Note
        hub_base = hub_title.replace(" Hub", "").replace(" ", "_")
        # Prevent redundant prefixing (e.g. 5_5_Modular_Programming)
        if unit_num and (hub_base.startswith(f"{unit_num}_") or hub_base.startswith(f"{unit_num} ")):
            canonical_hub_title = f"{hub_base}_Hub"
            canonical_pq_title = f"{hub_base}_Possible_Questions"
        else:
            canonical_hub_title = f"{unit_num}_{hub_base}_Hub" if unit_num else f"{hub_base}_Hub"
            canonical_pq_title = f"{unit_num}_{hub_base}_Possible_Questions" if unit_num else f"{hub_base}_Possible_Questions"
        
        hub_note = {
            "title": canonical_hub_title,
            "description": f"Hub note for {course} - {hub_title}",
            "source_context": "Auto-generated Hub",
            "source_pages": []
        }

        # Removed Possible Questions note generation entirely per user request.
        # Socratic probes are already appended to the atomic notes.
        all_pq_notes = []
        
        structured_plan = {
            "course": course,
            "semester": semester,
            "unit": str(unit_num),
            "hub_title": hub_title,
            "primary_language": primary_language,
            "hub_note": hub_note,
            "atomic_notes": all_atomic_notes,
            "possible_questions": all_pq_notes
        }

        # Build batches (Phase 1: Atomic Generation, Phase 2: Probe Enrichment, Phase 3: Hub)
        all_atomic_titles = [n["title"] for n in structured_plan["atomic_notes"]]
        hub_title_final = structured_plan["hub_note"]["title"]
        
        structured_plan["notes"] = all_atomic_titles + [hub_title_final]
        
        sniped_batches = []
        next_id = 1
        
        # NEW PASS 1: COMPLETE ATOMIC NOTES (Note + Probes)
        for note in all_atomic_titles:
            sniped_batches.append({"id": next_id, "notes": [note], "type": "atomic"})
            next_id += 1
        
        for note in [n["title"] for n in structured_plan["possible_questions"]]:
            sniped_batches.append({"id": next_id, "notes": [note], "type": "pq"})
            next_id += 1
            
        # PASS 3: HUB (Source of Truth)
        sniped_batches.append({"id": next_id, "notes": [hub_title_final], "type": "hub"})
        
        structured_plan["batches"] = sniped_batches
        total_batches = len(sniped_batches)

        session_data = {
            "path": file_path,
            "metadata": structured_plan,
            "current_batch": 0,
            "total_batches": total_batches,
            "target_hub": next((h for h in self.list_planner_hubs() if h["id"] == target_hub_id), None) if target_hub_id else None,
            "messages": [] # We don't need to persist messages anymore if we use the Agent pattern
        }
        
        OkaService._sessions[session_id] = session_data
        self._persist_session(session_id, session_data)
        
        # Synthesize Legacy Raw Plan for UI visibility
        raw_plan = f"<hub_note>[[{hub_note['title']}]]</hub_note>\n"
        raw_plan += "<atomic_notes>\n"
        for note in all_atomic_notes:
            raw_plan += f"- [[{note['title']}]] (Mode {note['mode']}): {note['description']}\n"
        raw_plan += "</atomic_notes>"

        return {
            "session_id": session_id,
            "plan_raw": raw_plan,
            "plan_structured": structured_plan,
            "status": "awaiting_confirmation"
        }

    # ── Phase 2 (Legacy redirect) ──────────────────────────────────────
    async def process_file(self, file_path: str, system_instruction_path: str, target_hub_id: Optional[str] = None) -> Dict[str, Any]:
        return await self.detect_curriculum(file_path)

    # ── Phase 3: Batch Deployment ──────────────────────────────
    async def confirm_plan(
        self,
        session_id: str,
        command: str = "Confirm Final Plan & Proceed Batch 1",
        curriculum_override: Optional[Dict[str, Any]] = None,
        anchored_hub_id: Optional[str] = None
    ) -> Dict[str, Any]:
        session = await self._get_or_restore_session(session_id)
        if not session:
            raise ValueError(f"No active session found for {session_id}. Please restart the file process.")
        
        # Apply overrides if provided (usually on Batch 1)
        if curriculum_override:
            print(f"[OKA Service] Applying Curriculum Overrides & Syncing to Vault: {curriculum_override}")
            # Guard: only overwrite if the override value is non-empty
            if curriculum_override.get("course"):
                session["metadata"]["course"] = curriculum_override["course"]
            if curriculum_override.get("unit"):
                session["metadata"]["unit"] = curriculum_override["unit"]
            if curriculum_override.get("semester"):
                session["metadata"]["semester"] = curriculum_override["semester"]
            if curriculum_override.get("hub_title"):
                session["metadata"]["hub_title"] = curriculum_override["hub_title"]
            
            # Sync back to the anchored hub file if it exists
            hub_to_update = session.get("target_hub")
            if hub_to_update and hub_to_update.get("path"):
                hub_path = Path(hub_to_update["path"])
                if hub_path.exists():
                    try:
                        with open(hub_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        
                        meta, body, err = self.vm.extract_yaml_and_content(content)
                        if not err:
                            # Update properties as PLAIN TEXT (course/semester are text-type in Obsidian)
                            if curriculum_override.get("course"):
                                meta["course"] = curriculum_override['course']  # plain text
                            if curriculum_override.get("semester"):
                                meta["semester"] = curriculum_override['semester']  # plain text
                            if curriculum_override.get("unit"):
                                u = curriculum_override["unit"]
                                meta["unit"] = int(u) if str(u).isdigit() else u
                            
                            # Preserve lowercase keys strictly
                            for cap_key in ["Course", "Semester", "Unit"]:
                                meta.pop(cap_key, None)
                            
                            yaml_content = self.vm.dump_obsidian_yaml(meta)
                            full_content = f"---\n{yaml_content}\n---\n\n{body.strip()}\n"
                            self.vm.write_note(hub_path, full_content)
                            print(f"[OKA Service] Synchronized properties to {hub_path.name}")
                    except Exception as e:
                        print(f"[OKA Service] Hub sync failed: {e}")
        
        if anchored_hub_id:
            session["metadata"]["anchored_hub_id"] = anchored_hub_id
            session["target_hub"] = next((h for h in self.list_planner_hubs() if h["id"] == anchored_hub_id), None)
        elif session.get("metadata", {}).get("anchored_hub_id"):
            saved_id = session["metadata"]["anchored_hub_id"]
            session["target_hub"] = next((h for h in self.list_planner_hubs() if h["id"] == saved_id), None)
        
        # THIN CONTEXT PROTOCOL
        initial_messages = session["messages"][:2]
        plan_response = [m for m in session["messages"] if isinstance(m, AIMessage) and "# Knowledge Asset Plan" in m.content][:1]
        
        current_batch = session.get("current_batch", 0)
        total_batches = session.get("total_batches", 1)
        batch_number = current_batch + 1
        
        batch_notes = []
        batch_type = "atomic"
        if "batches" in session["metadata"]:
            for b in session["metadata"]["batches"]:
                if b.get("id") == batch_number:
                    batch_notes = b.get("notes", [])
                    batch_type = b.get("type", "atomic")
                    break
        
        notes_context = ", ".join([f"[[{n}]]" for n in batch_notes])

        deployment_results = []
        try:
            # Mandatory framing for ALL notes
            primary_language = session["metadata"].get("primary_language", "General")
            all_note_titles = [n["title"] for n in session["metadata"].get("atomic_notes", [])]
            all_concepts_list = ", ".join([f"[[{t}]]" for t in all_note_titles])
            plan_obj = SovereignPlan(**session["metadata"])
            
            if "all_note_probes" not in session:
                session["all_note_probes"] = {}

            async def run_single_batch(b_num, b_type, b_notes):
                nonlocal deployment_results
                local_results = []
                
                if b_type == "atomic":
                    # --- NEW AGENT-BASED ATOMIC GENERATION WITH VALIDATION LOOP ---
                    current_note_title = b_notes[0] if b_notes else ""
                    note_schema_dict = next((n for n in session["metadata"].get("atomic_notes", []) if n["title"] == current_note_title), None)
                    
                    if not note_schema_dict:
                        note_schema = AtomicNoteSchema(title=current_note_title, description="Generated concept", source_context="")
                    else:
                        note_schema = AtomicNoteSchema(**note_schema_dict)

                    if b_num > 1:
                        # Natural pacing break between notes
                        await asyncio.sleep(5.0)
                    final_output = ""
                    generation_attempts = 0
                    max_attempts = 2
                    
                    while generation_attempts < max_attempts:
                        generation_attempts += 1
                        phase_prefix = f"(Attempt {generation_attempts}/{max_attempts})" if generation_attempts > 1 else ""
                        OkaService._status[session_id] = f"{phase_prefix} Surgical Pass: [[{current_note_title}]] (1/2)..."

                        try:
                            # ── 3-PASS PIPELINE ──
                            domain = DOMAIN_MATRIX.get(note_schema.mode, DOMAIN_MATRIX["CS-SOFTWARE"])
                            theory_agent = TheoryAgent(self.llm_creative, domain)
                            practitioner_agent = PractitionerAgent(self.llm_creative, domain)
                            # examiner removed, dynamic QuestionAgents used
                            verifier_agent = VerifierAgent(self.llm_creative)
                            quiz_auditor_agent = QuizAuditorAgent(self.llm_creative)

                            # Pass 1: Theory
                            await self.governor.acquire(expected_tokens=3500)
                            theory = await theory_agent.generate(note_schema, note_schema.source_context or "No context", primary_language, all_concepts_list)
                            is_valid, errors = self.validator.validate_structure(theory + "\n```interactive-quiz\n[]\n```\n# 4. Artifact\n```text\n```\n## 5. Walkthrough\n1. \n2. \n3. \n4. \n5. ")
                            if "INSUFFICIENT_WIKILINKS" in str(errors):
                                await self.governor.acquire(expected_tokens=300)
                                diagnosis = await self.critic_agent.diagnose(theory, errors) if self.critic_agent else "Add more wikilinks."
                                await self.governor.acquire(expected_tokens=1000)
                                theory = await theory_agent.retry(note_schema, note_schema.source_context or "No context", primary_language, all_concepts_list, diagnosis)

                            note_content = NoteContent(markdown_body=theory, search_keywords=[])

                            OkaService._status[session_id] = f"{phase_prefix} Socratic Pass: [[{current_note_title}]] (2/3)..."
                            
                            # Pass 2: Practitioner
                            await self.governor.acquire(expected_tokens=3500)
                            practice = await practitioner_agent.generate(note_schema.title, theory, primary_language, note_schema.mode)

                            OkaService._status[session_id] = f"{phase_prefix} Examiner Pass: [[{current_note_title}]] (3/3)..."

                            # Pass 3: Examiner (Dedicated Dynamic Agents)
                            await self.governor.acquire(expected_tokens=3000)
                            theory_summary = theory[:1000] # denser summary for specialized questioning
                            
                            # Dynamic cognitive modes based on sub-agent matrix
                            q_modes = domain.get('question_modes', ['mcq', 'true_false', 'scenario'])
                            
                            # Algorithmic difficulty ramp
                            tasks = []
                            for i, qt in enumerate(q_modes):
                                # Difficulty ramps: first 2 are L1/L2, remaining are L2/L3
                                if i == 0: diff = "L1"
                                elif i == len(q_modes) - 1: diff = "L3"
                                else: diff = "L2"
                                
                                agent = QuestionAgent(self.llm_creative, qt)
                                tasks.append(agent.generate(note_schema.title, theory_summary, diff, domain.get('persona', 'Expert')))
                            
                            questions = await asyncio.gather(*tasks)
                            for i, q in enumerate(questions):
                                q["id"] = f"q{i+1}"
                                
                            quiz_json_str = json.dumps(questions, indent=2)

                            # Quiz Audit — inject diagnosis as hint for next retry (no inline retry to avoid broken JSON)
                            if generation_attempts < max_attempts:
                                audit_result = await quiz_auditor_agent.audit(note_schema.title, quiz_json_str, theory_summary)
                                if not audit_result["passed"]:
                                    print(f"[OKA Service] Quiz audit hint for '{current_note_title}': {audit_result['diagnosis']}")
                                    note_schema.source_context = (
                                        f"{note_schema.source_context or ''}\n\n"
                                        f"[QUIZ_HINT]: {audit_result['diagnosis']}"
                                    )
                            
                            probes = ProbeEnrichment(
                                worked_example=practice,
                                interactive_quiz=f"```interactive-quiz\n{quiz_json_str}\n```"
                            )
                            if probes:
                                session["all_note_probes"][note_schema.title] = probes

                            final_output = self._compile_atomic_note(
                                plan=plan_obj,
                                note_schema=note_schema,
                                note_content=note_content,
                                probes=probes,
                                session_path=session.get("path", "")
                            )

                            is_valid, struct_errors = self.validator.validate_structure(final_output)
                            is_last_attempt = generation_attempts >= max_attempts
                            if is_valid:
                                # Semantic verification gate — skip on last attempt to guarantee deployment
                                if not is_last_attempt:
                                    await self.governor.acquire(expected_tokens=2000)
                                    verification = await verifier_agent.verify(
                                        note_schema.title, note_schema.mode,
                                        final_output, note_schema.source_context or ""
                                    )
                                    if not verification["passed"]:
                                        fix_instructions = "; ".join(
                                            f.get("fix_instruction", "") for f in verification["failures"]
                                        )
                                        print(f"[OKA Service] Semantic hint for '{current_note_title}': {fix_instructions}")
                                        note_schema.source_context = (
                                            f"{note_schema.source_context or ''}\n\n"
                                            f"[SEMANTIC_HINT]: {fix_instructions}"
                                        )
                                        is_valid = False
                                        struct_errors = [f"SEMANTIC: {fix_instructions}"]
                            if is_valid or is_last_attempt:
                                # Check for unrecoverable HARD_FAILURE content — never deploy these
                                has_hard_failure = any(
                                    marker in final_output
                                    for marker in ["Error generating question.", "Error generating content", "Error extracting"]
                                )
                                if is_last_attempt and has_hard_failure:
                                    import logging
                                    logging.getLogger("LifeOS").error(
                                        f"[OKA Service] Dropping '{current_note_title}' — HARD_FAILURE_MARKER found in final output. "
                                        "Note contains broken quiz or error content and will not be deployed."
                                    )
                                    break
                                # Deploy — either clean pass or last-chance force-deploy
                                if is_last_attempt and not is_valid and final_output:
                                    print(f"[OKA Service] Force-deploying '{current_note_title}' on last attempt despite structural issues: {struct_errors}")
                                local_results = self.deployer.deploy_atomic_notes(
                                    session_id, [current_note_title], [final_output], plan_obj, session.get("path", "")
                                )
                                # Per-note gutter enforcement
                                if local_results:
                                    try:
                                        from .post_processing import enforce_gutter
                                        _note_abs = self.deployer.vm.vault_path / local_results[0]["path"]
                                        if _note_abs.parent.exists():
                                            enforce_gutter(_note_abs.parent)
                                    except Exception as _ge:
                                        print(f"[OKA Service] Per-note gutter fix failed: {_ge}")
                                break
                            else:
                                print(f"[OKA Service] Validation errors on '{current_note_title}': {struct_errors}")
                                note_schema.source_context = (
                                    f"{note_schema.source_context or ''}\n\n"
                                    f"[REGENERATION_HINT]: VALIDATION FAILED: {', '.join(struct_errors)}"
                                )
                        except Exception as e:
                            err_str = str(e)
                            # Pause on rate limit — persist progress and surface to caller
                            if "429" in err_str or "rate_limit" in err_str.lower():
                                OkaService._rate_limited[session_id] = time.time()
                                self._persist_session(session_id, session)
                                OkaService._status[session_id] = (
                                    f"Rate limited at note '{current_note_title}'. "
                                    "Progress saved. Resume when limit clears or swap API key."
                                )
                                return {
                                    "status": "rate_limited",
                                    "message": (
                                        f"Rate limit hit at note '{current_note_title}' "
                                        f"(batch {batch_number}/{total_batches}). "
                                        "Progress has been saved. Call resume_paused_session() to continue."
                                    ),
                                    "session_id": session_id,
                                    "current_batch": session.get("current_batch", 0),
                                    "total_batches": total_batches,
                                    "results": deployment_results,
                                }
                            if generation_attempts >= max_attempts:
                                import logging
                                logging.getLogger("LifeOS").error(f"[OKA Service] Max attempts reached due to error for '{current_note_title}'. Dropping note. Error: {e}")
                                break
                            await asyncio.sleep(5)
                    
                elif b_type == "pq":
                    current_note_title = b_notes[0]
                    note_schema_raw = next((n for n in session["metadata"].get("possible_questions", []) if n["title"] == current_note_title), None)
                    if not note_schema_raw: raise ValueError(f"PQ {current_note_title} not found in plan.")
                    
                    from .schemas import NoteSchema
                    note_schema = NoteSchema(**note_schema_raw)
                    OkaService._status[session_id] = f"Synthesizing Master Question Bank: [[{current_note_title}]]..."
                    
                    all_note_probes = session.get("all_note_probes", {})
                    pq_output = self._compile_pq_note(
                        plan=plan_obj,
                        note_schema=note_schema,
                        note_content=NoteContent(markdown_body="Aggregated question bank.", search_keywords=[]),
                        all_note_probes=all_note_probes,
                        session_path=session.get("path", "")
                    )
                    local_results = self.deployer.deploy_atomic_notes(session_id, [current_note_title], [pq_output], plan_obj, session.get("path", ""))

                elif b_type == "hub":
                    OkaService._status[session_id] = "Compiling Unit Mastery Hub..."
                    ai_output = self._compile_hub_note(plan_obj, session_path=session.get("path", ""))
                    
                    if self.hub_agent:
                        hub_retry = 0
                        hub_success = False
                        while hub_retry < 5 and not hub_success:
                            try:
                                await self.governor.acquire(expected_tokens=1000)
                                descriptions = [n.get("description", "") for n in session["metadata"]["atomic_notes"]]
                                ai_output = await self.hub_agent.generate_hub(plan_obj.hub_title, descriptions, ai_output)
                                hub_success = True
                            except Exception as e:
                                hub_retry += 1
                                err_msg = str(e).lower()
                                if "429" in err_msg or "rate limit" in err_msg or "rate_limit" in err_msg:
                                    import logging
                                    logging.getLogger("LifeOS").warning(f"[OKA Service] Hub generation rate limited. Attempt {hub_retry}/5. Sleeping 60s...")
                                    await asyncio.sleep(60)
                                else:
                                    logging.getLogger("LifeOS").error(f"[OKA Service] Hub generation failed (Attempt {hub_retry}/5): {e}")
                                    await asyncio.sleep(10)
                        
                        if not hub_success:
                            raise ValueError(f"Hub generation exhausted all retries for session {session_id}")
                        
                    local_results = self.deployer.deploy_hub_note(session_id, ai_output, plan_obj, session.get("path", ""))
                    
                    # ── POST-PROCESSING (Scripts) ──
                    try:
                        from .post_processing import (
                            canonicalize_unit, infer_unit_prerequisites, enforce_gutter,
                            audit_walkthroughs, audit_intra_links, sync_hub_connections
                        )
                        # Resolve hub file (may be the anchored Study Planner hub)
                        relative_path = local_results[0]["path"]
                        hub_file = self.deployer.vm.vault_path / relative_path

                        # Resolve unit directory using the SAME logic as VaultManager.get_note_path
                        # Data lives in session["metadata"], NOT session["curriculum"]
                        meta = session.get("metadata", {})
                        _semester = (meta.get("semester") or "General").strip()
                        _course_raw = (meta.get("course") or "General_Knowledge").strip()
                        _unit_str = str(meta.get("unit") or "").strip()
                        _hub_t_raw = (meta.get("hub_title") or "").strip()

                        _clean_course = self.deployer.vm.get_canonical_title(
                            self.deployer.vm.super_clean(_course_raw)
                        ) or "General_Knowledge"
                        _hub_clean_base = self.deployer.vm.get_canonical_title(
                            self.deployer.vm.super_clean(_hub_t_raw)
                        )
                        _unit_prefix = f"{_unit_str}_" if _unit_str else ""
                        _unit_folder = f"{_unit_prefix}{_hub_clean_base}" if _hub_clean_base else (_unit_str or "General")

                        unit_dir = self.deployer.vm.academic_root / _semester / _clean_course / _unit_folder

                        if unit_dir.exists():
                            canonicalize_unit(unit_dir)
                            infer_unit_prerequisites(unit_dir)
                            enforce_gutter(unit_dir)
                            audit_walkthroughs(unit_dir)
                            audit_intra_links(unit_dir)
                            if hub_file.exists():
                                sync_hub_connections(hub_file, unit_dir)
                            OkaService._status[session_id] = "Post-Processing Complete"
                        else:
                            print(f"[OKA Service] Post-processing skipped: unit dir not found: {unit_dir}")
                    except Exception as pp_e:
                        print(f"[OKA Service] Post-processing failed: {pp_e}")

                deployment_results.extend(local_results)
                session["current_batch"] = b_num
                self._persist_session(session_id, session)
                return b_num < total_batches

            # ── EXECUTION ──
            has_more = await run_single_batch(batch_number, batch_type, batch_notes)

            if isinstance(has_more, dict) and has_more.get("status") == "rate_limited":
                return has_more

            if not has_more:
                OkaService._sessions.pop(session_id, None)
                OkaService._status[session_id] = "Deployment Complete"
            else:
                OkaService._status[session_id] = f"Awaiting Batch {session['current_batch'] + 1}"

            return {
                "results": deployment_results,
                "count": len(deployment_results),
                "has_more": has_more,
                "current_batch": session.get("current_batch", batch_number),
                "total_batches": total_batches,
                "status": "success"
            }
        except Exception as e:
            err_trace = traceback.format_exc()
            error_msg = self._format_user_error(e)
            print(f"[OKA Service] Execution failed: {e}\n{err_trace}")
            OkaService._status[session_id] = f"Architecture Load Failed: {error_msg}"
            return {
                "status": "error",
                "detail": str(e),
                "trace": err_trace,
                "message": error_msg
            }
            raise ValueError(error_msg)

    def _compile_atomic_note(
        self, plan: SovereignPlan, note_schema: AtomicNoteSchema,
        note_content: NoteContent, probes: Optional[ProbeEnrichment] = None, session_path: str = ""
    ) -> str:
        """
        [DETERMINISTIC COMPILER v25.5]
        Constructs the Sovereign note with interleaved Socratic Probes.
        """
        from .validator import OkaValidator
        # Build Absolute Archive Source Link
        if session_path:
            clean_filename = Path(session_path).name.replace(" ", "_")
            _sem = (plan.semester or "General").strip()
            _crs = self.vm.get_canonical_title(plan.course or "General_Knowledge")
            source_link = f"[[5-Pdf Store/note generated/{_sem}/{_crs}/{clean_filename}]]"
        else:
            source_link = f"[[{plan.hub_note.title}]]"

        # Sanitise prerequisites — spaces inside [[...]] break Obsidian resolution
        clean_prereqs = []
        if note_schema.prerequisites:
            clean_prereqs = OkaValidator.sanitize_prerequisites(note_schema.prerequisites)

        metadata = {
            "title": note_schema.title,
            "type": "Atomic Note",
            "course": plan.course,
            "semester": plan.semester,
            "unit": str(plan.unit),
            "hub": f"[[{plan.hub_note.title}]]",
            "source": source_link,
            "source_pages": note_schema.source_pages or [],
            "mode": note_schema.mode,
            "read": False,
            "generated": True,
        }

        if clean_prereqs:
            metadata["prerequisites"] = clean_prereqs

        yaml_frontmatter = self.vm.dump_obsidian_yaml(metadata)

        probe_body = ""
        if probes:
            probe_body = (
                "\n"
                f"{probes.worked_example.strip()}\n\n"
                "---\n\n"
                "## 6. The Proving Grounds\n\n"
                f"{probes.interactive_quiz.strip()}\n"
            )

        full_body = note_content.markdown_body.strip() + probe_body
        return f"---\n{yaml_frontmatter}---\n\n{full_body}\n"

    def _compile_pq_note(self, plan: SovereignPlan, note_schema: NoteSchema, note_content: NoteContent, all_note_probes: Dict[str, ProbeEnrichment], session_path: str = "") -> str:
        """
        [DETERMINISTIC COMPILER v21.5]
        Constructs a comprehensive Possible Questions note with coverage for ALL atomic notes.
        """
        # Build Absolute Archive Source Link
        if session_path:
            clean_filename = Path(session_path).name.replace(" ", "_")
            _sem = (plan.semester or "General").strip()
            _crs = self.vm.get_canonical_title(plan.course or "General_Knowledge")
            source_link = f"[[5-Pdf Store/note generated/{_sem}/{_crs}/{clean_filename}]]"
        else:
            source_link = f"[[{plan.hub_note.title}]]"

        metadata = {
            "title": note_schema.title,
            "type": "Possible Questions",
            "course": plan.course,
            "semester": plan.semester,
            "unit": plan.unit,
            "hub": f"[[{plan.hub_note.title}]]",
            "source": source_link,
            "mode": "SOCRATIC",
            "generated": True
        }
        
        yaml_frontmatter = self.vm.dump_obsidian_yaml(metadata)

        # Build comprehensive question body
        body_parts = [
            f"# {note_schema.title.replace('_', ' ')}\n",
            "> [!ABSTRACT] Exam Readiness Protocol\n> This note aggregates retrieval probes from all atomic nodes in this unit to ensure total coverage.\n",
            "## Master Question Bank\n"
        ]

        for note_title, probes in all_note_probes.items():
            clean_title = note_title.replace("_", " ")
            body_parts.append(
                f"### [[{note_title}|{clean_title}]]\n"
                f"**Artifact & Walkthrough**:\n\n{probes.worked_example}\n\n"
                f"**The Proving Grounds**:\n\n{probes.interactive_quiz.strip()}\n"
            )

        full_body = "\n".join(body_parts)
        return f"---\n{yaml_frontmatter}---\n\n{full_body}\n"

    def _compile_hub_note(self, plan: SovereignPlan, session_path: str = "") -> str:
        """
        [DETERMINISTIC COMPILER]
        Constructs the Unit Hub.
        """
        # Build Absolute Archive Source Link
        if session_path:
            clean_filename = Path(session_path).name.replace(" ", "_")
            _sem = (plan.semester or "General").strip()
            _crs = self.vm.get_canonical_title(plan.course or "General_Knowledge")
            source_link = f"[[5-Pdf Store/note generated/{_sem}/{_crs}/{clean_filename}]]"
        else:
            source_link = f"[[{plan.hub_note.title}]]"

        metadata = {
            "title": plan.hub_note.title,
            "type": "Hub",
            "course": plan.course,
            "semester": plan.semester,
            "unit": str(plan.unit),
            "source": source_link,
            "source_pages": [],
            "status": "Not Started",
            "confidence": None,
            "study_date": None,
            "generated": True,
            # mode is intentionally excluded from Hub notes
        }
        
        yaml_frontmatter = self.vm.dump_obsidian_yaml(metadata)

        # Build Markdown Body
        body = f"# {plan.hub_note.title.replace('_', ' ')}\n\n"
        body += "## Overview\n"
        body += f"{plan.hub_note.description}\n\n"
        
        body += "## Unit Objectives\n"
        body += "- [ ] Master all core technical definitions.\n"
        body += "- [ ] Internalize the mental models for each concept.\n"
        body += "- [ ] Trace and understand every worked example.\n"
        body += "- [ ] Complete all Socratic Probes and verify with the Answer Key.\n\n"
        
        body += "## Connections\n"
        
        # Build tree structure using prerequisites if available
        tree = {}
        for note in plan.atomic_notes:
            tree[note.title] = {"note": note, "children": []}
            
        roots = []
        for note in plan.atomic_notes:
            parent_found = False
            if hasattr(note, 'prerequisites') and note.prerequisites:
                for prereq in note.prerequisites:
                    for potential_parent in tree:
                        # Avoid self-referencing
                        if potential_parent == note.title: continue
                        if prereq.lower() in potential_parent.lower() or potential_parent.lower() in prereq.lower():
                            tree[potential_parent]["children"].append(note.title)
                            parent_found = True
                            break
                    if parent_found: break
            if not parent_found:
                roots.append(note.title)
                
        def render_node(title, indent_level=0, visited=None):
            if visited is None: visited = set()
            if title in visited: return ""
            visited.add(title)
            
            node_data = tree[title]
            canonical = self.vm.get_canonical_title(title)
            # Cap the depth to 3 levels (0, 1, 2)
            actual_indent = min(indent_level, 2)
            indent = "    " * actual_indent
            res = f"{indent}- [ ] [[{canonical}]]\n"
            for child in node_data["children"]:
                res += render_node(child, indent_level + 1, visited.copy())
            return res
            
        for root in roots:
            body += render_node(root)
            
        return f"---\n{yaml_frontmatter}---\n\n{body}\n"

    def _audit_hub_consistency(self, hub_content: str, planned_notes: List[str], session_metadata: Dict[str, Any]) -> Tuple[bool, str]:
        """Verifies that every note in the plan is present as a [[Wikilink]] in the Hub."""
        missing = []
        unit_num = str(session_metadata.get("unit", "")).replace("Unknown", "").strip()
        
        # Clean the hub_content to avoid accidental matches in YAML
        _, body, _ = self.vm.extract_yaml_and_content(hub_content)
        search_target = body or hub_content

        for note in planned_notes:
            # 1. Direct match as planned
            if f"[[{note}]]" in search_target: continue
            
            # 2. Canonicalized match (no unit)
            canonical = self.vm.get_canonical_title(note)
            if f"[[{canonical}]]" in search_target: continue
            
            # 3. Academic Prefixed match (Unit_Title)
            if unit_num:
                prefixed = f"{unit_num}_{canonical}"
                if f"[[{prefixed}]]" in search_target: continue

            # 4. Mastery Hub check
            if "hub" in note.lower() or "hub" in canonical.lower():
                 if f"[[{unit_num}_{canonical}_Hub]]" in search_target: continue
                 if f"[[{canonical}_Hub]]" in search_target: continue
            
            # 5. PQ check
            if "questions" in note.lower() or "questions" in canonical.lower():
                 if f"[[{unit_num}_{canonical}_Possible_Questions]]" in search_target: continue
                 if f"[[{canonical}_Possible_Questions]]" in search_target: continue

            missing.append(note)
        
        if missing:
            return False, f"The following notes from the plan are MISSING from the Connections tree: {', '.join(missing)}"
        return True, "Consistency verified."
