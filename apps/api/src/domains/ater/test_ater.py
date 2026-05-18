import pytest
import json
import re
from src.domains.ater.router import DomainRouter
from src.domains.ater.healer import LogicHealer
from src.domains.ater.templates import render_atomic_note
from src.domains.ater.agents import DOMAIN_MATRIX

def test_domain_router():
    router = DomainRouter()
    
    # Test macro
    macro_text = "The Federal Reserve adjusted interest rates to combat inflation. Macroeconomics is the study of gdp."
    domain1 = router.route(macro_text)
    assert domain1 == "ECON-MACRO"
    
    # Test micro
    micro_text = "The elasticity of demand for the product caused the firm to lower marginal costs."
    domain2 = router.route(micro_text)
    assert domain2 == "ECON-MICRO"

def test_logic_healer_arithmetic():
    healer = LogicHealer(canonical_titles=set())
    
    # Test simple arithmetic (verify_arithmetic is deprecated, passes through)
    text = "The price is 10 * 0.5 = 6 dollars."
    healed = healer.verify_arithmetic(text)
    assert healed == text
    
    # Test floats
    text2 = "Revenue: 100.5 + 50.5 = 150"
    healed2 = healer.verify_arithmetic(text2)
    assert healed2 == text2

def test_logic_healer_wikilinks():
    healer = LogicHealer(canonical_titles={"Supply and Demand", "Price_Elasticity"})
    
    # Exact match but spaces
    text = "The [[Supply and Demand]] model."
    healed = healer.heal_wikilinks(text)
    assert "[[Supply and Demand]]" in healed # Should keep original if matched
    
    # Normalization match
    text2 = "The [[supply_and_demand]] is here."
    healed2 = healer.heal_wikilinks(text2)
    assert "[[Supply and Demand]]" in healed2
    
    # Case insensitive
    text3 = "The [[price_elasticity]] is high."
    healed3 = healer.heal_wikilinks(text3)
    assert "[[Price_Elasticity]]" in healed3
    
    # Aliases
    text4 = "The [[Supply and Demand|S&D]] curve."
    healed4 = healer.heal_wikilinks(text4)
    assert "[[Supply and Demand|S&D]]" in healed4
    
    # Aliases with case fix
    text5 = "The [[supply_and_demand|S&D]] curve."
    healed5 = healer.heal_wikilinks(text5)
    assert "[[Supply and Demand|S&D]]" in healed5

def test_logic_healer_sanitization():
    healer = LogicHealer(canonical_titles=set())
    
    text = "Sure, I can help with that. The core concept is supply. Hope this helps!"
    healed = healer.sanitize_prose(text)
    assert "Sure" not in healed
    assert "Hope this helps" not in healed
    assert "The core concept is supply." in healed

def test_logic_healer_quiz_json():
    healer = LogicHealer(canonical_titles=set())
    
    # Mock a quiz json
    quiz = [
        {
            "id": "q1",
            "type": "mcq",
            "question": "What is 5 + 5?",
            "answer": "10",
            "explanation": "Because 5 + 5 = 10."
        }
    ]
    raw_json = json.dumps(quiz)
    healed_json_str = healer.heal_quiz_json(raw_json)
    
    assert "5 + 5 = 10" in healed_json_str

def test_render_atomic_note():
    healer = LogicHealer(canonical_titles={"Elasticity"})
    domain = DOMAIN_MATRIX["ECON-MICRO"]
    
    data = {
        "title": "Supply_Shock",
        "course": "Econ 101",
        "mode": "ECON-MICRO",
        "h1_title": domain["h1"],
        "h2_title": domain["h2"],
        "mental_model": "A sudden change in supply. Sure, here is the note.",
        "core_logic": "It affects [[elasticity]]. 10 * 10 = 101.",
        "formal_model": "Formal model text.",
        "hub": "[[Supply_Hub]]"
    }
    
    result = render_atomic_note(data, healer=healer)
    
    # Check body content (no frontmatter anymore in result)
    assert "## Mental Model" in result
    assert "## " + domain["h1"] in result
    
    # Check healing occurred during render
    assert "Sure, here is the note." not in result
    assert "[[Elasticity]]" in result

def test_ater_validator_truncation():
    from src.domains.ater.validator import AterValidator
    
    # Test valid ending (punctuation)
    valid_content = "---\ntitle: Test\ntype: test\ncourse: test\n---\nHere is a complete sentence. It has three links [[Link1]], [[Link2]], [[Link3]]."
    is_valid, errors = AterValidator.validate_structure(valid_content)
    assert not any("TRUNCATED_GENERATION" in e for e in errors)
    
    # Test valid ending (code block)
    valid_code = "---\ntitle: Test\ntype: test\ncourse: test\n---\nHere is a complete sentence. [[Link1]], [[Link2]], [[Link3]].\n```interactive-quiz\n[{\"type\": \"mcq\", \"question\": \"q\", \"answer\": \"a\"}, {\"type\": \"mcq\", \"question\": \"q2\", \"answer\": \"a2\"}, {\"type\": \"mcq\", \"question\": \"q3\", \"answer\": \"a3\"}]\n```"
    is_valid, errors = AterValidator.validate_structure(valid_code)
    assert not any("TRUNCATED_GENERATION" in e for e in errors)
    
    # Test truncated ending
    truncated_content = "---\ntitle: Test\ntype: test\ncourse: test\n---\nHere is a complete sentence. [[Link1]], [[Link2]], [[Link3]]. But this one is cut of"
    is_valid, errors = AterValidator.validate_structure(truncated_content)
    assert any("TRUNCATED_GENERATION" in e for e in errors)

def test_ater_validator_quiz_logic():
    from src.domains.ater.validator import AterValidator
    
    # Test Answer Divergence
    divergent_quiz = """---
title: Test
type: test
course: test
---
Body content. [[Link1]], [[Link2]], [[Link3]].
```interactive-quiz
[
  {"type": "writing", "question": "Q1", "answer": "10", "explanation": "The result is X = 12."},
  {"type": "writing", "question": "Q2", "answer": "10", "explanation": "The result is X = 10."},
  {"type": "writing", "question": "Q3", "answer": "10", "explanation": "The result is X = 10."}
]
```"""
    is_valid, errors = AterValidator.validate_structure(divergent_quiz)
    assert any("ANSWER_DIVERGENCE" in e for e in errors)

    # Test Internal Truncation
    truncated_quiz = """---
title: Test
type: test
course: test
---
Body content. [[Link1]], [[Link2]], [[Link3]].
```interactive-quiz
[
  {"type": "writing", "question": "Q1", "answer": "10", "explanation": "This explanation is cut of"},
  {"type": "writing", "question": "Q2", "answer": "10", "explanation": "Correct."},
  {"type": "writing", "question": "Q3", "answer": "10", "explanation": "Correct."}
]
```"""
    is_valid, errors = AterValidator.validate_structure(truncated_quiz)
    assert any("TRUNCATED_EXPLANATION" in e for e in errors)

def test_logic_healer_divergence_fix():
    from src.domains.ater.healer import LogicHealer
    import json
    healer = LogicHealer(canonical_titles=set())
    
    # Mock a quiz json with divergence in writing type
    quiz = [
        {
            "type": "writing",
            "question": "Calculate X",
            "answer": "10",
            "explanation": "The final result is X = 12."
        }
    ]
    raw_json = json.dumps(quiz)
    healed_json_str = healer.heal_quiz_json(raw_json)
    
    # Check that answer was updated to 12
    assert '"answer": "12"' in healed_json_str

def test_logic_healer_math_precision():
    from src.domains.ater.healer import LogicHealer
    healer = LogicHealer(canonical_titles=set())
    # Test precision (verify_arithmetic is deprecated, passes through)
    text = "0.1 + 0.2 = 0.4"
    healed = healer.verify_arithmetic(text)
    assert healed == text

def test_router_parent_anchor():
    from src.domains.ater.router import DomainRouter
    router = DomainRouter()
    text = "Market Equilibrium strategy"
    # Without parent_mode
    mode1 = router.route(text)
    assert mode1 in ["BIZ-STRATEGY", "ECON-MACRO", "ECON-MICRO"]
    # With parent_mode anchor
    mode2 = router.route("completelyunknownword", parent_mode="ECON-MICRO")
    assert mode2 == "ECON-MICRO"

def test_router_economics_anchors():
    from src.domains.ater.router import DomainRouter
    router = DomainRouter()
    assert router.route("National income and aggregate demand") == "ECON-MACRO"
    assert router.route("Perfect competition and marginal cost") == "ECON-MICRO"

# ── NEW HARDENING TESTS ────────────────────────────────────────────────────────

def test_wikilink_density_enforcement():
    """enforce_wikilink_density must trim sections exceeding 5 wikilinks."""
    import re
    from src.domains.ater.healer import LogicHealer
    healer = LogicHealer(canonical_titles=set())
    body = (
        "## 2. Economic Theory\n"
        "[[A]] [[B]] [[C]] [[D]] [[E]] [[F]] [[G]] are related.\n"
        "## 3. Limitations\n"
        "Only [[X]] [[Y]] here.\n"
    )
    result = healer.enforce_wikilink_density(body, max_links=5)
    sec2 = re.search(r'## 2\. Economic Theory\n(.*?)## 3\.', result, re.DOTALL)
    assert sec2, "Section 2 not found"
    links2 = re.findall(r'\[\[([^\]]+)\]\]', sec2.group(1))
    assert len(links2) <= 5, f"Expected <=5 links in section 2, got {len(links2)}"
    sec3 = re.search(r'## 3\. Limitations\n(.*?)$', result, re.DOTALL)
    assert sec3
    links3 = re.findall(r'\[\[([^\]]+)\]\]', sec3.group(1))
    assert len(links3) == 2, "Section 3 should be untouched"

def test_walkthrough_normalization():
    """purge_pedagogical_artifacts must renumber walkthrough steps sequentially."""
    import re
    from src.domains.ater.post_processing import sanitize_body
    body = (
        "## 5. Walkthrough\n"
        "## Step 3: Do the first thing.\n"
        "## Step 1: Do the second thing.\n"
        "## Step 5: Do the third thing.\n"
        "```interactive-quiz\n[]\n```"
    )
    result, fixes = sanitize_body(body)
    steps = re.findall(r'\*\*Step (\d+):\*\*', result)
    assert steps == ['1', '2', '3'], f"Expected [1,2,3] got {steps}"
    assert 'normalized_walkthrough_steps' in fixes

def test_section_truncation_guard():
    """Validator must catch a section body that ends mid-word without punctuation."""
    from src.domains.ater.validator import AterValidator
    truncated = (
        "---\ntitle: Test\ntype: test\ncourse: econ\n---\n"
        "## Mental Model\n"
        "This scenario is cut of"
    )
    _, errors = AterValidator.validate_structure(truncated)
    assert any("SECTION_TRUNCATION" in e or "TRUNCATED_GENERATION" in e for e in errors), \
        f"Expected truncation error, got: {errors}"

def _run_kahn(notes):
    """Run Kahn's topo sort inline (no AterService instantiation)."""
    title_set = {n["title"] for n in notes}
    note_map = {n["title"]: n for n in notes}
    graph = {}
    for note in notes:
        raw = note.get("prerequisites") or []
        valid = [p.replace("[[", "").replace("]]", "") for p in raw
                 if p.replace("[[", "").replace("]]", "") in title_set]
        graph[note["title"]] = valid[:2]
    dependents = {t: [] for t in title_set}
    in_degree = {t: 0 for t in title_set}
    for title, prereqs in graph.items():
        for prereq in prereqs:
            in_degree[title] += 1
            dependents[prereq].append(title)
    queue = [note_map[t] for t in title_set if in_degree[t] == 0]
    sorted_notes = []
    while queue:
        node = queue.pop(0)
        sorted_notes.append(node)
        for dep_title in dependents.get(node["title"], []):
            in_degree[dep_title] -= 1
            if in_degree[dep_title] == 0:
                queue.append(note_map[dep_title])
    sorted_titles = {n["title"] for n in sorted_notes}
    remaining = [n for n in notes if n["title"] not in sorted_titles]
    for r in remaining:
        r["prerequisites"] = []
    sorted_notes.extend(remaining)
    return sorted_notes

def test_topological_sort_linear():
    """Topo sort should produce A -> B -> C ordering."""
    notes = [
        {"title": "C", "prerequisites": ["[[B]]"]},
        {"title": "A", "prerequisites": []},
        {"title": "B", "prerequisites": ["[[A]]"]},
    ]
    result = _run_kahn(notes)
    order = [n["title"] for n in result]
    assert order.index("A") < order.index("B"), "A must come before B"
    assert order.index("B") < order.index("C"), "B must come before C"

def test_topological_sort_circular_breaks():
    """Circular prerequisites (X->Y->X) must resolve without infinite loop."""
    notes = [
        {"title": "X", "prerequisites": ["[[Y]]"]},
        {"title": "Y", "prerequisites": ["[[X]]"]},
    ]
    result = _run_kahn(notes)
    assert len(result) == 2, "Must return both notes"
    stripped = [n for n in result if n.get("prerequisites") == []]
    assert len(stripped) >= 1, "At least one circular node must have prereqs stripped"
