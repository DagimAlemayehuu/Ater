import pytest
import os
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, AsyncMock, patch

from src.domains.ater.source_service import (
    SourceCitation,
    CoverageWarning,
    SourceGroundedNotePlan,
    SourceGroundedCurriculum,
    SourceIngestionService,
    SourceGroundedPlanner,
    SourceWeaknessDetector,
    SearchAugmentationEngine
)

class DummySecrets:
    def __init__(self, vault_path):
        self.vault_path = vault_path
        self.ai_provider = "google"
        self.ai_model = "gemini-2.0-flash"
        self.ai_key = "mock-key"
        self.academic_path = "Notes"

@pytest.fixture
def temp_vault():
    with tempfile.TemporaryDirectory() as tmp_dir:
        yield Path(tmp_dir)

# 6.1 PDF Ingestion & Chunking Unit Tests
@patch("src.domains.ater.source_service.load_pdf_robust")
def test_ingest_pdf_empty_warning(mock_load_pdf):
    # Mocking two pages, one empty, one with text
    mock_load_pdf.return_value = [
        SimpleNamespace(page_content="Valid page 1 text", metadata={"page": 0}),
        SimpleNamespace(page_content="", metadata={"page": 1})
    ]
    
    service = SourceIngestionService()
    result = service.ingest_pdf("dummy.pdf")
    
    assert result["file_name"] == "dummy.pdf"
    assert len(result["pages"]) == 2
    assert result["pages"][0]["page_number"] == 1
    assert result["pages"][1]["page_number"] == 2
    assert result["pages"][1]["content"] == ""
    
    # Check that it warns for page 2
    assert len(result["warnings"]) == 1
    assert result["warnings"][0].concept == "dummy.pdf"
    assert result["warnings"][0].severity == "high"
    assert "page(s) 2" in result["warnings"][0].description

# 6.2 Grounded Curriculum Planning & Frontmatter Serialization Unit Tests
@pytest.mark.asyncio
async def test_generate_grounded_curriculum_and_write(temp_vault):
    mock_llm = MagicMock()
    mock_structured = MagicMock()
    
    curriculum = SourceGroundedCurriculum(
        topic="Git Rebase",
        sources=["git-tutorial.pdf"],
        notes=[
            SourceGroundedNotePlan(
                title="Git Rebase Basics",
                chapter_title="Branch Management",
                citations=[
                    SourceCitation(file_name="git-tutorial.pdf", pages=[12, 13], confidence_score=0.95)
                ],
                suggested_concepts=["Rebase Definition", "Rebase Mechanism"]
            )
        ],
        warnings=[]
    )
    
    mock_structured.ainvoke = AsyncMock(return_value=curriculum)
    mock_llm.with_structured_output.return_value = mock_structured
    
    secrets = DummySecrets(str(temp_vault))
    planner = SourceGroundedPlanner(secrets, llm=mock_llm)
    
    # Generate
    sources_data = [{
        "file_name": "git-tutorial.pdf",
        "pages": [
            {"page_number": 12, "content": "Text of page 12"},
            {"page_number": 13, "content": "Text of page 13"}
        ]
    }]
    result_curr = await planner.generate_grounded_curriculum("Teach me rebase", sources_data)
    assert result_curr.topic == "Git Rebase"
    assert len(result_curr.notes) == 1
    assert result_curr.notes[0].citations[0].pages == [12, 13]
    
    # Write to Vault and verify sources frontmatter serialization
    planner.write_grounded_curriculum(result_curr, mode="Generate All")
    
    note_path = temp_vault / "database/General/Git_Rebase/01_Branch_Management/Git_Rebase_Basics.md"
    assert note_path.exists()
    
    note_content = note_path.read_text(encoding="utf-8")
    assert "sources:" in note_content
    assert "- file: git-tutorial.pdf" in note_content
    assert "pages:" in note_content
    assert "- 12" in note_content
    assert "- 13" in note_content

# 6.3 Weakness Coverage Detection Unit Tests
@pytest.mark.asyncio
async def test_weakness_detector():
    mock_llm = MagicMock()
    mock_structured = MagicMock()
    
    from src.domains.ater.source_service import CoverageCheckResponse
    expected_warnings = [
        CoverageWarning(
            concept="Git Rebase Basics",
            dimension="failure_mode",
            severity="high",
            description="Cited source lacks explanation on rebase conflicts (Failure Mode)."
        )
    ]
    mock_structured.ainvoke = AsyncMock(return_value=CoverageCheckResponse(warnings=expected_warnings))
    mock_llm.with_structured_output.return_value = mock_structured
    
    secrets = DummySecrets("/tmp/mock-vault")
    detector = SourceWeaknessDetector(secrets, llm=mock_llm)
    
    curriculum = SourceGroundedCurriculum(
        topic="Git Rebase",
        sources=["git-tutorial.pdf"],
        notes=[
            SourceGroundedNotePlan(
                title="Git Rebase Basics",
                chapter_title="Branch Management",
                citations=[
                    SourceCitation(file_name="git-tutorial.pdf", pages=[12], confidence_score=0.95)
                ],
                suggested_concepts=["Git Rebase conflicts"]
            )
        ],
        warnings=[]
    )
    
    sources = [{"file_name": "git-tutorial.pdf", "pages": [{"page_number": 12, "content": "Basic rebase info"}]}]
    warnings = await detector.analyze_coverage(curriculum, sources)
    
    assert len(warnings) == 1
    assert warnings[0].concept == "Git Rebase Basics"
    assert warnings[0].dimension == "failure_mode"
    assert warnings[0].severity == "high"

# 6.4 Consented Search Augmentation Unit Tests
def test_search_augmentation_engine():
    engine = SearchAugmentationEngine()
    
    # ATER_TEST_MODE forces mock results
    os.environ["ATER_TEST_MODE"] = "1"
    results = engine.search_query("Git Rebase Conflicts")
    assert len(results) == 1
    assert "Mock Search" in results[0]["title"]
    assert "https://example.com/search" in results[0]["url"]
    
    augmented_text = engine.augment_context("Git Rebase Conflicts", results)
    assert "### Web Search Augmentation: Git Rebase Conflicts" in augmented_text
    assert "Mock Search:" in augmented_text
