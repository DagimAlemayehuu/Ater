#!/usr/bin/env python3
import os
import re
import yaml
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional

class VaultManager:
    """
    Manages all filesystem operations for the Obsidian Vault.
    Refactored from vault_utils.py to support dynamic vault paths.
    """
    
    TYPE_TO_DIR_MAPPING = {
        "Unit": "",
        "Foundational": "",
        "Core": "",
        "Supporting": "",
        "Questions": ""
    }

    def __init__(self, vault_path: str, academic_base: str = "1-Academic"):
        self.vault_path = Path(vault_path)
        self.academic_root = self.vault_path / academic_base.strip("/")

    def process_code_blocks(self, content: str) -> str:
        """Processes custom code block markers into standard Markdown."""
        processed_lines = []
        lines = content.splitlines()
        in_code_block = False
        current_code_language = None
        current_code_buffer = []

        for line in lines:
            start_match = re.match(r"^\s*--- START_CODE:(\w+) ---\s*$", line)
            end_match = re.match(r"^\s*--- END_CODE:(\w+) ---\s*$", line)

            if start_match:
                language = start_match.group(1)
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
            elif end_match and in_code_block and end_match.group(1) == current_code_language:
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

        if in_code_block and current_code_language:
            processed_lines.extend(current_code_buffer)
            processed_lines.append("```")

        processed_content = "\n".join(processed_lines)
        
        # Removal of Markdown formatting around wiki-links
        processed_content = re.sub(r"(\*\*?\*)(`?\[\[([^\]]+)\]\]`?)(\*\*?\*)", r"[[\3]]", processed_content)
        processed_content = re.sub(r"(\*\*?\*)(\[\[([^\]]+)\]\])(\*\*?\*)", r"[[\3]]", processed_content)
        processed_content = re.sub(r"`(\[\[([^\]]+)\]\])`", r"[[\2]]", processed_content)
        processed_content = re.sub(r"\*(\[\[([^\]]+)\]\])\*", r"[[\2]]", processed_content)
        processed_content = re.sub(r"\[\[\s*\]\]", "", processed_content)
        processed_content = re.sub(r"\[\[([^\]]+?)\|\s*[^\]]+?\]\]", r"[[\1]]", processed_content)

        return processed_content

    def extract_yaml_and_content(self, note_block: str) -> Tuple[dict, str, bool]:
        """Extracts YAML frontmatter and Markdown body content."""
        yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*(?=\n|$)", note_block, re.DOTALL)
        if not yaml_match:
            return {}, note_block, False
        
        yaml_str = yaml_match.group(1)
        body_content = note_block[yaml_match.end():]
        
        try:
            meta = yaml.safe_load(yaml_str) or {}
            return meta, body_content, False
        except yaml.YAMLError:
            return {}, body_content, True

    def sanitize_filename(self, name: str) -> str:
        """Sanitizes a string for use as a filesystem path component."""
        base_name, extension = os.path.splitext(name)
        prefix = ""
        rest_of_base_name = base_name

        prefix_match = re.match(r"^(\d+)[-_]?(.*)$", base_name)
        if prefix_match:
            prefix = f"{prefix_match.group(1)}_"
            rest_of_base_name = prefix_match.group(2)
        
        canonical_rest = self.get_canonical_title(rest_of_base_name)
        final_sanitized = re.sub(r"[^\w+]", "_", canonical_rest)
        final_sanitized = re.sub(r"_+", "_", final_sanitized)
        final_sanitized = final_sanitized.strip('_')
        
        sanitized_base_name = f"{prefix}{final_sanitized}" if final_sanitized else prefix
        return f"{sanitized_base_name.strip('_')}{extension}"

    def get_canonical_title(self, title: Any) -> str:
        """Converts a string into Title_Case_With_Underscores format."""
        if not isinstance(title, str): return ""
        
        ALWAYS_UPPERCASE = {
            "MOC", "OOP", "SQL", "API", "HTML", "CSS", "DOM", "UI", "UX", "CPU", "RAM", "OS", "AI", "NLP",
            "ERD", "CSV", "PDF", "UML", "MVC", "CRUD", "SDK", "IDE", "JVM", "REST", "SOAP", "URI", "URL",
            "GUI", "CLI", "FTP", "SSH", "SSL", "TLS", "VPN", "WAN", "LAN", "IOT", "JS", "V1", "V2", "V3",
            "ROM", "GPU", "IO", "I_O", "HTTP", "HTTPS", "DNS", "DHCP", "NTP", "ARP", "ICMP",
            "TCP", "UDP", "IP", "MAC", "GAN", "CNN", "RNN", "LSTM", "BERT", "GPT", "DL", "ML", "KBS",
            "IR", "IT", "SAD", "CD", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "C++"
        }

        numeric_part = ""
        rest = title
        numeric_prefix_match = re.match(r"^(\d+)\s*[-_]?(.*)$", title)
        if numeric_prefix_match:
            numeric_part = numeric_prefix_match.group(1)
            rest = numeric_prefix_match.group(2)

        temp = re.sub(r"C\+\+", "__CPP__", rest, flags=re.IGNORECASE)
        intermediate = re.sub(r"['\.\s\-#\(\)]+", "_", temp)
        intermediate = re.sub(r"[^\w+]+", "_", intermediate)
        intermediate = intermediate.replace("__CPP__", "C++")
        intermediate = re.sub(r"_+", "_", intermediate)
        
        words = []
        for segment in intermediate.split('_'):
            if not segment: continue
            if segment == "C++": words.append("C++")
            elif segment.upper() in ALWAYS_UPPERCASE: words.append(segment.upper())
            else: words.append(segment.title())

        canonical_rest = '_'.join(words)
        if numeric_part and canonical_rest: return f"{numeric_part}_{canonical_rest}".strip('_')
        return (numeric_part or canonical_rest).strip('_')

    def get_note_path(self, meta: dict) -> Path:
        """Determines the hierarchical file path for a note."""
        year = self.sanitize_filename(self.get_canonical_title(meta.get("year", "Unsorted_Year")))
        semester = self.sanitize_filename(self.get_canonical_title(meta.get("semester", "Unsorted_Semester")))
        course = self.sanitize_filename(self.get_canonical_title(meta.get("course", "Unsorted_Course")))
        
        note_type = meta.get("type", "Unknown")
        
        # Consistent unit directory name across all note types
        unit_val = meta.get("unit")
        if not unit_val:
            # Fallback for Unit notes if 'unit' field is missing
            unit_val = meta.get("title", "Uncategorized_Unit")
            if unit_val.endswith("_Hub"):
                unit_val = unit_val[:-4]
        
        unit_dir_name = self.get_canonical_title(unit_val)
        target_dir = self.academic_root / year / semester / course / self.sanitize_filename(unit_dir_name)
        
        title_base = self.sanitize_filename(self.get_canonical_title(meta.get("title", "Untitled_Note")))
        return target_dir / f"{title_base}.md"

    def load_metadata(self) -> List[Dict[str, Any]]:
        """Scans the vault and extracts YAML metadata."""
        all_meta = []
        if not self.academic_root.is_dir(): return []
        
        for root, _, files in os.walk(self.academic_root):
            for file in files:
                if file.endswith(".md"):
                    path = Path(root) / file
                    try:
                        with open(path, "r", encoding="utf-8") as f:
                            meta, _, _ = self.extract_yaml_and_content(f.read())
                            if meta.get("title"):
                                meta["_file_path"] = str(path)
                                all_meta.append(meta)
                    except: pass
        return all_meta

    def write_note(self, path: Path, content: str):
        """Writes note content atomically."""
        path.parent.mkdir(parents=True, exist_ok=True)
        temp = path.with_suffix(path.suffix + ".tmp")
        with open(temp, "w", encoding="utf-8") as f: f.write(content)
        temp.rename(path)

    def clean_empty_dirs(self, start_path: Path):
        """Recursively removes empty directories."""
        curr = start_path
        while curr != self.vault_path and curr != self.academic_root and curr != curr.parent:
            try:
                if not any(entry for entry in curr.iterdir() if entry.name != ".DS_Store"):
                    curr.rmdir()
                else: break
            except: break
            curr = curr.parent
