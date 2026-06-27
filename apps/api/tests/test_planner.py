import tempfile
import pytest
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock

from src.domains.ater.planner import (
    AterPlanner,
    IntentClarificationResponse,
    CurriculumPlan,
    PlannedChapter
)

class DummySecrets:
    def __init__(self, vault_path):
        self.vault_path = vault_path
        self.ai_provider = "google"
        self.ai_model = "gemini-2.0-flash"
        self.ai_key = "mock-key"
        self.academic_path = "Notes"

@pytest.mark.asyncio
async def test_classify_intent_and_clarification():
    mock_llm = MagicMock()
    mock_structured = MagicMock()
    
    # Mocking IntentClarificationResponse return
    mock_response = IntentClarificationResponse(
        is_learning=True,
        needs_clarification=True,
        questions=["What subtopics in Git would you like to cover?"]
    )
    mock_structured.ainvoke = AsyncMock(return_value=mock_response)
    mock_llm.with_structured_output.return_value = mock_structured
    
    secrets = DummySecrets("/tmp/mock-vault")
    planner = AterPlanner(secrets, llm=mock_llm)
    
    result = await planner.classify_intent_and_clarification("Teach me Git")
    
    assert result["is_learning"] is True
    assert result["needs_clarification"] is True
    assert "What subtopics in Git would you like to cover?" in result["questions"]
    mock_llm.with_structured_output.assert_called_with(IntentClarificationResponse)


@pytest.mark.asyncio
async def test_extract_topic():
    mock_llm = MagicMock()
    mock_structured = MagicMock()
    
    class MockTopicExtractorResponse:
        def __init__(self, topic):
            self.topic = topic
            
    mock_structured.ainvoke = AsyncMock(return_value=MockTopicExtractorResponse(topic="Git Branching"))
    mock_llm.with_structured_output.return_value = mock_structured
    
    secrets = DummySecrets("/tmp/mock-vault")
    planner = AterPlanner(secrets, llm=mock_llm)
    
    topic = await planner.extract_topic("Teach me about advanced git branching features")
    assert topic == "Git Branching"


@pytest.mark.asyncio
async def test_generate_curriculum():
    mock_llm = MagicMock()
    mock_structured = MagicMock()
    
    mock_curriculum = CurriculumPlan(
        topic="Git Branching",
        learning_mode="self-study",
        chapters=[
            PlannedChapter(
                title="Foundations of Branching",
                order=1,
                atomic_notes=["Git Commit Graph", "Creating Branches"]
            )
        ]
    )
    mock_structured.ainvoke = AsyncMock(return_value=mock_curriculum)
    mock_llm.with_structured_output.return_value = mock_structured
    
    secrets = DummySecrets("/tmp/mock-vault")
    planner = AterPlanner(secrets, llm=mock_llm)
    
    result = await planner.generate_curriculum("Teach me Git", learning_mode="self-study")
    
    assert result["topic"] == "Git Branching"
    assert result["learning_mode"] == "self-study"
    assert len(result["chapters"]) >= 8
    assert result["chapters"][0]["title"] == "Foundations of Branching"
    assert "Git Commit Graph" in result["chapters"][0]["atomic_notes"]
    assert len(result["chapters"][0]["atomic_notes"]) >= 3


def test_write_curriculum_generate_all():
    with tempfile.TemporaryDirectory() as tmp_vault:
        vault_path = Path(tmp_vault)
        secrets = DummySecrets(str(vault_path))
        planner = AterPlanner(secrets, llm=MagicMock())
        
        curriculum = {
            "topic": "Python Async",
            "learning_mode": "self-study",
            "chapters": [
                {
                    "title": "Introduction to Event Loop",
                    "order": 1,
                    "atomic_notes": ["Event Loop Basics", "Asyncio Coroutines"]
                },
                {
                    "title": "Advanced Tasks",
                    "order": 2,
                    "atomic_notes": ["Asyncio Gather", "Task Cancellation"]
                }
            ]
        }
        
        result = planner.write_curriculum(curriculum, mode="Generate All")
        
        # Verify Hub Path
        hub_path = vault_path / "database/learning paths/Python_Async_Hub.md"
        assert hub_path.exists()
        hub_content = hub_path.read_text(encoding="utf-8")
        assert "type: Learning Hub" in hub_content
        assert "- [[Chapter_01_Introduction_To_Event_Loop]]" in hub_content
        assert "- [[Chapter_02_Advanced_Tasks]]" in hub_content
        
        # Verify Chapter 1 and notes
        ch1_path = vault_path / "database/General/Python_Async/01_Introduction_To_Event_Loop/Chapter_01_Introduction_To_Event_Loop.md"
        assert ch1_path.exists()
        ch1_content = ch1_path.read_text(encoding="utf-8")
        assert "type: Chapter" in ch1_content
        assert "- [[Event_Loop_Basics]]" in ch1_content
        
        note1_path = vault_path / "database/General/Python_Async/01_Introduction_To_Event_Loop/Event_Loop_Basics.md"
        assert note1_path.exists()
        note1_content = note1_path.read_text(encoding="utf-8")
        assert "type: Atomic Note" in note1_content
        assert 'chapter: "[[Chapter_01_Introduction_To_Event_Loop]]"' in note1_content
        
        # Verify Chapter 2 and notes (in Generate All mode, these should be created)
        ch2_path = vault_path / "database/General/Python_Async/02_Advanced_Tasks/Chapter_02_Advanced_Tasks.md"
        assert ch2_path.exists()
        
        note3_path = vault_path / "database/General/Python_Async/02_Advanced_Tasks/Asyncio_Gather.md"
        assert note3_path.exists()
        
        # Assert written files count (1 hub + 2 chapters + 4 notes = 7 files)
        assert len(result["written_files"]) == 7


def test_write_curriculum_progressive():
    with tempfile.TemporaryDirectory() as tmp_vault:
        vault_path = Path(tmp_vault)
        secrets = DummySecrets(str(vault_path))
        planner = AterPlanner(secrets, llm=MagicMock())
        
        curriculum = {
            "topic": "Python Async",
            "learning_mode": "self-study",
            "chapters": [
                {
                    "title": "Introduction to Event Loop",
                    "order": 1,
                    "atomic_notes": ["Event Loop Basics"]
                },
                {
                    "title": "Advanced Tasks",
                    "order": 2,
                    "atomic_notes": ["Asyncio Gather"]
                }
            ]
        }
        
        result = planner.write_curriculum(curriculum, mode="Progressive")
        
        # Verify Hub Path still exists and lists both chapters
        hub_path = vault_path / "database/learning paths/Python_Async_Hub.md"
        assert hub_path.exists()
        hub_content = hub_path.read_text(encoding="utf-8")
        assert "- [[Chapter_01_Introduction_To_Event_Loop]]" in hub_content
        assert "- [[Chapter_02_Advanced_Tasks]]" in hub_content
        
        # Verify Chapter 1 and note are created
        ch1_path = vault_path / "database/General/Python_Async/01_Introduction_To_Event_Loop/Chapter_01_Introduction_To_Event_Loop.md"
        assert ch1_path.exists()
        
        # Verify Chapter 2 is NOT created
        ch2_path = vault_path / "database/General/Python_Async/02_Advanced_Tasks/Chapter_02_Advanced_Tasks.md"
        assert not ch2_path.exists()
        
        # Asserts written files (1 hub + 1 chapter + 1 note = 3 files)
        assert len(result["written_files"]) == 3
