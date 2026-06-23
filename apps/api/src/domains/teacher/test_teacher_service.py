from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest
from src.domains.teacher.service import TeacherService


@pytest.mark.asyncio
async def test_teacher_service_creates_lesson_workspace_and_html(tmp_path: Path):
    service = TeacherService(tmp_path)

    # Step 1: Initial request should generate roadmap
    events = []
    async for event in service.chat(
        history=[{"role": "user", "content": "Teach me binary search for coding interviews"}],
        secrets=None,
    ):
        events.append(event)

    # Assert that roadmap was sent and no files created yet
    assert len(events) == 2
    assert events[0]["type"] == "status"
    assert events[1]["type"] == "chunk"
    assert "Roadmap" in events[1]["content"] or "mermaid" in events[1]["content"].lower()

    # Step 2: Confirm roadmap to start lesson
    lesson_events = []
    async for event in service.chat(
        history=[
            {"role": "user", "content": "Teach me binary search for coding interviews"},
            {"role": "assistant", "content": "Proposed roadmap: ```mermaid\ngraph TD\nA --> B\n```"},
            {"role": "user", "content": "confirm"},
        ],
        secrets=None,
    ):
        lesson_events.append(event)

    workspace = tmp_path / "Lessons" / "binary-search-for-coding-interviews"
    lesson = workspace / "lessons" / "0001-binary-search-for-coding-interviews.html"
    lesson_md = workspace / "lessons" / "0001-binary-search-for-coding-interviews.md"

    assert (workspace / "MISSION.md").exists()
    assert (workspace / "RESOURCES.md").exists()
    assert (workspace / "NOTES.md").exists()
    assert (workspace / "reference").is_dir()
    assert (workspace / "learning-records").is_dir()
    assert lesson.exists()
    assert lesson_md.exists()

    lesson_html = lesson.read_text(encoding="utf-8")
    assert "Binary Search For Coding Interviews" in lesson_html
    assert len(lesson_html) > 12000
    assert "<style>" in lesson_html
    assert "class=\"lesson-shell\"" in lesson_html
    assert "retrieval" in lesson_html.lower()

    lesson_md_content = lesson_md.read_text(encoding="utf-8")
    assert "title: Binary Search For Coding Interviews" in lesson_md_content
    assert "## Mental Model" in lesson_md_content
    assert "## The Proving Grounds" in lesson_md_content

    assert any(event["type"] == "lesson_created" for event in lesson_events)
    created = next(event for event in lesson_events if event["type"] == "lesson_created")
    assert created["workspace"] == "binary-search-for-coding-interviews"
    assert created["lesson_path"].endswith("0001-binary-search-for-coding-interviews.html")


@pytest.mark.asyncio
async def test_teacher_service_batch_generation(tmp_path: Path):
    service = TeacherService(tmp_path)

    # Mock the LLM roadmap extraction to return a list of 2 sections
    with patch.object(service, "_extract_roadmap_sections", new_callable=AsyncMock) as mock_extract:
        mock_extract.return_value = ["Basic Concepts", "Advanced Algorithms"]

        lesson_events = []
        async for event in service.chat(
            history=[
                {"role": "user", "content": "Teach me dynamic programming"},
                {"role": "assistant", "content": "Proposed roadmap: ```mermaid\ngraph TD\nA --> B\n```"},
                {"role": "user", "content": "confirm"},
            ],
            secrets=None,
        ):
            lesson_events.append(event)

        workspace = tmp_path / "Lessons" / "dynamic-programming"
        
        # Verify both section files exist
        lesson1 = workspace / "lessons" / "0001-basic-concepts.html"
        lesson1_md = workspace / "lessons" / "0001-basic-concepts.md"
        lesson2 = workspace / "lessons" / "0002-advanced-algorithms.html"
        lesson2_md = workspace / "lessons" / "0002-advanced-algorithms.md"

        assert lesson1.exists()
        assert lesson1_md.exists()
        assert lesson2.exists()
        assert lesson2_md.exists()

        assert any(event["type"] == "lesson_created" for event in lesson_events)
        created = next(event for event in lesson_events if event["type"] == "lesson_created")
        assert created["title"] == "Basic Concepts"
        assert created["workspace"] == "dynamic-programming"
        assert created["lesson_path"].endswith("0001-basic-concepts.html")


@pytest.mark.asyncio
async def test_teacher_service_generates_full_fallback_curriculum_with_atomic_notes(tmp_path: Path):
    service = TeacherService(tmp_path)

    lesson_events = []
    async for event in service.chat(
        history=[
            {"role": "user", "content": "Teach me git"},
            {"role": "assistant", "content": "Proposed roadmap: ```mermaid\ngraph TD\nA --> B\n```"},
            {"role": "user", "content": "confirm"},
        ],
        secrets=None,
    ):
        lesson_events.append(event)

    lessons_dir = tmp_path / "Lessons" / "git" / "lessons"
    markdown_lessons = sorted(lessons_dir.glob("*.md"))
    html_lessons = sorted(lessons_dir.glob("*.html"))

    assert len(markdown_lessons) >= 8
    assert len(html_lessons) == len(markdown_lessons)

    first_md = markdown_lessons[0].read_text(encoding="utf-8")
    first_html = html_lessons[0].read_text(encoding="utf-8")

    assert "type: Atomic Note" in first_md
    assert "## Mental Model" in first_md
    assert "## How It Works" in first_md
    assert "## Formal Model" in first_md
    assert "## The Proving Grounds" in first_md
    assert "```interactive-quiz" in first_md

    assert "data-markdown-source" in first_html
    assert "## Mental Model" in first_html
    assert "How It Works" in first_html
    assert "The Proving Grounds" in first_html
    assert "This chapter is stored as a real Ater atomic note" not in first_html
    assert "window.parent.postMessage({ type: 'NEXT_NOTE' }, '*')" in first_html
    assert "class=\"lesson-shell\"" in first_html
    assert "class=\"page-container active\"" in first_html

    summary = next(event for event in lesson_events if event["type"] == "chunk")["content"]
    assert "All " in summary
    assert "atomic notes" in summary.lower()
