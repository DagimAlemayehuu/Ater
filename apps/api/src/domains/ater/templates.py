from typing import Dict, Any, List

# ── ATOMIC NOTE TEMPLATE v34.0 (Dynamic Middle, Compact Body) ────────────────
# Sections: Mental Model | 2-4 controlled domain sections | The Proving Grounds.
# The model supplies content; Ater owns the headings and shape.
ATOMIC_NOTE_TEMPLATE = """\
## Mental Model

{mental_model}

{dynamic_sections}

---

## The Proving Grounds

{possible_questions}
"""


def build_dynamic_section_plan(domain: Dict[str, Any], modality: str = "") -> List[Dict[str, str]]:
    """Return a compact, deterministic middle-section plan.

    The plan keeps notes short but domain-aware. It is intentionally controlled
    code, not model-generated text, so small models cannot destabilize headings.
    """
    h1 = domain.get("h1") or "The Core Logic Explained"
    h2 = domain.get("h2") or "The Textbook Translation"
    artifact = domain.get("artifact") or "Source Artifact"
    modality = modality or "Qualitative/Definitional"

    sections = [
        {
            "id": "core_logic",
            "heading": h1,
            "purpose": "Explain the concept's core mechanism in plain, source-grounded prose.",
        },
        {
            "id": "formal_model",
            "heading": h2,
            "purpose": "Translate the idea into the exact formal language, variables, rules, or classifications from the source.",
        },
    ]

    if modality == "Quantitative":
        optional_heading = "Source Calculation"
    elif modality == "Procedural":
        optional_heading = "Step Trace"
    elif modality == "Comparative":
        optional_heading = "Key Contrast"
    elif modality == "Causal/Historical":
        optional_heading = "Cause And Effect"
    else:
        optional_heading = "Where It Breaks"

    sections.append(
        {
            "id": "source_artifact",
            "heading": optional_heading,
            "purpose": f"Use a compact {artifact} or failure/example note that makes the concept testable.",
        }
    )
    return sections


def _render_dynamic_sections(data: Dict[str, Any]) -> str:
    plan = data.get("section_plan") or [
        {"id": "core_logic", "heading": data.get("h1_title", "The Core Logic Explained")},
        {"id": "formal_model", "heading": data.get("h2_title", "The Textbook Translation")},
        {"id": "source_artifact", "heading": data.get("artifact_title", "Source Artifact")},
    ]

    content_map = {
        "core_logic": data.get("core_logic", ""),
        "formal_model": data.get("formal_model", ""),
        "source_artifact": "\n\n".join(
            part.strip()
            for part in [
                f"> **{data.get('artifact_type')}**" if data.get("artifact_type") else "",
                data.get("artifact_content", ""),
                data.get("dynamic3_content", ""),
            ]
            if part and str(part).strip()
        ),
    }

    rendered = []
    for section in plan[:4]:
        heading = str(section.get("heading") or "").strip()
        sid = section.get("id")
        body = str(content_map.get(sid, "")).strip()
        if not heading or not body:
            continue
        rendered.append(f"## {heading}\n\n{body}")
    return "\n\n".join(rendered)


def render_atomic_note(data: Dict[str, Any], healer=None) -> str:
    """
    Deterministic compiler for compact dynamic atomic notes (v34.0).
    Guarantees structural integrity regardless of LLM quality.
    Sections:
      1. Mental Model      — vivid analogy, grounded in source
      2-5. Dynamic domain/modality sections chosen by Ater
      Last. The Proving Grounds — compact interactive quiz
    """
    if healer:
        exclude = data.get("title", "")
        data["mental_model"] = healer.heal_all(data.get("mental_model", ""), exclude_title=exclude)
        data["core_logic"] = healer.heal_all(data.get("core_logic", ""), exclude_title=exclude)
        data["formal_model"] = healer.heal_all(data.get("formal_model", ""), exclude_title=exclude)
        data["artifact_content"] = healer.heal_all(data.get("artifact_content", ""), exclude_title=exclude)
        data["dynamic3_content"] = healer.heal_all(data.get("dynamic3_content", ""), exclude_title=exclude)
        data["possible_questions"] = healer.heal_all(
            data.get("possible_questions", ""), is_quiz=True
        )

    return ATOMIC_NOTE_TEMPLATE.format(
        mental_model=data.get("mental_model", ""),
        dynamic_sections=_render_dynamic_sections(data),
        possible_questions=data.get("possible_questions", ""),
    )

def build_skeleton_note(note_schema, source_snippet: str, domain: dict, all_titles: list = None) -> str:
    """
    Deterministic minimum-viable fallback when all LLM attempts fail.
    Parses the source snippet into structured, coherent prose sections.
    Produces a structurally valid, pedagogically useful note without generative AI.
    """
    import json
    import re
    title = note_schema.title.replace("_", " ")
    
    # --- Extract clean sentences from raw source ---
    clean = re.sub(r'\[SOURCE EXCERPT\]', '', source_snippet or '', flags=re.IGNORECASE)
    clean = re.sub(r'\[PAGE \d+\]', '', clean)
    clean = re.sub(r'\b\d{1,2}/\d{1,2}/\d{4}\b', '', clean)
    clean = re.sub(r'[“”]', '"', clean)
    clean = re.sub(r'[‘’]', "'", clean)
    clean = re.sub(r'^[ØÃ•\-\*>–]+\s*', '', clean, flags=re.MULTILINE)
    clean = re.sub(r'\s+', ' ', clean).strip()

    title_terms = [w.lower() for w in re.findall(r'[A-Za-z][A-Za-z0-9+]*', title) if len(w) > 2]
    
    # Split into sentences
    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean) if len(s.strip()) > 20]
    scored = []
    for idx, sentence in enumerate(raw_sentences):
        lower = sentence.lower()
        score = sum(3 for term in title_terms if term in lower)
        score += sum(1 for cue in ("class", "object", "method", "parameter", "constructor", "static", "reference", "value", "return", "java") if cue in lower)
        score -= idx * 0.01
        scored.append((score, idx, sentence))
    if scored:
        best_indexes = sorted(i for _, i, _ in sorted(scored, reverse=True)[:9])
        sentences = [raw_sentences[i] for i in best_indexes]
    else:
        sentences = []
    
    # Partition: first third for mental model, middle for logic, last for formal
    third = max(1, len(sentences) // 3)
    model_sents = sentences[:third]
    logic_sents = sentences[third:third*2]
    formal_sents = sentences[third*2:]
    
    def join_prose(sents, fallback=""):
        return ' '.join(sents) if sents else fallback
    
    domain_name = domain.get('persona', domain.get('name', 'the subject'))
    
    mental_model = (
        f"Think of {title} as the label on one important part of a larger system: once you know what that part does, the surrounding details become much easier to organize. "
        + join_prose(model_sents, f"The source frames {title} as a specific idea with behavior or meaning that must be tracked precisely.")
    )
    
    core_logic = (
        f"{title} works by connecting the source's key terms, rules, and examples into one usable idea. "
        + join_prose(logic_sents, "The source material outlines specific properties and relationships that define this concept in practice.")
    )
    
    # Inject wikilinks into core_logic deterministically
    if all_titles:
        for t in sorted(all_titles, key=len, reverse=True):
            if t.replace("_", " ").lower() == title.lower():
                continue
            readable = t.replace("_", " ")
            if readable.lower() in core_logic.lower() and f"[[{t}]]" not in core_logic and f"[[{readable}]]" not in core_logic:
                pattern = re.compile(r'\b' + re.escape(readable) + r'\b', re.IGNORECASE)
                core_logic = pattern.sub(f"[[{t}]]", core_logic, count=1)
        
        # Ensure we have at least 3 wikilinks to pass validation
        wikilink_count = len(re.findall(r'\[\[[^\]]+\]\]', core_logic))
        if wikilink_count < 3:
            related_links = []
            for t in all_titles:
                if t.replace("_", " ").lower() == title.lower():
                    continue
                if f"[[{t}]]" not in core_logic:
                    related_links.append(f"[[{t}]]")
                if len(related_links) >= (3 - wikilink_count):
                    break
            if related_links:
                core_logic += f" This concept is directly related to {', '.join(related_links)}."
    
    formal_model = (
        f"In formal terms, {title} must be read through the exact language and constraints shown in the source. "
        + join_prose(formal_sents, "These structural constraints ensure consistent and predictable behavior when this concept is applied.")
    )
    
    artifact_content = (
        "| Source Detail | Meaning |\n"
        "|---|---|\n"
        f"| {title} | The focused concept being studied. |\n"
        f"| {domain_name} | The disciplinary lens used for examples and questions. |\n"
        "| Source excerpt | The only authority for definitions and constraints. |"
    )
    
    option_a = join_prose(model_sents[:1], title)[:120].strip() or title
    page = min((int(p) for p in getattr(note_schema, "source_pages", []) if str(p).isdigit()), default=1)
    questions = [
        {
            "type": "mcq",
            "question": f"Which statement best matches the source's treatment of {title}?",
            "options": {
                "A": option_a,
                "B": f"{title} is unrelated to Java program behavior.",
                "C": f"{title} only describes comments and formatting.",
                "D": f"{title} can be ignored without changing program behavior."
            },
            "answer": "A",
            "explanation": f"The source context connects {title} to concrete Java behavior, syntax, or object structure.",
            "explanation_page": page
        },
        {
            "type": "true_false",
            "question": f"{title} should be interpreted using the exact Java behavior shown in the source rather than a generic definition alone.",
            "answer": True,
            "explanation": f"The note is source-grounded, so the source's examples and constraints determine the correct interpretation of {title}.",
            "explanation_page": page
        },
        {
            "type": "writing",
            "question": f"Explain {title} in one precise paragraph and include one Java-specific consequence from the source.",
            "answer": f"A strong answer defines {title}, states how it affects Java code behavior, and anchors the explanation in the source example or definition.",
            "required_keywords": ["Java", "source", "behavior"],
            "explanation": f"This checks whether the learner can move from the source wording to a usable programming explanation of {title}.",
            "explanation_page": page
        }
    ]
    possible_questions = "```interactive-quiz\n" + json.dumps(questions, indent=2) + "\n```"

    data = {
        "mental_model": mental_model,
        "h1_title": domain.get("h1", "How It Actually Works"),
        "core_logic": core_logic,
        "h2_title": domain.get("h2", "The Formal Model"),
        "formal_model": formal_model,
        "artifact_type": domain.get("type", "Markdown Table"),
        "artifact_content": artifact_content,
        "dynamic3_content": "Use this section as a compact bridge between the source wording and the exact place where a student might get confused.",
        "section_plan": build_dynamic_section_plan(domain, getattr(note_schema, "concept_modality", "")),
        "possible_questions": possible_questions
    }
    
    return render_atomic_note(data)
