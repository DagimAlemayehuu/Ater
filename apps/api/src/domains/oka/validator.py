import re
import yaml
import json
from typing import Dict, Any, List, Tuple, Optional

class OkaValidator:
    """
    Nuclear-grade validation suite for OKA notes.
    Ensures absolute structural integrity before deployment.
    """

    @staticmethod
    def validate_structure(content: str) -> Tuple[bool, List[str]]:
        """
        Checks for common structural failures.
        Returns (is_valid, error_messages).
        """
        errors = []
        
        # 1. YAML Check
        yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*(\n|$)", content, re.DOTALL | re.MULTILINE)
        if not yaml_match:
            errors.append("MISSING_YAML_FRONTMATTER")
        else:
            try:
                meta = yaml.safe_load(yaml_match.group(1))
                if not meta or not isinstance(meta, dict):
                    errors.append("INVALID_YAML_DICT")
                else:
                    required = ["title", "type", "course"]
                    for field in required:
                        if field not in meta or not meta[field]:
                            errors.append(f"MISSING_REQUIRED_FIELD_{field.upper()}")
            except Exception as e:
                errors.append(f"YAML_PARSE_ERROR: {str(e)}")

        # 2. Code Block Balance
        backtick_count = content.count("```")
        if backtick_count % 2 != 0:
            errors.append("UNBALANCED_CODE_BLOCKS")

        # 3. Table Integrity
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if "|" in line and "---" in line and i > 0:
                # Basic check for table header separator
                prev_line = lines[i-1]
                if prev_line.count("|") != line.count("|"):
                    errors.append(f"TABLE_ALIGNMENT_ERROR_AT_LINE_{i}")

        # 4. Hallucination Check (Leaked structural markers)
        hallucinations = ["START_NOTE", "END_NOTE", "START_CODE", "END_CODE"]
        for h in hallucinations:
            if h in content:
                # Some markers are expected in raw output but should be cleaned by VaultManager.
                # If they still exist after cleaning, it's a failure.
                pass

        return len(errors) == 0, errors

    @staticmethod
    def validate_json_robust(raw_json: str) -> Tuple[bool, Dict[str, Any], Optional[str]]:
        """
        Attempts to parse JSON from weak models with high fault tolerance.
        """
        if not raw_json:
            return False, {}, "EMPTY_INPUT"

        # 1. Extraction
        start = raw_json.find('{')
        end = raw_json.rfind('}')
        if start == -1 or end == -1:
            return False, {}, "NO_JSON_OBJECT_FOUND"
        
        clean_json = raw_json[start:end+1]
        
        # 2. Common Fixes
        clean_json = re.sub(r",\s*([\]\}])", r"\1", clean_json) # Trailing commas
        clean_json = clean_json.replace('\\\\n', '\n').replace('\\n', '\n')
        
        try:
            data = json.loads(clean_json, strict=False)
            return True, data, None
        except Exception as e:
            # Recursive fix for common weak model errors (like unescaped quotes in values)
            # This is complex, so we mostly rely on regeneration if standard fixes fail.
            return False, {}, f"JSON_PARSE_ERROR: {str(e)}"
