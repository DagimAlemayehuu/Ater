import re
import json
import asyncio
import time
import random
import logging
import io
import ruamel.yaml
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime
from difflib import SequenceMatcher

from .schemas import AdvancedPracticeConfig, NoteSchema
from .agents import QuestionAgent, DOMAIN_MATRIX, get_persona, get_professional_domain
from .governor import DailyLimitExceededException
from src.domains.ai.retry import is_retryable_ai_error

logger = logging.getLogger("Ater")

QUESTION_TYPE_ALIASES = {
    "mcq": "mcq",
    "multiplechoice": "mcq",
    "multiple_choice": "mcq",
    "multiple-choice": "mcq",
    "truefalse": "true_false",
    "true_false": "true_false",
    "true-false": "true_false",
    "fillin": "fill_in",
    "fill_in": "fill_in",
    "fill-in": "fill_in",
    "cloze": "fill_in",
    "shortanswer": "writing",
    "short_answer": "writing",
    "writing": "writing",
    "matching": "matching",
    "order": "order",
    "sequencing": "order",
    "debug": "debug",
    "finderror": "find_error",
    "find_error": "find_error",
    "synthesis": "synthesis",
    "trace": "trace",
    "scenario": "scenario",
    "code": "code",
    "calculation": "calculation",
    "dataanalysis": "data_analysis",
    "data_analysis": "data_analysis",
}

QUESTION_TYPE_TOOLKIT = {
    "mcq": {"family": "recognize", "format": "choice", "variant": "source_grounded_choice", "grading_mode": "objective"},
    "true_false": {"family": "recognize", "format": "choice", "variant": "precision_check", "grading_mode": "objective"},
    "writing": {"family": "explain", "format": "short_text", "variant": "mechanism_explanation", "grading_mode": "rubric"},
    "fill_in": {"family": "recall", "format": "blank", "variant": "cloze_recall", "grading_mode": "objective"},
    "matching": {"family": "compare", "format": "match", "variant": "concept_mapping", "grading_mode": "objective"},
    "order": {"family": "trace", "format": "order", "variant": "reasoning_sequence", "grading_mode": "objective"},
    "debug": {"family": "debug", "format": "long_text", "variant": "find_and_fix_reasoning", "grading_mode": "rubric"},
    "find_error": {"family": "diagnose", "format": "long_text", "variant": "error_diagnosis", "grading_mode": "rubric"},
    "synthesis": {"family": "construct", "format": "long_text", "variant": "cross_concept_synthesis", "grading_mode": "rubric"},
    "trace": {"family": "trace", "format": "short_text", "variant": "step_trace", "grading_mode": "hybrid"},
    "scenario": {"family": "apply", "format": "long_text", "variant": "transfer_scenario", "grading_mode": "rubric"},
    "code": {"family": "construct", "format": "code_editor", "variant": "write_or_explain_code", "grading_mode": "rubric"},
    "calculation": {"family": "solve", "format": "short_text", "variant": "calculation_or_derivation", "grading_mode": "hybrid"},
    "data_analysis": {"family": "diagnose", "format": "table_editor", "variant": "evidence_interpretation", "grading_mode": "rubric"},
}

QUESTION_FAMILY_FALLBACKS = ["explain", "apply", "compare"]


def normalize_question_type(raw_type: Any) -> str:
    key = str(raw_type or "writing").strip().lower().replace(" ", "").replace("-", "_")
    return QUESTION_TYPE_ALIASES.get(key, QUESTION_TYPE_ALIASES.get(key.replace("_", ""), "writing"))


def _question_toolkit_for_type(q_type: str) -> Dict[str, str]:
    return dict(QUESTION_TYPE_TOOLKIT.get(normalize_question_type(q_type), QUESTION_TYPE_TOOLKIT["writing"]))


def enrich_question_v2(
    question: Dict[str, Any],
    q_type: str | None = None,
    concept: str = "",
    note_title: str = "",
    source_pages: List[int] | None = None,
) -> Dict[str, Any]:
    q = dict(question or {})
    normalized_type = normalize_question_type(q_type or q.get("type"))
    toolkit = _question_toolkit_for_type(normalized_type)
    q["type"] = normalized_type
    q.setdefault("schema_version", 2)
    q.setdefault("family", toolkit["family"])
    q.setdefault("format", toolkit["format"])
    q.setdefault("variant", toolkit["variant"])
    q.setdefault("skill_target", concept or note_title or q.get("note_title") or "Source-grounded concept")
    q.setdefault("rubric", {
        "grading_mode": toolkit["grading_mode"],
        "must_include": q.get("required_keywords") or [],
        "mastery_signal": "Answer preserves the source-grounded mechanism, not just the surface label.",
    })
    q.setdefault("remediation", {
        "misconception_codes": [
            "missing_definition",
            "wrong_mechanism",
            "bad_transfer",
            "evidence_gap",
        ],
        "follow_up_policy": "Ask a different family or format that targets the failed skill.",
    })
    if source_pages:
        q.setdefault("source_refs", [{"page": int(p)} for p in source_pages if str(p).isdigit()])
    q.setdefault("artifact_refs", [])
    return q


def determine_dynamic_question_count(note_title: str, modality: str, source_snippet: str, prerequisites_count: int) -> int:
    snippet_len = len(source_snippet or "")
    if snippet_len > 1800:
        base_count = 4
    elif snippet_len < 600:
        base_count = 2
    else:
        base_count = 3
        
    # Boost count for high-complexity modalities or deep dependency nodes
    if modality in ["Quantitative", "Procedural"] or prerequisites_count >= 2:
        base_count = min(4, base_count + 1)
        
    return base_count


def _select_legacy_question_types(note_title: str, modality: str, source_snippet: str, count: int, mode: str = "ACADEMIC-GENERAL") -> List[str]:
    snippet_lower = (source_snippet or "").lower()
    title_lower = (note_title or "").lower()
    
    # 1. Code detection heuristic
    code_words = ["def ", "class ", "function ", "fn ", "let ", "const ", "var ", "return ", "struct ", "import ", "lambda", "print("]
    has_code = any(w in (source_snippet or "") for w in code_words) or any(w in title_lower for w in ["code", "program", "algor", "function", "variable", "object", "pointer"])
    
    # 2. Math/LaTeX/Number detection heuristic
    has_math = "$" in (source_snippet or "") or any(w in title_lower for w in ["math", "formula", "equation", "deriv", "calculat", "matrix", "rate", "probab", "statist", "cost", "price", "elasticity"]) or any(op in (source_snippet or "") for op in [" = ", " + ", " - ", " * ", " / "])

    # Initialize base scores for each of the 13 types available in the practice tab
    scores = {
        "mcq": 1.0,
        "true_false": 1.0,
        "writing": 1.2,       # slightly favor writing/synthesis for concept mastery
        "fill_in": 1.0,
        "matching": 1.0,
        "order": 1.0,
        "debug": 1.0,
        "synthesis": 1.2,
        "trace": 1.0,
        "calculation": 1.0,
        "data_analysis": 1.0,
        "scenario": 1.2,
        "code": 1.0
    }

    # Filter based on domain mode allowed question modes
    domain_config = DOMAIN_MATRIX.get(mode, DOMAIN_MATRIX.get("ACADEMIC-GENERAL", {}))
    allowed_modes = domain_config.get("question_modes", [])
    if allowed_modes:
        allowed_set = set(allowed_modes) | {"mcq", "true_false", "writing"}
        # Only add calculation/data_analysis if explicitly supported by the domain config or under quantitative modality with active math
        if (modality == "Quantitative" and has_math) or "calculation" in allowed_modes:
            allowed_set.add("calculation")
        if (modality == "Quantitative" and has_math) or "data_analysis" in allowed_modes:
            allowed_set.add("data_analysis")
        
        is_cs_domain = (
            mode.startswith("CS-") or
            any(w in mode.lower() for w in ["software", "systems", "networking", "cybersecurity", "web", "database", "ai", "db", "arch", "testing"]) or
            any(w in title_lower for w in ["python", "java", "code", "program", "algor", "software", "computer"])
        )
        if is_cs_domain and (has_code or modality == "Procedural"):
            allowed_set.update(["code", "debug", "trace"])
            
        for t in list(scores.keys()):
            if t not in allowed_set:
                scores[t] = -100.0

    # Modality alignment bonuses
    if modality == "Quantitative":
        scores["calculation"] += 3.0
        scores["data_analysis"] += 2.5
        scores["trace"] += 2.0
        scores["mcq"] += 1.0
        scores["code"] += 1.0
    elif modality == "Procedural":
        scores["trace"] += 3.0
        scores["debug"] += 3.0
        scores["order"] += 2.5
        scores["code"] += 2.0
        scores["mcq"] += 1.0
    elif modality == "Comparative":
        scores["matching"] += 3.0
        scores["synthesis"] += 2.5
        scores["scenario"] += 2.0
        scores["writing"] += 1.5
    elif modality == "Causal/Historical":
        scores["order"] += 3.0
        scores["scenario"] += 2.5
        scores["synthesis"] += 2.0
        scores["true_false"] += 1.5
    elif modality == "Qualitative/Definitional":
        scores["scenario"] += 3.0
        scores["true_false"] += 2.0
        scores["writing"] += 2.5
        scores["fill_in"] += 1.5
        scores["mcq"] += 1.0
        
    # Content-based heuristic bonuses
    if has_code:
        scores["code"] += 4.0
        scores["debug"] += 3.5
        scores["trace"] += 3.0
        
    if has_math:
        scores["calculation"] += 4.0
        scores["data_analysis"] += 3.0
        
    step_words = ["step ", "first", "second", "third", "then", "finally", "workflow", "pipeline", "lifecycle", "sequence", "stage", "phase"]
    has_steps = any(w in snippet_lower for w in step_words) or any(w in title_lower for w in ["step", "process", "flow", "sequence", "lifecycle", "pipeline"])
    if has_steps:
        scores["order"] += 3.0
        scores["trace"] += 2.5
        
    comp_words = ["versus", "vs", "compare", "contrast", "differ", "analogy", "similar", "unlike", "alternative", "advantage", "disadvantage", "trade-off", "tradeoff"]
    has_comp = any(w in snippet_lower for w in comp_words) or any(w in title_lower for w in ["vs", "compare", "contrast", "differ", "tradeoff"])
    if has_comp:
        scores["matching"] += 3.5
        scores["synthesis"] += 3.0
        
    sorted_types = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    
    selected = []
    for t, score in sorted_types:
        if len(selected) < count:
            selected.append(t)
            
    while len(selected) < count:
        selected.append("mcq")
        
    return selected


def build_practice_blueprint(
    note_title: str,
    modality: str,
    source_snippet: str,
    prerequisites_count: int = 0,
    mode: str = "ACADEMIC-GENERAL",
    max_questions: int = 5,
) -> Dict[str, Any]:
    """Deterministically plan the Proving Grounds before any model writes questions.

    The LLM should fill selected question shells; this function owns the cognitive
    toolkit choice so weak models cannot drift into generic flashcards.
    """
    count = max(1, min(int(max_questions or 5), determine_dynamic_question_count(
        note_title,
        modality,
        source_snippet,
        prerequisites_count,
    )))
    legacy_types = _select_legacy_question_types(note_title, modality, source_snippet, count, mode=mode)
    toolkit_items = [_question_toolkit_for_type(q_type) for q_type in legacy_types]
    families = []
    formats = []
    variants = []
    for item in toolkit_items:
        if item["family"] not in families:
            families.append(item["family"])
        if item["format"] not in formats:
            formats.append(item["format"])
        if item["variant"] not in variants:
            variants.append(item["variant"])

    if not families:
        families = QUESTION_FAMILY_FALLBACKS[:]
    if not formats:
        formats = ["short_text"]

    return {
        "schema_version": 2,
        "mode": mode,
        "modality": modality or "Qualitative/Definitional",
        "recommended_question_count": count,
        "legacy_types": legacy_types,
        "families": families,
        "formats": formats,
        "variants": variants,
        "skill_targets": [note_title],
        "generation_policy": "deterministic_blueprint_then_llm_fill",
        "remediation_policy": "classify_misconception_then_follow_up_with_different_family_or_format",
    }


def select_dynamic_question_types(note_title: str, modality: str, source_snippet: str, count: int, mode: str = "ACADEMIC-GENERAL") -> List[str]:
    blueprint = build_practice_blueprint(
        note_title=note_title,
        modality=modality,
        source_snippet=source_snippet,
        prerequisites_count=0,
        mode=mode,
        max_questions=count,
    )
    selected = list(blueprint.get("legacy_types") or [])
    while len(selected) < count:
        selected.append("writing")
    return selected[:count]

def _strip_note_frontmatter(note_content: str) -> str:
    text = str(note_content or "")
    return re.sub(r"^---\s.*?---\s*", "", text, flags=re.DOTALL).strip()


def _extract_note_fact(note_content: str, concept: str, fallback: str) -> str:
    text = _strip_note_frontmatter(note_content)
    text = re.sub(r"```interactive-quiz.*?```", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"#+\s*", " ", text)
    text = re.sub(r"\|", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    concept_terms = [term for term in re.findall(r"[A-Za-z]{3,}", str(concept).lower())]
    candidates = []
    for raw in re.split(r"(?<=[.!?])\s+|\s{2,}", text):
        sentence = raw.strip(" -")
        if len(sentence) < 24:
            continue
        lowered = sentence.lower()
        if "interactive-quiz" in lowered or lowered.startswith(("page evidence", "---")):
            continue
        score = sum(2 for term in concept_terms if term in lowered)
        if re.search(r"[A-Za-z]\w*\s*[+*/=-]\s*[A-Za-z0-9]", sentence):
            score += 4
        if any(token in lowered for token in ["source", "equation", "slope", "rank", "affordable", "definition", "constraint", "relationship"]):
            score += 2
        candidates.append((score, sentence))
    if candidates:
        candidates.sort(key=lambda item: (-item[0], len(item[1])))
        return candidates[0][1][:260].strip()
    return fallback


def _extract_note_equation(note_content: str) -> str:
    text = _strip_note_frontmatter(note_content)
    patterns = [
        r"[A-Za-z][A-Za-z0-9_]*\s*[A-Za-z0-9_]*\s*[+]\s*[A-Za-z][A-Za-z0-9_]*\s*[A-Za-z0-9_]*\s*=\s*[A-Za-z0-9_]+",
        r"[A-Za-z][A-Za-z0-9_]*\s*=\s*[^.\n|]{2,80}",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return re.sub(r"\s+", " ", match.group(0)).strip(" .|")
    return ""


def _create_legacy_fallback_question(q_type: str, concept: str, note_title: str, note_content: str = "") -> dict:
    grounded_fact = _extract_note_fact(
        note_content,
        concept,
        f"The note identifies {concept} as a source-grounded concept within {note_title}.",
    )
    equation = _extract_note_equation(note_content)
    context = f"{concept} {note_title} {note_content[:1200]}".lower()
    if "preference" in context:
        plausible_distractors = [
            "It means the consumer buys the cheapest available bundle.",
            "It measures satisfaction with exact numerical utility units.",
            "It describes affordability after income and prices are applied.",
        ]
    elif "budget" in context:
        plausible_distractors = [
            "It ranks bundles by desirability before prices matter.",
            "It measures the satisfaction created by one more unit.",
            "It says every preferred bundle is affordable.",
        ]
    elif any(token in context for token in ["code", "algorithm", "function", "query", "database"]):
        plausible_distractors = [
            "It describes the label shown to the user but not the transformation in the program.",
            "It assumes all inputs are valid and skips edge-case behavior.",
            "It explains the visual output but not the state or data dependency.",
        ]
    else:
        plausible_distractors = [
            "It replaces the concept's mechanism with a nearby term from the same topic.",
            "It gives an example but does not preserve the rule being tested.",
            "It treats a consequence as if it were the definition.",
        ]
    if q_type == "mcq":
        return {
            "type": "mcq",
            "question": f"Which statement best preserves the mechanism of {concept}?",
            "options": {
                "A": grounded_fact,
                "B": plausible_distractors[0],
                "C": plausible_distractors[1],
                "D": plausible_distractors[2],
            },
            "answer": "A",
            "explanation": f"The correct answer preserves the source-grounded mechanism for {concept}; the other options confuse it with nearby concepts or consequences."
        }
    elif q_type == "true_false":
        return {
            "type": "true_false",
            "question": f"According to the selected source context, this statement is relevant to {concept}: {grounded_fact}",
            "answer": True,
            "explanation": f"The statement is drawn from the note context for {concept}."
        }
    elif q_type == "fill_in":
        answer_terms = [w.lower() for w in re.findall(r"[A-Za-z]{5,}", grounded_fact)[:2]] or [concept.split()[0].lower()]
        return {
            "type": "fill_in",
            "question": f"Fill in the source-grounded terms for {concept}.",
            "textWithBlanks": f"Source context: {re.sub(re.escape(answer_terms[0]), '[[blank]]', grounded_fact, count=1, flags=re.IGNORECASE)}",
            "answer": answer_terms[:1],
            "explanation": f"The missing term comes from the selected source context for {concept}."
        }
    elif q_type == "writing":
        return {
            "type": "writing",
            "question": f"Explain {concept} using this source evidence: {grounded_fact}",
            "answer": f"A complete response restates the source evidence, defines {concept}, and explains the relationship or constraint described in {note_title}.",
            "required_keywords": [w.lower() for w in re.findall(r"[A-Za-z]{4,}", concept.lower())[:3]] or ["mechanism"],
            "explanation": f"Verifies student capability to define and explain {concept} using the selected source context."
        }
    elif q_type == "matching":
        return {
            "type": "matching",
            "question": f"Match the source-grounded parts of {concept} to their meanings.",
            "pairs": [
                {"left": concept, "right": grounded_fact},
                {"left": "Source evidence", "right": f"The cited note context used to justify an answer about {concept}."}
            ],
            "explanation": f"Assesses whether the learner can connect {concept} to the selected source evidence."
        }
    elif q_type == "order":
        step_1 = f"Identify the concept being tested: {concept}."
        step_2 = f"State the source-grounded relationship: {grounded_fact}"
        step_3 = "Apply the relationship to the new case without swapping in a nearby concept."
        step_4 = "Check the implication or failure case."
        return {
            "type": "order",
            "question": f"Arrange the reasoning sequence for answering a source-grounded question about {concept}:",
            "steps": [
                step_3,
                step_1,
                step_4,
                step_2,
            ],
            "answer": [
                step_1,
                step_2,
                step_3,
                step_4,
            ],
            "explanation": f"Ensures the student can reason from source evidence to explanation."
        }
    elif q_type in ("debug", "code"):
        return {
            "type": "debug",
            "question": f"Identify and correct the analytical flaw or bug in the following reasoning concerning {concept} in {note_title}:",
            "content": f"Reasoning: {concept} is completely isolated from other unit variables, and its application produces instant, costless outcomes without any operational limits.",
            "answer": f"The flaw is assuming {concept} has no costs or constraints. The correction is recognizing that {concept} requires resources and has clear limits.",
            "explanation": f"Promotes critical thinking and debugging of flawed applications of {concept}."
        }
    elif q_type == "synthesis":
        return {
            "type": "synthesis",
            "question": f"Synthesize how {concept} connects to another source-grounded idea in {note_title}, starting from: {grounded_fact}",
            "answer": f"A strong synthesis preserves the source fact for {concept} and links it to a related definition, equation, comparison, or constraint from the same unit.",
            "required_keywords": [w.lower() for w in re.findall(r"[A-Za-z]{4,}", concept.lower())[:3]] or ["synthesis"],
            "explanation": "Assesses higher-order synthesis while staying grounded in the selected source note."
        }
    elif q_type == "calculation":
        if equation:
            return {
                "type": "calculation",
                "question": f"Use the source equation for {concept} to identify the relationship being modeled.",
                "content": equation,
                "answer": equation,
                "explanation": f"The equation is taken from the selected note context; the task checks whether the learner preserves the source model before substituting numbers."
            }
        return {
            "type": "calculation",
            "question": f"Identify the quantity or relationship that would need to be calculated for {concept} from the source context.",
            "content": grounded_fact,
            "answer": grounded_fact,
            "explanation": f"No numeric substitution is invented; the fallback stays with the source relationship for {concept}."
        }
    elif q_type == "data_analysis":
        return {
            "type": "data_analysis",
            "question": f"Interpret the source evidence for {concept} and state what conclusion it supports.",
            "content": equation or grounded_fact,
            "answer": grounded_fact,
            "explanation": f"Tests evidence interpretation using the selected source context for {concept}, without inventing external metrics."
        }
    elif q_type == "scenario":
        return {
            "type": "scenario",
            "question": f"Apply {concept} to a new example while preserving this source constraint: {grounded_fact}",
            "answer": f"A good scenario answer keeps the source relationship intact and applies it to the new example without changing the definition or equation.",
            "explanation": f"Tests application of {concept} from source evidence rather than generic scenario writing."
        }
    elif q_type == "trace":
        trace_steps = [
            f"Start with the condition or object named by {concept}.",
            f"Apply the source-grounded mechanism: {grounded_fact}",
            "State the result, implication, or limit without adding unsupported outside claims.",
        ]
        return {
            "type": "trace",
            "question": f"Trace the reasoning pathway through which {concept} produces its result in {note_title}.",
            "steps": trace_steps,
            "answer": " -> ".join(trace_steps),
            "explanation": f"Checks step-by-step causal tracing of {concept} in the system."
        }
    else:
        return {
            "type": "writing",
            "question": f"Explain the central role and operational mechanics of {concept} in {note_title}.",
            "answer": f"The core answer is anchored in the {note_title} text and details how {concept} is applied.",
            "required_keywords": [w.lower() for w in re.findall(r"[A-Za-z]{4,}", concept.lower())[:3]] or ["concept"],
            "explanation": f"Verifies basic understanding of {concept}."
        }


def create_fallback_question(q_type: str, concept: str, note_title: str, note_content: str = "") -> dict:
    question = _create_legacy_fallback_question(q_type, concept, note_title, note_content=note_content)
    source_pages: List[int] = []
    for page_match in re.findall(r"\bp\.\s*(\d+)\b|\[PAGE\s+(\d+)\]", note_content or "", flags=re.IGNORECASE):
        for page_value in page_match:
            if page_value:
                source_pages.append(int(page_value))
    return enrich_question_v2(
        question,
        q_type=q_type,
        concept=concept,
        note_title=note_title,
        source_pages=source_pages,
    )


def is_economics_practice_context(text: str) -> bool:
    lowered = text.lower()
    return any(token in lowered for token in [
        "econ-", "economics", "consumer", "utility", "budget", "preference", "preferences",
        "indifference", "marginal", "commodity", "commodities", "price", "income",
        "demand", "supply", "mrs", "budget line", "cardinal", "ordinal",
    ])

def sanitize_question_distribution_for_context(raw_distribution: Dict[str, int], context: str) -> Dict[str, int]:
    distribution = {str(k): int(v or 0) for k, v in raw_distribution.items()}
    if not is_economics_practice_context(context):
        return distribution

    banned = {"code", "debug", "trace", "find_error"}
    replacement_order = ["scenario", "calculation", "synthesis", "data_analysis", "writing"]
    for banned_type in banned:
        count = distribution.pop(banned_type, 0)
        if count <= 0:
            continue
        for replacement in replacement_order:
            if replacement in distribution:
                distribution[replacement] += count
                break
        else:
            distribution["scenario"] = distribution.get("scenario", 0) + count
    return distribution

def rate_candidate_quiz(validator, questions: List[dict], note_title: str, source_context: str) -> float:
    score = 0.0
    
    if isinstance(questions, list):
        score += 10.0
        
    if isinstance(questions, list) and len(questions) == 3:
        score += 10.0
        
    if isinstance(questions, list):
        difficulties = {q.get("difficulty") for q in questions if isinstance(q, dict) and q.get("difficulty")}
        if len(difficulties) >= 2 or ("L1" in difficulties and "L2" in difficulties) or ("L1" in difficulties and "L3" in difficulties):
            score += 15.0
            
    mcq_valid = True
    has_mcq = False
    if isinstance(questions, list):
        for q in questions:
            if isinstance(q, dict) and q.get("type") == "mcq":
                has_mcq = True
                opts = q.get("options")
                if not isinstance(opts, dict) or len(opts) != 4:
                    mcq_valid = False
                else:
                    keys = {str(k).upper() for k in opts.keys()}
                    if not {"A", "B", "C", "D"}.issubset(keys):
                        mcq_valid = False
        if has_mcq and mcq_valid:
            score += 15.0
        elif not has_mcq:
            score += 15.0
            
    keywords_valid = True
    has_applicable_q = False
    if isinstance(questions, list):
        for q in questions:
            if isinstance(q, dict) and q.get("type") in ["debug", "trace", "writing"]:
                has_applicable_q = True
                req_kws = q.get("required_keywords")
                if not isinstance(req_kws, list) or not (3 <= len(req_kws) <= 5):
                    keywords_valid = False
        if has_applicable_q and keywords_valid:
            score += 15.0
        elif not has_applicable_q:
            score += 15.0
            
    if isinstance(questions, list) and validator is not None:
        try:
            topic_lock_source = (source_context or "") + " " + note_title
            lock_passed, _ = validator.semantic_topic_lock(
                note_title=note_title,
                source_context=topic_lock_source,
                quiz_questions=questions
            )
            if lock_passed:
                score += 20.0
        except Exception as e:
            print(f"[rate_candidate_quiz] Error during semantic_topic_lock: {e}")
            
    trace_clean = True
    has_trace = False
    if isinstance(questions, list):
        for q in questions:
            if isinstance(q, dict) and q.get("type") == "trace":
                has_trace = True
                ans = q.get("answer")
                if isinstance(ans, str):
                    if "=" in ans and len(ans) > 15:
                        trace_clean = False
                    if ans.strip().endswith("="):
                        trace_clean = False
        if has_trace and trace_clean:
            score += 15.0
        elif not has_trace:
            score += 15.0
            
    return score

async def generate_practice(
    planner_llm,
    secrets,
    vm,
    governor,
    list_planner_hubs_fn,
    find_hub_fn,
    get_unit_dir_fn,
    swap_api_key_fn,
    status_dict: dict,
    hub_id: str, 
    config_raw: Dict[str, Any]
) -> Dict[str, Any]:
    """Generates personalized practice questions based on a Hub and its associated notes."""
    try:
        config = AdvancedPracticeConfig(**config_raw)
    except Exception:
        config = AdvancedPracticeConfig(
            hubId=hub_id,
            questionDistribution={
                "mcq": config_raw.get("question_count", 5) if config_raw.get("question_type") == "Multiple Choice" else 0,
                "true_false": config_raw.get("question_count", 5) if config_raw.get("question_type") == "True/False" else 0,
                "writing": config_raw.get("question_count", 5) if config_raw.get("question_type") == "Short Answer" else 0,
                "scenario": config_raw.get("question_count", 5) if config_raw.get("question_type") == "Scenario-Based" else 0
            },
            difficulty=config_raw.get("difficulty", "L1") if config_raw.get("difficulty") != "Mixed" else "L2"
        )

    if not config.hubId or config.hubId.strip() == '':
        config.hubId = hub_id

    if not planner_llm:
        raise ValueError("Planner AI is not configured. Go to Settings > AI Configuration and add your API key.")

    PRACTICE_MAX_CHARS = 12_000
    context_parts = []
    is_explicitly_empty = False

    if config.hubId == "all":
        hub = {"title": "Global Interleaved", "path": ""}
        practice_dir = vm.academic_root / "Practice"
        practice_dir.mkdir(exist_ok=True)
        
        selected_notes = config.selectedAtomicNotes or []
        notes_to_process = []
        
        if isinstance(config_raw, dict):
            if "selectedAtomicNotes" in config_raw and config_raw["selectedAtomicNotes"] == []:
                is_explicitly_empty = True
            elif "selected_atomic_notes" in config_raw and config_raw["selected_atomic_notes"] == []:
                is_explicitly_empty = True
        
        for path_str in selected_notes:
            p = Path(path_str)
            resolved_p = vm.vault_path / path_str if not p.is_absolute() else p
            if resolved_p.exists():
                notes_to_process.append(resolved_p)
                
        if notes_to_process:
            budget_per_note = PRACTICE_MAX_CHARS // len(notes_to_process)
            found_selected = True
            for note_path in notes_to_process:
                with open(note_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if len(content) > budget_per_note:
                        content = content[:budget_per_note] + "... [Truncated for Context Limit]"
                    context_parts.append(f"### Atomic Note: {note_path.stem}\n{content}")
        else:
            found_selected = False
            
        atomic_notes = notes_to_process
    else:
        hub = find_hub_fn(config.hubId)
        if not hub:
            available = [h["id"] for h in list_planner_hubs_fn()]
            raise ValueError(f"Hub not found: '{config.hubId}'. Available hubs: {available}")
        
        hub_path = vm.vault_path / hub["path"]
        unit_dir = get_unit_dir_fn(hub)
        practice_dir = vm.academic_root / "Practice"
        practice_dir.mkdir(exist_ok=True)
        
        atomic_notes = list(unit_dir.rglob("*.md"))
        selected_notes = config.selectedAtomicNotes
        
        if isinstance(config_raw, dict):
            if "selectedAtomicNotes" in config_raw and config_raw["selectedAtomicNotes"] == []:
                is_explicitly_empty = True
            elif "selected_atomic_notes" in config_raw and config_raw["selected_atomic_notes"] == []:
                is_explicitly_empty = True

        selected_stems = set()
        selected_names = set()
        selected_rel_paths = set()
        if selected_notes:
            for n in selected_notes:
                selected_stems.add(Path(n).stem)
                selected_names.add(Path(n).name)
                selected_rel_paths.add(Path(n).as_posix())

        notes_to_process = []
        if not is_explicitly_empty:
            for note_path in atomic_notes:
                if note_path.name == hub_path.name or "Possible_Questions" in note_path.name or "Practice" in note_path.name or note_path.name.startswith("_"):
                    continue
                if selected_notes:
                    try:
                        rel_p = note_path.relative_to(vm.vault_path).as_posix()
                    except ValueError:
                        rel_p = note_path.as_posix()

                    match_found = False
                    if note_path.stem in selected_stems:
                        match_found = True
                    elif note_path.name in selected_names:
                        match_found = True
                    elif rel_p in selected_rel_paths:
                        match_found = True
                    elif any(n.endswith(rel_p) or rel_p.endswith(n) for n in selected_rel_paths):
                        match_found = True

                    if not match_found:
                        continue
                notes_to_process.append(note_path)

        if config.prioritizeWeaknesses:
            try:
                inbox_dir = Path(secrets.inbox_path) if secrets.inbox_path else Path(vm.vault_path) / "Inbox"
                db_path = inbox_dir / "ater_queue.db"
                if db_path.exists():
                    from .analytics import AnalyticsEngine
                    engine = AnalyticsEngine(db_path)
                    note_rel_paths = []
                    path_map = {}
                    for p in notes_to_process:
                        try:
                            rel = p.relative_to(vm.vault_path).as_posix()
                        except ValueError:
                            rel = p.as_posix()
                        note_rel_paths.append(rel)
                        path_map[rel] = p
                    
                    weak_rel_paths = engine.get_weak_notes(note_rel_paths, threshold=0.75)
                    if weak_rel_paths:
                        weak_paths = [path_map[r] for r in weak_rel_paths if r in path_map]
                        notes_to_process = weak_paths + [p for p in notes_to_process if p not in weak_paths]
            except Exception as ae:
                logger.warning(f"Failed to prioritize weaknesses via AnalyticsEngine: {ae}")

        if not notes_to_process:
             with open(hub_path, "r", encoding="utf-8") as f:
                context_parts.append(f"## Hub Note: {hub['title']}\n{f.read()}")

        if notes_to_process:
            budget_per_note = PRACTICE_MAX_CHARS // len(notes_to_process)
            found_selected = True
            for note_path in notes_to_process:
                with open(note_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if len(content) > budget_per_note:
                        content = content[:budget_per_note] + "... [Truncated for Context Limit]"
                    context_parts.append(f"### Atomic Note: {note_path.stem}\n{content}")
        else:
            found_selected = False

    if config.hubId != "all" and (not selected_notes or is_explicitly_empty):
        pq_file = next(unit_dir.rglob("*_Possible_Questions.md"), None)
        if pq_file:
            with open(pq_file, "r", encoding="utf-8") as f:
                context_parts.append(f"## Reference Questions\n{f.read()}")
    
    if selected_notes and not found_selected and not is_explicitly_empty:
        raise Exception(f"Strict Error: None of the selected notes ({selected_notes}) were found.")
    
    random.shuffle(context_parts)
    full_context = "\n\n".join(context_parts)
    
    if len(full_context.strip()) < 50:
        logger.error(f"[Ater Service] No sufficient context found for hub {hub_id} with selection {selected_notes}")
        raise Exception("No source material found for the selected concepts. Please ensure the atomic notes have content.")
    
    session_id = f"session_{int(time.time())}"
    distribution = sanitize_question_distribution_for_context(config.questionDistribution, f"{hub.get('title', '')}\n{full_context[:4000]}")
    config.questionDistribution = distribution
    total_q = sum(distribution.values())
    if total_q <= 0:
        raise ValueError("Total requested questions is 0. Please ensure the question distribution specifies at least one question type with a count greater than 0.")
    
    ", ".join([f"{count} {type}" for type, count in distribution.items() if count > 0])
    
    pedagogy_prompts = []
    if config.difficulty == "L3":
        pedagogy_prompts.append("FOCUS: Higher-order analysis. Questions should require breaking down concepts or debugging systems.")
    if config.injectTrickAnswers:
        pedagogy_prompts.append("TRICK ANSWERS: Occasionally include 'None of the above' or 'A and B only' to test precision.")
    if config.distractorPlausibility == "High":
        pedagogy_prompts.append("DISTRACTORS: Ensure incorrect options are highly plausible and common misconceptions.")

    selected_titles = [n.stem for n in atomic_notes if n.stem in (selected_notes or [])]
    selected_scope_str = ", ".join(selected_titles) if selected_titles else "Full Unit"

    # --- HIGH-FIDELITY PRE-COMPILED QUIZ POOL EXTRACTION ---
    extracted_pool = []
    for note_path in notes_to_process:
        try:
            with open(note_path, "r", encoding="utf-8") as f:
                note_content = f.read()
            quiz_match = re.search(r"```interactive-quiz\s*\n(.*?)\n```", note_content, re.DOTALL)
            if quiz_match:
                raw_json = quiz_match.group(1).strip()
                try:
                    quiz_data = json.loads(raw_json)
                except Exception:
                    candidate = re.sub(r",\s*([\]\}])", r"\1", raw_json)
                    candidate = re.sub(r'(?<=")([^"]*)\n([^"]*?)(?=")', lambda m: m.group(1) + "\\n" + m.group(2), candidate)
                    try:
                        quiz_data = json.loads(candidate)
                    except Exception:
                        quiz_data = None
                
                if isinstance(quiz_data, list):
                    for q in quiz_data:
                        if isinstance(q, dict) and "question" in q:
                            q_raw_type = q.get("type") or q.get("questionType") or q.get("question_type")
                            q_type_norm = normalize_question_type(q_raw_type)
                            q["type"] = q_type_norm
                            q["note_path"] = str(note_path)
                            q["note_title"] = note_path.stem
                            q = enrich_question_v2(q, q_type=q_type_norm, concept=note_path.stem.replace("_", " "), note_title=note_path.stem)
                            extracted_pool.append(q)
        except Exception as e:
            logger.error(f"[Ater Service] Error extracting quiz from {note_path.name}: {e}")

    all_questions = []
    target_distribution = distribution.copy()
    used_questions_texts = set()
    
    for q_type, count in list(target_distribution.items()):
        if count <= 0:
            continue
        
        matching_qs = [q for q in extracted_pool if q.get("type") == q_type]
        unique_matching_qs = []
        for q in matching_qs:
            q_text = q.get("question", "").strip().lower()
            if q_text not in used_questions_texts:
                unique_matching_qs.append(q)
        
        random.shuffle(unique_matching_qs)
        sampled = unique_matching_qs[:count]
        for q in sampled:
            all_questions.append(q)
            used_questions_texts.add(q.get("question", "").strip().lower())
        
        target_distribution[q_type] = count - len(sampled)
        logger.info(f"[Ater Service] Practice Builder: Loaded {len(sampled)}/{count} existing '{q_type}' questions from atomic notes.")

    status_dict[session_id] = "Generating Practice Questions..."
    tasks = []
    
    hub_mode = hub.get("mode", "ECON-MACRO")
    if "mode" not in hub:
        hub_title_low = hub['title'].lower()
        if any(kw in hub_title_low for kw in ["micro", "demand", "supply", "consumer", "elasticity", "firm", "market_structure"]):
            hub_mode = "ECON-MICRO"
        elif any(kw in hub_title_low for kw in ["macro", "gdp", "inflation", "monetary", "fiscal", "central_bank", "aggregate"]):
            hub_mode = "ECON-MACRO"
        
    for q_type, count in target_distribution.items():
        if count > 0:
            modality_map = {
                "mcq": "Qualitative/Definitional",
                "true_false": "Qualitative/Definitional",
                "writing": "Qualitative/Definitional",
                "fill_in": "Qualitative/Definitional",
                "calculation": "Quantitative",
                "data_analysis": "Causal/Historical",
                "trace": "Procedural",
                "order": "Procedural",
                "debug": "Procedural",
                "scenario": "Comparative",
                "matching": "Comparative",
                "theoretical": "Qualitative/Definitional",
                "calculative": "Quantitative",
                "applied": "Procedural",
                "case_study": "Comparative"
            }
            modality = modality_map.get(q_type, "Qualitative/Definitional")
            domain_dict = get_persona(hub_mode, modality)
            agent = QuestionAgent(planner_llm, domain_dict)
            seed = random.random()
            
            shuffled_parts = list(context_parts)
            random.shuffle(shuffled_parts)
            tight_context = "\n\n".join(shuffled_parts)
            
            hints = [
                "Focus on theoretical definitions and core mechanisms.",
                "Focus on edge cases and common misconceptions.",
                "Focus on real-world application in a specific industry scenario.",
                "Focus on mathematical/quantitative relationships.",
                "Focus on causal links and process flow."
            ]
            hint = random.choice(hints)
            
            if used_questions_texts:
                hint += "\nCRITICAL: DO NOT duplicate or generate questions similar to the following questions/concepts:\n" + "\n".join(f"- {q}" for q in list(used_questions_texts)[:10])
            
            prof_domain = get_professional_domain(hub['title'] + str(q_type), mode=hub_mode)
            current_diff = config.difficulty if config.difficulty != "Mixed" else "Mixed"

            tasks.append(lambda a=agent, h=hub, c=tight_context, d=current_diff, m=hub_mode, p=prof_domain, c_out=count, hint=hint, qt=q_type, s=seed: a.generate(
                note_schema=NoteSchema(title=h['title'], description="", type="Atomic", source_pages=[1]), 
                source_text=f"SEED: {s}\n" + c, 
                mechanics=hint,
                academic_level=d,
                count=c_out,
                prof_domain=p,
                q_type=qt,
                seed=str(s)
            ))
            
    sem = asyncio.Semaphore(2)

    async def run_agent(task_fn):
        async with sem:
            max_retries = 5
            base_delay = 2.0
            for attempt in range(max_retries):
                try:
                    return await task_fn()
                except DailyLimitExceededException as e:
                    if str(e) == "ROTATION_TRIGGERED":
                        print("[Ater Service] 🔄 Governor triggered rotation during practice generation. Swapping LLM key...")
                        swap_api_key_fn(governor._active_key)
                        continue
                    logger.error(f"[Ater Service] Daily limit exceeded in practice generation: {e}")
                    return {"error": str(e)}
                except Exception as e:
                    err_msg = str(e)
                    is_retryable = "429" in err_msg or "rate limit" in err_msg.lower() or is_retryable_ai_error(e)
                    if is_retryable:
                        if attempt == max_retries - 1:
                            logger.error(f"[Ater Service] Max retries reached: {e}")
                            return {"error": f"AI generation failed after retries: {e}"}
                        import re as _re
                        m = _re.search(r'Please try again in ([0-9.]+)s', err_msg)
                        delay = float(m.group(1)) + 2.0 if m else base_delay * (2 ** attempt)
                        logger.warning(f"[Ater Service] AI generation retry in {delay:.1f}s (attempt {attempt+1}): {e}")
                        await asyncio.sleep(delay)
                    else:
                        logger.error(f"[Ater Service] Non-retryable error during generation: {e}")
                        return {"error": str(e)}

    results = await asyncio.gather(*(run_agent(t) for t in tasks), return_exceptions=True)
    
    all_questions_llm = []
    for idx, res in enumerate(results):
        if isinstance(res, list):
            for q in res:
                if isinstance(q, dict) and "error" not in q and q.get("answer") != "N/A":
                    all_questions_llm.append(q)
        elif isinstance(res, dict) and "error" not in res and res.get("answer") != "N/A":
            all_questions_llm.append(res)
        else:
            logger.error(f"[Ater Service] Failed to generate a question: {res}")

    all_questions = all_questions + all_questions_llm
    
    for idx, q in enumerate(all_questions):
        q["id"] = idx + 1

    processed_questions = []
    for q in all_questions:
        if not isinstance(q, dict):
            continue
        q["type"] = normalize_question_type(q.get("type") or q.get("questionType") or q.get("question_type"))
        
        if q["type"] == "true_false":
            if isinstance(q.get("answer"), str):
                q["answer"] = q["answer"].lower() == "true"
                
        if q["type"] == "mcq" and isinstance(q.get("options"), (list, dict)):
            options = q["options"]
            if isinstance(options, list):
                q["options"] = {chr(65+i): str(v) for i, v in enumerate(options)}
            elif isinstance(options, dict):
                new_opts = {}
                for i, (k, v) in enumerate(options.items()):
                    new_key = chr(65+i) if len(k) > 1 or k.isdigit() else k.upper()
                    new_opts[new_key] = str(v)
                q["options"] = new_opts

            ans = str(q.get("answer", "")).upper()
            if ans not in q["options"]:
                value_match = None
                for k, v in q["options"].items():
                    if str(v).upper() == ans:
                        value_match = k
                        break
                if value_match:
                    q["answer"] = value_match
                else:
                    q["answer"] = list(q["options"].keys())[0] if q["options"] else "A"

        if q.get("type") == "mcq" and isinstance(q.get("options"), dict):
            banned_patterns = [
                r'\ball\s+of\s+the\s+above\b',
                r'\bnone\s+of\s+the\s+above\b',
                r'\ball\s+the\s+above\b',
                r'\bnone\s+the\s+above\b'
            ]
            for ok, ov in list(q["options"].items()):
                val_lower = str(ov).lower()
                if any(re.search(pat, val_lower) for pat in banned_patterns):
                    q["options"][ok] = "An alternative outcome that contradicts the source framework."
        
        processed_questions.append(enrich_question_v2(
            q,
            q_type=q.get("type"),
            concept=str(q.get("note_title") or hub.get("title") or "Practice concept"),
            note_title=str(q.get("note_title") or hub.get("title") or "Practice concept"),
        ))

    unique_processed = []
    for q in processed_questions:
        q_text = q.get("question", "").strip().lower()
        if not q_text:
            unique_processed.append(q)
            continue
        is_duplicate = False
        for uq in unique_processed:
            uq_text = uq.get("question", "").strip().lower()
            if SequenceMatcher(None, q_text, uq_text).ratio() > 0.80:
                is_duplicate = True
                break
        if not is_duplicate:
            unique_processed.append(q)
    processed_questions = unique_processed

    final_questions = []
    for q_type, count in distribution.items():
        type_qs = [q for q in processed_questions if q.get("type") == q_type]
        
        if len(type_qs) < count:
            if planner_llm:
                raise RuntimeError(
                    f"AI practice generation produced {len(type_qs)}/{count} '{q_type}' questions. "
                    "No deterministic fallback was written; retry or use a different model/key."
                )
            logger.warning(f"[Ater Service] Practice Builder: Shortfall detected for type '{q_type}'. Requested {count}, found {len(type_qs)}. Generating fallbacks.")
            fallback_pool = list(notes_to_process) if notes_to_process else []
            
            attempts = 0
            max_attempts = max(count * 6, 6)
            while len(type_qs) < count and attempts < max_attempts:
                attempts += 1
                note_content_val = ""
                if fallback_pool:
                    selected_note = random.choice(fallback_pool)
                    concept_val = selected_note.stem.replace("_", " ")
                    note_title_val = selected_note.stem.replace("_", " ")
                    try:
                        note_content_val = selected_note.read_text(encoding="utf-8")
                    except Exception:
                        note_content_val = ""
                else:
                    concept_val = hub["title"]
                    note_title_val = hub["title"]
                    
                fallback_q = create_fallback_question(q_type, concept_val, note_title_val, note_content=note_content_val)
                fallback_q["id"] = len(processed_questions) + 1
                
                is_dup = False
                for existing_q in type_qs:
                    if existing_q.get("question") == fallback_q["question"]:
                        is_dup = True
                        break
                if not is_dup:
                    type_qs.append(fallback_q)
                    processed_questions.append(fallback_q)
            while len(type_qs) < count:
                fallback_q = create_fallback_question(q_type, hub["title"], hub["title"])
                fallback_q["id"] = len(processed_questions) + 1
                fallback_q["question"] = f"{fallback_q.get('question', '')} [{len(type_qs) + 1}]"
                type_qs.append(fallback_q)
                processed_questions.append(fallback_q)
        
        final_questions.extend(type_qs[:count])
    
    questions = final_questions
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    f"{hub['title']} - {config.difficulty} Mastery Session"
    quiz_filename = f"Practice_{timestamp}.md"
    quiz_path = practice_dir / quiz_filename
    
    yaml_data = {
        "type": "practice",
        "hub_id": hub_id,
        "date": datetime.now().strftime('%Y-%m-%d'),
        "difficulty": config.difficulty,
        "question_types": list(distribution.keys()),
        "config": config.model_dump(),
        "score": None,
        "completed": False
    }

    ryaml = ruamel.yaml.YAML()
    ryaml.indent(mapping=2, sequence=4, offset=2)
    stream = io.StringIO()
    ryaml.dump(yaml_data, stream)
    yaml_frontmatter = f"---\n{stream.getvalue()}---\n"

    md_content = f"# Ater MASTERY SESSION: {hub['title'].upper()}\n\n"
    md_content += f"> Session ID: `{session_id}` | Date: {datetime.now().strftime('%Y-%m-%d')} | Difficulty: {config.difficulty}\n"
    md_content += f"> Scope: {selected_scope_str}\n\n"
    md_content += "## THE CHALLENGE\n\n"

    for idx, q in enumerate(questions, 1):
        q_text = q.get('question', '')
        if not q_text and q.get('type') == 'writing':
            q_text = q.get('answer', 'Analyze the following concept:')

        md_content += f"### Q{idx} | {(q.get('type') or 'mcq').replace('_', ' ').upper()}\n"
        md_content += f"{q_text}\n\n"

        if q.get('type') == 'mcq' and q.get('options'):
            for k, v in q['options'].items():
                md_content += f"- [ ] **{k})** {v}\n"
        elif q.get('type') == 'true_false':
            md_content += "- [ ] True\n- [ ] False\n"
        elif q.get('type') == 'fill_in':
            md_content += f"> {q.get('textWithBlanks', '')}\n"
        elif q.get('type') in ('debug', 'code'):
            snippet = q.get('content') or q.get('codeSnippet', '')
            lang = q.get('language') or 'text'
            md_content += f"```{lang}\n{snippet}\n```\n"
        elif q.get('type') == 'order' and q.get('steps'):
            for step in q['steps']:
                md_content += f"- [ ] {step}\n"
        elif q.get('type') == 'matching' and q.get('pairs'):
            rights = [p.get('right', '') for p in q['pairs']]
            random.shuffle(rights)
            md_content += "| Concept | Match |\n| :--- | :--- |\n"
            for pair in q['pairs']:
                md_content += f"| {pair.get('left', '')} | __________ |\n"
            md_content += "\n**Options:** " + ", ".join([f"`{r}`" for r in rights]) + "\n"

        md_content += "\n---\n\n"

    md_content += "\n## SOLUTION KEY\n\n"
    md_content += "<details>\n<summary>Click to reveal answers</summary>\n\n"

    for idx, q in enumerate(questions, 1):
        md_content += f"#### Q{idx}\n"
        ans_val = q.get('answer')
        ans_str = ", ".join(str(x) for x in ans_val) if isinstance(ans_val, list) else str(ans_val)
        md_content += f"- **Answer:** `{ans_str}`\n"
        md_content += f"- **Explanation:** {q.get('explanation', 'N/A')}\n\n"

    md_content += "</details>\n\n"
    md_content += "## Session Data\n"
    md_content += "```json\n"
    md_content += json.dumps(questions, indent=2, ensure_ascii=False)
    md_content += "\n```\n"
    quiz_path.parent.mkdir(parents=True, exist_ok=True)
    vm.write_note(quiz_path, yaml_frontmatter + md_content)

    status_dict[session_id] = "Completed"
    return {"session_id": session_id, "questions": questions, "quiz_path": str(quiz_path)}
