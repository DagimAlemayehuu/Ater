from typing import Dict, Any

# ── ATOMIC NOTE TEMPLATE v33.0 (4-Section, Token-Efficient) ──────────────────
# Sections: Mental Model | Domain H1 | Domain H2 + Artifact | Proving Grounds
# Removed from body: Walkthrough, Edge Cases, Misconceptions → offloaded to AI Chat (Layer 3)
ATOMIC_NOTE_TEMPLATE = """\
## Mental Model

{mental_model}

## {h1_title}

{core_logic}

## {h2_title}

{formal_model}

{artifact_label}

{artifact_content}

---

## The Proving Grounds

{possible_questions}
"""


def render_atomic_note(data: Dict[str, Any], healer=None) -> str:
    """
    Deterministic compiler for 4-section atomic notes (v33.0).
    Guarantees structural integrity regardless of LLM quality.
    Sections:
      1. Mental Model      — vivid analogy, grounded in source
      2. {domain.h1}       — core mechanism, continuous prose + wikilinks
      3. {domain.h2}       — formal model / constraints + domain artifact
      4. The Proving Grounds — 3-question interactive quiz
    Walkthrough, Edge Cases, and Misconceptions are offloaded to AiSidecar (Layer 3).
    """
    if healer:
        data["mental_model"] = healer.heal_all(data.get("mental_model", ""))
        data["core_logic"] = healer.heal_all(data.get("core_logic", ""))
        data["formal_model"] = healer.heal_all(data.get("formal_model", ""))
        data["artifact_content"] = healer.heal_all(data.get("artifact_content", ""))
        data["possible_questions"] = healer.heal_all(
            data.get("possible_questions", ""), is_quiz=True
        )

    # Artifact label: show artifact type inline before the block
    artifact_type = data.get("artifact_type", "")
    artifact_label = f"> **{artifact_type}**" if artifact_type else ""

    return ATOMIC_NOTE_TEMPLATE.format(
        mental_model=data.get("mental_model", ""),
        h1_title=data.get("h1_title", "How It Actually Works"),
        core_logic=data.get("core_logic", ""),
        h2_title=data.get("h2_title", "The Formal Model"),
        formal_model=data.get("formal_model", ""),
        artifact_label=artifact_label,
        artifact_content=data.get("artifact_content", ""),
        possible_questions=data.get("possible_questions", ""),
    )
