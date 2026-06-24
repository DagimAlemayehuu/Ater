import tempfile
import json
from pathlib import Path
import pytest
from src.domains.ater.learning_object import (
    normalize_title,
    get_hub_path,
    get_chapter_path,
    get_note_path,
    get_lesson_variant_path,
    get_artifact_pack_path,
    build_hub_content,
    build_chapter_content,
    merge_atomic_note_metadata,
    build_minimal_artifact_pack,
    validate_artifact_pack,
    append_artifact_version,
    read_pinned_artifact_types,
    write_pinned_artifact_types,
    lookup_existing_hub,
    validate_learning_objects
)

def test_title_normalization():
    assert normalize_title("git") == "Git"
    assert normalize_title("git basics") == "Git_Basics"
    assert normalize_title("git_three_state_model") == "Git_Three_State_Model"
    assert normalize_title("git  three   state") == "Git_Three_State"
    assert normalize_title("01 foundations") == "01_Foundations"

def test_route_helpers():
    # self-study hub
    assert get_hub_path("Git") == "database/learning paths/Git_Hub.md"
    # coursework hub
    assert get_hub_path("Git", semester="Spring 2026", course="Data Structures") == "database/study planner/Git_Hub.md"
    
    # chapter path self-study
    assert get_chapter_path("Git", "Foundations", 1) == "database/General/Git/01_Foundations/Chapter_01_Foundations.md"
    # chapter path coursework
    assert get_chapter_path("Git", "Foundations", 1, semester="Spring 2026", course="Data Structures", unit="03 Trees") == \
           "database/Spring_2026/Data_Structures/03_Trees/01_Foundations/Chapter_01_Foundations.md"
           
    # note path self-study
    assert get_note_path("Git", "Foundations", 1, "Git Three State Model") == "database/General/Git/01_Foundations/Git_Three_State_Model.md"
    # note path coursework
    assert get_note_path("Git", "Foundations", 1, "Git Three State Model", semester="Spring 2026", course="Data Structures", unit="03 Trees") == \
           "database/Spring_2026/Data_Structures/03_Trees/01_Foundations/Git_Three_State_Model.md"

def test_lesson_variant_and_artifact_helpers():
    assert get_lesson_variant_path("Git Three State Model", "simple") == "lessons/Git_Three_State_Model.simple.html"
    assert get_lesson_variant_path("Git Three State Model", "deep") == "lessons/Git_Three_State_Model.deep.html"
    assert get_artifact_pack_path("Git Three State Model") == "artifacts/Git_Three_State_Model.artifacts.json"

def test_metadata_builders():
    hub_content = build_hub_content("Git", "learn_from_scratch", ["Chapter_01_Foundations"])
    assert "type: \"Learning Hub\"" in hub_content or "type: Learning Hub" in hub_content
    assert "topic: Git" in hub_content
    assert "learning_mode: learn_from_scratch" in hub_content
    assert "- \"[[Chapter_01_Foundations]]\"" in hub_content
    assert "- [[Chapter_01_Foundations]]" in hub_content
    
    chapter_content = build_chapter_content("Git_Hub", 1, ["Git_Three_State_Model"])
    assert "type: \"Chapter\"" in chapter_content or "type: Chapter" in chapter_content
    assert "hub: \"[[Git_Hub]]\"" in chapter_content
    assert "order: 1" in chapter_content
    assert "- \"[[Git_Three_State_Model]]\"" in chapter_content
    
    existing = "---\ncourse: Data Structures\nsemester: Spring 2026\n---\nSome content here"
    variants = {
        "simple": "lessons/Git_Three_State_Model.simple.html",
        "deep": "lessons/Git_Three_State_Model.deep.html"
    }
    merged = merge_atomic_note_metadata(existing, "Chapter_01_Foundations", variants, "artifacts/Git_Three_State_Model.artifacts.json", "Git_Hub")
    assert "course: Data Structures" in merged
    assert "semester: Spring 2026" in merged
    assert "chapter: \"[[Chapter_01_Foundations]]\"" in merged
    assert "hub: \"[[Git_Hub]]\"" in merged
    assert "artifact_pack: artifacts/Git_Three_State_Model.artifacts.json" in merged or "artifact_pack: \"artifacts/Git_Three_State_Model.artifacts.json\"" in merged
    assert "simple: lessons/Git_Three_State_Model.simple.html" in merged

def test_artifact_pack():
    pack = build_minimal_artifact_pack("Git Three State Model", "database/General/Git/01_Foundations/Git_Three_State_Model.md")
    assert pack["schema_version"] == 1
    assert pack["note_title"] == "Git_Three_State_Model"
    assert pack["active_version"] == 1
    assert len(pack["versions"]) == 1
    
    errors = validate_artifact_pack(pack)
    assert not errors
    
    pack_malformed = pack.copy()
    pack_malformed["active_version"] = 2
    errors2 = validate_artifact_pack(pack_malformed)
    assert len(errors2) > 0
    
    pack = append_artifact_version(pack, 2, active=True)
    assert pack["active_version"] == 2
    assert len(pack["versions"]) == 2
    assert not validate_artifact_pack(pack)
    
    assert read_pinned_artifact_types(pack) == []
    pack = write_pinned_artifact_types(pack, ["quiz"])
    assert read_pinned_artifact_types(pack) == ["quiz"]

def test_integration_vault():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        # Create directories
        (tmp_path / "database" / "learning paths").mkdir(parents=True)
        (tmp_path / "database" / "study planner").mkdir(parents=True)
        (tmp_path / "database" / "General" / "Git" / "01_Foundations").mkdir(parents=True)
        (tmp_path / "artifacts").mkdir(parents=True)
        
        # 1. Create Git_Hub.md
        hub_content = build_hub_content("Git", "learn_from_scratch", ["Chapter_01_Foundations"])
        (tmp_path / "database" / "learning paths" / "Git_Hub.md").write_text(hub_content, encoding="utf-8")
        
        # 2. Create Chapter_01_Foundations.md
        chapter_content = build_chapter_content("Git_Hub", 1, ["Git_Three_State_Model"])
        (tmp_path / "database" / "General" / "Git" / "01_Foundations" / "Chapter_01_Foundations.md").write_text(chapter_content, encoding="utf-8")
        
        # 3. Create Git_Three_State_Model.md
        variants = {
            "simple": "lessons/Git_Three_State_Model.simple.html",
            "deep": "lessons/Git_Three_State_Model.deep.html",
            "cram": "lessons/Git_Three_State_Model.cram.html",
            "exam": "lessons/Git_Three_State_Model.exam.html"
        }
        note_content = merge_atomic_note_metadata(
            "Some content here", 
            "Chapter_01_Foundations", 
            variants, 
            "artifacts/Git_Three_State_Model.artifacts.json", 
            "Git_Hub"
        )
        (tmp_path / "database" / "General" / "Git" / "01_Foundations" / "Git_Three_State_Model.md").write_text(note_content, encoding="utf-8")
        
        # 4. Create artifact pack JSON
        pack = build_minimal_artifact_pack("Git_Three_State_Model", "database/General/Git/01_Foundations/Git_Three_State_Model.md")
        (tmp_path / "artifacts" / "Git_Three_State_Model.artifacts.json").write_text(json.dumps(pack), encoding="utf-8")
        
        # Validate integration
        errors = validate_learning_objects(tmpdir)
        assert not errors, f"Integration validation failed: {errors}"
        
        # Test lookup
        lookup = lookup_existing_hub(tmpdir, "Git")
        assert lookup is not None
        assert lookup["type"] == "self-study"
        assert "Git_Hub.md" in lookup["path"]
        
        # Test lookup normalized
        lookup_norm = lookup_existing_hub(tmpdir, "git")
        assert lookup_norm is not None

def test_integration_errors():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        (tmp_path / "database" / "learning paths").mkdir(parents=True)
        (tmp_path / "database" / "General" / "Git" / "01_Foundations").mkdir(parents=True)
        
        # Create a hub linking to a missing chapter
        hub_content = build_hub_content("Git", "learn_from_scratch", ["Chapter_02_Advanced"])
        (tmp_path / "database" / "learning paths" / "Git_Hub.md").write_text(hub_content, encoding="utf-8")
        
        # Let's also verify that search ignores non-Learning Hub files
        # Create a non-hub file with matching stem
        (tmp_path / "database" / "learning paths" / "Git_Hub_Backup.md").write_text("title: Backup", encoding="utf-8")
        
        errors = validate_learning_objects(tmpdir)
        assert len(errors) > 0
        assert any("Chapter_02_Advanced" in e for e in errors)

def test_title_normalization_unsafe_chars():
    # Verify unsafe OS filename characters are replaced by underscores
    assert normalize_title("Git: Branching & Merging?") == "Git_Branching_&_Merging"
    assert normalize_title("Windows/Mac\\Linux: Test*") == "Windows_Mac_Linux_Test"

def test_validation_strict_mode_and_migration():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        (tmp_path / "database" / "learning paths").mkdir(parents=True)
        (tmp_path / "database" / "General" / "Git" / "01_Foundations").mkdir(parents=True)
        (tmp_path / "artifacts").mkdir(parents=True)
        
        # 1. Create Git_Hub.md
        hub_content = build_hub_content("Git", "learn_from_scratch", ["Chapter_01_Foundations"])
        (tmp_path / "database" / "learning paths" / "Git_Hub.md").write_text(hub_content, encoding="utf-8")
        
        # 2. Create Chapter_01_Foundations.md
        chapter_content = build_chapter_content("Git_Hub", 1, ["Git_Three_State_Model"])
        (tmp_path / "database" / "General" / "Git" / "01_Foundations" / "Chapter_01_Foundations.md").write_text(chapter_content, encoding="utf-8")
        
        # 3. Create Git_Three_State_Model.md referencing a variant and a legacy artifact pack
        variants = {
            "simple": "lessons/Git_Three_State_Model.simple.html"
        }
        note_content = merge_atomic_note_metadata(
            "Some content here", 
            "Chapter_01_Foundations", 
            variants, 
            "artifacts/Git_Three_State_Model.artifacts.json", 
            "Git_Hub"
        )
        note_file = tmp_path / "database" / "General" / "Git" / "01_Foundations" / "Git_Three_State_Model.md"
        note_file.write_text(note_content, encoding="utf-8")
        
        # 4. Create artifact pack at legacy location
        legacy_pack_path = tmp_path / "artifacts" / "Git_Three_State_Model.artifacts.json"
        pack_data = build_minimal_artifact_pack("Git_Three_State_Model", "database/General/Git/01_Foundations/Git_Three_State_Model.md")
        legacy_pack_path.write_text(json.dumps(pack_data), encoding="utf-8")
        
        # 5. Run validation with strict=False (non-strict)
        # It should trigger the automatic migration of the legacy artifact pack to the new unified path
        # and treat missing variant HTML as a warning (not adding it to errors)
        errors = validate_learning_objects(tmpdir, strict=False)
        assert not errors, f"Expected no errors in non-strict mode (migration should succeed and missing variant is a warning): {errors}"
        
        # Verify legacy file was moved
        assert not legacy_pack_path.exists()
        new_pack_path = tmp_path / "database" / "General" / "Git" / "01_Foundations" / "artifacts" / "Git_Three_State_Model.artifacts.json"
        assert new_pack_path.exists()
        
        # 6. Run validation with strict=True
        # Since the variant HTML file does not exist, strict mode should return a hard validation error
        errors_strict = validate_learning_objects(tmpdir, strict=True)
        assert len(errors_strict) > 0
        assert any("references lesson variant" in e and "does not exist on disk" in e for e in errors_strict)
        
        # Create the missing variant HTML file
        lessons_dir = tmp_path / "database" / "General" / "Git" / "01_Foundations" / "lessons"
        lessons_dir.mkdir(parents=True, exist_ok=True)
        (lessons_dir / "Git_Three_State_Model.simple.html").write_text("<html></html>")
        
        # Run validation with strict=True again - should now succeed
        errors_strict_fixed = validate_learning_objects(tmpdir, strict=True)
        assert not errors_strict_fixed, f"Expected no errors when variant is created: {errors_strict_fixed}"
