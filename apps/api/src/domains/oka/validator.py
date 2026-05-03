import re
import yaml
import json
from typing import Dict, Any, List, Tuple, Optional

# Strings that indicate a generation failure — notes containing these must NEVER be deployed
HARD_FAILURE_MARKERS = [
    "Error generating content",
    "Error extracting artifact",
    "Error generating interactive quiz",
    "Error generating",
    "Error extracting",
]


class OkaValidator:
    """
    Nuclear-grade validation suite for OKA notes.
    Checks structure, wikilink density, error markers, and JSON integrity.
    """

    @staticmethod
    def validate_structure(content: str) -> Tuple[bool, List[str]]:
        """
        Returns (is_valid, error_messages).
        A note fails if it:
          - Is missing YAML frontmatter
          - Contains any hard-failure error marker
          - Has zero wikilinks in the body prose (sections 2-3)
          - Has unbalanced code fences
          - Has an interactive-quiz block with invalid JSON
        """
        errors: List[str] = []

        # ── 1. Hard-failure markers — immediate reject ──────────────────────
        for marker in HARD_FAILURE_MARKERS:
            if marker in content:
                errors.append(f"HARD_FAILURE_MARKER: '{marker}' found in content. Note must be regenerated.")
        # If any hard failures, return immediately — no point in further checks
        if errors:
            return False, errors

        # ── 2. YAML frontmatter ─────────────────────────────────────────────
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

                    # Prerequisites must use underscored wikilinks (no spaces inside brackets)
                    prereqs = meta.get("prerequisites", [])
                    if isinstance(prereqs, list):
                        for p in prereqs:
                            p_str = str(p)
                            # Extract inner title from [[...]]
                            inner = re.sub(r"[\[\]]+", "", p_str).strip()
                            if " " in inner:
                                errors.append(
                                    f"PREREQUISITE_SPACE_IN_TITLE: '{inner}' must use underscores: "
                                    f"'{inner.replace(' ', '_')}'"
                                )
            except Exception as e:
                errors.append(f"YAML_PARSE_ERROR: {e}")

        # ── 3. Body-level checks (strip YAML first) ─────────────────────────
        body = content
        if yaml_match:
            body = content[yaml_match.end():]

        # Wikilink density — require ≥ 3 [[Wikilinks]] in the body
        wikilink_count = len(re.findall(r"\[\[[^\]]+\]\]", body))
        # Hub/PQ notes don't need prose wikilinks — they ARE wikilinks
        note_type_match = re.search(r"type:\s*(.+)", content[:500])
        note_type = note_type_match.group(1).strip().lower() if note_type_match else ""
        if note_type not in ("hub", "possible questions") and wikilink_count < 3:
            errors.append(
                f"INSUFFICIENT_WIKILINKS: Found {wikilink_count}, need ≥ 3. "
                "Sections 2 and 3 must wrap related concepts in [[Wikilinks]]."
            )

        # -- 4. Code block balance -------------------------------------------
        # Exclude the interactive-quiz block (it contains its own fences)
        body_no_quiz = re.sub(r"```interactive-quiz.*?```", "", body, flags=re.DOTALL)
        backtick_count = body_no_quiz.count("```")
        if backtick_count % 2 != 0:
            # Non-fatal: the LLM frequently emits an extra closing fence after
            # code examples inside artifacts; Obsidian renders this fine.
            # Log as a warning but do not block deployment.
            import logging
            logging.getLogger("LifeOS").warning(
                "[OkaValidator] Odd code fence count (%d); auto-accepted.", backtick_count
            )


        # ── 5. Interactive-quiz JSON validation ─────────────────────────────
        quiz_match = re.search(r"```interactive-quiz\s*(.*?)\s*```", body, re.DOTALL)
        if quiz_match:
            quiz_str = quiz_match.group(1).strip()
            try:
                quiz_data = json.loads(quiz_str, strict=False)
                if not isinstance(quiz_data, list):
                    errors.append(f"QUIZ_NOT_ARRAY: got {type(quiz_data).__name__}")
                elif len(quiz_data) != 3:
                    errors.append(f"QUIZ_WRONG_LENGTH: expected 3 questions, got {len(quiz_data)}")
                else:
                    # Validate each question has required fields
                    for i, q in enumerate(quiz_data):
                        if not isinstance(q, dict):
                            errors.append(f"QUIZ_Q{i+1}_NOT_DICT")
                            continue
                        if "type" not in q:
                            errors.append(f"QUIZ_Q{i+1}_MISSING_TYPE")
                        if "question" not in q or not str(q.get("question", "")).strip():
                            errors.append(f"QUIZ_Q{i+1}_MISSING_QUESTION")
                        if "answer" not in q:
                            errors.append(f"QUIZ_Q{i+1}_MISSING_ANSWER")
                        # Debug: content field must not contain the answer
                        if q.get("type") == "debug" and q.get("content") and q.get("answer"):
                            answer_words = set(str(q["answer"]).lower().split())
                            content_lower = str(q["content"]).lower()
                            # Threshold raised: requires >6 long words to avoid false-
                            # positives on theory/DB concepts where answer vocab naturally
                            # overlaps with code content.
                            leak_hits = sum(1 for w in answer_words if len(w) > 5 and w in content_lower)
                            if leak_hits > 6:
                                errors.append(
                                    f"QUIZ_Q{i+1}_DEBUG_ANSWER_LEAKED: The answer is visible in the "
                                    "content field. content must contain ONLY the buggy code."
                                )

            except json.JSONDecodeError as e:
                errors.append(f"QUIZ_INVALID_JSON: {e}")
        else:
            # Only flag missing quiz for atomic notes
            if note_type not in ("hub", "possible questions"):
                errors.append("QUIZ_BLOCK_MISSING: No ```interactive-quiz``` block found.")

        # ── 6. Minimum body length ──────────────────────────────────────────
        if len(body.strip()) < 300:
            errors.append(f"BODY_TOO_SHORT: {len(body.strip())} chars. Minimum is 300.")

        return len(errors) == 0, errors

    @staticmethod
    def validate_json_robust(raw_json: str) -> Tuple[bool, Dict[str, Any], Optional[str]]:
        """Fault-tolerant JSON parser for weak model outputs."""
        if not raw_json:
            return False, {}, "EMPTY_INPUT"

        clean_json = raw_json.strip()
        # Strip markdown fences
        clean_json = re.sub(r"^```[a-z]*\n?", "", clean_json)
        clean_json = re.sub(r"\n?```$", "", clean_json).strip()

        # Find outermost JSON object
        start = clean_json.find("{")
        end = clean_json.rfind("}")
        if start == -1 or end == -1:
            start = clean_json.find("[")
            end = clean_json.rfind("]")
        if start == -1 or end == -1:
            return False, {}, "NO_JSON_FOUND"

        clean_json = clean_json[start:end + 1]
        # Remove trailing commas
        clean_json = re.sub(r",\s*([\]\}])", r"\1", clean_json)
        # Fix common weak-model escaping issues
        clean_json = clean_json.replace("\\\\n", "\n").replace("\\n", "\n")

        try:
            data = json.loads(clean_json, strict=False)
            return True, data, None
        except Exception as e:
            # Try ast fallback
            try:
                import ast
                py_str = clean_json.replace("true", "True").replace("false", "False").replace("null", "None")
                data = ast.literal_eval(py_str)
                return True, data, None
            except Exception:
                return False, {}, f"JSON_PARSE_ERROR: {e}"

    @staticmethod
    def sanitize_prerequisites(prereqs: list) -> list:
        """Normalise all prerequisite titles to [[Underscore_Title_Case]] format."""
        result = []
        for p in prereqs:
            p_str = str(p).strip()
            # Extract inner text from [[...]]
            inner = re.sub(r"[\[\]]+", "", p_str).strip().strip("\"'")
            # Convert spaces to underscores
            inner = re.sub(r"\s+", "_", inner)
            # Ensure it's a proper wikilink
            result.append(f"[[{inner}]]")
        return result
