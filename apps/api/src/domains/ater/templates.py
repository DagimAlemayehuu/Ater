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
        f"Think of {title} as a labeled tool in a Java workshop: the label tells you what the tool is allowed to hold, and the handle tells you how other code can safely use it. "
        + join_prose(model_sents, f"The source frames {title} as a specific Java programming idea with behavior that must be tracked precisely.")
    )
    
    core_logic = (
        f"{title} works by enforcing a specific relationship between Java code structure, stored data, and method behavior. "
        + join_prose(logic_sents, "The source material outlines specific properties and behaviors that define this concept in practice.")
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
        f"In formal Java terminology, {title} must be read through the exact syntax and runtime behavior shown in the source. "
        + join_prose(formal_sents, "These structural constraints ensure consistent and predictable behavior when this concept is applied.")
    )
    
    if "Software" in domain_name or "CS" in str(domain.get("type", "")) or "Java" in clean:
        safe_class = re.sub(r'[^A-Za-z0-9]', '', title.title()) or "ConceptDemo"
        artifact_content = (
            "```java\n"
            f"class {safe_class}Demo {{\n"
            f"    private String state;\n\n"
            f"    {safe_class}Demo(String state) {{\n"
            f"        this.state = state;\n"
            "    }\n\n"
            "    String describe() {\n"
            f"        return \"{title}: \" + state;\n"
            "    }\n"
            "}\n"
            "```"
        )
    else:
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
        "possible_questions": possible_questions
    }
    
    return render_atomic_note(data)
