import pytest
import re
from pathlib import Path
from src.api.deps import AppSecrets
from src.domains.ater.assistant import (
    to_underscore_title_case,
    sanitize_note_content,
    AterAssistant
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
    import json
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
