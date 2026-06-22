from pathlib import Path

import pytest

from src.domains.teacher.service import TeacherService


@pytest.mark.asyncio
async def test_teacher_service_creates_lesson_workspace_and_html(tmp_path: Path):
    service = TeacherService(tmp_path)

    events = []
    async for event in service.chat(
        history=[{"role": "user", "content": "Teach me binary search for coding interviews"}],
        secrets=None,
    ):
        events.append(event)

    workspace = tmp_path / "Lessons" / "binary-search-for-coding-interviews"
    lesson = workspace / "lessons" / "0001-binary-search-for-coding-interviews.html"

    assert (workspace / "MISSION.md").exists()
    assert (workspace / "RESOURCES.md").exists()
    assert (workspace / "NOTES.md").exists()
    assert (workspace / "reference").is_dir()
    assert (workspace / "learning-records").is_dir()
    assert lesson.exists()
    lesson_html = lesson.read_text(encoding="utf-8")
    assert "Binary Search For Coding Interviews" in lesson_html
    assert len(lesson_html) > 12000
    assert "<style>" in lesson_html
    assert "class=\"lesson-shell\"" in lesson_html
    assert "retrieval" in lesson_html.lower()
    assert any(event["type"] == "lesson_created" for event in events)
    created = next(event for event in events if event["type"] == "lesson_created")
    assert created["workspace"] == "binary-search-for-coding-interviews"
    assert created["lesson_path"].endswith("0001-binary-search-for-coding-interviews.html")
