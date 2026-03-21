#!/usr/bin/env python3
import os
import asyncio
import re
import traceback
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from .vault_manager import VaultManager
from .deployer import OkaDeployer
from src.domains.ai.factory import ModelFactory
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.document_loaders import PyPDFLoader

class OkaService:
    """
    Orchestrates OKA using LangChain via ModelFactory.
    Maintains stateful sessions for the multi-batch deployment flow.
    """
    _sessions: Dict[str, Any] = {}

    def __init__(self, secrets: Any):
        self.secrets = secrets
        self.vm = VaultManager(secrets.vault_path)
        self.deployer = OkaDeployer(self.vm)
        self.llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key
        )

    async def _get_si(self, system_instruction_path: str) -> str:
        si_path = Path(system_instruction_path)
        if not si_path.exists():
            # Try to find it in the standard location if the passed path fails
            project_root = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
            si_path = project_root / ".system" / "prompts" / "OKA_System_Instruction.md"
            
        if not si_path.exists():
            print(f"[OKA Service] CRITICAL: System instruction not found at {system_instruction_path} or fallback.")
            raise FileNotFoundError(f"System instruction not found at {si_path}")
        
        try:
            with open(si_path, "r", encoding="utf-8") as f:
                si = f.read()
            
            # Load Visual Protocol
            project_root = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
            protocol_path = project_root / ".system" / "architecture" / "OKA_Visual_Protocol_V2.md"
            protocol_content = ""
            
            if protocol_path.exists():
                with open(protocol_path, "r", encoding="utf-8") as f:
                    protocol_content = f.read()
                    print(f"[OKA Service] Appended protocol from: {protocol_path}")
            else:
                print(f"[OKA Service] WARNING: Visual Protocol not found in {protocol_path}")
            
            if protocol_content:
                si += "\n\n" + protocol_content
            return si
        except Exception as e:
            print(f"[OKA Service] Error reading SI: {e}")
            raise

    async def process_file(self, file_path: str, system_instruction_path: str) -> Dict[str, Any]:
        """Initializes planning using a stateful chat."""
        print(f"[OKA Service] --- STARTING PROCESS_FILE ({self.secrets.ai_model}) ---")
        si = await self._get_si(system_instruction_path)
        path = Path(file_path)
        session_id = str(path.absolute())
        
        # Clear any existing session for this file path to ensure fresh state
        OkaService._sessions.pop(session_id, None)
        
        try:
            si = await self._get_si(system_instruction_path)
            messages = [SystemMessage(content=si)]
            
            source_type = "Lecture_Slides" if path.suffix.lower() == ".pdf" else "Supplementary_Notes"
            
            if path.suffix.lower() == ".pdf" and self.secrets.ai_provider == "google":
                import google.generativeai as genai
                genai.configure(api_key=self.secrets.ai_key)
                uploaded_file = await asyncio.to_thread(genai.upload_file, path)
                while uploaded_file.state.name == "PROCESSING":
                    await asyncio.sleep(2)
                    uploaded_file = await asyncio.to_thread(genai.get_file, uploaded_file.name)
                # For Google, we use the file attribute if possible, but LangChain Google GenAI 
                # might not support direct file objects in messages easily without specific wrappers.
                # However, for the PLAN, text description is often enough if the model is multi-modal.
                content_text = f"Type_of_Source: {source_type}\nSource_Content: [PDF File {uploaded_file.name} processed]"
            elif path.suffix.lower() == ".pdf":
                print(f"[OKA Service] Fallback to PyPDFLoader for provider: {self.secrets.ai_provider}")
                loader = PyPDFLoader(str(path.absolute()))
                docs = await asyncio.to_thread(loader.load)
                full_text = "\n\n".join([doc.page_content for doc in docs])
                content_text = f"Type_of_Source: {source_type}\nSource_Content:\n\n{full_text}"
            else:
                with open(path, "r", encoding="utf-8") as f:
                    content_text = f"Type_of_Source: {source_type}\nSource_Content:\n\n{f.read()}"
            
            # protocol: 'start' -> 'Source_Content' -> Wait for Plan
            messages.append(HumanMessage(content="start"))
            messages.append(HumanMessage(content=content_text))
            
            print(f"[OKA Service] Generating plan...")
            response = await self.llm.ainvoke(messages)
            plan_output = response.content
            structured_plan = self._parse_plan_to_json(plan_output)

            total_batches = len(structured_plan.get("batches", [])) or 1
            OkaService._sessions[session_id] = {
                "messages": messages + [response],
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
        messages = session["messages"]
        current_batch = session.get("current_batch", 0)
        total_batches = session.get("total_batches", 1)

        batch_number = current_batch + 1
        
        print(f"[OKA Service] Executing batch {batch_number}/{total_batches}: {command}")
        messages.append(HumanMessage(content=command))
        res = await self.llm.ainvoke(messages)
        deployment_results = self.deployer.deploy(res.content)
        
        messages.append(res)
        session["current_batch"] = batch_number
        has_more = batch_number < total_batches

        if not has_more:
            OkaService._sessions.pop(session_id, None)
            print(f"[OKA Service] All {total_batches} batch(es) complete. Session terminated.")

        return {
            "ai_output": res.content,
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
        
        messages = [
            SystemMessage(content=si),
            HumanMessage(content="start"),
            HumanMessage(content=f"Type_of_Source: Note_Snippets\nSource_Content:\n\n{text}")
        ]
        
        res_plan = await self.llm.ainvoke(messages)
        plan_output = res_plan.content
        structured_plan = self._parse_plan_to_json(plan_output)
        
        total_batches = len(structured_plan.get("batches", [])) or 1
        OkaService._sessions[session_id] = {
            "messages": messages + [res_plan],
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
        metadata: Dict[str, Any] = {"context": {}, "notes": [], "batches": [], "modes": []}
        # More robust Context extraction for varied LLM layouts
        # Match section after I until next section or Batch
        ctx_match = re.search(r"#\s*I\.\s*Current Academic Context\s*(.*?)(?=#|Batch|---|\Z)", plan_text, re.DOTALL | re.IGNORECASE)
        if ctx_match:
            ctx_text = ctx_match.group(1).strip()
            # Clean up Markdown bolding and handle split lines
            for key, yaml_key in [("Year", "year"), ("Semester", "semester"), ("Course", "course"), ("Unit", "unit")]:
                m = re.search(fr"(?i)\**{key}:\**\s*(.*)", ctx_text)
                if m:
                    val = m.group(1).split("\n")[0].strip()
                    metadata["context"][yaml_key] = re.sub(r"[\*`]", "", val)

        notes_match = re.findall(r"\[\[(.*?)\]\]", plan_text)
        metadata["notes"] = list(dict.fromkeys(notes_match))

        # Better batch detection for varied LLM outputs
        # Look for "Batch X" headers and content until the next Batch or Section header
        batch_blocks = re.split(r"(?i)\n\s*\**Batch\s+(\d+)\**", plan_text)
        if len(batch_blocks) > 1:
            # First element is pre-batch text
            for i in range(1, len(batch_blocks), 2):
                if i + 1 < len(batch_blocks):
                    b_num = batch_blocks[i]
                    b_content = batch_blocks[i+1]
                    b_notes = re.findall(r"\[\[(.*?)\]\]", b_content)
                    metadata["batches"].append({"id": int(b_num), "notes": list(dict.fromkeys(b_notes))})
        
        # Fallback if the above split fails
        if not metadata["batches"]:
            # Robust batch finding even if the header is slightly different
            batch_matches = re.findall(r"(?i)(?:^|\n)\s*\**Batch\s+(\d+)\**.*?\n(.*?)(?=\n\s*(?:\**Batch|#|---)|\Z)", plan_text, re.DOTALL)
            for b_num, b_content in batch_matches:
                b_notes = re.findall(r"\[\[(.*?)\]\]", b_content)
                if b_notes:
                    metadata["batches"].append({"id": int(b_num), "notes": list(dict.fromkeys(b_notes))})
        
        # Final safety: If there are NO batches detected but notes WERE found, put them in Batch 1
        if not metadata["batches"] and metadata["notes"]:
             metadata["batches"].append({"id": 1, "notes": metadata["notes"]})

        return metadata
