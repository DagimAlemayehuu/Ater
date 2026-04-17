from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Literal

class AdvancedPracticeConfig(BaseModel):
    # 1. Context Mapping
    hubId: str
    selectedAtomicNotes: List[str] = Field(default_factory=list)
    exclusionKeywords: List[str] = Field(default_factory=list)
    timeBoundDays: Optional[int] = None
    prioritizeWeaknesses: bool = False

    # 2. Modalities
    questionDistribution: Dict[str, int] = Field(default_factory=lambda: {
        "multipleChoice": 0,
        "trueFalse": 0,
        "shortAnswer": 0,
        "scenario": 0,
        "codeImplementation": 0,
        "clozeDeletion": 0,
        "findTheError": 0,
        "matchingMatrix": 0
    })

    # 3. Cognitive Constraints
    difficulty: Literal["L0", "L1", "L2", "L3", "L4", "Mixed"] = "L1"
    distractorPlausibility: Literal["Low", "Medium", "High"] = "Medium"
    injectTrickAnswers: bool = False

    # 4. Temporal Dynamics
    globalTimeLimitMinutes: Optional[int] = None
    perQuestionTimeLimitSeconds: Optional[int] = None
    progressionGatekeeper: bool = False

    # 5. AI Behaviors
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
    MCQQuestion, 
    TrueFalseQuestion, 
    ShortAnswerQuestion, 
    ScenarioQuestion, 
    CodeQuestion, 
    ClozeQuestion, 
    FindErrorQuestion, 
    MatchingQuestion
]

class PracticeBatch(BaseModel):
    questions: List[Question]

class PracticeSessionResponse(BaseModel):
    session_id: str
    questions: List[Question]
    quiz_path: str
