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
    # Enforce Java Code Blocks in CS-SOFTWARE Modality
    mode = data.get("mode") or ""
    artifact_content = data.get("artifact_content", "")
    if mode == "CS-SOFTWARE" and artifact_content:
        stripped = artifact_content.strip()
        if not (stripped.startswith("```") and stripped.endswith("```")):
            is_table = stripped.startswith("|") or ("|---|---|" in stripped) or (stripped.count("|") > 4 and "\n" in stripped)
            is_mermaid = stripped.startswith("graph ") or stripped.startswith("flowchart ") or stripped.startswith("```mermaid")
            if not is_table and not is_mermaid:
                artifact_content = f"```java\n{stripped}\n```"
                data["artifact_content"] = artifact_content
                if "Table" in str(data.get("artifact_type", "")) or not data.get("artifact_type"):
                    data["artifact_type"] = "Executable Java Code Block"

    # We want exactly two dynamic sections: H1 (core_logic) and H2 (formal_model).
    # We merge the source_artifact content directly into formal_model to preserve the 4-section H2 limit.
    h1_heading = data.get("h1_title") or "The Core Logic Explained"
    h2_heading = data.get("h2_title") or "The Textbook Translation"

    core_logic_body = str(data.get("core_logic", "")).strip()

    # Render the formal model prose
    formal_model_prose = str(data.get("formal_model", "")).strip()

    # Render the source artifact details
    artifact_parts = []
    if data.get("artifact_content"):
        artifact_parts.append(str(data.get("artifact_content")).strip())
    if data.get("dynamic3_content"):
        artifact_parts.append(str(data.get("dynamic3_content")).strip())

    artifact_body = "\n\n".join(part for part in artifact_parts if part)

    # Merge them under H2
    if artifact_body:
        formal_model_body = f"{formal_model_prose}\n\n{artifact_body}".strip()
    else:
        formal_model_body = formal_model_prose

    rendered = []
    if core_logic_body:
        rendered.append(f"## {h1_heading}\n\n{core_logic_body}")
    if formal_model_body:
        rendered.append(f"## {h2_heading}\n\n{formal_model_body}")

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
    Fully domain-agnostic: no CS/software assumptions bleed into non-CS domains.
    """
    import json
    import re
    title = note_schema.title.replace("_", " ")
    class_name = "".join(w.capitalize() for w in re.findall(r'[A-Za-z0-9]+', title))
    if not class_name or class_name[0].isdigit():
        class_name = "Concept" + class_name

    mode = getattr(note_schema, "mode", "ACADEMIC-GENERAL") or "ACADEMIC-GENERAL"
    domain_name = domain.get('persona', domain.get('name', 'the subject'))

    # Determine if we are in a CS/software domain — gates CS-specific scoring and artifacts
    _is_cs_domain = (
        mode.startswith("CS-") or
        any(w in mode.lower() for w in ["software", "systems", "networking", "cybersecurity", "web", "database", "ai", "db", "arch", "testing"]) or
        "software" in str(domain_name).lower() or
        "computer" in str(domain_name).lower()
    )

    # --- Extract clean sentences from raw source ---
    clean = source_snippet or ""
    clean = re.sub(r'(?is)SYSTEM CONSTRAINT FAILURE:.*?\n\n', '', clean)
    clean = re.sub(r'(?is)SYSTEM CONSTRAINT:.*?\n\n', '', clean)
    clean = re.sub(r'(?is)CRITICAL FIX REQUIRED:.*?\n\n', '', clean)
    clean = re.sub(r'(?is)Fix instruction:.*?\n\n', '', clean)
    clean = re.sub(r'(?is)Do NOT repeat the Mental Model.*?\n\n', '', clean)
    clean = re.sub(r'(?i)\b(?:system constraint|critical fix required|fix instruction|previous attempt failed|feynman integrity|integrity fail|mental model)\b.*?\.', '', clean)
    clean = re.sub(r'\[SOURCE EXCERPT\]', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\[[A-Z_]+ SOURCE HINT\]', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'SOURCE HINT:?', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\[PAGE \d+\]', '', clean)
    clean = re.sub(r'\b\d{1,2}/\d{1,2}/\d{4}\b', '', clean)
    clean = re.sub(r'[\u201c\u201d]', '"', clean)
    clean = re.sub(r'[\u2018\u2019]', "'", clean)
    clean = re.sub(r'^[\xd8\xc3\x95\-\*>\u2013]+\s*', '', clean, flags=re.MULTILINE)
    clean = re.sub(r'\s+', ' ', clean).strip()

    title_terms = [w.lower() for w in re.findall(r'[A-Za-z][A-Za-z0-9+]*', title) if len(w) > 2]

    # Split into sentences and score by relevance.
    # CS-specific scoring keywords are ONLY applied when this is a CS domain.
    _CS_SCORE_CUES = ("class", "object", "method", "parameter", "constructor", "static", "reference", "return", "java", "function", "variable")
    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean) if len(s.strip()) > 20]
    scored = []
    for idx, sentence in enumerate(raw_sentences):
        lower = sentence.lower()
        score = sum(3 for term in title_terms if term in lower)
        if _is_cs_domain:
            score += sum(1 for cue in _CS_SCORE_CUES if cue in lower)
        score -= idx * 0.01
        scored.append((score, idx, sentence))
    if scored:
        best_indexes = sorted(i for _, i, _ in sorted(scored, reverse=True)[:9])
        sentences = [raw_sentences[i] for i in best_indexes]
    else:
        sentences = []

    # Pad sentences if we have too few — domain-aware fallback prose
    while len(sentences) < 3:
        if len(sentences) == 0:
            sentences.append(f"The source material frames {title} as a fundamental concept within the scope of {domain_name}.")
        elif len(sentences) == 1:
            sentences.append(f"Understanding {title} is critical for mastering the key definitions and relationships outlined in the source.")
        else:
            sentences.append(f"Further examination of the source demonstrates how {title} interacts with related concepts in this domain.")

    # Partition: first third for mental model, middle for logic, last for formal
    third = max(1, len(sentences) // 3)
    model_sents = sentences[:third]
    logic_sents = sentences[third:third*2]
    formal_sents = sentences[third*2:]

    def join_prose(sents, fallback=""):
        return ' '.join(sents) if sents else fallback

    first_sent = join_prose(model_sents[:1], "This operates as a core building block of the domain.")

    # ── DOMAIN-AWARE ANALOGY ENGINE ──────────────────────────────────────────
    # Covers all major domain groups. Falls back to a universal grammar metaphor.
    if mode == "EDUCATION" or "inclusive" in str(domain_name).lower() or "educator" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as the ramp and accessible entrance of a public building.** "
            f"A building with only stairs is technically 'open' but inaccessible to many. **{title}** is the design decision "
            f"that ensures everyone — regardless of ability or background — can enter the same front door. {first_sent} "
            f"Just as removing barriers requires deliberate architectural planning and stakeholder coordination, "
            f"achieving {title} requires proactive policy, adapted resources, and collaborative effort from all participants."
        )
    elif mode == "SOC-INT-RELATIONS" or any(w in str(domain_name).lower() for w in ["international", "diplomatic"]):
        mental_model = (
            f"**The mechanism of {title} can be visualized as a concentric medieval castle fortification system.** "
            f"In this model, **{title}** represents the robust outer walls that establish a sovereign perimeter, "
            f"regulating the flow of external entities and resources. {first_sent} "
            f"Just as these walls intersect with watchtowers and drawbridges representing local jurisdictions, "
            f"the overall system relies on mutually recognized boundaries and treaties to maintain strategic balance."
        )
    elif mode == "SOC-POLITICAL" or "political" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as the rules of a board game that all players must follow, even those who wrote them.** "
            f"**{title}** sets the constraints within which power is exercised, decisions are legitimized, and "
            f"disputes are resolved. {first_sent} "
            f"When any player ignores these rules, the entire framework loses its authority, "
            f"just as political institutions collapse when their foundational norms are bypassed."
        )
    elif mode == "ECON-MACRO" or "macroeconom" in str(domain_name).lower():
        mental_model = (
            f"**The mechanism of {title} operates like a massive city-wide hydraulic water pressure grid.** "
            f"**{title}** is the primary regulating valve that balances pressure and flow across economic sectors. {first_sent} "
            f"If the pressure drops or flows into a liquidity trap, it triggers feedback loops, "
            f"requiring systemic adjustments to restore macroeconomic equilibrium."
        )
    elif mode == "ECON-MICRO" or "microeconom" in str(domain_name).lower():
        mental_model = (
            f"**The mechanism of {title} can be compared to an organic agricultural soil-enrichment cycle.** "
            f"**{title}** acts as the precise concentration of nutrients that determines growth rate and yield. {first_sent} "
            f"Just as crops adapt based on weather shocks and soil constraints, "
            f"individual micro-entities shift their choices in response to price signals and input costs."
        )
    elif mode == "ECON-FINANCE" or "financial" in str(domain_name).lower() or "accountant" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as the double-entry ledger of a business.** "
            f"Every financial event has two equal and opposite sides that must always balance. "
            f"**{title}** is the principle governing which side of the ledger an entry belongs on. {first_sent} "
            f"When this principle is misapplied, financial statements become unreliable, "
            f"just as a ledger that doesn't balance signals a hidden error."
        )
    elif mode in ("LAW-CASE", "LAW-CONTRACT", "LAW-CRIMINAL", "LAW-CONSTITUTIONAL") or "lawyer" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as a referee's rulebook in a high-stakes match.** "
            f"It doesn't favor either side — it defines the conditions under which a call is made and the consequences. "
            f"**{title}** establishes the precise threshold, burden, and procedure that must be met. {first_sent} "
            f"Without this framework, legal outcomes become arbitrary, "
            f"just as a match without an objective referee produces contested results."
        )
    elif mode in ("MED-PHYSIO", "MED-PHARMA", "MED-ANATOMY", "MED-PATHOLOGY", "MED-NEUROLOGY", "MED-IMMUNOLOGY") or any(w in str(domain_name).lower() for w in ["surgeon", "physician", "anatomist", "physiologist", "pathologist"]):
        mental_model = (
            f"**Think of {title} as the thermostat of a climate-controlled operating theatre.** "
            f"The body must maintain strict physiological setpoints. "
            f"**{title}** is the sensor-effector mechanism that detects deviation and triggers a corrective response. {first_sent} "
            f"When this feedback loop fails, the body cannot self-regulate, "
            f"just as a broken thermostat allows temperature extremes that compromise the entire environment."
        )
    elif mode in ("BIOLOGY", "BIO-ECOLOGY", "BIO-GENETICS") or "biologist" in str(domain_name).lower() or "ecologist" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as a keystone species in an ecosystem.** "
            f"Remove it and the entire ecological structure reorganizes — often collapsing. "
            f"**{title}** plays a disproportionate role relative to its apparent size or frequency. {first_sent} "
            f"Understanding {title} means understanding which thread, when pulled, unravels the whole fabric of the system."
        )
    elif mode in ("MATH-PURE", "MATH-CALCULUS", "MATH-ALGEBRA", "MATH-DISCRETE", "MATH-STAT", "MATH-APPLIED") or "mathematician" in str(domain_name).lower() or "statistician" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as a master key that unlocks multiple doors in mathematics.** "
            f"Once you understand its definition and axioms precisely, it opens derivations and proofs across many problems. "
            f"**{title}** is not just a formula — it is a structural invariant. {first_sent} "
            f"Just as a master key that is even slightly miscut opens nothing, "
            f"an imprecise application of {title} collapses the entire proof."
        )
    elif mode in ("PHYSICS-KINEMATICS", "PHYSICS-ELECTRO", "PHYSICS-THERMO", "PHYSICS-QUANTUM") or "physicist" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as a conservation law governing a billiards table.** "
            f"No matter how many collisions occur, the total quantity described by {title} is preserved. {first_sent} "
            f"When an experiment appears to violate {title}, it signals that a hidden variable or energy source has been overlooked, "
            f"not that the law itself is wrong."
        )
    elif mode in ("HIST-CATALYST", "HUM-HISTORY") or "historian" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as the spark that ignites a powder keg.** "
            f"The combustible conditions were already in place; {title} was the trigger that released accumulated pressure. {first_sent} "
            f"Without understanding the underlying conditions — economic stress, political instability, social tension — "
            f"the significance of {title} as a catalyst cannot be fully appreciated."
        )
    elif mode == "PHILOSOPHY" or "philosopher" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as the lens that changes what you see without changing the world itself.** "
            f"Different philosophical frameworks do not alter the facts — they alter what counts as a relevant fact. "
            f"**{title}** is one such lens. {first_sent} "
            f"Once you adopt it, certain arguments become obviously valid or invalid, "
            f"just as switching from a microscope to a telescope reveals a completely different layer of reality."
        )
    elif mode == "PSYCH-SOCIOLOGY" or "psychologist" in str(domain_name).lower() or "sociologist" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as the invisible script that actors follow without reading.** "
            f"Social behavior is largely governed by internalized norms and scripts — "
            f"**{title}** names one of those hidden forces shaping thought and action below conscious deliberation. {first_sent} "
            f"Just as an actor who breaks from the script reveals that one existed all along, "
            f"violations of {title} make its otherwise invisible power suddenly obvious."
        )
    elif mode in ("RESEARCH-METHODS",) or "researcher" in str(domain_name).lower():
        mental_model = (
            f"**Think of {title} as the calibration procedure for a precision instrument.** "
            f"A measurement tool is only as reliable as its calibration. "
            f"**{title}** is the methodological safeguard that ensures findings reflect reality rather than error. {first_sent} "
            f"When this step is skipped or poorly executed, every conclusion built on it inherits the same flaw, "
            f"just as an uncalibrated scale distorts every reading taken from it."
        )
    elif _is_cs_domain:
        mental_model = (
            f"**The mechanism of {title} acts like a high-traffic automated warehouse sorting conveyor system.** "
            f"**{title}** is the routing protocol that directs incoming data parcels "
            f"to their designated bins based on precise tracking labels. {first_sent} "
            f"If a parcel is misshapen or lacks a valid address, it triggers system halts or memory leaks, "
            f"disrupting the downstream pipeline until the sorting logic is corrected."
        )
    else:
        # Universal fallback: uses grammar/language metaphor — entirely domain-neutral
        mental_model = (
            f"**The concept of {title} works like the foundational grammar rules of a language.** "
            f"Just as grammar does not tell you what to say, but constrains what is valid to say, "
            f"**{title}** defines the boundaries within which actions, decisions, or structures are considered correct. {first_sent} "
            f"When these rules are violated — even subtly — the meaning of the entire system breaks down, "
            f"just as a grammatically incorrect sentence, though recognizable, fails to communicate reliably."
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

    page = min((int(p) for p in getattr(note_schema, "source_pages", []) if str(p).isdigit()), default=1)

    # ── DOMAIN-AWARE ARTIFACT RENDERER ───────────────────────────────────────
    # Only emit Java code blocks for verified CS domains; all others get a Markdown Table.
    if _is_cs_domain:
        first_sent_logic = join_prose(logic_sents[:1], "Defines key programming context.")
        escaped = first_sent_logic.replace('"', '\\"')
        artifact_content = (
            f"```java\n"
            f"// Demonstration of {title} in Java\n"
            f"public class {class_name} {{\n"
            f"    private static final String DEFINITION = \"{escaped}\";\n\n"
            f"    public static void main(String[] args) {{\n"
            f"        System.out.println(\"{title} behavior:\");\n"
            f"        System.out.println(DEFINITION);\n"
            f"    }}\n"
            f"}}\n"
            f"```"
        )
        artifact_type = "Executable Java Code Block"
    else:
        first_sent_logic = join_prose(logic_sents[:1], "Defines key contextual relationship.")
        artifact_content = (
            "| Source Detail | Meaning |\n"
            "|---|---|\n"
            f"| {title} | The focused concept being studied. |\n"
            f"| {domain_name} | {first_sent_logic[:90]} |\n"
            f"| Source excerpt | The only authority for definitions and constraints. |"
        )
        artifact_type = "Markdown Table"

    option_a = join_prose(model_sents[:1], title)[:120].strip() or title

    # Build a factual T/F from source logic
    first_logic_sent = join_prose(logic_sents[:1], "").split('.')[0].strip()
    if first_logic_sent and len(first_logic_sent) > 20:
        factual_tf_question = first_logic_sent
        factual_tf_explanation = f"This follows directly from the source's definition of {title} on page {page}."
    else:
        factual_tf_question = f"{title} has specific conditions or constraints that determine when and how it applies within the domain."
        factual_tf_explanation = f"The source on page {page} outlines the precise scope and constraints of {title}."

    # Domain-aware MCQ distractors — no CS language for non-CS domains
    if _is_cs_domain:
        distractor_b = f"{title} is unrelated to how the system processes data."
        distractor_c = f"{title} only affects comments and non-executable formatting."
        distractor_d = f"{title} can be removed without affecting program behavior."
    else:
        distractor_b = f"{title} is a peripheral detail that does not affect core understanding of the topic."
        distractor_c = f"{title} applies only in highly specialized edge cases not covered by the source."
        distractor_d = f"{title} can be safely ignored without losing the main argument of the source."

    questions = [
        {
            "type": "mcq",
            "question": f"Which statement best matches the source's treatment of {title}?",
            "options": {
                "A": option_a,
                "B": distractor_b,
                "C": distractor_c,
                "D": distractor_d
            },
            "answer": "A",
            "explanation": f"The source context directly connects {title} to specific behavior, definitions, or structural rules described on page {page}.",
            "explanation_page": page
        },
        {
            "type": "true_false",
            "question": factual_tf_question,
            "answer": True,
            "explanation": factual_tf_explanation,
            "explanation_page": page
        },
        {
            "type": "writing",
            "question": f"Explain {title} in one precise paragraph. Include one specific consequence or implication drawn from the source on page {page}.",
            "answer": f"A strong answer defines {title} in the domain's own terms, explains its role or function, and anchors the explanation in the source definition from page {page}.",
            "required_keywords": ["source", title.split()[0].lower() if title.split() else title.lower()],
            "explanation": f"This checks whether the learner can translate the source wording into a precise, usable explanation of {title}.",
            "explanation_page": page
        }
    ]
    possible_questions = "```interactive-quiz\n" + json.dumps(questions, indent=2) + "\n```"

    # dynamic3_content: domain-aware bridging note — never references software pipeline
    dynamic3_content = (
        f"Pay close attention to the exact terminology the source uses to describe {title}. "
        f"The most common study error is paraphrasing too loosely — "
        f"the exam will test the source's precise definitions, not general knowledge of the domain."
    )

    data = {
        "title": note_schema.title,
        "mental_model": mental_model,
        "h1_title": domain.get("h1", "How It Actually Works"),
        "core_logic": core_logic,
        "h2_title": domain.get("h2", "The Formal Model"),
        "formal_model": formal_model,
        "artifact_type": artifact_type,
        "artifact_content": artifact_content,
        "dynamic3_content": dynamic3_content,
        "section_plan": build_dynamic_section_plan(domain, getattr(note_schema, "concept_modality", "")),
        "possible_questions": possible_questions,
        "mode": mode
    }

    return render_atomic_note(data)
