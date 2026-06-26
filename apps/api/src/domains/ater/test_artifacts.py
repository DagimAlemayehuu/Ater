import pytest
import json
from pydantic import ValidationError

from src.domains.ater.artifact_service import (
    validate_artifact,
    select_candidate_types,
    ArtifactService,
    RevealCard,
    ClozeMulti,
    MatchingPairs,
    SortableSteps,
    StateStepper,
    ConceptMap,
    TableLens,
    CodeTrace,
    FormulaCard,
    Timeline
)

# Mock LLM response class
class MockLLM:
    def __init__(self, response_content: str):
        self.response_content = response_content

    async def ainvoke(self, messages):
        class MockResponse:
            def __init__(self, content):
                self.content = content
        return MockResponse(self.response_content)

# 5.1 Unit Tests for Schema Validation of all 10 types
def test_schema_validation_reveal_card():
    data = {"type": "reveal_card", "front": "Q1", "back": "A1"}
    obj = validate_artifact(data)
    assert isinstance(obj, RevealCard)
    assert obj.front == "Q1"

    with pytest.raises(ValidationError):
        validate_artifact({"type": "reveal_card", "front": "Q1"}) # missing back

def test_schema_validation_cloze_multi():
    data = {"type": "cloze_multi", "text": "This is {{cloze}}.", "options": ["one", "two"]}
    obj = validate_artifact(data)
    assert isinstance(obj, ClozeMulti)
    assert "one" in obj.options

    with pytest.raises(ValidationError):
        validate_artifact({"type": "cloze_multi", "text": "This is cloze."}) # missing options

def test_schema_validation_matching_pairs():
    data = {
        "type": "matching_pairs",
        "pairs": [{"left": "L1", "right": "R1"}, {"left": "L2", "right": "R2"}]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, MatchingPairs)
    assert len(obj.pairs) == 2
    assert obj.pairs[0].left == "L1"

def test_schema_validation_sortable_steps():
    data = {"type": "sortable_steps", "steps": ["Step 1", "Step 2"]}
    obj = validate_artifact(data)
    assert isinstance(obj, SortableSteps)
    assert len(obj.steps) == 2

def test_schema_validation_state_stepper():
    data = {
        "type": "state_stepper",
        "states": ["State A", "State B"],
        "transitions": ["Trigger AB"]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, StateStepper)
    assert len(obj.states) == 2

def test_schema_validation_concept_map():
    data = {
        "type": "concept_map",
        "nodes": [{"id": "n1", "label": "Node 1"}],
        "edges": [{"from": "n1", "to": "n2", "label": "link"}]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, ConceptMap)
    assert obj.nodes[0].id == "n1"
    assert obj.edges[0].from_node == "n1"

def test_schema_validation_table_lens():
    data = {
        "type": "table_lens",
        "headers": ["Col 1", "Col 2"],
        "rows": [["Val 1", "Val 2"]]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, TableLens)
    assert obj.headers[0] == "Col 1"
    assert obj.rows[0][1] == "Val 2"

def test_schema_validation_code_trace():
    data = {
        "type": "code_trace",
        "code": "print('hello')",
        "steps": ["Step 1"],
        "variables": [{"x": "5"}]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, CodeTrace)
    assert obj.code == "print('hello')"
    assert obj.variables[0]["x"] == "5"

def test_schema_validation_formula_card():
    data = {
        "type": "formula_card",
        "expression": "E = mc^2",
        "variables": {"E": "Energy", "m": "Mass"},
        "derivation": ["Step 1: start"]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, FormulaCard)
    assert obj.expression == "E = mc^2"
    assert obj.variables["E"] == "Energy"

def test_schema_validation_timeline():
    data = {
        "type": "timeline",
        "events": [{"date": "2026", "description": "Antigravity launch"}]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, Timeline)
    assert obj.events[0].date == "2026"

# 5.2 Unit Tests for Modality Mapping
def test_modality_mapping():
    # CS/Programming
    cands_cs = select_candidate_types({"concept_modality": "Procedural", "mode": "CS-CORE"}, "Write some python code.")
    assert "code_trace" in cands_cs
    assert "sortable_steps" in cands_cs

    # Quantitative
    cands_quant = select_candidate_types({"concept_modality": "Quantitative", "mode": "MATH-101"}, "Derivative of x^2")
    assert "formula_card" in cands_quant

    # Chronology/History
    cands_hist = select_candidate_types({"concept_modality": "Causal/Historical"}, "The events of World War II")
    assert "timeline" in cands_hist

    # Defaults to qualitative
    cands_default = select_candidate_types({}, "Normal definitions note.")
    assert "reveal_card" in cands_default

# 5.2 Governor Test (Truncation to max 3)
@pytest.mark.asyncio
async def test_governor_limit(tmp_path):
    # LLM returns 5 items
    raw_response = json.dumps([
        {"type": "reveal_card", "front": "Q1", "back": "A1"},
        {"type": "reveal_card", "front": "Q2", "back": "A2"},
        {"type": "reveal_card", "front": "Q3", "back": "A3"},
        {"type": "reveal_card", "front": "Q4", "back": "A4"},
        {"type": "reveal_card", "front": "Q5", "back": "A5"}
    ])
    mock_llm = MockLLM(raw_response)
    service = ArtifactService(llm=mock_llm, vault_path=tmp_path)
    
    pack = await service.generate_artifacts(
        note_title="Test_Governor",
        note_path_rel="database/Test_Governor.md",
        frontmatter={},
        content="Note content here."
    )
    
    # Active version should have exactly 3 artifacts
    assert len(pack["versions"][-1]["artifacts"]) == 3

# 5.3 E2E Integration Test in a Temporary Vault
@pytest.mark.asyncio
async def test_integration_artifacts_lifecycle(tmp_path):
    # Create the artifacts folder structure in tmp vault
    (tmp_path / "artifacts").mkdir(parents=True, exist_ok=True)
    
    # Setup note markdown file in vault
    note_file = tmp_path / "Test_Note.md"
    note_file.write_text("---\nconcept_modality: Qualitative/Definitional\n---\nHello this is content.", encoding="utf-8")
    
    # 1. LLM Generation E2E
    mock_response = json.dumps([
        {"type": "reveal_card", "front": "Q1", "back": "A1"},
        {"type": "cloze_multi", "text": "This is {{cloze}}.", "options": ["one", "two"]}
    ])
    mock_llm = MockLLM(mock_response)
    service = ArtifactService(llm=mock_llm, vault_path=tmp_path)
    
    pack = await service.generate_artifacts(
        note_title="Test_Note",
        note_path_rel="Test_Note.md",
        frontmatter={"concept_modality": "Qualitative/Definitional"},
        content="Hello this is content."
    )
    
    assert pack["note_title"] == "Test_Note"
    assert pack["active_version"] == 2
    assert len(pack["versions"]) == 2
    assert len(pack["versions"][1]["artifacts"]) == 2
    
    # Check that file exists on disk
    expected_file = tmp_path / "artifacts" / "Test_Note.artifacts.json"
    assert expected_file.exists()
    
    # 2. Pinning Test
    pack = service.pin_artifact_types(
        note_title="Test_Note",
        note_path_rel="Test_Note.md",
        pinned_types=["cloze_multi", "reveal_card"]
    )
    assert pack["pinned_artifact_types"] == ["cloze_multi", "reveal_card"]
    
    # 3. Regeneration E2E (Version append)
    mock_response_v2 = json.dumps([
        {"type": "cloze_multi", "text": "This is v2 {{cloze}}.", "options": ["three"]},
        {"type": "reveal_card", "front": "Q2", "back": "A2"}
    ])
    service.llm = MockLLM(mock_response_v2)
    
    pack = await service.generate_artifacts(
        note_title="Test_Note",
        note_path_rel="Test_Note.md",
        frontmatter={"concept_modality": "Qualitative/Definitional"},
        content="Hello this is content."
    )
    
    assert pack["active_version"] == 3
    assert len(pack["versions"]) == 3
    assert len(pack["versions"][2]["artifacts"]) == 2
    assert pack["versions"][2]["artifacts"][0]["text"] == "This is v2 {{cloze}}."
    
    # 4. Rollback Test
    pack = service.rollback_version(
        note_title="Test_Note",
        note_path_rel="Test_Note.md",
        target_version=2
    )
    assert pack["active_version"] == 2
    
    # Reload from disk and verify active version remains 2
    with open(expected_file, "r", encoding="utf-8") as f:
        disk_pack = json.load(f)
    assert disk_pack["active_version"] == 2
