import re
import json
import os
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
from .agents import ArchitectAgent, WriterAgent
from .schemas import SovereignPlan, AtomicNoteSchema, NoteContent, NoteSchema, ProbeEnrichment
import ruamel.yaml

# OKA-specific constants
OKA_TIMEOUT = 600       # 10 minutes — headroom for large PDFs
OKA_MAX_RETRIES = 10     # Retry on transient failures (524, timeout, rate-limit)
OKA_RETRY_BACKOFF = 15  # Seconds between retries (doubles each attempt)
MAX_SOURCE_CHARS = 200_000  # SI is now ~3.5K tokens, so we can afford much more source text


class OkaService:
    """
    Main orchestrator for OKA.
    """
    _sessions: Dict[str, Dict[str, Any]] = {}
    _status: Dict[str, str] = {}  # Global status map
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
        
        self.writer_agent = WriterAgent(llm=self.llm_creative) if self.llm_creative else None
        
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
            except: pass
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
                print(f"[OKA Service] AI Attempt {attempt} failed: {error_str}")
                
                # Check for transient errors
                is_transient = any(code in error_str for code in ["429", "503", "524", "timeout", "overloaded"])
                
                if is_transient and attempt < OKA_MAX_RETRIES:
                    backoff = OKA_RETRY_BACKOFF * (2 ** (attempt - 1))
                    wait_msg = (
                        f"Transient error ({self._classify_error(error_str)}). "
                        f"Retrying in {backoff}s (attempt {attempt}/{OKA_MAX_RETRIES})..."
                    )
                    OkaService._status[session_id] = wait_msg
                    await asyncio.sleep(backoff)
                else:
                    break
        
        raise last_error

    def _classify_error(self, error_str: str) -> str:
        if "429" in error_str: return "Rate Limited (429)"
        if "503" in error_str or "overloaded" in error_str.lower(): return "Server Overloaded (503)"
        if "524" in error_str or "timeout" in error_str.lower(): return "Gateway Timeout"
        return "Connection Error"

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
        """Returns all available options for Course, Semester, and Units from the vault."""
        base_path = Path(self.secrets.vault_path) / "3-Database"
        
        courses = [f.stem for f in (base_path / "07 - Courses").glob("*.md") if not f.name.startswith("_")]
        semesters = [f.stem for f in (base_path / "08 - Semesters").glob("*.md") if not f.name.startswith("_")]
        units = [f.stem for f in (base_path / "06 - Study Planner" / "_Units").glob("*.md")]
        
        # Sort units numerically if possible
        try: units.sort(key=lambda x: int(x))
        except: units.sort()

        return {
            "courses": courses,
            "semesters": semesters,
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
        """Resolves the academic unit directory for a given hub."""
        hub_path = Path(hub["path"])
        semester = hub.get("semester", "General")
        course = hub.get("course", "General_Knowledge")
        unit_num = hub.get("unit", "")
        
        # We must clean the title to remove "Hub" or "Possible Questions" before canonicalizing
        clean_hub_base = self.vm.super_clean(hub["title"])
        canonical_hub = self.vm.get_canonical_title(clean_hub_base)
        unit_prefix = f"{unit_num}_" if unit_num else ""
        unit_folder_name = f"{unit_prefix}{canonical_hub}"
        
        academic_unit_dir = self.vm.academic_root / semester / self.vm.get_canonical_title(course) / unit_folder_name
        return academic_unit_dir if academic_unit_dir.exists() else hub_path.parent

    def list_atomic_notes(self, hub_id: str) -> List[Dict[str, Any]]:
        """Lists atomic notes linked to a specific hub.
        PRIORITY: Extracts ordered links from the 'Connections' or 'Core Topologies' section.
        FALLBACK: Scans the unit directory for all markdown files.
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
                        
                        if ordered_notes:
                            return ordered_notes
            except Exception as e:
                print(f"[OKA Service] Connection extraction failed: {e}")

        # 2. Fallback: Alpha-sorted directory listing
        notes = []
        if unit_dir.exists():
            for file in unit_dir.glob("*.md"):
                if file.name.endswith("_Hub.md") or "Possible_Questions" in file.name or "Practice" in file.name or file.name.startswith("_"):
                    continue
                if file.name == hub_path.name:
                    continue
                notes.append({
                    "id": file.stem,
                    "title": file.stem.replace("_", " "),
                    "path": str(file.absolute())
                })
        return sorted(notes, key=lambda x: x["title"])

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
        context_parts = []
        
        # Filter files based on config
        atomic_notes = list(unit_dir.glob("*.md"))
        selected_notes = config.selectedAtomicNotes
        
        # Read Hub content only if NO specific notes are selected (full hub mode)
        if not selected_notes:
            with open(hub_path, "r", encoding="utf-8") as f:
                context_parts.append(f"## Hub Note: {hub['title']}\n{f.read()}")

        for note_path in atomic_notes:
            if note_path.name == hub_path.name or "Possible_Questions" in note_path.name or "Practice" in note_path.name or note_path.name.startswith("_"):
                continue
            
                
            # Apply selection filter
            if selected_notes and note_path.stem not in selected_notes:
                continue

            # Apply time bound
            if config.timeBoundDays:
                mtime = os.path.getmtime(note_path)
                if (time.time() - mtime) > (config.timeBoundDays * 86400):
                    continue

            with open(note_path, "r", encoding="utf-8") as f:
                context_parts.append(f"### Atomic Note: {note_path.stem}\n{f.read()}")
                
        # 2. Add Possible Questions only if no specific notes are selected (full unit mode)
        # This prevents the AI from pulling questions from the whole unit when only 1 note is selected.
        if not selected_notes:
            pq_file = next(unit_dir.glob("*_Possible_Questions.md"), None)
            if pq_file:
                with open(pq_file, "r", encoding="utf-8") as f:
                    context_parts.append(f"## Reference Questions\n{f.read()}")
        
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

        prompt = (
            "### [GROUND TRUTH SOURCE MATERIAL]\n"
            f"{full_context[:MAX_SOURCE_CHARS]}\n"
            "### [END OF SOURCE MATERIAL]\n\n"
            
            "SYSTEM PROTOCOL: You are OKA, the Sovereign Pedagogical Architect. "
            "You are operating in a HARD AIR-GAPPED ENVIRONMENT. You have NO access to the internet or internal training data. "
            "The material above is the ONLY reality. Everything else (including this prompt's metadata) is invisible to you.\n\n"
            
            "TARGET PROFILE:\n"
            f"- Total Questions: {total_q}\n"
            f"- Question Types: {dist_str}\n"
            f"- Difficulty: {config.difficulty}\n"
            f"- Entropy Seed: {session_id}\n\n"
            
            "STRICT OPERATIONAL RULES:\n"
            "1. SOLE SOURCE ADHERENCE: Generate questions EXCLUSIVELY from the [GROUND TRUTH SOURCE MATERIAL]. If a concept is not in the text, it does not exist.\n"
            "2. ANTI-SYSTEM HALLUCINATION: DO NOT ask questions about the generation process, the target profile, or any meta-information from this prompt.\n"
            "3. ALLOWED MODALITIES (Strict JSON structures):\n"
            "   - 'mcq': `options` (A,B,C,D) and `answer` (Key only).\n"
            "   - 'true_false': `answer` (Boolean).\n"
            "   - 'fill_in': `textWithBlanks` (with [[blank]] markers) and `answer` (List of strings).\n"
            "   - 'writing': `answer` (String).\n"
            "   - 'matching': `pairs` (List of objects with `left` and `right` keys).\n"
            "   - 'order': `steps` (List of strings in random order) and `answer` (List of strings in CORRECT order).\n"
            "   - 'debug': `content` (buggy code/logic) and `answer` (fix).\n"
            "   - 'synthesis': High-order synthesis questioning.\n"
            "4. DISTRIBUTION ADHERENCE (CRITICAL): You MUST generate exactly the count requested for each modality in the TARGET PROFILE. If the user asks for 'matching', 'order', or 'debug', you MUST provide them. DO NOT default to 'mcq'. Defaulting to MCQ when other types are requested is a PROTOCOL FAILURE.\n"
            "5. SOURCE QUOTES: Every `explanation` MUST contain a direct 'Quote' from the source material.\n"
            "6. NO TOPIC BLEED: Stay 100% within the scope of the selected notes.\n\n"
            "EXECUTION: Generate the session now. Follow the distribution strictly."
        )
        
        # 3. Invoke LLM with Structured Output logic
        OkaService._status[session_id] = "Architecting Advanced Session..."
        
        try:
            # We attempt to use the model's structured output capability if available
            # Otherwise we fallback to raw prompt + parsing
            try:
                from .schemas import PracticeBatch
                structured_llm = self.planner_llm.with_structured_output(PracticeBatch)
                batch = await structured_llm.ainvoke(prompt)
                questions = [q.model_dump() for q in batch.questions]
            except Exception as e:
                res = await self.planner_llm.ainvoke([HumanMessage(content=prompt + "\n\nRETURN ONLY A JSON OBJECT with a 'questions' key containing the list of questions.")])
                content = res.content.strip()
                if "```json" in content:
                    match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
                    content = match.group(1) if match else content
                elif "```" in content:
                    match = re.search(r"```\s*(.*?)\s*```", content, re.DOTALL)
                    content = match.group(1) if match else content
                
                data = json.loads(content)
                if isinstance(data, dict) and "questions" in data:
                    questions = data["questions"]
                elif isinstance(data, list):
                    questions = data
                else:
                    questions = []
                    logger.error(f"[OKA Service] Unexpected JSON structure for practice: {type(data)}")

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
                md_content += f"### Q{idx} [{q.get('type')}]: {q.get('question', '')}\n"
                if q.get('type') == 'mcq' and q.get('options'):
                    options = q.get('options')
                    if isinstance(options, dict):
                        for k, v in options.items():
                            md_content += f"- **{k})** {v}\n"
                    elif isinstance(options, list):
                        for i, v in enumerate(options):
                            label = chr(65 + i) # A, B, C...
                            md_content += f"- **{label})** {v}\n"
                elif q.get('type') == 'code':
                    md_content += f"```\n{q.get('codeSnippet', '')}\n```\n"
                md_content += "\n***\n\n"
            
            md_content += "## Session Data\n"
            md_content += "```json\n"
            md_content += json.dumps(questions, indent=2)
            md_content += "\n```\n"

            with open(quiz_path, "w", encoding="utf-8") as f:
                f.write(yaml_frontmatter + md_content)

            OkaService._status[session_id] = "Completed"
            return {"session_id": session_id, "questions": questions, "quiz_path": str(quiz_path)}
        except Exception as e:
            OkaService._status[session_id] = f"Error: {str(e)}"
            traceback.print_exc()
            raise e

    def find_best_hub_match(self, source_text: str) -> Optional[Dict[str, Any]]:
        """Robustly matches source text against existing planner hubs using content-based keyword matching."""
        hubs = self.list_planner_hubs()
        if not hubs: return None
        
        sample = source_text[:5000].lower()
        best_match = None
        highest_score = 0

        for hub in hubs:
            score = 0
            # 1. Direct Unit Match (High Weight)
            unit_val = str(hub.get("unit", ""))
            if unit_val and (f"unit {unit_val}" in sample or f"chapter {unit_val}" in sample):
                score += 10
            
            # 2. Title Keyword Match (Medium Weight)
            title_clean = hub["title"].lower().replace("hub", "").strip()
            keywords = [k for k in title_clean.split() if len(k) > 3]
            for k in keywords:
                if k in sample: score += 5
            
            # 3. Course Match
            course_val = str(hub.get("course", ""))
            if course_val.lower() in sample: score += 5

            if score > highest_score:
                highest_score = score
                best_match = hub

        return best_match if highest_score >= 5 else None

    # ── Phase 1: Detection ──────────────────────────────────────
    async def detect_curriculum(self, file_path: str) -> Dict[str, Any]:
        """Phase 1: Pure detection + AI-assisted metadata extraction if no hub match."""
        try:
            path = Path(file_path)
            content_text = ""
            
            if path.suffix.lower() == ".pdf":
                loader = PyPDFLoader(str(path))
                pages = loader.load_and_split()
                content_text = "\n".join([p.page_content for p in pages[:5]]) # Scan slightly more for detection
            else:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content_text = f.read(10000)

            target_hub = self.find_best_hub_match(content_text)
            
            # If no hub match, use AI to detect curriculum metadata
            detected_curriculum = None
            if not target_hub:
                print(f"[OKA Service] No Hub match for {path.name}. Invoking AI detection...")
                detected_curriculum = await self._detect_metadata_with_ai(content_text[:20000])

            # CRITICAL FIX: If we have AI-detected metadata but no matching hub,
            # synthesize a virtual anchored_hub so the frontend pre-fills correctly.
            # This tells the UI exactly what to show — but also creates a stub hub if the 
            # hub_title detected is meaningful (i.e., not empty/unknown).
            if not target_hub and detected_curriculum:
                dc = detected_curriculum
                hub_title = dc.get("hub_title", "").strip()
                unit_num = dc.get("unit", "").strip()
                course = dc.get("course", "").strip()
                semester = dc.get("semester", "").strip()
                
                if hub_title and hub_title.lower() not in ("unknown", ""):
                    # Build the canonical hub filename
                    clean_ht = hub_title.replace(" ", "_")
                    hub_filename = f"{unit_num}_{clean_ht}_Hub.md" if unit_num else f"{clean_ht}_Hub.md"
                    planner_path = self._get_planner_path()
                    planner_path.mkdir(parents=True, exist_ok=True)
                    hub_file_path = planner_path / hub_filename
                    
                    # Create stub hub in Study Planner if it doesn't already exist
                    if not hub_file_path.exists():
                        print(f"[OKA Service] Creating stub hub: {hub_filename}")
                        # course and semester MUST be plain text (not wikilinks)
                        # Obsidian text-type properties link via Dataview automatically
                        stub_yaml = (
                            f"---\n"
                            f"title: {hub_filename[:-3]}\n"
                            f"type: Hub\n"
                            f"course: {course}\n"
                            f"semester: {semester}\n"
                            f"unit: {unit_num}\n"
                            f"source: \n"
                            f"source_pages: []\n"
                            f"status: Not Started\n"
                            f"confidence: null\n"
                            f"study_date: null\n"
                            f"generated: false\n"
                            f"---\n\n"
                            f"# {hub_title}\n\n"
                            f"> Auto-created stub by OKA. Full content will be generated after plan confirmation.\n"
                        )
                        with open(hub_file_path, "w", encoding="utf-8") as f:
                            f.write(stub_yaml)
                    
                    # Synthesize a virtual hub metadata dict to pre-fill the frontend
                    target_hub = {
                        "id": hub_filename,
                        "title": f"{unit_num} {hub_title} Hub" if unit_num else f"{hub_title} Hub",
                        "path": str(hub_file_path.absolute()),
                        "course": course,
                        "unit": unit_num,
                        "semester": semester
                    }
                    print(f"[OKA Service] Anchored to synthesized hub: {hub_filename}")

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
        """Uses AI to extract course, semester, unit, and hub_title from text.
        
        Critically important: course and semester must match EXACT stems from the vault
        database files (07 - Courses / 08 - Semesters). The AI is shown these exact names
        and instructed to pick the CLOSEST match. If nothing matches, it invents a new value.
        """
        options = self.list_available_options()
        
        # Build numbered option lists so AI can pick by index or name
        course_list = "\n".join(f"  {i+1}. \"{c}\"" for i, c in enumerate(options['courses']))
        semester_list = "\n".join(f"  {i+1}. \"{s}\"" for i, s in enumerate(options['semesters']))
        
        prompt = (
            "You are analyzing text from an academic document to identify its course context.\n\n"
            "Extract these five fields and return ONLY a JSON object:\n"
            "{\n"
            "  \"course\": \"<exact course name from the list below, or closest match>\",\n"
            "  \"semester\": \"<exact semester name from the list below, or closest match>\",\n"
            "  \"unit\": \"<chapter or unit NUMBER only, e.g. '5'>\",\n"
            "  \"hub_title\": \"<concise subject title for this chapter, NO unit numbers, NO 'Hub'>\",\n"
            "  \"primary_language\": \"<primary technical language, e.g. 'C++', 'Python', 'SQL', or 'General'>\"\n"
            "}\n\n"
            "AVAILABLE COURSES (pick the CLOSEST match based on subject matter):\n"
            f"{course_list}\n\n"
            "AVAILABLE SEMESTERS (pick the most recent/likely based on context):\n"
            f"{semester_list}\n\n"
            "MATCHING RULES:\n"
            "- Use the EXACT string from the list above (including spaces and capitalization).\n"
            "- If the document covers C++, arrays, functions, OOP, memory \u2192 likely 'Computer Programming'.\n"
            "- If the document covers SQL, ER diagrams, relational algebra, database \u2192 likely 'Database Systems'.\n"
            "- If the document covers logic, sets, graphs, proofs \u2192 likely 'Discrete Mathematics'.\n"
            "- If no course matches, create a reasonable new course name.\n"
            "- If no semester matches, use the most recent one listed or infer from date references in text.\n"
            "- RETURN ONLY JSON. NO MARKDOWN. NO EXPLANATION.\n\n"
            f"DOCUMENT TEXT (first 15000 chars):\n{text[:15000]}"
        )
        
        try:
            res = await self.llm.ainvoke([HumanMessage(content=prompt)])
            clean_content = res.content.strip()
            if "```json" in clean_content:
                clean_content = re.search(r"```json\s*(.*?)\s*```", clean_content, re.DOTALL).group(1)
            elif "```" in clean_content:
                clean_content = re.search(r"```\s*(.*?)\s*```", clean_content, re.DOTALL).group(1)
            
            data = json.loads(clean_content)
            
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
            
            final_course = _snap_to_existing(detected_course, options['courses'])
            final_semester = _snap_to_existing(detected_semester, options['semesters'])
            
            print(f"[OKA Service] AI detected: course='{final_course}', semester='{final_semester}', unit='{data.get('unit')}', hub='{data.get('hub_title')}', language='{data.get('primary_language', 'General')}'")
            
            return {
                "course": final_course,
                "semester": final_semester,
                "unit": str(data.get("unit", "")),
                "hub_title": str(data.get("hub_title", "")),
                "primary_language": str(data.get("primary_language", "General"))
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
            session["metadata"]["course"] = curriculum_override.get("course", session["metadata"].get("course"))
            session["metadata"]["unit"] = curriculum_override.get("unit", session["metadata"].get("unit"))
            session["metadata"]["semester"] = curriculum_override.get("semester")
            session["metadata"]["hub_title"] = curriculum_override.get("hub_title")
            
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
                        await asyncio.sleep(2.1)

                    final_output = ""
                    generation_attempts = 0
                    max_attempts = 3
                    
                    while generation_attempts < max_attempts:
                        generation_attempts += 1
                        phase_prefix = f"(Attempt {generation_attempts}/{max_attempts})" if generation_attempts > 1 else ""
                        OkaService._status[session_id] = f"{phase_prefix} Surgical Pass: [[{current_note_title}]] (1/2)..."
                        
                        try:
                            note_content = await self.writer_agent.generate_content(
                                note_schema=note_schema,
                                source_text=note_schema.source_context or "No specific context extracted.",
                                primary_language=primary_language,
                                all_concepts=all_concepts_list
                            )
                            
                            OkaService._status[session_id] = f"{phase_prefix} Socratic Pass: [[{current_note_title}]] (2/2)..."
                            probes = None
                            try:
                                probes = await self.writer_agent.generate_probes(
                                    note_title=note_schema.title,
                                    note_body=note_content.markdown_body,
                                    source_text=note_schema.source_context or "",
                                    primary_language=primary_language,
                                    all_concepts=all_concepts_list
                                )
                                if probes:
                                    session["all_note_probes"][note_schema.title] = probes
                            except Exception as e:
                                print(f"[OKA Service] Probe generation warning: {e}")

                            final_output = self._compile_atomic_note(
                                plan=plan_obj, 
                                note_schema=note_schema, 
                                note_content=note_content, 
                                probes=probes,
                                session_path=session.get("path", "")
                            )
                            
                            is_valid, struct_errors = self.validator.validate_structure(final_output)
                            if is_valid:
                                local_results = self.deployer.deploy_atomic_notes(session_id, [current_note_title], [final_output], plan_obj, session.get("path", ""))
                                break
                            else:
                                if generation_attempts >= max_attempts:
                                    raise ValueError(f"Failed to generate a valid note after {max_attempts} attempts. Errors: {struct_errors}")
                                note_schema.source_context = f"{note_schema.source_context or ''}\n\n[REGENERATION_HINT]: STRUCTURAL VALIDATION FAILED: {', '.join(struct_errors)}"
                        except Exception as e:
                            if generation_attempts >= max_attempts: raise e
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
                    local_results = self.deployer.deploy_hub_note(session_id, ai_output, plan_obj, session.get("path", ""))

                deployment_results.extend(local_results)
                session["current_batch"] = b_num
                self._persist_session(session_id, session)
                return b_num < total_batches

            # ── EXECUTION ──
            has_more = await run_single_batch(batch_number, batch_type, batch_notes)

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

    def _compile_atomic_note(self, plan: SovereignPlan, note_schema: AtomicNoteSchema, note_content: NoteContent, probes: Optional[ProbeEnrichment] = None, session_path: str = "") -> str:
        """
        [DETERMINISTIC COMPILER v19.3]
        Constructs the Sovereign note with interleaved Socratic Probes.
        """
        # Resolve the real PDF source from session path
        source_link = f"[[{Path(session_path).name}]]" if session_path else f"[[{plan.hub_note.title}]]"

        metadata = {
            "title": note_schema.title,
            "type": "Atomic Note",
            "course": plan.course,
            "semester": plan.semester,
            "unit": plan.unit,
            "hub": f"[[{plan.hub_note.title}]]",
            "source": source_link,
            "source_pages": note_schema.source_pages,
            "mode": note_schema.mode,
            "read": False,
            "generated": True
        }
        
        # Add wikilinks for YAML safety
        if note_schema.prerequisites:
            metadata["prerequisites"] = [f"[[{p}]]" for p in note_schema.prerequisites]

        yaml_frontmatter = self.vm.dump_obsidian_yaml(metadata)

        # Interleave Probes if present
        probe_body = ""
        if probes:
            probe_body = (
                "\n---\n\n"
                "## 5. Worked Example\n\n"
                f"{probes.worked_example.strip()}\n\n"
                "---\n\n"
                "## 6. Socratic Probes\n\n"
                f"**Scenario-Based Question**: {probes.l1_scenario}\n\n"
                f"**Implementation Challenge**: {probes.l2_implementation}\n\n"
                f"**Debug Challenge**: {probes.l3_debug}\n\n"
                "---\n\n"
                "### Answer Key\n"
                f"{probes.answer_key}\n"
            )

        full_body = note_content.markdown_body.strip() + probe_body
        return f"---\n{yaml_frontmatter}---\n\n{full_body}\n"

    def _compile_pq_note(self, plan: SovereignPlan, note_schema: NoteSchema, note_content: NoteContent, all_note_probes: Dict[str, ProbeEnrichment], session_path: str = "") -> str:
        """
        [DETERMINISTIC COMPILER v21.5]
        Constructs a comprehensive Possible Questions note with coverage for ALL atomic notes.
        """
        source_link = f"[[{Path(session_path).name}]]" if session_path else f"[[{plan.hub_note.title}]]"

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
                f"**L1 Scenario**: {probes.l1_scenario}\n\n"
                f"**L2 Implementation**: {probes.l2_implementation}\n\n"
                f"**L3 Debug Challenge**:\n\n{probes.l3_debug.strip()}\n"
            )

        full_body = "\n".join(body_parts)
        return f"---\n{yaml_frontmatter}---\n\n{full_body}\n"

    def _compile_hub_note(self, plan: SovereignPlan, session_path: str = "") -> str:
        """
        [DETERMINISTIC COMPILER]
        Constructs the Unit Hub.
        """
        source_link = f"[[{Path(session_path).name}]]" if session_path else f"[[{plan.hub_note.title}]]"

        metadata = {
            "title": plan.hub_note.title,
            "type": "Hub",
            "course": plan.course,
            "semester": plan.semester,
            "unit": plan.unit,
            "source": source_link,
            "source_pages": [],
            "status": "Not Started",
            "confidence": None,
            "study_date": None,
            "mode": "ARCHITECT",
            "generated": True
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
