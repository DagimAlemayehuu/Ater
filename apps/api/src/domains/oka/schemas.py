from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Literal

class AdvancedPracticeConfig(BaseModel):
    hubId: str
    selectedAtomicNotes: List[str] = Field(default_factory=list)
    timeBoundDays: Optional[int] = None
    prioritizeWeaknesses: bool = False
    questionDistribution: Dict[str, int] = Field(default_factory=lambda: {
        "mcq": 0, "true_false": 0, "writing": 0, "fill_in": 0,
        "matching": 0, "order": 0, "debug": 0, "synthesis": 0, "trace": 0
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
    required_keywords: List[str] = Field(default_factory=list)

class TrueFalseQuestion(BaseQuestion):
    type: Literal["true_false"]
    answer: Union[str, bool]

class WritingQuestion(BaseQuestion):
    type: Literal["writing"]
    answer: str
    required_keywords: List[str] = Field(default_factory=list)

class ScenarioQuestion(BaseQuestion):
    type: Literal["scenario"]
    answer: str
    required_keywords: List[str] = Field(default_factory=list)

class CodeQuestion(BaseQuestion):
    type: Literal["code"]
    codeSnippet: str
    answer: str
    required_keywords: List[str] = Field(default_factory=list)
    language: str

class FillInQuestion(BaseQuestion):
    type: Literal["fill_in"]
    textWithBlanks: str
    answer: List[str]

class FindErrorQuestion(BaseQuestion):
    type: Literal["find_error"]
    buggyCode: str
    answer: str
    required_keywords: List[str] = Field(default_factory=list)

class MatchingPair(BaseModel):
    left: str
    right: str

class MatchingQuestion(BaseQuestion):
    type: Literal["matching"]
    pairs: List[MatchingPair]

class OrderQuestion(BaseQuestion):
    type: Literal["order"]
    steps: List[str]
    answer: List[str]

class DebugQuestion(BaseQuestion):
    type: Literal["debug"]
    content: str
    answer: str
    required_keywords: List[str] = Field(default_factory=list)

class SynthesisQuestion(BaseQuestion):
    type: Literal["synthesis"]
    answer: str
    required_keywords: List[str] = Field(default_factory=list)

class TraceQuestion(BaseQuestion):
    type: Literal["trace"]
    content: str
    answer: str

Question = Union[
    MCQQuestion, TrueFalseQuestion, WritingQuestion, FillInQuestion,
    MatchingQuestion, OrderQuestion, DebugQuestion, SynthesisQuestion,
    TraceQuestion
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
        "CS-SOFTWARE", "CS-SYSTEMS", "CS-DB", "CS-AI", "CS-TESTING", "CS-ARCH", "CS-REQUIREMENTS",
        "MATH-PURE", "MATH-DISCRETE", "MATH-STAT", "MATH-CRYPTO",
        "PHYSICS-KINEMATICS", "CHEMISTRY", "BIOLOGY",
        "ENG-MECH", "ENG-ELEC", "MED-PHYSIO", "MED-PHARMA",
        "ECON-MACRO", "ECON-FINANCE", "BIZ-STRATEGY",
        "LAW-CASE", "LAW-CONTRACT", "HIST-CATALYST",
        "PHILOSOPHY", "PSYCH-SOCIOLOGY", "LANG-LINGUISTICS",
        "LANG-LIT", "ARTS-DESIGN", "SKILLS-HARD", "SKILLS-FITNESS",
        "EDUCATION", "RESEARCH-METHODS"
    ] = Field(default="CS-SOFTWARE")
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
    anchored_hub_id: Optional[str] = None

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
    worked_example: str
    interactive_quiz: str
