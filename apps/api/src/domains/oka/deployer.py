#!/usr/bin/env python3
import re
import yaml
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
from .vault_manager import VaultManager

class OkaDeployer:
    """
    Handles the deployment of AI-generated notes into the Obsidian Vault.
    Refactored from Deployer.py.
    """

    def __init__(self, vault_manager: VaultManager):
        self.vm = vault_manager

    async def deploy(self, ai_output: str, session_metadata: Dict[str, Any] = {}) -> List[Dict[str, str]]:
        """
        Parses AI output and triggers batch deployment.
        """
        # Universal Note Extraction logic: Be extremely permissive with markers
        # Split by any variation of START_NOTE (with or without dashes)
        raw_parts = re.split(r"-*\s*START_NOTE\s*-*", ai_output, flags=re.IGNORECASE)
        
        blocks = []
        for part in raw_parts[1:]: # Skip text before first START_NOTE
            # Find the content up to the FIRST occurrence of END_NOTE in this part
            # Be extremely permissive with dashes and whitespace
            end_match = re.search(r"(?i)(.*?)\s*-*\s*END_NOTE\s*-*", part, re.DOTALL)
            if end_match:
                blocks.append(end_match.group(1).strip())
            else:
                # Fallback: just take the rest if END_NOTE is missing but START_NOTE was found
                blocks.append(part.strip())

        notes_to_deploy = []
        for raw_note in blocks:
            cleaned_note = self.vm.process_code_blocks(raw_note)
            meta, body, err = self.vm.extract_yaml_and_content(cleaned_note)
            
            # If YAML failed but we have content, try to synthesize a title from the first line
            if not meta.get("title"):
                first_line = body.strip().split('\n')[0]
                if first_line.startswith("# "):
                    meta["title"] = first_line[2:].strip()
            
            if meta.get("title"):
                # Ensure metadata has unit/course for pathing
                if "unit" not in meta or not meta["unit"]: meta["unit"] = session_metadata.get("unit")
                if "course" not in meta or not meta["course"]: meta["course"] = session_metadata.get("course")
                notes_to_deploy.append({"title": meta["title"], "content": cleaned_note, "metadata": meta})

        if not notes_to_deploy:
            print(f"[OKA Deployer] FAIL: 0 valid notes extracted. Raw output length: {len(ai_output)}")
            return []

        return await self.deploy_batch(notes_to_deploy, session_metadata)

    async def deploy_batch(self, notes: List[Dict[str, Any]], session_metadata: Dict[str, Any]) -> List[Dict[str, str]]:
        results = []
        
        # Determine anchored hub path if any
        anchored_path = None
        anchored_id = session_metadata.get("anchored_hub_id")
        if anchored_id and anchored_id != "new":
            planner_dir = Path(self.vm.vault_path) / "3-Database" / "06 - Study Planner"
            target = planner_dir / anchored_id
            if target.exists():
                anchored_path = str(target.absolute())

        for note in notes:
            title = note.get("title", "Untitled")
            content = note.get("content", "")
            meta = note.get("metadata", {})
            
            # ── METADATA ENFORCEMENT ──
            # We ignore the AI's messy YAML and inject the perfect curriculum data from the session
            if session_metadata.get("course"):
                meta["course"] = [f"[[{session_metadata['course']}]]"]
            if session_metadata.get("semester"):
                meta["semester"] = [f"[[{session_metadata['semester']}]]"]
            if session_metadata.get("unit"):
                u = session_metadata["unit"]
                meta["unit"] = int(u) if str(u).isdigit() else u
            
            # Resolve path via hardened logic in VaultManager
            target_path = self.vm.get_note_path(meta, anchored_hub_path=anchored_path)
            
            # Prepare content with clean YAML
            yaml_content = self.vm.dump_obsidian_yaml(meta)
            full_content = f"---\n{yaml_content}\n---\n\n{content.strip()}\n"

            # Write/Update the file
            self.vm.write_note(target_path, full_content)
            
            try:
                display_path = str(target_path.relative_to(self.vm.vault_path))
            except:
                display_path = str(target_path)
                
            results.append({"title": title, "path": display_path})
                
        return results
