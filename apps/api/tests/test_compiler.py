import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from src.api.main import app
from src.domains.ater.compiler_service import AterLessonCompiler

def test_note_parsing():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        note_file = tmp_path / "Test_Note.md"
        note_content = """---
title: Test Note
course: Computer Science
semester: Winter2026
mode: CS
type: Atomic Note
hub: "[[CS_Hub]]"
chapter: "[[Chapter_01_Basics]]"
---

## Mental Model
Imagine a simple box.

## How It Works
It operates by holding data.

## Key Details
This details the box properties.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "question": "What is the box for?",
    "options": ["Holding data", "Nothing"],
    "answer": "Holding data",
    "explanation": "Holds data."
  }
]
```
"""
        note_file.write_text(note_content, encoding="utf-8")
        
        compiler = AterLessonCompiler(tmpdir)
        parsed, metadata = compiler.parse_note(note_file)
        
        assert metadata["title"] == "Test Note"
        assert metadata["course"] == "Computer Science"
        assert parsed["mental_model"]["content"] == "Imagine a simple box."
        assert parsed["h1"]["title"] == "How It Works"
        assert parsed["h1"]["content"] == "It operates by holding data."
        assert parsed["h2"]["title"] == "Key Details"
        assert parsed["h2"]["content"] == "This details the box properties."
        assert "Question 1" in parsed["proving_grounds"]["content"] or "interactive-quiz" in parsed["proving_grounds"]["content"]

def test_note_parsing_fallback():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        note_file = tmp_path / "Malformed_Note.md"
        note_content = """---
title: Malformed Note
---
## Mental Model
Only mental model here.
"""
        note_file.write_text(note_content, encoding="utf-8")
        
        compiler = AterLessonCompiler(tmpdir)
        parsed, metadata = compiler.parse_note(note_file)
        
        assert parsed["mental_model"]["content"] == "Only mental model here."
        # Fallbacks check
        assert parsed["h1"]["title"] == "Core Mechanism"
        assert parsed["h1"]["content"] == ""
        assert parsed["h2"]["title"] == "Key Details"
        assert parsed["h2"]["content"] == ""

def test_navigation_resolver():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        
        # Create directories
        (tmp_path / "database" / "learning paths").mkdir(parents=True)
        (tmp_path / "database" / "General" / "CS" / "01_Basics").mkdir(parents=True)
        
        # 1. Create Hub
        (tmp_path / "database" / "learning paths" / "CS_Hub.md").write_text("""---
type: Learning Hub
topic: CS
---
""", encoding="utf-8")
        
        # 2. Create Chapter
        (tmp_path / "database" / "General" / "CS" / "01_Basics" / "Chapter_01_Basics.md").write_text("""---
type: Chapter
atomic_notes:
  - Prev_Note
  - Test_Note
  - Next_Note
---
""", encoding="utf-8")
        
        # 3. Create Note
        note_file = tmp_path / "database" / "General" / "CS" / "01_Basics" / "Test_Note.md"
        note_file.write_text("""---
title: Test_Note
hub: "[[CS_Hub]]"
chapter: "[[Chapter_01_Basics]]"
---
## Mental Model
Content.
""", encoding="utf-8")
        
        compiler = AterLessonCompiler(tmpdir)
        parsed, metadata = compiler.parse_note(note_file)
        nav = compiler.resolve_navigation(note_file, metadata)
        
        assert nav["hub_title"] == "CS_Hub"
        assert nav["chapter_title"] == "Chapter_01_Basics"
        assert nav["prev_note_title"] == "Prev_Note"
        assert nav["prev_note_path"] == "./Prev_Note"
        assert nav["next_note_title"] == "Next_Note"
        assert nav["next_note_path"] == "./Next_Note"
        assert nav["lesson_index"] == 2
        assert nav["lesson_total"] == 3

def test_html_variants():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        note_file = tmp_path / "Test_Note.md"
        note_content = """---
title: Test Note
hub: "[[CS_Hub]]"
chapter: "[[Chapter_01_Basics]]"
---
## Mental Model
Imagine a simple box.

## How It Works
It operates by holding data.

## Key Details
This details the box properties.

## The Proving Grounds
```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "What is the box for?",
    "options": {"A": "Holding data", "B": "Nothing"},
    "answer": "A",
    "explanation": "Holds data."
  }
]
```
"""
        note_file.write_text(note_content, encoding="utf-8")
        
        compiler = AterLessonCompiler(tmpdir)
        
        # Deep Variant
        html_deep = compiler.compile_to_html(note_file, "deep")
        assert "Imagine a simple box." in html_deep
        assert "It operates by holding data." in html_deep
        assert "This details the box properties." in html_deep
        assert '<script type="text/markdown" id="raw-markdown-source">' in html_deep
        
        # Simple Variant
        html_simple = compiler.compile_to_html(note_file, "simple")
        assert "Imagine a simple box." in html_simple
        assert "<h2>How It Works</h2>" in html_simple
        assert "<h2>Key Details</h2>" in html_simple
        assert "Key Definitions" not in html_simple
        assert "prefers-color-scheme: light" not in html_simple
        assert "--bg: #fafafa" in html_simple
        assert "--bg: #111113" in html_simple
        assert ":root.light" in html_simple
        assert ":root.dark" in html_simple
        
        # Cram Variant
        html_cram = compiler.compile_to_html(note_file, "cram")
        assert "Cram Sheet:" in html_cram
        assert "Imagine a simple box." in html_cram
        
        # Exam Variant
        html_exam = compiler.compile_to_html(note_file, "exam")
        assert "The Proving Grounds" in html_exam
        # The main content cards should NOT be visible in exam mode (only the quiz page/container is active)
        assert 'class="page-container active"' in html_exam
        
        # Compile and save
        out_path = compiler.compile_lesson(note_file, "deep")
        assert out_path.exists()
        assert out_path.name == "Test_Note.deep.html"

def test_compile_endpoint():
    client = TestClient(app)
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        note_file = tmp_path / "Endpoint_Note.md"
        note_file.write_text("""---
title: Endpoint Note
---
## Mental Model
Box mental model.
""", encoding="utf-8")
        
        # Run compile via API
        response = client.post(
            "/api/ater/lesson/compile",
            json={
                "note_path": str(note_file.relative_to(tmp_path)),
                "variant": "deep"
            },
                headers={"X-Vault-Path": tmpdir, "X-Ater-Token": "test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "output_path" in data
        assert (tmp_path / data["output_path"]).exists()
