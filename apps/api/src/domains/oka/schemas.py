from pydantic import BaseModel, Field, field_validator, ValidationInfo
from typing import List, Dict, Optional, Union, Literal, Any, Annotated

class AdvancedPracticeConfig(BaseModel):
    hubId: str
    selectedAtomicNotes: List[str] = Field(default_factory=list)
    timeBoundDays: Optional[int] = None
    prioritizeWeaknesses: bool = False
    questionDistribution: Dict[str, int] = Field(default_factory=lambda: {
        "mcq": 1, "true_false": 1, "writing": 1, "fill_in": 1,
        "matching": 1, "order": 1, "debug": 1, "synthesis": 1, "trace": 1,
        "calculation": 1, "data_analysis": 1, "scenario": 1, "code": 1
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
    id: Optional[int] = None
    type: str
    difficulty: str = Field(default="L1", description="Conceptual depth (L1-L3).")
    question: str
    explanation: str = Field(default="Analysis complete.", description="Step-by-step logic.")
    hints: List[str] = Field(default_factory=list)
    required_keywords: List[str] = Field(default_factory=list)
    content: str = ""
    text_with_blanks: str = ""
    answer: Any = "" # Base answer field, refined in subclasses

    @field_validator('explanation', check_fields=False)
    @classmethod
    def check_punctuation(cls, v: str) -> str:
        v = v.strip()
        if not v.endswith(('.', '!', '?', '"', "'")):
            v += "."
        return v

    @field_validator('answer', mode='after', check_fields=False)
    @classmethod
    def clean_answer_string(cls, v: str, info: ValidationInfo) -> str:
        q_type = info.data.get('type')
        if q_type == 'trace':
            if "=" in v and len(v) > 15:
                raise ValueError("Trace answers MUST NOT contain scratchpad math. Only output the final number or final short equation (e.g., 'Qd = 100').")
        return v

class MCQQuestion(BaseQuestion):
    type: Literal["mcq"]
    options: Dict[str, str]
    answer: str

class TrueFalseQuestion(BaseQuestion):
    type: Literal["true_false"]
    answer: Union[str, bool]

class WritingQuestion(BaseQuestion):
    type: Literal["writing"]
    answer: str

class ScenarioQuestion(BaseQuestion):
    type: Literal["scenario"]
    answer: str

class CodeQuestion(BaseQuestion):
    type: Literal["code"]
    codeSnippet: str
    answer: str
    language: str

class FillInQuestion(BaseQuestion):
    type: Literal["fill_in"]
    answer: Union[str, List[str]]

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
    answer: str = "See pairs for correct matching."

class OrderQuestion(BaseQuestion):
    type: Literal["order"]
    steps: List[str]
    answer: List[str]

    @field_validator('answer', 'steps', mode='before')
    @classmethod
    def ensure_list(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(',') if s.strip()]
        return v

class DebugQuestion(BaseQuestion):
    type: Literal["debug"]
    content: str
    answer: str

class SynthesisQuestion(BaseQuestion):
    type: Literal["synthesis"]
    answer: str

class CalculationQuestion(BaseQuestion):
    type: Literal["calculation"]
    content: str
    answer: str

class DataAnalysisQuestion(BaseQuestion):
    type: Literal["data_analysis"]
    content: str
    answer: str

class TraceQuestion(BaseQuestion):
    type: Literal["trace"]
    content: str
    answer: str

Question = Annotated[
    Union[
        MCQQuestion, TrueFalseQuestion, WritingQuestion, ScenarioQuestion,
        CodeQuestion, FillInQuestion, FindErrorQuestion, MatchingQuestion,
        OrderQuestion, DebugQuestion, SynthesisQuestion, TraceQuestion,
        CalculationQuestion, DataAnalysisQuestion
    ],
    Field(discriminator='type')
]

class PracticeBatch(BaseModel):
    questions: List[Question]

class PracticeSessionResponse(BaseModel):
    session_id: str
    questions: List[Question]
    quiz_path: str

class ContextBriefing(BaseModel):
    summary: str = Field(..., description="One-paragraph executive summary of the entire document.")
    keywords: List[str] = Field(..., description="20 most important, high-signal keywords.")
    primary_discipline: str = Field(..., description="Primary academic discipline.")
    secondary_disciplines: List[str] = Field(default_factory=list, description="Up to two secondary disciplines.")

# --- Sovereign Architect Schemas ---

class NoteSchema(BaseModel):
    title: str = Field(..., description="Sanitized Title_Case_With_Underscores filename.")
    description: str = Field(..., description="One sentence summary.")
    source_context: Optional[str] = Field(default="No context extracted.", description="Raw text relevant to this topic.")
    source_pages: List[int] = Field(default_factory=list, description="Page numbers where context was found.")

from .taxonomy import CANONICAL_TAXONOMY

def get_all_domain_keys() -> List[str]:
    """Flattens the canonical taxonomy into a single list of all valid domain keys."""
    keys = ["DOMAIN-UNKNOWN", "ACADEMIC-GENERAL"]
    for category in CANONICAL_TAXONOMY.values():
        for sub_category in category.values():
            keys.extend(sub_category)
    return list(set(keys)) # Ensure uniqueness

# Dynamically create the Literal type from the single source of truth
VALID_MODES_LITERAL = Literal[tuple(get_all_domain_keys())]

class AtomicNoteSchema(NoteSchema):
    prerequisites: List[str] = Field(default_factory=list)
    concept_modality: Literal[
        "Quantitative",
        "Qualitative/Definitional",
        "Procedural",
        "Comparative",
        "Causal/Historical"
    ] = Field(default="Qualitative/Definitional", description="The epistemic nature of the concept.")
    mode: str = Field(default="ACADEMIC-GENERAL")
class BatchSchema(BaseModel):
    id: int
    notes: List[str]
    type: Literal["atomic", "pq", "hub"]

class SovereignPlan(BaseModel):
    course: str
    semester: str
    unit: str
    hub_title: str
    course_title: Optional[str] = "Unknown"
    academic_level: Optional[str] = "Unknown"
    epistemic_stance: Optional[str] = "Unknown"
    primary_language: str = Field(default="General")
    hub_note: NoteSchema
    atomic_notes: List[AtomicNoteSchema]
    possible_questions: List[NoteSchema]
    batches: List[BatchSchema] = Field(default_factory=list)
    anchored_hub_id: Optional[str] = None
    context_briefing: Optional[ContextBriefing] = None

class PartialPlan(BaseModel):
    course_title: Optional[str] = "Unknown"
    academic_level: Optional[str] = "Unknown"
    epistemic_stance: Optional[str] = "Unknown"
    atomic_notes: List[AtomicNoteSchema]
    possible_questions: List[NoteSchema]
    context_briefing: Optional[ContextBriefing] = None

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

# --- Generation-Specific Models for Structured Output (v28.0 Universal Engine) ---

class TheoryResponse(BaseModel):
    mental_model: str = Field(..., description="Minimum 5 sentences. Explain using a simple, physical real-world scenario (e.g., a coffee shop, a moving train, a hospital triage). DO NOT use advanced academic jargon. DO NOT mention charts or math here.")
    theory_prose: str = Field(..., description="Minimum 6 sentences. YOU MUST EXPLICITLY EXTRACT AND STATE THE CORE FACTS, LISTS, OR ENUMERATIONS PRESENT IN THE SOURCE EXCERPT. Define the concept academically based on these raw facts. DO NOT use bullet points. YOU MUST INCLUDE EXACTLY 3 TO 5 [[Wikilinks]] IN THIS TEXT. IF YOU INCLUDE 2 OR FEWER, THE SYSTEM WILL CRASH. Wrap critical domain vocabulary in double brackets (e.g., [[Market_Equilibrium]]). THIS IS A STRICT SYSTEM REQUIREMENT.")
    key_takeaways: List[str] = Field(..., min_length=3, max_length=3, description="An array of EXACTLY 3 distinct strings. DO NOT output a single block of text.")
    limitations: str = Field(..., description="Minimum 5 sentences. Analyze edge cases, exceptions, and limitations. DO NOT output placeholder text.")

class PractitionerResponse(BaseModel):
    primary_equation_or_logic: str = Field(..., description="GENERATE THIS FIRST. If computational, write the exact LaTeX equation. If theoretical/code, state the core logical rule or function signature.")
    artifact: str = Field(..., description="GENERATE THIS SECOND. MUST be valid Markdown. MUST contain a fully populated Markdown table with a header row AND at least 3 rows of numerical data. Generating a header row without data rows is STRICTLY FORBIDDEN. If a table, MUST have outer pipes (e.g., | X | Y |). If code, use a markdown code block. MUST strictly use the logic defined in primary_equation_or_logic.")
    walkthrough: List[str] = Field(..., min_length=3, description="An array of EXACTLY 3-7 numbered steps. MUST execute a step-by-step breakdown using the exact data from the artifact. You MUST explicitly write out the arithmetic sub-operations. DO NOT just say 'which results in 10'. You MUST write '130 - 120 = 10'. Make the math visible. You MUST use the EXACT SAME equation and numbers generated in the Artifact table. DO NOT generate Markdown tables inside this field; if you need to reference data, use text only. Introduction of new equations is FORBIDDEN.")

class QuizResponse(BaseModel):
    questions: List[Question] = Field(..., min_length=1, max_length=5)
