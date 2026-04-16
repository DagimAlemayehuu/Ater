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
        if len(raw_parts) > 1:
            for part in raw_parts[1:]: # Skip text before first START_NOTE
                # Find the content up to the FIRST occurrence of END_NOTE in this part
                # Be extremely permissive with dashes and whitespace
                end_match = re.search(r"(?i)(.*?)\s*-*\s*END_NOTE\s*-*", part, re.DOTALL)
                if end_match:
                    blocks.append(end_match.group(1).strip())
                else:
                    # Fallback: just take the rest if END_NOTE is missing but START_NOTE was found
                    blocks.append(part.strip())
        else:
            # CRITICAL FALLBACK: If AI forgot START_NOTE (common on Batch 1/Hub), 
            # treat the entire cleaned output as a single block.
            blocks.append(ai_output.strip())

        notes_to_deploy = []
        for i, raw_note in enumerate(blocks):
            cleaned_note = self.vm.process_code_blocks(raw_note)
            meta, body, err = self.vm.extract_yaml_and_content(cleaned_note)
            
            # If YAML failed but we have content, try to synthesize a title from the first line or use a generic one
            if not meta.get("title"):
                first_line = body.strip().split('\n')[0]
                if first_line.startswith("# "):
                    meta["title"] = first_line[2:].strip()
                else:
                    # Final fallback: use the first 30 chars as title if no specific title found
                    meta["title"] = (first_line[:30] + "...") if len(first_line) > 30 else (first_line or f"Atomic_Note_{i+1}")
            
            if meta.get("title"):
                # Ensure metadata has unit/course for pathing
                if "unit" not in meta or not meta["unit"]: meta["unit"] = session_metadata.get("unit")
                if "course" not in meta or not meta["course"]: meta["course"] = session_metadata.get("course")
                notes_to_deploy.append({"title": meta["title"], "content": body, "metadata": meta})
            else:
                print(f"[OKA Deployer] Warning: Block {i+1} rejected - No title found.")

        if not notes_to_deploy:
            print(f"[OKA Deployer] FAIL: 0 valid notes extracted from {len(blocks)} candidate blocks.")
            print(f"--- RAW OUTPUT PREVIEW ---\n{ai_output[:200]}...")
            return []

        print(f"[OKA Deployer] Deploying {len(notes_to_deploy)} notes for session {session_metadata.get('hub_title', 'unknown')}")
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
            
            # ── METADATA CLEANUP (PYYAML FIX) ──
            # If PyYAML parsed [[Link]] as a list of lists, flatten it back to a string
            for key, val in meta.items():
                if isinstance(val, list) and len(val) == 1 and isinstance(val[0], list) and len(val[0]) == 1:
                    meta[key] = f"[[{val[0][0]}]]"
                elif isinstance(val, list) and len(val) == 1 and isinstance(val[0], str) and val[0].startswith("[["):
                    # Handle single string in list if it looks like a wiki link
                    meta[key] = val[0]

            # ── METADATA ENFORCEMENT ──
            # We ignore the AI's messy YAML and inject the perfect curriculum data from the session
            if session_metadata.get("course"):
                meta["course"] = f"[[{session_metadata['course']}]]"
            if session_metadata.get("semester"):
                meta["semester"] = f"[[{session_metadata['semester']}]]"
            if session_metadata.get("unit"):
                u = session_metadata["unit"]
                meta["unit"] = int(u) if str(u).isdigit() else u
            
            # Inject source PDF if available
            session_source = None
            if session_metadata.get("path"):
                pdf_filename = Path(session_metadata["path"]).name
                try:
                    rel_pdf = str(Path(session_metadata["path"]).relative_to(self.vm.vault_path))
                    session_source = f"[[{rel_pdf}]]"
                except:
                    session_source = f"[[{pdf_filename}]]"

            # Sanitization of AI source
            ai_source = str(meta.get("source", ""))
            if any(p in ai_source.lower() for p in ["context", "placeholder", "unknown", "none", "pdf_path"]):
                meta["source"] = session_source or ai_source
            elif not meta.get("source") and session_source:
                meta["source"] = session_source
            
            if session_source and not meta.get("source"):
                meta["source"] = session_source

            # Robust Page Extraction — always produce source_pages as a sorted int list.
            # Priority: [PAGE X] markers injected during planning > AI-provided source_pages > AI source_page
            page_matches = re.findall(r"\[PAGE\s+(\d+)\]", content, re.IGNORECASE)
            if page_matches:
                pages = sorted(set(int(p) for p in page_matches))
                meta["source_pages"] = pages
            elif isinstance(meta.get("source_pages"), list):
                # AI filled in source_pages correctly — normalize to ints
                try:
                    meta["source_pages"] = sorted(set(int(p) for p in meta["source_pages"] if str(p).isdigit()))
                except Exception:
                    meta["source_pages"] = []
            elif meta.get("source_page") is not None:
                # Legacy fallback: AI used singular source_page — promote to list
                try:
                    meta["source_pages"] = [int(meta["source_page"])]
                except Exception:
                    meta["source_pages"] = []
            else:
                meta.setdefault("source_pages", [])
            # Always remove singular key to keep schema clean
            meta.pop("source_page", None)

            # Inject type and relational links
            is_hub = "hub" in title.lower() or "hub" in str(meta.get("type", "")).lower()
            is_pq = "questions" in title.lower() or "questions" in str(meta.get("type", "")).lower()
            
            clean_hub_name = ""
            if session_metadata.get("hub_title"):
                # Clean the hub title the exact same way VaultManager does to build the relational link
                raw_hub = session_metadata.get("hub_title", "")
                c = re.sub(r"(?i)unknown", "", raw_hub)
                c = c.lstrip(" _-")
                while re.match(r"^\d+[\s\-_]*", c):
                    c = re.sub(r"^\d+[\s\-_]*", "", c)
                    c = c.lstrip(" _-")
                while True:
                    prev = c
                    c = c.replace(" Hub", "").replace("_Hub", "")
                    c = c.replace(" Possible Questions", "").replace("_Possible_Questions", "")
                    c = c.strip("_ ")
                    if c == prev: break
                clean_hub_name = self.vm.get_canonical_title(c)
                
            unit_str = f"{session_metadata.get('unit')}_" if session_metadata.get("unit") else ""
            
            # Additional logic to ensure all notes have source and source_pages if session has path
            if session_metadata.get("path") and "source" not in meta:
                # Fallback in case the logic above was skipped
                meta["source"] = f"[[{Path(session_metadata['path']).name}]]"

            if is_hub:
                meta["type"] = "Hub"
                meta["source_pages"] = []  # Hub aggregates — pages tracked per atomic note
                meta.pop("source_page", None)
                meta.setdefault("status", "Not Started")
                meta.setdefault("confidence", None)
                meta.setdefault("study_date", None)
                meta.setdefault("generated", False)
            elif is_pq:
                meta["type"] = "Possible Questions"
                if clean_hub_name:
                    meta["hub"] = f"[[{unit_str}{clean_hub_name}_Hub]]"
                meta.setdefault("score", None)
            else:
                meta["type"] = "Atomic Note"
                if clean_hub_name:
                    meta["hub"] = f"[[{unit_str}{clean_hub_name}_Hub]]"
                meta.setdefault("mode", meta.get("mode", "ENGINEER"))
            
            # Resolve path via hardened logic in VaultManager
            target_path = self.vm.get_note_path(meta, session_metadata=session_metadata, anchored_hub_path=anchored_path)
            
            # ── TITLE ENFORCEMENT ──
            # The path resolution does intense cleaning. We must reflect that clean name in the YAML title.
            meta["title"] = target_path.stem

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
