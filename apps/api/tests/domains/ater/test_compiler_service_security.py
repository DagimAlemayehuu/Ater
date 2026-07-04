import pytest
from pathlib import Path
from src.domains.ater.compiler_service import AterLessonCompiler

def test_compiler_service_path_traversal_note_path(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    
    compiler = AterLessonCompiler(str(vault))
    
    # Escape path
    escape_path = "../escape.md"
    
    with pytest.raises(ValueError):
        compiler.compile_lesson(escape_path, "default")

def test_compiler_service_path_traversal_absolute_escape(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    
    compiler = AterLessonCompiler(str(vault))
    
    # Absolute escape path
    escape_path = "/tmp/escape.md"
    
    with pytest.raises(ValueError):
        compiler.compile_lesson(escape_path, "default")

def test_compiler_service_valid_path(tmp_path):
    vault = tmp_path / "vault"
    vault.mkdir()
    
    note = vault / "my_note.md"
    note.write_text("---\ntitle: test\n---\n# hello", encoding="utf-8")
    
    compiler = AterLessonCompiler(str(vault))
    
    # Valid note
    out = compiler.compile_lesson(note, "default")
    
    # Check it wrote to the right place
    assert out.parent == vault / "lessons"
    assert "My_Note" in out.name

