import re
import json
import os
import asyncio
import traceback
import uuid
import time
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
OKA_MAX_RETRIES = 3     # Retry on transient failures (524, timeout, rate-limit)
OKA_RETRY_BACKOFF = 10  # Seconds between retries (doubles each attempt)
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
        self.vm = VaultManager(secrets.vault_path, academic_base=secrets.academic_path)
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
        )

    def _ensure_session_dir(self):
        """Ensures the persistent session directory exists."""
        self._session_file.parent.mkdir(parents=True, exist_ok=True)
        if not self._session_file.exists():
            with open(self._session_file, "w") as f:
                json.dump({}, f)

    def _persist_session(self, session_id: str, data: Dict[str, Any]):
        """Persists a session state to disk."""
        try:
            # Prepare serializable content (convert Messages to strings)
            serializable = data.copy()
            if "messages" in serializable:
                serializable["messages"] = [
                    {"type": m.type, "content": m.content} 
                    for m in serializable["messages"]
                ]
            
            # Read, Update, Write
            with open(self._session_file, "r") as f:
                all_sessions = json.load(f)
            
            all_sessions[session_id] = serializable
            
            with open(self._session_file, "w") as f:
                json.dump(all_sessions, f)
            
            # Update memory too
            OkaService._sessions[session_id] = data
        except Exception as e:
            print(f"[OKA Service] Persistence Fail: {e}")

    async def _get_or_restore_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a session from memory or restores it from disk."""
        # Check memory first
        if session_id in OkaService._sessions:
            return OkaService._sessions[session_id]
        
        # Restore from file
        try:
            with open(self._session_file, "r") as f:
                all_sessions = json.load(f)
            
            if session_id in all_sessions:
                data = all_sessions[session_id]
                # Rehydrate messages (System, Human, AI)
                from langchain_core.messages import AIMessage
                rehydrated = []
                for m in data.get("messages", []):
                    if m["type"] == "system":
                        rehydrated.append(SystemMessage(content=m["content"]))
                    elif m["type"] == "ai":
                        rehydrated.append(AIMessage(content=m["content"]))
                    else:
                        rehydrated.append(HumanMessage(content=m["content"]))
                
                data["messages"] = rehydrated
                OkaService._sessions[session_id] = data
                return data
        except Exception as e:
            print(f"[OKA Service] Restoration Fail: {e}")
        return None

    # ── SI Resolution ──────────────────────────────────────────
    @staticmethod
    def resolve_si_path(hint: Optional[str] = None) -> Path:
        """
        Resolves the OKA System Instruction file with the following priority:
          1. Explicit hint path (if provided and exists)
          2. <project_root>/OKA.md
          3. <project_root>/.system/prompts/OKA_System_Instruction.md
          4. Walk upward from this file looking for OKA.md
        """
        if hint:
            p = Path(hint)
            if p.exists():
                return p

        # Determine project root (LifeOs/) — service.py lives at
        # apps/api/src/domains/oka/service.py  → 5 levels up
        project_root = Path(__file__).resolve().parents[4]

        candidates = [
            project_root / "OKA.md",
            project_root / ".system" / "prompts" / "OKA_System_Instruction.md",
        ]
        for c in candidates:
            if c.exists():
                return c

        # Fallback: walk up from this file
        curr = Path(__file__).resolve().parent
        for _ in range(10):
            target = curr / "OKA.md"
            if target.exists():
                return target
            if curr.parent == curr:
                break
            curr = curr.parent

        raise FileNotFoundError(
            "OKA.md not found. Searched project root and parent directories."
        )

    async def _get_si(self, system_instruction_path: str) -> str:
        si_path = self.resolve_si_path(system_instruction_path)
        with open(si_path, "r", encoding="utf-8") as f:
            si = f.read()
        print(f"[OKA Service] Loaded SI ({len(si)} chars) from: {si_path}")
        return si

    # ── LLM Invocation with retry ──────────────────────────────
    async def _invoke_with_retry(
        self, messages: list, session_id: str, phase: str = "Planning"
    ):
        """
        Invokes the LLM with exponential-backoff retry.
        Updates _status with progress on each attempt.
        """
        last_error = None
        backoff = OKA_RETRY_BACKOFF

        for attempt in range(1, OKA_MAX_RETRIES + 1):
            try:
                status_msg = (
                    f"{phase} with {self.secrets.ai_model}"
                    + (f" (attempt {attempt}/{OKA_MAX_RETRIES})" if attempt > 1 else "")
                    + "..."
                )
                OkaService._status[session_id] = status_msg
                print(f"[OKA Service] {status_msg}")

                response = await self.llm.ainvoke(messages)
                return response

            except Exception as e:
                last_error = e
                error_str = str(e)
                is_transient = any(
                    marker in error_str.lower()
                    for marker in [
                        "524", "timeout", "429", "rate", "503",
                        "502", "overloaded", "capacity",
                    ]
                )

                if is_transient and attempt < OKA_MAX_RETRIES:
                    wait_msg = (
                        f"Transient error ({self._classify_error(error_str)}). "
                        f"Retrying in {backoff}s (attempt {attempt}/{OKA_MAX_RETRIES})..."
                    )
                    OkaService._status[session_id] = wait_msg
                    print(f"[OKA Service] {wait_msg}")
                    await asyncio.sleep(backoff)
                    backoff *= 2
                    continue
                else:
                    raise

        # Should not reach here, but safety net
        raise last_error  # type: ignore

    @staticmethod
    def _classify_error(error_str: str) -> str:
        lowered = error_str.lower()
        if "524" in lowered or "timeout" in lowered:
            return "Timeout (524)"
        if "429" in lowered or "rate" in lowered:
            return "Rate Limited (429)"
        if "503" in lowered or "502" in lowered:
            return "Server Overloaded"
        return "Provider Error"

    # ── Phase 2: Planning ──────────────────────────────────────
    async def process_file(
        self, file_path: str, system_instruction_path: str
    ) -> Dict[str, Any]:
        """Initializes planning using a stateful chat."""
        print(f"[OKA Service] --- STARTING PROCESS_FILE ({self.secrets.ai_model}) ---")
        path = Path(file_path)
        session_id = str(path.absolute())

        # Clear any existing session for this file path
        OkaService._sessions.pop(session_id, None)
        OkaService._status[session_id] = "Initializing Agent..."

        try:
            si = await self._get_si(system_instruction_path)
            messages = [SystemMessage(content=si)]

            # Determine source type from file extension
            ext = path.suffix.lower()
            source_type = {
                ".pdf": "PDF_Document",
                ".md": "Markdown_Notes",
                ".txt": "Text_Document",
                ".py": "Python_Source",
                ".js": "JavaScript_Source",
                ".ts": "TypeScript_Source",
                ".java": "Java_Source",
                ".cpp": "CPP_Source",
                ".rs": "Rust_Source",
                ".html": "HTML_Document",
                ".css": "CSS_Document",
                ".json": "JSON_Document",
            }.get(ext, "Text_Document")

            # ── Extract source text ────────────────────────────
            content_text = ""
            if path.suffix.lower() == ".pdf":
                print(f"[OKA Service] Using PyPDFLoader for: {path.name}")
                OkaService._status[session_id] = (
                    "Extracting text from PDF (this might take a moment)..."
                )
                loader = PyPDFLoader(str(path.absolute()))
                docs = await asyncio.to_thread(loader.load)
                full_text = "\n\n".join([doc.page_content for doc in docs])

                # Truncate if too large to avoid context-window overflow
                if len(full_text) > MAX_SOURCE_CHARS:
                    print(
                        f"[OKA Service] Source text truncated from "
                        f"{len(full_text)} to {MAX_SOURCE_CHARS} chars"
                    )
                    full_text = full_text[:MAX_SOURCE_CHARS] + (
                        "\n\n[... remainder of source truncated for context "
                        "window limits. Process the remaining content in "
                        "subsequent interactions if needed.]"
                    )

                content_text = (
                    f"Type_of_Source: {source_type}\nSource_Content:\n\n{full_text}"
                )
            else:
                print(f"[OKA Service] Reading text file: {path.name}")
                OkaService._status[session_id] = "Reading text file..."
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    raw = f.read()

                if len(raw) > MAX_SOURCE_CHARS:
                    print(
                        f"[OKA Service] Source text truncated from "
                        f"{len(raw)} to {MAX_SOURCE_CHARS} chars"
                    )
                    raw = raw[:MAX_SOURCE_CHARS] + (
                        "\n\n[... remainder of source truncated for context "
                        "window limits.]"
                    )

                content_text = (
                    f"Type_of_Source: {source_type}\nSource_Content:\n\n{raw}"
                )

            # OKA v7.0 Dynamic Initialization
            init_command = (
                "Source material provided. ABSOLUTELY NO GREETINGS or preambles.\n"
                "1. Start with the `<pre_generation_planning>` reasoning block.\n"
                "2. Extract EVERY single concept from the source.\n"
                "3. Output the **Finalized Knowledge Asset Plan** exactly as per OKA v7.0.\n\n"
                f"{content_text}"
            )
            messages.append(HumanMessage(content=init_command))

            print(
                f"[OKA Service] Generating plan via {self.secrets.ai_provider} "
                f"({self.secrets.ai_model})..."
            )

            # ── Invoke with retry ─────────────────────────────
            response = await self._invoke_with_retry(
                messages, session_id, phase="Generating Plan"
            )

            OkaService._status[session_id] = "Parsing AI Blueprint..."
            plan_output = response.content
            print(f"[OKA Service] Plan generated (length: {len(plan_output)})")

            structured_plan = self._parse_plan_to_json(plan_output)

            total_batches = len(structured_plan.get("batches", [])) or 1
            OkaService._sessions[session_id] = {
                "messages": messages + [response],
                "path": file_path,
                "plan": plan_output,
                "metadata": structured_plan,
                "current_batch": 0,
                "total_batches": total_batches,
            }

            self._persist_session(session_id, OkaService._sessions[session_id])
            OkaService._status[session_id] = "Awaiting Confirmation"

            return {
                "session_id": session_id,
                "plan_raw": plan_output,
                "plan_structured": structured_plan,
                "status": "awaiting_confirmation",
            }
        except Exception as e:
            error_msg = self._format_user_error(e)
            OkaService._status[session_id] = f"Error: {error_msg}"
            print(f"[OKA Service] CRITICAL ERROR: {traceback.format_exc()}")
            raise ValueError(error_msg)

    # ── Phase 3: Batch Deployment ──────────────────────────────
    async def confirm_plan(
        self,
        session_id: str,
        command: str = "Confirm Final Plan & Proceed Batch 1",
    ) -> Dict[str, Any]:
        session = await self._get_or_restore_session(session_id)
        if not session:
            raise ValueError(f"No active session found for {session_id}. Please restart the file process.")
        messages = session["messages"]
        current_batch = session.get("current_batch", 0)
        total_batches = session.get("total_batches", 1)

        batch_number = current_batch + 1

        print(
            f"[OKA Service] Executing batch {batch_number}/{total_batches}: {command}"
        )

        try:
            # OKA v7.0 Strict Batch Reinforcement
            batch_notes = []
            if "batches" in session["metadata"]:
                for b in session["metadata"]["batches"]:
                    if b.get("id") == batch_number:
                        batch_notes = b.get("notes", [])
                        break
            
            notes_context = ""
            if batch_notes:
                notes_context = f"Specifically, generate EXACTLY these notes: {', '.join(['[['+n+']]' for n in batch_notes])}."

            reinforced_command = (
                f"{command}\n\n"
                "STRICT OKA v7.0 BATCH PROTOCOL:\n"
                f"1. You are generating Batch {batch_number} of {total_batches}.\n"
                f"2. {notes_context}\n"
                "3. Use EXACT structural templates from OKA v7.0 (Exhaustive & Massive Detail).\n"
                "4. Wrap output EXCLUSIVELY in --- START_BATCH --- and --- END_BATCH ---.\n"
                "5. EVERY note MUST be delimited with --- START_NOTE --- and --- END_NOTE ---.\n"
                "6. EVERY YAML value must be wrapped in double quotes.\n"
                "7. NO standard backticks (```). USE --- START_CODE:{lang} --- delimiters.\n"
                "8. After generating, wait for next batch confirmation."
            )
            messages.append(HumanMessage(content=reinforced_command))

            res = await self._invoke_with_retry(
                messages,
                session_id,
                phase=f"Generating Batch {batch_number}/{total_batches}",
            )

            OkaService._status[session_id] = (
                f"Deploying Batch {batch_number} to Vault..."
            )
            deployment_results = self.deployer.deploy(res.content)
            if not deployment_results:
                print(f"[OKA Service] ERROR: 0 notes extracted from response (total len: {len(res.content)})")
                # DO NOT increment current_batch here so user can retry
                return {
                    "ai_output": res.content,
                    "results": [],
                    "count": 0,
                    "has_more": True,
                    "current_batch": current_batch, 
                    "total_batches": total_batches,
                    "status": "error",
                    "error": f"Batch {batch_number} parsing failed. The AI omitted the required START_NOTE/YAML markers. Please try again or check the raw output below."
                }
                
            print(f"[OKA Service] Batch {batch_number} deployed: {len(deployment_results)} notes.")

            messages.append(res)
            session["current_batch"] = batch_number
            has_more = batch_number < total_batches
            
            # Persist progress
            self._persist_session(session_id, session)

            if not has_more:
                OkaService._sessions.pop(session_id, None)
                OkaService._status[session_id] = "Completed"
                print(
                    f"[OKA Service] All {total_batches} batch(es) complete. "
                    f"Session terminated."
                )
            else:
                OkaService._status[session_id] = (
                    f"Awaiting Batch {batch_number + 1}"
                )

            return {
                "ai_output": res.content,
                "results": deployment_results,
                "count": len(deployment_results),
                "has_more": has_more,
                "current_batch": batch_number,
                "total_batches": total_batches,
                "status": "complete" if not has_more else "in_progress",
            }
        except Exception as e:
            error_msg = self._format_user_error(e)
            OkaService._status[session_id] = f"Error: {error_msg}"
            raise ValueError(error_msg)

    # ── Plan Parsing ───────────────────────────────────────────
    def _parse_plan_to_json(self, plan_text: str) -> Dict[str, Any]:
        """Extracts key metadata from the LLM's plan response."""
        metadata: Dict[str, Any] = {
            "course": "Unknown",
            "unit": "Unknown",
            "year": "Unsorted_Year",
            "semester": "Unsorted_Semester",
            "notes": [],
            "batches": [],
        }

        # Metadata extraction (Strict v5.4 Plan Blueprint Parsing)
        for pattern in [
            r"Course:\s*\**([^\n\*]*)",
            r"# I\..*?Course:\s*\**([^\n\*]*)",
        ]:
            m = re.search(pattern, plan_text, re.I)
            if m:
                metadata["course"] = m.group(1).strip()
                break

        for pattern in [
            r"Unit:\s*\**([^\n\*]*)",
            r"# I\..*?Unit:\s*\**([^\n\*]*)",
        ]:
            m = re.search(pattern, plan_text, re.I)
            if m:
                metadata["unit"] = m.group(1).strip()
                break

        for pattern in [
            r"Year:\s*(.*)",
            r"\*\*Year:\*\*\s*(.*)",
            r"Year\s+(\d+)",
        ]:
            m = re.search(pattern, plan_text, re.I)
            if m:
                metadata["year"] = m.group(1).strip()
                break

        for pattern in [
            r"Semester:\s*(.*)",
            r"\*\*Semester:\*\*\s*(.*)",
            r"Semester\s+([IV\d]+)",
        ]:
            m = re.search(pattern, plan_text, re.I)
            if m:
                metadata["semester"] = m.group(1).strip()
                break

        # Extract notes (anything in wiki-links [[...]])
        notes_match = re.findall(r"\[\[(.*?)\]\]", plan_text)
        metadata["notes"] = list(dict.fromkeys(notes_match))

        # Isolate the Batching Strategy section
        strategy_match = re.search(r"#\s*IV\.\s*BATCHING STRATEGY(.*?)(?=#\s*V\.|$)", plan_text, re.DOTALL | re.I)
        search_text = strategy_match.group(1) if strategy_match else plan_text

        # Robust batch parsing (Supports table rows: | Batch 1 | [[Note1]], [[Note2]] |)
        batch_rows = re.findall(r"\|\s*Batch\s+(\d+)\s*\|\s*(.*?)\|", search_text, re.I)
        if batch_rows:
            assigned_notes = set()
            for b_id, b_content in batch_rows:
                b_notes = re.findall(r"\[\[(.*?)\]\]", b_content)
                if b_notes:
                    metadata["batches"].append({
                        "id": int(b_id),
                        "notes": list(dict.fromkeys(b_notes))
                    })
                    assigned_notes.update(b_notes)
        else:
            # Fallback to standard header parsing if table fails
            batch_headers = list(re.finditer(r"(?:\n|^)(?:[#\-\*\s\d\.\|]*)Batch\s+(\d+)\s*(?::|\s|\*|-|\||$)", search_text, re.I))
            assigned_notes = set()
            for i, match in enumerate(batch_headers):
                b_id = match.group(1)
                start_pos = match.end()
                end_pos = batch_headers[i+1].start() if i + 1 < len(batch_headers) else len(search_text)
                b_notes = re.findall(r"\[\[(.*?)\]\]", search_text[start_pos:end_pos])
                if b_notes:
                    metadata["batches"].append({
                        "id": int(b_id), 
                        "notes": list(dict.fromkeys(b_notes))
                    })
                    assigned_notes.update(b_notes)

        # SNIPER MODE: Force 1-note-per-batch for maximum depth (Batch 2+)
        sniped_batches = []
        next_id = 1
        
        # 1. Process Manual Batches
        for b in metadata["batches"]:
            if b["id"] == 1:
                # Keep Batch 1 as is (Hub + Questions)
                b["id"] = next_id
                sniped_batches.append(b)
                next_id += 1
            else:
                # Split Batch 2+ into single-note batches
                for note in b["notes"]:
                    sniped_batches.append({
                        "id": next_id,
                        "notes": [note]
                    })
                    next_id += 1
        
        # 2. Add Missing Notes (Parity Guard)
        missing_notes = [n for n in metadata["notes"] if n not in assigned_notes]
        for note in missing_notes:
            sniped_batches.append({
                "id": next_id,
                "notes": [note]
            })
            next_id += 1
            
        metadata["batches"] = sniped_batches
        metadata["batches"].sort(key=lambda x: x["id"])

        # Extract Summary (For progress tracking)
        try:
            summary_match = re.search(r"#\s*V\.\s*SUMMARY\s*[\r\n]+(.*?)(?=#|---|$)", plan_text, re.DOTALL | re.I)
            if summary_match:
                notes_count_match = re.search(r"Total Atomic Notes:\s*(\d+)", summary_match.group(1), re.I)
                if notes_count_match:
                    metadata["total_notes"] = int(notes_count_match.group(1))
        except: pass

        # Predict deployment path
        try:
            # Look for Domain/Category to help pathing
            m_cat = re.search(r"\*\*(?:Category|Domain|Field|Type|Source Type):\*\*\s*(.*)", plan_text)
            if m_cat:
                metadata["category"] = m_cat.group(1).strip()
            
            # Predict dir using dummy note title
            dummy_meta = {
                "title": "dummy",
                "course": metadata.get("course", ""),
                "unit": metadata.get("unit", ""),
                "year": metadata.get("year"),
                "semester": metadata.get("semester"),
                "category": metadata.get("category", ""),
                "domain": metadata.get("category", "")
            }
            target_path = self.vm.get_note_path(dummy_meta)
            target_dir = target_path.parent
            
            try:
                # Use a more descriptive path for the UI
                rel = target_dir.relative_to(self.vm.vault_path)
                metadata["deployment_path"] = f"Vault/{rel}"
            except ValueError:
                metadata["deployment_path"] = str(target_dir)
        except Exception:
            metadata["deployment_path"] = "Evaluation Pending"

        print(
            f"[OKA Service] Plan parsed: {len(metadata['notes'])} potential notes, "
            f"{len(metadata['batches'])} confirmed batches. Path: {metadata.get('deployment_path')}"
        )

        return metadata

    # ── Error Formatting ───────────────────────────────────────
    def _format_user_error(self, e: Exception) -> str:
        error_str = str(e)
        lowered = error_str.lower()

        if "524" in lowered or "timeout" in lowered:
            return (
                f"The AI provider ({self.secrets.ai_provider}) timed out after "
                f"{OKA_MAX_RETRIES} attempts. The document may be too large for "
                f"{self.secrets.ai_model}, or the provider is slow. "
                f"Try a faster model (e.g. gemini-2.0-flash or gemini-2.5-pro)."
            )
        if "429" in lowered or "rate" in lowered:
            return (
                f"Rate limited by {self.secrets.ai_provider}. "
                f"Wait a minute and try again, or switch to a different model."
            )
        if "context" in lowered and ("length" in lowered or "window" in lowered):
            return (
                f"The document + system instruction exceeds the context window of "
                f"{self.secrets.ai_model}. Try a model with a larger context window."
            )
        return error_str
