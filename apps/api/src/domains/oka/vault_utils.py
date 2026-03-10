"""
OKA Vault Utilities - Centralized logic for canonical naming, path generation,
and structural validation of Obsidian notes.
"""

import re
import os
from datetime import datetime

class VaultUtils:
    @staticmethod
    def get_canonical_title(title: str) -> str:
        """
        Enforces A.1.3 logic: 
        1. Exclusively use underscores (_) as word separators.
        2. Conform to Title_Case_With_Underscores.
        3. Strictly prohibited: Apostrophes ('), periods (.), hyphens (-), 
           commas (,), parentheses (), brackets [], etc.
        4. Exception: The plus sign (+) is permitted only in canonical 
           language names (e.g., "C++").
        """
        if not title:
            return ""

        # Handle C++ exception
        is_cpp = "C++" in title
        if is_cpp:
            title = title.replace("C++", "TEMP_CPP_PLACEHOLDER")

        # 1. Replace prohibited characters with underscores
        # Prohibited: ' . - , ( ) [ ] { } # / \ : * ? " < > |
        # We also replace spaces.
        prohibited_pattern = r"['\.\-,\(\)\[\]\{\}#\/\\:\*\?\"<>\| \t]+"
        title = re.sub(prohibited_pattern, "_", title)

        # 2. Cleanup double underscores
        title = re.sub(r"_+", "_", title).strip("_")

        # 3. Enforce Title Case on each word
        parts = []
        for word in title.split("_"):
            if not word:
                continue
            # Capitalize first letter, keep rest as is (or lower? 
            # Protocol says "Title_Case_With_Underscores")
            # Usually Title Case means "This_Is_A_Title"
            parts.append(word[0].upper() + word[1:] if len(word) > 1 else word.upper())

        canonical = "_".join(parts)

        # Restore C++
        if is_cpp:
            canonical = canonical.replace("TEMP_CPP_PLACEHOLDER", "C++")

        return canonical

    @staticmethod
    def get_note_path_hierarchical(vault_path: str, metadata: dict) -> str:
        """
        A.1.3.6: All notes in one unit folder.
        Path: {vault_path}/1-Academic/{year}/{semester}/{course}/{unit}/{title}.md
        """
        year = VaultUtils.get_canonical_title(metadata.get("year", "Unsorted_Year"))
        semester = VaultUtils.get_canonical_title(metadata.get("semester", "Unsorted_Semester"))
        course = VaultUtils.get_canonical_title(metadata.get("course", "General_Computer_Science"))
        unit = VaultUtils.get_canonical_title(metadata.get("unit", "Uncategorized_Unit"))
        
        # Enforce Hub naming convention
        title = metadata.get("title", "Unknown_Title")
        note_type = metadata.get("type", "")
        if note_type.lower() in ["hub", "unit"]:
            if not title.endswith("_Hub"):
                title = f"{title}_Hub"
        
        title = VaultUtils.get_canonical_title(title)

        relative_dir = os.path.join("1-Academic", year, semester, course, unit)
        full_dir = os.path.join(vault_path, relative_dir)
        
        return os.path.join(full_dir, f"{title}.md")

    @staticmethod
    def validate_yaml_integrity(content: str) -> dict:
        """
        Parses YAML and checks for mandatory fields:
        year, semester, course, unit, title, credits, type
        """
        yaml_match = re.search(r'^---\s*(.*?)\s*---', content, re.DOTALL)
        if not yaml_match:
            return {"valid": False, "error": "Missing YAML frontmatter"}

        yaml_text = yaml_match.group(1)
        metadata = {}
        for line in yaml_text.split('\n'):
            if ':' in line:
                key, val = line.split(':', 1)
                metadata[key.strip()] = val.strip().strip('"')

        mandatory_fields = ["year", "semester", "course", "unit", "title", "type"]
        missing = [f for f in mandatory_fields if f not in metadata]
        
        if missing:
            return {"valid": False, "error": f"Missing mandatory YAML fields: {', '.join(missing)}", "metadata": metadata}

        return {"valid": True, "metadata": metadata}
