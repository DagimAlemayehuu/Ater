#!/usr/bin/env python3
import os
import re
import uuid
import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

ALWAYS_UPPERCASE = ["ER", "DBMS", "SQL", "IS", "DDLC", "DSDLC", "IS", "IT", "AI", "UI", "UX", "CRUD", "API", "OS"]

class VaultManager:
    """
    High-fidelity Obsidian vault manager.
    Handles atomic writes, metadata extraction, and strict naming conventions.
    """

    def __init__(self, vault_path: str, academic_root: str = "2-Academic"):
        self.vault_path = Path(vault_path)
        self.academic_root = self.vault_path / academic_root
        self.academic_root.mkdir(parents=True, exist_ok=True)

    def get_canonical_title(self, text: str) -> str:
        """
        Converts any string into Strict_Title_Case_With_Underscores.
        PURE FORMATTER: Does not add or preserve prefixes.
        """
        if not text: return "Untitled"
        
        # 1. Protect C++
        temp = re.sub(r"C\+\+", "__CPP__", text, flags=re.IGNORECASE)
        
        # 2. Convert all delimiters to underscores
        intermediate = re.sub(r"['\.\s\-#\(\)]+", "_", temp)
        
        # 3. Strip non-alphanumeric except underscores and plus (for C++)
        intermediate = re.sub(r"[^\w+]+", "_", intermediate)
        
        # 4. Restore C++ and collapse underscores
        intermediate = intermediate.replace("__CPP__", "C++")
        intermediate = re.sub(r"_+", "_", intermediate).strip("_")
        
        # 5. Apply Title Case logic
        words = []
        for segment in intermediate.split('_'):
            if not segment: continue
            if segment == "C++": words.append("C++")
            elif segment.upper() in ALWAYS_UPPERCASE: words.append(segment.upper())
            else: words.append(segment.title())

        return '_'.join(words)

    def get_note_path(self, meta: dict, anchored_hub_path: Optional[str] = None) -> Path:
        """
        Determines the hierarchical file path for a note with strict academic naming.

        STRICT PROTOCOL:
          - Hubs: {Unit}_{Clean_Name}_Hub.md (Prioritizes anchored_hub_path)
          - Questions: {Unit}_{Clean_Name}_Possible_Questions.md
          - Atomic: {Strict_Title_Case_With_Underscores}.md
        """
        raw_title = meta.get("title", "Untitled_Note")
        note_type = str(meta.get("type", "")).lower()
        unit_num = str(meta.get("unit", "")).strip()

        # Clean unit_num: remove brackets or "Unknown"
        unit_num = unit_num.replace("[[", "").replace("]]", "")
        if not unit_num or unit_num.lower() == "unknown":
            unit_num = ""

        # Identify note categories
        is_hub = "hub" in note_type or "hub" in raw_title.lower()
        is_questions = "questions" in note_type or "possible_questions" in raw_title.lower()

        def super_clean(title: str) -> str:
            """Aggressively and recursively strips all metadata noise from a title."""
            c = str(title)
            # Remove "Unknown" (case-insensitive)
            c = re.sub(r"(?i)unknown", "", c)
            # Remove existing unit numbers at start (recursive: handles 3_3_ or 3 3)
            # Match any leading digit followed by space, underscore, or dash
            while re.match(r"^\d+[\s\-_]*", c):
                c = re.sub(r"^\d+[\s\-_]*", "", c)
            
            # Strip suffixes recursively to prevent Hub_Hub or Hub_Possible_Questions
            while True:
                prev = c
                c = c.replace(" Hub", "").replace("_Hub", "")
                c = c.replace(" Possible Questions", "").replace("_Possible_Questions", "")
                c = c.strip("_ ")
                if c == prev: break
            return c

        # ── 1. Master Hub (Study Planner Folder) ──
        if is_hub:
            if anchored_hub_path:
                return Path(anchored_hub_path)
            
            clean = super_clean(raw_title)
            canonical_name = self.get_canonical_title(clean)
            
            filename = f"{unit_num}_{canonical_name}_Hub.md" if unit_num else f"{canonical_name}_Hub.md"
            return self.vault_path / "3-Database" / "06 - Study Planner" / filename

        # ── 2. Possible Questions (Academic Root) ──
        if is_questions:
            clean = super_clean(raw_title)
            canonical_name = self.get_canonical_title(clean)
            
            # UNIFIED: Unit_Name_Possible_Questions
            filename = f"{unit_num}_{canonical_name}_Possible_Questions.md" if unit_num else f"{canonical_name}_Possible_Questions.md"
            return self.academic_root / "Uncategorized_Notes" / filename

        # ── 3. Atomic Notes (Academic Root) ──
        clean_atomic = super_clean(raw_title)
        canonical_title = self.get_canonical_title(clean_atomic)
        return self.academic_root / "Uncategorized_Notes" / f"{canonical_title}.md"

    def dump_obsidian_yaml(self, meta: dict) -> str:
        """Dumps YAML and strips quotes from wiki-links for Obsidian compatibility."""
        import yaml
        # Dump with default settings
        raw_yaml = yaml.dump(meta, sort_keys=False, allow_unicode=True, width=1000).rstrip('\n')
        
        # Strip quotes from wiki-links: "[[Link]]" -> [[Link]]
        # Handles both double and single quotes
        cleaned = re.sub(r"['\"](\[\[.*?\]\])['\"]", r"\1", raw_yaml)
        return cleaned

    def write_note(self, file_path: Path, content: str):
        """Asynchronously writes content to a file, ensuring parent directories exist."""
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Perform an atomic swap write to prevent data loss
        temp_file = file_path.with_suffix(f".tmp_{uuid.uuid4().hex[:8]}")
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(content)
        
        if file_path.exists():
            os.replace(temp_file, file_path)
        else:
            temp_file.rename(file_path)

    def extract_yaml_and_content(self, content: str) -> Tuple[Dict[str, Any], str, Optional[str]]:
        """Parses a note into frontmatter and body."""
        try:
            match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
            if not match:
                return {}, content, "No YAML frontmatter found"
            
            meta = yaml.safe_load(match.group(1)) or {}
            body = content[match.end():]
            return meta, body, None
        except Exception as e:
            return {}, content, str(e)

    def process_code_blocks(self, content: str) -> str:
        """Repairs and converts custom code blocks to standard backticks for Obsidian."""
        lines = content.split('\n')
        processed_lines = []
        in_code_block = False
        current_code_language = None
        current_code_buffer = []

        for line in lines:
            # AUTO-REPAIR: If a weak model uses standard triple backticks, convert them to custom markers on the fly
            if "```mermaid" in line.lower():
                line = "--- START_CODE:mermaid ---"
            elif "```text" in line.lower():
                line = "--- START_CODE:text ---"
            elif line.strip() == "```" and in_code_block:
                line = f"--- END_CODE:{current_code_language or 'text'} ---"
            elif line.strip() == "```" and not in_code_block:
                line = "--- START_CODE:text ---"

            # Flexible detection: look for START_CODE:lang and END_CODE:lang regardless of dash count or trailing noise
            start_match = re.search(r"START_CODE:(\w+)", line, re.IGNORECASE)
            end_match = re.search(r"END_CODE:(\w+)", line, re.IGNORECASE)

            if start_match:
                language = start_match.group(1).lower()
                if language in ["python", "java", "cpp", "sql", "json", "text", "mermaid"]:
                    if in_code_block:
                        processed_lines.extend(current_code_buffer)
                        current_code_buffer = []
                        processed_lines.append("```")
                    in_code_block = True
                    current_code_language = language
                    processed_lines.append(f"```{current_code_language}")
                else:
                    processed_lines.append(line)
            elif end_match and in_code_block and end_match.group(1).lower() == current_code_language:
                processed_lines.extend(current_code_buffer)
                current_code_buffer = []
                processed_lines.append("```")
                in_code_block = False
                current_code_language = None
            elif in_code_block:
                current_code_buffer.append(line)
            else:
                # Strip prohibited triple backticks from prose
                processed_lines.append(line.replace("```", ""))
        
        return '\n'.join(processed_lines)

    def load_metadata(self) -> List[Dict[str, Any]]:
        """Scans the academic root and extracts YAML metadata from all notes."""
        all_meta = []
        for file in self.academic_root.rglob("*.md"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    content = f.read()
                    meta, _, err = self.extract_yaml_and_content(content)
                    if not err:
                        meta["_file_path"] = str(file)
                        all_meta.append(meta)
            except: pass
        return all_meta
