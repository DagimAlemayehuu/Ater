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
        # Robust Batch Capture (Permissive Dash/Punctuation)
        batch_match = re.search(r"START_BATCH(.*?)END_BATCH", ai_output, re.DOTALL | re.IGNORECASE)
        content_to_parse = batch_match.group(1) if batch_match else ai_output

        # Universal Note Extraction (Keyword-Targeted)
        # We split by START_NOTE and then for each part, we find the content up to END_NOTE.
        # Allow 3 or more dashes and optional whitespace
        raw_parts = re.split(r"-{3,}\s*START_NOTE\s*-{3,}", content_to_parse, flags=re.IGNORECASE)
        
        blocks = []
        for part in raw_parts[1:]: # Skip text before first START_NOTE
            # Find the content up to the FIRST occurrence of END_NOTE in this part
            end_match = re.search(r"(?i)(.*?)\s*-{3,}\s*END_NOTE\s*-{3,}", part, re.DOTALL)
            if end_match:
                blocks.append(end_match.group(1).strip())
            else:
                # Fallback: if END_NOTE is missing its dashes or has other variations
                end_match_fallback = re.search(r"(?i)(.*?)\s*END_NOTE", part, re.DOTALL)
                if end_match_fallback:
                    blocks.append(end_match_fallback.group(1).strip())
        
        if not blocks:
            # Last resort fallback: if the model used NO dashes for START_NOTE/END_NOTE
            raw_parts_no_dash = re.split(r"START_NOTE", content_to_parse, flags=re.IGNORECASE)
            for part in raw_parts_no_dash[1:]:
                end_match = re.search(r"(?i)(.*?)\s*END_NOTE", part, re.DOTALL)
                if end_match:
                    blocks.append(end_match.group(1).strip())

        if not blocks:
            print(f"[OKA Deployer] FAIL: No START_NOTE...END_NOTE regions detected. Output len: {len(ai_output)}")
            return []

        # Load existing metadata for UID/Title matching
        existing_notes = self.vm.load_metadata()
        uid_map = {n["uid"]: n for n in existing_notes if "uid" in n}
        title_map = {self.vm.get_canonical_title(n["title"]): n for n in existing_notes if "title" in n}

        results = []
        current_utc = datetime.utcnow().isoformat(timespec='seconds') + 'Z'

        for raw_note in blocks:
            cleaned_note = self.vm.process_code_blocks(raw_note)
            meta, body, err = self.vm.extract_yaml_and_content(cleaned_note)
            
            if err or not meta.get("title"):
                print(f"[OKA Deployer] WARN: Parsing failed for note block (len: {len(raw_note)}). Meta: {list(meta.keys())}")
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
            print(f"[OKA Deployer] {status.upper()}: {target_path}")
            
            try:
                display_path = str(target_path.relative_to(self.vm.vault_path))
            except ValueError:
                # Fallback if target_path is not inside vault_path
                display_path = str(target_path)
                
            results.append({
                "title": title,
                "path": display_path,
                "status": status,
                "uid": meta["uid"]
            })

        return results
