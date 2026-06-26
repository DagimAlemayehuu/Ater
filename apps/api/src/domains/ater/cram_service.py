from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class CramPhase(str, Enum):
    orientation = "orientation"
    high_yield = "high_yield"
    active_recall = "active_recall"
    mistake_repair = "mistake_repair"
    final_review = "final_review"

class CramPriorityItem(BaseModel):
    note_path: str
    concept: str
    priority_score: float
    why_selected: str
    source_signals: Dict[str, Any]
    recommended_question_types: List[str]

class CramSessionPlan(BaseModel):
    session_id: str
    topic: str
    total_minutes: int
    started_at: float
    mode: str = "cram"
    current_phase: CramPhase
    phases: List[str] = [p.value for p in CramPhase]
    selected_notes: List[str]
    priority_items: List[CramPriorityItem]
    weak_spots: List[str]
    question_mix: List[str]
    time_allocations: Dict[str, float]
    rescue_mode_threshold_seconds: int
    rescue_mode_active: bool = False
    exit_check: Dict[str, Any] = Field(default_factory=dict)

import math

def calculate_weakness_score(
    diagnostic_incorrect: bool = False,
    diagnostic_taken: bool = False,
    incorrect_count_7d: int = 0,
    high_confidence_mistakes: int = 0,
    fsrs_retrievability: Optional[float] = None,
    yield_weight: Optional[float] = None,
    hours_since_last_mistake: Optional[float] = None
) -> float:
    # Fallbacks and defaults
    if fsrs_retrievability is None:
        fsrs_retrievability = 0.70
    if yield_weight is None:
        yield_weight = 0.50
        
    D = 1 if diagnostic_incorrect or not diagnostic_taken else 0
    E = incorrect_count_7d
    M = high_confidence_mistakes
    R = fsrs_retrievability
    Y = yield_weight
    T = hours_since_last_mistake if hours_since_last_mistake is not None else 0
    
    # Weights
    W_D = 20.0
    W_E = 2.0
    W_M = 5.0
    W_R = 20.0
    W_Y = 10.0
    
    score = (W_D * D) + (W_E * E) + (W_M * M) + (W_R * (1.0 - R)) + (W_Y * Y)
    
    if hours_since_last_mistake is not None:
        decay = math.exp(-0.05 * T)
        score *= decay # Apply recency decay multiplicatively, or linearly?
        # Spec says: - W_T * T. Let's use linear penalty.
        W_T = 0.1
        score = max(0.0, score - (W_T * T))
        
    return score


def calculate_phase_allocations(
    total_minutes: int, 
    diagnostic_score: float = 1.0
) -> Dict[str, float]:
    """
    Default: 10% Orientation, 20% High-Yield, 50% Active Recall, 20% Mistake Repair.
    Compression for <= 15m: 0% Orientation, 20% High-Yield, 60% Active Recall, 20% Mistake Repair.
    Performance Adaptivity: If diagnostic score < 0.50, reduce High-Yield breadth, allocate more to Active Recall.
    """
    if total_minutes <= 15:
        # Compression rules
        allocations = {
            CramPhase.orientation.value: 0.0,
            CramPhase.high_yield.value: total_minutes * 0.20,
            CramPhase.active_recall.value: total_minutes * 0.60,
            CramPhase.mistake_repair.value: total_minutes * 0.20,
            CramPhase.final_review.value: 0.0
        }
    else:
        # Default rules
        allocations = {
            CramPhase.orientation.value: total_minutes * 0.10,
            CramPhase.high_yield.value: total_minutes * 0.20,
            CramPhase.active_recall.value: total_minutes * 0.50,
            CramPhase.mistake_repair.value: total_minutes * 0.20,
            CramPhase.final_review.value: 0.0
        }

    # Performance Adaptivity
    if diagnostic_score < 0.50:
        # Reduce high-yield by half, add to active recall
        shift = allocations[CramPhase.high_yield.value] * 0.5
        allocations[CramPhase.high_yield.value] -= shift
        allocations[CramPhase.active_recall.value] += shift

    return allocations

def check_rescue_mode(remaining_minutes: float, total_minutes: int) -> bool:
    """
    Rescue mode trigger: when remaining time falls below 15% of total budget or under 5 minutes.
    """
    max(5.0, total_minutes * 0.15)
    # Actually, the spec says: "below 15% of the total budget (or under 5 minutes)". 
    # Usually this means `remaining < 0.15 * total OR remaining < 5`.
    return remaining_minutes < (total_minutes * 0.15) or remaining_minutes < 5.0

def filter_question_mix(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Prioritize rapid recall (short answer, trace, find error).
    Minimize open-ended writing questions unless essential.
    """
    prioritized = []
    writing = []
    for q in questions:
        q_type = q.get("type", "multiple-choice").lower()
        if q_type in ["short-answer", "trace", "find-error", "multiple-choice", "true-false"]:
            prioritized.append(q)
        else:
            writing.append(q)
    # Return prioritized first, followed by at most 1 writing question
    return prioritized + writing[:1]
