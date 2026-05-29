#!/usr/bin/env python3
import os
import re
import uuid
import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

ALWAYS_UPPERCASE = ["ER", "DBMS", "SQL", "IS", "DDLC", "DSDLC", "IS", "IT", "AI", "UI", "UX", "CRUD", "API", "OS"]

class VaultManager:
    """
    High-fidelity Obsidian vault manager.
    Handles atomic writes, metadata extraction, and strict naming conventions.
    """

    def __init__(self, vault_path: str, academic_root: str = "Notes"):
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


    def deep_clean_scalar(self, v) -> str:
        """Recursively unwrap nested lists and strip all bracket/quote artifacts."""
        while isinstance(v, list):
            v = v[0] if v else ""
        s = str(v).strip()
        s = re.sub(r"[\[\]]+", "", s).strip("\"' ")
        if s.lower() in ("unknown", "unknown_course", "unknown_semester", "none", ""):
            return ""
        return s

    def super_clean(self, title: str) -> str:
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

    def get_note_path(self, meta: dict, session_metadata: Optional[dict] = None, anchored_hub_path: Optional[str] = None, is_hub_override: Optional[bool] = None) -> Path:
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
        # A Hub is identified by its type or title, OR if it matches the session hub context
        is_hub = is_hub_override
        if is_hub is None:
            is_hub = (
                "hub" in note_type or 
                "hub" in raw_title.lower() or 
                (session_metadata and session_metadata.get("hub_title") == raw_title)
            )
        is_questions = "questions" in note_type or "possible_questions" in raw_title.lower()

        # ── Compute canonical path components upfront (needed by ALL branches) ──
        raw_course_clean = self.deep_clean_scalar(raw_course)
        raw_semester_clean = self.deep_clean_scalar(raw_semester)

        clean_course = self.get_canonical_title(self.super_clean(raw_course_clean))
        # Semester folder uses the human-readable name directly (e.g. "Autumn 2025"),
        # matching the actual folder structure in the Obsidian vault.
        clean_semester = raw_semester_clean or "General"

        if clean_course.lower() in ("unknown_course", "unknown", "untitled", ""):
            clean_course = "General_Knowledge"
        
        # We need the clean Hub Name for the folder
        clean_hub_base = self.super_clean(raw_hub)
        canonical_hub_base = self.get_canonical_title(clean_hub_base)
        
        # Ensure unit folder name is clean and NOT just a number
        unit_prefix = f"{unit_num}_" if unit_num else ""
        unit_folder_name = f"{unit_prefix}{canonical_hub_base}"
        
        # Final safety check: if unit_folder_name still contains "Unknown", replace it
        if "Unknown" in unit_folder_name:
            unit_folder_name = unit_folder_name.replace("Unknown", "Uncategorized")

        target_dir = self.academic_root / clean_semester / clean_course / unit_folder_name

        # ── 1. Master Hub ──
        if is_hub:
            if anchored_hub_path:
                return Path(anchored_hub_path)
            
            clean = self.super_clean(raw_title)
            canonical_name = self.get_canonical_title(clean)
            filename = f"{unit_num}_{canonical_name}_Hub.md" if unit_num else f"{canonical_name}_Hub.md"
            
            # Smart Redirect: Hubs MUST live in the Study Planner for Academic Dashboard visibility
            planner_dir = self.vault_path / "database" / "study planner"
            
            # Existence check (case-insensitive) to prevent "of" vs "Of" duplicates
            if planner_dir.exists():
                for existing_file in planner_dir.glob("*.md"):
                    if existing_file.name.lower() == filename.lower():
                        return existing_file
            
            return planner_dir / filename

        # ── 2. Possible Questions (Academic Root) ──
        if is_questions:
            clean = self.super_clean(raw_title)
            canonical_name = self.get_canonical_title(clean)
            filename = f"{unit_num}_{canonical_name}_Possible_Questions.md" if unit_num else f"{canonical_name}_Possible_Questions.md"
            return target_dir / filename

        # ── 3. Atomic Notes (Academic Root) ──
        clean_atomic = self.super_clean(raw_title)
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
        """Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -> [[X]]
        Applied as final defense before bytes hit disk."""
        # Inside brackets (any nesting of spaces+quotes): [["X"]] -> [[X]]
        text = re.sub(r'\[\[\s*["\']([^\]"\' ][^\]"\']*)["\']\s*\]\]', r'[[\1]]', text)
        return text

    def dump_obsidian_yaml(self, meta: dict) -> str:
        """Dumps YAML with correct Obsidian property types.
        
        KEY DISTINCTION:
        - 'course', 'semester', 'hub', 'parent', 'source' -> WIKILINK properties (Scalar).
        - 'prerequisites', 'concepts' -> WIKILINK properties (List).
        """
        import yaml

        WIKILINK_SCALAR_FIELDS = {"hub", "parent", "source"}
        WIKILINK_LIST_FIELDS = {"prerequisites", "concepts"}

        def deep_clean_item(v, is_wikilink: bool = False) -> str:
            while isinstance(v, list):
                v = v[0] if v else ""
            s = str(v).strip()
            # Remove brackets/quotes for cleaning
            cleaned = re.sub(r"[\[\]]+", "", s).strip("\"' ")
            if not cleaned or cleaned.lower() in ("unknown", "none", "null"):
                return ""
            if is_wikilink:
                return f"[[{cleaned}]]"
            return cleaned

        cleaned = {}
        for k, v in meta.items():
            if k in WIKILINK_SCALAR_FIELDS:
                cleaned[k] = deep_clean_item(v, is_wikilink=True)
            elif k in WIKILINK_LIST_FIELDS:
                if isinstance(v, list):
                    items = []
                    for item in v:
                        ci = deep_clean_item(item, is_wikilink=True)
                        if ci: items.append(ci)
                    cleaned[k] = items
                else:
                    ci = deep_clean_item(v, is_wikilink=True)
                    cleaned[k] = [ci] if ci else []
            else:
                # Default handling
                if isinstance(v, list):
                    cleaned[k] = [self._strip_wikilink_quotes(i) for i in v]
                else:
                    cleaned[k] = self._strip_wikilink_quotes(v)

        class FlowList(list):
            pass

        # Wrap tags and source_pages in FlowList to force flow-style matching the audit regex
        if "tags" in cleaned and isinstance(cleaned["tags"], list):
            cleaned["tags"] = FlowList(cleaned["tags"])
        if "source_pages" in cleaned and isinstance(cleaned["source_pages"], list):
            cleaned["source_pages"] = FlowList(cleaned["source_pages"])

        # LAYER 2: Custom Dumper — force double quotes for [[wikilink]] strings and flow style for tags/source_pages
        class ObsidianDumper(yaml.Dumper):
            pass

        def _str_representer(dumper, data):
            if (data.startswith('[[') and data.endswith(']]')) or data.isdigit():
                return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')
            return dumper.represent_scalar('tag:yaml.org,2002:str', data)

        def _flow_list_representer(dumper, data):
            return dumper.represent_sequence('tag:yaml.org,2002:seq', data, flow_style=True)

        ObsidianDumper.add_representer(str, _str_representer)
        ObsidianDumper.add_representer(FlowList, _flow_list_representer)

        raw = yaml.dump(
            cleaned,
            Dumper=ObsidianDumper,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False,
        )

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
        # 2. PROACTIVE GUTTER DEFENSE: Ensure headings and rules have a blank line above them
        # (also Setext double-newline defense and table/codeblock gutters)
        lines = content.split('\n')
        fixed_lines = []
        in_frontmatter = False
        in_code_block = False
        in_table = False
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            if i == 0 and stripped == "---":
                in_frontmatter = True
                fixed_lines.append(line)
                continue
                
            if in_frontmatter:
                fixed_lines.append(line)
                if stripped == "---":
                    in_frontmatter = False
                continue

            # Outside frontmatter checks
            is_hr = (stripped == "---")
            is_heading = stripped.startswith("#")
            is_code_fence = stripped.startswith("```")
            is_table_row = stripped.startswith("|") and stripped.endswith("|")

            # Handling transitions into blocks/elements
            if is_hr:
                # Setext defense: Needs EXACTLY double newlines before it
                while len(fixed_lines) > 0 and fixed_lines[-1].strip() == "":
                    fixed_lines.pop()
                fixed_lines.append("")
                fixed_lines.append("")
                fixed_lines.append(line)
                fixed_lines.append("") # Gutter after
                continue
                
            if is_heading:
                if len(fixed_lines) > 0 and fixed_lines[-1].strip() != "":
                    fixed_lines.append("")
                fixed_lines.append(line)
                fixed_lines.append("") # Gutter after
                continue
                
            if is_code_fence:
                if not in_code_block:
                    if len(fixed_lines) > 0 and fixed_lines[-1].strip() != "":
                        fixed_lines.append("")
                    fixed_lines.append(line)
                    in_code_block = True
                else:
                    fixed_lines.append(line)
                    fixed_lines.append("") # Gutter after
                    in_code_block = False
                continue
                
            if is_table_row:
                if not in_table:
                    if len(fixed_lines) > 0 and fixed_lines[-1].strip() != "":
                        fixed_lines.append("")
                    in_table = True
                fixed_lines.append(line)
                continue
            else:
                if in_table:
                    if len(fixed_lines) > 0 and fixed_lines[-1].strip() != "":
                        fixed_lines.append("")
                    in_table = False

            if not (is_hr or is_heading or is_code_fence or is_table_row):
                # Avoid appending duplicate empty lines
                if stripped == "" and len(fixed_lines) > 0 and fixed_lines[-1].strip() == "":
                    continue
                fixed_lines.append(line)

        final_content = "\n".join(fixed_lines)
        
        # Perform an atomic swap write
        temp_file = file_path.with_suffix(f".tmp_{uuid.uuid4().hex[:8]}")
        print(f"[VaultManager] Persisting Note: {file_path.absolute()}")
        
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(final_content.strip())
        
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
        lines = content.split('\n')
        final_lines = []
        in_code_block = False
        
        FORBIDDEN_LANGS = ["python", "mermaid", "sql", "c++", "cpp", "javascript", "json", "yaml", "java", "c#", "interactive-quiz"]
        
        for line in lines:
            stripped = line.strip()
            lower_stripped = stripped.lower()
            
            # Start of a standard block
            if stripped.startswith("```"):
                tag = stripped[3:].strip().lower()
                if tag == "c++": tag = "cpp"
                
                if not in_code_block:
                    in_code_block = True
                    final_lines.append(f"```{tag}" if tag else "```")
                else:
                    # If we see ```cpp while already in a block, it's a re-start.
                    if tag in FORBIDDEN_LANGS:
                        final_lines.append("```")
                        final_lines.append("")
                        final_lines.append(f"```{tag}")
                    else:
                        # It's a normal closure
                        final_lines.append("```")
                        in_code_block = False
                continue
            
            # AUTO-REPAIR: If we see a language name alone on a line
            if lower_stripped in FORBIDDEN_LANGS:
                if not in_code_block:
                    final_lines.append(f"```{lower_stripped}")
                    in_code_block = True
                else:
                    # Re-start inside a block
                    final_lines.append("```")
                    final_lines.append("")
                    final_lines.append(f"```{lower_stripped}")
                continue
            
            if in_code_block:
                # Force close if we see a markdown header inside a code block (likely LLM failure)
                if stripped.startswith("##") or stripped.startswith("###") or (stripped.startswith("---") and len(stripped) < 10):
                    final_lines.append("```")
                    final_lines.append("")
                    final_lines.append(line)
                    in_code_block = False
                else:
                    final_lines.append(line)
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
            except Exception:
                pass
        return all_meta
