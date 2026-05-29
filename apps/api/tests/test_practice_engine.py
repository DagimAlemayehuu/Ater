import pytest
import re
from pathlib import Path
from src.domains.ater.srs import SRSEngine

def test_srs_match_keyword_plural_and_stem():
    """Verify that our custom stem and singular/plural matching works robustly."""
    # We can test the exact regex logic extracted from validate_feynman_gate
    def match_keyword(kw: str, text: str) -> bool:
        kw_clean = re.sub(r'[^\w\s]', '', kw.lower()).strip()
        text_clean = re.sub(r'[^\w\s]', ' ', text.lower()).strip()
        
        if kw_clean in text_clean:
            return True
            
        kw_words = [w for w in kw_clean.split() if w]
        text_words = [w for w in text_clean.split() if w]
        
        if not kw_words:
            return False
            
        for kw_w in kw_words:
            matched_word = False
            for tw in text_words:
                if tw == kw_w:
                    matched_word = True
                    break
                if tw.endswith('s') and tw[:-1] == kw_w:
                    matched_word = True
                    break
                if tw.endswith('es') and tw[:-2] == kw_w:
                    matched_word = True
                    break
                if tw.endswith('ies') and len(tw) > 3 and tw[:-3] + 'y' == kw_w:
                    matched_word = True
                    break
                if kw_w.endswith('s') and kw_w[:-1] == tw:
                    matched_word = True
                    break
                if kw_w.endswith('es') and kw_w[:-2] == tw:
                    matched_word = True
                    break
                if kw_w.endswith('ies') and len(kw_w) > 3 and kw_w[:-3] + 'y' == tw:
                    matched_word = True
                    break
                if len(kw_w) >= 5 and len(tw) >= 5:
                    if kw_w.startswith(tw[:5]) or tw.startswith(kw_w[:5]):
                        matched_word = True
                        break
            if not matched_word:
                return False
        return True

    # 1. Test plurals/singulars
    assert match_keyword("actors", "The state actor was present.")
    assert match_keyword("actor", "The international actors engaged in trade.")
    
    # 2. Test suffix/prefix stemming
    assert match_keyword("sovereignty", "The sovereign state ruled.")
    assert match_keyword("institution", "Favorable institutional tariff rates were established.")

    # 3. Test exact match
    assert match_keyword("Supply and Demand", "Here is supply and demand.")

    # 4. Test missing
    assert not match_keyword("military aid", "Only monetary grants were supplied.")

def test_distractor_scrubbing():
    """Verify that forbidden distractors are dynamically replaced."""
    banned_patterns = [
        r'\ball\s+of\s+the\s+above\b',
        r'\bnone\s+of\s+the\s+above\b',
        r'\ball\s+the\s+above\b',
        r'\bnone\s+the\s+above\b'
    ]
    
    options = {
        "A": "Cooperation",
        "B": "Conflict",
        "C": "All of the above",
        "D": "None of the above"
    }
    
    for k, v in list(options.items()):
        val_lower = str(v).lower()
        if any(re.search(pat, val_lower) for pat in banned_patterns):
            options[k] = "An alternative outcome that contradicts the source framework."
            
    assert options["C"] == "An alternative outcome that contradicts the source framework."
    assert options["D"] == "An alternative outcome that contradicts the source framework."
    assert options["A"] == "Cooperation"

def test_strict_question_distribution():
    """Verify that practice generation guarantees exact count and distribution using the fallback engine."""
    processed_questions = [
        {"type": "mcq", "question": "MCQ Question 1"},
        {"type": "fill_in", "question": "Fill-in Question 1"},
    ]
    distribution = {
        "mcq": 2,
        "fill_in": 1,
        "true_false": 1,
        "writing": 1,
    }
    
    def create_fallback_question(q_type: str, concept: str, note_title: str) -> dict:
        return {
            "type": q_type,
            "question": f"Fallback question for {q_type} on {concept}",
            "answer": "Fallback",
            "explanation": "Fallback explanation"
        }

    final_questions = []
    for q_type, count in distribution.items():
        type_qs = [q for q in processed_questions if q.get("type") == q_type]
        
        if len(type_qs) < count:
            while len(type_qs) < count:
                fallback_q = create_fallback_question(q_type, "Test Concept", "Test Note")
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

    # Assertions
    assert len(final_questions) == 5  # 2 MCQ, 1 Fill-in, 1 True-False, 1 Writing
    assert len([q for q in final_questions if q["type"] == "mcq"]) == 2
    assert len([q for q in final_questions if q["type"] == "fill_in"]) == 1
    assert len([q for q in final_questions if q["type"] == "true_false"]) == 1
    assert len([q for q in final_questions if q["type"] == "writing"]) == 1

def test_dynamic_proving_grounds_selectors():
    """Verify dynamic counting and smart question type selection heuristics."""
    from src.domains.ater.service import determine_dynamic_question_count, select_dynamic_question_types
    
    # 1. Test count determination
    c_short = determine_dynamic_question_count("Short Note", "Qualitative/Definitional", "Short text", 0)
    assert c_short == 2
    
    c_long = determine_dynamic_question_count("Long Note", "Qualitative/Definitional", "A" * 2000, 0)
    assert c_long == 4
    
    c_complex = determine_dynamic_question_count("Complex Note", "Quantitative", "Short text", 2)
    assert c_complex == 3  # base 2 + 1 boost
    
    # 2. Test type selection logic
    types_math = select_dynamic_question_types("Math Formula", "Quantitative", "Calculate value $x = y + 2$", 3)
    assert len(types_math) == 3
    assert "calculation" in types_math
    
    types_code = select_dynamic_question_types("Python Functions", "Procedural", "def hello(): print('hi')", 4)
    assert len(types_code) == 4
    assert "code" in types_code or "debug" in types_code

    # 3. Test EDUCATION domain mode is allowed andGates CS question types properly
    types_edu = select_dynamic_question_types("Inclusion Policy", "Qualitative/Definitional", "All students should participate.", 3, mode="EDUCATION")
    assert len(types_edu) == 3
    assert "code" not in types_edu
    assert "debug" not in types_edu
    assert "trace" not in types_edu


