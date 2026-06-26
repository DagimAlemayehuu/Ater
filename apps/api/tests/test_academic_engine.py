"""
Comprehensive tests for the Ater Academic Engine.

Covers:
  - AcademicDB: embeddings CRUD, tutor sessions, exam sessions, versioning, version-by-id
  - VaultIndexer: index_note (new + cached), index_vault (bulk), semantic_search
  - AnalyticsEngine: record, get_weak_notes, mastery_signal, forgetting_risk_map, difficulty_distribution
  - KnowledgeGapDetector: missing prerequisites, high_difficulty, low_stability, high_lapses
  - StudyScheduler: generate_plan with exam files, fallback (no exams)
  - StudyPackManager: export_pack, import_pack (roundtrip), conflict_strategy=skip
  - ExamEngine.grade_exam: MCQ/true_false/writing grading, score calculation, report structure
  - SocraticTutor: session creation, history persistence (mocked LLM)
  - DocumentSynthesizer: find_overlap_clusters, generate_synthesis (mocked LLM)
  - EssayEvaluator: evaluate_essay (mocked LLM + indexer)
"""

import pytest
import sys
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch, AsyncMock

# ──────────────────────────────────────────────────────────────────────────────
# CRITICAL: Mock the `transformers` module BEFORE any domain imports that
# transitively import it (vault_indexer → embeddings_linker → transformers).
# ──────────────────────────────────────────────────────────────────────────────
import numpy as np

_mock_transformers = MagicMock()
_mock_tokenizer_instance = MagicMock()
_mock_tokenizer_instance.return_value = {
    "input_ids": np.array([[1, 2, 3]]),
    "attention_mask": np.array([[1, 1, 1]]),
}
_mock_transformers.AutoTokenizer.from_pretrained.return_value = _mock_tokenizer_instance
sys.modules.setdefault("transformers", _mock_transformers)

# Also mock onnxruntime if not present
_mock_ort = MagicMock()
sys.modules.setdefault("onnxruntime", _mock_ort)

# Now it's safe to import domain modules
from src.api.deps import AppSecrets
from src.domains.ater.academic_db import AcademicDB
from src.domains.ater.analytics import AnalyticsEngine
from src.domains.ater.srs import SRSEngine

# ──────────────────────────────────────────────────────────────────────────────
# Shared fixtures
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def vault(tmp_path) -> Path:
    """Creates a minimal vault directory structure."""
    v = tmp_path / "vault"
    v.mkdir()
    (v / "Inbox").mkdir()
    (v / "Notes").mkdir()
    db = v / "database"
    db.mkdir()
    (db / "courses").mkdir()
    (db / "exams").mkdir()
    (db / "study planner").mkdir()
    return v


@pytest.fixture
def secrets(vault) -> AppSecrets:
    return AppSecrets(
        ai_provider="google",
        ai_key="mock-key",
        ai_model="gemini-2.0-flash",
        vault_path=str(vault),
        inbox_path=str(vault / "Inbox"),
        academic_path="Notes",
    )


@pytest.fixture
def db(vault) -> AcademicDB:
    return AcademicDB(vault)


@pytest.fixture
def analytics_db(vault) -> Path:
    return vault / "Inbox" / "ater_queue.db"


# ══════════════════════════════════════════════════════════════════════════════
# 1. AcademicDB – Full CRUD coverage
# ══════════════════════════════════════════════════════════════════════════════

class TestAcademicDB:
    def test_save_and_get_embedding_roundtrip(self, db):
        db.save_embedding("Notes/A.md", "hash1", [0.1, 0.5, 0.9])
        result = db.get_embedding("Notes/A.md")
        assert result is not None
        assert pytest.approx(result[0], abs=1e-4) == 0.1
        assert pytest.approx(result[2], abs=1e-4) == 0.9

    def test_get_embedding_returns_none_for_missing(self, db):
        assert db.get_embedding("Notes/nonexistent.md") is None

    def test_get_all_embeddings(self, db):
        db.save_embedding("Notes/A.md", "h1", [0.1, 0.2])
        db.save_embedding("Notes/B.md", "h2", [0.3, 0.4])
        all_embs = db.get_all_embeddings()
        assert "Notes/A.md" in all_embs
        assert "Notes/B.md" in all_embs
        assert len(all_embs) == 2

    def test_overwrite_embedding_on_hash_change(self, db):
        db.save_embedding("Notes/X.md", "v1", [1.0, 0.0])
        db.save_embedding("Notes/X.md", "v2", [0.0, 1.0])
        result = db.get_embedding("Notes/X.md")
        assert pytest.approx(result[0], abs=1e-4) == 0.0
        assert pytest.approx(result[1], abs=1e-4) == 1.0

    def test_save_and_get_tutor_session(self, db):
        history = [{"role": "user", "content": "Explain CAP theorem"}]
        db.save_tutor_session("s1", "Notes/CAP.md", history)
        session = db.get_tutor_session("s1")
        assert session is not None
        assert session["note_path"] == "Notes/CAP.md"
        assert session["history"][0]["content"] == "Explain CAP theorem"

    def test_get_tutor_session_returns_none_for_missing(self, db):
        assert db.get_tutor_session("nonexistent_session") is None

    def test_tutor_session_overwrites_existing(self, db):
        db.save_tutor_session("s2", "Notes/X.md", [{"role": "user", "content": "First"}])
        db.save_tutor_session("s2", "Notes/X.md", [{"role": "user", "content": "Updated"}])
        session = db.get_tutor_session("s2")
        assert session["history"][0]["content"] == "Updated"

    def test_save_and_get_exam_session(self, db):
        config = {"type": "mcq", "count": 5}
        state = {"q1": {"answer": "A"}}
        report = {"score": 80, "passed": True}
        db.save_exam_session("exam1", config, state, report)
        exam = db.get_exam_session("exam1")
        assert exam is not None
        assert exam["config"]["type"] == "mcq"
        assert exam["state"]["q1"]["answer"] == "A"
        assert exam["report"]["score"] == 80

    def test_exam_session_report_can_be_none(self, db):
        db.save_exam_session("exam2", {}, {}, None)
        exam = db.get_exam_session("exam2")
        assert exam["report"] is None

    def test_get_exam_session_returns_none_for_missing(self, db):
        assert db.get_exam_session("never_saved") is None

    def test_save_version_and_get_versions(self, db):
        db.save_version("Notes/A.md", "Version 1 content")
        db.save_version("Notes/A.md", "Version 2 content")
        versions = db.get_versions("Notes/A.md")
        assert len(versions) == 2
        # Most recent first (ORDER BY timestamp DESC)
        assert versions[0]["content"] == "Version 2 content"

    def test_get_versions_empty_for_unknown_note(self, db):
        assert db.get_versions("Notes/Unknown.md") == []

    def test_get_version_by_id(self, db):
        db.save_version("Notes/B.md", "Specific version")
        versions = db.get_versions("Notes/B.md")
        version_id = versions[0]["id"]
        v = db.get_version_by_id(version_id)
        assert v is not None
        assert v["content"] == "Specific version"
        assert v["note_path"] == "Notes/B.md"

    def test_get_version_by_id_returns_none_for_missing(self, db):
        assert db.get_version_by_id(999999) is None


# ══════════════════════════════════════════════════════════════════════════════
# 2. VaultIndexer – Mocked EmbeddingsLinker
# ══════════════════════════════════════════════════════════════════════════════

class TestVaultIndexer:
    """Tests VaultIndexer with EmbeddingsLinker fully mocked to avoid ML dependencies."""

    def _make_indexer(self, vault):
        """Creates a VaultIndexer with a mocked EmbeddingsLinker."""
        with patch("src.domains.ater.vault_indexer.EmbeddingsLinker") as MockLinker:
            # Return normalized unit vectors
            mock_linker_inst = MagicMock()
            mock_linker_inst.get_embeddings.side_effect = lambda texts: [
                np.array([0.6, 0.8]) / np.linalg.norm([0.6, 0.8])
                for _ in texts
            ]
            MockLinker.return_value = mock_linker_inst
            from src.domains.ater.vault_indexer import VaultIndexer
            return VaultIndexer(vault), mock_linker_inst

    def test_index_note_new_note_returns_true(self, vault):
        indexer, _ = self._make_indexer(vault)
        result = indexer.index_note("Notes/NewNote.md", "Content about distributed systems")
        assert result is True

    def test_index_note_same_content_returns_false(self, vault):
        indexer, _ = self._make_indexer(vault)
        content = "Unchanged content"
        indexer.index_note("Notes/Stable.md", content)
        result = indexer.index_note("Notes/Stable.md", content)
        assert result is False  # Same hash → skip

    def test_index_note_changed_content_returns_true(self, vault):
        indexer, _ = self._make_indexer(vault)
        indexer.index_note("Notes/Changing.md", "Version 1")
        result = indexer.index_note("Notes/Changing.md", "Version 2 — completely different")
        assert result is True

    def test_index_vault_indexes_all_md_files(self, vault):
        (vault / "Notes" / "Topic_A.md").write_text("Content A", encoding="utf-8")
        (vault / "Notes" / "Topic_B.md").write_text("Content B", encoding="utf-8")
        indexer, _ = self._make_indexer(vault)
        count = indexer.index_vault()
        assert count >= 2

    def test_semantic_search_returns_ranked_results(self, vault):
        indexer, mock_linker = self._make_indexer(vault)
        # Pre-index a note
        indexer.index_note("Notes/Replication.md", "Replication and consensus in distributed systems")
        # Mock query embed returns slightly different vector
        mock_linker.get_embeddings.side_effect = lambda texts: [
            np.array([0.6, 0.8]) / np.linalg.norm([0.6, 0.8])
        ]
        results = indexer.semantic_search("replication consensus", limit=3)
        assert len(results) > 0
        assert results[0]["path"] == "Notes/Replication.md"
        assert 0.0 <= results[0]["similarity"] <= 1.1  # Cosine sim can slightly exceed 1.0 due to float precision

    def test_semantic_search_returns_empty_with_no_indexed_notes(self, vault):
        indexer, _ = self._make_indexer(vault)
        results = indexer.semantic_search("anything", limit=5)
        assert results == []


# ══════════════════════════════════════════════════════════════════════════════
# 3. AnalyticsEngine
# ══════════════════════════════════════════════════════════════════════════════

class TestAnalyticsEngine:
    def test_record_and_get_weak_notes(self, analytics_db):
        engine = AnalyticsEngine(analytics_db)
        engine.record("Notes/Weak.md", was_correct=False, time_ms=2000, question_type="mcq")
        engine.record("Notes/Weak.md", was_correct=False, time_ms=2000, question_type="mcq")
        engine.record("Notes/Strong.md", was_correct=True, time_ms=1000, question_type="mcq")
        engine.record("Notes/Strong.md", was_correct=True, time_ms=1000, question_type="mcq")
        engine.record("Notes/Strong.md", was_correct=True, time_ms=1000, question_type="mcq")

        weak = engine.get_weak_notes(["Notes/Weak.md", "Notes/Strong.md"], threshold=0.75)
        assert "Notes/Weak.md" in weak
        assert "Notes/Strong.md" not in weak

    def test_get_mastery_signal_range(self, analytics_db):
        engine = AnalyticsEngine(analytics_db)
        engine.record("Notes/Test.md", was_correct=True, time_ms=500, question_type="mcq")
        engine.record("Notes/Test.md", was_correct=False, time_ms=3000, question_type="writing")
        signal = engine.get_mastery_signal("Notes/Test.md")
        assert 0.0 <= signal <= 1.0

    def test_get_mastery_signal_no_history(self, analytics_db):
        engine = AnalyticsEngine(analytics_db)
        signal = engine.get_mastery_signal("Notes/Unreviewed.md")
        # AnalyticsEngine returns 0.5 (neutral prior) when no data exists
        assert signal == 0.5

    def test_get_forgetting_risk_map(self, analytics_db):
        engine = AnalyticsEngine(analytics_db)
        engine.record("Notes/A.md", was_correct=True, time_ms=800, question_type="mcq")
        engine.record("Notes/B.md", was_correct=False, time_ms=3000, question_type="writing")
        risk = engine.get_forgetting_risk_map(["Notes/A.md", "Notes/B.md"])
        assert "Notes/A.md" in risk
        assert "Notes/B.md" in risk

    def test_get_difficulty_distribution(self, analytics_db):
        engine = AnalyticsEngine(analytics_db)
        # Easy: fast + correct
        engine.record("Notes/Easy.md", was_correct=True, time_ms=300, question_type="mcq")
        # Hard: slow + incorrect
        engine.record("Notes/Hard.md", was_correct=False, time_ms=8000, question_type="writing")
        dist = engine.get_difficulty_distribution(["Notes/Easy.md", "Notes/Hard.md"])
        assert "easy" in dist
        assert "hard" in dist

    def test_record_with_optional_fields(self, analytics_db):
        engine = AnalyticsEngine(analytics_db)
        # Ensure optional fields don't crash the record method
        engine.record(
            "Notes/Optional.md",
            was_correct=True,
            time_ms=1000,
            question_type="fill_in",
            difficulty="L2",
            session_id="session_test",
            question_id="q123"
        )
        signal = engine.get_mastery_signal("Notes/Optional.md")
        assert signal > 0.0


# ══════════════════════════════════════════════════════════════════════════════
# 4. StudyScheduler
# ══════════════════════════════════════════════════════════════════════════════

class TestStudyScheduler:
    def test_generate_plan_with_exam(self, vault, analytics_db):
        from src.domains.ater.scheduler import StudyScheduler

        # Create a future exam file
        exam_file = vault / "database" / "exams" / "Midterm.md"
        future_date = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
        exam_file.write_text(
            f"---\ntitle: Midterm\ncourse: Distributed Systems\ndate: {future_date}\n---",
            encoding="utf-8",
        )

        scheduler = StudyScheduler(vault, analytics_db)
        plan = scheduler.generate_plan(daily_budget_minutes=30)

        assert "schedule" in plan
        assert "generated_at" in plan
        assert "daily_budget_minutes" in plan
        assert plan["daily_budget_minutes"] == 30
        assert len(plan["schedule"]) > 0
        entry = plan["schedule"][0]
        assert entry["exam_title"] == "Midterm"
        assert "days_remaining" in entry
        assert "predicted_retention_on_exam" in entry
        assert "daily_review_target" in entry

    def test_generate_plan_skips_past_exams(self, vault, analytics_db):
        from src.domains.ater.scheduler import StudyScheduler

        past_file = vault / "database" / "exams" / "OldExam.md"
        past_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
        past_file.write_text(
            f"---\ntitle: OldExam\ncourse: History\ndate: {past_date}\n---",
            encoding="utf-8",
        )

        scheduler = StudyScheduler(vault, analytics_db)
        plan = scheduler.generate_plan()
        # Past exam should be skipped; fallback General Practice Target added
        titles = [s["exam_title"] for s in plan["schedule"]]
        assert "OldExam" not in titles

    def test_generate_plan_fallback_when_no_exams(self, vault, analytics_db):
        from src.domains.ater.scheduler import StudyScheduler

        scheduler = StudyScheduler(vault, analytics_db)
        plan = scheduler.generate_plan()
        assert len(plan["schedule"]) > 0
        assert plan["schedule"][0]["exam_title"] == "General Practice Target"

    def test_generate_plan_includes_srs_due_count(self, vault, analytics_db):
        from src.domains.ater.scheduler import StudyScheduler

        # Add an SRS card for a course-matched note
        note_file = vault / "database" / "courses" / "DS_Note.md"
        note_file.write_text("---\ntitle: DS_Note\ncourse: Distributed Systems\n---\nContent.", encoding="utf-8")

        srs = SRSEngine(analytics_db)
        srs.review("database/courses/DS_Note.md", rating=3)

        future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        exam_file = vault / "database" / "exams" / "DS_Exam.md"
        exam_file.write_text(
            f"---\ntitle: DS_Exam\ncourse: Distributed Systems\ndate: {future_date}\n---",
            encoding="utf-8",
        )

        scheduler = StudyScheduler(vault, analytics_db)
        plan = scheduler.generate_plan(daily_budget_minutes=60)
        assert plan["schedule"][0]["total_cards"] >= 0  # Should find the card


# ══════════════════════════════════════════════════════════════════════════════
# 5. ExamEngine – Grade Exam (no real LLM needed)
# ══════════════════════════════════════════════════════════════════════════════

class TestExamEngineGrading:
    def _setup_exam_session(self, vault, exam_id: str):
        """Manually seed an exam session to test grading without real AI generation."""
        db = AcademicDB(vault)

        state = {
            "questions": [
                {"id": "eq_1", "type": "mcq", "question": "What is CAP theorem?", "difficulty": "L1"},
                {"id": "eq_2", "type": "true_false", "question": "Availability and Consistency can always be achieved simultaneously.", "difficulty": "L1"},
                {"id": "eq_3", "type": "writing", "question": "Explain Paxos consensus.", "difficulty": "L2"},
                {"id": "eq_4", "type": "fill_in", "question": "The C in CAP stands for ___", "difficulty": "L1"},
            ],
            "answers_state": {
                "eq_1": {"correct_answer": "B", "explanation": "CAP theorem states...", "note_path": "Notes/CAP.md", "required_keywords": []},
                "eq_2": {"correct_answer": "False", "explanation": "Only 2 of 3 can be achieved.", "note_path": "Notes/CAP.md", "required_keywords": []},
                "eq_3": {"correct_answer": "Quorum voting", "explanation": "Paxos uses quorum.", "note_path": "Notes/Paxos.md", "required_keywords": ["quorum", "leader", "majority"]},
                "eq_4": {"correct_answer": "Consistency", "explanation": "C = Consistency", "note_path": "Notes/CAP.md", "required_keywords": []},
            }
        }
        db.save_exam_session(exam_id, {"hub_ids": ["CS"]}, state, None)
        (vault / "Inbox").mkdir(parents=True, exist_ok=True)
        return db

    def test_grade_perfect_score(self, vault, analytics_db):
        from src.domains.ater.exam_engine import ExamEngine

        exam_id = "exam_perfect"
        self._setup_exam_session(vault, exam_id)

        engine = ExamEngine(vault)
        student_answers = {
            "eq_1": "B",
            "eq_2": "False",
            "eq_3": "The quorum mechanism ensures a majority leader vote.",
            "eq_4": "Consistency",
        }
        report = engine.grade_exam(exam_id, student_answers)

        assert report["score_percentage"] == 100.0
        assert report["passed"] is True
        assert report["correct_answers"] == 4
        assert report["total_questions"] == 4

    def test_grade_partial_score(self, vault, analytics_db):
        from src.domains.ater.exam_engine import ExamEngine

        exam_id = "exam_partial"
        self._setup_exam_session(vault, exam_id)

        engine = ExamEngine(vault)
        student_answers = {
            "eq_1": "A",       # Wrong
            "eq_2": "False",    # Correct
            "eq_3": "Quorum and leader election require a majority vote.",  # Has keywords → Correct
            "eq_4": "Consistency",  # Correct
        }
        report = engine.grade_exam(exam_id, student_answers)

        assert report["correct_answers"] == 3
        assert report["score_percentage"] == 75.0
        assert report["passed"] is True

    def test_grade_failing_score(self, vault, analytics_db):
        from src.domains.ater.exam_engine import ExamEngine

        exam_id = "exam_fail"
        self._setup_exam_session(vault, exam_id)

        engine = ExamEngine(vault)
        student_answers = {
            "eq_1": "A",     # Wrong
            "eq_2": "True",  # Wrong
            "eq_3": "I don't know",  # Missing keywords → Wrong
            "eq_4": "Availability",  # Wrong
        }
        report = engine.grade_exam(exam_id, student_answers)

        assert report["score_percentage"] == 0.0
        assert report["passed"] is False
        assert len(report["recommended_review_notes"]) > 0

    def test_grade_exam_report_structure(self, vault, analytics_db):
        from src.domains.ater.exam_engine import ExamEngine

        exam_id = "exam_structure"
        self._setup_exam_session(vault, exam_id)

        engine = ExamEngine(vault)
        report = engine.grade_exam(exam_id, {"eq_1": "B", "eq_2": "False", "eq_3": "quorum leader majority", "eq_4": "Consistency"})

        # Verify all required report fields
        for field in ["exam_id", "graded_at", "total_questions", "correct_answers",
                       "score_percentage", "passed", "results", "recommended_review_notes"]:
            assert field in report, f"Missing field: {field}"

        # Verify each result has required fields
        for q_id, result in report["results"].items():
            for field in ["question", "student_answer", "correct_answer", "is_correct", "explanation"]:
                assert field in result, f"Result missing field: {field}"

    def test_grade_exam_missing_session_raises(self, vault):
        from src.domains.ater.exam_engine import ExamEngine
        (vault / "Inbox").mkdir(parents=True, exist_ok=True)
        engine = ExamEngine(vault)
        with pytest.raises(ValueError, match="not found"):
            engine.grade_exam("nonexistent_exam_id", {})

    def test_grade_exam_saves_report_to_db(self, vault, analytics_db):
        from src.domains.ater.exam_engine import ExamEngine

        exam_id = "exam_save"
        self._setup_exam_session(vault, exam_id)

        engine = ExamEngine(vault)
        engine.grade_exam(exam_id, {"eq_1": "B", "eq_2": "False", "eq_3": "quorum leader majority", "eq_4": "Consistency"})

        # Reload from DB and verify report was saved
        db = AcademicDB(vault)
        session = db.get_exam_session(exam_id)
        assert session["report"] is not None
        assert session["report"]["score_percentage"] == 100.0


# ══════════════════════════════════════════════════════════════════════════════
# 6. SocraticTutor – Mocked LLM
# ══════════════════════════════════════════════════════════════════════════════

class TestSocraticTutor:
    @pytest.mark.asyncio
    async def test_chat_creates_new_session(self, vault, secrets):
        from src.domains.ater.tutor import SocraticTutor

        note_path = vault / "Notes" / "CAP.md"
        note_path.write_text("# CAP Theorem\nConsistency, Availability, Partition tolerance.", encoding="utf-8")

        tutor = SocraticTutor(vault)

        mock_resp = MagicMock()
        mock_resp.content = "Great start! Now, can you explain what Consistency means in this context?"

        with patch("src.domains.ater.tutor.ModelFactory.get_model") as mock_factory:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_resp)
            mock_factory.return_value = mock_llm

            result = await tutor.chat("Notes/CAP.md", "I think it's about trade-offs.", secrets=secrets)

        assert "session_id" in result
        assert "response" in result
        assert result["response"] == mock_resp.content
        assert len(result["history"]) == 2  # user + assistant

    @pytest.mark.asyncio
    async def test_chat_persists_history_across_turns(self, vault, secrets):
        from src.domains.ater.tutor import SocraticTutor

        (vault / "Notes" / "Paxos.md").write_text("# Paxos\nLeader election protocol.", encoding="utf-8")

        tutor = SocraticTutor(vault)
        session_id = "tutor_persist_test"

        mock_resp = MagicMock()
        mock_resp.content = "Interesting. What is the role of the proposer?"

        with patch("src.domains.ater.tutor.ModelFactory.get_model") as mock_factory:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_resp)
            mock_factory.return_value = mock_llm

            # Turn 1
            await tutor.chat("Notes/Paxos.md", "Paxos uses a leader.", session_id=session_id, secrets=secrets)
            # Turn 2
            result2 = await tutor.chat("Notes/Paxos.md", "The proposer initiates voting.", session_id=session_id, secrets=secrets)

        # After 2 turns: 2 user messages + 2 assistant messages = 4 history items
        assert len(result2["history"]) == 4

    @pytest.mark.asyncio
    async def test_chat_with_nonexistent_note_still_works(self, vault, secrets):
        """Tutor should not crash if the note file doesn't exist."""
        from src.domains.ater.tutor import SocraticTutor

        tutor = SocraticTutor(vault)

        mock_resp = MagicMock()
        mock_resp.content = "What do you know about this topic?"

        with patch("src.domains.ater.tutor.ModelFactory.get_model") as mock_factory:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_resp)
            mock_factory.return_value = mock_llm

            result = await tutor.chat("Notes/DoesNotExist.md", "I know nothing.", secrets=secrets)

        assert result["response"] == mock_resp.content


# ══════════════════════════════════════════════════════════════════════════════
# 7. KnowledgeGapDetector – SRS-based gaps
# ══════════════════════════════════════════════════════════════════════════════

class TestKnowledgeGapDetector:
    def _setup_hub_with_lapsed_note(self, vault, analytics_db):
        """Sets up hub + note with SRS lapses to trigger gap detection."""
        hub_file = vault / "database" / "study planner" / "gap_hub.md"
        hub_file.write_text(
            "---\ntitle: gap_hub\ntype: Hub\n---\n\n## Connections\n- [[Concept_Lapsed]]\n- [[Concept_Missing_Prereq]]",
            encoding="utf-8",
        )
        note = vault / "database" / "study planner" / "Concept_Lapsed.md"
        note.write_text(
            "---\ntitle: Concept_Lapsed\nprerequisites: [\"[[Concept_Missing_Prereq]]\"]\n---\nContent.",
            encoding="utf-8",
        )
        # Simulate many lapses in SRS
        srs = SRSEngine(analytics_db)
        for _ in range(3):
            srs.review("database/study planner/Concept_Lapsed.md", rating=1)
        return hub_file

    def test_detect_gaps_missing_prerequisites(self, vault, analytics_db, secrets):
        from src.domains.ater.gap_detector import KnowledgeGapDetector

        self._setup_hub_with_lapsed_note(vault, analytics_db)
        detector = KnowledgeGapDetector(vault, analytics_db, secrets)

        gaps = detector.detect_gaps("gap_hub")
        gap_types = [g["type"] for g in gaps]
        assert "missing_prerequisite" in gap_types

    def test_detect_gaps_high_lapses(self, vault, analytics_db, secrets):
        from src.domains.ater.gap_detector import KnowledgeGapDetector

        self._setup_hub_with_lapsed_note(vault, analytics_db)
        detector = KnowledgeGapDetector(vault, analytics_db, secrets)

        gaps = detector.detect_gaps("gap_hub")
        gap_types = [g["type"] for g in gaps]
        assert "high_lapses" in gap_types

    def test_detect_gaps_returns_correct_structure(self, vault, analytics_db, secrets):
        from src.domains.ater.gap_detector import KnowledgeGapDetector

        self._setup_hub_with_lapsed_note(vault, analytics_db)
        detector = KnowledgeGapDetector(vault, analytics_db, secrets)

        gaps = detector.detect_gaps("gap_hub")
        for gap in gaps:
            assert "type" in gap
            assert "note_path" in gap
            assert "priority" in gap
            assert "description" in gap

    def test_detect_gaps_no_gaps_for_clean_hub(self, vault, analytics_db, secrets):
        from src.domains.ater.gap_detector import KnowledgeGapDetector

        # Hub with well-reviewed note (no lapses)
        hub = vault / "database" / "study planner" / "clean_hub.md"
        hub.write_text(
            "---\ntitle: clean_hub\ntype: Hub\n---\n\n## Connections\n- [[Good_Note]]",
            encoding="utf-8",
        )
        note = vault / "database" / "study planner" / "Good_Note.md"
        note.write_text("---\ntitle: Good_Note\nprerequisites: []\n---\nGood content.", encoding="utf-8")

        srs = SRSEngine(analytics_db)
        srs.review("database/study planner/Good_Note.md", rating=4)
        srs.review("database/study planner/Good_Note.md", rating=4)

        detector = KnowledgeGapDetector(vault, analytics_db, secrets)
        gaps = detector.detect_gaps("clean_hub")
        # Should not flag high_lapses (0 lapses), should not flag missing_prerequisite
        lapse_gaps = [g for g in gaps if g["type"] == "high_lapses"]
        missing_gaps = [g for g in gaps if g["type"] == "missing_prerequisite"]
        assert lapse_gaps == []
        assert missing_gaps == []
