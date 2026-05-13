from typing import Dict, Any

ATOMIC_NOTE_TEMPLATE = """
## 1. The Plain English Explanation
{plain_english_explanation}

## 2. {h1_title}
{detailed_breakdown}

## 3. {h2_title}
{academic_translation}

## 4. {artifact_title}
{artifact_content}

## 5. Where It Breaks (Edge Cases & Flaws)
{limitations}

---
## 6. The Proving Grounds
{possible_questions}
"""

def render_atomic_note(data: Dict[str, Any], healer=None) -> str:
    """
    Deterministically renders the atomic note using a Python template.
    Guarantees structural integrity regardless of LLM quality.
    If a healer is provided, it performs self-healing (wikilinks, math, prose).
    """
    
    # Pre-heal the individual parts if healer is present
    if healer:
        data["plain_english_explanation"] = healer.heal_all(data.get("plain_english_explanation", ""))
        data["detailed_breakdown"] = healer.heal_all(data.get("detailed_breakdown", ""))
        data["academic_translation"] = healer.heal_all(data.get("academic_translation", ""))
        data["artifact_content"] = healer.heal_all(data.get("artifact_content", ""))
        data["limitations"] = healer.heal_all(data.get("limitations", ""))
        data["possible_questions"] = healer.heal_all(data.get("possible_questions", ""), is_quiz=True)

    return ATOMIC_NOTE_TEMPLATE.format(
        plain_english_explanation=data.get("plain_english_explanation", ""),
        h1_title=data.get("h1_title", "The Core Logic Explained"),
        detailed_breakdown=data.get("detailed_breakdown", ""),
        h2_title=data.get("h2_title", "The Textbook Translation"),
        academic_translation=data.get("academic_translation", ""),
        artifact_title=data.get("artifact_title", "High-Fidelity Artifact"),
        artifact_content=data.get("artifact_content", ""),
        limitations=data.get("limitations", ""),
        possible_questions=data.get("possible_questions", "")
    )
