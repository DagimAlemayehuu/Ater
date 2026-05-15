import pytest
from src.domains.ater.healer import LogicHealer

def test_healer_wikilink_pruning():
    # Only "Existing_Concept" is in the plan
    healer = LogicHealer(canonical_titles={"Existing_Concept"})
    
    text = "Check [[Existing_Concept]] and [[Hallucinated_Concept|Alias]]."
    healed = healer.heal_wikilinks(text)
    
    assert "[[Existing_Concept]]" in healed
    assert "[[Hallucinated_Concept]]" not in healed
    assert "Alias" in healed
    assert "[[" not in healed.split("Check [[Existing_Concept]] and ")[1]

def test_healer_bracket_repair():
    healer = LogicHealer(canonical_titles={"Math_Logic"})
    
    text = "This is [[Math_Logic] broken."
    healed = healer.heal_wikilinks(text)
    
    assert "[[Math_Logic]]" in healed

def test_healer_wikilink_density_enforcement():
    healer = LogicHealer(canonical_titles={"A", "B", "C", "D", "E", "F"})
    
    # 6 links in one section
    text = """## 1. Intro
[[A]] [[B]] [[C]] [[D]] [[E]] [[F]]
"""
    # Max 3 links
    healed = healer.enforce_wikilink_density(text, max_links=3)
    
    assert "[[A]]" in healed
    assert "[[B]]" in healed
    assert "[[C]]" in healed
    assert "[[D]]" not in healed
    assert "D" in healed # Should be plain text
    assert "[[" not in healed.split("[[C]]")[1]

def test_healer_xml_tag_sanitization():
    healer = LogicHealer(canonical_titles=set())
    text = "<PLAIN_ENGLISH>Some text</PLAIN_ENGLISH> Normal text."
    healed = healer.strip_orphan_xml_tags(text)
    assert "<PLAIN_ENGLISH>" not in healed
    assert "</PLAIN_ENGLISH>" not in healed
    assert "Some text" in healed

def test_healer_markdown_tables():
    healer = LogicHealer(canonical_titles=set())
    text = "Header 1 | Header 2\n---|---\nVal 1 | Val 2"
    healed = healer.heal_markdown_tables(text)
    assert "| Header 1 | Header 2 |" in healed
    assert "| Val 1 | Val 2 |" in healed

def test_healer_mermaid_pipes():
    healer = LogicHealer(canonical_titles=set())
    text = "```mermaid\ngraph TD\n    | A[Node] -->|label| B[Node]\n```"
    healed = healer.fix_mermaid_pipes(text)
    assert "    A[Node]" in healed
    assert "| A[Node]" not in healed
