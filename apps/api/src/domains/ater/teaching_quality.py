"""Deterministic quality gate for Teach Anything Markdown.

This module is intentionally model-free. The weak model may draft prose, but
this code owns the final accept/reject decision for Teach Anything notes.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, Iterable, List


_FENCE_RE = re.compile(r"```interactive-quiz\s*(.*?)```", re.IGNORECASE | re.DOTALL)


FORBIDDEN_PATTERNS: tuple[tuple[str, str], ...] = (
    ("PROMPT_LEAK", r"\bplease provide a comprehensive\b"),
    ("PROMPT_LEAK", r"\bwithin the context of\b"),
    ("SOURCE_PLACEHOLDER", r"\bsource'?s treatment\b"),
    ("SOURCE_PLACEHOLDER", r"\bexact language and constraints shown in the source\b"),
    ("SOURCE_PLACEHOLDER", r"\bsource context directly connects\b"),
    ("SOURCE_PLACEHOLDER", r"\bthis follows directly from the source'?s definition\b"),
    ("PLACEHOLDER_QUIZ", r"\bCorrect explanation\b"),
    ("PLACEHOLDER_QUIZ", r"\bIncorrect distractor\b"),
    ("PLACEHOLDER_ANSWER", r"\bA strong answer defines\b"),
    ("INTERNAL_MARKER", r"\bSYSTEM CONSTRAINT\b"),
    ("INTERNAL_MARKER", r"\bCRITICAL FIX REQUIRED\b"),
    ("INTERNAL_MARKER", r"\bSOURCE HINT\b"),
)


@dataclass(frozen=True)
class TeachingConceptSpec:
    topic: str
    chapter_title: str
    note_title: str
    prompt: str = ""
    mode: str = "ACADEMIC-GENERAL"
    modality: str = "Qualitative/Definitional"
    source_context: str = ""
    related_titles: tuple[str, ...] = field(default_factory=tuple)

    @property
    def readable_title(self) -> str:
        return _readable(self.note_title)

    @property
    def readable_topic(self) -> str:
        return _readable(self.topic)


@dataclass(frozen=True)
class TeachingQualityIssue:
    code: str
    message: str


@dataclass(frozen=True)
class TeachingQualityReport:
    ok: bool
    issues: tuple[TeachingQualityIssue, ...] = ()

    def codes(self) -> list[str]:
        return [issue.code for issue in self.issues]

    def summary(self) -> str:
        if self.ok:
            return "ok"
        return "; ".join(f"{issue.code}: {issue.message}" for issue in self.issues)


def build_default_grounding_context(spec: TeachingConceptSpec) -> str:
    """Build neutral context for source-free teaching.

    This is context, not an instruction. It must never look like text the model
    could copy as an answer.
    """
    related = ", ".join(_readable(t) for t in spec.related_titles[:8] if t)
    lines = [
        f"Learning topic: {spec.readable_topic}.",
        f"Chapter scope: {_readable(spec.chapter_title)}.",
        f"Focused concept: {spec.readable_title}.",
    ]
    if spec.prompt:
        lines.append(f"User learning request: {spec.prompt.strip()[:300]}.")
    if related:
        lines.append(f"Nearby concepts in this learning path: {related}.")
    lines.append("Use only direct, learner-facing explanations. Do not mention missing sources.")
    return "\n".join(lines)


def validate_teaching_markdown(markdown: str, spec: TeachingConceptSpec) -> TeachingQualityReport:
    issues: list[TeachingQualityIssue] = []
    body = markdown or ""
    lower = body.lower()

    if len(body.strip()) < 700:
        issues.append(TeachingQualityIssue("TOO_SHORT", "note body is too short to teach the concept"))

    required_headings = ("Mental Model", "The Proving Grounds")
    for heading in required_headings:
        if not re.search(rf"^##\s+{re.escape(heading)}\s*$", body, flags=re.IGNORECASE | re.MULTILINE):
            issues.append(TeachingQualityIssue("MISSING_HEADING", f"missing required heading: {heading}"))

    middle_headings = re.findall(r"^##\s+(?!Mental Model\b|The Proving Grounds\b).+", body, flags=re.IGNORECASE | re.MULTILINE)
    if len(middle_headings) < 2:
        issues.append(TeachingQualityIssue("MISSING_TEACHING_SECTIONS", "note needs at least two teaching sections"))

    for code, pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, body, flags=re.IGNORECASE):
            issues.append(TeachingQualityIssue(code, f"matched forbidden pattern: {pattern}"))

    if _looks_truncated(body):
        issues.append(TeachingQualityIssue("TRUNCATED", "note appears to end mid-thought"))
    if _looks_corrupted(body):
        issues.append(TeachingQualityIssue("CORRUPTED_PROSE", "note contains malformed or spliced prose"))

    focused_title = _concept_label(spec.readable_title, spec.readable_topic)
    title_terms = _important_terms(focused_title)
    if title_terms:
        hits = sum(1 for term in title_terms if term in lower)
        if hits < min(2, len(title_terms)):
            issues.append(TeachingQualityIssue("OFF_TOPIC", "note does not sufficiently discuss the focused concept"))

    if not _mentions_any(body, [focused_title, spec.readable_title, spec.note_title]):
        issues.append(TeachingQualityIssue("MISSING_CONCEPT_NAME", "note does not name the focused concept"))

    if not _is_cs_mode(spec.mode) and re.search(r"```java|Demonstration of .* in Java|public class ", body, flags=re.IGNORECASE):
        issues.append(TeachingQualityIssue("DOMAIN_DRIFT", "non-CS concept contains Java/software artifact"))

    issues.extend(_validate_quiz(body, spec))
    return TeachingQualityReport(ok=not issues, issues=tuple(issues))


def ensure_teaching_markdown_quality(markdown: str, spec: TeachingConceptSpec) -> str:
    return finalize_teaching_markdown(markdown, spec)


def finalize_teaching_markdown(markdown: str, spec: TeachingConceptSpec) -> str:
    """Compile a model draft into a valid Teach Anything note.

    This is not an all-or-nothing fallback. Good model prose is preserved; weak
    sections, invalid quiz JSON, prompt leakage, and truncation are replaced by
    deterministic slots.
    """
    draft = _strip_frontmatter(markdown or "")
    draft = _scrub_forbidden_text(draft)
    deterministic = build_deterministic_teaching_note(spec)

    mental = _section_body(draft, "Mental Model")
    middle = _middle_sections(draft)
    quiz = "```interactive-quiz\n" + json.dumps(build_deterministic_teaching_quiz(spec), indent=2) + "\n```"

    if not _usable_section(mental, spec, min_words=18):
        mental = _section_body(deterministic, "Mental Model")

    usable_middle = [
        (heading, body)
        for heading, body in middle
        if _usable_section(body, spec, min_words=35)
    ]
    if len(usable_middle) < 2:
        usable_middle = _middle_sections(deterministic)
    else:
        usable_middle = usable_middle[:2]

    parts = ["## Mental Model", mental.strip()]
    for heading, body in usable_middle:
        parts.extend([f"## {heading.strip()}", body.strip()])
    parts.extend(["## The Proving Grounds", quiz])
    final = "\n\n".join(parts).strip() + "\n"

    report = validate_teaching_markdown(final, spec)
    if report.ok:
        return final
    # Last-resort deterministic compilation. This should be rare and still
    # produces a generated lesson from code-owned concept metadata.
    return deterministic


def build_deterministic_teaching_note(spec: TeachingConceptSpec) -> str:
    title = _concept_label(spec.readable_title, spec.readable_topic)
    topic = spec.readable_topic
    chapter = _readable(spec.chapter_title)
    related = [_readable(t) for t in spec.related_titles if _readable(t).lower() != title.lower()]
    related_sentence = ""
    if related:
        related_sentence = f" It connects most directly to {', '.join(related[:3])} in this learning path."

    snippets = _extract_source_sentences(spec.source_context, title, limit=3)
    if snippets:
        evidence = " ".join(snippets)
        grounding = (
            f"The available source context frames {title} this way: {evidence} "
            "Treat that wording as the anchor, then translate it into your own operational understanding."
        )
    else:
        grounding = _generic_grounding(title, topic, spec.mode)

    mechanism = _mechanism_for(title, topic, spec.mode)
    artifact = _artifact_for(title, topic, spec.mode)
    quiz = build_deterministic_teaching_quiz(spec)

    return (
        "## Mental Model\n\n"
        f"Think of {title} as a labeled part on a working machine inside {topic}. The label is useful only when it "
        f"helps you point to the part, explain what enters it, and predict what comes out after it operates. If you "
        f"cannot connect the label to a visible role in the larger system, you have memorized vocabulary but not the "
        f"concept.{related_sentence}\n\n"
        "## How It Actually Works\n\n"
        f"{mechanism} {grounding}\n\n"
        "## How To Use It\n\n"
        f"{artifact}\n\n"
        "## The Proving Grounds\n\n"
        "```interactive-quiz\n"
        f"{json.dumps(quiz, indent=2)}\n"
        "```\n"
    )


def build_deterministic_teaching_quiz(spec: TeachingConceptSpec) -> list[dict[str, Any]]:
    """Return a concept-specific quiz without asking the model."""
    title = _concept_label(spec.readable_title, spec.readable_topic)
    source_sentences = _extract_source_sentences(spec.source_context, title, limit=2)
    return _quiz_for(title, spec.readable_topic, spec.mode, source_sentences=source_sentences)


def infer_teaching_modality(note_title: str, source_context: str = "") -> str:
    text = f"{note_title} {source_context}".lower()
    if any(w in text for w in ("step", "workflow", "install", "configure", "process", "procedure", "algorithm", "command")):
        return "Procedural"
    if any(w in text for w in ("versus", " vs ", "compare", "contrast", "difference", "tradeoff")):
        return "Comparative"
    if any(w in text for w in ("calculate", "formula", "equation", "derive", "probability", "statistics")):
        return "Quantitative"
    if any(w in text for w in ("cause", "effect", "history", "timeline", "origin", "evolution")):
        return "Causal/Historical"
    return "Qualitative/Definitional"


def _readable(value: str) -> str:
    cleaned = re.sub(r"[_\-]+", " ", str(value or "")).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned or "the concept"


def _strip_frontmatter(markdown: str) -> str:
    text = markdown.strip()
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            return parts[2].strip()
    return text


def _scrub_forbidden_text(text: str) -> str:
    cleaned = text
    for _, pattern in FORBIDDEN_PATTERNS:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _section_body(markdown: str, heading: str) -> str:
    match = re.search(
        rf"^##\s+{re.escape(heading)}\s*\n(?P<body>.*?)(?=^##\s+|\Z)",
        markdown,
        flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )
    return match.group("body").strip() if match else ""


def _middle_sections(markdown: str) -> list[tuple[str, str]]:
    sections: list[tuple[str, str]] = []
    pattern = re.compile(
        r"^##\s+(?P<heading>.+?)\s*\n(?P<body>.*?)(?=^##\s+|\Z)",
        flags=re.MULTILINE | re.DOTALL,
    )
    for match in pattern.finditer(markdown):
        heading = match.group("heading").strip()
        if heading.lower() in {"mental model", "the proving grounds"}:
            continue
        body = _FENCE_RE.sub("", match.group("body")).strip()
        if body:
            sections.append((heading, body))
    return sections


def _usable_section(body: str, spec: TeachingConceptSpec, min_words: int) -> bool:
    if not body:
        return False
    if _looks_truncated(body):
        return False
    if _looks_corrupted(body):
        return False
    lowered = body.lower()
    for _, pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, body, flags=re.IGNORECASE):
            return False
    word_count = len(re.findall(r"\b\w+\b", body))
    if word_count < min_words:
        return False
    title_terms = _important_terms(spec.readable_title)
    return not title_terms or any(term in lowered for term in title_terms)


def _important_terms(value: str) -> list[str]:
    stop = {
        "the", "and", "for", "from", "with", "into", "about", "using", "basic",
        "basics", "introduction", "overview", "concept", "changes", "what", "is",
    }
    return [
        term.lower()
        for term in re.findall(r"[A-Za-z][A-Za-z0-9+]*", value)
        if len(term) > 2 and term.lower() not in stop
    ]


def _mentions_any(body: str, options: Iterable[str]) -> bool:
    normalized = body.lower().replace("_", " ")
    for option in options:
        opt = _readable(option).lower()
        if opt and opt in normalized:
            return True
    return False


def _looks_truncated(body: str) -> bool:
    stripped = body.strip()
    if not stripped:
        return True
    if stripped.endswith("```"):
        return False
    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    if not lines:
        return True
    last = lines[-1]
    if last in {"]", "}", "```"}:
        return False
    if re.search(r"[.!?:)\]}`]$", last):
        return False
    if re.search(r"\b(cut of|it serves|because|which|that|and|or|to|of|the)$", last, flags=re.IGNORECASE):
        return True
    return len(last.split()) >= 8 and not re.search(r"[.!?]$", last)


def _looks_corrupted(body: str) -> bool:
    prose = _FENCE_RE.sub("", body or "")
    prose = re.sub(r"```.*?```", "", prose, flags=re.DOTALL)
    # Catches splice artifacts like "to enLoad" and other camel-cased word
    # joins that normal educational prose should not contain.
    if re.search(r"\b[a-z]{2,}[A-Z][a-z]{2,}\b", prose):
        return True
    if re.search(r"\b(?:make|makes|made|help|helps|helped|allow|allows|allowed|ensure|ensures|ensured)\s+[A-Z][a-z]+\b", prose):
        return True
    if re.search(r"\b(?:make|helps?|ensures?|allows?)\s*(?:\.|,|;)", prose, flags=re.IGNORECASE):
        return True
    return False


def _validate_quiz(body: str, spec: TeachingConceptSpec) -> list[TeachingQualityIssue]:
    match = _FENCE_RE.search(body)
    if not match:
        return [TeachingQualityIssue("MISSING_QUIZ", "missing interactive quiz block")]
    raw = match.group(1).strip()
    try:
        quiz = json.loads(raw)
    except json.JSONDecodeError as exc:
        return [TeachingQualityIssue("INVALID_QUIZ_JSON", f"quiz JSON failed to parse: {exc}")]
    if not isinstance(quiz, list) or len(quiz) < 3:
        return [TeachingQualityIssue("THIN_QUIZ", "quiz must contain at least three questions")]

    issues: list[TeachingQualityIssue] = []
    title_terms = _important_terms(spec.readable_title)
    for index, item in enumerate(quiz, start=1):
        if not isinstance(item, dict):
            issues.append(TeachingQualityIssue("INVALID_QUIZ_ITEM", f"question {index} is not an object"))
            continue
        question = str(item.get("question") or "")
        answer = str(item.get("answer") or "")
        explanation = str(item.get("explanation") or "")
        combined = f"{question} {answer} {explanation}".lower()
        if len(question.strip()) < 16:
            issues.append(TeachingQualityIssue("THIN_QUIZ", f"question {index} is too short"))
        if any(term in combined for term in ("correct explanation", "incorrect distractor", "strong answer defines")):
            issues.append(TeachingQualityIssue("PLACEHOLDER_QUIZ", f"question {index} uses placeholder quiz text"))
        if title_terms and not any(term in combined for term in title_terms):
            issues.append(TeachingQualityIssue("OFF_TOPIC_QUIZ", f"question {index} does not reference the concept"))
    return issues


def _extract_source_sentences(source_context: str, title: str, limit: int) -> list[str]:
    clean = re.sub(r"(?is)Source:\s*", "", source_context or "")
    clean = re.sub(r"(?is)Excerpt:\s*", "", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    if not clean or "please provide a comprehensive" in clean.lower():
        return []
    if _is_synthetic_context(clean):
        return []
    terms = _important_terms(title)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean) if len(s.strip()) > 30]
    scored: list[tuple[int, int, str]] = []
    for idx, sentence in enumerate(sentences):
        lower = sentence.lower()
        score = sum(1 for term in terms if term in lower)
        if score or idx < 2:
            scored.append((score, -idx, sentence[:260]))
    return [s for _, _, s in sorted(scored, reverse=True)[:limit]]


def _concept_label(title: str, topic: str) -> str:
    cleaned = _readable(title)
    topic_clean = _readable(topic)
    patterns = (
        r"^what\s+is\s+(.+)$",
        r"^what\s+are\s+(.+)$",
        r"^definition\s+of\s+(.+)$",
        r"^introduction\s+to\s+(.+)$",
        r"^overview\s+of\s+(.+)$",
    )
    for pattern in patterns:
        match = re.match(pattern, cleaned, flags=re.IGNORECASE)
        if match:
            return _readable(match.group(1))
    if cleaned.lower() in {"definition", "overview", "introduction"}:
        return topic_clean
    return cleaned


def _generic_grounding(title: str, topic: str, mode: str) -> str:
    if _is_cs_mode(mode):
        return (
            f"In technical work, {title} should be understood by its inputs, operation, and observable output. "
            "Name the starting state, perform the operation deliberately, then inspect the result."
        )
    return (
        f"For {topic}, {title} should be studied as a concrete role in the larger system. Start with what it acts on, "
        "what conditions allow that role to appear, what process changes the input, and what output or consequence appears afterward."
    )


def _mechanism_for(title: str, topic: str, mode: str) -> str:
    if _is_cs_mode(mode):
        return (
            f"{title} works as a repeatable operation in a system. Identify the state before the operation, "
            "the command or rule being applied, and the state afterward. That before-and-after trace is the core of understanding it."
        )
    return (
        f"To understand {title}, locate its input, transformation, and output inside {topic}. "
        "The input is what the concept starts from, the transformation is the mechanism that changes it, and the output is the result you should be able to recognize in an example."
    )


def _artifact_for(title: str, topic: str, mode: str) -> str:
    if _is_cs_mode(mode):
        return (
            f"Use a trace table for {title}: initial state, operation, expected result, and verification command. "
            "This keeps the idea executable instead of purely verbal."
        )
    return (
        f"Use a three-column check for {title}: definition, example, and non-example. "
        "The non-example matters because it proves you know the boundary of the concept, not just its name."
    )


def _quiz_for(title: str, topic: str, mode: str, source_sentences: list[str] | None = None) -> list[dict[str, Any]]:
    source_sentences = source_sentences or []
    if source_sentences:
        anchor = source_sentences[0].rstrip(".")
        answer_a = anchor[:220]
        explanation = f"This answer is anchored in the supplied context for {title}."
    else:
        answer_a = f"{title} is the focused role or mechanism being studied inside {topic}."
        explanation = f"The useful test is whether you can connect {title} to an input, mechanism, and output inside {topic}."

    terms = _important_terms(title)
    required = terms[:3] or [title.lower()]
    return [
        {
            "type": "mcq",
            "question": f"In {topic}, which statement best captures the role of {title}?",
            "options": {
                "A": answer_a,
                "B": f"{title} is only a vocabulary label and has no role in examples.",
                "C": f"{title} is unrelated to the surrounding process in {topic}.",
                "D": f"{title} can be understood without identifying any input, mechanism, or result.",
            },
            "answer": "A",
            "explanation": explanation,
        },
        {
            "type": "true_false",
            "question": f"A useful explanation of {title} should identify what starts the process, what changes, and what result follows.",
            "answer": True,
            "explanation": f"Those three parts make {title} usable across examples instead of isolated as a memorized term.",
        },
        {
            "type": "writing",
            "question": f"Explain {title} in one concrete {topic} example. Include the input, mechanism, and result.",
            "answer": f"A complete answer names {title}, identifies the relevant input, explains the mechanism, and states the result in the larger {topic} process.",
            "required_keywords": required,
            "explanation": f"The example checks application; the non-example checks the boundary of {title}.",
        },
    ]


def _is_cs_mode(mode: str) -> bool:
    mode_l = (mode or "").lower()
    return any(token in mode_l for token in ("cs-", "software", "programming", "systems", "database", "network"))


def _is_synthetic_context(text: str) -> bool:
    lowered = text.lower()
    markers = (
        "learning topic:",
        "chapter scope:",
        "focused concept:",
        "nearby concepts in this learning path:",
        "user learning request:",
        "do not mention missing sources",
    )
    return sum(1 for marker in markers if marker in lowered) >= 2
