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
