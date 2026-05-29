import pytest
import asyncio
import json
from unittest.mock import MagicMock
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from src.domains.ater.service import AterService, SynthesisNoteResponse
from src.domains.ater.agents import TheoryAgent, PractitionerAgent, QuestionAgent, StructuredArtifactsResponse
from src.domains.ater.schemas import AtomicNoteSchema, SovereignPlan

class MockLLM:
    def __init__(self, responses=None):
        self.responses = responses or []
        self.calls = []
        self.schema = None

    def with_structured_output(self, schema):
        self.schema = schema
        return self

    async def ainvoke(self, messages, *args, **kwargs):
        self.calls.append(messages)
        if self.schema:
            if self.schema.__name__ == 'StructuredArtifactsResponse':
                return StructuredArtifactsResponse(
                    formal_model="This is the formal model continuous prose walkthrough. Boundary conditions apply.",
                    artifact_content="| Parameter | Value |\n|---|---|\n| Detail A | Detail B |",
                    limitations="**Scope Boundary**: Limit.\n**Common Miss**: Miss.\n**Check Point**: Check."
                )
            elif self.schema.__name__ == 'SynthesisNoteResponse':
                return SynthesisNoteResponse(
                    integrated_analogy="This is a beautiful synthesis analogy describing how two member concepts work under a unified theme.",
                    comparative_breakdown="Here is deep comparative continuous prose breakdown contrasting the two concepts without bullets.",
                    comparison_table="| Metric | Concept A | Concept B |\n|---|---|---|\n| Speed | Fast | Slow |",
                    cross_concept_quiz=[
                        {
                            "type": "mcq",
                            "difficulty": "L3",
                            "question": "Which of the following is true?",
                            "options": {"A": "Yes", "B": "No", "C": "Maybe", "D": "None"},
                            "answer": "A",
                            "explanation": "Exp"
                        }
                    ]
                )
        
        # Plain text generator fallback
        res = self.responses.pop(0) if self.responses else "Mock plain text"
        class MockRes:
            def __init__(self, content):
                self.content = content
        return MockRes(res)

@pytest.mark.asyncio
async def test_sandwich_pipeline_execution():
    # 1. Verify sequential sub-agents call sequence
    mock_domain = {
        "persona": "Test Persona",
        "h1": "Analogy Section",
        "h2": "Core Breakdown",
        "artifact": "Comparison Diagram",
        "type": "Markdown Table",
        "sanity_check": "Stay grounded.",
        "question_modes": ["mcq", "writing", "trace"]
    }
    
    note_schema = AtomicNoteSchema(
        title="Concepts_Comparison",
        description="A comparison note.",
        source_context="Important details about Concepts.",
        prerequisites=[]
    )
    
    responses = [
        "<mental_model>Imagine a playground where two friends balance a seesaw. One represents concept A, and the other represents concept B.</mental_model>\n<core_logic>This walkthrough explains how both concepts play their specific roles step by step.</core_logic>"
    ]
    theory_llm = MockLLM(responses)
    theory_agent = TheoryAgent(theory_llm, mock_domain)
    
    theory_parts = await theory_agent.generate_micro(
        note_schema,
        source_text="Exemplar context source.",
        all_concepts="Concepts_Comparison",
        academic_level="Advanced Undergraduate"
    )
    
    assert "mental_model" in theory_parts
    assert "core_logic" in theory_parts
    assert "h1_title" not in theory_parts  # Make sure we successfully refactored and stripped h1_title
    assert "playground" in theory_parts["mental_model"]
    assert "walkthrough" in theory_parts["core_logic"]
    
    # 2. PractitionerAgent execution
    prac_llm = MockLLM()
    prac_agent = PractitionerAgent(prac_llm, mock_domain)
    prac_parts = await prac_agent.generate_micro(
        note_title="Concepts_Comparison",
        theory_body=theory_parts["core_logic"],
        primary_language="English",
        plain_english=theory_parts["mental_model"],
        source_text="Exemplar context source."
    )
    
    assert "formal_model" in prac_parts
    assert "artifact_content" in prac_parts
    assert "limitations" in prac_parts
    assert "quiz_questions" not in prac_parts  # Verify quiz stripped entirely
    
    # 3. QuestionAgent execution
    # Set up mock JSON quiz returned inside <QUIZ_JSON> tags
    quiz_json_response = """
    <QUIZ_JSON>
    [
      {
        "type": "mcq",
        "difficulty": "L1",
        "question": "Q1?",
        "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
        "answer": "A",
        "explanation": "Exp1"
      },
      {
        "type": "writing",
        "difficulty": "L2",
        "question": "Q2?",
        "answer": "Answer containing keywords",
        "required_keywords": ["key1", "key2", "key3"],
        "explanation": "Exp2"
      },
      {
        "type": "trace",
        "difficulty": "L3",
        "question": "Q3?",
        "answer": "Clean trace value",
        "required_keywords": ["trace", "value", "clean"],
        "explanation": "Exp3"
      }
    ]
    </QUIZ_JSON>
    """
    q_llm = MockLLM([quiz_json_response])
    q_agent = QuestionAgent(q_llm, mock_domain)
    
    questions = await q_agent.generate(
        note_schema=note_schema,
        source_text="Source context anchor.",
        mechanics="Test",
        academic_level="Advanced Undergraduate",
        count=3
    )
    
    assert len(questions) == 3
    assert questions[0]["type"] == "mcq"
    assert questions[1]["type"] == "writing"
    assert questions[2]["type"] == "trace"

@pytest.mark.asyncio
async def test_best_of_5_scorer():
    # Instantiate a mock AterService subclass to test rate_candidate_quiz
    class AterServiceMock(AterService):
        def __init__(self):
            self.validator = MagicMock()
            # Mock validator.semantic_topic_lock
            def mock_lock(note_title, source_context, quiz_questions):
                # Lock passes if " rocket " is not in any question
                for q in quiz_questions:
                    if "rocket" in q.get("question", "").lower():
                        return False, "contaminated"
                return True, "passed"
            self.validator.semantic_topic_lock = mock_lock

    service = AterServiceMock()
    
    # 1. 100-Point Perfect Candidate Quiz
    perfect_quiz = [
      {
        "type": "mcq",
        "difficulty": "L1",
        "question": "What is primary factor?",
        "options": {"A": "Marginal cost", "B": "Fixed cost", "C": "Demand", "D": "Supply"},
        "answer": "A",
        "explanation": "Exp"
      },
      {
        "type": "writing",
        "difficulty": "L2",
        "question": "Explain marginal cost.",
        "answer": "Answer with keyword list",
        "required_keywords": ["marginal", "cost", "production"],
        "explanation": "Exp"
      },
      {
        "type": "trace",
        "difficulty": "L3",
        "question": "Trace marginal cost shift.",
        "answer": "No scratchpad trailing clean",
        "required_keywords": ["marginal", "cost", "shift"],
        "explanation": "Exp"
      }
    ]
    
    score1 = service.rate_candidate_quiz(perfect_quiz, "Marginal_Cost", "Marginal cost is the primary factor.")
    # Valid JSON (+10), exactly 3 (+10), heterogeneous L1/L2/L3 (+15), MCQs 4 options (+15), Debug/Trace/Writing keywords (+15), Semantic lock (+20), Trace clean (+15)
    # Total = 100.0
    assert score1 == 100.0
    
    # 2. MCQ missing options (e.g. only 2 options)
    invalid_mcq_opts_quiz = [
      {
        "type": "mcq",
        "difficulty": "L1",
        "question": "Q?",
        "options": {"A": "1", "B": "2"},
        "answer": "A",
        "explanation": "Exp"
      },
      perfect_quiz[1],
      perfect_quiz[2]
    ]
    score2 = service.rate_candidate_quiz(invalid_mcq_opts_quiz, "Marginal_Cost", "Marginal cost is the primary factor.")
    assert score2 == 85.0  # Misses MCQ choices points (+15)
    
    # 3. Writing question with missing/too few keywords (e.g. only 1 keyword)
    invalid_keywords_quiz = [
      perfect_quiz[0],
      {
        "type": "writing",
        "difficulty": "L2",
        "question": "Explain marginal cost.",
        "answer": "Answer",
        "required_keywords": ["marginal"],
        "explanation": "Exp"
      },
      perfect_quiz[2]
    ]
    score3 = service.rate_candidate_quiz(invalid_keywords_quiz, "Marginal_Cost", "Marginal cost is the primary factor.")
    assert score3 == 85.0  # Misses keyword points (+15)

    # 4. Contaminated topic (semantic lock check fails)
    contaminated_quiz = [
      perfect_quiz[0],
      perfect_quiz[1],
      {
        "type": "trace",
        "difficulty": "L3",
        "question": "Explain rockets and spaceships.",
        "answer": "No scratchpad",
        "required_keywords": ["marginal", "cost", "shift"],
        "explanation": "Exp"
      }
    ]
    score4 = service.rate_candidate_quiz(contaminated_quiz, "Marginal_Cost", "Marginal cost is the primary factor.")
    assert score4 == 80.0  # Misses topic lock (+20)

    # 5. Trace answer with scratchpad (ends with '=') or too long with '='
    dirty_trace_quiz = [
      perfect_quiz[0],
      perfect_quiz[1],
      {
        "type": "trace",
        "difficulty": "L3",
        "question": "Trace marginal cost shift.",
        "answer": "Calculations: 10 + 20 =",
        "required_keywords": ["marginal", "cost", "shift"],
        "explanation": "Exp"
      }
    ]
    score5 = service.rate_candidate_quiz(dirty_trace_quiz, "Marginal_Cost", "Marginal cost is the primary factor.")
    assert score5 == 85.0  # Misses trace clean points (+15)

@pytest.mark.asyncio
async def test_synthesis_note_compiler():
    # Test the Synthesis Note Compiler formatting and layout
    class AterServiceMock(AterService):
        def __init__(self):
            self.governor = MagicMock()
            # async get_permit mock
            async def mock_permit(*args, **kwargs):
                pass
            self.governor.get_permit = mock_permit
            self.vm = MagicMock()
            self.vm.get_canonical_title = lambda x: str(x).replace(" ", "_")
            self.validator = MagicMock()
            self.validator.repair_code_fences = lambda x: x

        def _get_source_link(self, plan, session_path=""):
            return "[[Inbox/Generated/Fall_2026/CS_101/source.pdf]]"

    service = AterServiceMock()
    
    note_schema_dict = {
        "title": "Module_A_Module_B_Synthesis",
        "description": "Cross concept synthesis",
        "source_context": "Concept A is fast. Concept B is slow.",
        "prerequisites": ["Module_A", "Module_B"],
        "source_pages": [1, 2]
    }
    
    plan_obj = SovereignPlan(
        course="Computer Science",
        semester="Fall 2026",
        unit="Unit 3",
        hub_title="Computer Science Hub",
        hub_note={"title": "CS_Hub", "description": "Hub note description"},
        academic_level="Advanced Undergraduate",
        atomic_notes=[],
        possible_questions=[]
    )
    
    temp_llm = MockLLM()
    temp_llm_creative = MockLLM()
    
    markdown = await service.compile_synthesis_note(
        session_id="session_synthesis",
        note_schema_dict=note_schema_dict,
        current_note_title="Module_A_Module_B_Synthesis",
        plan_obj=plan_obj,
        session_path="source.pdf",
        temp_llm=temp_llm,
        temp_llm_creative=temp_llm_creative,
        all_note_titles=["Module_A", "Module_B", "Module_A_Module_B_Synthesis"]
    )
    
    # Assert Frontmatter details
    assert "type: Synthesis Note" in markdown
    assert "course: Computer Science" in markdown
    assert "semester: Fall 2026" in markdown
    assert 'unit: "Unit 3"' in markdown
    assert "prerequisites: [\"[[Module_A]]\", \"[[Module_B]]\"]" in markdown
    
    # Assert sections and headers
    assert "# 1. Integrated Synthesis Analogy" in markdown
    assert "# 2. Comparative Synthesis Breakdown" in markdown
    assert "# 3. Cross-Concept Interactive Assessment" in markdown
    assert "```interactive-quiz" in markdown
