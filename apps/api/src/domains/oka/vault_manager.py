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
        self.vault_path = Path(vault_path).resolve()
        
        # Handle the academic path root carefully
        # If it's absolute, use it. If it's relative, join it with the vault root.
        academic_p = Path(academic_base)
        if academic_p.is_absolute():
            self.academic_root = academic_p.resolve()
        else:
            # Cleanly strip leading/trailing slashes for relative paths
            clean_rel = academic_base.strip("/")
            self.academic_root = (self.vault_path / clean_rel).resolve()

    def process_code_blocks(self, content: str) -> str:
        """Processes custom code block markers into standard Markdown."""
        processed_lines = []
        lines = content.splitlines()
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
        # Try standard --- YAML --- format first (allow leading whitespace and 3+ dashes)
        yaml_match = re.search(r"^\s*-{3,}\s*(?:\r?\n)(.*?)(?:\r?\n)-{3,}\s*(?:\r?\n|$)", note_block.strip(), re.DOTALL)
        
        # Fallback 1: Model skipped leading --- but kept trailing ---
        if not yaml_match:
            yaml_match = re.search(r"^\s*(title:.*?)(?:\r?\n)-{3,}\s*(?:\r?\n|$)", note_block.strip(), re.DOTALL)
            
        # Fallback 2: Extremely permissive (just find content between first two --- blocks)
        if not yaml_match:
            yaml_match = re.search(r"-{3,}\s*(.*?)\s*-{3,}", note_block, re.DOTALL)
            
        if not yaml_match:
            # TITLE RECOVERY FALLBACK: If AI provided "# Title" instead of YAML
            title_match = re.search(r"^\s*#+\s*(.*?)\s*(?:\n|$)", note_block)
            if title_match:
                recov_title = title_match.group(1).strip().replace("[[", "").replace("]]", "")
                print(f"[VaultManager] Recovered title '{recov_title}' from header")
                return {"title": recov_title}, note_block, False
            return {}, note_block, False
        
        yaml_str = yaml_match.group(1)
        body_content = note_block.strip()[yaml_match.end():]
        
        try:
            # Use safe_load for robust parsing
            meta = yaml.safe_load(yaml_str) or {}
            # Ensure keys are lowercase for consistent access and strip whitespace
            if isinstance(meta, dict):
                meta = {str(k).lower().strip(): v for k, v in meta.items()}
            else:
                meta = {}
            return meta, body_content, False
        except Exception as e:
            # Try to recover title even on YAML error
            title_match = re.search(r"title:\s*(.*)", yaml_str, re.I)
            if title_match:
                recov_title = title_match.group(1).strip().strip('"').strip("'")
                print(f"[VaultManager] Non-critical YAML structural error. Recovered title '{recov_title}' for process continuity.")
                return {"title": recov_title}, body_content, False
            
            print(f"[VaultManager] YAML Parse Fail: {e}")
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
        """
        Determines the hierarchical file path for a note.
        
        Routing logic:
          - Hubs go to: 3-Database/06 - Study Planner/
          - All other notes go to: {Selected_Root}/Uncategorized_Notes/
        """
        title = meta.get("title", "Untitled_Note")
        canonical_title = self.get_canonical_title(title)
        
        note_type = str(meta.get("type", "")).lower()
        is_hub = "hub" in note_type or "hub" in title.lower() or "questions" in note_type
        
        if is_hub:
            # Route to Study Planner
            target_dir = self.vault_path / "3-Database" / "06 - Study Planner"
            filename = f"{canonical_title}.md"
            return target_dir / filename
        
        # Route directly to the flat Uncategorized_Notes folder within the user-selected root
        target_dir = self.academic_root / "Uncategorized_Notes"
        filename = f"{canonical_title}.md"
        
        return target_dir / filename


    def load_metadata(self) -> List[Dict[str, Any]]:
        """Scans the vault and extracts YAML metadata from all knowledge directories."""
        all_meta = []
        scan_roots = [
            self.academic_root,
            self.vault_path / "1-Knowledge",
        ]
        
        for scan_root in scan_roots:
            if not scan_root.is_dir():
                continue
            for root, _, files in os.walk(scan_root):
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
        """Writes note content atomically. No deletion logic."""
        path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = path.with_suffix(path.suffix + f".{uuid.uuid4().hex[:8]}.tmp")
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                f.write(content)
            # Atomic swap
            temp_path.replace(path)
        except Exception as e:
            print(f"[VaultManager] Write Error: {e}")
            if temp_path.exists():
                temp_path.unlink()
            raise e

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
