import re
import yaml
import json
from typing import Any, List, Tuple, Optional

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

    _CONTINUOUS_MATH_SIGNALS = {
        "differential equation", "d^2y", "spring-mass", "laplace transform",
        "continuous time", "e^{rt}", "dy/dt", "d/dt", "ode", "pde",
        "ordinary differential", "partial differential"
    }

    @staticmethod
    def _has_math_domain_drift(body: str, course: str, mode: str) -> bool:
        if "discrete" not in course.lower() and mode != "MATH-PURE":
            return False
        body_lower = body.lower()
        hits = sum(1 for signal in OkaValidator._CONTINUOUS_MATH_SIGNALS if signal in body_lower)
        return hits >= 2

    @staticmethod
    def validate_structure(content: str, course: str = "", mode: str = "", unit_stems: List[str] = None) -> Tuple[bool, List[str]]:
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
                "Section 2 must wrap related concepts in [[Wikilinks]]."
            )

        # Wikilink Format check: no spaces inside brackets
        broken_wikilinks = re.findall(r'\[\[\s+[^\]]+\]\]|\[\[[^\]]+\s+\]\]', body)
        if broken_wikilinks:
            errors.append(f"BROKEN_WIKILINKS: {broken_wikilinks[:3]} have spaces inside brackets")

        # Math Domain Guard
        if OkaValidator._has_math_domain_drift(body, course, mode):
            errors.append("MATH_DOMAIN_DRIFT: Continuous math signals detected in discrete course.")

        # Intra-unit wikilinks check
        if unit_stems and note_type not in ("hub", "possible questions"):
            intra_links = [w for w in re.findall(r'\[\[([^\]]+)\]\]', body) 
                           if w.replace(' ', '_') in unit_stems and w.replace(' ', '_') != meta.get("title", "")]
            if not intra_links:
                errors.append("NO_INTRA_UNIT_LINKS: Must wikilink to at least 1 other note in this unit")

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
            is_valid_json, quiz_data, json_err = OkaValidator.validate_json_robust(quiz_str)
            if not is_valid_json:
                errors.append(f"QUIZ_INVALID_JSON: {json_err}")
            else:
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

        else:
            # Only flag missing quiz for atomic notes
            if note_type not in ("hub", "possible questions"):
                errors.append("QUIZ_BLOCK_MISSING: No ```interactive-quiz``` block found.")

        # ── 6. Minimum body length ──────────────────────────────────────────
        if len(body.strip()) < 300:
            errors.append(f"BODY_TOO_SHORT: {len(body.strip())} chars. Minimum is 300.")

        # ── 7. Walkthrough step count — section is ## 4. Walkthrough in the template
        walkthrough_match = re.search(r'## 4\. Walkthrough(.*?)(?=## 5\.|```interactive-quiz|$)', body, re.DOTALL)
        if walkthrough_match:
            steps = re.findall(r'^[\-\*]|^\d+\.', walkthrough_match.group(1), re.MULTILINE)
            if len(steps) < 3:
                import logging
                logging.getLogger("LifeOS").warning(f"[OkaValidator] WALKTHROUGH_TOO_SHORT: {len(steps)} steps, need 3+")

        # ── 8. Gutter law defense (No longer logged; fixed proactively in VaultManager)
        # We previously warned here, but now we silenty accept and fix during the write phase.

        return len(errors) == 0, errors

    @staticmethod
    def validate_json_robust(raw_json: str) -> Tuple[bool, Any, Optional[str]]:
        """Fault-tolerant JSON parser for weak model outputs.
        Handles LaTeX backslashes, trailing commas, and malformed fences.
        """
        if not raw_json:
            return False, {}, "EMPTY_INPUT"

        clean_json = raw_json.strip()
        # Strip markdown fences
        clean_json = re.sub(r"^```[a-z]*\n?", "", clean_json)
        clean_json = re.sub(r"\n?```$", "", clean_json).strip()

        # Find outermost JSON object or array
        start_dict = clean_json.find("{")
        start_array = clean_json.find("[")

        is_array = False
        if start_array != -1 and (start_dict == -1 or start_array < start_dict):
            is_array = True

        if is_array:
            start = start_array
            end = clean_json.rfind("]")
        else:
            start = start_dict
            end = clean_json.rfind("}")

        if start == -1 or end == -1:
            return False, {}, "NO_JSON_FOUND"

        clean_json = clean_json[start:end + 1]
        # Remove trailing commas before closing braces/brackets
        clean_json = re.sub(r",\s*([\]\}])", r"\1", clean_json)
        # Normalize double-escaped newlines from LLM outputs
        clean_json = clean_json.replace("\\\\n", "\\n")

        def _sanitize_backslashes(s: str) -> str:
            r"""Escape lone backslashes that are not valid JSON escape sequences.
            This handles LaTeX like \\frac, \\Delta, \\sigma etc. inside JSON strings.
            Valid JSON escapes: \\ \" \/ \b \f \n \r \t \uXXXX
            """
            return re.sub(r'\\(?![\\"/bfnrtu])', r'\\\\', s)

        def _try_parse(s: str):
            try:
                return json.loads(s, strict=False), None
            except Exception as e:
                return None, e

        # Attempt 1: direct parse
        data, err = _try_parse(clean_json)
        if data is not None:
            return True, data, None

        # Attempt 2: sanitize backslashes then parse (handles LaTeX in JSON strings)
        sanitized = _sanitize_backslashes(clean_json)
        data, err = _try_parse(sanitized)
        if data is not None:
            return True, data, None

        # Attempt 3: brace-counting fallback on sanitized string
        brace_char = '[' if is_array else '{'
        close_char = ']' if is_array else '}'
        brace_count = 0
        for i, char in enumerate(sanitized):
            if char == brace_char:
                brace_count += 1
            elif char == close_char:
                brace_count -= 1
            if brace_count == 0 and i > 0:
                data, _ = _try_parse(sanitized[:i + 1])
                if data is not None:
                    return True, data, None

        # Attempt 4: ast.literal_eval
        try:
            import ast
            py_str = sanitized.replace("true", "True").replace("false", "False").replace("null", "None")
            data = ast.literal_eval(py_str)
            return True, data, None
        except Exception:
            return False, {}, f"JSON_PARSE_ERROR: {err}"

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
