#!/usr/bin/env python3
import os
import asyncio
import re
import traceback
import uuid
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_community.document_loaders import PyPDFLoader

from .vault_manager import VaultManager
from .deployer import OkaDeployer
from src.domains.ai.factory import ModelFactory

class OkaService:
    """
    Main orchestrator for OKA.
    """
    _sessions: Dict[str, Dict[str, Any]] = {}

    def __init__(self, secrets):
        self.secrets = secrets
        self.vm = VaultManager(secrets.vault_path, academic_base=secrets.academic_path)
        self.deployer = OkaDeployer(self.vm)
        
        # Initialize LLM
        self.llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.1 # Low temperature for structural integrity
        )

    async def _get_si(self, system_instruction_path: str) -> str:
        si_path = Path(system_instruction_path)
        if not si_path.exists():
            print(f"[OKA Service] SI Path not found: {si_path}. Trying standard location.")
            # Resolve project root more robustly: search upwards
            curr = Path(__file__).resolve()
            found = False
            for _ in range(10):
                target = curr / ".system" / "prompts" / "OKA_System_Instruction.md"
                if target.exists():
                    si_path = target
                    found = True
                    break
                if curr.parent == curr: break
                curr = curr.parent
            
            if not found:
                print(f"[OKA Service] CRITICAL: Could not find OKA_System_Instruction.md anywhere.")
                raise FileNotFoundError("OKA_System_Instruction.md not found.")

        try:
            with open(si_path, "r", encoding="utf-8") as f:
                si = f.read()
            
            # Load Visual Protocol
            protocol_path = si_path.parent.parent / "architecture" / "OKA_Visual_Protocol_V2.md"
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
        path = Path(file_path)
        session_id = str(path.absolute())
        
        # Clear any existing session for this file path to ensure fresh state
        OkaService._sessions.pop(session_id, None)
        
        try:
            si = await self._get_si(system_instruction_path)
            messages = [SystemMessage(content=si)]
            
            source_type = "Lecture_Slides" if path.suffix.lower() == ".pdf" else "Supplementary_Notes"
            
            if path.suffix.lower() == ".pdf" and self.secrets.ai_provider == "google":
                print(f"[OKA Service] Using Gemini PDF upload for: {path.name}")
                import google.generativeai as genai
                genai.configure(api_key=self.secrets.ai_key)
                uploaded_file = await asyncio.to_thread(genai.upload_file, path)
                
                # Protocol: 'start' -> Wait for Plan
                content_text = f"Type_of_Source: {source_type}\nSource_Content: [PDF File {uploaded_file.name} processed]"
                
                # For Gemini multimodal, we should ideally pass the file_uri
                # but let's try text first as the SI is very specific about the protocol
                messages.append(HumanMessage(content="start"))
                messages.append(HumanMessage(content=[
                    {"type": "text", "text": f"Type_of_Source: {source_type}\nSource_Content:"},
                    {"type": "file_data", "file_uri": uploaded_file.uri, "mime_type": "application/pdf"}
                ]))
            elif path.suffix.lower() == ".pdf":
                print(f"[OKA Service] Fallback to PyPDFLoader for: {path.name}")
                loader = PyPDFLoader(str(path.absolute()))
                docs = await asyncio.to_thread(loader.load)
                full_text = "\n\n".join([doc.page_content for doc in docs])
                content_text = f"Type_of_Source: {source_type}\nSource_Content:\n\n{full_text}"
                messages.append(HumanMessage(content="start"))
                messages.append(HumanMessage(content=content_text))
            else:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content_text = f"Type_of_Source: {source_type}\nSource_Content:\n\n{f.read()}"
                messages.append(HumanMessage(content="start"))
                messages.append(HumanMessage(content=content_text))
            
            print(f"[OKA Service] Generating plan via {self.secrets.ai_provider}...")
            response = await self.llm.ainvoke(messages)
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
                "total_batches": total_batches
            }
            
            return {
                "session_id": session_id,
                "plan_raw": plan_output,
                "plan_structured": structured_plan,
                "status": "awaiting_confirmation"
            }
        except Exception as e:
            print(f"[OKA Service] CRITICAL ERROR: {traceback.format_exc()}")
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
            "status": "complete" if not has_more else "in_progress"
        }

    def _parse_plan_to_json(self, plan_text: str) -> Dict[str, Any]:
        """
        Extracts key metadata from the LLM's plan response.
        """
        metadata = {
            "course": "Unknown",
            "unit": "Unknown",
            "notes": [],
            "batches": []
        }

        # 1. Extract Course/Unit
        course_match = re.search(r"\* \*\*Course:\*\* (.*)", plan_text)
        if course_match: metadata["course"] = course_match.group(1).strip()

        unit_match = re.search(r"\* \*\*Unit:\*\* (.*)", plan_text)
        if unit_match: metadata["unit"] = unit_match.group(1).strip()

        # 2. Extract Notes (anything in wiki-links [[...]])
        notes_match = re.findall(r"\[\[(.*?)\]\]", plan_text)
        metadata["notes"] = list(dict.fromkeys(notes_match)) # unique

        # 3. Detect Batches
        batch_sections = re.findall(r"\*\*Batch (\d+).*?\*\*:(.*?)(?=\*\*Batch|\#|Knowledge Asset Summary|$)", plan_text, re.S)
        for b_id, b_content in batch_sections:
            b_notes = re.findall(r"\[\[(.*?)\]\]", b_content)
            metadata["batches"].append({
                "id": int(b_id),
                "notes": list(dict.fromkeys(b_notes))
            })

        # If there are NO batches detected but notes WERE found, put them in Batch 1
        if not metadata["batches"] and metadata["notes"]:
             metadata["batches"].append({"id": 1, "notes": metadata["notes"]})

        return metadata
