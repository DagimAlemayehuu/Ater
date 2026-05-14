import re
import yaml
import json
from typing import Any, List, Tuple, Optional

# Strings that indicate a generation failure — notes containing these must NEVER be deployed
HARD_FAILURE_MARKERS = [
    "Error generating content",
    "Error extracting artifact",
    "Error generating interactive quiz",
    "Error generating question.",
    "Error generating",
    "Error extracting",
    "is not correct, it is actually",
    "Wait, that is incorrect",
    "I should correct myself",
    "Apologies, I made a mistake",
    "Let's adjust our approach",
    "doesn't make sense in this context",
    "Let's assume a different",
    "Wait,",
    "but it doesn't visually demonstrate",
    "but it doesn't visually show",
    "This shows that... but",
    "This contradicts",
    "so we'll focus on interpreting those",
    "However, the table provides",
    "indicating a need for a more realistic approach",
    "for instructional purposes",
    "let's assume a corrected",
    "is incorrect based on miscalculation",
    "to match provided solutions",
    "let's correct and",
    "Wait, that's not right",
    "Wait, that's incorrect",
    "Upon further reflection",
    "Actually, the calculation should be",
    "Corrected version:",
    "Let's re-evaluate",
    "I'll correct that",
    "My previous explanation was slightly off",
    "Let me refine that",
    "given the nature of the question",
    "let's verify the calculation with proper steps",
    # Generation-level collapse stubs — the fallback strings _extract_xml emits
    "Content for PLAIN_ENGLISH could not be generated.",
    "Content for CORE_BREAKDOWN could not be generated.",
    "Content for ACADEMIC_TRANSLATION could not be generated.",
    "Content for MISCONCEPTIONS could not be generated.",
    "Content for ARTIFACT could not be generated.",
    "Content for LIMITATIONS could not be generated.",
    "Content for QUIZ_JSON could not be generated.",
    "could not be generated.",
    "Content pending.",
    "Artifact generation pending.",
    "Edge cases pending.",
    "adjust for accurate",
    "approximately, by correct interpolation",
]

# Regex patterns for hallucinated system markers the LLM emits when XML extraction fails
HARD_FAILURE_PATTERNS = [
    re.compile(r'\*\[SYSTEM WARNING:.*?\]\*', re.IGNORECASE | re.DOTALL),
    re.compile(r'\[SYSTEM WARNING.*?\]', re.IGNORECASE | re.DOTALL),
    re.compile(r'\[LLM ERROR.*?\]', re.IGNORECASE),
    re.compile(r'\[GENERATION FAILED.*?\]', re.IGNORECASE),
    re.compile(r'\*?LLM failed to generate the <.*?> block\.?\*?', re.IGNORECASE),
    re.compile(r'as an ai(,|\s)', re.IGNORECASE),
    re.compile(r"i(?:'m| am) unable to", re.IGNORECASE),
]

# Quiz-specific stub patterns — a quiz block containing ONLY these is pedagogically dead
QUIZ_STUB_MARKERS = [
    '"question": "Error generating question."',
    '"answer": "N/A"',
]


class AterValidator:
    """
    Nuclear-grade validation suite for Ater notes.
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
        hits = sum(1 for signal in AterValidator._CONTINUOUS_MATH_SIGNALS if signal in body_lower)
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

        # ── 0. Structural Obedience (v32.0) ──────────────────────────────────
        # Supports both # and ## as the user recently adjusted the hierarchy
        required_sections = [
            r"(?:#|##) 1\. ",
            r"(?:#|##) 2\. ",
            r"(?:#|##) 3\. ",
            r"(?:#|##) 4\. ",
            r"(?:#|##) 5\. ",
            r"(?:#|##) 6\. ",
            r"(?:#|##) 7\. "
        ]
        for section in required_sections:
            if not re.search(section, content):
                errors.append(f"MISSING_SECTION: {section}")
        for marker in HARD_FAILURE_MARKERS:
            if marker in content:
                errors.append(f"HARD_FAILURE_MARKER: '{marker}' found in content. Note must be regenerated.")
        # If any hard failures, return immediately — no point in further checks
        if any("HARD_FAILURE" in e for e in errors):
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

        # -- 3. Wikilink integrity (v33.0) — exclude self-referential links -----------
        wikilinks = re.findall(r'\[\[([^\]|]+)(?:\|[^\]]*)?\]\]', body)

        # Extract note title from YAML to exclude self-referential links
        note_title_yaml = ""
        if yaml_match:
            try:
                _meta = yaml.safe_load(yaml_match.group(1))
                if isinstance(_meta, dict):
                    note_title_yaml = str(_meta.get("title", "")).replace(" ", "_").strip()
            except Exception:
                pass

        # Filter out self-referential links (e.g., [[This_Note_Title]]) from the count
        non_self_wikilinks = [
            w for w in wikilinks
            if w.replace(" ", "_").strip() != note_title_yaml
        ]
        wikilink_count = len(non_self_wikilinks)

        # Hub/PQ notes don't need prose wikilinks — they ARE wikilinks
        note_type_match = re.search(r"type:\s*(.+)", content[:500])
        note_type = note_type_match.group(1).strip().lower() if note_type_match else ""
        if note_type not in ("hub", "possible questions") and wikilink_count < 3:
            errors.append(
                f"INSUFFICIENT_WIKILINKS: Found {wikilink_count} non-self wikilinks, need ≥ 3. "
                "Section 2 must wrap related concepts in [[Wikilinks]]. "
                "Note: self-referential links (linking to the note's own title) do not count."
            )

        # Closed Knowledge Graph Check
        if unit_stems:
            for link in wikilinks:
                canonical_link = link.replace(' ', '_').strip()
                if canonical_link not in unit_stems:
                    errors.append(f"HALLUCINATED_LINK: Concept [[{link}]] is not in the approved plan.")

        # Wikilink Format check: no spaces inside brackets
        broken_wikilinks = re.findall(r'\[\[\s+[^\]]+\]\]|\[\[[^\]]+\s+\]\]', body)
        if broken_wikilinks:
            errors.append(f"BROKEN_WIKILINKS: {broken_wikilinks[:3]} have spaces inside brackets")

        # Math Domain Guard
        if AterValidator._has_math_domain_drift(body, course, mode):
            errors.append("MATH_DOMAIN_DRIFT: Continuous math signals detected in discrete course.")

        # Intra-unit wikilinks check
        if unit_stems and note_type not in ("hub", "possible questions"):
            meta_title = meta.get("title", "") if 'meta' in locals() and isinstance(meta, dict) else ""
            intra_links = [w for w in wikilinks if w.replace(' ', '_') in unit_stems and w.replace(' ', '_') != meta_title]
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
            logging.getLogger("Ater").warning(
                "[AterValidator] Odd code fence count (%d); auto-accepted.", backtick_count
            )


        # ── 5. Interactive-quiz JSON validation ─────────────────────────────
        quiz_match = re.search(r"```interactive-quiz\s*(.*?)\s*```", body, re.DOTALL)
        if quiz_match:
            quiz_str = quiz_match.group(1).strip()
            is_valid_json, quiz_data, json_err = AterValidator.validate_json_robust(quiz_str)
            if not is_valid_json:
                errors.append(f"QUIZ_INVALID_JSON: {json_err}")
            else:
                if not isinstance(quiz_data, list):
                    errors.append(f"QUIZ_NOT_ARRAY: got {type(quiz_data).__name__}")
                elif len(quiz_data) < 1 or len(quiz_data) > 15:
                    errors.append(f"QUIZ_WRONG_LENGTH: expected 1-15 questions, got {len(quiz_data)}")
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
                        exp = str(q.get("explanation", ""))
                        if exp:
                            # ── 5.1 Hard-failure Check in Quiz Explanation ──
                            for marker in HARD_FAILURE_MARKERS:
                                if marker in exp:
                                    errors.append(f"QUIZ_Q{i+1}_HARD_FAILURE: '{marker}' found in explanation.")
                            
                            # ── 5.2 Internal Truncation Check ──
                            if exp.strip() and exp.strip()[-1] not in [".", "!", "?", "}", "]", ")", "`", "$"]:
                                errors.append(f"QUIZ_Q{i+1}_TRUNCATED_EXPLANATION: Explanation ends mid-sentence.")
                        
                        if "answer" in q:
                            ans_str = str(q["answer"])
                            # ── 5.3 Hard-failure Check in Quiz Answer ──
                            for marker in HARD_FAILURE_MARKERS:
                                if marker in ans_str:
                                    errors.append(f"QUIZ_Q{i+1}_HARD_FAILURE: '{marker}' found in answer.")
                            
                            # ── 5.2 Cross-Key Numeric Consistency ──
                            # If the explanation contains a result (e.g., 'Price = 12') but answer is '10', fail.
                            if exp:
                                ans_lower = ans_str.lower()
                                nums_in_exp = re.findall(r"=\s*([\d\.]+)", exp)
                                if nums_in_exp:
                                    last_val = nums_in_exp[-1].rstrip(".")
                                    if last_val not in ans_lower:
                                        # Only flag if both are numeric to avoid false positives on mcq keys
                                        if any(char.isdigit() for char in ans_lower):
                                            errors.append(f"QUIZ_Q{i+1}_ANSWER_DIVERGENCE: Answer '{ans_str}' diverges from explanation result '{last_val}'.")

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
            
        # ── 6.5. Truncation check ──────────────────────────────────────────
        # If the body doesn't end with a closing backtick (quiz), or punctuation, it's likely truncated.
        last_char = body.strip()[-1:] if body.strip() else ""
        valid_endings = [".", "!", "?", "`", ">", "]", "}", "|", "$", ")", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        if last_char not in valid_endings and not body.strip().endswith("```"):
            errors.append("TRUNCATED_GENERATION: The note appears to be cut off mid-sentence without proper closing punctuation.")

        # ── TRUNCATION GUARD: Check for mid-sentence cuts inside sections ──────
        # Terminate at the next ## heading of any level, the quiz fence, or end-of-string
        section_texts = re.findall(r'## (?:\d+\.)[^\n]*\n(.*?)(?=##|```interactive-quiz|$)', body, re.DOTALL)
        for section_body in section_texts:
            # v27.5 FIX: Strip markdown artifacts like ---, ***, ___ and trailing whitespace
            # before checking for terminal punctuation to avoid false-positives.
            stripped = section_body.strip()
            # Cleanly remove common markdown horizontal rules at the end of sections
            cleaned = re.sub(r'[\s\n\-\*_]+$', '', stripped)
            
            if len(cleaned) > 10:  # skip trivially empty sections only
                # Only check for truncation if this section is the very last thing in the body.
                # If it's not the last thing, the LLM successfully generated the next heading/block, so it's not truncated.
                is_last_section = body.strip().endswith(section_body.strip())
                if is_last_section:
                    last_sent_char = cleaned[-1]
                    valid_terminal = [".", "!", "?", "`", ")", "]", "}", "$", '"', ";"]
                    # Also allow sections ending with a wikilink ([[...]]) or a bare word that isn't mid-sentence
                    ends_with_wikilink = cleaned.endswith("]]") or cleaned.endswith("]")
                    # Also allow common math variables or symbols
                    ends_with_math = re.search(r'[A-Za-z\+\-\=\%]$', cleaned) is not None
                    
                    if last_sent_char not in valid_terminal and not ends_with_wikilink and not ends_with_math:
                        errors.append(f"SECTION_TRUNCATION: The final section ends mid-sentence: '...{cleaned[-40:]}'")

        # v28.4 FIX: Empty Table Kill-Switch (Section 4 Artifacts)
        if re.search(r'(?:#|##) 4\.', body):
            artifact_match = re.search(r'(?:#|##) 4\.[^\n]*\n(.*?)(?=(?:#|##) 5\.|```interactive-quiz|$)', body, re.DOTALL)
            if artifact_match:
                artifact_text = artifact_match.group(1).strip()
                if "|" in artifact_text and len(artifact_text.split("\n")) < 3:
                    errors.append("EMPTY_TABLE: Section 4 contains a malformed or empty Markdown table.")

        # ── 7. Walkthrough step count — section is ## 5. Walkthrough in the template
        walkthrough_match = re.search(r'## 5\. Walkthrough(.*?)(?=## 6\.|```interactive-quiz|$)', body, re.DOTALL)
        if walkthrough_match:
            steps = re.findall(r'^[\-\*]|^\d+\.', walkthrough_match.group(1), re.MULTILINE)
            if len(steps) < 3:
                errors.append(f"WALKTHROUGH_TOO_SHORT: Found {len(steps)} steps, need ≥ 3.")

        # ── 8. Gutter law defense (No longer logged; fixed proactively in VaultManager)
        # We previously warned here, but now we silenty accept and fix during the write phase.

        # ── 9. Regex-based Hard Failure Pattern Check ─────────────────────────
        for pattern in HARD_FAILURE_PATTERNS:
            if pattern.search(content):
                errors.append(f"REGEX_HARD_FAILURE: Pattern '{pattern.pattern[:60]}' matched — note contains hallucinated system marker.")

        return len(errors) == 0, errors

    @staticmethod
    def semantic_topic_lock(note_title: str, source_context: str, quiz_questions: list, min_keyword_hits: int = 1) -> Tuple[bool, str]:
        """
        Deterministic Semantic Topic Lock (v32.1).
        Verifies that each quiz question contains at least one keyword derived from
        the note's source_context. Prevents domain contamination / hallucinated quiz topics.

        Returns (passed, diagnosis_string).
        """
        if not source_context or not quiz_questions:
            return True, ""

        # Extract meaningful keywords from source (3+ char, non-stopword tokens)
        STOPWORDS = {
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "can", "to", "of", "in", "on", "at", "by",
            "for", "with", "from", "and", "or", "but", "not", "it", "its", "this",
            "that", "these", "those", "as", "if", "so", "yet", "nor", "than",
        }
        # Also extract keywords from the note title itself
        title_tokens = set(w.lower() for w in re.findall(r'[a-zA-Z]{3,}', note_title) if w.lower() not in STOPWORDS)
        source_tokens = set(w.lower() for w in re.findall(r'[a-zA-Z]{3,}', source_context) if w.lower() not in STOPWORDS)
        valid_keywords = source_tokens | title_tokens

        if len(valid_keywords) < 5:
            # Not enough signal — skip check to avoid false positives
            return True, ""

        failed_questions = []
        for i, q in enumerate(quiz_questions):
            if not isinstance(q, dict):
                continue
            # Combine all text fields in the question
            q_text = " ".join(str(v) for v in q.values() if isinstance(v, str)).lower()
            q_tokens = set(re.findall(r'[a-zA-Z]{3,}', q_text))
            hits = q_tokens & valid_keywords
            if len(hits) < min_keyword_hits:
                failed_questions.append(f"Q{i+1} (type={q.get('type','?')}): 0 source keywords found — possible domain contamination")

        if failed_questions:
            diagnosis = f"SEMANTIC_TOPIC_LOCK_FAIL: {len(failed_questions)}/{len(quiz_questions)} questions failed. " + "; ".join(failed_questions[:3])
            return False, diagnosis
        return True, ""

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
    def sanitize_title(title: str) -> str:
        """Ensures a title is in canonical Title_Case_With_Underscores format."""
        if not title:
            return ""
        # Remove wikilink brackets if present
        title = re.sub(r"[\[\]]+", "", title).strip().strip("\"'")
        # Normalize: replace spaces, hyphens, and repeated underscores with a single underscore
        title = re.sub(r"[\s_\-]+", "_", title)
        # Title case parts: capitalize every word
        parts = title.split("_")
        return "_".join(part.capitalize() for part in parts if part)

    @staticmethod
    def sanitize_prerequisites(prereqs: list) -> list:
        """Normalise all prerequisite titles to [[Underscore_Title_Case]] format."""
        result = []
        for p in prereqs:
            inner = AterValidator.sanitize_title(str(p))
            if inner:
                result.append(f"[[{inner}]]")
        return result
