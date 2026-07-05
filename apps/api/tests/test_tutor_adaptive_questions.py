import json
from pathlib import Path

import pytest

from src.domains.ater.tutor_service import TutorSessionManager


def _write_note(vault: Path, rel: str, question_block: list[dict]):
    path = vault / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "# First Note\n\n"
        "Git snapshots the whole project so you can recover earlier states.\n\n"
        "```interactive-quiz\n"
        f"{json.dumps(question_block)}\n"
        "```\n",
        encoding="utf-8",
    )


@pytest.mark.asyncio
async def test_get_adaptive_question_returns_only_one_existing_question(tmp_path: Path):
    vault = tmp_path / "vault"
    vault.mkdir()
    _write_note(
        vault,
        "Git/01_First.md",
        [
            {"id": "q1", "type": "mcq", "question": "What does Git store?", "options": {"A": "Snapshots", "B": "Only diffs"}, "answer": "A", "explanation": "Git stores snapshots."},
            {"id": "q2", "type": "writing", "question": "Explain commit.", "answer": "A commit records a snapshot.", "explanation": "Commits preserve snapshots."},
        ],
    )
    manager = TutorSessionManager(tmp_path / "ater_queue.db", vault)

    result = await manager.get_adaptive_question("s1", "Git/01_First.md")

    assert result["question"]["id"] == "q1"
    assert result["question"]["note_id"] == "Git/01_First.md"
    assert result["progression"]["generated_follow_up"] is False


@pytest.mark.asyncio
async def test_check_adaptive_answer_grades_without_wager(tmp_path: Path):
    vault = tmp_path / "vault"
    vault.mkdir()
    _write_note(vault, "Git/01_First.md", [])
    manager = TutorSessionManager(tmp_path / "ater_queue.db", vault)
    question = {"id": "q1", "type": "mcq", "question": "What does Git store?", "answer": "A", "explanation": "Git stores snapshots."}

    result = await manager.check_adaptive_answer("s1", "Git/01_First.md", question, "A")

    assert result["is_correct"] is True
    assert "wager" not in result
    assert result["feedback"]


def test_remediation_normalizer_supports_all_proving_ground_shapes(tmp_path: Path):
    vault = tmp_path / "vault"
    vault.mkdir()
    manager = TutorSessionManager(tmp_path / "ater_queue.db", vault)
    original = {
        "id": "q1",
        "type": "mcq",
        "question": "What does Git store?",
        "answer": "A",
        "explanation": "Git stores snapshots.",
    }

    mcq = manager._normalize_proving_ground_question(
        {"type": "multiple-choice", "question": "Which answer fits?", "options": ["Snapshots", "Only diffs"], "answer": "A", "explanation": "Snapshots fit."},
        "Git/01_First.md",
        original_question=original,
    )
    fill_in = manager._normalize_proving_ground_question(
        {"type": "fill-in", "question": "Git stores ____.", "answer": "snapshots", "explanation": "Git stores snapshots."},
        "Git/01_First.md",
        original_question=original,
    )
    matching = manager._normalize_proving_ground_question(
        {"type": "matching", "question": "Match roles.", "pairs": [{"left": "Commit", "right": "Snapshot"}, {"left": "Branch", "right": "Pointer"}], "explanation": "Roles match."},
        "Git/01_First.md",
        original_question=original,
    )
    order = manager._normalize_proving_ground_question(
        {"type": "order", "question": "Order steps.", "steps": ["Commit", "Stage"], "answer": ["Stage", "Commit"], "explanation": "Stage then commit."},
        "Git/01_First.md",
        original_question=original,
    )
    debug = manager._normalize_proving_ground_question(
        {"type": "find-error", "question": "Find flaw.", "buggyCode": "commit == diff", "answer": "Commit is a snapshot.", "explanation": "A commit is not only a diff."},
        "Git/01_First.md",
        original_question=original,
    )

    assert mcq["type"] == "mcq"
    assert mcq["options"] == {"A": "Snapshots", "B": "Only diffs"}
    assert fill_in["type"] == "fill_in"
    assert fill_in["answer"] == ["snapshots"]
    assert "[[" in fill_in["textWithBlanks"]
    assert matching["pairs"][0] == {"left": "Commit", "right": "Snapshot"}
    assert order["answer"] == ["Stage", "Commit"]
    assert debug["type"] == "find_error"
    assert debug["buggyCode"] == "commit == diff"


def test_remediation_fallback_chooses_domain_specific_type(tmp_path: Path):
    vault = tmp_path / "vault"
    vault.mkdir()
    manager = TutorSessionManager(tmp_path / "ater_queue.db", vault)

    code_question = manager._fallback_proving_ground_question(
        "Code/Loops.md",
        {"id": "q1", "type": "writing", "question": "A function raises a runtime exception because the loop mutates the list.", "answer": "Avoid mutating while iterating."},
        note_content="```python\nfor item in items: items.remove(item)\n```",
        seen_question_types=["writing", "mcq"],
    )
    process_question = manager._fallback_proving_ground_question(
        "Workflow/Pipeline.md",
        {"id": "q2", "type": "writing", "question": "Explain the first then next step in this workflow.", "answer": "Validate then execute."},
        seen_question_types=["writing"],
    )

    assert code_question["type"] in {"debug", "trace", "code", "find_error", "scenario"}
    assert code_question.get("content") or code_question.get("codeSnippet") or code_question.get("buggyCode")
    assert process_question["type"] == "order"
    assert process_question["steps"]


@pytest.mark.asyncio
async def test_remediation_fallback_explains_wrong_answer_and_targets_same_misconception(tmp_path: Path):
    vault = tmp_path / "vault"
    vault.mkdir()
    rel = "Economics/Consumer_Preferences.md"
    _write_note(
        vault,
        rel,
        [{
            "id": "q1",
            "type": "true_false",
            "family": "recognize",
            "format": "choice",
            "question": "True or False: weak preference in both directions means strict preference.",
            "answer": "False",
            "explanation": "Weak preference in both directions means indifference, not strict preference.",
            "skill_target": "Consumer Preferences",
        }],
    )
    manager = TutorSessionManager(tmp_path / "ater_queue.db", vault)
    original = {
        "id": "q1",
        "type": "true_false",
        "question": "True or False: weak preference in both directions means strict preference.",
        "answer": "False",
        "explanation": "Weak preference in both directions means indifference, not strict preference.",
        "skill_target": "Consumer Preferences",
    }

    lesson = await manager.generate_detailed_remediation_lesson(rel, original, "True")
    follow_up = await manager.generate_clean_remediation_question(rel, original, "True", lesson, seen_question_types=["true_false"])

    assert "What you got wrong" in lesson
    assert "Why that is wrong" in lesson
    assert "Deeper correction" in lesson
    assert "True" in lesson
    assert "strict preference" in lesson
    assert follow_up is not None
    assert follow_up["is_remediation"] is True
    assert follow_up["type"] != "true_false"
    assert "weak preference" in (follow_up.get("question", "") + follow_up.get("explanation", "")).lower()


def test_economics_remediation_does_not_choose_code_debug_or_trace(tmp_path: Path):
    vault = tmp_path / "vault"
    vault.mkdir()
    manager = TutorSessionManager(tmp_path / "ater_queue.db", vault)
    note_content = """
---
domain: ECON-MICRO
concept_modality: Quantitative
---
# Consumer Preferences And Utility

Consumer preferences and utility explain how a consumer ranks goods and chooses
the best affordable bundle. A budget line depends on income and the prices of
goods X and Y. Consumer equilibrium compares marginal utility per unit of price.
"""
    lesson = "The learner confused consumer-choice logic with production cost."
    original = {
        "id": "q1",
        "type": "mcq",
        "question": "Which statement explains consumer preferences and utility?",
        "answer": "A",
        "explanation": "It belongs to consumer-choice theory.",
    }

    chosen = manager._choose_proving_ground_type(original, lesson, note_content, ["mcq"], attempt_number=1)

    assert chosen not in {"debug", "code", "trace", "find_error"}
    assert chosen in {"scenario", "calculation", "synthesis", "fill_in", "matching", "writing", "true_false"}


def test_economics_normalizer_coerces_model_debug_output_to_domain_type(tmp_path: Path):
    vault = tmp_path / "vault"
    vault.mkdir()
    manager = TutorSessionManager(tmp_path / "ater_queue.db", vault)
    note_content = """
# Budget Line

In consumer theory, a budget line shows combinations of goods X and Y that can
be purchased with a given income and given prices. The consumer chooses among
affordable bundles according to preferences and utility.
"""
    original = {
        "id": "q1",
        "type": "mcq",
        "question": "What does the budget line represent?",
        "answer": "Affordable combinations of goods.",
    }

    normalized = manager._normalize_proving_ground_question(
        {
            "type": "debug",
            "question": "A consumer has a budget of $100 for goods X and Y. Find the flaw.",
            "buggyCode": "def utility(X, Y): return X * Y",
            "answer": "Use the budget line to identify affordable bundles.",
            "explanation": "This is consumer theory, not a coding exercise.",
        },
        "Economics/Budget_Line.md",
        original_question=original,
        preferred_type="scenario",
        note_content=note_content,
    )

    assert normalized["type"] == "scenario"
    assert "buggyCode" not in normalized or normalized["buggyCode"] == "def utility(X, Y): return X * Y"
