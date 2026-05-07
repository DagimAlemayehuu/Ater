import pytest
import json
from src.domains.oka.router import DomainRouter
from src.domains.oka.healer import LogicHealer
from src.domains.oka.templates import render_atomic_note
from src.domains.oka.agents import DOMAIN_MATRIX

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
    
    # Test simple arithmetic
    text = "The price is 10 * 0.5 = 6 dollars."
    healed = healer.verify_arithmetic(text)
    assert "10 * 0.5 = 5" in healed
    
    # Test floats
    text2 = "Revenue: 100.5 + 50.5 = 150"
    healed2 = healer.verify_arithmetic(text2)
    assert "100.5 + 50.5 = 151" in healed2

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
    
    # Mock a quiz json with bad math in explanation
    quiz = [
        {
            "id": "q1",
            "type": "mcq",
            "question": "What is 5 + 5?",
            "answer": "10",
            "explanation": "Because 5 + 5 = 11."
        }
    ]
    raw_json = json.dumps(quiz)
    healed_json_str = healer.heal_quiz_json(raw_json)
    
    assert "5 + 5 = 10" in healed_json_str
    assert "11" not in healed_json_str

def test_render_atomic_note():
    healer = LogicHealer(canonical_titles={"Elasticity"})
    domain = DOMAIN_MATRIX["ECON-MICRO"]
    
    data = {
        "title": "Supply_Shock",
        "course": "Econ 101",
        "mode": "ECON-MICRO",
        "h1_title": domain["h1"],
        "artifact_title": domain["artifact"],
        "mental_model": "A sudden change in supply. Sure, here is the note.",
        "technical_definition": "It affects [[elasticity]]. 10 * 10 = 101.",
        "hub": "[[Supply_Hub]]"
    }
    
    result = render_atomic_note(data, healer=healer)
    
    # Check body content (no frontmatter anymore in result)
    assert "## 1. Mental Model" in result
    assert "## 2. " + domain["h1"] in result
    
    # Check healing occurred during render
    assert "Sure, here is the note." not in result
    assert "[[Elasticity]]" in result
    assert "10 * 10 = 100" in result

def test_oka_validator_truncation():
    from src.domains.oka.validator import OkaValidator
    
    # Test valid ending (punctuation)
    valid_content = "---\ntitle: Test\ntype: test\ncourse: test\n---\nHere is a complete sentence. It has three links [[Link1]], [[Link2]], [[Link3]]."
    is_valid, errors = OkaValidator.validate_structure(valid_content)
    assert not any("TRUNCATED_GENERATION" in e for e in errors)
    
    # Test valid ending (code block)
    valid_code = "---\ntitle: Test\ntype: test\ncourse: test\n---\nHere is a complete sentence. [[Link1]], [[Link2]], [[Link3]].\n```interactive-quiz\n[{\"type\": \"mcq\", \"question\": \"q\", \"answer\": \"a\"}, {\"type\": \"mcq\", \"question\": \"q2\", \"answer\": \"a2\"}, {\"type\": \"mcq\", \"question\": \"q3\", \"answer\": \"a3\"}]\n```"
    is_valid, errors = OkaValidator.validate_structure(valid_code)
    assert not any("TRUNCATED_GENERATION" in e for e in errors)
    
    # Test truncated ending
    truncated_content = "---\ntitle: Test\ntype: test\ncourse: test\n---\nHere is a complete sentence. [[Link1]], [[Link2]], [[Link3]]. But this one is cut of"
    is_valid, errors = OkaValidator.validate_structure(truncated_content)
    assert any("TRUNCATED_GENERATION" in e for e in errors)

