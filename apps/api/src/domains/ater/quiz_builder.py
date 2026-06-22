import re
import json
import asyncio
import time
import random
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime
from difflib import SequenceMatcher

from .schemas import AdvancedPracticeConfig, NoteSchema
from .agents import QuestionAgent, DOMAIN_MATRIX, get_persona, get_professional_domain
from .governor import DailyLimitExceededException

logger = logging.getLogger("Ater")

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

def select_dynamic_question_types(note_title: str, modality: str, source_snippet: str, count: int, mode: str = "ACADEMIC-GENERAL") -> List[str]:
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

def create_fallback_question(q_type: str, concept: str, note_title: str) -> dict:
    if q_type == "mcq":
        return {
            "type": "mcq",
            "question": f"Which of the following statements best describes the core mechanism or operational significance of {concept} in the context of {note_title}?",
            "options": {
                "A": f"It acts as a primary driving mechanism to achieve strategic outcomes defined in the {note_title} framework.",
                "B": f"It has no operational relevance and is considered a secondary, passive concept.",
                "C": f"It represents an external, ungrounded variable that operates outside of the {note_title} domain.",
                "D": f"It functions as a temporary measure that directly contradicts the stable principles of the unit."
            },
            "answer": "A",
            "explanation": f"The core definition and application of {concept} is a vital and active mechanism within the {note_title} framework."
        }
    elif q_type == "true_false":
        return {
            "type": "true_false",
            "question": f"According to the source context of {note_title}, the concept of {concept} is a key operational mechanism.",
            "answer": True,
            "explanation": f"{concept} plays an active, documented role in the primary text of {note_title}."
        }
    elif q_type == "fill_in":
        return {
            "type": "fill_in",
            "question": f"Fill in the missing mechanisms of {concept} in {note_title}.",
            "textWithBlanks": f"Within {note_title}, {concept} functions as a core [[blank]] to achieve the desired [[blank]].",
            "answer": ["mechanism", "objective"],
            "explanation": f"The note explicitly defines {concept} as a functional mechanism aiming toward a core objective."
        }
    elif q_type == "writing":
        return {
            "type": "writing",
            "question": f"Explain the fundamental mechanism, strategic importance, and structural role of {concept} in the context of {note_title}.",
            "answer": f"A comprehensive response defines {concept} exactly as described in the notes and maps its strategic importance to the primary themes of {note_title}.",
            "required_keywords": [w.lower() for w in re.findall(r"[A-Za-z]{4,}", concept.lower())[:3]] or ["mechanism"],
            "explanation": f"Verifies student capability to define and explain {concept} using precise academic terms."
        }
    elif q_type == "matching":
        return {
            "type": "matching",
            "question": f"Match the core sub-concepts and mechanisms of {concept} from {note_title} to their correct definitions.",
            "pairs": [
                {"left": f"Primary {concept}", "right": f"The central operational definition of {concept} in {note_title}."},
                {"left": f"Secondary {concept}", "right": f"The auxiliary support role of {concept} within the system."}
            ],
            "explanation": f"Assesses matching and categorization of {concept} parts."
        }
    elif q_type == "order":
        return {
            "type": "order",
            "question": f"Arrange the typical operational phases or steps in the execution of {concept} (from {note_title}) in the correct sequence:",
            "steps": [
                f"Step 2: Assessing resource constraints and tactical trade-offs.",
                f"Step 1: Identifying the core objectives of {concept}.",
                f"Step 3: Direct application and monitoring of results."
            ],
            "answer": [
                f"Step 1: Identifying the core objectives of {concept}.",
                f"Step 2: Assessing resource constraints and tactical trade-offs.",
                f"Step 3: Direct application and monitoring of results."
            ],
            "explanation": f"Ensures the student can causally trace the sequential steps of {concept}."
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
            "question": f"Synthesize a comprehensive strategic framework showing how {concept} (from {note_title}) interacts with the broader goals of {note_title}.",
            "answer": f"A perfect synthesis outlines the direct relationship between {concept} and the secondary variables in the unit, highlighting the critical trade-offs and structural implications.",
            "required_keywords": [w.lower() for w in re.findall(r"[A-Za-z]{4,}", concept.lower())[:3]] or ["synthesis"],
            "explanation": f"Assesses higher-order conceptual synthesis and integration skills."
        }
    elif q_type == "calculation":
        return {
            "type": "calculation",
            "question": f"Given a state capability factor of 0.8 and a focus weighting of 0.6 for {concept} in {note_title}, calculate the overall priority score.",
            "content": f"State Capability: 0.8\nFocus Weighting: 0.6",
            "answer": "0.48",
            "explanation": f"The priority score is calculated by multiplying capability and focus weighting: 0.8 * 0.6 = 0.48."
        }
    elif q_type == "data_analysis":
        return {
            "type": "data_analysis",
            "question": f"Interpret the following analytical dataset comparing {concept} metrics in {note_title}:",
            "content": f"Comparative Performance of {concept}:\n- Baseline Metric: 0.5\n- Target Metric: 0.95",
            "answer": "The target metric represents a substantial increase over baseline, validating the effectiveness.",
            "explanation": f"Tests data-reading capabilities for {concept} comparison."
        }
    elif q_type == "scenario":
        return {
            "type": "scenario",
            "question": f"Consider a scenario where the principles of {concept} (from {note_title}) are fully applied to a strategic dispute. Predict the most likely outcome and explain.",
            "answer": f"Applying {concept} provides a structured path for peaceful resolution by aligning shared objectives and resolving core operational differences.",
            "explanation": f"Tests scenario analysis and application of {concept}."
        }
    elif q_type == "trace":
        return {
            "type": "trace",
            "question": f"Trace the step-by-step causal pathway through which {concept} influences outcomes in {note_title}.",
            "answer": f"Step 1: Ingestion of concepts. Step 2: Strategic alignment. Step 3: Positive feedback loop.",
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
    pyyaml,
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
        
        atomic_notes = list(unit_dir.glob("*.md"))
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
        pq_file = next(unit_dir.glob("*_Possible_Questions.md"), None)
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
    distribution = config.questionDistribution
    total_q = sum(distribution.values())
    if total_q <= 0:
        raise ValueError("Total requested questions is 0. Please ensure the question distribution specifies at least one question type with a count greater than 0.")
    
    dist_str = ", ".join([f"{count} {type}" for type, count in distribution.items() if count > 0])
    
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
                            q_raw_type = (q.get("type") or q.get("questionType") or q.get("question_type") or "").lower().replace("_", "")
                            mapping_types = {
                                "mcq": "mcq", "multiplechoice": "mcq",
                                "true_false": "true_false", "truefalse": "true_false",
                                "fill_in": "fill_in", "fillin": "fill_in", "cloze": "fill_in", "clozedeletion": "fill_in",
                                "writing": "writing", "short_answer": "writing", "shortanswer": "writing",
                                "matching": "matching", "matchingmatrix": "matching",
                                "order": "order", "sequencing": "order", "sequencingsteps": "order",
                                "debug": "debug", "diagnostic": "debug", "diagnosticerror": "debug",
                                "synthesis": "synthesis", "socratic": "synthesis", "socraticsynthesis": "synthesis",
                                "calculation": "calculation", "data_analysis": "data_analysis",
                                "scenario": "scenario", "code": "code", "trace": "trace"
                            }
                            q_type_norm = mapping_types.get(q_raw_type, "writing")
                            q["type"] = q_type_norm
                            q["note_path"] = str(note_path)
                            q["note_title"] = note_path.stem
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
                        print(f"[Ater Service] 🔄 Governor triggered rotation during practice generation. Swapping LLM key...")
                        swap_api_key_fn(governor._active_key)
                        continue
                    logger.error(f"[Ater Service] Daily limit exceeded in practice generation: {e}")
                    return {"error": str(e)}
                except Exception as e:
                    err_msg = str(e)
                    is_rate = "429" in err_msg or "rate limit" in err_msg.lower()
                    if is_rate:
                        if attempt == max_retries - 1:
                            logger.error(f"[Ater Service] Max retries reached: {e}")
                            return {"error": "Rate limit exceeded after retries"}
                        import re as _re
                        m = _re.search(r'Please try again in ([0-9.]+)s', err_msg)
                        delay = float(m.group(1)) + 2.0 if m else base_delay * (2 ** attempt)
                        logger.warning(f"[Ater Service] 429 – waiting {delay:.1f}s (attempt {attempt+1})")
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
        q_raw_type = (q.get("type") or q.get("questionType") or q.get("question_type") or "").lower().replace("_", "")
        
        mapping = {
            "mcq": "mcq", "multiplechoice": "mcq",
            "true_false": "true_false", "truefalse": "true_false",
            "fill_in": "fill_in", "fillin": "fill_in", "cloze": "fill_in", "clozedeletion": "fill_in",
            "writing": "writing", "short_answer": "writing", "shortanswer": "writing",
            "matching": "matching", "matchingmatrix": "matching",
            "order": "order", "sequencing": "order", "sequencingsteps": "order",
            "debug": "debug", "diagnostic": "debug", "diagnosticerror": "debug",
            "synthesis": "synthesis", "socratic": "synthesis", "socraticsynthesis": "synthesis",
            "calculation": "calculation", "data_analysis": "data_analysis",
            "scenario": "scenario", "code": "code", "trace": "trace"
        }
        
        q["type"] = mapping.get(q_raw_type, "writing")
        
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
        
        processed_questions.append(q)

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
            logger.warning(f"[Ater Service] Practice Builder: Shortfall detected for type '{q_type}'. Requested {count}, found {len(type_qs)}. Generating fallbacks.")
            fallback_pool = list(notes_to_process) if notes_to_process else []
            
            while len(type_qs) < count:
                if fallback_pool:
                    selected_note = random.choice(fallback_pool)
                    concept_val = selected_note.stem.replace("_", " ")
                    note_title_val = selected_note.stem.replace("_", " ")
                else:
                    concept_val = hub["title"]
                    note_title_val = hub["title"]
                    
                fallback_q = create_fallback_question(q_type, concept_val, note_title_val)
                fallback_q["id"] = len(processed_questions) + 1
                
                is_dup = False
                for existing_q in type_qs:
                    if existing_q.get("question") == fallback_q["question"]:
                        is_dup = True
                        break
                if not is_dup:
                    type_qs.append(fallback_q)
                    processed_questions.append(fallback_q)
        
        final_questions.extend(type_qs[:count])
    
    questions = final_questions
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    quiz_title = f"{hub['title']} - {config.difficulty} Mastery Session"
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
    yaml_frontmatter = f"---\n{pyyaml.dump(yaml_data, sort_keys=False)}---\n"

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
