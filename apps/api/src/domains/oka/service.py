#!/usr/bin/env python3
import os
import asyncio
import re
import traceback
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from .vault_manager import VaultManager
from .deployer import OkaDeployer

class OkaService:
    """
    Orchestrates OKA using the stable google-generativeai SDK.
    Maintains stateful sessions for the multi-batch deployment flow.
    """
    _sessions: Dict[str, Any] = {}

    def __init__(self, gemini_key: str, vault_path: str):
        self.gemini_key = gemini_key
        self.vault_path = vault_path
        self.vm = VaultManager(vault_path)
        self.deployer = OkaDeployer(self.vm)
        genai.configure(api_key=gemini_key)
        self.model_name = "gemini-2.5-flash"

    async def _get_si(self, system_instruction_path: str) -> str:
        if not os.path.exists(system_instruction_path):
            print(f"[OKA Service] CRITICAL: System instruction not found at {system_instruction_path}")
            raise FileNotFoundError(f"System instruction not found at {system_instruction_path}")
        
        try:
            with open(system_instruction_path, "r", encoding="utf-8") as f:
                si = f.read()
            
            # Path logic: apps/api/src/domains/oka/service.py -> apps/api/src/domains/oka -> apps/api/src/domains -> apps/api/src -> apps/api -> apps -> root
            # That's 6 levels up
            project_root = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
            protocol_names = ["OKA_Visual_Protocol_V2.md", "OKA_VISUAL_PROTOCOL_V2.md"]
            protocol_content = ""
            
            for name in protocol_names:
                p = project_root / name
                if p.exists():
                    with open(p, "r", encoding="utf-8") as f:
                        protocol_content = f.read()
                        print(f"[OKA Service] Appended protocol from: {p}")
                        break
            else:
                print(f"[OKA Service] WARNING: Visual Protocol not found in {project_root}")
            
            if protocol_content:
                si += "\n\n" + protocol_content
            return si
        except Exception as e:
            print(f"[OKA Service] Error reading SI: {e}")
            raise

    async def process_file(self, file_path: str, system_instruction_path: str) -> Dict[str, Any]:
        """Initializes planning using a stateful chat."""
        print(f"[OKA Service] --- STARTING PROCESS_FILE ({self.model_name}) ---")
        si = await self._get_si(system_instruction_path)
        path = Path(file_path)
        session_id = str(path.absolute())
        
        try:
            current_model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=si
            )
            chat = current_model.start_chat()

            print(f"[OKA Service] Initializing with 'start'...")
            await asyncio.to_thread(chat.send_message, "start")
            
            source_type = "Lecture_Slides" if path.suffix.lower() == ".pdf" else "Supplementary_Notes"
            
            if path.suffix.lower() == ".pdf":
                print(f"[OKA Service] Uploading PDF...")
                uploaded_file = await asyncio.to_thread(genai.upload_file, path)
                while uploaded_file.state.name == "PROCESSING":
                    await asyncio.sleep(2)
                    uploaded_file = await asyncio.to_thread(genai.get_file, uploaded_file.name)
                content_payload = [uploaded_file, f"Type_of_Source: {source_type}\nSource_Content: Attached."]
            else:
                with open(path, "r", encoding="utf-8") as f:
                    content_payload = f"Type_of_Source: {source_type}\nSource_Content:\n\n{f.read()}"
            
            print(f"[OKA Service] Generating plan...")
            res_plan = await asyncio.to_thread(chat.send_message, content_payload)
            plan_output = res_plan.text
            structured_plan = self._parse_plan_to_json(plan_output)

            total_batches = len(structured_plan.get("batches", [])) or 1
            OkaService._sessions[session_id] = {
                "chat": chat,
                "path": file_path,
                "plan": plan_output,
                "metadata": structured_plan,
                "current_batch": 0,
                "total_batches": total_batches
            }
            
            return {
                "session_id": session_id,
                "plan_raw": plan_output,
                "plan_structured": structured_plan,
                "status": "awaiting_confirmation"
            }
        except Exception as e:
            print(f"[OKA Service] CRITICAL ERROR: {e}")
            traceback.print_exc()
            raise

    async def confirm_plan(self, session_id: str, command: str = "Confirm Final Plan & Proceed Batch 1") -> Dict[str, Any]:
        if session_id not in OkaService._sessions:
            raise ValueError(f"No active session found for {session_id}")
        
        session = OkaService._sessions[session_id]
        chat = session["chat"]
        current_batch = session.get("current_batch", 0)
        total_batches = session.get("total_batches", 1)

        batch_number = current_batch + 1
        
        print(f"[OKA Service] Executing batch {batch_number}/{total_batches}: {command}")
        res = await asyncio.to_thread(chat.send_message, content=command)
        deployment_results = self.deployer.deploy(res.text)
        
        session["current_batch"] = batch_number
        has_more = batch_number < total_batches

        if not has_more:
            OkaService._sessions.pop(session_id, None)
            print(f"[OKA Service] All {total_batches} batch(es) complete. Session terminated.")

        return {
            "ai_output": res.text,
            "results": deployment_results,
            "count": len(deployment_results),
            "has_more": has_more,
            "current_batch": batch_number,
            "total_batches": total_batches,
            "next_batch": batch_number + 1 if has_more else None,
            "status": "has_more" if has_more else "completed"
        }

    async def process_text(self, text: str, system_instruction_path: str) -> Dict[str, Any]:
        si = await self._get_si(system_instruction_path)
        session_id = f"text_{uuid.uuid4()}"
        
        current_model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=si
        )
        chat = current_model.start_chat()
        
        await asyncio.to_thread(chat.send_message, "start")
        res_plan = await asyncio.to_thread(chat.send_message, f"Type_of_Source: Note_Snippets\nSource_Content:\n\n{text}")
        plan_output = res_plan.text
        structured_plan = self._parse_plan_to_json(plan_output)
        
        total_batches = len(structured_plan.get("batches", [])) or 1
        OkaService._sessions[session_id] = {
            "chat": chat, 
            "plan": plan_output, 
            "metadata": structured_plan,
            "current_batch": 0,
            "total_batches": total_batches
        }
        return {
            "session_id": session_id, 
            "plan_raw": plan_output, 
            "plan_structured": structured_plan, 
            "status": "awaiting_confirmation"
        }

    def _parse_plan_to_json(self, plan_text: str) -> Dict[str, Any]:
        metadata = {"context": {}, "notes": [], "batches": [], "modes": []}
        ctx_match = re.search(r"# I\. Current Academic Context\s*(.*?)(?=# II)", plan_text, re.DOTALL)
        if ctx_match:
            lines = ctx_match.group(1).strip().split("\n")
            for line in lines:
                if "**Year:**" in line: metadata["context"]["year"] = line.split(":**")[1].strip()
                if "**Semester:**" in line: metadata["context"]["semester"] = line.split(":**")[1].strip()
                if "**Course:**" in line: metadata["context"]["course"] = line.split(":**")[1].strip()
                if "**Unit:**" in line: metadata["context"]["unit"] = line.split(":**")[1].strip()

        notes_match = re.findall(r"\[\[(.*?)\]\]", plan_text)
        metadata["notes"] = list(dict.fromkeys(notes_match))

        batch_matches = re.findall(r"(?i)(?:^|\n)\s*\**Batch\s+(\d+).*?[\n\r]+(.*?)(?=\n\s*(?:\**Batch|#|---)|\Z)", plan_text, re.DOTALL)
        for b_num, b_content in batch_matches:
            b_notes = re.findall(r"\[\[(.*?)\]\]", b_content)
            metadata["batches"].append({"id": int(b_num), "notes": b_notes})

        return metadata
