import json
import re

from src.domains.ater.teaching_quality import (
    TeachingConceptSpec,
    build_default_grounding_context,
    build_deterministic_teaching_note,
    finalize_teaching_markdown,
    ensure_teaching_markdown_quality,
    validate_teaching_markdown,
)


def _spec(**overrides):
    data = {
        "topic": "Contract Law",
        "chapter_title": "Agreement",
        "note_title": "Consideration",
        "prompt": "Teach me contract law from scratch",
        "mode": "LAW-CONTRACT",
        "modality": "Procedural",
        "related_titles": ("Offer", "Acceptance", "Mutual_Assent"),
    }
    data.update(overrides)
    return TeachingConceptSpec(**data)


def test_quality_gate_rejects_prompt_leakage_and_placeholder_quiz():
    bad = """## Mental Model

Please provide a comprehensive technical explanation of Consideration within the context of Contract Law.

## How It Actually Works

This follows directly from the source's definition of Consideration.

## How To Use It

```java
// Demonstration of Consideration in Java
public class Demo {}
```

## The Proving Grounds

```interactive-quiz
[
  {"type": "mcq", "question": "What is it?", "answer": "A", "explanation": "Correct explanation."},
  {"type": "true_false", "question": "Is this true?", "answer": true, "explanation": "Correct explanation."},
  {"type": "writing", "question": "Explain it.", "answer": "A strong answer defines it.", "explanation": "Correct explanation."}
]
```
"""
    report = validate_teaching_markdown(bad, _spec())
    assert not report.ok
    assert "PROMPT_LEAK" in report.codes()
    assert "SOURCE_PLACEHOLDER" in report.codes()
    assert "PLACEHOLDER_QUIZ" in report.codes()


def test_default_grounding_context_is_not_a_generation_prompt():
    context = build_default_grounding_context(_spec(source_context=""))
    assert "Please provide" not in context
    assert "comprehensive technical explanation" not in context
    assert "Focused concept: Consideration." in context


def test_deterministic_fallback_is_generic_and_parseable():
    spec = _spec(source_context="Excerpt: Consideration is the bargained-for exchange that makes a promise enforceable.")
    note = build_deterministic_teaching_note(spec)
    assert "bargained-for exchange" in note
    assert "input" in note.lower()
    assert "mechanism" in note.lower()
    assert "result" in note.lower()
    assert "Please provide" not in note
    assert "Correct explanation" not in note

    report = validate_teaching_markdown(note, spec)
    assert report.ok, report.summary()

    quiz_match = re.search(r"```interactive-quiz\s*(.*?)```", note, re.DOTALL)
    assert quiz_match
    quiz = json.loads(quiz_match.group(1))
    assert len(quiz) == 3
    assert quiz[0]["answer"] == "A"


def test_deterministic_fallbacks_do_not_use_topic_specific_maps():
    examples = [
        ("Plant Biology", "Pigment_Energy_Transfer", "a pigment absorbs light energy and raises an electron to a higher energy state"),
        ("Contract Law", "Consideration", "consideration is the bargained-for exchange that makes a promise enforceable"),
        ("Statistics", "Confidence_Interval", "a confidence interval estimates a plausible range for a population parameter"),
    ]
    for topic, note_title, source_sentence in examples:
        spec = _spec(
            topic=topic,
            note_title=note_title,
            source_context=f"Excerpt: {source_sentence}.",
        )
        note = build_deterministic_teaching_note(spec)
        assert source_sentence.lower() in note.lower()
        assert "feature unrelated" not in note.lower()
        report = validate_teaching_markdown(note, spec)
        assert report.ok, f"{note_title}: {report.summary()}"


def test_quality_gate_rejects_truncated_note():
    truncated = """## Mental Model

Consideration is the exchange that makes a promise enforceable.

## How It Actually Works

Consideration identifies what each side gives or promises in return.

## How To Use It

Check whether there is a bargained-for exchange rather than a one-sided gift.

## The Proving Grounds

This note is cut of"""
    report = validate_teaching_markdown(truncated, _spec())
    assert not report.ok
    assert "TRUNCATED" in report.codes()


def test_ensure_quality_replaces_bad_body_with_fallback():
    repaired = ensure_teaching_markdown_quality("Please provide a comprehensive technical explanation.", _spec())
    assert "Consideration" in repaired
    assert validate_teaching_markdown(repaired, _spec()).ok


def test_finalize_repairs_bad_quiz_without_discarding_good_prose():
    spec = TeachingConceptSpec(
        topic="Plant Biology",
        chapter_title="Plant Energy",
        note_title="Pigment_Energy_Transfer",
        prompt="teach me plant biology from scratch",
        mode="BIOLOGY",
    )
    draft = """## Mental Model

Pigment energy transfer works like a solar panel inside plant cells. It captures light energy so the plant can move energy into chemical reactions.

## How It Actually Works

Pigment energy transfer begins when a pigment absorbs light and moves an electron into a higher energy state. That energized electron can then help drive later chemical reactions.

## How To Use It

When studying pigment energy transfer, track the input light, the absorbing pigment, the electron energy change, and the later reaction it enables.

## The Proving Grounds

```interactive-quiz
[{"type": "mcq", "question": "What?", "answer": "A", "explanation": "Correct explanation."}]
```
"""
    final = finalize_teaching_markdown(draft, spec)
    assert "solar panel" in final
    assert "Correct explanation" not in final
    assert validate_teaching_markdown(final, spec).ok


def test_validation_rejects_spliced_model_prose():
    bad = """## Mental Model

Load Balancing is a useful way to think about distributing work across several servers in a system.

## How It Works

Load balancing is a way to distribute work across many systems, like computers or servers, so that no single system gets too overwhelmed. It helps make This way, the work keeps getting done smoothly and reliably.

## Key Details

Load balancing allocates incoming network traffic across multiple servers to enLoad balancing can be implemented using several algorithms such as round-robin and least connections.

## The Proving Grounds

```interactive-quiz
[
  {
    "type": "mcq",
    "question": "In system design, which statement best captures the role of Load Balancing?",
    "options": {
      "A": "Load Balancing distributes requests across servers.",
      "B": "Load Balancing removes every server from a system.",
      "C": "Load Balancing is unrelated to system design.",
      "D": "Load Balancing can be understood without inputs or results."
    },
    "answer": "A",
    "explanation": "Load Balancing changes where incoming work goes."
  },
  {
    "type": "true_false",
    "question": "Load Balancing explanations should identify the work being distributed and the resulting server behavior.",
    "answer": true,
    "explanation": "Load Balancing is about distribution and resulting behavior."
  },
  {
    "type": "writing",
    "question": "Explain Load Balancing in one concrete system design example.",
    "answer": "A complete answer names Load Balancing and the servers receiving work.",
    "explanation": "The example checks whether Load Balancing is applied."
  }
]
```
"""

    report = validate_teaching_markdown(
        bad,
        TeachingConceptSpec(
            topic="system design",
            chapter_title="Designing for Scalability",
            note_title="Load Balancing",
        ),
    )

    assert "CORRUPTED_PROSE" in report.codes()


def test_finalize_replaces_spliced_sections_with_valid_deterministic_content():
    spec = TeachingConceptSpec(
        topic="system design",
        chapter_title="Designing for Scalability",
        note_title="What is System Design",
        related_titles=("Scalability", "Availability"),
    )
    draft = """## Mental Model

System design is the process of defining the architecture of a system in order to satisfy important constraints.

## How It Works

System design helps make This way, the system can support more users.

## Key Details

System design maps requirements to enSystem design can be evaluated through tradeoffs.

## The Proving Grounds

```interactive-quiz
[]
```
"""

    final = finalize_teaching_markdown(draft, spec)

    assert validate_teaching_markdown(final, spec).ok
    assert "make This" not in final
    assert "enSystem" not in final
    assert "System Design" in final
    assert "## How It Actually Works" in final


def test_generic_deterministic_note_is_not_named_move_filler():
    spec = TeachingConceptSpec(
        topic="Contract Law",
        chapter_title="Agreement",
        note_title="Consideration",
        prompt="teach me contract law from scratch",
        mode="LAW-CONTRACT",
    )
    note = build_deterministic_teaching_note(spec)
    assert "named move" not in note
    assert "definition" in note.lower()
    assert "conditions" in note.lower()
    assert "consequence" in note.lower()
    assert validate_teaching_markdown(note, spec).ok


def test_generic_quiz_uses_source_context_when_available():
    spec = TeachingConceptSpec(
        topic="Plant Biology",
        chapter_title="Light Dependent Reactions",
        note_title="Pigment_Energy_Transfer",
        prompt="teach me plant biology from scratch",
        mode="BIOLOGY",
        source_context=(
            "Source: biology reference\n"
            "Excerpt: Pigment energy transfer occurs when a pigment absorbs light energy and an electron moves to a higher energy state."
        ),
    )
    note = build_deterministic_teaching_note(spec)
    assert "pigment absorbs light energy" in note.lower()
    assert "Which question best tests" not in note
    assert "lens for noticing one specific pattern" not in note
    assert validate_teaching_markdown(note, spec).ok
