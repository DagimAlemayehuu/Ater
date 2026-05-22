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

def test_healer_preserves_latex_blocks():
    healer = LogicHealer(canonical_titles=set())
    text = """This is standard text.

$$
- x_1 + x_2 = 0
- y_1 + y_2 = 0
$$

More text."""
    healed = healer.bullets_to_prose(text)
    assert "$$" in healed
    assert "- x_1 + x_2 = 0" in healed
    assert "- y_1 + y_2 = 0" in healed

def test_healer_comprehensive_formatting_and_gutter_law():
    healer = LogicHealer(canonical_titles={"Machine_Learning", "Deep_Learning"})
    
    malformed_input = """Sure, here is your note about artificial intelligence.
Let's break this down step-by-step.
# 1. The Intuitive Analogy
- Machine learning is like teaching a child by showing examples.
- Deep learning is a subset that uses neural networks.
# 2. The Core Execution
| Metric | Value |
| Accuracy | 99% |
Check [[machine learning]] and [[deep learning]]!
```python
def train_model():
    pass
```
I hope this is useful for you! Let me know if you need anything else.
"""
    
    healed = healer.heal_all(malformed_input, is_quiz=False, exclude_title="")
    
    # 1. Check conversational sludge is fully pruned
    assert "Sure, here is your note" not in healed
    assert "Let's break this down" not in healed
    assert "I hope this is useful" not in healed
    assert "Let me know if you need" not in healed
    
    # 2. Check bullets are converted to prose
    assert "- Machine learning" not in healed
    assert "- Deep learning" not in healed
    
    # 3. Check wikilinks are correctly converted to Underscore_Title_Case
    assert "[[Machine_Learning]]" in healed
    assert "[[Deep_Learning]]" in healed
    
    # 4. Check Gutter Law spacing is perfectly restored
    assert "\n\n# 2. The Core Execution\n\n" in healed
    assert "\n\n| Metric | Value |\n| Accuracy | 99% |\n\n" in healed
    assert "\n\n```python\ndef train_model():\n    pass\n```\n\n" in healed
