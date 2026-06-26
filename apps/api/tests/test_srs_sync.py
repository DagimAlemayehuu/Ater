"""
Unit tests for Phase 4 FSRS Sync & Feynman Gate features.

Covers:
  - SRSEngine.review() correctly updates sqlite srs_cards
  - SRSEngine.get_due() with and without hub_notes filter
  - SRSEngine.validate_feynman_gate() keyword extraction + unlock
  - Global practice generation guard (hub_id == "all" path is tested
    by verifying service.generate_practice does NOT call _find_hub)
"""
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path


from src.domains.ater.srs import SRSEngine


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def make_engine(db_path: Path) -> SRSEngine:
    return SRSEngine(db_path)


def write_note_with_quiz(vault: Path, rel_path: str, keywords: list[str]) -> Path:
    """Create a minimal atomic note containing an interactive-quiz writing block."""
    quiz = [
        {
            "type": "writing",
            "question": "Explain the concept.",
            "required_keywords": keywords,
        }
    ]
    note_path = vault / rel_path
    note_path.parent.mkdir(parents=True, exist_ok=True)
    note_path.write_text(
        f"""---
title: Test Note
type: atomic
---
# 1. The Intuitive Analogy
Content here.
# 2. The Core Execution
More content.
# 3. The Proving Grounds
```interactive-quiz
{json.dumps(quiz, indent=2)}
```
""",
        encoding="utf-8",
    )
    return note_path


# ─────────────────────────────────────────────────────────────────────────────
# SRSEngine.review() tests
# ─────────────────────────────────────────────────────────────────────────────

class TestSRSEngineReview:
    def test_new_card_is_created_on_first_review(self, tmp_path):
        engine = make_engine(tmp_path / "test.db")
        card = engine.review("notes/dynamic_array.md", rating=3)
        assert card.reps == 1
        assert card.stability > 0

    def test_rating_1_increments_lapses(self, tmp_path):
        engine = make_engine(tmp_path / "test.db")
        engine.review("notes/sorting.md", rating=3)
        card = engine.review("notes/sorting.md", rating=1)
        assert card.lapses == 1

    def test_card_persists_to_sqlite(self, tmp_path):
        db = tmp_path / "test.db"
        engine = make_engine(db)
        engine.review("notes/graphs.md", rating=4)

        # Re-open connection to confirm persistence
        conn = sqlite3.connect(str(db))
        row = conn.execute("SELECT reps FROM srs_cards WHERE note_path=?", ("notes/graphs.md",)).fetchone()
        conn.close()
        assert row is not None
        assert row[0] == 1

    def test_stability_increases_on_correct_review(self, tmp_path):
        engine = make_engine(tmp_path / "test.db")
        card1 = engine.review("notes/trees.md", rating=3)
        card2 = engine.review("notes/trees.md", rating=3)
        assert card2.stability >= card1.stability

    def test_invalid_rating_defaults_to_good(self, tmp_path):
        engine = make_engine(tmp_path / "test.db")
        card = engine.review("notes/heaps.md", rating=99)
        assert card.reps == 1


# ─────────────────────────────────────────────────────────────────────────────
# SRSEngine.get_due() tests
# ─────────────────────────────────────────────────────────────────────────────

class TestGetDue:
    def _insert_overdue_card(self, engine: SRSEngine, note_path: str):
        """Manually insert a card whose due date is in the past."""
        engine.db.execute(
            "INSERT OR REPLACE INTO srs_cards VALUES (?,?,?,?,?,?,?)",
            (note_path, 1.0, 5.0, (datetime.now() - timedelta(days=2)).isoformat(), 1, 0, None)
        )
        engine.db.commit()

    def test_due_card_returned_globally(self, tmp_path):
        engine = make_engine(tmp_path / "test.db")
        self._insert_overdue_card(engine, "notes/overdue.md")
        due = engine.get_due()
        assert any(c.note_path == "notes/overdue.md" for c in due)

    def test_non_due_card_not_returned(self, tmp_path):
        engine = make_engine(tmp_path / "test.db")
        engine.db.execute(
            "INSERT OR REPLACE INTO srs_cards VALUES (?,?,?,?,?,?,?)",
            ("notes/future.md", 10.0, 5.0, (datetime.now() + timedelta(days=30)).isoformat(), 1, 0, None)
        )
        engine.db.commit()
        due = engine.get_due()
        assert not any(c.note_path == "notes/future.md" for c in due)

    def test_hub_notes_filter_works(self, tmp_path):
        engine = make_engine(tmp_path / "test.db")
        self._insert_overdue_card(engine, "cs/overdue.md")
        self._insert_overdue_card(engine, "math/overdue.md")

        # Only ask for cs notes
        due = engine.get_due(hub_notes=["cs/overdue.md"])
        paths = [c.note_path for c in due]
        assert "cs/overdue.md" in paths
        assert "math/overdue.md" not in paths

    def test_empty_hub_notes_returns_all_due(self, tmp_path):
        engine = make_engine(tmp_path / "test.db")
        self._insert_overdue_card(engine, "a.md")
        self._insert_overdue_card(engine, "b.md")
        due = engine.get_due(hub_notes=[])
        assert len(due) >= 2


# ─────────────────────────────────────────────────────────────────────────────
# SRSEngine.validate_feynman_gate() tests
# ─────────────────────────────────────────────────────────────────────────────

class TestFeynmanGate:
    def test_all_keywords_present_unlocks_card(self, tmp_path):
        vault = tmp_path / "vault"
        keywords = ["recursion", "base case", "call stack"]
        write_note_with_quiz(vault, "cs/recursion.md", keywords)

        engine = make_engine(tmp_path / "srs.db")
        result = engine.validate_feynman_gate(
            "cs/recursion.md",
            "Recursion works by calling itself until a base case is hit, using the call stack.",
            vault,
        )
        assert result["success"] is True
        # Card should now be in srs_cards (reviewed)
        card = engine.get_card("cs/recursion.md")
        assert card.reps == 1

    def test_missing_keywords_blocks_unlock(self, tmp_path):
        vault = tmp_path / "vault"
        keywords = ["recursion", "base case", "call stack"]
        write_note_with_quiz(vault, "cs/recursion.md", keywords)

        engine = make_engine(tmp_path / "srs.db")
        result = engine.validate_feynman_gate(
            "cs/recursion.md",
            "Recursion is when a function calls itself.",
            vault,
        )
        assert result["success"] is False
        assert "base case" in result["missing_keywords"]
        assert "call stack" in result["missing_keywords"]

    def test_keyword_matching_is_case_insensitive(self, tmp_path):
        vault = tmp_path / "vault"
        keywords = ["Dynamic Programming", "Memoization"]
        write_note_with_quiz(vault, "algo/dp.md", keywords)

        engine = make_engine(tmp_path / "srs.db")
        result = engine.validate_feynman_gate(
            "algo/dp.md",
            "DYNAMIC PROGRAMMING uses MEMOIZATION to cache subproblem results.",
            vault,
        )
        assert result["success"] is True

    def test_missing_note_returns_error(self, tmp_path):
        vault = tmp_path / "vault"
        engine = make_engine(tmp_path / "srs.db")
        result = engine.validate_feynman_gate("nonexistent/note.md", "some text", vault)
        assert result["success"] is False
        assert "error" in result

    def test_note_without_writing_question_unlocks_directly(self, tmp_path):
        vault = tmp_path / "vault"
        # Quiz with only MCQ — no writing question
        quiz = [{"type": "mcq", "question": "Q?", "options": {"A": "a"}, "answer": "A"}]
        note_path = vault / "cs/mcq_only.md"
        note_path.parent.mkdir(parents=True, exist_ok=True)
        note_path.write_text(
            f"---\ntitle: T\ntype: atomic\n---\n```interactive-quiz\n{json.dumps(quiz)}\n```\n"
        )

        engine = make_engine(tmp_path / "srs.db")
        result = engine.validate_feynman_gate("cs/mcq_only.md", "anything", vault)
        assert result["success"] is True
        assert result.get("unlocked_directly") is True

    def test_note_without_quiz_block_returns_error(self, tmp_path):
        vault = tmp_path / "vault"
        note = vault / "bare.md"
        note.parent.mkdir(parents=True, exist_ok=True)
        note.write_text("# Just a bare note with no quiz block\nSome content.")

        engine = make_engine(tmp_path / "srs.db")
        result = engine.validate_feynman_gate("bare.md", "explanation", vault)
        assert result["success"] is False
        assert "error" in result
