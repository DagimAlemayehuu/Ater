import re
import json
import os
import asyncio
import traceback
import uuid
import time
import yaml
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from langchain_community.document_loaders import PyPDFLoader

from .vault_manager import VaultManager
from .deployer import OkaDeployer
from src.domains.ai.factory import ModelFactory

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
            temperature=0.1,
            timeout=OKA_TIMEOUT,
            request_timeout=OKA_TIMEOUT,
            max_retries=0,  # We handle retries ourselves for better status feedback
            max_tokens=4096,
        ) if secrets.ai_key else None

        # Initialize Planner LLM for complex tasks like quiz generation
        planner_provider = secrets.planner_provider or secrets.ai_provider
        planner_key = secrets.planner_key or secrets.ai_key
        planner_model = secrets.planner_model or secrets.ai_model
        
        self.planner_llm = ModelFactory.get_model(
            provider=planner_provider,
            model_name=planner_model,
            api_key=planner_key,
            temperature=0.1,
            timeout=OKA_TIMEOUT,
            request_timeout=OKA_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if planner_key else self.llm

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

    def list_atomic_notes(self, hub_id: str) -> List[Dict[str, Any]]:
        """Lists atomic notes linked to a specific hub."""
        hubs = self.list_planner_hubs()
        hub = next((h for h in hubs if h["id"] == hub_id), None)
        if not hub:
            return []
            
        hub_path = Path(hub["path"])
        semester = hub.get("semester", "General")
        course = hub.get("course", "General_Knowledge")
        unit_num = hub.get("unit", "")
        
        canonical_hub = self.vm.get_canonical_title(hub["title"])
        unit_prefix = f"{unit_num}_" if unit_num else ""
        unit_folder_name = f"{unit_prefix}{canonical_hub}"
        
        academic_unit_dir = self.vm.academic_root / semester / self.vm.get_canonical_title(course) / unit_folder_name
        unit_dir = academic_unit_dir if academic_unit_dir.exists() else hub_path.parent
        
        notes = []
        if unit_dir.exists():
            for file in unit_dir.glob("*.md"):
                if file.name == hub_path.name or "Possible_Questions" in file.name or "Practice" in file.name or file.name.startswith("_"):
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
        
        # Resolve the Academic Unit Folder
        semester = hub.get("semester", "General")
        course = hub.get("course", "General_Knowledge")
        unit_num = hub.get("unit", "")
        hub_title_raw = hub.get("hub_title", hub["title"])
        
        canonical_hub = self.vm.get_canonical_title(hub_title_raw)
        unit_prefix = f"{unit_num}_" if unit_num else ""
        unit_folder_name = f"{unit_prefix}{canonical_hub}"
        
        academic_unit_dir = self.vm.academic_root / semester / self.vm.get_canonical_title(course) / unit_folder_name
        unit_dir = academic_unit_dir if academic_unit_dir.exists() else hub_path.parent
        practice_dir = self.vm.academic_root / "Practice"
        practice_dir.mkdir(exist_ok=True)
        
        # 1. Gather Context
        context_parts = []
        
        # Filter files based on config
        atomic_notes = list(unit_dir.glob("*.md"))
        selected_notes = config.selectedAtomicNotes
        
        # Read Hub content if it matches or if no specific notes selected
        if not selected_notes or any(hub["title"] in s for s in selected_notes):
            with open(hub_path, "r", encoding="utf-8") as f:
                context_parts.append(f"## Hub Note: {hub['title']}\n{f.read()}")

        for note_path in atomic_notes:
            if note_path.name == hub_path.name or "Possible_Questions" in note_path.name or "Practice" in note_path.name or note_path.name.startswith("_"):
                continue
            
            # Apply exclusion keywords
            if any(kw.lower() in note_path.name.lower() for kw in config.exclusionKeywords):
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
                
        # Find and read Possible Questions file
        pq_file = next(unit_dir.glob("*_Possible_Questions.md"), None)
        if pq_file:
            with open(pq_file, "r", encoding="utf-8") as f:
                context_parts.append(f"## Reference Questions\n{f.read()}")
        
        full_context = "\n\n".join(context_parts)
        
        # 2. Build Prompt
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

        prompt = (
            "You are OKA, the Sovereign Pedagogical Architect. Your objective is to generate an elite practice session in ONE SINGLE REQUEST.\n\n"
            "TARGET PROFILE:\n"
            f"- Question Total: {total_q}\n"
            f"- Distribution: {dist_str}\n"
            f"- Cognitive Level: {config.difficulty}\n"
            f"- Grading Strictness: {config.gradingStrictness}\n"
            f"{chr(10).join(pedagogy_prompts)}\n\n"
            "MODALITY SPECIFICATIONS:\n"
            "- 'mcq': 4 options (A-D).\n"
            "- 'code': Provide a starting `codeSnippet` (Markdown) and the solution in `answer`.\n"
            "- 'find_error': Provide `buggyCode` and the fix in `answer`.\n"
            "- 'cloze': Use `[[blank]]` in `textWithBlanks`. Provide `answer` array (list of strings for each blank).\n"
            "- 'matching': Provide pairs in `pairs`: [{'left': 'term', 'right': 'definition'}].\n\n"
            "RULES:\n"
            "1. STRICT JSON SCHEMA: Follow the provided schema exactly.\n"
            "2. GROUNDING: Every question must correlate to the specific details in the Atomic Notes provided.\n"
            "3. EXPLANATIONS: Include a detailed `explanation` for EVERY question, quoting the source material where possible.\n"
            "4. CONFIDENCE WAGERS: The app will handle the UI, but ensure the difficulty permits a confidence assessment.\n\n"
            f"MATERIAL CONTEXT:\n{full_context[:MAX_SOURCE_CHARS]}"
        )
        
        # 3. Invoke LLM with Structured Output logic
        session_id = f"practice_{hub_id}_{int(time.time())}"
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
                print(f"[OKA Service] Structured output failed, falling back to raw: {e}")
                from langchain_core.messages import HumanMessage
                res = await self.planner_llm.ainvoke([HumanMessage(content=prompt + "\n\nRETURN ONLY A JSON LIST.")])
                content = res.content.strip()
                if "```json" in content:
                    content = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL).group(1)
                elif "```" in content:
                    content = re.search(r"```\s*(.*?)\s*```", content, re.DOTALL).group(1)
                questions = json.loads(content)
            
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
                    for k, v in q['options'].items():
                        md_content += f"- **{k})** {v}\n"
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
            "Extract these four fields and return ONLY a JSON object:\n"
            "{\n"
            "  \"course\": \"<exact course name from the list below, or closest match>\",\n"
            "  \"semester\": \"<exact semester name from the list below, or closest match>\",\n"
            "  \"unit\": \"<chapter or unit NUMBER only, e.g. '5'>\",\n"
            "  \"hub_title\": \"<concise subject title for this chapter, NO unit numbers, NO 'Hub'>\"\n"
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
                if not detected: return detected
                # Exact match first
                if detected in existing: return detected
                # Case-insensitive match
                d_low = detected.lower()
                for e in existing:
                    if e.lower() == d_low: return e
                # Substring match (e.g., "Computer Programming" contains "Programming")
                for e in existing:
                    if d_low in e.lower() or e.lower() in d_low: return e
                # Return original if no match (it's a new value)
                return detected
            
            final_course = _snap_to_existing(detected_course, options['courses'])
            final_semester = _snap_to_existing(detected_semester, options['semesters'])
            
            print(f"[OKA Service] AI detected: course='{final_course}', semester='{final_semester}', unit='{data.get('unit')}', hub='{data.get('hub_title')}'")
            
            return {
                "course": final_course,
                "semester": final_semester,
                "unit": str(data.get("unit", "")),
                "hub_title": str(data.get("hub_title", ""))
            }
        except Exception as e:
            print(f"[OKA Service] AI Metadata detection failed: {e}")
            return {"course": "", "semester": "", "unit": "", "hub_title": ""}

    # ── Phase 2: Planning ──────────────────────────────────────
    async def generate_plan(
        self, file_path: str, system_instruction_path: str, curriculum: Dict[str, Any], target_hub_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Phase 2: AI Planning using LOCKED metadata from the user."""
        path = Path(file_path)
        session_id = str(path.absolute())
        
        # Clear any existing session
        OkaService._sessions.pop(session_id, None)
        
        si = await self._get_si(system_instruction_path)
        messages = [SystemMessage(content=si)]

        # Read full content for planning
        full_text = ""
        if path.suffix.lower() == ".pdf":
            loader = PyPDFLoader(str(path))
            pages = loader.load_and_split()
            # Explicitly inject page markers so the AI can attribute concepts to specific sections
            full_text = "\n".join([f"[PAGE {p.metadata.get('page', 0) + 1}]\n{p.page_content}" for p in pages])
        else:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()

        # Build strict anchor instruction
        # CRITICAL FIX: Strip [[wikilinks]] from course/semester FIRST — these can come
        # from the frontend filling from hub metadata that stores them as [[value]].
        def _strip_val(v: str) -> str:
            """Strip wikilinks, quotes, and 'Unknown' from metadata values."""
            s = str(v).replace("[[", "").replace("]]", "").strip().strip("\"'").strip()
            if s.lower() in ("unknown", "unknown_course", "unknown_semester", ""): return ""
            return s
        
        unit_num = _strip_val(curriculum.get("unit", ""))
        course = _strip_val(curriculum.get("course", ""))
        semester = _strip_val(curriculum.get("semester", ""))
        hub_title = _strip_val(curriculum.get("hub_title", ""))

        # Clean the hub_title of unit numbers and "Hub" suffixes to prevent 3_3_Hub_Hub
        clean_hub_title = hub_title
        clean_hub_title = clean_hub_title.lstrip(" _-")
        while re.match(r"^\d+[\s\-_]*", clean_hub_title):
            clean_hub_title = re.sub(r"^\d+[\s\-_]*", "", clean_hub_title)
            clean_hub_title = clean_hub_title.lstrip(" _-")
        clean_hub_title = clean_hub_title.replace(" Hub", "").replace("_Hub", "").strip("_ ")
        canonical_hub_base = self.vm.get_canonical_title(clean_hub_title)

        # Self-Healing: Check for existing notes to avoid duplication
        path_semester = semester or "General"
        path_course = self.vm.get_canonical_title(course or "General_Knowledge")
        
        unit_prefix = f"{unit_num}_" if unit_num else ""
        unit_folder_name = f"{unit_prefix}{canonical_hub_base}"
        
        unit_dir = self.vm.academic_root / path_semester / path_course / unit_folder_name
        
        existing_notes = []
        if unit_dir.exists():
            existing_notes = [f.stem for f in unit_dir.glob("*.md")]

        anchor_instruction = (
            "\n\nCURRICULUM LOCK (MANDATORY):\n"
            f"You are architecting for:\n"
            f"- Course: [[{course}]]\n"
            f"- Semester: [[{semester}]]\n"
            f"- Unit: {unit_num}\n"
            f"- Hub Title: {clean_hub_title}\n"
            f"- Source PDF: [[{Path(file_path).name}]]\n\n"
            "STRICT NAMING CONVENTION:\n"
            f"1. Master Hub: [[{unit_num}_{clean_hub_title.replace(' ', '_')}_Hub]]\n"
            f"2. Possible Questions: [[{unit_num}_{clean_hub_title.replace(' ', '_')}_Possible_Questions]]\n"
            "3. Atomic Notes: [[Strict_Title_Case_With_Underscores]] (No Unit Number).\n"
            "4. CONNECTIONS: You MUST maintain hierarchical indentation (2 spaces) in the # Connections section."
        )

        healing_instruction = ""
        if existing_notes:
            healing_instruction = (
                "\n\nSELF-HEALING AUDIT (CRITICAL):\n"
                "The following notes ALREADY EXIST in this unit folder. DO NOT plan for them or re-generate them:\n"
                f"{', '.join([f'[[{n}]]' for n in existing_notes])}\n"
                "Reference them in the Hub/PQ, but omit them from the <atomic_notes> tag."
            )

        init_command = (
            "Source material provided. ABSOLUTELY NO PREAMBLES.\n"
            "1. Start with the `<pre_generation_planning>` reasoning block.\n"
            "2. Extract major technical concepts.\n"
            "3. GRANULARITY MANDATE: Extract EVERY granular, atomic technical concept. Break down broad topics into strictly distinct concepts. Aim for 15-25 highly specific atomic notes.\n"
            "4. Output the **Finalized Knowledge Asset Plan** using EXACTLY these tags:\n"
            "   - Wrap the Hub link in `<hub_note>[[Link]]</hub_note>`\n"
            "   - Wrap the PQ link in `<pq_note>[[Link]]</pq_note>`\n"
            "   - Wrap the atomic notes list in `<atomic_notes>` as a NUMBERED LIST (one per line):\n"
            "     ```\n"
            "     <atomic_notes>\n"
            "     1. [[Note_Title]] - Brief description of what this note covers (1 sentence)\n"
            "     2. [[Another_Note]] - Brief description\n"
            "     </atomic_notes>\n"
            "     ```\n"
            f"{anchor_instruction}\n"
            f"{healing_instruction}\n\n"
            f"{full_text[:MAX_SOURCE_CHARS]}"
        )
        messages.append(HumanMessage(content=init_command))

        response = await self._invoke_with_retry(messages, session_id, phase="Generating Plan")
        plan_output = response.content
        structured_plan = self._parse_plan_to_json(plan_output)
        
        # Inject user curriculum into metadata so it persists
        structured_plan["course"] = course
        structured_plan["unit"] = unit_num
        structured_plan["semester"] = semester
        structured_plan["hub_title"] = hub_title

        total_batches = len(structured_plan.get("batches", [])) or 1
        OkaService._sessions[session_id] = {
            "messages": messages + [response],
            "path": file_path,
            "plan": plan_output,
            "metadata": structured_plan,
            "current_batch": 0,
            "total_batches": total_batches,
            "target_hub": next((h for h in self.list_planner_hubs() if h["id"] == target_hub_id), None) if target_hub_id else None
        }
        
        self._persist_session(session_id, OkaService._sessions[session_id])
        
        return {
            "session_id": session_id,
            "plan_raw": plan_output,
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

        # Mandatory framing for ALL notes
        STRUCTURAL_REINFORCEMENT = (
            "\n\nABSOLUTE STRUCTURAL LAW (violation = regeneration):\n"
            "1. Every note MUST be wrapped in: --- START_NOTE --- and --- END_NOTE ---\n"
            "2. WIKILINKS ARE SACRED: `[[Database Systems]]` — bare, no quotes, ever.\n"
            "   FORBIDDEN: `[[\"X\"]]`  `[[\'X\']]`  `\"[[X]]\"`  `\'[[X]]\'`  — any form of quoting kills the link.\n"
            "3. NO PREAMBLES: Output raw note blocks only. No intro sentences.\n"
            "4. VISUAL CHUNKING: Max 4 sentences per paragraph. Use bullet points and bold keywords.\n"
            "5. YAML PROPERTIES: `key: [[Value]]` — lowercase key, bare wikilink, no quotes anywhere.\n"
            "6. source_pages MUST be a YAML list of integers: `source_pages: [12, 15, 23]`\n"
        )

        # STATE 2: [HUB] EXECUTION — Canonical Template from OKA.md v11.1
        if batch_type == "hub":
            # Collect the list of ACTUALLY planned atomic notes for strict Hub coverage
            all_planned = session["metadata"].get("notes", [])
            planned_atomic_list = "\n".join([f"  - [[{n}]]" for n in all_planned if "Hub" not in n and "Possible_Questions" not in n])
            
            reinforced_command = (
                "GENERATE THE HUB NOTE. Use EXACTLY this template structure. DO NOT change the headings.\n\n"
                "CRITICAL: The Core Topologies section MUST contain ONLY and EXACTLY these notes (no more, no less):\n"
                f"{planned_atomic_list}\n\n"
                "--- START_NOTE ---\n"
                "---\n"
                "title: {{Unit_Name}}_Hub\n"
                "type: Hub\n"
                "course: [[{{Course}}]]\n"
                "semester: [[{{Semester}}]]\n"
                "unit: {{Unit_Number}}\n"
                "source: [[{{Source_PDF}}]]\n"
                "source_pages: []\n"
                "status: Not Started\n"
                "confidence: null\n"
                "study_date: null\n"
                "generated: true\n"
                "---\n\n"
                "# Learning Objectives\n"
                "After mastering this unit, you can:\n"
                "1. (Verb + artifact: what the student can DO, e.g., 'Construct an ER diagram from requirements')\n"
                "2. (Another measurable skill with a concrete deliverable)\n"
                "3. (Another measurable skill with a concrete deliverable)\n\n"
                "# Core Topologies (Connections)\n"
                "(Strict DAG: Hierarchical indented list using ONLY the notes listed above. Indentation = dependency. EVERY NOTE APPEARS EXACTLY ONCE.)\n"
                "- [[Root_Concept]]\n"
                "  - [[Child_Concept]]\n"
                "    - [[Deep_Concept]]\n\n"
                "# Assessment Layer\n"
                "[[{Unit_Name}_Possible_Questions]]\n"
                "--- END_NOTE ---"
                f"{STRUCTURAL_REINFORCEMENT}"
            )
        elif batch_type == "pq":
            # Collect all atomic note names for PQ coverage
            all_planned = session["metadata"].get("notes", [])
            atomic_concepts = [n for n in all_planned if "Hub" not in n and "Possible_Questions" not in n]
            pq_concept_sections = "\n".join([f"## [[{n}]]\n### L1: Identify\n(Give a scenario. Ask to classify, identify, or distinguish — NOT define.)\n### L2: Construct\n(Give requirements. Ask to draw, build, write, or derive an artifact.)\n### L3: Debug\n(Give a WRONG diagram/schema/statement. Ask to find the error and fix it.)\n" for n in atomic_concepts])
            
            # Build the actual hub link from session metadata
            unit_num = session["metadata"].get("unit", "")
            hub_title = session["metadata"].get("hub_title", "")
            clean_hub = hub_title.replace(" ", "_")
            hub_link = f"{unit_num}_{clean_hub}_Hub" if unit_num else f"{clean_hub}_Hub"
            
            reinforced_command = (
                "GENERATE THE POSSIBLE QUESTIONS NOTE.\n"
                "CRITICAL: Every L1/L2/L3 question MUST contain a concrete scenario with specific entities, attributes, or a domain context. NO generic shells like 'Given an ER diagram, find the error.' — THAT IS FORBIDDEN.\n"
                "L1: Give a realistic scenario. Ask classify/identify/distinguish. NOT 'What is X?'\n"
                "L2: Give concrete requirements (e.g., real attributes). Ask to draw/build/write a specific artifact.\n"
                "L3: Provide the ACTUAL WRONG diagram/schema/statement inline. Ask to find the specific error and fix it.\n"
                "Use diverse domains: aerospace, biomedical, logistics, telecom, agriculture. DO NOT repeat domains.\n\n"
                "--- START_NOTE ---\n"
                "---\n"
                f"title: {unit_num}_{clean_hub}_Possible_Questions\n"
                "type: Possible Questions\n"
                f"course: [[{session['metadata'].get('course', '')}]]\n"
                f"semester: [[{session['metadata'].get('semester', '')}]]\n"
                f"unit: {unit_num}\n"
                f"hub: [[{hub_link}]]\n"
                f"source: [[{Path(session.get('path', '')).name}]]\n"
                "score: null\n"
                "---\n\n"
                "# Part I: Concept Interrogation\n"
                f"{pq_concept_sections}\n"
                "# Part II: Synthesis & Architecture\n"
                "### Integration Scenario: [Descriptive Title — unique domain NOT used in any atomic note]\n"
                "(Multi-step problem combining 3+ concepts. Must require producing a complete artifact from a requirements paragraph.)\n"
                "--- END_NOTE ---"
                f"{STRUCTURAL_REINFORCEMENT}"
            )
        else:
            # Build actual metadata values for the template
            unit_num = session["metadata"].get("unit", "")
            hub_title = session["metadata"].get("hub_title", "")
            clean_hub = hub_title.replace(" ", "_")
            hub_link = f"{unit_num}_{clean_hub}_Hub" if unit_num else f"{clean_hub}_Hub"
            course = session["metadata"].get("course", "")
            semester = session["metadata"].get("semester", "")
            source_name = Path(session.get("path", "")).name
            
            reinforced_command = (
                f"GENERATE THE ATOMIC NOTE for: {notes_context}\n"
                f"Batch {batch_number} of {total_batches}\n\n"
                "RULES:\n"
                "1. Lead with a precise exam-grade definition, NOT a decorative analogy\n"
                "2. Use bullet points and bold keywords. Max 4 sentences per paragraph\n"
                "3. Worked example MUST produce a VISIBLE ARTIFACT (filled table, diagram, schema, computation trace)\n"
                "4. Worked example MUST use a domain NOT used in other notes (no repeating Staff/Branch/University)\n"
                "5. Edge Case MUST require reasoning — not a trivial yes/no. If the answer is obvious without reading the note, remake it\n"
                "6. DO NOT truncate. Output ALL 4 sections completely\n"
                "7. BARE WIKILINKS: No quotes around or inside [[links]] anywhere — EVER\n\n"
                "--- START_NOTE ---\n"
                "---\n"
                "title: (concept name in Title_Case_With_Underscores)\n"
                "type: Atomic Note\n"
                f"course: [[{course}]]\n"
                f"semester: [[{semester}]]\n"
                f"unit: {unit_num}\n"
                f"hub: [[{hub_link}]]\n"
                "parent: [[parent_concept_name]]\n"
                f"source: [[{source_name}]]\n"
                "source_pages: [page_number_1, page_number_2]\n"
                "mode: ENGINEER\n"
                "---\n\n"
                "# Definition & Mechanics\n"
                "(Precise definition in 1-2 sentences. Then mechanics: how to identify, classify, or apply. Bullet points with bold keywords. Include ```mermaid diagram if relevant.)\n\n"
                "# Worked Example\n"
                "(Concrete scenario with specific data and a VISIBLE ARTIFACT: a table, diagram fragment, schema snippet, or computation trace. Unique domain per note.)\n\n"
                "# Edge Case\n"
                "> **Q:** (A question where the obvious answer is wrong or two concepts collide)\n"
                "> **A:** (The reasoning chain — reference rules from Definition & Mechanics)\n\n"
                "# Connections\n"
                "- **Depends on:** [[prerequisite_concept]] — (why)\n"
                "- **Enables:** [[downstream_concept]] — (how)\n"
                "--- END_NOTE ---"
                f"{STRUCTURAL_REINFORCEMENT}"
            )
        
        pruned_messages = initial_messages + plan_response + [HumanMessage(content=reinforced_command)]

        try:
            # ── RATE LIMIT THROTTLING ──
            if batch_number > 1:
                await asyncio.sleep(3) # Prevent hammering the API and throwing 429 Timeouts

            res = await self._invoke_with_retry(
                pruned_messages,
                session_id,
                phase=f"Generating Batch {batch_number}/{total_batches}",
            )

            # ── SELF-HEALING AUDIT (HUB ONLY) ────────────────────────
            if batch_type == "hub":
                audit_passed, audit_msg = self._audit_hub_consistency(res.content, session["metadata"].get("notes", []), session["metadata"])
                if not audit_passed:
                    print(f"[OKA Service] Hub Audit Failed. Auto-correcting...")
                    correction_messages = pruned_messages + [res, HumanMessage(content=f"STRUCTURAL ERROR: {audit_msg}\nRE-GENERATE HUB NOW WITH 100% COVERAGE.")]
                    res = await self._invoke_with_retry(correction_messages, session_id, phase="Self-Healing Correction")

            OkaService._status[session_id] = f"Deploying Batch {batch_number} to Vault..."
            deployment_results = await self.deployer.deploy(res.content, session_metadata=session["metadata"])
            
            print(f"[OKA Service] Batch {batch_number} deployed: {len(deployment_results)} notes.")

            session["messages"].append(res)
            session["current_batch"] = batch_number
            has_more = batch_number < total_batches
            
            self._persist_session(session_id, session)

            if not has_more:
                OkaService._sessions.pop(session_id, None)
                OkaService._status[session_id] = "Completed"
                
                # Mark Hub as Generated
                hub_to_update = session.get("target_hub")
                if hub_to_update and hub_to_update.get("path"):
                    hub_path = Path(hub_to_update["path"])
                    if hub_path.exists():
                        try:
                            with open(hub_path, "r", encoding="utf-8") as f:
                                content = f.read()
                            meta, body, err = self.vm.extract_yaml_and_content(content)
                            if not err:
                                meta["generated"] = True
                                yaml_content = self.vm.dump_obsidian_yaml(meta)
                                full_content = f"---\n{yaml_content}\n---\n\n{body.strip()}\n"
                                self.vm.write_note(hub_path, full_content)
                                print(f"[OKA Service] Marked hub as generated: {hub_path.name}")
                        except Exception as e:
                            print(f"[OKA Service] Failed to mark hub as generated: {e}")
            else:
                OkaService._status[session_id] = f"Awaiting Batch {batch_number + 1}"

            return {
                "ai_output": res.content,
                "results": deployment_results,
                "count": len(deployment_results),
                "has_more": has_more,
                "current_batch": batch_number,
                "total_batches": total_batches,
                "status": "success"
            }
        except Exception as e:
            error_msg = self._format_user_error(e)
            OkaService._status[session_id] = f"Error: {error_msg}"
            raise ValueError(error_msg)

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

    def _parse_plan_to_json(self, plan_text: str) -> Dict[str, Any]:
        """Strips 'Unknown' from metadata and extracts notes into individual batches."""
        metadata = {"course": "", "unit": "", "semester": "", "hub_title": ""}
        
        # Extract from text if possible
        patterns = {
            "course": [r"Course:\s*\[\[(.*?)\]\]", r"Course:\s*(.*)"],
            "unit": [r"Unit:\s*(.*)"],
            "semester": [r"Semester:\s*\[\[(.*?)\]\]", r"Semester:\s*(.*)"]
        }
        for key, p_list in patterns.items():
            for p in p_list:
                m = re.search(p, plan_text, re.I)
                if m:
                    val = m.group(1).strip()
                    if "unknown" not in val.lower():
                        metadata[key] = val
                    break

        # Clean "Unknown" from all metadata fields
        for key in ["course", "unit", "semester"]:
            if metadata.get(key) and "unknown" in str(metadata.get(key)).lower():
                metadata[key] = ""

        # ── Tag-Based Extraction ───────────────────────────────────
        def extract_tag(tag, text):
            match = re.search(f"<{tag}>(.*?)</{tag}>", text, re.DOTALL | re.I)
            return match.group(1).strip() if match else ""

        hub_raw = extract_tag("hub_note", plan_text)
        pq_raw = extract_tag("pq_note", plan_text)
        atomic_raw = extract_tag("atomic_notes", plan_text)

        hub_notes = list(dict.fromkeys(re.findall(r"\[\[(.*?)\]\]", hub_raw)))
        pq_notes = list(dict.fromkeys(re.findall(r"\[\[(.*?)\]\]", pq_raw)))
        atomic_notes = list(dict.fromkeys(re.findall(r"\[\[(.*?)\]\]", atomic_raw)))

        # ── PLAN CAPPING & FLOOR ENFORCEMENT ──
        # 1. Cap atomic notes at 25 to prevent context explosion
        if len(atomic_notes) > 25:
            print(f"[OKA Service] Capping plan: {len(atomic_notes)} notes reduced to 25.")
            atomic_notes = atomic_notes[:25]
        
        # 2. Floor enforcement: warn if below 15
        if len(atomic_notes) < 15:
            print(f"[OKA Service] WARNING: Only {len(atomic_notes)} atomic notes extracted. Target is 15-25.")

        # Store all planned notes (Hub + PQ + Atomic)
        all_planned_notes = list(dict.fromkeys(hub_notes + pq_notes + atomic_notes))
        metadata["notes"] = all_planned_notes

        # ── Batching Logic: Atomic FIRST, then PQ, then Hub LAST ──
        # Hub is generated LAST so it can reference only the notes that actually exist.
        sniped_batches = []
        next_id = 1
        processed_notes = set()

        # 1. Individual Atomic Note Batches (FIRST)
        for note in atomic_notes:
            if note in processed_notes: continue
            sniped_batches.append({"id": next_id, "notes": [note], "type": "atomic"})
            next_id += 1
            processed_notes.add(note)

        # 2. Individual PQ Batches (SECOND)
        for note in pq_notes:
            if note in processed_notes: continue
            sniped_batches.append({"id": next_id, "notes": [note], "type": "pq"})
            next_id += 1
            processed_notes.add(note)

        # 3. Individual Hub Batches (LAST — so all atomic notes exist first)
        for note in hub_notes:
            if note in processed_notes: continue
            sniped_batches.append({"id": next_id, "notes": [note], "type": "hub"})
            next_id += 1
            processed_notes.add(note)

        metadata["batches"] = sniped_batches
        return metadata
