from typing import Dict, Any

ATOMIC_NOTE_TEMPLATE = """
## 1. Mental Model
{mental_model}

## 2. {h1_title}
{technical_definition}

## 3. Limitations & Edge Cases
{limitations}

## 4. {artifact_title}
{artifact_content}

## 5. Walkthrough
{walkthrough}

---
## Review & Practice
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
        data["mental_model"] = healer.heal_all(data.get("mental_model", ""))
        data["technical_definition"] = healer.heal_all(data.get("technical_definition", ""))
        data["limitations"] = healer.heal_all(data.get("limitations", ""))
        data["artifact_content"] = healer.verify_arithmetic(data.get("artifact_content", ""))
        data["walkthrough"] = healer.heal_all(data.get("walkthrough", ""))
        data["possible_questions"] = healer.heal_all(data.get("possible_questions", ""), is_quiz=True)

    return ATOMIC_NOTE_TEMPLATE.format(
        mental_model=data.get("mental_model", ""),
        h1_title=data.get("h1_title", "Technical Architecture"),
        technical_definition=data.get("technical_definition", ""),
        limitations=data.get("limitations", ""),
        artifact_title=data.get("artifact_title", "High-Fidelity Artifact"),
        artifact_content=data.get("artifact_content", ""),
        walkthrough=data.get("walkthrough", ""),
        possible_questions=data.get("possible_questions", "")
    )
