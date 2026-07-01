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
