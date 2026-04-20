from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Literal

class AdvancedPracticeConfig(BaseModel):
    hubId: str
    selectedAtomicNotes: List[str] = Field(default_factory=list)
    exclusionKeywords: List[str] = Field(default_factory=list)
    timeBoundDays: Optional[int] = None
    prioritizeWeaknesses: bool = False
    questionDistribution: Dict[str, int] = Field(default_factory=lambda: {
        "multipleChoice": 0, "trueFalse": 0, "shortAnswer": 0, "scenario": 0,
        "codeImplementation": 0, "clozeDeletion": 0, "findTheError": 0, "matchingMatrix": 0
    })
    difficulty: Literal["L0", "L1", "L2", "L3", "L4", "Mixed"] = "L1"
    distractorPlausibility: Literal["Low", "Medium", "High"] = "Medium"
    injectTrickAnswers: bool = False
    globalTimeLimitMinutes: Optional[int] = None
    perQuestionTimeLimitSeconds: Optional[int] = None
    progressionGatekeeper: bool = False
    gradingStrictness: Literal["Lenient", "Strict", "Flexible"] = "Lenient"
    enableProgressiveHints: bool = False
    requireConfidenceWager: bool = False

class BaseQuestion(BaseModel):
    id: int
    type: str
    difficulty: str
    question: str
    explanation: str
    hints: List[str] = Field(default_factory=list)

class MCQQuestion(BaseQuestion):
    type: Literal["mcq"]
    options: Dict[str, str]
    answer: str

class TrueFalseQuestion(BaseQuestion):
    type: Literal["true_false"]
    answer: str

class ShortAnswerQuestion(BaseQuestion):
    type: Literal["short_answer"]
    answer: str

class ScenarioQuestion(BaseQuestion):
    type: Literal["scenario"]
    answer: str

class CodeQuestion(BaseQuestion):
    type: Literal["code"]
    codeSnippet: str
    answer: str
    language: str

class ClozeQuestion(BaseQuestion):
    type: Literal["cloze"]
    textWithBlanks: str
    answer: List[str]

class FindErrorQuestion(BaseQuestion):
    type: Literal["find_error"]
    buggyCode: str
    answer: str

class MatchingPair(BaseModel):
    left: str
    right: str

class MatchingQuestion(BaseQuestion):
    type: Literal["matching"]
    pairs: List[MatchingPair]

Question = Union[
    MCQQuestion, TrueFalseQuestion, ShortAnswerQuestion, 
    ScenarioQuestion, CodeQuestion, ClozeQuestion, 
    FindErrorQuestion, MatchingQuestion
]

class PracticeBatch(BaseModel):
    questions: List[Question]

class PracticeSessionResponse(BaseModel):
    session_id: str
    questions: List[Question]
    quiz_path: str

# --- Sovereign Architect Schemas ---

class NoteSchema(BaseModel):
    title: str = Field(..., description="Sanitized Title_Case_With_Underscores filename.")
    description: str = Field(..., description="One sentence summary.")
    source_context: Optional[str] = Field(default="No context extracted.", description="Raw text relevant to this topic.")
    source_pages: List[int] = Field(default_factory=list, description="Page numbers where context was found.")

class AtomicNoteSchema(NoteSchema):
    prerequisites: List[str] = Field(default_factory=list)
    mode: Literal[
        "CS-CODE", "CS-SYS", "MED-STRUCT", "MED-DYN", 
        "LAW-RULE", "LAW-PREC", "ENG-PHYS", "ENG-ELEC", 
        "SCI-MATH", "SCI-DATA", "HIST-TIME", "HIST-TREND"
    ] = Field(default="CS-CODE")

class BatchSchema(BaseModel):
    id: int
    notes: List[str]
    type: Literal["atomic", "pq", "hub"]

class SovereignPlan(BaseModel):
    course: str
    semester: str
    unit: str
    hub_title: str
    primary_language: str = Field(default="General")
    hub_note: NoteSchema
    atomic_notes: List[AtomicNoteSchema]
    possible_questions: List[NoteSchema]
    batches: List[BatchSchema] = Field(default_factory=list)

class PartialPlan(BaseModel):
    atomic_notes: List[AtomicNoteSchema]
    possible_questions: List[NoteSchema]

class NoteComponents(BaseModel):
    """The Precision Assembler schema."""
    explanation: str = Field(..., description="The ELI5 analogy.")
    deep_dive: str = Field(..., description="500+ words of technical depth.")
    artifact: str = Field(..., description="MANDATORY: Code Block (with backticks) or Table.")
    walkthrough: str = Field(..., description="Step-by-step logic trace of the artifact.")
    the_trap: str = Field(..., description="Exam-grade edge case.")
    search_keywords: List[str] = Field(default_factory=list)

class NoteContent(BaseModel):
    markdown_body: str
    search_keywords: List[str]

class ProbeEnrichment(BaseModel):
    l1_scenario: str
    l2_implementation: str
    l3_debug: str
