import pytest
from src.api.deps import AppSecrets
from src.domains.ater.assistant import (
    to_underscore_title_case,
    sanitize_note_content,
    AterAssistant,
    _convert_to_lesson_json,
    _stream_learning_runtime_lesson,
)

def test_underscore_title_case():
    assert to_underscore_title_case("distributed systems") == "Distributed_Systems"
    assert to_underscore_title_case("Distributed-Systems") == "Distributed_Systems"
    assert to_underscore_title_case("  intro  to  CS  ") == "Intro_To_Cs"

def test_sanitize_note_content():
    content = """---
course: [[Distributed Systems]]
semester: "Autumn 2026"
hub: [[My Hub]]
---
## Heading
Prose here.
---
## Another Heading
```python
print("hello")
```
"""
    sanitized = sanitize_note_content(content)
    # 1. Course is plain text (no brackets)
    assert "course: Distributed Systems" in sanitized
    # 2. hub has double quotes and is underscore title case
    assert 'hub: "[[My_Hub]]"' in sanitized
    # 3. Setext Defense: double newlines before horizontal rule
    assert "\n\n---" in sanitized


def test_lesson_conversion_targets_interactive_artifact_protocol():
    response = """LESSON: SOLVING A RUBIK'S CUBE

CHAPTER 1: NOTATION & ORIENTATION

Learn the face letters and how clockwise turns are named.

CHAPTER 2: WHITE CROSS

Build the first cross and align each edge with its center.
"""

    converted = _convert_to_lesson_json(response, "teach me how to solve a rubics cube")

    assert "```interactive-lesson" not in converted
    assert '<artifact title="Rubik\'s Cube Beginner Method">' in converted
    assert '<chapter title="Step 1: Notation, Pieces, And Orientation">' in converted
    assert "<sandbox-spec>" in converted
    assert "interactive Rubik" in converted


def test_rubiks_lesson_conversion_uses_canonical_detailed_beginner_method():
    weak_response = """STEP 1: NOTATION & ORIENTATION

The Rubik's Cube has faces.

Please confirm you'd like to open an interactive Rubik's Cube solver.
"""

    converted = _convert_to_lesson_json(weak_response, "teach me how to solve a rubics cube in detail")

    assert "Please confirm" not in converted
    assert "White Daisy" in converted
    assert "Right trigger" in converted
    assert "R U R' U'" in converted
    assert converted.count("<chapter ") >= 8


@pytest.mark.asyncio
async def test_teach_anything_stream_uses_learning_runtime_not_legacy_teacher(tmp_path, monkeypatch):
    from unittest.mock import MagicMock
    from src.domains.ater.planner import AterPlanner
    from src.domains.ater.vault_manager import VaultManager
    import src.domains.ater.assistant as assistant_module

    secrets = AppSecrets(
        ai_provider="google",
        ai_key="mock-key",
        ai_model="gemini-2.0-flash",
        vault_path=str(tmp_path),
        inbox_path=str(tmp_path / "Inbox"),
        academic_path="Notes"
    )

    class FakePlanner:
        async def generate_curriculum(self, prompt, existing_chapters=None, learning_mode="learn_from_scratch"):
            return {
                "topic": "Git",
                "learning_mode": learning_mode,
                "chapters": [
                    {
                        "title": "Foundations",
                        "order": 1,
                        "atomic_notes": ["Git Commit Graph"],
                    }
                ],
            }

        def write_curriculum(self, curriculum, mode):
            return AterPlanner(secrets, llm=MagicMock()).write_curriculum(curriculum, mode=mode)

    class FakeService:
        def __init__(self, _secrets):
            self.planner = FakePlanner()
            self.vm = VaultManager(_secrets.vault_path)

    monkeypatch.setattr(assistant_module, "AterService", FakeService)

    events = []
    async for event in _stream_learning_runtime_lesson(
        messages_history=[{"role": "user", "content": "Teach me Git"}],
        topic="Git",
        secrets=secrets,
    ):
        events.append(event)

    lesson_event = next(event for event in events if event["type"] == "lesson_created")
    assert "/api/teacher" not in lesson_event["preview_url"]
    assert lesson_event["preview_url"].startswith("/api/ater/lesson/preview/")
    assert lesson_event["lesson_path"].endswith("Git_Commit_Graph.simple.html")
    assert (tmp_path / "database" / "learning paths" / "Git_Hub.md").exists()
    assert (tmp_path / lesson_event["lesson_path"]).exists()

def test_assistant_record_management(tmp_path):
    secrets = AppSecrets(
        ai_provider="google",
        ai_key="mock-key",
        ai_model="gemini-2.0-flash",
        vault_path=str(tmp_path),
        inbox_path=str(tmp_path / "Inbox"),
        academic_path="Notes"
    )
    
    # Initialize folders
    (tmp_path / "database" / "courses").mkdir(parents=True, exist_ok=True)
    
    assistant = AterAssistant(secrets)
    
    # 1. Create course
    res = assistant.create_academic_record("courses", "Distributed Systems", {"semester": "Autumn 2026"})
    assert "Created courses 'Distributed Systems'." in res
    
    course_file = tmp_path / "database" / "courses" / "Distributed_Systems.md"
    assert course_file.exists()
    
    # Verify notes listing helper works
    notes = assistant.get_all_vault_notes()
    assert len(notes) == 1
    assert notes[0]["title"] == "Distributed_Systems"
    assert notes[0]["path"] == "database/courses/Distributed_Systems.md"
    
    content = course_file.read_text(encoding="utf-8")
    assert "type: course" in content
    assert "title: Distributed_Systems" in content
    assert "semester: Autumn 2026" in content
    
    # 2. Update course
    res2 = assistant.update_academic_record("courses", "Distributed Systems", {"difficulty": "Hard"})
    assert "Updated courses 'Distributed Systems'." in res2
    
    content2 = course_file.read_text(encoding="utf-8")
    assert "difficulty: Hard" in content2
    
    # 3. Delete course
    res3 = assistant.delete_academic_record("courses", "Distributed Systems")
    assert "Deleted courses 'Distributed Systems'." in res3
    assert not course_file.exists()


@pytest.mark.asyncio
async def test_assistant_custom_practice_and_exams(tmp_path):
    from unittest.mock import AsyncMock, patch
    
    secrets = AppSecrets(
        ai_provider="google",
        ai_key="mock-key",
        ai_model="gemini-2.0-flash",
        vault_path=str(tmp_path),
        inbox_path=str(tmp_path / "Inbox"),
        academic_path="Notes"
    )
    
    # Initialize folders
    (tmp_path / "Inbox").mkdir(parents=True, exist_ok=True)
    
    assistant = AterAssistant(secrets)
    
    mock_questions = {
        "questions": [
            {
                "id": "q1",
                "type": "mcq",
                "difficulty": "L1",
                "question": "What is 2+2?",
                "options": {"A": "3", "B": "4", "C": "5", "D": "6"},
                "answer": "B",
                "explanation": "2+2 equals 4.",
                "note_path": "database/courses/Math.md"
            }
        ],
        "quiz_path": "Notes/Practice/Practice_Mock.md"
    }
    
    with patch("src.domains.ater.service.AterService.generate_practice", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_questions
        
        # 1. Test generate_custom_practice
        res = await assistant.generate_custom_practice(
            hub_id="Math_Hub",
            difficulty="Mixed",
            preset="exam_sim",
            question_distribution='{"mcq": 1}'
        )
        assert "Custom Practice Session on **Math Hub**" in res
        assert "```interactive-quiz" in res
        assert "What is 2+2?" in res
        
        # 2. Test create_exam
        exam_res = await assistant.create_exam(
            hub_ids=["Math_Hub"],
            total_questions=1,
            difficulty="Mixed",
            question_types={"mcq": 1}
        )
        assert "Secure Exam Session:" in exam_res
        assert "What is 2+2?" in exam_res
        assert "2+2 equals 4." not in exam_res  # answer/explanation is secure and hidden
        
        # Extract exam_id from markdown response
        import re
        match = re.search(r"Secure Exam Session: `(exam_[a-f0-9]+)`", exam_res)
        assert match is not None
        exam_id = match.group(1)
        
        # 3. Test grade_exam
        grade_res = assistant.grade_exam(
            exam_id=exam_id,
            student_answers={"eq_1": "B"}
        )
        assert "Exam Grading Report:" in grade_res
        assert "**Score:** 1 / 1" in grade_res
        assert "✅ Correct" in grade_res


@pytest.mark.asyncio
async def test_run_assistant_chat_scoping(tmp_path):
    from src.domains.ater.assistant import run_assistant_chat
    from unittest.mock import patch, MagicMock

    secrets = AppSecrets(
        ai_provider="google",
        ai_key="mock-key",
        ai_model="gemini-2.0-flash",
        vault_path=str(tmp_path),
        inbox_path=str(tmp_path / "Inbox"),
        academic_path="Notes"
    )

    user_context = {
        "display_name": "Alice",
        "active_hub": "distributed-systems",
        "pomodoro": {
            "is_active": True,
            "time_left": 1500,
            "mode": "focus",
            "session_count": 2
        }
    }

    mock_model = MagicMock()
    mock_llm_with_tools = MagicMock()

    async def mock_astream(*args, **kwargs):
        chunk = MagicMock()
        chunk.content = "Hello there!"
        chunk.tool_call_chunks = []
        yield chunk

    mock_llm_with_tools.astream = mock_astream
    mock_model.bind_tools.return_value = mock_llm_with_tools

    with patch("src.domains.ai.factory.ModelFactory.get_model", return_value=mock_model), \
         patch("src.domains.ater.assistant.AterAssistant.get_all_vault_notes", return_value=[]), \
         patch("src.domains.ater.assistant.resolve_assistant_oracle_path", return_value=tmp_path / "non_existent_oracle.md"):

        chunks = []
        async for sse_event in run_assistant_chat(
            secrets=secrets,
            messages_history=[],
            rag_context=None,
            user_context=user_context
        ):
            chunks.append(sse_event)

        assert len(chunks) > 0
        assert any("Hello there!" in chunk for chunk in chunks)


@pytest.mark.asyncio
async def test_validate_feynman_missing_note(tmp_path):
    secrets = AppSecrets(
        ai_provider="google",
        ai_key="mock-key",
        ai_model="gemini-2.0-flash",
        vault_path=str(tmp_path),
        inbox_path=str(tmp_path / "Inbox"),
        academic_path="Notes"
    )

    db_path = tmp_path / "Inbox" / "ater_queue.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    import sqlite3
    conn = sqlite3.connect(str(db_path))
    conn.execute("CREATE TABLE IF NOT EXISTS srs_cards (note_path TEXT PRIMARY KEY)")
    conn.close()

    assistant = AterAssistant(secrets)

    res = await assistant.validate_feynman_explanation("database/courses/NonExistent.md", "This is an explanation.")
    assert "ACTION:" in res
    import json
    payload = json.loads(res.replace("ACTION:", ""))
    assert payload["action"] == "feynman_validated"
    assert payload["is_valid"] is False
    assert "Note file not found" in payload["feedback"]


def test_navigate_to_note_routing(tmp_path):
    secrets = AppSecrets(
        ai_provider="google",
        ai_key="mock-key",
        ai_model="gemini-2.0-flash",
        vault_path=str(tmp_path),
        inbox_path=str(tmp_path / "Inbox"),
        academic_path="Notes"
    )

    assistant = AterAssistant(secrets)
    import json

    # 1. Course redirection check
    res_course = assistant.navigate_to_note("database/courses/Distributed_Systems.md")
    assert "ACTION:" in res_course
    payload_course = json.loads(res_course.replace("ACTION:", ""))
    assert payload_course["action"] == "navigate"
    assert payload_course["route"] == "/academic?tab=COURSES&id=Distributed_Systems"

    # 2. Semester redirection check
    res_semester = assistant.navigate_to_note("database/semesters/Autumn_2026.md")
    payload_semester = json.loads(res_semester.replace("ACTION:", ""))
    assert payload_semester["route"] == "/academic?tab=PROGRAM&id=Autumn_2026"

    # 3. Exam redirection check
    res_exam = assistant.navigate_to_note("database/exams/Midterm.md")
    payload_exam = json.loads(res_exam.replace("ACTION:", ""))
    assert payload_exam["route"] == "/academic?tab=EXAMS&id=Midterm"

    # 4. Practice redirection check
    res_practice = assistant.navigate_to_note("practice")
    payload_practice = json.loads(res_practice.replace("ACTION:", ""))
    assert payload_practice["route"] == "/academic?tab=PRACTICE&id=practice"

    # 5. Regular note should still open in Obsidian view
    res_regular = assistant.navigate_to_note("Notes/General_Note.md")
    payload_regular = json.loads(res_regular.replace("ACTION:", ""))
    assert "/obsidian?path=" in payload_regular["route"]


def test_get_vault_stats_filtering(tmp_path):
    secrets = AppSecrets(
        ai_provider="google",
        ai_key="mock-key",
        ai_model="gemini-2.0-flash",
        vault_path=str(tmp_path),
        inbox_path=str(tmp_path / "Inbox"),
        academic_path="Notes"
    )

    # Setup directories
    (tmp_path / "database" / "courses" / "difficulty").mkdir(parents=True, exist_ok=True)
    (tmp_path / "Notes").mkdir(parents=True, exist_ok=True)

    # Create files
    (tmp_path / "database" / "courses" / "OOP.md").write_text("--- \nstatus: Planned\n ---", encoding="utf-8")
    (tmp_path / "database" / "courses" / "difficulty" / "Hard.md").write_text("Option", encoding="utf-8")
    (tmp_path / "Notes" / "Atomic1.md").write_text("--- \ntype: atomic\n ---", encoding="utf-8")

    assistant = AterAssistant(secrets)

    # 1. Check full stats without category
    stats_ui = assistant.get_vault_stats()
    assert "```ater-ui" in stats_ui
    import json
    content = stats_ui.replace("```ater-ui", "").replace("```", "").strip()
    action_data = json.loads(content)
    assert action_data["ui_type"] == "stats"
    payload = action_data["data"]
    assert payload["courses"] == 1
    assert payload["atomic_notes"] == 1
    assert payload["total_notes"] == 2  # OOP.md + Atomic1.md

    # 2. Check stats with courses category filter
    courses_result = assistant.get_vault_stats(category="courses")
    assert courses_result == "courses: 1"

    # 3. Check stats with atomic_notes category filter
    atomic_result = assistant.get_vault_stats(category="atomic_notes")
    assert atomic_result == "atomic_notes: 1"
