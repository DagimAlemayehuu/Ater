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
        
        # 0a. Strip [[wikilink]] brackets and surrounding quotes (defensive — input may carry them)
        text = text.replace("[[", "").replace("]]", "").strip().strip("\"'").strip()
        if not text: return "Untitled"
        
        # 0b. Strip "Title:" prefix if AI accidentally included it in the string
        text = re.sub(r"(?i)^title\s*:\s*", "", text)
        
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

    def get_note_path(self, meta: dict, session_metadata: Optional[dict] = None, anchored_hub_path: Optional[str] = None) -> Path:
        """
        Determines the hierarchical file path for a note with strict academic naming.
        """
        raw_title = meta.get("title", "Untitled_Note")
        note_type = str(meta.get("type", "")).lower()
        session_meta = session_metadata or {}
        
        # Use session data first, fallback to AI meta
        unit_num = str(session_meta.get("unit") or meta.get("unit", "")).strip()
        raw_course = str(session_meta.get("course") or meta.get("course") or "Unknown_Course")
        raw_semester = str(session_meta.get("semester") or meta.get("semester") or "Unknown_Semester")
        raw_hub = str(session_meta.get("hub_title") or raw_title)

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
            c = re.sub(r"(?i)unknown", "", c)
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
            return c

        # ── 1. Master Hub ──
        if is_hub:
            if anchored_hub_path:
                return Path(anchored_hub_path)
            
            clean = super_clean(raw_title)
            canonical_name = self.get_canonical_title(clean)
            filename = f"{unit_num}_{canonical_name}_Hub.md" if unit_num else f"{canonical_name}_Hub.md"
            
            # DEFAULT: Put Hub in the unit folder for cohesion
            target_dir = self.academic_root / clean_semester / clean_course / unit_folder_name
            return target_dir / filename

        # ── Deep Academic Folder Pathing ──
        # Clean course and semester — strip [[wikilinks]], nested lists, quotes FIRST
        def deep_clean_scalar(v) -> str:
            """Recursively unwrap nested lists and strip all bracket/quote artifacts."""
            while isinstance(v, list):
                v = v[0] if v else ""
            s = str(v).strip()
            s = re.sub(r"[\[\]]+", "", s).strip("\"' ")
            if s.lower() in ("unknown", "unknown_course", "unknown_semester", "none", ""):
                return ""
            return s

        raw_course_clean = deep_clean_scalar(raw_course)
        raw_semester_clean = deep_clean_scalar(raw_semester)

        clean_course = self.get_canonical_title(super_clean(raw_course_clean))
        # Semester folder uses the human-readable name directly (e.g. "Autumn 2025"),
        # matching the actual folder structure in the Obsidian vault.
        clean_semester = raw_semester_clean or "General"

        if clean_course.lower() in ("unknown_course", "unknown", "untitled", ""):
            clean_course = "General_Knowledge"
        
        # We need the clean Hub Name for the folder
        clean_hub_base = super_clean(raw_hub)
        canonical_hub_base = self.get_canonical_title(clean_hub_base)
        
        # Ensure unit folder name is clean and NOT just a number
        unit_prefix = f"{unit_num}_" if unit_num else ""
        unit_folder_name = f"{unit_prefix}{canonical_hub_base}"
        
        # Final safety check: if unit_folder_name still contains "Unknown", replace it
        if "Unknown" in unit_folder_name:
            unit_folder_name = unit_folder_name.replace("Unknown", "Uncategorized")

        target_dir = self.academic_root / clean_semester / clean_course / unit_folder_name

        # ── 2. Possible Questions (Academic Root) ──
        if is_questions:
            clean = super_clean(raw_title)
            canonical_name = self.get_canonical_title(clean)
            filename = f"{unit_num}_{canonical_name}_Possible_Questions.md" if unit_num else f"{canonical_name}_Possible_Questions.md"
            return target_dir / filename

        # ── 3. Atomic Notes (Academic Root) ──
        clean_atomic = super_clean(raw_title)
        canonical_title = self.get_canonical_title(clean_atomic)
        return target_dir / f"{canonical_title}.md"

    @staticmethod
    def _strip_wikilink_quotes(value: Any) -> Any:
        """Recursively strips ALL quote forms from [[wikilink]] strings."""
        if isinstance(value, str):
            # Inside brackets: [["X"]] or [['X']] -> [[X]]
            value = re.sub(r'\[\[\s*["\'](.+?)["\']\s*\]\]', r'[[\1]]', value)
            # Wrapping the whole value: "[[X]]" or '[[X]]' -> [[X]]
            value = re.sub(r'^["\']+(\[\[.+?\]\])["\' ]*$', r'\1', value.strip())
        elif isinstance(value, list):
            value = [VaultManager._strip_wikilink_quotes(v) for v in value]
        elif isinstance(value, dict):
            value = {k: VaultManager._strip_wikilink_quotes(v) for k, v in value.items()}
        return value

    @staticmethod
    def _nuclear_wikilink_clean(text: str) -> str:
        """Strips every possible quote pattern around/inside [[wikilinks]] in any text.
        Applied as final defense before bytes hit disk — covers both YAML and body."""
        # Inside brackets (any nesting of spaces+quotes): [["X"]] -> [[X]]
        text = re.sub(r'\[\[\s*["\']([^\]"\' ][^\]"\']*)["\']\s*\]\]', r'[[\1]]', text)
        # YAML scalar: key: "[[X]]" or key: '[[X]]'
        text = re.sub(r'(:\s*)["\']+(\[\[.*?\]\])["\' ]*$', r'\1\2', text, flags=re.MULTILINE)
        # YAML list item: - "[[X]]" or - '[[X]]'
        text = re.sub(r'(^\s*-\s*)["\']+(\[\[.*?\]\])["\' ]*$', r'\1\2', text, flags=re.MULTILINE)
        # Body prose: "[[X]]" or '[[X]]' (standalone, not in a key: val context)
        text = re.sub(r'["\']+(\[\[[^\]]+\]\])["\' ]+', r'\1', text)
        return text

    def dump_obsidian_yaml(self, meta: dict) -> str:
        """Dumps YAML with correct Obsidian property types.
        
        KEY DISTINCTION:
        - 'course' and 'semester' → PLAIN TEXT properties (Obsidian links via Dataview).
          Using [[...]] in these fields causes YAML to parse them as flow sequences,
          producing the triple-bracket corruption [[[Database Systems]]].
        - 'hub', 'parent', 'source' → WIKILINK properties. These legitimately use [[...]].
          PyYAML would quote them, so we force plain scalar style.
        """
        import yaml

        PLAIN_TEXT_FIELDS = {"course", "semester"}
        WIKILINK_FIELDS = {"hub", "parent", "source"}

        # LAYER 1: Deep-clean all values
        cleaned = {}
        for k, v in meta.items():
            if k in PLAIN_TEXT_FIELDS:
                # Strip ALL bracket/wikilink artifacts — must be plain text
                while isinstance(v, list):
                    v = v[0] if v else ""
                v = str(v).strip()
                v = re.sub(r"[\[\]]+", "", v).strip("\"' ")
                cleaned[k] = v
            elif k in WIKILINK_FIELDS:
                # Keep as [[...]] string — will use plain scalar style
                cleaned[k] = VaultManager._strip_wikilink_quotes(v)
            else:
                cleaned[k] = VaultManager._strip_wikilink_quotes(v)

        # LAYER 2: Custom Dumper — force plain scalar style for [[wikilink]] strings
        class ObsidianDumper(yaml.Dumper):
            pass

        def _str_representer(dumper, data):
            if '[[' in data:
                # Force YAML plain style so it never gets quoted
                return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='')
            return dumper.represent_scalar('tag:yaml.org,2002:str', data)

        ObsidianDumper.add_representer(str, _str_representer)

        raw = yaml.dump(
            cleaned,
            Dumper=ObsidianDumper,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False,
        )

        # LAYER 3: Final safety pass — strip any surviving YAML-level quotes around wikilinks
        raw = re.sub(r":\s*[\"'](\[\[.*?\]\])[\"']$", r": \1", raw, flags=re.MULTILINE)
        raw = re.sub(r"-\s*[\"'](\[\[.*?\]\])[\"']$", r"- \1", raw, flags=re.MULTILINE)
        raw = re.sub(r'\[\[\s*["\'](.*?)["\']\s*\]\]', r'[[\1]]', raw)
        raw = re.sub(r"^title:\s*[\"'](.+?)[\"']$", r"title: \1", raw, flags=re.MULTILINE)

        return raw

    def write_note(self, file_path: Path, content: str):
        """Asynchronously writes content to a file, ensuring parent directories exist."""
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Clean up any AI artifacts that leaked into the content
        content = re.sub(r"(?i)--- START_CODE:?\s*yaml ---", "", content)
        content = re.sub(r"(?i)--- END_CODE:?\s*yaml ---", "", content)
        content = re.sub(r"(?i)--- START_NOTE ---", "", content)
        content = re.sub(r"(?i)--- END_NOTE ---", "", content)

        # NUCLEAR WIKILINK SANITIZATION: applied to the entire file string before write.
        # Catches every form of quoted wikilinks regardless of where they appear.
        content = VaultManager._nuclear_wikilink_clean(content)
        
        # Normalize casing for all wikilinks: force Title_Case for any word split by space or underscore
        def title_case_wikilink(match):
            inner = match.group(1)
            parts = re.split(r'([_\s]+)', inner)
            new_parts = []
            for p in parts:
                if re.match(r'[_\s]+', p):
                    new_parts.append(p)
                elif p.upper() == "C++":
                    new_parts.append("C++")
                else:
                    # Special case for alphanumeric words that might be caught
                    new_parts.append(p.title())
            return "[[" + "".join(new_parts) + "]]"
            
        content = re.sub(r'\[\[([^\]]+)\]\]', title_case_wikilink, content)
        
        # Perform an atomic swap write to prevent data loss
        temp_file = file_path.with_suffix(f".tmp_{uuid.uuid4().hex[:8]}")
        # Explicit absolute path logging for verification
        print(f"[VaultManager] Persisting Note: {file_path.absolute()}")
        
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(content.strip())
        
        if file_path.exists():
            os.replace(temp_file, file_path)
        else:
            temp_file.rename(file_path)

    def extract_yaml_and_content(self, content: str) -> Tuple[Dict[str, Any], str, Optional[str]]:
        """Parses a note into frontmatter and body."""
        try:
            # 1. Try strict match first (must start at top of block or file)
            match = re.search(r"^\s*---\s*\n(.*?)\n---\s*(\n|$)", content, re.DOTALL | re.MULTILINE)
            
            # 2. Relaxed match: look for ANY block between --- and --- if strict fails
            if not match:
                match = re.search(r"---\s*\n(.*?)\n---", content, re.DOTALL)

            if match:
                meta = yaml.safe_load(match.group(1)) or {}
                # Body is everything AFTER the second ---
                body = content[match.end():].strip()
                return meta, body, None
            
            return {}, content, "No YAML frontmatter found"
        except Exception as e:
            return {}, content, str(e)

    def process_code_blocks(self, content: str) -> str:
        """Standardizes and protects code blocks in content for Obsidian."""
        # 1. Strip structural markers entirely
        content = re.sub(r"(?i)--- START_CODE:?\s*yaml ---\s*\n", "", content)
        content = re.sub(r"(?i)\n\s*--- END_CODE:?\s*yaml ---", "", content)
        content = re.sub(r"(?i)--- START_NOTE ---\s*\n", "", content)
        content = re.sub(r"(?i)\n\s*--- END_NOTE ---", "", content)
        
        # 2. Convert custom markers to standard if they exist
        content = re.sub(r"(?i)--- START_CODE:?\s*(\w+) ---", r"```\1", content)
        content = re.sub(r"(?i)--- END_CODE:?\s*(\w+) ---", r"```", content)
        
        # 3. Native Backtick Protection
        # We want to keep all ``` blocks. The only thing we "repair" is if the LLM 
        # forgot the backticks but wrote the language name.
        lines = content.split('\n')
        final_lines = []
        in_code_block = False
        
        FORBIDDEN_LANGUAGES = ["python", "mermaid", "sql", "c++", "cpp", "javascript", "json", "yaml", "java", "c#"]
        
        for line in lines:
            stripped = line.strip().lower()
            
            # Start of a standard block
            if line.strip().startswith("```"):
                in_code_block = not in_code_block
                final_lines.append(line)
                continue
            
            # AUTO-REPAIR: If we see a language name alone on a line while NOT in a block,
            # it is almost certainly a failed backtick start from the LLM.
            if stripped in FORBIDDEN_LANGUAGES and not in_code_block:
                final_lines.append(f"```{stripped}")
                in_code_block = True
            else:
                final_lines.append(line)
        
        # If we ended still in a block (forgot to close), close it
        if in_code_block:
            final_lines.append("```")
            
        return '\n'.join(final_lines)

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
