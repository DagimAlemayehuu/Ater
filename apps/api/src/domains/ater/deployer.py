#!/usr/bin/env python3
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from .vault_manager import VaultManager
from .validator import AterValidator, HARD_FAILURE_MARKERS, HARD_FAILURE_PATTERNS

class AterDeployer:
    """
    Handles the deployment of AI-generated notes into the Obsidian Vault.
    """

    def __init__(self, vault_manager: VaultManager):
        self.vm = vault_manager

    @staticmethod
    def _deep_clean_value(val: Any) -> str:
        """
        Recursively flattens nested lists/YAML artifacts back to a clean string.
        Handles: [[[Database Systems]]], ['Autumn 2025'], [[Database Systems]], etc.
        Returns a plain, bracket-free string.
        """
        # Unwrap nested lists recursively
        while isinstance(val, list):
            if len(val) == 0:
                return ""
            val = val[0]
        s = str(val).strip()
        # Strip all [[...]] and [...]  bracket forms
        s = re.sub(r"[\[\]]+", "", s).strip()
        # Strip surrounding quotes
        s = s.strip("\"'").strip()
        # Strip 'Unknown' artifacts
        if s.lower() in ("unknown", "unknown_course", "unknown_semester", "none", ""):
            return ""
        return s

    async def deploy(self, ai_output: str, session_metadata: Dict[str, Any] = {}) -> List[Dict[str, str]]:
        """
        Parses AI output and triggers batch deployment.
        Hub and PQ notes are ALWAYS deployed LAST.
        """
        raw_parts = re.split(r"-*\s*START_NOTE\s*-*", ai_output, flags=re.IGNORECASE)
        
        blocks = []
        if len(raw_parts) > 1:
            for part in raw_parts[1:]:
                end_match = re.search(r"(?i)(.*?)\s*-*\s*END_NOTE\s*-*", part, re.DOTALL)
                if end_match:
                    blocks.append(end_match.group(1).strip())
                else:
                    blocks.append(part.strip())
        else:
            blocks.append(ai_output.strip())

        notes_to_deploy = []
        for i, raw_note in enumerate(blocks):
            cleaned_note = self.vm.process_code_blocks(raw_note)
            meta, body, err = self.vm.extract_yaml_and_content(cleaned_note)
            
            if not meta.get("title"):
                first_line = body.strip().split('\n')[0]
                if first_line.startswith("# "):
                    meta["title"] = first_line[2:].strip()
                else:
                    meta["title"] = (first_line[:30] + "...") if len(first_line) > 30 else (first_line or f"Atomic_Note_{i+1}")
            
            if meta.get("title"):
                if "unit" not in meta or not meta["unit"]:
                    meta["unit"] = session_metadata.get("unit")
                if "course" not in meta or not meta["course"]:
                    meta["course"] = session_metadata.get("course")
                notes_to_deploy.append({"title": meta["title"], "content": body, "metadata": meta})
            else:
                print(f"[Ater Deployer] Warning: Block {i+1} rejected - No title found.")

        if not notes_to_deploy:
            print(f"[Ater Deployer] FAIL: 0 valid notes extracted from {len(blocks)} candidate blocks.")
            print(f"--- RAW OUTPUT PREVIEW ---\n{ai_output[:200]}...")
            return []

        print(f"[Ater Deployer] Deploying {len(notes_to_deploy)} notes for: {session_metadata.get('hub_title', 'unknown')}")
        return await self.deploy_batch(notes_to_deploy, session_metadata)

    def deploy_atomic_notes(self, session_id: str, titles: List[str], contents: List[str], plan: Any, session_path: str = "") -> List[Dict[str, str]]:
        """Surgically deploys one or more atomic notes."""
        results = []
        session_meta = plan.dict() if hasattr(plan, "dict") else plan
        session_meta["path"] = session_path
        
        # Resolve anchored path
        anchored_path = self._resolve_anchored_path(session_meta)

        for title, content in zip(titles, contents):
            # Parse components for metadata extraction
            cleaned_note = self.vm.process_code_blocks(content)
            meta, body, err = self.vm.extract_yaml_and_content(cleaned_note)
            
            # Path resolution
            is_hub_note = "hub" in title.lower() or "hub" in str(meta.get("type", "")).lower()
            target_path = self.vm.get_note_path(meta, session_metadata=session_meta, anchored_hub_path=anchored_path, is_hub_override=is_hub_note)
            
            # ── METADATA NORMALIZATION ──
            meta.setdefault("read", False)
            meta.setdefault("generated", True)
            
            # Re-assemble note with normalized YAML
            yaml_content = self.vm.dump_obsidian_yaml(meta).strip()
            full_content = f"---\n{yaml_content}\n---\n\n{body.strip()}\n"
            
            # Versioning and Embedding Indexing Hooks
            try:
                rel_path = target_path.relative_to(self.vm.vault_path).as_posix()
            except Exception:
                rel_path = str(target_path)

            if target_path.exists():
                try:
                    from .academic_db import AcademicDB
                    academic_db = AcademicDB(self.vm.vault_path)
                    with open(target_path, "r", encoding="utf-8") as f:
                        old_content = f.read()
                    academic_db.save_version(rel_path, old_content)
                except Exception as ve:
                    print(f"[Ater Deployer] Versioning failed: {ve}")

            # Physical Write
            self.vm.write_note(target_path, full_content)

            try:
                from .vault_indexer import VaultIndexer
                indexer = VaultIndexer(self.vm.vault_path)
                indexer.index_note(rel_path, full_content)
            except Exception as ie:
                print(f"[Ater Deployer] Indexing failed: {ie}")

            try:
                display_path = target_path.relative_to(self.vm.vault_path).as_posix()
            except Exception:
                display_path = str(target_path)
                
            results.append({"title": title, "path": display_path, "status": "deployed"})
            
        return results

    def deploy_hub_note(self, session_id: str, content: str, plan: Any, session_path: str = "") -> List[Dict[str, str]]:
        """Surgically deploys the unit hub."""
        session_meta = plan.dict() if hasattr(plan, "dict") else plan
        session_meta["path"] = session_path
        
        # Resolve anchored path
        anchored_path = self._resolve_anchored_path(session_meta)
        
        # Parse for metadata
        cleaned_note = self.vm.process_code_blocks(content)
        meta, body, err = self.vm.extract_yaml_and_content(cleaned_note)
        
        # ── HUB METADATA CLEANUP ──
        meta["type"] = "Hub"
        meta["source_pages"] = [1]      # Force jump to first page to avoid "NaN" range errors
        meta.pop("prerequisites", None) # Hubs do not have prerequisites
        meta.pop("mode", None)          # Hubs do not have a mode field
        meta.setdefault("status", "Not Started")
        meta.setdefault("confidence", None)
        meta.setdefault("study_date", None)
        meta.setdefault("generated", True)
        meta.pop("hub", None)           # Hub doesn't backlink to itself

        # Path resolution (Hubs have specific logic)
        target_path = self.vm.get_note_path(meta, session_metadata=session_meta, anchored_hub_path=anchored_path, is_hub_override=True)
        
        # ── TITLE ENFORCEMENT ──
        meta["title"] = target_path.stem

        # Versioning and Embedding Indexing Hooks
        try:
            rel_path = target_path.relative_to(self.vm.vault_path).as_posix()
        except Exception:
            rel_path = str(target_path)

        if target_path.exists():
            try:
                from .academic_db import AcademicDB
                academic_db = AcademicDB(self.vm.vault_path)
                with open(target_path, "r", encoding="utf-8") as f:
                    old_content = f.read()
                academic_db.save_version(rel_path, old_content)
            except Exception as ve:
                print(f"[Ater Deployer] Hub versioning failed: {ve}")

        # Re-assemble note with normalized YAML
        yaml_content = self.vm.dump_obsidian_yaml(meta).strip()
        full_content = f"---\n{yaml_content}\n---\n\n{body.strip()}\n"

        self.vm.write_note(target_path, full_content)

        try:
            from .vault_indexer import VaultIndexer
            indexer = VaultIndexer(self.vm.vault_path)
            indexer.index_note(rel_path, full_content)
        except Exception as ie:
            print(f"[Ater Deployer] Hub indexing failed: {ie}")
        
        try:
            display_path = target_path.relative_to(self.vm.vault_path).as_posix()
        except Exception:
            display_path = str(target_path)
            
        return [{"title": meta.get("title", "Hub"), "path": display_path, "status": "deployed"}]

    def _resolve_anchored_path(self, session_metadata: Dict[str, Any]) -> Optional[str]:
        """Resolves an anchored hub ID to an absolute path."""
        anchored_id = session_metadata.get("anchored_hub_id")
        if anchored_id and anchored_id != "new":
            planner_dir = Path(self.vm.vault_path) / "database" / "study planner"
            target = planner_dir / anchored_id
            if target.exists():
                return str(target.absolute())
        return None

    async def deploy_batch(self, notes: List[Dict[str, Any]], session_metadata: Dict[str, Any]) -> List[Dict[str, str]]:
        results = []
        
        # Determine anchored hub path if any
        anchored_path = None
        anchored_id = session_metadata.get("anchored_hub_id")
        if anchored_id and anchored_id != "new":
            planner_dir = Path(self.vm.vault_path) / "database" / "study planner"
            target = planner_dir / anchored_id
            if target.exists():
                anchored_path = str(target.absolute())

        # ── SESSION METADATA CLEANING ──
        # These are the authoritative values from the user-confirmed curriculum.
        # They MUST be plain strings (no [[...]] brackets) because 'course' and 'semester'
        # are Obsidian text-type properties that Dataview links automatically.
        # Using [[...]] in a text field causes YAML to parse it as a flow sequence → triple brackets.
        session_course = self._deep_clean_value(session_metadata.get("course", ""))
        session_semester = self._deep_clean_value(session_metadata.get("semester", ""))
        session_unit = str(session_metadata.get("unit", "") or "").strip()
        if session_unit.isdigit():
            session_unit_int = int(session_unit)
        else:
            session_unit_int = session_unit or None

        # ── BUILD CANONICAL HUB NAME ──
        # Matches exactly what VaultManager uses for path resolution.
        clean_hub_name = ""
        raw_hub = self._deep_clean_value(session_metadata.get("hub_title", ""))
        if raw_hub:
            c = re.sub(r"(?i)unknown", "", raw_hub).lstrip(" _-")
            while re.match(r"^\d+[\s\-_]*", c):
                c = re.sub(r"^\d+[\s\-_]*", "", c).lstrip(" _-")
            while True:
                prev = c
                c = c.replace(" Hub", "").replace("_Hub", "")
                c = c.replace(" Possible Questions", "").replace("_Possible_Questions", "")
                c = c.strip("_ ")
                if c == prev: break
            clean_hub_name = self.vm.get_canonical_title(c)

        unit_str = f"{session_unit}_" if session_unit else ""

        # ── SEPARATE HUB/PQ FROM ATOMIC NOTES ──
        # Hub and PQ must be deployed LAST so all atomic notes exist for cross-linking.
        atomic_notes = []
        hub_pq_notes = []
        for note in notes:
            t = note.get("title", "").lower()
            note_type = str(note.get("metadata", {}).get("type", "")).lower()
            is_hub = "hub" in t or "hub" in note_type
            is_pq = "questions" in t or "questions" in note_type or "possible" in t
            if is_hub or is_pq:
                hub_pq_notes.append(note)
            else:
                atomic_notes.append(note)

        ordered_notes = atomic_notes + hub_pq_notes

        for note in ordered_notes:
            # ── HARD FAILURE GATE ──────────────────────────────────────────
            # Never write a note that contains error markers from failed generation
            raw_content_check = note.get("content", "")
            if any(marker in raw_content_check for marker in HARD_FAILURE_MARKERS):
                print(f"[Ater Deployer] BLOCKED '{note.get('title', 'unknown')}': contains string error marker. Will be queued for regeneration.")
                continue
            if any(pat.search(raw_content_check) for pat in HARD_FAILURE_PATTERNS):
                print(f"[Ater Deployer] BLOCKED '{note.get('title', 'unknown')}': contains regex error pattern (hallucinated system marker). Will be queued for regeneration.")
                continue
            title = note.get("title", "Untitled")
            content = note.get("content", "")
            meta = note.get("metadata", {})

            # ── DEEP CLEAN AI METADATA ──
            # Handled by VaultManager.dump_obsidian_yaml, so we just pass raw meta.
            # We only ensure session overrides here.

            # ── AUTHORITATIVE CURRICULUM INJECTION ──
            # Always override with session data (user-confirmed values)
            if session_course:
                meta["course"] = session_course  # PLAIN STRING — no [[...]]
            if session_semester:
                meta["semester"] = session_semester  # PLAIN STRING — no [[...]]
            if session_unit_int is not None:
                meta["unit"] = session_unit_int

            # ── SOURCE PDF INJECTION ──
            session_source = None
            if session_metadata.get("path"):
                pdf_filename = Path(session_metadata["path"]).name
                # Use just the filename (without path) for wikilink portability
                session_source = f"[[{pdf_filename}]]"

            ai_source = str(meta.get("source", ""))
            if any(p in ai_source.lower() for p in ["context", "placeholder", "unknown", "none", "pdf_path"]):
                meta["source"] = session_source or ""
            elif not meta.get("source") and session_source:
                meta["source"] = session_source

            # ── SOURCE PAGES ──
            page_matches = re.findall(r"\[PAGE\s+(\d+)\]", content, re.IGNORECASE)
            if page_matches:
                seen_p = set()
                ordered_pages = []
                for p in page_matches:
                    p_int = int(p)
                    if p_int not in seen_p:
                        seen_p.add(p_int)
                        ordered_pages.append(p_int)
                meta["source_pages"] = ordered_pages
            else:
                # Robust flattening for nested list artifacts (e.g., [[8, 9]])
                raw_pages = meta.get("source_pages") or meta.get("source_page")
                if raw_pages is not None:
                    def flatten_to_ints(val):
                        if isinstance(val, list):
                            res = []
                            for item in val:
                                res.extend(flatten_to_ints(item))
                            return res
                        try:
                            s = str(val).strip()
                            if s.isdigit():
                                return [int(s)]
                        except:
                            pass
                        return []
                    
                    flattened = flatten_to_ints(raw_pages)
                    seen_p = set()
                    ordered_pages = []
                    for p in flattened:
                        p_int = int(p)
                        if p_int not in seen_p:
                            seen_p.add(p_int)
                            ordered_pages.append(p_int)
                    meta["source_pages"] = ordered_pages
                else:
                    meta.setdefault("source_pages", [])
            
            meta.pop("source_page", None)

            # ── NOTE TYPE + RELATIONAL LINKS ──
            is_hub = "hub" in title.lower() or "hub" in str(meta.get("type", "")).lower()
            is_pq = ("questions" in title.lower() or 
                     "questions" in str(meta.get("type", "")).lower() or
                     "possible" in title.lower())

            if is_hub:
                meta["type"] = "Hub"
                meta["source_pages"] = []
                meta.pop("source_page", None)
                meta.pop("mode", None)          # Hubs must NOT have a mode field
                meta.setdefault("status", "Not Started")
                meta.setdefault("confidence", None)
                meta.setdefault("study_date", None)
                meta.setdefault("generated", True)
                meta.pop("hub", None)           # Hub doesn't backlink to itself
            elif is_pq:
                meta["type"] = "Possible Questions"
                if clean_hub_name:
                    meta["hub"] = f"[[{unit_str}{clean_hub_name}_Hub]]"
                meta.setdefault("score", None)
            else:
                meta["type"] = "Atomic Note"
                if clean_hub_name:
                    meta["hub"] = f"[[{unit_str}{clean_hub_name}_Hub]]"
                meta.setdefault("mode", "DOMAIN-UNKNOWN")
                from datetime import datetime
                meta.setdefault("study_date", datetime.now().strftime("%Y-%m-%d"))

                # ── HIGH-PRIORITY LOGGING (v30.0 Pantheon) ──
                if meta.get("mode") == "DOMAIN-UNKNOWN":
                    import logging
                    logging.getLogger("Ater").warning(
                        f"🚨 [HIGH_PRIORITY_WARNING] Taxonomy Gap Detected: '{title}' generated using UNIVERSAL FALLBACK. "
                        f"Architecture requires manual taxonomy update."
                    )

                # ── Sanitise prerequisites: spaces → underscores ──
                if meta.get("prerequisites"):
                    meta["prerequisites"] = AterValidator.sanitize_prerequisites(
                        meta["prerequisites"]
                    )

            # ── PATH RESOLUTION ──
            target_path = self.vm.get_note_path(
                meta, 
                session_metadata=session_metadata, 
                anchored_hub_path=anchored_path,
                is_hub_override=is_hub
            )

            # ── TITLE ENFORCEMENT ──
            meta["title"] = target_path.stem

            # Versioning and Embedding Indexing Hooks
            try:
                rel_path = target_path.relative_to(self.vm.vault_path).as_posix()
            except Exception:
                rel_path = str(target_path)

            if target_path.exists():
                try:
                    from .academic_db import AcademicDB
                    academic_db = AcademicDB(self.vm.vault_path)
                    with open(target_path, "r", encoding="utf-8") as f:
                        old_content = f.read()
                    academic_db.save_version(rel_path, old_content)
                except Exception as ve:
                    print(f"[Ater Deployer] Batch versioning failed: {ve}")

            self.vm.write_note(target_path, full_content)

            try:
                from .vault_indexer import VaultIndexer
                indexer = VaultIndexer(self.vm.vault_path)
                indexer.index_note(rel_path, full_content)
            except Exception as ie:
                print(f"[Ater Deployer] Batch indexing failed: {ie}")

            try:
                display_path = target_path.relative_to(self.vm.vault_path).as_posix()
            except Exception:
                display_path = str(target_path)

            results.append({"title": title, "path": display_path})

        return results
