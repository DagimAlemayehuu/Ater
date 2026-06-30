import pytest
from pathlib import Path
from src.api.routers.ater import resolve_note_path

def test_resolve_note_path_empty_note_id(tmp_path):
    assert resolve_note_path("", tmp_path) is None
    assert resolve_note_path(None, tmp_path) is None

def test_resolve_note_path_absolute_inside_vault(tmp_path):
    # Absolute path inside vault
    note_id = str(tmp_path / "folder" / "note.md")
    assert resolve_note_path(note_id, tmp_path) == "folder/note.md"

def test_resolve_note_path_absolute_outside_vault(tmp_path):
    # Absolute path outside vault
    note_id = "/tmp/outside_vault/note.md"
    assert resolve_note_path(note_id, tmp_path) is None

def test_resolve_note_path_relative_exists(tmp_path):
    # Relative path that exists directly
    note_dir = tmp_path / "folder"
    note_dir.mkdir()
    (note_dir / "note.md").touch()

    # We pass relative path
    assert resolve_note_path("folder/note.md", tmp_path) == "folder/note.md"

def test_resolve_note_path_rglob_exact_match(tmp_path):
    # File exists in a subdirectory but we only provide the name
    note_dir = tmp_path / "deep" / "folder"
    note_dir.mkdir(parents=True)
    (note_dir / "my_note.md").touch()

    assert resolve_note_path("my_note.md", tmp_path) == "deep/folder/my_note.md"

def test_resolve_note_path_rglob_stem_replacement(tmp_path):
    # Provided note_id has brackets and spaces
    note_dir = tmp_path / "folder"
    note_dir.mkdir()
    # File in vault is named without brackets and spaces replaced by underscores
    (note_dir / "My_Note_Name.md").touch()

    assert resolve_note_path("[My Note Name].md", tmp_path) == "folder/My_Note_Name.md"

def test_resolve_note_path_rglob_ignored_directories(tmp_path):
    # Create file in ignored directories
    for ignored_dir in [".git", ".ater", ".obsidian", "Practice"]:
        d = tmp_path / ignored_dir
        d.mkdir()
        (d / "ignored_note.md").touch()

    # Also create one in a valid directory
    valid_dir = tmp_path / "valid"
    valid_dir.mkdir()
    (valid_dir / "valid_note.md").touch()

    # Should fallback to note_id for ignored note because it won't be found by rglob logic
    assert resolve_note_path("ignored_note.md", tmp_path) == "ignored_note.md"

    # Should find the valid one
    assert resolve_note_path("valid_note.md", tmp_path) == "valid/valid_note.md"

def test_resolve_note_path_rglob_lower_case_fallback(tmp_path):
    # Provided note_id is in different case than the actual file
    note_dir = tmp_path / "folder"
    note_dir.mkdir()
    (note_dir / "actual_Namo.md").touch()

    assert resolve_note_path("ACTUAL_namo.md", tmp_path) == "folder/actual_Namo.md"

def test_resolve_note_path_not_found(tmp_path):
    # Fallback to returning the note_id when nothing matches
    assert resolve_note_path("not_found_file.md", tmp_path) == "not_found_file.md"
