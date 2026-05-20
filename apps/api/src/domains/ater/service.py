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
from .deployer import AterDeployer
from src.domains.ai.factory import ModelFactory
from .agents import ArchitectAgent, TheoryAgent, PractitionerAgent, QuestionAgent, CriticAgent, HubAgent, VerifierAgent, QuizAuditorAgent, EpistemicClassifierAgent, MetaScannerAgent, DOMAIN_MATRIX, get_professional_domain, get_persona, normalize_mode
from .router import router
from .templates import render_atomic_note, build_skeleton_note, build_dynamic_section_plan
from .healer import LogicHealer
from .governor import governor, DailyLimitExceededException
from .schemas import SovereignPlan, AtomicNoteSchema, NoteContent, NoteSchema, ProbeEnrichment
import ruamel.yaml
import logging

logger = logging.getLogger("Ater")

# Ater-specific constants
ATER_TIMEOUT = 600       # 10 minutes — headroom for large PDFs
ATER_MAX_RETRIES = 10     # Retry on transient failures (524, timeout, rate-limit)
ATER_RETRY_BACKOFF = 15  # Seconds between retries (doubles each attempt)
MAX_SOURCE_CHARS = 80000  # Characters to include in prompt (Lowered for 30k TPM Free Tier)


class AterService:
    """
    Main orchestrator for Ater.
    """
    _sessions: Dict[str, Dict[str, Any]] = {}
    _status: Dict[str, str] = {}  # Global status map
    _rate_limited: Dict[str, float] = {}  # session_id → timestamp when rate-limit hit
    _session_file = Path.home() / ".ater" / "ater" / "sessions.json"
    _status_callback: Optional[Any] = None # (session_id, message) -> None

    def _model_kwargs(self) -> Dict[str, Any]:
        return {
            "base_url": getattr(self.secrets, "ai_base_url", None),
            "max_tpm": getattr(self.secrets, "ai_max_tpm", None),
            "max_rpm": getattr(self.secrets, "ai_max_rpm", None),
            "max_tpd": getattr(self.secrets, "ai_max_tpd", None),
            "max_rpd": getattr(self.secrets, "ai_max_rpd", None),
            "max_concurrency": getattr(self.secrets, "ai_max_concurrency", None),
        }

    def _build_model(self, provider: str, model_name: str, api_key: str, **kwargs):
        return ModelFactory.get_model(
            provider=provider,
            model_name=model_name,
            api_key=api_key,
            **self._model_kwargs(),
            **kwargs,
        )

    @classmethod
    def clear_sessions(cls):
        """Wipes all active and persisted sessions."""
        cls._sessions = {}
        cls._status = {}
        if cls._session_file.exists():
            try:
                cls._session_file.unlink()
            except Exception as e:
                logger.error(f"[Ater Service] Failed to delete session file: {e}")

    def __init__(self, secrets):
        self.secrets = secrets
        self.vm = VaultManager(secrets.vault_path, academic_root=secrets.academic_path)
        self.deployer = AterDeployer(self.vm)
        self._ensure_session_dir()

        # Initialize LLM with extended timeout for Ater workloads
        self.llm = self._build_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.0, # ZERO temperature for strict structural planning
            timeout=ATER_TIMEOUT,
            request_timeout=ATER_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if secrets.ai_key else None

        # Initialize the Architect Agent for deterministic planning
        self.architect_agent = ArchitectAgent(llm=self.llm) if self.llm else None

        # Initialize Planner LLM for complex tasks like quiz generation
        planner_provider = secrets.planner_provider or secrets.ai_provider
        planner_key = secrets.planner_key or secrets.ai_key
        planner_model = secrets.planner_model or secrets.ai_model
        
        self.planner_llm = self._build_model(
            provider=planner_provider,
            model_name=planner_model,
            api_key=planner_key,
            temperature=0.0, # ZERO temperature for planning
            timeout=ATER_TIMEOUT,
            request_timeout=ATER_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if planner_key else self.llm

        # Initialize the Writer Agent for creative generation
        self.llm_creative = self._build_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.0, # 0.0 for strict template execution
            timeout=ATER_TIMEOUT,
            request_timeout=ATER_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if secrets.ai_key else None
        
        self.critic_agent = CriticAgent(llm=self.llm_creative) if self.llm_creative else None
        self.hub_agent = HubAgent(llm=self.llm) if self.llm else None
        self.epistemic_classifier_agent = EpistemicClassifierAgent(llm=self.llm) if self.llm else None
        self.verifier_agent = VerifierAgent(llm=self.llm) if self.llm else None
        self.meta_scanner_agent = MetaScannerAgent(llm=self.llm) if self.llm else None
        self.governor = governor
        # Register the active key with the governor so daily quota is tracked per-key
        if secrets.ai_key:
            self.governor.set_api_key(secrets.ai_key, provider=secrets.ai_provider, model=secrets.ai_model, base_url=secrets.ai_base_url)

        from .validator import AterValidator
        self.validator = AterValidator()
        
        # Initialize YAML compiler
        self.yaml = ruamel.yaml.YAML()
        self.yaml.indent(mapping=2, sequence=4, offset=2)

    @classmethod
    def set_status(cls, session_id: str, message: str):
        """Sets the status for a session and triggers callback if registered."""
        cls._status[session_id] = message
        if cls._status_callback:
            try:
                # Callback is usually AterQueueManager.update_status_message
                cls._status_callback(session_id, message)
            except Exception as e:
                print(f"[Ater Service] Status callback failed: {e}")

    @classmethod
    def register_status_callback(cls, callback):
        cls._status_callback = callback

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
            print(f"[Ater Service] Session persistence failed: {e}")

    async def _get_or_restore_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        if session_id in AterService._sessions:
            return AterService._sessions[session_id]
        
        # Try to restore from disk
        if await asyncio.to_thread(self._session_file.exists):
            try:
                def _read_session():
                    with open(self._session_file, "r") as f:
                        return json.load(f)
                
                existing = await asyncio.to_thread(_read_session)
                if session_id in existing:
                    data = existing[session_id]
                    # We need to re-initialize messages from SI and initial prompt
                    # This is a bit tricky for multi-turn, but for Ater batches it's predictable
                    si_path = self.resolve_si_path()
                    si = await self._get_si(str(si_path))
                    data["messages"] = [SystemMessage(content=si)]
                    AterService._sessions[session_id] = data
                    return data
            except Exception: pass
        return None

    @staticmethod
    def resolve_si_path() -> Path:
        # Resolve absolute root (Ater/)
        # Current file is apps/api/src/domains/ater/service.py
        # parent 1: ater/
        # parent 2: domains/
        # parent 3: src/
        # parent 4: api/
        # parent 5: apps/
        # parent 6: Ater/
        import sys
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            root = Path(sys._MEIPASS)
        else:
            root = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        paths = [
            root / "Ater.md",
            root / ".system/prompts/ATER_System_Instruction.md"
        ]
        for p in paths:
            if p.exists(): return p
        raise FileNotFoundError(f"Ater System Instruction not found in: {[str(p) for p in paths]}")

    async def _get_si(self, path: str) -> str:
        def _read():
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        return await asyncio.to_thread(_read)

    async def _invoke_with_retry(self, messages: List[BaseMessage], session_id: str, phase: str = "AI Generation") -> AIMessage:
        """
        Wraps LLM calls with exponential-backoff retry.
        On 429 (rate limit): waits up to 5 minutes per attempt (10 attempts max).
        On key-swap recovery: re-reads secrets from disk and rebuilds the LLM.
        """
        attempt = 0
        last_error = None

        while attempt < ATER_MAX_RETRIES:
            try:
                attempt += 1
                # Length continuation loop for models that cut off
                current_messages = list(messages)
                final_content = ""

                while True:
                    # Get permit from governor before EACH chunk request
                    # Estimate tokens from actual message content lengths (not Python repr)
                    content_chars = sum(
                        len(m.content) if hasattr(m, 'content') and isinstance(m.content, str) else len(str(m))
                        for m in current_messages
                    )
                    estimated_tokens = (content_chars // 4) + 512  # +512 for overhead
                    try:
                        await self.governor.get_permit(expected_tokens=estimated_tokens)
                    except DailyLimitExceededException as de:
                        if str(de) == "ROTATION_TRIGGERED":
                            print(f"[Ater Service] 🔄 Governor triggered rotation. Swapping LLM key to: {self.governor._current_key_hash}")
                            self.swap_api_key(self.governor._active_key)
                            continue # Retry with new key
                        # Daily quota exhausted — wait for the reset window instead of failing
                        reset_wait = self.governor.get_reset_wait_seconds()
                        if 0 < reset_wait <= 14400:  # wait up to 4 hours
                            mins = int(reset_wait / 60)
                            print(f"[Ater Service] 📊 Quota exhausted. Waiting {mins}m for 24h window reset...")
                            AterService._status[session_id] = f"⏳ Quota Reset ({mins}m remaining)..."
                            # Sleep in 60s chunks so status stays fresh
                            slept = 0
                            while slept < reset_wait:
                                chunk = min(60, reset_wait - slept)
                                await asyncio.sleep(chunk)
                                slept += chunk
                                remaining = max(0, reset_wait - slept)
                                AterService._status[session_id] = f"⏳ Quota Reset ({int(remaining/60)}m remaining)..."
                            print("[Ater Service] ⏰ Reset window elapsed — retrying...")
                            continue  # Back to top of while True; get_permit will now succeed
                        raise de  # Wait too long or unknown — propagate

                    res = await self.llm.ainvoke(current_messages)

                    # Record actual tokens for accurate TPD accounting
                    try:
                        actual_tokens = None
                        if hasattr(res, 'response_metadata') and res.response_metadata:
                            usage = (
                                res.response_metadata.get('token_usage') or
                                res.response_metadata.get('usage') or {}
                            )
                            if isinstance(usage, dict):
                                actual_tokens = (
                                    usage.get('total_tokens') or
                                    (usage.get('prompt_tokens', 0) + usage.get('completion_tokens', 0))
                                ) or None
                        if actual_tokens and actual_tokens > 0:
                            self.governor.record_actual_usage(estimated_tokens, actual_tokens)
                    except Exception:
                        pass  # Never let telemetry corrections break generation

                    final_content += res.content
                    
                    finish_reason = res.response_metadata.get("finish_reason") if hasattr(res, "response_metadata") else None
                    if finish_reason in ("length", "max_tokens"):
                        current_messages.append(res)
                        current_messages.append(HumanMessage(content="Your response was cut off due to length. Continue generating EXACTLY where you left off, starting with the next word."))
                    else:
                        res.content = final_content
                        return res
            except Exception as e:
                if type(e).__name__ == "DailyLimitExceededException":
                    # This should be rare now — the inner loop handles wait-and-retry.
                    # If we still get here it means the wait exceeded 4h (real exhaustion).
                    print(f"[Ater Service] Daily Limit — wait exceeded max threshold: {e}")
                    AterService._rate_limited[session_id] = time.time()
                    AterService._status[session_id] = f"Paused (Daily Limit — 4h+ wait): {str(e)}"
                    # Do NOT raise immediately — sleep 30min then retry once more
                    await asyncio.sleep(1800)
                    attempt -= 1  # Don't count this as a retry attempt
                    continue
                
                last_error = e
                error_str = str(e)
                print(f"[Ater Service] AI Attempt {attempt} failed: {error_str[:200]}")

                is_rate_limit = any(x in error_str.lower() for x in ["429", "rate_limit", "rate limit", "exhausted", "capacity"])
                
                if is_rate_limit:
                    # Notify governor to trigger a hard cooldown for all workers
                    self.governor.report_error(wait_seconds=60.0)
                is_transient = is_rate_limit or any(
                    c in error_str.lower() for c in ["503", "524", "timeout", "overloaded", "connection", "disconnected"]
                )

                if is_transient and attempt < ATER_MAX_RETRIES:
                    # Rate limits get much longer waits: 30s, 60s, 120s, 240s...
                    if is_rate_limit:
                        backoff = min(30 * (2 ** (attempt - 1)), 300)  # cap at 5 min
                        label = f"Rate Limited (429). Waiting {backoff}s before retry {attempt+1}/{ATER_MAX_RETRIES}..."
                    else:
                        backoff = ATER_RETRY_BACKOFF * (2 ** (attempt - 1))
                        label = f"{self._classify_error(error_str)}. Retrying in {backoff}s ({attempt}/{ATER_MAX_RETRIES})..."

                    AterService._status[session_id] = label
                    print(f"[Ater Service] {label}")
                    await asyncio.sleep(backoff)
                else:
                    break

        raise last_error

    def _classify_error(self, error_str: str) -> str:
        if "429" in error_str: return "Rate Limited (429)"
        if "503" in error_str or "overloaded" in error_str.lower(): return "Server Overloaded (503)"
        if "524" in error_str or "timeout" in error_str.lower(): return "Gateway Timeout"
        return "Connection Error"

    def sync_secrets(self, secrets):
        """
        Updates the service's internal LLM clients and agents with new secrets.
        This allows the background worker to react to changes made in the UI
        settings (like switching providers or updating keys) without a restart.
        """
        # 1. Check if anything actually changed to avoid redundant re-initialization
        if (self.secrets.ai_key == secrets.ai_key and 
            self.secrets.ai_provider == secrets.ai_provider and
            self.secrets.ai_model == secrets.ai_model and
            getattr(self.secrets, "ai_base_url", None) == getattr(secrets, "ai_base_url", None) and
            getattr(self.secrets, "ai_max_tpm", None) == getattr(secrets, "ai_max_tpm", None) and
            getattr(self.secrets, "ai_max_rpm", None) == getattr(secrets, "ai_max_rpm", None) and
            getattr(self.secrets, "ai_max_tpd", None) == getattr(secrets, "ai_max_tpd", None) and
            getattr(self.secrets, "ai_max_rpd", None) == getattr(secrets, "ai_max_rpd", None) and
            getattr(self.secrets, "ai_max_concurrency", None) == getattr(secrets, "ai_max_concurrency", None) and
            self.secrets.planner_provider == secrets.planner_provider and
            self.secrets.planner_key == secrets.planner_key and
            self.secrets.planner_model == secrets.planner_model):
            return

        print(f"[Ater Service] Syncing new secrets: AI={secrets.ai_provider}, Planner={secrets.planner_provider}")
        self.secrets = secrets
        
        # 2. Update Governor
        if secrets.ai_key:
            self.governor.set_api_key(secrets.ai_key, provider=secrets.ai_provider, model=secrets.ai_model, base_url=secrets.ai_base_url)

        # 3. Re-initialize Core LLM
        self.llm = self._build_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.0,
            timeout=ATER_TIMEOUT,
            request_timeout=ATER_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if secrets.ai_key else None

        # 4. Re-initialize Planner LLM
        planner_provider = secrets.planner_provider or secrets.ai_provider
        planner_key = secrets.planner_key or secrets.ai_key
        planner_model = secrets.planner_model or secrets.ai_model
        
        self.planner_llm = self._build_model(
            provider=planner_provider,
            model_name=planner_model,
            api_key=planner_key,
            temperature=0.0,
            timeout=ATER_TIMEOUT,
            request_timeout=ATER_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if planner_key else self.llm

        # 5. Re-initialize Creative/Writer LLM
        self.llm_creative = self._build_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.0,
            timeout=ATER_TIMEOUT,
            request_timeout=ATER_TIMEOUT,
            max_retries=0,
            max_tokens=4096,
        ) if secrets.ai_key else None

        # 6. Update Agents
        if self.architect_agent: self.architect_agent.llm = self.llm
        if self.critic_agent: self.critic_agent.llm = self.llm_creative
        if self.hub_agent: self.hub_agent.llm = self.llm
        if self.epistemic_classifier_agent: self.epistemic_classifier_agent.llm = self.llm
        if self.verifier_agent: self.verifier_agent.llm = self.llm
        if self.meta_scanner_agent: self.meta_scanner_agent.llm = self.llm
        
        # Update structured output if needed
        if self.architect_agent and self.llm:
            try:
                self.architect_agent.llm_structured = self.llm.with_structured_output(SovereignPlan)
            except Exception: pass

    def swap_api_key(self, new_api_key: str) -> None:
        """
        Hot-swap the API key without restarting the server.
        Call this after the user sets a new key in Settings.
        The next LLM call will use the new key immediately.
        """
        try:
            print("[Ater Service] Swapping API key...")
            # Sanitize key aggressively to remove quotes, bearer prefix, newlines, and non-ascii
            clean_key = new_api_key.strip().strip("'\"").strip("\r\n").strip()
            if clean_key.lower().startswith("bearer "):
                clean_key = clean_key[7:].strip().strip("'\"").strip("\r\n").strip()
            clean_key = clean_key.encode('ascii', 'ignore').decode('ascii').strip()

            self.secrets.ai_key = clean_key
            self.secrets.planner_key = clean_key
            self.secrets.utility_key = clean_key

            self.governor.set_api_key(clean_key, provider=self.secrets.ai_provider, model=self.secrets.ai_model, base_url=self.secrets.ai_base_url)
            self.llm = self._build_model(
                provider=self.secrets.ai_provider,
                model_name=self.secrets.ai_model,
                api_key=clean_key,
                temperature=0.0,
                timeout=ATER_TIMEOUT,
                request_timeout=ATER_TIMEOUT,
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
                        SovereignPlan
                    )
                except Exception:
                    pass
            # Register new key with governor — resets sliding windows for fresh pacing
            self.governor.set_api_key(new_api_key)
            print("[Ater Service] API key swapped successfully.")
        except Exception as e:
            print(f"[Ater Service] Key swap failed: {e}")

    def get_paused_sessions(self) -> List[Dict[str, Any]]:
        """Returns all sessions that were paused due to a rate limit."""
        paused = []
        for sid, ts in AterService._rate_limited.items():
            session = AterService._sessions.get(sid, {})
            paused.append({
                "session_id": sid,
                "paused_at": ts,
                "current_batch": session.get("current_batch", 0),
                "total_batches": session.get("total_batches", 0),
                "status": AterService._status.get(sid, "rate_limited"),
            })
        return paused

    async def resume_paused_session(
        self, session_id: str, curriculum_override: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Resumes a session that was paused due to a rate limit.
        Safe to call even if the session is not paused (idempotent).
        """
        AterService._rate_limited.pop(session_id, None)
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
        # Standard location: database/study planner
        path = Path(self.secrets.vault_path) / "database" / "study planner"
        return path

    def list_available_options(self) -> Dict[str, List[str]]:
        """Returns all available options for Course, Semester, Year, Hubs, and Units from the vault."""
        base_path = Path(self.secrets.vault_path) / "database"
        
        def safe_glob(path, pattern):
            try: return [f.stem for f in path.glob(pattern) if not f.name.startswith("_")]
            except Exception: return []

        courses = safe_glob(base_path / "courses", "*.md")
        semesters = safe_glob(base_path / "semesters", "*.md")
        years = safe_glob(base_path / "years", "*.md")
        hubs = safe_glob(base_path / "study planner", "*.md")
        units = []
        try: units = [f.stem for f in (base_path / "study planner" / "_Units").glob("*.md")]
        except Exception: pass
        
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
                "path": file.relative_to(self.vm.vault_path).as_posix()
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
                print(f"[Ater Service] Error reading hub {file.name}: {e}")
            
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
        
        # 1. Try direct path (Academic Root)
        academic_unit_dir = self.vm.academic_root / semester / self.vm.get_canonical_title(course) / unit_folder_name
        if academic_unit_dir.exists():
            return academic_unit_dir
            
        # 2. Try alternate path (Search inside academic root)
        try:
            matches = list(self.vm.academic_root.rglob(unit_folder_name))
            if matches:
                for m in matches:
                    if m.is_dir():
                        return m
        except Exception:
            pass

        # 3. Try without semester (search inside academic root)
        try:
            matches = list(self.vm.academic_root.rglob(unit_folder_name))
                
            if matches:
                for m in matches:
                    if m.is_dir():
                        return m
        except Exception:
            pass

        # 4. Fallback to hub directory
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
                                    "path": file.relative_to(self.vm.vault_path).as_posix()
                                })
                        
                        return ordered_notes
            except Exception as e:
                print(f"[Ater Service] Connection extraction failed: {e}")

        # FALLBACK: If no connections section or extraction failed, list all files in the unit directory
        all_notes = []
        if unit_dir.exists():
            for file in unit_dir.glob("*.md"):
                # STRICT FILTER: Only atomic notes
                if file.name.endswith("_Hub.md") or "Possible_Questions" in file.name or "Practice" in file.name or file.name.startswith("_"):
                    continue
                if file.name == hub_path.name:
                    continue
                    
                all_notes.append({
                    "id": file.stem,
                    "title": file.stem.replace("_", " "),
                    "path": file.relative_to(self.vm.vault_path).as_posix()
                })
        
        # Sort alphabetically if unsorted
        all_notes.sort(key=lambda x: x["title"])
        return all_notes

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
                                "path": file.relative_to(self.vm.vault_path).as_posix(),
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
                    print(f"[Ater Service] Error reading practice {file.name}: {e}")
        
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
                    data["score"] = score
                    data["completed"] = True
                    new_yaml = yaml.dump(data, sort_keys=False)
                    new_content = f"---\n{new_yaml}---\n" + content[yaml_match.end():]
                    with open(p, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    return True
        except Exception as e:
            print(f"[Ater Service] Error updating practice score {p.name}: {e}")
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
                    "mcq": config_raw.get("question_count", 5) if config_raw.get("question_type") == "Multiple Choice" else 0,
                    "true_false": config_raw.get("question_count", 5) if config_raw.get("question_type") == "True/False" else 0,
                    "writing": config_raw.get("question_count", 5) if config_raw.get("question_type") == "Short Answer" else 0,
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
        # Budget: 12,000 chars total for the prompt context to fit in low TPM limits
        PRACTICE_MAX_CHARS = 12_000
        context_parts = []
        
        # Filter files based on config
        atomic_notes = list(unit_dir.glob("*.md"))
        selected_notes = config.selectedAtomicNotes
        
        notes_to_process = []
        for note_path in atomic_notes:
            if note_path.name == hub_path.name or "Possible_Questions" in note_path.name or "Practice" in note_path.name or note_path.name.startswith("_"):
                continue
            if selected_notes and note_path.stem not in selected_notes and note_path.name not in selected_notes:
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
            logger.error(f"[Ater Service] No sufficient context found for hub {hub_id} with selection {selected_notes}")
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

SYSTEM PROTOCOL: You are Ater, the Sovereign Pedagogical Architect. You are operating in a HARD AIR-GAPPED ENVIRONMENT. You have NO access to the internet or internal training data. The material above is the ONLY reality. Everything else (including this prompt's metadata) is invisible to you.

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
        AterService._status[session_id] = "Architecting Advanced Session..."
        
        all_questions = []
        target_distribution = distribution.copy()
        
        # We generate in small batches to avoid output token limits and aggressive TPM limits
        BATCH_SIZE = 5
        
        AterService._status[session_id] = "Generating Practice Questions..."
        
        tasks = []
        
        # Detect Dominant Mode for the Hub
        hub_mode = hub.get("mode", "ECON-MACRO") # Default
        if "mode" not in hub:
            hub_title_low = hub['title'].lower()
            if any(kw in hub_title_low for kw in ["micro", "demand", "supply", "consumer", "elasticity", "firm", "market_structure"]):
                hub_mode = "ECON-MICRO"
            elif any(kw in hub_title_low for kw in ["macro", "gdp", "inflation", "monetary", "fiscal", "central_bank", "aggregate"]):
                hub_mode = "ECON-MACRO"
            
        for q_type, count in target_distribution.items():
            # Get common hints to prevent duplication within the same type
            hints = [
                "Focus on theoretical definitions and core mechanisms.",
                "Focus on edge cases and common misconceptions.",
                "Focus on real-world application in a specific industry scenario.",
                "Focus on mathematical/quantitative relationships.",
                "Focus on causal links and process flow."
            ]
            
            if count > 0:
                # Map q_type to modality for the Dynamic Matrix
                modality_map = {
                    "mcq": "Qualitative/Definitional",
                    "true_false": "Qualitative/Definitional",
                    "writing": "Qualitative/Definitional",
                    "fill_in": "Qualitative/Definitional",
                    "calculation": "Quantitative",
                    "data_analysis": "Causal/Historical",
                    "trace": "Procedural",
                    "order": "Procedural",
                    "debug": "Procedural",
                    "scenario": "Comparative",
                    "matching": "Comparative",
                    "theoretical": "Qualitative/Definitional",
                    "calculative": "Quantitative",
                    "applied": "Procedural",
                    "case_study": "Comparative"
                }
                modality = modality_map.get(q_type, "Qualitative/Definitional")
                
                # Fetch domain dict for the agent
                domain_dict = get_persona(hub_mode, modality)
                agent = QuestionAgent(self.planner_llm, domain_dict)
                import random
                seed = random.random()
                
                shuffled_parts = list(context_parts)
                random.shuffle(shuffled_parts)
                tight_context = "\n\n".join(shuffled_parts)
                
                hint = random.choice(hints)
                prof_domain = get_professional_domain(hub['title'] + str(q_type), mode=hub_mode)
                current_diff = config.difficulty if config.difficulty != "Mixed" else "Mixed"

                tasks.append(lambda a=agent, h=hub, c=tight_context, d=current_diff, m=hub_mode, p=prof_domain, c_out=count, hint=hint, qt=q_type, s=seed: a.generate(
                    note_schema=NoteSchema(title=h['title'], description="", type="Atomic", source_pages=[1]), 
                    source_text=f"SEED: {s}\n" + c, 
                    mechanics=hint,
                    academic_level=d,
                    count=c_out,
                    prof_domain=p,
                    q_type=qt,
                    seed=str(s)
                ))
                
        # Sequential execution with per-task stagger to stay within TPM limits.
        # The Governor inside QuestionAgent already handles precise token pacing;
        # we serialise at this level to prevent burst storms on multi-type sessions.
        sem = asyncio.Semaphore(2)  # Max 2 concurrent QuestionAgent calls

        async def run_agent(task_fn):
            async with sem:
                max_retries = 5
                base_delay = 2.0
                for attempt in range(max_retries):
                    try:
                        return await task_fn()
                    except Exception as e:
                        err_msg = str(e)
                        is_rate = "429" in err_msg or "rate limit" in err_msg.lower()
                        if is_rate:
                            if attempt == max_retries - 1:
                                logger.error(f"[Ater Service] Max retries reached: {e}")
                                return {"error": "Rate limit exceeded after retries"}
                            import re as _re
                            m = _re.search(r'Please try again in ([0-9.]+)s', err_msg)
                            delay = float(m.group(1)) + 2.0 if m else base_delay * (2 ** attempt)
                            logger.warning(f"[Ater Service] 429 – waiting {delay:.1f}s (attempt {attempt+1})")
                            await asyncio.sleep(delay)
                        else:
                            logger.error(f"[Ater Service] Non-retryable error during generation: {e}")
                            return {"error": str(e)}

        results = await asyncio.gather(*(run_agent(t) for t in tasks), return_exceptions=True)
        
        all_questions = []
        for idx, res in enumerate(results):
            # QuestionAgent returns a list of questions (usually 1 in practice, 3 in batch)
            if isinstance(res, list):
                for q in res:
                    if isinstance(q, dict) and "error" not in q and q.get("answer") != "N/A":
                        q["id"] = len(all_questions) + 1
                        all_questions.append(q)
            elif isinstance(res, dict) and "error" not in res and res.get("answer") != "N/A":
                res["id"] = len(all_questions) + 1
                all_questions.append(res)
            else:
                logger.error(f"[Ater Service] Failed to generate a question: {res}")

        # FINAL HARD SLICE removed from here, done after post-processing
        
        # --- CRITICAL POST-PROCESSING ---
        # Ensure every question has a valid 'type' for the frontend to render
        processed_questions = []
        for q in all_questions:
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
                "socraticsynthesis": "synthesis",
                "calculation": "calculation",
                "data_analysis": "data_analysis",
                "scenario": "scenario",
                "code": "code",
                "trace": "trace"
            }
            
            q["type"] = mapping.get(q_raw_type, "writing")
            
            # Structural hard-fixes
            if q["type"] == "true_false":
                # Ensure answer is boolean or string representation of boolean
                if isinstance(q.get("answer"), str):
                    q["answer"] = q["answer"].lower() == "true"
                    
            # MCQ Option labeling and answer validation
            if q["type"] == "mcq" and isinstance(q.get("options"), (list, dict)):
                options = q["options"]
                if isinstance(options, list):
                    q["options"] = {chr(65+i): str(v) for i, v in enumerate(options)}
                elif isinstance(options, dict):
                    new_opts = {}
                    for i, (k, v) in enumerate(options.items()):
                        new_key = chr(65+i) if len(k) > 1 or k.isdigit() else k.upper()
                        new_opts[new_key] = str(v)
                    q["options"] = new_opts

                ans = str(q.get("answer", "")).upper()
                # Check if original answer matches one of the option values
                if ans not in q["options"]:
                    value_match = None
                    for k, v in q["options"].items():
                        if str(v).upper() == ans:
                            value_match = k
                            break
                    if value_match:
                        q["answer"] = value_match
                    else:
                        q["answer"] = list(q["options"].keys())[0] if q["options"] else "A"

            processed_questions.append(q)
        
        # Ensure strict distribution by slicing per type
        final_questions = []
        for q_type, count in target_distribution.items():
            type_qs = [q for q in processed_questions if q.get("type") == q_type]
            final_questions.extend(type_qs[:count])
        
        questions = final_questions
            
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        quiz_title = f"{hub['title']} - {config.difficulty} Mastery Session"
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

        # Clean academic markdown — no emojis, no decorations
        md_content = f"# Ater MASTERY SESSION: {hub['title'].upper()}\n\n"
        md_content += f"> Session ID: `{session_id}` | Date: {datetime.now().strftime('%Y-%m-%d')} | Difficulty: {config.difficulty}\n"
        md_content += f"> Scope: {selected_scope_str}\n\n"
        md_content += "## THE CHALLENGE\n\n"

        for idx, q in enumerate(questions, 1):
            q_text = q.get('question', '')
            if not q_text and q.get('type') == 'writing':
                q_text = q.get('answer', 'Analyze the following concept:')

            md_content += f"### Q{idx} | {(q.get('type') or 'mcq').replace('_', ' ').upper()}\n"
            md_content += f"{q_text}\n\n"

            if q.get('type') == 'mcq' and q.get('options'):
                for k, v in q['options'].items():
                    md_content += f"- [ ] **{k})** {v}\n"
            elif q.get('type') == 'true_false':
                md_content += "- [ ] True\n- [ ] False\n"
            elif q.get('type') == 'fill_in':
                md_content += f"> {q.get('textWithBlanks', '')}\n"
            elif q.get('type') in ('debug', 'code'):
                snippet = q.get('content') or q.get('codeSnippet', '')
                lang = q.get('language') or 'text'
                md_content += f"```{lang}\n{snippet}\n```\n"
            elif q.get('type') == 'order' and q.get('steps'):
                for step in q['steps']:
                    md_content += f"- [ ] {step}\n"
            elif q.get('type') == 'matching' and q.get('pairs'):
                import random as _random
                rights = [p.get('right', '') for p in q['pairs']]
                _random.shuffle(rights)
                md_content += "| Concept | Match |\n| :--- | :--- |\n"
                for pair in q['pairs']:
                    md_content += f"| {pair.get('left', '')} | __________ |\n"
                md_content += "\n**Options:** " + ", ".join([f"`{r}`" for r in rights]) + "\n"

            md_content += "\n---\n\n"

        md_content += "\n## SOLUTION KEY\n\n"
        md_content += "<details>\n<summary>Click to reveal answers</summary>\n\n"

        for idx, q in enumerate(questions, 1):
            md_content += f"#### Q{idx}\n"
            ans_val = q.get('answer')
            ans_str = ", ".join(str(x) for x in ans_val) if isinstance(ans_val, list) else str(ans_val)
            md_content += f"- **Answer:** `{ans_str}`\n"
            md_content += f"- **Explanation:** {q.get('explanation', 'N/A')}\n\n"

        md_content += "</details>\n\n"
        md_content += "## Session Data\n"
        md_content += "```json\n"
        md_content += json.dumps(questions, indent=2, ensure_ascii=False)
        md_content += "\n```\n"

        quiz_path.parent.mkdir(parents=True, exist_ok=True)
        with open(quiz_path, "w", encoding="utf-8") as f:
            f.write(yaml_frontmatter + md_content)

        AterService._status[session_id] = "Completed"
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

        # Require a minimum threshold to avoid weak matches
        # If the course matches, we get 15. If unit also matches, 25.
        # If course matches but unit MISMATCHES, we should stay at 15 or below.
        # We increase threshold to 20 if we want to be strict about units, 
        # or keep 15 but ensure unit mismatch is penalized.
        
        # Re-check for unit mismatch penalty
        for hub in hubs:
            unit_val = str(hub.get("unit", ""))
            if unit_val:
                # If we find a DIFFERENT unit in the sample, penalize this hub heavily
                other_units = [u for u in ["1","2","3","4","5","6","7","8","9"] if u != unit_val]
                for ou in other_units:
                    if f"unit {ou}" in sample or f"chapter {ou}" in sample:
                        # Find the match in the list and penalize it
                        if hub == best_match:
                            highest_score -= 20 # Knock it below threshold
        
        if highest_score >= 15:
            print(f"[Ater Service] Best hub match: {best_match['id']} (Score: {highest_score})")
            return best_match
        
        return None

    def _topological_sort_prerequisites(self, notes: List[dict]) -> List[dict]:
        """Breaks circular deps and creates a valid learning sequence via Kahn's algorithm."""
        title_set = {n["title"] for n in notes}
        note_map = {n["title"]: n for n in notes}

        # Clean graph: title -> list of prereq titles that exist in this batch (max 2)
        graph: Dict[str, List[str]] = {}
        for note in notes:
            raw = note.get("prerequisites") or []
            valid = [p.replace("[[", "").replace("]]", "") for p in raw
                     if p.replace("[[", "").replace("]]", "") in title_set]
            graph[note["title"]] = valid[:2]

        # Build reverse map (dependents) and in-degree count
        dependents: Dict[str, List[str]] = {t: [] for t in title_set}
        in_degree: Dict[str, int] = {t: 0 for t in title_set}
        for title, prereqs in graph.items():
            for prereq in prereqs:
                in_degree[title] += 1
                dependents[prereq].append(title)

        # Seed queue with root nodes (no in-batch prerequisites)
        queue = [note_map[t] for t in title_set if in_degree[t] == 0]
        sorted_notes: List[dict] = []

        while queue:
            node = queue.pop(0)
            sorted_notes.append(node)
            for dep_title in dependents.get(node["title"], []):
                in_degree[dep_title] -= 1
                if in_degree[dep_title] == 0:
                    queue.append(note_map[dep_title])

        # Remaining nodes have circular dependencies — strip prereqs and append
        sorted_titles = {n["title"] for n in sorted_notes}
        remaining = [n for n in notes if n["title"] not in sorted_titles]
        for r in remaining:
            print(f"[Ater] Circular prereq detected for '{r['title']}' — stripping prerequisites.")
            r["prerequisites"] = []
        sorted_notes.extend(remaining)

        return sorted_notes

    def _extract_source_snippet(self, source_text: str, concept_title: str, page_hint: int, used_examples: List[str] = None) -> str:
        """v33.0: Source Window Extractor — injects a coherent, concept-relevant passage.
        Strategy: Score paragraphs (not sentences) to find the richest context block,
        then return up to 3500 chars to maximize model grounding on weak LLMs.
        """
        source_text = re.sub(r"\[SOURCE EXCERPT\]", "", source_text or "", flags=re.IGNORECASE).strip()
        if len(source_text) <= 3500:
            return source_text

        readable_title = concept_title.replace("_", " ").lower()
        title_words = [w for w in readable_title.split() if len(w) > 3]

        # Split source into paragraphs for richer context chunks
        paragraphs = [p.strip() for p in re.split(r'\n{2,}', source_text) if len(p.strip()) > 80]

        if not paragraphs:
            # Fallback: sentence-level split
            paragraphs = [s.strip() for s in re.split(r'(?<=[.!?])\s+', source_text) if len(s.strip()) > 40]

        # Score paragraphs by title-word overlap
        scored = []
        for para in paragraphs:
            para_lower = para.lower()
            score = sum(1 for word in title_words if word in para_lower)

            # Penalize paragraphs that heavily overlap with already-used examples
            if used_examples:
                para_words = set(re.findall(r'\w+', para_lower))
                for ex in used_examples:
                    ex_words = set(re.findall(r'\w+', ex.lower()))
                    if not ex_words: continue
                    overlap = len(para_words.intersection(ex_words)) / len(ex_words)
                    if overlap > 0.5:
                        score -= 8  # Heavy penalty for repeated content

            scored.append((score, para))

        scored.sort(key=lambda x: x[0], reverse=True)

        # Build a context window: anchor paragraph + its neighbors in the original text
        if scored and scored[0][0] > 0:
            best_para = scored[0][1]
            anchor_idx = next((i for i, p in enumerate(paragraphs) if p == best_para), 0)
            # Include 1 paragraph before and 2 after for context flow
            window_start = max(0, anchor_idx - 1)
            window_end = min(len(paragraphs), anchor_idx + 3)
            window = "\n\n".join(paragraphs[window_start:window_end])
        else:
            # No match — use the beginning of the source (most likely to have definitions)
            window = source_text[:3500]

        # Cap at 3500 chars for token efficiency
        if len(window) > 3500:
            window = window[:3500]

        return window if window else source_text[:3500]

    def _compact_source_context(
        self,
        full_text: str,
        seed_context: str,
        title: str,
        source_pages: List[int],
        max_chars: int = 2600,
    ) -> str:
        """Build a deterministic, concept-local source packet for generation.

        The packet favors architect-selected pages, then title-matched text. It
        avoids whole-chapter prefixes so even tiny models receive one clean task.
        """
        seed = re.sub(r"\[SOURCE EXCERPT\]", "", seed_context or "", flags=re.IGNORECASE).strip()
        page_blocks = re.findall(
            r"\[PAGE\s+(\d+)\]\s*(.*?)(?=\n\[PAGE\s+\d+\]|\Z)",
            full_text or "",
            flags=re.DOTALL | re.IGNORECASE,
        )

        selected: List[str] = []
        wanted_pages = {int(p) for p in source_pages or [] if str(p).isdigit()}
        if wanted_pages:
            for page_no, page_text in page_blocks:
                if int(page_no) in wanted_pages:
                    selected.append(f"[PAGE {page_no}]\n{page_text.strip()}")

        candidate_text = "\n\n".join(selected) if selected else (full_text or "")
        snippet = self._extract_source_snippet(candidate_text, title, 0)
        packet_parts = [p for p in [seed, snippet] if p]
        packet = "\n\n".join(packet_parts)
        packet = re.sub(r"\s+", " ", packet).strip()
        if len(packet) > max_chars:
            packet = packet[:max_chars].rsplit(" ", 1)[0].strip()
        return packet or seed or snippet

    def _build_concept_source_packet(
        self,
        full_text: str,
        seed_context: str,
        title: str,
        source_pages: List[int],
        max_chars: int = 3200,
        max_pages: int = 4,
    ) -> Tuple[str, List[int]]:
        """Build a compact source packet plus multiple page anchors.

        This is the core 2B-model hardening step: the model sees a small,
        concept-local packet instead of a broad chapter slice, while metadata
        preserves all relevant PDF pages for jump/explain flows.
        """
        title_words = [
            w.lower()
            for w in re.findall(r"[A-Za-z][A-Za-z0-9+]*", title.replace("_", " "))
            if len(w) > 2
        ]
        wanted_pages = [int(p) for p in source_pages or [] if str(p).isdigit()]
        page_blocks = re.findall(
            r"\[PAGE\s+(\d+)\]\s*(.*?)(?=\n\[PAGE\s+\d+\]|\Z)",
            full_text or "",
            flags=re.DOTALL | re.IGNORECASE,
        )

        scored_pages: List[Tuple[int, int, str]] = []
        for page_no_raw, page_text in page_blocks:
            page_no = int(page_no_raw)
            lower = page_text.lower()
            score = sum(4 for w in title_words if w in lower)
            score += sum(1 for w in title_words if any(w in s.lower() for s in re.split(r"(?<=[.!?])\s+", page_text)))
            if page_no in wanted_pages:
                score += 12
            if score > 0:
                scored_pages.append((score, page_no, page_text.strip()))

        selected_pages: List[int] = []
        for p in wanted_pages:
            if p not in selected_pages:
                selected_pages.append(p)

        for _score, page_no, _text in sorted(scored_pages, key=lambda item: (-item[0], item[1])):
            if page_no not in selected_pages:
                selected_pages.append(page_no)
            if len(selected_pages) >= max_pages:
                break

        if not selected_pages and page_blocks:
            selected_pages = [int(page_blocks[0][0])]

        page_map = {int(p): text for p, text in page_blocks}
        packet_parts = []
        seed = re.sub(r"\[SOURCE EXCERPT\]", "", seed_context or "", flags=re.IGNORECASE).strip()
        if seed:
            packet_parts.append(f"[ARCHITECT SOURCE HINT]\n{seed}")

        per_page_budget = max(500, max_chars // max(1, len(selected_pages)))
        for page_no in selected_pages:
            page_text = page_map.get(page_no, "")
            snippet = self._extract_source_snippet(page_text, title, page_no)
            if len(snippet) > per_page_budget:
                snippet = snippet[:per_page_budget].rsplit(" ", 1)[0].strip()
            if snippet:
                packet_parts.append(f"[PAGE {page_no}]\n{snippet}")

        packet = "\n\n".join(packet_parts)
        packet = re.sub(r"[ \t]+", " ", packet).strip()
        if len(packet) > max_chars:
            packet = packet[:max_chars].rsplit(" ", 1)[0].strip()

        source_page_anchors = sorted(set(int(p) for p in selected_pages if str(p).isdigit()))
        return packet or self._compact_source_context(full_text, seed_context, title, source_pages, max_chars), source_page_anchors

    def get_active_academic_context(self) -> Dict[str, str]:
        """Reads the vault to find the currently active semester and year."""
        try:
            semesters_path = Path(self.secrets.vault_path) / "database" / "semesters"
            if not semesters_path.exists(): return {}
            
            active_sem = None
            for f in semesters_path.glob("*.md"):
                if f.name.startswith("_"): continue
                with open(f, "r", encoding="utf-8") as file:
                    content = file.read()
                    data, _, err = self.vm.extract_yaml_and_content(content)
                    if not err and str(data.get("Status", "")).lower() in ("[[active]]", "active"):
                        active_sem = f.stem
                        break
            
            years_path = Path(self.secrets.vault_path) / "database" / "years"
            active_year = None
            if years_path.exists():
                for f in years_path.glob("*.md"):
                    if f.name.startswith("_"): continue
                    with open(f, "r", encoding="utf-8") as file:
                        content = file.read()
                        data, _, err = self.vm.extract_yaml_and_content(content)
                        if not err and (data.get("Current Year") is True or str(data.get("Current Year")).lower() == "true"):
                            active_year = f.stem
                            break
            
            return {"semester": active_sem or "", "year": active_year or ""}
        except Exception as e:
            print(f"[Ater Service] Failed to retrieve academic context: {e}")
            return {}

    # ── Phase 1: Detection ──────────────────────────────────────
    async def detect_curriculum(self, file_path: str) -> Dict[str, Any]:
        """Phase 1: Pure detection + AI-assisted metadata extraction if no hub match."""
        try:
            path = Path(file_path)
            content_text = ""
            
            if path.suffix.lower() == ".pdf":
                loader = PyPDFLoader(str(path))
                # Load first 10 pages for better context coverage
                pages = await asyncio.to_thread(loader.load_and_split)
                content_text = "\n".join([p.page_content for p in pages[:10]])
            else:
                def _read_text():
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        return f.read(20000)
                content_text = await asyncio.to_thread(_read_text)

            # Try to match an existing hub
            target_hub = self.find_best_hub_match(content_text)
            
            # --- SMART ACADEMIC CONTEXT ---
            academic_context = self.get_active_academic_context()
            
            # If no hub match, or if it matched but course seems wrong, use AI to detect
            detected_curriculum = await self._detect_metadata_with_ai(content_text, academic_context)
            
            # --- SMART VAULT AWARENESS ---
            # 1. If target_hub exists, trust its internal metadata above all else
            if target_hub:
                h_unit = str(target_hub.get("unit", "")).strip()
                ai_unit = str(detected_curriculum.get("unit", "")).strip()
                
                # If units explicitly mismatch, don't anchor to this hub
                if h_unit and ai_unit and h_unit != ai_unit:
                    print(f"[Ater Service] Unit mismatch detected (Hub: {h_unit}, AI: {ai_unit}). Dropping anchored hub.")
                    target_hub = None
                else:
                    h_course = target_hub.get("course")
                    h_semester = target_hub.get("semester")
                    h_year = target_hub.get("year")
                    
                    if h_course: detected_curriculum["course"] = h_course
                    if h_semester: detected_curriculum["semester"] = h_semester
                    if h_year: detected_curriculum["year"] = h_year
                    
                    print(f"[Ater Service] Smart-Anchor: Inherited metadata from Hub '{target_hub['id']}' -> {detected_curriculum['course']} | {detected_curriculum['semester']}")

            # 2. If we have a course (from AI or Hub) but missing semester/year, look at the Course Master
            if detected_curriculum.get("course"):
                course_name = detected_curriculum["course"]
                # Handle wiki-links in course name
                clean_course_name = self.vm.super_clean(course_name)
                course_file = Path(self.secrets.vault_path) / "database" / "courses" / f"{clean_course_name}.md"
                
                if course_file.exists():
                    try:
                        with open(course_file, "r", encoding="utf-8") as f:
                            c_data, _, c_err = self.vm.extract_yaml_and_content(f.read())
                            if not c_err:
                                # Update detected curriculum - PRIORITIZE VAULT over AI detection for known courses
                                v_semester = self._clean_prop(c_data.get("semester") or c_data.get("Semester"))
                                v_year = self._clean_prop(c_data.get("year") or c_data.get("Year"))
                                
                                if v_semester:
                                    detected_curriculum["semester"] = v_semester
                                if v_year:
                                    detected_curriculum["year"] = v_year
                                    
                                print(f"[Ater Service] Smart-Aware: Synced Course '{clean_course_name}' settings from Vault (Priority).")
                    except Exception as e:
                        print(f"[Ater Service] Recursive course lookup failed: {e}")

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
                        print(f"[Ater Service] Creating smart-synced stub hub: {hub_filename}")
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
                            f"> Auto-created smart-synced stub by Ater.\n"
                        )
                        with open(hub_file_path, "w", encoding="utf-8") as f:
                            f.write(stub_yaml)
                    
                    target_hub = {
                        "id": hub_filename,
                        "title": f"{unit_num} {hub_title} Hub" if unit_num else f"{hub_title} Hub",
                        "path": hub_file_path.relative_to(self.vm.vault_path).as_posix(),
                        "course": course,
                        "unit": unit_num,
                        "semester": semester,
                        "year": year
                    }
                    print(f"[Ater Service] Anchored to smart-synced hub: {hub_filename}")

            return {
                "anchored_hub": target_hub,
                "detected_curriculum": detected_curriculum,
                "available_hubs": self.list_planner_hubs(),
                "available_options": self.list_available_options(),
                "status": "detected"
            }
        except Exception as e:
            err_trace = traceback.format_exc()
            print(f"[Ater Service] Detection failed: {e}\n{err_trace}")
            return {
                "status": "error",
                "message": f"Detection Failed: {str(e)}",
                "trace": err_trace
            }

    async def _detect_metadata_with_ai(self, text: str, academic_hint: Dict[str, str] = None) -> Dict[str, str]:
        """Uses AI to extract course, semester, year, unit, and hub_title from text.
        
        Critically important: year, course and semester must match EXACT stems from the vault
        database files (courses / semesters / years). The AI is shown these exact names
        and instructed to pick the CLOSEST match. If nothing matches, it invents a new value.
        """
        options = self.list_available_options()
        
        # Build numbered option lists so AI can pick by index or name
        course_list = "\n".join(f"  {i+1}. \"{c}\"" for i, c in enumerate(options['courses']))
        semester_list = "\n".join(f"  {i+1}. \"{s}\"" for i, s in enumerate(options['semesters']))
        year_list = "\n".join(f"  {i+1}. \"{y}\"" for i, y in enumerate(options.get('years', [])))
        hub_list = "\n".join(f"  {i+1}. \"{h}\"" for i, h in enumerate(options.get('hubs', [])))
        
        hint_str = ""
        if academic_hint:
            h_sem = academic_hint.get("semester")
            h_yr = academic_hint.get("year")
            if h_sem or h_yr:
                hint_str = f"ACTIVE ACADEMIC CONTEXT (High Priority Hint):\n- Active Semester: {h_sem}\n- Active Year: {h_yr}\n\n"

        prompt = (
            "You are a Senior Academic Librarian. Your task is to analyze the following document excerpt and categorize it into the most appropriate academic hierarchy.\n\n"
            f"{hint_str}"
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
            await self.governor.get_permit(expected_tokens=3000)
            res = await self.llm.ainvoke([HumanMessage(content=prompt)])
            data = ArchitectAgent._parse_json(res.content)
            
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
            
            # --- CARTOGRAPHER PRIME: AUTONOMOUS TAXONOMY GROWTH ---
            if final_course not in options['courses'] and final_course.lower() not in ("unknown", "general", ""):
                try:
                    from .agents import TaxonomyExtenderAgent
                    print(f"[Ater Service] New Domain Detected: '{final_course}'. Activating Cartographer Prime...")
                    cartographer = TaxonomyExtenderAgent(self.llm)
                    # Analyze first few chunks to understand the domain
                    growth_res = await cartographer.analyze_new_domain(final_course, text[:15000])
                    
                    if growth_res.get("status") == "success":
                        domain_logic = growth_res.get("domain_logic", {})
                        print(f"[Ater Service] Taxonomy Extended for '{final_course}': {domain_logic.get('persona', 'Standard Librarian')}")
                        # In a real system, we'd persist this to keywords.py or a dynamic DB.
                        # For now, we log the success and use the suggested persona in planning.
                except Exception as e:
                    print(f"[Ater Service] Cartographer Prime failed: {e}")

            # --- SMART FALLBACK ---
            # If AI is unsure, use the Active Academic Context (Dashboard)
            if academic_hint:
                if final_semester.lower() in ("unknown", "general", "") and academic_hint.get("semester"):
                    final_semester = academic_hint["semester"]
                    print(f"[Ater Service] Fallback: Using Dashboard Semester -> {final_semester}")
                if final_year.lower() in ("unknown", "general", "") and academic_hint.get("year"):
                    final_year = academic_hint["year"]
                    print(f"[Ater Service] Fallback: Using Dashboard Year -> {final_year}")

            print(f"[Ater Service] AI detected: year='{final_year}', course='{final_course}', semester='{final_semester}', unit='{data.get('unit')}', hub='{data.get('hub_title')}', language='{data.get('primary_language', 'General')}'")
            
            return {
                "year": final_year,
                "course": final_course,
                "semester": final_semester,
                "unit": data.get("unit"),
                "hub_title": data.get("hub_title"),
                "primary_language": data.get("primary_language", "General")
            }

        except Exception as e:
            print(f"[Ater Service] AI Metadata detection failed: {e}")
            return {"course": "", "semester": "", "unit": "", "hub_title": "", "primary_language": "General"}

    # ── Phase 2: Planning ──────────────────────────────────────
    async def generate_plan(
        self, file_path: str, system_instruction_path: str, curriculum: Dict[str, Any], target_hub_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Phase 2: AI Planning using LOCKED metadata from the user."""
        path = Path(file_path)
        session_id = str(path.absolute())
        
        # Clear any existing session
        AterService._sessions.pop(session_id, None)
        
        # Read full content for planning
        full_text = ""
        if path.suffix.lower() == ".pdf":
            loader = PyPDFLoader(str(path))
            pages = await asyncio.to_thread(loader.load_and_split)
            full_text = "\n".join([f"[PAGE {p.metadata.get('page', 0) + 1}]\n{p.page_content}" for p in pages])
        else:
            def _read_full():
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()
            full_text = await asyncio.to_thread(_read_full)

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

        # Phase 1.4: Intelligent Routing Selection
        # We try the fast deterministic router first to save time and tokens.
        self.set_status(session_id, "Analyzing Domain (Fast Track)...")
        fast_mode = router.route(full_text, course=course)
        
        self.set_status(session_id, "Oracle Context Briefing...")
        context_briefing_data = await self.meta_scanner_agent.scan_full_text(full_text)
        from .schemas import ContextBriefing
        context_briefing = ContextBriefing(**context_briefing_data)
        print(f"[Ater Service] Oracle Briefing: {context_briefing.primary_discipline}")

        if fast_mode != "DOMAIN-UNKNOWN":
            detected_mode = normalize_mode(fast_mode)
            print(f"[Ater Service] Fast Router Confirmed: {detected_mode}")
        else:
            self.set_status(session_id, "Oracle Domain Routing...")
            detected_mode = normalize_mode(await router.route_with_oracle(
                self.planner_llm, 
                context_briefing.model_dump(), 
                full_text, 
                course=course
            ))
            print(f"[Ater Service] Oracle Router Detected: {detected_mode}")

        # Invoke Architect Agent
        self.set_status(session_id, "Architecting Sovereign Plan...")
        
        # Build prompt enrichment with metadata and healing info
        context_enrichment = (
            f"CURRICULUM LOCK:\n- Course: {course}\n- Semester: {semester}\n- Unit: {unit_num}\n- Hub: {hub_title}\n"
        )
        if existing_notes:
            context_enrichment += f"\nEXISTING NOTES (Do not re-plan): {', '.join(existing_notes)}\n"

        context_enrichment += (
            f"\nGLOBAL CONTEXT BRIEFING:\n{context_briefing.summary}\n"
            f"PRIMARY DISCIPLINE: {context_briefing.primary_discipline}\n"
            f"CORE KEYWORDS: {', '.join(context_briefing.keywords)}\n\n"
            f"LAW OF COGNITIVE ANCHORING:\n"
            f"All atomic concepts generated in this plan MUST be assigned the mode '{detected_mode}'. "
            f"You are STRICTLY FORBIDDEN from assigning any other mode.\n"
        )

        primary_language = curriculum.get("primary_language", "General")
        if course == "Computer Programming" and primary_language == "General":
            primary_language = "C++"
        
        # --- CHUNKING LOGIC ---
        chunk_size = 12000
        text_chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)] or [full_text]
        all_atomic_notes = []
        all_pq_notes = []
        seen_titles = set(existing_notes)
        
        extracted_course_title = "Unknown"
        extracted_academic_level = "Unknown"
        extracted_epistemic_stance = "Unknown"
        
        for idx, chunk in enumerate(text_chunks):
            self.set_status(session_id, f"Architecting Plan (Chunk {idx+1}/{len(text_chunks)})...")
            print(f"[Ater Service] Processing chunk {idx+1}/{len(text_chunks)}")
            try:
                await self.governor.get_permit(expected_tokens=len(chunk) + 1000)

                partial_plan = await self.architect_agent.generate_partial_plan(
                    f"{context_enrichment}\n\nSOURCE TEXT CHUNK:\n{chunk}",
                    forced_mode=detected_mode
                )
                
                # Capture global curriculum meta from the first successful chunk
                if idx == 0 or extracted_course_title == "Unknown":
                    extracted_course_title = partial_plan.course_title or "Unknown"
                    extracted_academic_level = partial_plan.academic_level or "Unknown"
                    extracted_epistemic_stance = partial_plan.epistemic_stance or "Unknown"
                
                if not partial_plan.atomic_notes:
                    print(f"[Ater Service] Chunk {idx+1} returned zero notes. Context might be irrelevant.")
                    continue

                # Merge notes, avoiding duplicates
                for note in partial_plan.atomic_notes:
                    # Normalize title for cross-session idempotency comparison
                    norm_title = note.title
                    if norm_title not in seen_titles:
                        # Law of Cognitive Anchoring: Enforced in generation phase
                        note.mode = normalize_mode(detected_mode)
                        
                        note_dict = note.model_dump()
                        
                        # SOURCE ENRICHMENT: keep a tight, concept-local window. Older
                        # builds appended the first 3k chars of the chapter chunk, which
                        # caused weak models and the deterministic fallback to copy
                        # unrelated slide text into every note.
                        source_packet, source_page_anchors = self._build_concept_source_packet(
                            full_text=full_text,
                            seed_context=note_dict.get("source_context") or "",
                            title=note_dict.get("title") or "",
                            source_pages=note_dict.get("source_pages") or [],
                        )
                        note_dict["source_context"] = source_packet
                        note_dict["source_pages"] = source_page_anchors
                        
                        print(f"[Ater Service] Adding concept: {note.title} (Mode: {note.mode})")
                        all_atomic_notes.append(note_dict)
                        seen_titles.add(norm_title)
                    else:
                        print(f"[Ater Service] Cross-session idempotency: '{note.title}' already in vault or plan. Skipping.")


                for pq in partial_plan.possible_questions:
                    if pq.title not in seen_titles:
                        print(f"[Ater Service] Adding PQ: {pq.title}")
                        all_pq_notes.append(pq.model_dump())
                        seen_titles.add(pq.title)
                        
            except Exception as e:
                err_trace = traceback.format_exc()
                try:
                    debug_log_path = Path.home() / ".ater" / "logs" / "chunk_failures.log"
                    debug_log_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(debug_log_path, "a", encoding="utf-8") as _f:
                        _f.write(json.dumps({
                            "sessionId": session_id,
                            "chunkIndex": idx+1,
                            "errorType": type(e).__name__,
                            "error": str(e)[:500],
                            "timestamp": int(time.time()*1000)
                        }) + "\n")
                except Exception:
                    pass
                print(f"[Ater Service] CRITICAL: Chunk {idx+1} failed validation: {e}\n{err_trace}")
                self.set_status(session_id, f"Load Failed during Architecting: {str(e)}")
                raise e

        # Deduplicate Plan
        try:
            from .post_processing import deduplicate_plan
            print(f"[Ater Service] Deduplicating {len(all_atomic_notes)} concepts...")
            all_atomic_notes = deduplicate_plan(all_atomic_notes)

            # ── READING-ORDER SORT (v32.1) ──────────────────────────────────────────
            # Sort by the MINIMUM page number from source_pages so that note deployment
            # and hub connections mirror the exact reading order of the textbook PDF.
            # Notes with no source_pages are pushed to the end (page 9999).
            def _min_page(note_dict):
                pages = note_dict.get("source_pages", []) or []
                return min((int(p) for p in pages if str(p).isdigit()), default=9999)

            all_atomic_notes.sort(key=_min_page)
            print(f"[Ater Service] Reading-order sort applied. First note: {all_atomic_notes[0]['title'] if all_atomic_notes else 'N/A'}")

            # all_atomic_notes = self._topological_sort_prerequisites(all_atomic_notes)

            # Phase 1.5: Epistemic Classification (HYDRA)
            self.set_status(session_id, "Classifying Concept Modalities...")
            classifications = await self.epistemic_classifier_agent.classify_batch(all_atomic_notes)
            for note in all_atomic_notes:
                modality = classifications.get(note["title"], "Qualitative/Definitional")
                note["concept_modality"] = modality
                print(f"[Ater Service] Epistemic Congruence: {note['title']} -> {modality}")
        except Exception as e:
            print(f"[Ater Service] Deduplication / Sorting / Classification failed: {e}")

        if not all_atomic_notes:
            fallback_title = self.validator.sanitize_title(hub_title or "Source Overview")
            source_packet, source_page_anchors = self._build_concept_source_packet(
                full_text=full_text,
                seed_context=full_text[:1000],
                title=fallback_title,
                source_pages=[],
            )
            all_atomic_notes = [{
                "title": fallback_title,
                "description": "Deterministic source overview created because the planner returned no atomic concepts.",
                "source_context": source_packet,
                "source_pages": source_page_anchors,
                "prerequisites": [],
                "concept_modality": "Qualitative/Definitional",
                "mode": normalize_mode(detected_mode),
            }]
            print(f"[Ater Service] Planner returned no notes. Added fallback concept: {fallback_title}")

        # Synthesize the Hub Note with strict Title_Case_With_Underscores
        hub_base = self.validator.sanitize_title(hub_title.replace(" Hub", "").replace("_Hub", ""))
        
        # Prevent redundant prefixing (e.g. 5_5_Modular_Programming)
        unit_prefix = f"{unit_num}_" if unit_num else ""
        if unit_num and (hub_base.startswith(unit_prefix) or hub_base.startswith(f"{unit_num} ")):
            canonical_hub_title = f"{hub_base}_Hub"
        else:
            canonical_hub_title = f"{unit_prefix}{hub_base}_Hub"

        # Sanitize all atomic note titles in the plan
        for note in all_atomic_notes:
            note["title"] = self.validator.sanitize_title(note["title"])
            note["mode"] = normalize_mode(note.get("mode"), detected_mode)
            if "prerequisites" in note:
                note["prerequisites"] = self.validator.sanitize_prerequisites(note["prerequisites"])
        
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
            "course_title": extracted_course_title,
            "academic_level": extracted_academic_level,
            "epistemic_stance": extracted_epistemic_stance,
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
            "processed_notes": [],
            "target_hub": next((h for h in self.list_planner_hubs() if h["id"] == target_hub_id), None) if target_hub_id else None,
            "messages": [] # We don't need to persist messages anymore if we use the Agent pattern
        }
        
        AterService._sessions[session_id] = session_data
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
        import asyncio
        session = await self._get_or_restore_session(session_id)
        if not session:
            raise ValueError(f"No active session found for {session_id}. Please restart the file process.")
        
        # Apply overrides if provided (usually on Batch 1)
        if curriculum_override:
            print(f"[Ater Service] Applying Curriculum Overrides & Syncing to Vault: {curriculum_override}")
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
                            print(f"[Ater Service] Synchronized properties to {hub_path.name}")
                    except Exception as e:
                        print(f"[Ater Service] Hub sync failed: {e}")
        
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
            course = plan_obj.course
            semester = plan_obj.semester
            unit_num = plan_obj.unit
            hub_title = plan_obj.hub_title
            
            if "all_note_probes" not in session:
                session["all_note_probes"] = {}
            
            if "used_scenarios" not in session:
                session["used_scenarios"] = []
            
            if "used_examples" not in session:
                session["used_examples"] = []

            async def run_single_batch(b_num, b_type, b_notes):
                # Ensure we have a slot for this batch (Singularity Parallel Protocol)
                await self.governor.acquire_slot()
                try:
                    nonlocal deployment_results
                    local_results = []
                    
                    if b_type == "atomic":
                        current_note_title = b_notes[0] if b_notes else ""
                        
                        # ── IDEMPOTENCY CHECK (v32.1 Singularity) ──
                        # Compute target path and check if it already exists
                        target_path = self.vm.get_note_path({"title": current_note_title, "type": "atomic_note"}, session_metadata=session["metadata"])
                        if target_path.exists():
                            print(f"[Ater Service] Idempotency Hit: [[{current_note_title}]] already exists. Skipping.")
                            if current_note_title not in session.get("processed_notes", []):
                                session.setdefault("processed_notes", []).append(current_note_title)
                            return True

                        # --- NEW AGENT-BASED ATOMIC GENERATION WITH VALIDATION LOOP ---
                        note_schema_dict = next((n for n in session["metadata"].get("atomic_notes", []) if n["title"] == current_note_title), None)
                        
                        if not note_schema_dict:
                            note_schema = AtomicNoteSchema(title=current_note_title, description="Generated concept", source_context="")
                        else:
                            note_schema = AtomicNoteSchema(**note_schema_dict)

                        modality = getattr(note_schema, 'concept_modality', 'Qualitative/Definitional')
                        domain = get_persona(note_schema.mode, modality)
                        source_snippet = self._extract_source_snippet(
                            note_schema.source_context or "No context", 
                            note_schema.title, 
                            0,
                            used_examples=session.get("used_examples", [])
                        )
                        note_data = {
                            "title": note_schema.title,
                            "course": course,
                            "unit": unit_num,
                            "semester": semester,
                            "mode": note_schema.mode,
                            "date": datetime.now().strftime("%Y-%m-%d"),
                            "prerequisites": note_schema.prerequisites,
                            "source_pages": note_schema.source_pages,
                            "h1_title": domain.get("h1", "The Core Logic Explained"),
                            "h2_title": domain.get("h2", "The Textbook Translation"),
                            "artifact_title": domain.get("artifact", "Source Artifact"),
                            "artifact_type": domain.get("type", "Markdown Table"),
                            "section_plan": build_dynamic_section_plan(domain, modality),
                            "hub": f"[[{plan_obj.hub_note.title}]]",
                            "source": self._get_source_link(plan_obj, session.get("path", ""))
                        }
                        
                        generation_attempts = 0
                        last_candidate_markdown = None
                        max_generation_attempts = 3
                        
                        while True:
                            generation_attempts += 1
                            current_temp = 0.0
                            current_topp = 0.9
                                
                            phase_prefix = f"(Attempt {generation_attempts}, Temp={current_temp:.2f})" if generation_attempts > 1 else ""
                            
                            if generation_attempts > max_generation_attempts:
                                # Keep weak models deterministic: after bounded retries, use the
                                # source-grounded compiler instead of increasing randomness.
                                logger.warning(f"[Ater Service] Max attempts reached for '{current_note_title}'. Deploying deterministic skeleton fallback.")
                                self.set_status(session_id, f"⚠️ Max attempts reached: Deploying fallback skeleton for [[{current_note_title}]]...")
                                
                                skeleton_body = build_skeleton_note(note_schema, source_snippet, domain, all_titles=all_note_titles)
                                metadata = {
                                    "title": note_schema.title,
                                    "course": course,
                                    "unit": str(unit_num),
                                    "semester": semester,
                                    "mode": note_schema.mode,
                                    "type": "atomic_note",
                                    "hub": f"[[{plan_obj.hub_note.title}]]",
                                    "source": self._get_source_link(plan_obj, session.get("path", "")),
                                    "date": datetime.now().strftime("%Y-%m-%d"),
                                    "prerequisites": note_schema.prerequisites,
                                    "source_pages": note_schema.source_pages,
                                    "generated": True,
                                    "skeleton_fallback": True
                                }
                                yaml_frontmatter = self.vm.dump_obsidian_yaml(metadata)
                                final_markdown = f"---\n{yaml_frontmatter}---\n{skeleton_body}"
                                
                                local_results = self.deployer.deploy_atomic_notes(
                                    session_id, [current_note_title], [final_markdown], plan_obj, session.get("path", "")
                                )
                                if current_note_title not in session.get("processed_notes", []):
                                    session.setdefault("processed_notes", []).append(current_note_title)
                                self._persist_session(session_id, session)
                                break
                            
                            try:
                                # Dynamic LLMs: one precise for structures, one creative for prose/explanations
                                temp_llm = self._build_model(
                                    provider=self.secrets.ai_provider,
                                    model_name=self.secrets.ai_model,
                                    api_key=self.secrets.ai_key,
                                    temperature=current_temp,
                                    top_p=current_topp,
                                    timeout=ATER_TIMEOUT,
                                    request_timeout=ATER_TIMEOUT,
                                    max_retries=0,
                                    max_tokens=4096,
                                ) if self.secrets.ai_key else self.llm
                                
                                temp_llm_creative = self._build_model(
                                    provider=self.secrets.ai_provider,
                                    model_name=self.secrets.ai_model,
                                    api_key=self.secrets.ai_key,
                                    temperature=max(0.3, current_temp), # minimum 0.3 creative floor
                                    top_p=current_topp,
                                    timeout=ATER_TIMEOUT,
                                    request_timeout=ATER_TIMEOUT,
                                    max_retries=0,
                                    max_tokens=4096,
                                    presence_penalty=0.1,
                                    frequency_penalty=0.1,
                                ) if self.secrets.ai_key else self.llm_creative
                                
                                theory_agent = TheoryAgent(temp_llm_creative, domain)
                                practitioner_agent = PractitionerAgent(temp_llm, domain)

                                # ── EXOSKELETON ASSEMBLER v29.0 (HYDRA) ──
                                
                                note_data.update({
                                    "h1_title": domain.get("h1", "The Core Logic Explained"),
                                    "h2_title": domain.get("h2", "The Textbook Translation"),
                                    "artifact_title": domain.get("artifact", "Source Artifact"),
                                    "artifact_type": domain.get("type", "Markdown Table"),
                                    "section_plan": build_dynamic_section_plan(domain, modality),
                                })

                                # 1. Micro-Theory Pass
                                self.set_status(session_id, f"{phase_prefix} Theory: [[{current_note_title}]]...")
                                await self.governor.get_permit(expected_tokens=4000)
                                
                                # THIN CONTEXT: Limit concept list to immediate prerequisites + unit neighbors
                                prereqs = note_schema.prerequisites or []
                                neighbors = all_note_titles[:15] # Just a sample of the unit's concepts
                                thin_concepts = ", ".join([f"[[{t}]]" for t in set(prereqs + neighbors)])

                                # Extract top sentences from source with Stateful Entropy
                                source_snippet = self._extract_source_snippet(
                                    note_schema.source_context or "No context", 
                                    note_schema.title, 
                                    0,
                                    used_examples=session.get("used_examples", [])
                                )

                                theory_parts = await theory_agent.generate_micro(
                                    note_schema, 
                                    source_snippet, 
                                    thin_concepts,
                                    used_scenarios=session.get("used_scenarios", []),
                                    academic_level=plan_obj.academic_level,
                                    course_title=plan_obj.course_title,
                                    max_tokens=6000
                                )
                                # Initialize healer early to clean theory parts before passing to practitioner
                                healer = LogicHealer(canonical_titles=set(all_note_titles))
                                if "mental_model" in theory_parts:
                                    theory_parts["mental_model"] = healer.heal_all(theory_parts["mental_model"], exclude_title=current_note_title)
                                if "core_logic" in theory_parts:
                                    theory_parts["core_logic"] = healer.heal_all(theory_parts["core_logic"], exclude_title=current_note_title)
                                if "formal_model" in theory_parts:
                                    theory_parts["formal_model"] = healer.heal_all(theory_parts["formal_model"], exclude_title=current_note_title)

                                # Pre-render Length Gates (Phase 3.2)
                                if len(theory_parts.get("mental_model", "")) < 80:
                                    raise ValueError(f"Analogy section 'mental_model' failed length gate (<80 chars) for {current_note_title}")
                                if len(theory_parts.get("core_logic", "")) < 30:
                                    raise ValueError(f"Core breakdown section 'core_logic' failed length gate (<30 chars) for {current_note_title}")

                                note_data.update(theory_parts)
                                
                                # Track example/scenario to prevent reuse
                                if source_snippet and len(source_snippet) > 50:
                                    session["used_examples"].append(source_snippet[:200])
                                if "mental_model" in theory_parts:
                                    # Extract first 3 words of analogy as a 'scenario signature'
                                    words = re.findall(r'\w+', theory_parts["mental_model"].lower())
                                    if len(words) > 3:
                                        session["used_scenarios"].append(" ".join(words[:3]))
                                
                                # 2. Micro-Execution (The Systems Breaker)
                                self.set_status(session_id, f"{phase_prefix} Execution: [[{current_note_title}]]...")
                                await self.governor.get_permit(expected_tokens=3000)
                                prac_parts = await practitioner_agent.generate_micro(
                                    note_schema.title, 
                                    note_data.get("core_logic", ""), 
                                    primary_language, 
                                    note_schema.mode,
                                    source_text=source_snippet,  # v33.0: source-grounded artifact
                                    academic_level=plan_obj.academic_level,
                                    course_title=plan_obj.course_title,
                                    max_tokens=8000,
                                    plain_english=note_data.get("mental_model", "")
                                )
                                note_data.update(prac_parts)
                                note_data["dynamic3_content"] = prac_parts.get("limitations", "")
                                # 3. Micro-Question Pass (Dynamic Assessment)
                                # v33.0: Compressed context — saves ~8k tokens per note
                                self.set_status(session_id, f"{phase_prefix} Assessment: [[{current_note_title}]]...")
                                await self.governor.get_permit(expected_tokens=2500)

                                q_agent = QuestionAgent(temp_llm, domain)
                                # v33.1: Expanded source anchor + strict domain lock header
                                _concept_label = current_note_title.replace('_', ' ')
                                q_context = (
                                    f"⚠️ DOMAIN LOCK: You MUST ONLY test the concept '{_concept_label}'. "
                                    f"Do NOT generate questions about aggregate demand, monetary policy, interest rates, "
                                    f"or ANY concept not explicitly present in the SOURCE ANCHOR below.\n\n"
                                    f"CONCEPT: {_concept_label}\n"
                                    f"MENTAL MODEL: {note_data.get('mental_model', '')[:250]}\n"
                                    f"CORE LOGIC: {note_data.get('core_logic', '')[:400]}\n"
                                    f"SOURCE ANCHOR (ONLY test vocabulary from here): {source_snippet[:500]}"
                                )
                                prof_domain = get_professional_domain(note_schema.title, mode=note_schema.mode)
                                
                                valid_qs = await q_agent.generate(
                                    note_schema=note_schema, 
                                    source_text=q_context, 
                                    mechanics="Focus on multi-step causal tracing and artifact verification.",
                                    academic_level=plan_obj.academic_level,
                                    count=3,
                                    prof_domain=prof_domain,
                                    q_type=None
                                )

                                # ── SEMANTIC TOPIC LOCK (v32.1) ──────────────────────────────
                                # Deterministically verify that quiz questions are grounded
                                # in the note's source context, not hallucinated topics.
                                topic_lock_source = (note_schema.source_context or "") + " " + note_schema.title
                                lock_passed, lock_diag = self.validator.semantic_topic_lock(
                                    note_title=note_schema.title,
                                    source_context=topic_lock_source,
                                    quiz_questions=valid_qs
                                )
                                if not lock_passed:
                                    print(f"[Ater Service] Semantic Topic Lock FAILED: {lock_diag}. Triggering regeneration.")
                                    self.set_status(session_id, f"⚠️ Topic Lock Fail: Regenerating quiz for [[{current_note_title}]]...")
                                    note_schema.source_context = f"\n\nSYSTEM CONSTRAINT: The previous quiz attempt FAILED because: {lock_diag}. Generate questions ONLY about '{note_schema.title.replace('_', ' ')}' using vocabulary from the source text.\n\n" + (note_schema.source_context or "")
                                    continue

                                # ── CLOSED-LOOP: Attach explanation_page metadata ────────────
                                # Each quiz question gets a reference to the source page so the UI
                                # can link directly from a wrong answer back to the PDF page.
                                source_pages = note_schema.source_pages or []
                                if source_pages:
                                    first_page = min((int(p) for p in source_pages if str(p).isdigit()), default=None)
                                    if first_page:
                                        for q in valid_qs:
                                            if isinstance(q, dict) and "explanation_page" not in q:
                                                q["explanation_page"] = first_page
                                            if isinstance(q, dict) and "source_pages" not in q:
                                                q["source_pages"] = sorted(set(int(p) for p in source_pages if str(p).isdigit()))

                                note_data["possible_questions"] = "\n```interactive-quiz\n" + json.dumps(valid_qs, indent=2) + "\n```"

                                # 4. Deterministic Assembly & Self-Healing (v33.0)
                                # misconceptions offloaded to AI Chat — not injected into note body
                                healer = LogicHealer(canonical_titles=set(all_note_titles))
                                body_content = render_atomic_note(note_data, healer=healer)

                                # 4.1 Code fence repair — auto-close unclosed fences before validation
                                body_content = self.validator.repair_code_fences(body_content)

                                # 4.2 Section deduplication guard — catch Scarcity.md-class failures
                                if self.validator.check_section_duplication(body_content):
                                    logger.warning(f"[Ater Service] Section duplication detected in [{current_note_title}] — forcing regen")
                                    self.set_status(session_id, f"⚠️ Content Dupe: Regenerating [[{current_note_title}]]...")
                                    note_schema.source_context = (
                                        "\n\nCRITICAL FIX REQUIRED: Your previous output had Section 2 (Core Logic walkthrough) "
                                        "as an exact copy of Section 1 (Mental Model). This is a hard failure. "
                                        "Section 2 MUST be a step-by-step mechanical breakdown — ENTIRELY different prose "
                                        "from the plain English analogy in Section 1. Do NOT repeat the Mental Model.\n\n"
                                    ) + (note_schema.source_context or "")
                                    continue
                                
                                # Standardize metadata for YAML dumper
                                metadata = {
                                    "title": note_data["title"],
                                    "course": note_data["course"],
                                    "unit": str(note_data["unit"]),
                                    "semester": note_data["semester"],
                                    "mode": note_data["mode"],
                                    "type": "atomic_note",
                                    "hub": note_data["hub"],
                                    "source": note_data["source"],
                                    "date": note_data["date"],
                                    "prerequisites": note_data["prerequisites"],
                                    "source_pages": note_data["source_pages"],
                                    "generated": True
                                }
                                yaml_frontmatter = self.vm.dump_obsidian_yaml(metadata)
                                final_markdown = f"---\n{yaml_frontmatter}---\n{body_content}"
                                last_candidate_markdown = final_markdown
                                
                                # 5. Validation Check
                                is_valid, validation_errors = self.validator.validate_structure(
                                    final_markdown, 
                                    course=note_data.get("course", ""), 
                                    mode=note_data.get("mode", "")
                                )
                                
                                if not is_valid:
                                    error_msg = f"Validation failed for [[{current_note_title}]]: {', '.join(validation_errors)}"
                                    logger.warning(f"[AterService] {error_msg}")
                                    self.set_status(session_id, f"⚠️ Healing Failed: Regenerating [[{current_note_title}]]...")
                                    continue

                                # 5.1 Semantic Validation (Hydra) — tiered blocking
                                if self.verifier_agent:
                                    self.set_status(session_id, f"{phase_prefix} Semantic Validation: [[{current_note_title}]]...")
                                    await self.governor.get_permit(expected_tokens=2000)
                                    v_res = await self.verifier_agent.verify(
                                        note_schema.title, 
                                        note_schema.mode, 
                                        final_markdown, 
                                        note_schema.source_context or "",
                                        modality=modality
                                    )
                                    if not v_res["passed"]:
                                        failures = v_res["failures"]
                                        # ── TIERED BLOCKING (v33.1) ──────────────────────────────
                                        # HARD failures (structural): block deployment, force regen
                                        HARD_CHECKS = {"clean_output", "feynman_integrity"}
                                        # SOFT failures (advisory): log warning, allow deployment
                                        SOFT_CHECKS = {"unique_scenario"}
                                        
                                        hard_failures = [f for f in failures if f.get("check") in HARD_CHECKS]
                                        soft_failures = [f for f in failures if f.get("check") in SOFT_CHECKS]
                                        
                                        if soft_failures:
                                            soft_diag = "; ".join([f"{f['check']}: {f['issue']}" for f in soft_failures])
                                            logger.warning(f"[Ater Service] Advisory validation (non-blocking): {soft_diag}")
                                        
                                        if hard_failures:
                                            hard_diag = "; ".join([f"{f['check']}: {f['issue']}" for f in hard_failures])
                                            print(f"[Ater Service] Semantic Validation HARD FAIL: {hard_diag}")
                                            self.set_status(session_id, f"⚠️ Semantic Healing: [[{current_note_title}]]...")
                                            if hard_failures:
                                                note_schema.source_context = f"\n\nSYSTEM CONSTRAINT: The previous attempt FAILED because: {hard_diag}. Your output MUST NOT contain these issues. Fix instruction: {hard_failures[0]['fix_instruction']}\n\n" + (note_schema.source_context or "")
                                            continue  # Only hard failures trigger regen

                                # 6. Deployment
                                local_results = self.deployer.deploy_atomic_notes(
                                    session_id, [current_note_title], [final_markdown], plan_obj, session.get("path", "")
                                )
                                if current_note_title not in session.get("processed_notes", []):
                                    session.setdefault("processed_notes", []).append(current_note_title)
                                
                                # v33.2: Atomic State Persistence — save progress after every successful deployment
                                self._persist_session(session_id, session)
                                break # Success, exit generation loop

                            except Exception as e:
                                err_str = str(e)
                                if "429" in err_str or "rate_limit" in err_str.lower():
                                    m = re.search(r"try again in (?:(\d+)m)?([\d\.]+)s", err_str)
                                    if m:
                                        mins = int(m.group(1)) if m.group(1) else 0
                                        secs = float(m.group(2))
                                        self.governor.report_error(wait_seconds=mins * 60 + secs + 2.0)
                                    else:
                                        self.governor.report_error()
                                    raise e # Propagate up to confirm_plan
                                if generation_attempts >= max_generation_attempts:
                                    logger.warning(f"[Ater Service] Max attempts/entropy reached for '{current_note_title}': {e}.")
                                    break
                                await asyncio.sleep(5)
                        
                        # Best-effort fallback deployment to guarantee no notes are ever skipped
                        if current_note_title not in session.get("processed_notes", []):
                            logger.warning(f"[Ater Service] Max attempts reached for '{current_note_title}'. Deploying deterministic skeleton fallback.")
                            
                            skeleton_body = build_skeleton_note(note_schema, source_snippet, domain, all_titles=all_note_titles)
                            metadata = {
                                "title": note_data["title"],
                                "course": note_data["course"],
                                "unit": str(note_data["unit"]),
                                "semester": note_data["semester"],
                                "mode": note_data["mode"],
                                "type": "atomic_note",
                                "hub": note_data["hub"],
                                "source": note_data["source"],
                                "date": note_data["date"],
                                "prerequisites": note_data["prerequisites"],
                                "source_pages": note_data["source_pages"],
                                "generated": True,
                                "skeleton_fallback": True
                            }
                            yaml_frontmatter = self.vm.dump_obsidian_yaml(metadata)
                            final_markdown = f"---\n{yaml_frontmatter}---\n{skeleton_body}"
                            
                            local_results = self.deployer.deploy_atomic_notes(
                                session_id, [current_note_title], [final_markdown], plan_obj, session.get("path", "")
                            )
                            if current_note_title not in session.get("processed_notes", []):
                                session.setdefault("processed_notes", []).append(current_note_title)
                            self._persist_session(session_id, session)
                        
                    elif b_type == "pq":
                        current_note_title = b_notes[0]
                        note_schema_raw = next((n for n in session["metadata"].get("possible_questions", []) if n["title"] == current_note_title), None)
                        if not note_schema_raw: raise ValueError(f"PQ {current_note_title} not found in plan.")
                        
                        from .schemas import NoteSchema
                        note_schema = NoteSchema(**note_schema_raw)
                        self.set_status(session_id, f"Synthesizing Master Question Bank: [[{current_note_title}]]...")
                        
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
                        self.set_status(session_id, "Compiling Unit Mastery Hub...")
                        ai_output = self._compile_hub_note(plan_obj, session_path=session.get("path", ""))
                        
                        if self.hub_agent:
                            hub_retry = 0
                            hub_success = False
                            while hub_retry < 5 and not hub_success:
                                try:
                                    await self.governor.get_permit(expected_tokens=1000)
                                    descriptions = [n.get("description", "") for n in session["metadata"]["atomic_notes"]]
                                    ai_output = await self.hub_agent.generate_hub(plan_obj.hub_title, descriptions, ai_output)
                                    hub_success = True
                                except Exception as e:
                                    hub_retry += 1
                                    err_msg = str(e).lower()
                                    if "429" in err_msg or "rate limit" in err_msg or "rate_limit" in err_msg:
                                        m = re.search(r"try again in (?:(\d+)m)?([\d\.]+)s", err_msg)
                                        if m:
                                            mins = int(m.group(1)) if m.group(1) else 0
                                            secs = float(m.group(2))
                                            self.governor.report_error(wait_seconds=mins * 60 + secs + 2.0)
                                            await asyncio.sleep(mins * 60 + secs + 2.0)
                                        else:
                                            self.governor.report_error()
                                            await asyncio.sleep(30)
                                    else:
                                        await asyncio.sleep(10)
                            
                            if not hub_success:
                                logger.warning(f"[Ater Service] Hub AI enhancement exhausted retries for session {session_id}. Deploying deterministic hub fallback.")
                                self.set_status(session_id, "⚠️ Hub AI failed — deploying base hub.")
                            
                        local_results = self.deployer.deploy_hub_note(session_id, ai_output, plan_obj, session.get("path", ""))
                        
                        # ── POST-PROCESSING (Scripts) ──
                        try:
                            from .post_processing import (
                                canonicalize_unit, infer_unit_prerequisites, enforce_gutter,
                                audit_walkthroughs, audit_intra_links, sync_hub_connections,
                                purge_pedagogical_artifacts, auto_weave_wikilinks
                            )
                            unit_dir = self.vm.get_note_path({"title": hub_title, "type": "hub"}, session_metadata=session["metadata"]).parent
                            print(f"[Ater Service] Running post-processing pipeline on {unit_dir}")
                            
                            # Standard cleanup
                            purge_pedagogical_artifacts(unit_dir)
                            canonicalize_unit(unit_dir)
                            infer_unit_prerequisites(unit_dir)
                            enforce_gutter(unit_dir)
                            
                            plan_order = [n.title for n in plan_obj.atomic_notes]
                            sync_hub_connections(
                                self.vm.get_note_path({"title": canonical_hub_title, "type": "hub"}, session_metadata=session["metadata"]),
                                unit_dir,
                                plan_order=plan_order
                            )
                            
                            # ── Auto-Weaver Script ──
                            print(f"[Ater Service] Running Auto-Weaver script...")
                            auto_weave_wikilinks(unit_dir)
                            # Resolve hub file (may be the anchored Study Planner hub)
                            relative_path = local_results[0]["path"]
                            hub_file = self.deployer.vm.vault_path / relative_path

                            # Resolve unit directory using the SAME logic as VaultManager.get_note_path
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
                                purge_pedagogical_artifacts(unit_dir)  # TikZ, bold→wiki, header norm
                                infer_unit_prerequisites(unit_dir)
                                enforce_gutter(unit_dir)
                                audit_walkthroughs(unit_dir)
                                audit_intra_links(unit_dir)
                                if hub_file.exists():
                                    plan_titles = [n.get("title") for n in meta.get("atomic_notes", [])]
                                    sync_hub_connections(hub_file, unit_dir, plan_order=plan_titles)
                                self.set_status(session_id, "Post-Processing Complete")
                            else:
                                print(f"[Ater Service] Post-processing skipped: unit dir not found: {unit_dir}")
                        except Exception as pp_e:
                            print(f"[Ater Service] Post-processing failed: {pp_e}")

                    deployment_results.extend(local_results)
                    return True
                finally:
                    await self.governor.release_slot()


            # ── EXECUTION ──
            # v32.0: Atomicity Enforcement. 
            # confirm_plan now only executes ONE batch at a time when called via API.
            # This prevents HTTP timeouts during large cascades.
            
            # Execute the single batch
            await run_single_batch(batch_number, batch_type, batch_notes)

            # Update session state for next call (v33.2 State Hardening)
            session["current_batch"] = batch_number
            has_more = batch_number < total_batches
            
            # Persist the incremented batch to disk immediately
            self._persist_session(session_id, session)

            if not has_more:
                AterService._sessions.pop(session_id, None)
                self.set_status(session_id, "Deployment Complete")
                # Also clean up the persisted session file entry if finished
                try:
                    if self._session_file.exists():
                        with open(self._session_file, "r") as f:
                            existing = json.load(f)
                        if session_id in existing:
                            del existing[session_id]
                            with open(self._session_file, "w") as f:
                                json.dump(existing, f)
                except Exception: pass
            else:
                self.set_status(session_id, f"Awaiting Batch {batch_number + 1}")

            return {
                "results": deployment_results,
                "count": len(deployment_results),
                "has_more": has_more,
                "current_batch": batch_number,
                "total_batches": total_batches,
                "status": "success"
            }
        except Exception as e:
            err_trace = traceback.format_exc()
            error_msg = self._format_user_error(e)
            print(f"[Ater Service] Execution failed: {e}\n{err_trace}")
            self.set_status(session_id, f"Architecture Load Failed: {error_msg}")
            return {
                "status": "error",
                "detail": str(e),
                "trace": err_trace,
                "message": error_msg
            }
            raise ValueError(error_msg)


    def _get_source_link(self, plan: SovereignPlan, session_path: str = "") -> str:
        """Determines the canonical PDF source link for a note."""
        if session_path:
            clean_filename = Path(session_path).name.replace(" ", "_")
            _sem = (plan.semester or "General").strip()
            _crs = self.vm.get_canonical_title(plan.course or "General_Knowledge")
            return f"[[Inbox/Generated/{_sem}/{_crs}/{clean_filename}]]"
        return f"[[{plan.hub_note.title}]]"

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
            
            try:
                rel_inbox = Path(self.secrets.inbox_path).relative_to(self.secrets.vault_path).as_posix()
                source_link = f"[[Inbox/Generated/{_sem}/{_crs}/{clean_filename}]]"
            except Exception:
                source_link = f"[[Inbox/Generated/{_sem}/{_crs}/{clean_filename}]]"
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
            
            try:
                rel_inbox = Path(self.secrets.inbox_path).relative_to(self.secrets.vault_path).as_posix()
                source_link = f"[[Inbox/Generated/{_sem}/{_crs}/{clean_filename}]]"
            except Exception:
                source_link = f"[[Inbox/Generated/{_sem}/{_crs}/{clean_filename}]]"
        else:
            source_link = f"[[{plan.hub_note.title}]]"

        # Extract source page range from plan
        all_pages = []
        for n in plan.atomic_notes:
            if n.source_pages:
                all_pages.extend(n.source_pages)
        
        metadata = {
            "title": plan.hub_note.title,
            "type": "Hub",
            "course": plan.course,
            "semester": plan.semester,
            "unit": str(plan.unit),
            "source": source_link,
            "source_pages": [1], # Always jump to page 1 for Hubs to avoid NaN range errors
            "status": "Not Started",
            "confidence": None,
            "study_date": None,
            "generated": True,
            # mode is intentionally excluded from Hub notes
        }
        
        yaml_frontmatter = self.vm.dump_obsidian_yaml(metadata)

        # Build Markdown Body
        body = "## Overview\n"
        body += f"{plan.hub_note.description}\n\n"
        
        body += "## Unit Objectives\n"
        # Gap 2 Fix: Dynamic Objectives referencing plan concepts
        top_concepts = [f"[[{n.title}]]" for n in plan.atomic_notes[:3]]
        body += f"- [ ] Master core technical definitions for {', '.join(top_concepts)}.\n"
        body += "- [ ] Internalize the mental models and professional analogies for each unit concept.\n"
        body += "- [ ] Trace and understand every source-anchored worked example and walkthrough.\n"
        body += "- [ ] Complete all Socratic Probes and verify with the Answer Key.\n\n"
        
        body += "## Connections\n\n"
        
        # Build tree structure using prerequisites if available
        tree = {}
        for note in plan.atomic_notes:
            tree[note.title] = {"note": note, "children": []}
            
        roots = []
        for note in plan.atomic_notes:
            parent_found = False
            if hasattr(note, 'prerequisites') and note.prerequisites:
                # Find the first prerequisite that is also in this unit to act as the 'parent'
                for prereq in note.prerequisites:
                    for potential_parent in tree:
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
            indent = "    " * indent_level
            res = f"{indent}- [ ] [[{canonical}]]\n"
            for child in sorted(node_data["children"]):
                res += render_node(child, indent_level + 1, visited.copy())
            return res
            
        for root in sorted(roots):
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

    async def run_full_cascade(self, session_id: str, curriculum_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes an entire session from start to finish.
        Used primarily by the background watcher for auto-ingest.
        """
        # 1. Initialize with the first batch
        res = await self.confirm_plan(session_id, command="Confirm Final Plan & Proceed Batch 1", curriculum_override=curriculum_override)
        if res.get("status") != "success":
            return res
        
        # 2. Loop until done
        while res.get("has_more"):
            next_batch = res.get("current_batch", 0) + 1
            res = await self.confirm_plan(session_id, command=f"Proceed Batch {next_batch}")
            if res.get("status") == "rate_limited":
                return res
            if res.get("status") == "error":
                return res
        
        return res
