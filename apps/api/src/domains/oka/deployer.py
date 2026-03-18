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

    def deploy(self, ai_output: str) -> List[Dict[str, str]]:
        """
        Parses AI output and deploys notes. Returns a list of deployment results.
        """
        # Capture blocks including START_NOTE and END_NOTE markers (more robust regex)
        note_pattern = re.compile(
            r"(---?\s*START_NOTE\s*---?\s*\n.*?\n\s*---?\s*END_NOTE\s*---?)",
            re.DOTALL | re.IGNORECASE
        )
        blocks = [b.strip() for b in note_pattern.findall(ai_output)]
        
        if not blocks:
            return []

        # Load existing metadata for UID/Title matching
        existing_notes = self.vm.load_metadata()
        uid_map = {n["uid"]: n for n in existing_notes if "uid" in n}
        title_map = {self.vm.get_canonical_title(n["title"]): n for n in existing_notes if "title" in n}

        results = []
        current_utc = datetime.utcnow().isoformat(timespec='seconds') + 'Z'

        for block in blocks:
            inner_match = re.search(r"---?\s*START_NOTE\s*---?\s*\n(.*?)\n\s*---?\s*END_NOTE\s*---?", block, re.DOTALL | re.IGNORECASE)
            if not inner_match: continue
            
            raw_note = inner_match.group(1)
            cleaned_note = self.vm.process_code_blocks(raw_note)
            meta, body, err = self.vm.extract_yaml_and_content(cleaned_note)
            
            if err or not meta.get("title"):
                continue

            title = meta["title"]
            canonical_title = self.vm.get_canonical_title(title)
            uid = meta.get("uid")

            # Match with existing note
            existing = None
            orig_path = None
            
            if uid and uid in uid_map:
                existing = uid_map[uid]
            elif canonical_title in title_map:
                existing = title_map[canonical_title]
                if not uid: meta["uid"] = existing.get("uid")
            
            if existing:
                orig_path = Path(existing["_file_path"])
                meta["uid"] = existing["uid"]
                meta["created_at"] = existing.get("created_at", current_utc)
                meta["last_modified"] = current_utc
                
                # Simple log update
                existing_log = existing.get("ai_refinement_log", "")
                new_log = meta.get("ai_refinement_log", "AI updated note")
                meta["ai_refinement_log"] = f"{existing_log}\n{current_utc}: {new_log}".strip()
            else:
                meta["uid"] = meta.get("uid") or str(uuid.uuid4())
                meta["created_at"] = current_utc
                meta["last_modified"] = current_utc
                meta.setdefault("deployment_batch_id", "LIFE_OS_AUTO")

            # Finalize metadata for pathing
            target_path = self.vm.get_note_path(meta)
            
            # Prepare full file content
            yaml_content = yaml.dump(meta, sort_keys=False, allow_unicode=True).rstrip('\n')
            full_content = f"---\n{yaml_content}\n---\n\n{body.strip()}\n"

            # Execute write/move
            status = "created"
            if existing and orig_path:
                if target_path != orig_path:
                    status = "moved"
                    if orig_path.exists():
                        orig_path.unlink()
                        self.vm.clean_empty_dirs(orig_path.parent)
                else:
                    status = "updated"
            
            self.vm.write_note(target_path, full_content)
            results.append({
                "title": title,
                "path": str(target_path.relative_to(self.vm.vault_path)),
                "status": status,
                "uid": meta["uid"]
            })

        return results
