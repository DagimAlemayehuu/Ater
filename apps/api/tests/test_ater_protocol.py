import pytest
from src.domains.ater.validator import AterValidator

def test_validator_required_sections():
    validator = AterValidator()
    
    # Missing Mental Model
    content = """---
title: Test
type: atomic
course: CS101
---
# Domain Section 1
Content
# Domain Section 2
Content
# The Proving Grounds
```interactive-quiz
[]
```
"""
    is_valid, errors = validator.validate_structure(content)
    assert not is_valid
    assert any("MISSING_SECTION" in e and "Mental Model" in e for e in errors)

def test_validator_hard_failure_markers():
    validator = AterValidator()
    content = """---
title: Test
type: atomic
course: CS101
---
# Mental Model
Wait, that is incorrect. Error generating content.
# Section 1
Content
# Section 2
Content
# The Proving Grounds
```interactive-quiz
[]
```
"""
    is_valid, errors = validator.validate_structure(content)
    assert not is_valid
    assert any("HARD_FAILURE_MARKER" in e for e in errors)


def test_validator_broken_wikilinks():
    validator = AterValidator()
    content = """---
title: Test
type: atomic
course: CS101
---
# Mental Model
This has [[ Space_Inside ]].
# Section 1
[[Link1]] [[Link2]] [[Link3]]
# Section 2
Content
# The Proving Grounds
```interactive-quiz
[]
```
"""
    is_valid, errors = validator.validate_structure(content)
    assert not is_valid
    assert any("BROKEN_WIKILINKS" in e for e in errors)

def test_validator_json_robust():
    validator = AterValidator()
    
    # JSON with LaTeX backslashes and trailing comma
    bad_json = """
    [
        {
            "question": "What is \\\\Delta x?",
            "answer": "Change in x",
        }
    ]
    """
    is_valid, data, err = validator.validate_json_robust(bad_json)
    assert is_valid
    assert data[0]["question"] == "What is \\Delta x?"
    assert data[0]["answer"] == "Change in x"

def test_validator_semantic_topic_lock():
    validator = AterValidator()
    note_title = "Photosynthesis"
    source_context = "Chlorophyll absorbs sunlight to convert CO2 and water into glucose."
    quiz = [
        {"question": "What does chlorophyll do?", "answer": "Absorbs sunlight"},
        {"question": "How do rockets work?", "answer": "Combustion"} # Contamination
    ]
    
    passed, diag = validator.semantic_topic_lock(note_title, source_context, quiz)
    assert not passed
    assert "Q2" in diag
    assert "contamination" in diag.lower()

def test_validator_truncation_detection():
    validator = AterValidator()
    content = """---
title: Test
type: atomic
course: CS101
---
# Mental Model
This section is fine.
# Section 1
[[Link1]] [[Link2]] [[Link3]]
# Section 2
This section ends abruptly without"""
    is_valid, errors = validator.validate_structure(content)
    assert not is_valid
    assert any("TRUNCATED_GENERATION" in e or "SECTION_TRUNCATION" in e for e in errors)
