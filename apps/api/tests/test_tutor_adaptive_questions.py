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
