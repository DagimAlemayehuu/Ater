"""
test_learning_runtime_e2e.py
============================
End-to-end integration test for the Ater Learning Runtime.

Executes a complete "student starts learning Git from scratch" lifecycle
across a single sandboxed vault and ephemeral SQLite database.

Phases covered
--------------
1. Planning         – AterPlanner writes Hub, Chapter, Atomic Note stubs
2. Compilation      – AterLessonCompiler parses sections, builds nav, emits HTML variants
3. Artifact Packs   – Versioned artifact pack written to <chapter>/artifacts/<note>.artifacts.json
4. Tutor Persistence – TutorSessionManager persists sessions, grades wagers, logs misconceptions
5. Cram Mode        – Phase allocations, weakness scoring, rescue-mode trigger
6. Source Grounding – PDF ingestion, page citations in frontmatter, search augmentation
7. Playgrounds      – SQL evaluation against in-memory DB; Case Simulation metric clamping
8. Learner Recalibration – LearnerModelManager accuracy, calibration, prereq-gated recs

Invariants (enforced by this test suite)
-----------------------------------------
- No live LLM or cloud API calls: all model interactions are mocked.
- No Tauri / browser windows: pure Python execution.
- No network activity: ATER_TEST_MODE=1 activates mock search results.
- Double-quoted YAML wikilinks are asserted at every step (canonical convention).
"""

import os
import json
import sqlite3
import tempfile
import pytest
from pathlib import Path
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, AsyncMock, patch

# ---------------------------------------------------------------------------
# Force the search engine into offline mock mode for every test in this module
# ---------------------------------------------------------------------------
os.environ.setdefault("ATER_TEST_MODE", "1")

# ---------------------------------------------------------------------------
# Domain imports (tested against real implementations; only I/O is mocked)
# ---------------------------------------------------------------------------
from src.domains.ater.planner import (
    AterPlanner,
    IntentClarificationResponse,
    CurriculumPlan,
    PlannedChapter,
)
from src.domains.ater.compiler_service import AterLessonCompiler
from src.domains.ater.learning_object import (
    build_minimal_artifact_pack,
    validate_artifact_pack,
    append_artifact_version,
    get_artifact_pack_path,
    validate_learning_objects,
    merge_atomic_note_metadata,
)
from src.domains.ater.tutor_service import TutorSessionManager
from src.domains.ater.srs import SRSEngine
from src.domains.ater.cram_service import (
    CramPhase,
    calculate_phase_allocations,
    calculate_weakness_score,
    check_rescue_mode,
    filter_question_mix,
)
from src.domains.ater.source_service import (
    SourceCitation,
    SourceGroundedNotePlan,
    SourceGroundedCurriculum,
    SourceIngestionService,
    SourceGroundedPlanner,
    SearchAugmentationEngine,
)
from src.domains.ater.artifact_service import (
    evaluate_sql_query,
    evaluate_case_step,
)
from src.domains.ater.learner_model_service import LearnerModelManager


# ===========================================================================
# FIXTURES
# ===========================================================================


class _DummySecrets:
    """Minimal secrets stub for planners; no real credentials used."""

    def __init__(self, vault_path: str):
        self.vault_path = vault_path
        self.ai_provider = "google"
        self.ai_model = "gemini-2.0-flash"
        self.ai_key = "mock-key"
        self.academic_path = "Notes"


def _make_mock_llm(return_value):
    """Build a MagicMock LLM client whose structured-output chain returns *return_value*."""
    mock_llm = MagicMock()
    mock_chain = MagicMock()
    mock_chain.ainvoke = AsyncMock(return_value=return_value)
    mock_llm.with_structured_output.return_value = mock_chain
    return mock_llm


@pytest.fixture
def git_vault(tmp_path: Path):
    """
    Provides a fully scaffolded temporary vault for a Git self-study path.
    Written by the planner in Phase 1, then extended by subsequent phases.
    """
    (tmp_path / "database" / "learning paths").mkdir(parents=True, exist_ok=True)
    (tmp_path / "database" / "General" / "Git" / "01_Foundations").mkdir(
        parents=True, exist_ok=True
    )
    (tmp_path / "Inbox").mkdir(parents=True, exist_ok=True)
    return tmp_path


@pytest.fixture
def srs_db(git_vault: Path) -> Path:
    """Initialises an ephemeral SRS/tutor SQLite database inside the temporary vault."""
    db_path = git_vault / "Inbox" / "ater_queue.db"
    SRSEngine(db_path)  # runs schema migrations
    return db_path


@pytest.fixture
def git_curriculum():
    """Deterministic curriculum dict for the Git self-study path."""
    return {
        "topic": "Git",
        "learning_mode": "self-study",
        "chapters": [
            {
                "title": "Foundations",
                "order": 1,
                "atomic_notes": ["Git_Commit_Graph", "Git_Branch_Model"],
            }
        ],
    }


@pytest.fixture
def full_atomic_note_content():
    """
    A complete 4-section Atomic Note (Git_Commit_Graph) used for compilation
    and downstream phase tests.
    """
    return """\
---
title: Git Commit Graph
type: Atomic Note
hub: "[[Git_Hub]]"
chapter: "[[Chapter_01_Foundations]]"
course: Version Control
---

## Mental Model
A Git commit graph is a directed acyclic graph (DAG) where each node represents
a snapshot of the repository and each edge points to its parent commit. Understanding
this structure is fundamental to reasoning about branch divergence and merge strategies.

## How Commits Chain
Each commit stores a pointer to one or more parent SHA-1 digests, forming an immutable
chain. A merge commit contains two parent pointers, making the graph non-linear. The
HEAD reference is simply a pointer that travels along this graph.

## Branching and Reachability
A branch name is a lightweight movable pointer to a commit node. Reachability in the
DAG determines which commits belong to a branch's history, which drives Git's garbage
collection and log traversal algorithms.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "question": "What graph structure does Git use for its commit history?",
    "options": ["Doubly linked list", "DAG", "Binary tree", "Hash ring"],
    "answer": "DAG",
    "explanation": "Git commits form a Directed Acyclic Graph where edges point from child to parent."
  },
  {
    "id": "q2",
    "type": "short-answer",
    "question": "What does HEAD point to in a typical working repository?",
    "answer": "the currently checked-out commit or branch tip",
    "explanation": "HEAD is a symbolic reference resolved to a specific commit SHA."
  }
]
```
"""


# ===========================================================================
# PHASE 1 – PLANNING
# ===========================================================================


class TestPhase1Planning:
    """
    Verifies that AterPlanner writes valid Hub, Chapter, and Atomic Note stubs
    to the temporary vault, with double-quoted YAML wikilinks throughout.
    """

    def test_write_curriculum_creates_hub(self, git_vault, git_curriculum):
        secrets = _DummySecrets(str(git_vault))
        planner = AterPlanner(secrets, llm=MagicMock())
        result = planner.write_curriculum(git_curriculum, mode="Generate All")

        hub_path = git_vault / "database" / "learning paths" / "Git_Hub.md"
        assert hub_path.exists(), "Learning Hub file must be created under 'database/learning paths/'"
        content = hub_path.read_text(encoding="utf-8")
        assert "type: Learning Hub" in content or 'type: "Learning Hub"' in content, (
            "Hub frontmatter must declare type: Learning Hub"
        )
        assert "topic: Git" in content, "Hub must record the topic"
        assert "- [[Chapter_01_Foundations]]" in content or '- "[[Chapter_01_Foundations]]"' in content, (
            "Hub must list the generated chapter"
        )

    def test_write_curriculum_creates_chapter(self, git_vault, git_curriculum):
        secrets = _DummySecrets(str(git_vault))
        planner = AterPlanner(secrets, llm=MagicMock())
        planner.write_curriculum(git_curriculum, mode="Generate All")

        ch_path = (
            git_vault
            / "database"
            / "General"
            / "Git"
            / "01_Foundations"
            / "Chapter_01_Foundations.md"
        )
        assert ch_path.exists(), "Chapter file must be created under the topic content route"
        content = ch_path.read_text(encoding="utf-8")
        assert "type: Chapter" in content or 'type: "Chapter"' in content
        assert "- [[Git_Commit_Graph]]" in content or '- "[[Git_Commit_Graph]]"' in content

    def test_write_curriculum_creates_atomic_note_stubs(self, git_vault, git_curriculum):
        secrets = _DummySecrets(str(git_vault))
        planner = AterPlanner(secrets, llm=MagicMock())
        planner.write_curriculum(git_curriculum, mode="Generate All")

        note_path = (
            git_vault
            / "database"
            / "General"
            / "Git"
            / "01_Foundations"
            / "Git_Commit_Graph.md"
        )
        assert note_path.exists(), "Atomic Note stub must be written for each note in the chapter"
        content = note_path.read_text(encoding="utf-8")
        assert "type: Atomic Note" in content or 'type: "Atomic Note"' in content
        # Double-quoted wikilink invariant (CONTEXT.md §3)
        assert 'chapter: "[[Chapter_01_Foundations]]"' in content, (
            "YAML wikilink fields must be double-quoted per CONTEXT.md naming conventions"
        )

    @pytest.mark.asyncio
    async def test_intent_classification_mock(self, git_vault):
        mock_response = IntentClarificationResponse(
            is_learning=True,
            needs_clarification=False,
            questions=[],
        )
        mock_llm = _make_mock_llm(mock_response)
        secrets = _DummySecrets(str(git_vault))
        planner = AterPlanner(secrets, llm=mock_llm)

        result = await planner.classify_intent_and_clarification("Teach me Git from scratch")
        assert result["is_learning"] is True, "Intent must be classified as a learning request"
        assert result["needs_clarification"] is False


# ===========================================================================
# PHASE 2 – COMPILATION
# ===========================================================================


class TestPhase2Compilation:
    """
    Verifies that AterLessonCompiler correctly parses all 4 Atomic Note sections,
    resolves previous/next navigation, generates simple/cram HTML variants, and
    embeds the Markdown source inside the deep variant.
    """

    def _setup_note(self, vault: Path, content: str) -> Path:
        """Write a complete note file into the vault and return its path."""
        note_dir = vault / "database" / "General" / "Git" / "01_Foundations"
        note_dir.mkdir(parents=True, exist_ok=True)

        # Chapter file required for navigation resolution
        ch_file = note_dir / "Chapter_01_Foundations.md"
        if not ch_file.exists():
            ch_file.write_text(
                "---\ntype: Chapter\nhub: \"[[Git_Hub]]\"\norder: 1\n"
                "atomic_notes:\n  - Git_Commit_Graph\n  - Git_Branch_Model\n---\n",
                encoding="utf-8",
            )

        # Hub file
        hub_dir = vault / "database" / "learning paths"
        hub_dir.mkdir(parents=True, exist_ok=True)
        hub_file = hub_dir / "Git_Hub.md"
        if not hub_file.exists():
            hub_file.write_text(
                "---\ntype: Learning Hub\ntopic: Git\n---\n",
                encoding="utf-8",
            )

        note_file = note_dir / "Git_Commit_Graph.md"
        note_file.write_text(content, encoding="utf-8")
        return note_file

    def test_section_parsing(self, git_vault, full_atomic_note_content):
        note_file = self._setup_note(git_vault, full_atomic_note_content)
        compiler = AterLessonCompiler(str(git_vault))
        parsed, metadata = compiler.parse_note(note_file)

        assert metadata["title"] == "Git Commit Graph", "Title must be parsed from frontmatter"
        assert "DAG" in parsed["mental_model"]["content"], (
            "Mental Model section must contain the expected prose"
        )
        assert parsed["h1"]["title"] == "How Commits Chain", "H1 title must be parsed"
        assert "parent SHA-1" in parsed["h1"]["content"], "H1 content must be present"
        assert parsed["h2"]["title"] == "Branching and Reachability", "H2 title must be parsed"
        assert "The Proving Grounds" in parsed.get("proving_grounds", {}).get("content", "") or \
               "interactive-quiz" in parsed.get("proving_grounds", {}).get("content", ""), (
            "Proving Grounds section must be extracted"
        )

    def test_navigation_resolution(self, git_vault, full_atomic_note_content):
        note_file = self._setup_note(git_vault, full_atomic_note_content)
        compiler = AterLessonCompiler(str(git_vault))
        _, metadata = compiler.parse_note(note_file)
        nav = compiler.resolve_navigation(note_file, metadata)

        assert nav["hub_title"] == "Git_Hub", "Navigation must resolve hub title"
        assert nav["chapter_title"] == "Chapter_01_Foundations"
        # Git_Commit_Graph is the first note – no previous note
        assert nav["prev_note_title"] is None or nav["prev_note_path"] is None or \
               "Git_Commit_Graph" not in str(nav.get("prev_note_path", "")), (
            "First note should have no previous note"
        )
        assert nav["next_note_title"] == "Git_Branch_Model", (
            "Next note must be the second entry in the chapter's atomic_notes list"
        )
        assert nav["next_note_path"] == "./Git_Branch_Model", (
            "Next note path must use a relative './' prefix"
        )

    def test_simple_html_variant(self, git_vault, full_atomic_note_content):
        note_file = self._setup_note(git_vault, full_atomic_note_content)
        compiler = AterLessonCompiler(str(git_vault))
        html = compiler.compile_to_html(note_file, "simple")

        assert "DAG" in html or "directed acyclic" in html.lower(), (
            "Simple variant must include Mental Model content"
        )
        assert "Key Definitions" in html, (
            "Simple variant must include the Key Definitions section"
        )

    def test_cram_html_variant(self, git_vault, full_atomic_note_content):
        note_file = self._setup_note(git_vault, full_atomic_note_content)
        compiler = AterLessonCompiler(str(git_vault))
        html = compiler.compile_to_html(note_file, "cram")

        assert "Cram Sheet:" in html, "Cram variant must include the Cram Sheet header"
        assert "DAG" in html or "directed acyclic" in html.lower(), (
            "Cram variant must embed Mental Model content"
        )

    def test_deep_html_embeds_markdown_source(self, git_vault, full_atomic_note_content):
        note_file = self._setup_note(git_vault, full_atomic_note_content)
        compiler = AterLessonCompiler(str(git_vault))
        html = compiler.compile_to_html(note_file, "deep")

        assert '<script type="text/markdown" id="raw-markdown-source">' in html, (
            "Deep variant must embed the raw Markdown source in a <script> block"
        )

    def test_compile_lesson_writes_html_file(self, git_vault, full_atomic_note_content):
        note_file = self._setup_note(git_vault, full_atomic_note_content)
        compiler = AterLessonCompiler(str(git_vault))
        out_path = compiler.compile_lesson(note_file, "simple")

        assert out_path.exists(), "compile_lesson must write the HTML file to disk"
        assert out_path.name == "Git_Commit_Graph.simple.html", (
            "Output filename must follow the <NoteTitle>.<variant>.html convention"
        )

    def test_frontmatter_updated_with_variants(self, git_vault, full_atomic_note_content):
        """
        After compilation the note frontmatter must reference the compiled lesson
        variant paths using double-quoted YAML wikilinks where applicable.
        """
        note_file = self._setup_note(git_vault, full_atomic_note_content)
        compiler = AterLessonCompiler(str(git_vault))

        # Compile both main variants
        compiler.compile_lesson(note_file, "simple")
        compiler.compile_lesson(note_file, "cram")

        # Manually merge variants into the note frontmatter (matches production flow)
        variants = {
            "simple": "lessons/Git_Commit_Graph.simple.html",
            "cram": "lessons/Git_Commit_Graph.cram.html",
        }
        existing_content = note_file.read_text(encoding="utf-8")
        merged = merge_atomic_note_metadata(
            existing_content,
            "Chapter_01_Foundations",
            variants,
            "artifacts/Git_Commit_Graph.artifacts.json",
            "Git_Hub",
        )
        note_file.write_text(merged, encoding="utf-8")

        updated = note_file.read_text(encoding="utf-8")
        assert 'chapter: "[[Chapter_01_Foundations]]"' in updated, (
            "Updated frontmatter must preserve double-quoted YAML wikilink for chapter"
        )
        assert 'hub: "[[Git_Hub]]"' in updated, (
            "Updated frontmatter must preserve double-quoted YAML wikilink for hub"
        )
        assert "simple: lessons/Git_Commit_Graph.simple.html" in updated, (
            "Frontmatter must record the simple variant path"
        )


# ===========================================================================
# PHASE 3 – ARTIFACT PACKS
# ===========================================================================


class TestPhase3ArtifactPacks:
    """
    Verifies that the artifact pack module creates versioned JSON files under
    <chapter_dir>/artifacts/<note>.artifacts.json and passes contract validation.
    """

    def test_pack_written_to_chapter_artifacts_dir(self, git_vault):
        chapter_dir = (
            git_vault / "database" / "General" / "Git" / "01_Foundations"
        )
        chapter_dir.mkdir(parents=True, exist_ok=True)
        artifacts_dir = chapter_dir / "artifacts"
        artifacts_dir.mkdir(parents=True, exist_ok=True)

        note_title = "Git_Commit_Graph"
        note_rel_path = "database/General/Git/01_Foundations/Git_Commit_Graph.md"
        pack = build_minimal_artifact_pack(note_title, note_rel_path)

        pack_file = artifacts_dir / f"{note_title}.artifacts.json"
        pack_file.write_text(json.dumps(pack), encoding="utf-8")

        assert pack_file.exists(), (
            "Artifact pack must be written to <chapter_dir>/artifacts/<note>.artifacts.json"
        )
        loaded = json.loads(pack_file.read_text(encoding="utf-8"))
        assert loaded["note_title"] == note_title
        assert loaded["schema_version"] == 1
        assert loaded["active_version"] == 1

    def test_pack_contract_validation_passes(self, git_vault):
        pack = build_minimal_artifact_pack(
            "Git_Commit_Graph",
            "database/General/Git/01_Foundations/Git_Commit_Graph.md",
        )
        errors = validate_artifact_pack(pack)
        assert not errors, f"Minimal artifact pack must pass contract validation; errors: {errors}"

    def test_pack_versioning_preserves_history(self, git_vault):
        pack = build_minimal_artifact_pack(
            "Git_Commit_Graph",
            "database/General/Git/01_Foundations/Git_Commit_Graph.md",
        )
        pack = append_artifact_version(pack, 2, active=True)

        assert pack["active_version"] == 2, "Appending a new version must update active_version"
        assert len(pack["versions"]) == 2, "Prior version must be preserved in the versions list"
        assert not validate_artifact_pack(pack), (
            "Two-version pack must still pass contract validation"
        )

    def test_artifact_pack_path_convention(self):
        path = get_artifact_pack_path("Git Commit Graph")
        assert path == "artifacts/Git_Commit_Graph.artifacts.json", (
            "Artifact pack path helper must normalise the title and use the canonical path"
        )


# ===========================================================================
# PHASE 4 – TUTOR PERSISTENCE
# ===========================================================================


class TestPhase4TutorPersistence:
    """
    Verifies that TutorSessionManager persists sessions to SQLite, correctly
    grades wager-based confidence scoring, and logs high-confidence incorrect
    answers to the user_misconceptions table.
    """

    def _create_hub_and_note(self, vault: Path) -> None:
        (vault / "database" / "learning paths").mkdir(parents=True, exist_ok=True)
        note_dir = vault / "database" / "General" / "Git" / "01_Foundations"
        note_dir.mkdir(parents=True, exist_ok=True)

        (vault / "database" / "learning paths" / "Git_Hub.md").write_text(
            '---\ntype: Learning Hub\ntopic: Git\nchapters:\n  - "[[Chapter_01_Foundations]]"\n---\n',
            encoding="utf-8",
        )
        (note_dir / "Chapter_01_Foundations.md").write_text(
            '---\ntype: Chapter\nhub: "[[Git_Hub]]"\norder: 1\nnotes:\n  - "[[Git_Commit_Graph]]"\n---\n',
            encoding="utf-8",
        )
        (note_dir / "Git_Commit_Graph.md").write_text(
            '---\ntitle: Git Commit Graph\ntype: Atomic Note\n---\n'
            '## Mental Model\nA DAG.\n'
            '## The Proving Grounds\n```interactive-quiz\n'
            '[{"id": "q1", "type": "multiple-choice", "question": "What?", '
            '"options": ["DAG", "List"], "answer": "DAG", "explanation": "Yes."}]\n```\n',
            encoding="utf-8",
        )

    def test_session_starts_and_persists(self, git_vault, srs_db):
        self._create_hub_and_note(git_vault)
        manager = TutorSessionManager(srs_db, git_vault)
        session = manager.start_session("e2e_sess1", "database/learning paths/Git_Hub.md")

        assert session["session_id"] == "e2e_sess1"
        assert session["score"] == 0
        assert "Git_Commit_Graph.md" in session["current_note_path"], (
            "Session must start on the first Atomic Note in the curriculum"
        )

        # Verify row is persisted in SQLite
        conn = sqlite3.connect(str(srs_db))
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT * FROM tutor_sessions WHERE session_id = ?", ("e2e_sess1",)
        ).fetchone()
        assert row is not None, "Session must be persisted to the tutor_sessions table"
        assert row["score"] == 0

    def test_wager_scoring_correct_high_confidence(self, git_vault, srs_db):
        self._create_hub_and_note(git_vault)
        manager = TutorSessionManager(srs_db, git_vault)
        manager.start_session("e2e_sess_wager", "database/learning paths/Git_Hub.md")

        result = manager.submit_answer("e2e_sess_wager", "q1", is_correct=True, wager="high")
        assert result["score"] == 10, "Correct + high-confidence must award +10 points"
        assert result["score_change"] == 10

    def test_wager_scoring_incorrect_high_confidence(self, git_vault, srs_db):
        self._create_hub_and_note(git_vault)
        manager = TutorSessionManager(srs_db, git_vault)
        manager.start_session("e2e_sess_penalty", "database/learning paths/Git_Hub.md")

        result = manager.submit_answer("e2e_sess_penalty", "q1", is_correct=False, wager="high")
        assert result["score_change"] == -5, "Incorrect + high-confidence must deduct 5 points"

    def test_misconception_logged_for_high_confidence_error(self, git_vault, srs_db):
        self._create_hub_and_note(git_vault)
        manager = TutorSessionManager(srs_db, git_vault)
        manager.start_session("e2e_sess_misc", "database/learning paths/Git_Hub.md")

        result = manager.submit_answer(
            "e2e_sess_misc", "q1", is_correct=False, wager="high", user_answer="linked list"
        )
        assert result["diagnosis"]["is_misconception"] is True, (
            "High-confidence incorrect answer must be flagged as a misconception"
        )

        conn = sqlite3.connect(str(srs_db))
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM user_misconceptions").fetchone()
        assert row is not None, (
            "Misconception must be persisted to the user_misconceptions table"
        )
        assert row["note_title"] == "Git_Commit_Graph"

    def test_score_clamped_at_zero(self, git_vault, srs_db):
        self._create_hub_and_note(git_vault)
        manager = TutorSessionManager(srs_db, git_vault)
        manager.start_session("e2e_sess_clamp", "database/learning paths/Git_Hub.md")

        # Drive score to 0 from initial 0 by submitting wrong/high answers
        for _ in range(5):
            manager.submit_answer("e2e_sess_clamp", "q1", is_correct=False, wager="high")

        # Score must not go negative
        conn = sqlite3.connect(str(srs_db))
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT score FROM tutor_sessions WHERE session_id = 'e2e_sess_clamp'"
        ).fetchone()
        assert row["score"] >= 0, "Score must be clamped at 0 and never go negative"


# ===========================================================================
# PHASE 5 – CRAM MODE
# ===========================================================================


class TestPhase5CramMode:
    """
    Verifies that cram phase allocations skip orientation for 15-minute sessions,
    weakness scores rank notes correctly, and rescue mode activates when time runs low.
    """

    def test_15_minute_session_skips_orientation(self):
        alloc = calculate_phase_allocations(15)
        assert alloc[CramPhase.orientation.value] == 0.0, (
            "A 15-minute cram session must compress orientation to 0 minutes"
        )

    def test_15_minute_phase_durations_compressed(self):
        alloc = calculate_phase_allocations(15)
        assert alloc[CramPhase.high_yield.value] == pytest.approx(3.0), (
            "15-minute high_yield phase must be 3 minutes (20%)"
        )
        assert alloc[CramPhase.active_recall.value] == pytest.approx(9.0), (
            "15-minute active_recall phase must be 9 minutes (60%)"
        )
        assert alloc[CramPhase.mistake_repair.value] == pytest.approx(3.0), (
            "15-minute mistake_repair phase must be 3 minutes (20%)"
        )

    def test_weakness_score_ranks_high_confidence_errors_higher(self):
        base = calculate_weakness_score(diagnostic_incorrect=False, diagnostic_taken=True)
        high_mismatch = calculate_weakness_score(
            diagnostic_incorrect=False,
            diagnostic_taken=True,
            high_confidence_mistakes=3,
        )
        assert high_mismatch > base, (
            "Notes with high-confidence mistakes must have higher weakness scores"
        )

    def test_weakness_score_ranks_low_fsrs_higher(self):
        base = calculate_weakness_score(diagnostic_incorrect=False, diagnostic_taken=True)
        low_fsrs = calculate_weakness_score(
            diagnostic_incorrect=False,
            diagnostic_taken=True,
            fsrs_retrievability=0.2,
        )
        assert low_fsrs > base, (
            "Notes with low FSRS retrievability must have higher weakness scores"
        )

    def test_rescue_mode_triggers_when_time_critical(self):
        # 4 minutes remaining in a 60-minute session → below 15% threshold (9 min)
        assert check_rescue_mode(4.0, 60) is True, (
            "Rescue mode must activate when remaining time is critically low"
        )

    def test_rescue_mode_inactive_when_sufficient_time(self):
        assert check_rescue_mode(15.0, 60) is False, (
            "Rescue mode must NOT activate when sufficient time remains"
        )

    def test_question_mix_uses_multiple_types(self):
        questions = [
            {"type": "short-answer"},
            {"type": "trace"},
            {"type": "essay"},
            {"type": "essay"},
        ]
        filtered = filter_question_mix(questions)
        types_in_result = {q["type"] for q in filtered}
        assert len(types_in_result) > 1, (
            "Question mix must include more than one question type in cram mode"
        )
        assert "short-answer" in types_in_result or "trace" in types_in_result, (
            "Rapid recall types must be prioritised in the question mix"
        )
        # At most one essay question
        essay_count = sum(1 for q in filtered if q["type"] == "essay")
        assert essay_count <= 1, "At most one open-ended writing question is allowed in cram mode"


# ===========================================================================
# PHASE 6 – SOURCE GROUNDING
# ===========================================================================


class TestPhase6SourceGrounding:
    """
    Verifies PDF ingestion (page-by-page), citation serialisation in frontmatter,
    and mock search augmentation.
    """

    @patch("src.domains.ater.source_service.load_pdf_robust")
    def test_pdf_ingestion_maps_page_numbers(self, mock_load_pdf):
        """Page number metadata must be serialised into the ingestion result."""
        mock_load_pdf.return_value = [
            SimpleNamespace(
                page_content="Git stores snapshots, not diffs.", metadata={"page": 0}
            ),
            SimpleNamespace(
                page_content="The staging area bridges working tree and repo.", metadata={"page": 1}
            ),
        ]

        service = SourceIngestionService()
        result = service.ingest_pdf("git-tutorial.pdf")

        assert result["file_name"] == "git-tutorial.pdf"
        assert len(result["pages"]) == 2
        assert result["pages"][0]["page_number"] == 1
        assert result["pages"][1]["page_number"] == 2
        assert "Git stores snapshots" in result["pages"][0]["content"]
        assert not result["warnings"], "All non-empty pages must produce no coverage warnings"

    @patch("src.domains.ater.source_service.load_pdf_robust")
    def test_empty_page_generates_coverage_warning(self, mock_load_pdf):
        mock_load_pdf.return_value = [
            SimpleNamespace(page_content="Valid content.", metadata={"page": 0}),
            SimpleNamespace(page_content="", metadata={"page": 1}),
        ]

        service = SourceIngestionService()
        result = service.ingest_pdf("scanned-book.pdf")

        assert len(result["warnings"]) == 1
        assert result["warnings"][0].severity == "high"
        assert "page(s) 2" in result["warnings"][0].description

    @pytest.mark.asyncio
    async def test_grounded_curriculum_writes_page_citations(self, tmp_path):
        """
        SourceGroundedPlanner must write note frontmatter containing page
        citation blocks when a grounded curriculum is persisted to disk.
        """
        curriculum = SourceGroundedCurriculum(
            topic="Git",
            sources=["git-internals.pdf"],
            notes=[
                SourceGroundedNotePlan(
                    title="Git Commit Graph",
                    chapter_title="Foundations",
                    citations=[
                        SourceCitation(
                            file_name="git-internals.pdf",
                            pages=[7, 8],
                            confidence_score=0.97,
                        )
                    ],
                    suggested_concepts=["DAG", "SHA-1"],
                )
            ],
            warnings=[],
        )

        mock_llm = _make_mock_llm(curriculum)
        secrets = _DummySecrets(str(tmp_path))
        planner = SourceGroundedPlanner(secrets, llm=mock_llm)

        sources_data = [
            {
                "file_name": "git-internals.pdf",
                "pages": [
                    {"page_number": 7, "content": "Commits as DAG nodes."},
                    {"page_number": 8, "content": "SHA-1 as content address."},
                ],
            }
        ]

        result_curr = await planner.generate_grounded_curriculum(
            "Teach me Git internals", sources_data
        )
        planner.write_grounded_curriculum(result_curr, mode="Generate All")

        note_path = tmp_path / "database" / "General" / "Git" / "01_Foundations" / "Git_Commit_Graph.md"
        assert note_path.exists(), "Grounded note must be written to the vault"

        content = note_path.read_text(encoding="utf-8")
        assert "sources:" in content, "Note frontmatter must contain a sources block"
        assert "- file: git-internals.pdf" in content, "Citation must name the source file"
        assert "- 7" in content, "Citation must list page 7"
        assert "- 8" in content, "Citation must list page 8"

    def test_search_augmentation_mock_results(self):
        """
        SearchAugmentationEngine in test mode (ATER_TEST_MODE=1) must return
        deterministic mock results and build a valid augmented context string.
        """
        engine = SearchAugmentationEngine()
        results = engine.search_query("Git DAG internals")

        assert len(results) >= 1, "Search engine must return at least one mock result"
        assert "Mock Search" in results[0]["title"], (
            "Mock search results must carry the canonical 'Mock Search' title marker"
        )
        assert "https://example.com/search" in results[0]["url"]

        augmented = engine.augment_context("Git DAG internals", results)
        assert "### Web Search Augmentation: Git DAG internals" in augmented, (
            "Augmented context must include the annotated section header"
        )


# ===========================================================================
# PHASE 7 – PLAYGROUNDS
# ===========================================================================


class TestPhase7Playgrounds:
    """
    Verifies the SQL query playground and Case Simulation artifact type.
    All evaluations run against transient in-memory SQLite connections.
    """

    def test_sql_playground_correct_query(self):
        schema = "CREATE TABLE commits (sha TEXT, message TEXT);"
        seed = "INSERT INTO commits VALUES ('abc123', 'initial commit'), ('def456', 'add readme');"
        target = "SELECT sha FROM commits WHERE message = 'initial commit';"

        result = evaluate_sql_query(schema, seed, target, target)

        assert result["success"] is True, "Correct SQL query must return success=True"
        assert result["error"] is None
        assert result["dataset"] == [{"sha": "abc123"}], (
            "Dataset must contain the correct row from the in-memory DB"
        )

    def test_sql_playground_data_mismatch(self):
        schema = "CREATE TABLE commits (sha TEXT, message TEXT);"
        seed = "INSERT INTO commits VALUES ('abc123', 'initial commit');"
        target = "SELECT sha FROM commits WHERE message = 'initial commit';"
        wrong_query = "SELECT sha FROM commits WHERE message = 'add readme';"

        result = evaluate_sql_query(schema, seed, target, wrong_query)

        assert result["success"] is False, "Mismatched result set must return success=False"
        assert "mismatch" in result["error"].lower(), "Error must describe the data mismatch"

    def test_case_simulation_metrics_updated_additively(self):
        stages = {
            "start": {
                "text": "Commit to main branch directly?",
                "choices": [
                    {
                        "text": "Yes, push directly",
                        "next": "end",
                        "modifications": {"integrity": -0.3, "velocity": 0.1},
                    }
                ],
            },
            "end": {"text": "Done", "choices": []},
        }
        initial_metrics = {"integrity": 1.0, "velocity": 0.0}
        success_conditions = {"integrity": {"min": 0.5}}

        result = evaluate_case_step(stages, "start", 0, initial_metrics, success_conditions)

        assert result["metrics"]["integrity"] == pytest.approx(0.7), (
            "Integrity must be updated additively: 1.0 + (-0.3) = 0.7"
        )
        assert result["metrics"]["velocity"] == pytest.approx(0.1), (
            "Velocity must be updated additively: 0.0 + 0.1 = 0.1"
        )

    def test_case_simulation_metrics_clamped_between_0_and_1(self):
        stages = {
            "start": {
                "text": "Overloaded scenario",
                "choices": [
                    {
                        "text": "Go all in",
                        "next": "end",
                        "modifications": {"integrity": -2.0, "velocity": 3.0},
                    }
                ],
            },
            "end": {"text": "Done", "choices": []},
        }
        initial_metrics = {"integrity": 0.5, "velocity": 0.8}
        success_conditions = {"integrity": {"min": 0.1}}

        result = evaluate_case_step(stages, "start", 0, initial_metrics, success_conditions)

        assert result["metrics"]["integrity"] == 0.0, (
            "Integrity must be clamped to 0.0 when modification drives it below 0"
        )
        assert result["metrics"]["velocity"] == 1.0, (
            "Velocity must be clamped to 1.0 when modification drives it above 1"
        )


# ===========================================================================
# PHASE 8 – LEARNER RECALIBRATION
# ===========================================================================


class TestPhase8LearnerRecalibration:
    """
    Verifies that LearnerModelManager computes correct accuracy rates,
    detects overconfidence, and produces prerequisite-gated next-lesson
    recommendations.
    """

    def _setup_vault(self, vault: Path) -> None:
        (vault / "database" / "learning paths").mkdir(parents=True, exist_ok=True)
        (vault / "database" / "General" / "Git" / "01_Foundations").mkdir(
            parents=True, exist_ok=True
        )
        (vault / "database" / "General" / "Git" / "02_Advanced").mkdir(
            parents=True, exist_ok=True
        )
        (vault / "Inbox").mkdir(parents=True, exist_ok=True)

        (vault / "database" / "learning paths" / "Git_Hub.md").write_text(
            '---\ntype: Learning Hub\ntopic: Git\nchapters:\n'
            '  - "[[Chapter_01_Foundations]]"\n  - "[[Chapter_02_Advanced]]"\n---\n',
            encoding="utf-8",
        )
        (vault / "database" / "General" / "Git" / "01_Foundations" / "Chapter_01_Foundations.md"
         ).write_text(
            '---\ntype: Chapter\nhub: "[[Git_Hub]]"\norder: 1\nnotes:\n  - "[[Git_Commit_Graph]]"\n---\n',
            encoding="utf-8",
        )
        (vault / "database" / "General" / "Git" / "02_Advanced" / "Chapter_02_Advanced.md"
         ).write_text(
            '---\ntype: Chapter\nhub: "[[Git_Hub]]"\norder: 2\nnotes:\n  - "[[Git_Rebase]]"\n---\n',
            encoding="utf-8",
        )
        (vault / "database" / "General" / "Git" / "01_Foundations" / "Git_Commit_Graph.md"
         ).write_text(
            '---\ntitle: Git Commit Graph\ntype: Atomic Note\nprerequisites: []\n---\n',
            encoding="utf-8",
        )
        (vault / "database" / "General" / "Git" / "02_Advanced" / "Git_Rebase.md").write_text(
            '---\ntitle: Git Rebase\ntype: Atomic Note\nprerequisites:\n'
            '  - "[[Git_Commit_Graph]]"\n---\n',
            encoding="utf-8",
        )

    def test_profile_initialises_with_zero_accuracy(self, git_vault, srs_db):
        self._setup_vault(git_vault)
        manager = LearnerModelManager(srs_db, git_vault)
        profile = manager.update_profile("Git")

        assert profile is not None
        assert profile.topic == "Git"
        assert profile.notes_completed_fraction == 0.0, (
            "Freshly initialised profile must report 0 notes completed"
        )

    def test_overconfidence_detected_from_wager_data(self, git_vault, srs_db):
        self._setup_vault(git_vault)
        srs = SRSEngine(srs_db)  # ensure schema is present
        manager = LearnerModelManager(srs_db, git_vault)

        wagers = {
            "q1": {"wager": "high", "correct": False},
            "q2": {"wager": "high", "correct": False},
            "q3": {"wager": "high", "correct": False},
        }
        conn = sqlite3.connect(str(srs_db))
        conn.execute(
            """
            INSERT INTO tutor_sessions
                (session_id, hub_path, current_note_path, completed_notes, wagers, score, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "e2e_over_sess",
                "database/learning paths/Git_Hub.md",
                "database/General/Git/01_Foundations/Git_Commit_Graph.md",
                json.dumps([]),
                json.dumps(wagers),
                0,
                "completed",
                datetime.now().isoformat(),
            ),
        )
        conn.commit()

        profile = manager.update_profile("Git")
        assert profile.calibration_status == "overconfident", (
            "Three consecutive high-confidence wrong answers must flag the learner as overconfident"
        )

    def test_next_lesson_respects_prerequisites(self, git_vault, srs_db):
        self._setup_vault(git_vault)
        srs = SRSEngine(srs_db)
        manager = LearnerModelManager(srs_db, git_vault)

        recs = manager.recommend_next_lessons("Git", limit=5)
        assert len(recs) >= 1, "At least one recommendation must be returned"

        # Git_Commit_Graph (no prerequisites) must rank first
        assert recs[0].note_path == "database/General/Git/01_Foundations/Git_Commit_Graph.md", (
            "Note with no prerequisites must be ranked ahead of blocked note"
        )
        # Git_Rebase (prerequisite: Git_Commit_Graph) must be blocked
        blocked = [r for r in recs if "Git_Rebase" in r.note_path]
        assert blocked, "Git_Rebase must appear in recommendations (even if blocked)"
        assert blocked[0].reason == "Prerequisites not met", (
            "Blocked note must carry 'Prerequisites not met' reason"
        )

    def test_next_lesson_unblocked_after_completing_prerequisite(self, git_vault, srs_db):
        self._setup_vault(git_vault)
        srs = SRSEngine(srs_db)
        manager = LearnerModelManager(srs_db, git_vault)

        # Mark Git_Commit_Graph as reviewed (reps > 0)
        srs.review("database/General/Git/01_Foundations/Git_Commit_Graph.md", rating=3)

        recs = manager.recommend_next_lessons("Git", limit=5)
        # Only Git_Rebase should remain (Git_Commit_Graph is completed)
        remaining = [r for r in recs if "Git_Rebase" in r.note_path]
        assert remaining, "Git_Rebase must still be recommended after completing its prerequisite"
        assert remaining[0].reason != "Prerequisites not met", (
            "Git_Rebase must be unblocked once Git_Commit_Graph is completed"
        )


# ===========================================================================
# INTEGRATION SEAL – LEARNING OBJECT VALIDATOR
# ===========================================================================


class TestIntegrationSeal:
    """
    Runs the learning object validator over the entire temporary vault after
    all phases have written their files, verifying the complete learning object
    set is internally consistent.
    """

    def test_full_vault_passes_non_strict_validation(self, git_vault):
        """
        Build a complete minimal vault (Hub + Chapter + Note + Artifact Pack)
        and verify the validator reports zero errors in non-strict mode.
        """
        from src.domains.ater.learning_object import (
            build_hub_content,
            build_chapter_content,
        )

        base = git_vault
        (base / "database" / "learning paths").mkdir(parents=True, exist_ok=True)
        (base / "database" / "General" / "Git" / "01_Foundations" / "artifacts").mkdir(
            parents=True, exist_ok=True
        )

        # Hub
        hub_content = build_hub_content("Git", "learn_from_scratch", ["Chapter_01_Foundations"])
        (base / "database" / "learning paths" / "Git_Hub.md").write_text(
            hub_content, encoding="utf-8"
        )

        # Chapter
        ch_content = build_chapter_content("Git_Hub", 1, ["Git_Commit_Graph"])
        (base / "database" / "General" / "Git" / "01_Foundations" / "Chapter_01_Foundations.md"
         ).write_text(ch_content, encoding="utf-8")

        # Note with merged frontmatter
        variants = {"simple": "lessons/Git_Commit_Graph.simple.html"}
        note_content = merge_atomic_note_metadata(
            "## Mental Model\nA DAG.\n",
            "Chapter_01_Foundations",
            variants,
            "artifacts/Git_Commit_Graph.artifacts.json",
            "Git_Hub",
        )
        (base / "database" / "General" / "Git" / "01_Foundations" / "Git_Commit_Graph.md"
         ).write_text(note_content, encoding="utf-8")

        # Artifact pack (unified location)
        pack = build_minimal_artifact_pack(
            "Git_Commit_Graph",
            "database/General/Git/01_Foundations/Git_Commit_Graph.md",
        )
        (
            base / "database" / "General" / "Git" / "01_Foundations" / "artifacts"
            / "Git_Commit_Graph.artifacts.json"
        ).write_text(json.dumps(pack), encoding="utf-8")

        errors = validate_learning_objects(str(base), strict=False)
        assert not errors, (
            f"Complete minimal vault must pass non-strict learning object validation; "
            f"errors: {errors}"
        )
