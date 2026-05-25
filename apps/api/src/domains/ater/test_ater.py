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
    assert "[[Supply_and_Demand]]" in healed # Should keep original if matched
    
    # Normalization match
    text2 = "The [[supply_and_demand]] is here."
    healed2 = healer.heal_wikilinks(text2)
    assert "[[Supply_and_Demand]]" in healed2
    
    # Case insensitive
    text3 = "The [[price_elasticity]] is high."
    healed3 = healer.heal_wikilinks(text3)
    assert "[[Price_Elasticity]]" in healed3
    
    # Aliases
    text4 = "The [[Supply and Demand|S&D]] curve."
    healed4 = healer.heal_wikilinks(text4)
    assert "[[Supply_and_Demand|S&D]]" in healed4
    
    # Aliases with case fix
    text5 = "The [[supply_and_demand|S&D]] curve."
    healed5 = healer.heal_wikilinks(text5)
    assert "[[Supply_and_Demand|S&D]]" in healed5

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

def test_router_inclusiveness_course_lock():
    router = DomainRouter()
    text = "Collaborative partnership among stakeholders uses participation, communication, and community development."
    assert router.route(text, course="Inclusiveness") == "EDUCATION"

def test_router_low_confidence_does_not_force_physics():
    router = DomainRouter()
    text = "Inclusive development and community participation include all stakeholders in local decisions."
    assert router.route(text) != "PHYSICS-KINEMATICS"

def test_validator_blocks_medical_drift_in_non_medical_note():
    from src.domains.ater.validator import AterValidator
    content = """---
title: Partnership_Definition
type: atomic_note
course: Inclusiveness
---

## Mental Model

In a medical diagnostics lab, patients and clinical staff coordinate diagnosis.

## Core Logic

Partnership means equal participation. [[Stakeholder_Definition]] [[Communication]] [[Respect]]

## Formal Translation

Details of the formal translation.

## The Proving Grounds

```interactive-quiz
[]
```
"""
    _, errors = AterValidator.validate_structure(content, course="Inclusiveness", mode="EDUCATION")
    assert any("MEDICAL_DOMAIN_DRIFT" in e for e in errors)

def test_validator_blocks_internal_source_hint_leak():
    from src.domains.ater.validator import AterValidator
    content = """---
title: Inclusive_Development_Strategies
type: atomic_note
course: Inclusiveness
---

## Mental Model

A community meeting includes every affected group.

## Core Logic

We utilize community development strategies to include every affected group. [[Community_Development]] [[Communication]] [[Respect]]
[ARCHITECT SOURCE HINT]

## Formal Translation

Details of the formal translation.

## The Proving Grounds

```interactive-quiz
[]
```
"""
    _, errors = AterValidator.validate_structure(content, course="Inclusiveness", mode="EDUCATION")
    assert any("HARD_FAILURE_MARKER" in e for e in errors)

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
        "## Mental Model\n\n"
        "Analogy goes here.\n\n"
        "## Core Logic\n\n"
        "Prose here [[Link1]] [[Link2]] [[Link3]].\n\n"
        "## Formal Translation\n\n"
        "Details of formal translation.\n\n"
        "## The Proving Grounds\n\n"
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


def test_chronological_sorting_in_hub(tmp_path):
    """Verify chronological sorting in sync_hub_connections based on frontmatter pages."""
    from src.domains.ater.post_processing import sync_hub_connections
    
    unit_dir = tmp_path / "unit_1"
    unit_dir.mkdir()
    
    # Create atomic notes with pages in the YAML frontmatter
    # Note A: page 10
    (unit_dir / "Note_A.md").write_text("""---
title: Note_A
type: atomic_note
course: Test Course
source_pages: [10]
prerequisites: []
---
## Mental Model
Content A. [[Note_B]] [[Note_C]]
""", encoding="utf-8")

    # Note B: page 5
    (unit_dir / "Note_B.md").write_text("""---
title: Note_B
type: atomic_note
course: Test Course
source_pages: [5]
prerequisites: []
---
## Mental Model
Content B.
""", encoding="utf-8")

    # Note C: page 8
    (unit_dir / "Note_C.md").write_text("""---
title: Note_C
type: atomic_note
course: Test Course
source_pages: [8]
prerequisites: []
---
## Mental Model
Content C.
""", encoding="utf-8")

    hub_file = tmp_path / "Test_Hub.md"
    hub_file.write_text("""---
title: Test_Hub
type: hub
---
## Connections
- [ ] [[Note_A]]
""", encoding="utf-8")

    # Sync
    sync_hub_connections(hub_file, unit_dir)
    
    # Read hub file and assert that order is Note_B -> Note_C -> Note_A
    hub_content = hub_file.read_text(encoding="utf-8")
    
    b_idx = hub_content.index("[[Note_B]]")
    c_idx = hub_content.index("[[Note_C]]")
    a_idx = hub_content.index("[[Note_A]]")
    
    assert b_idx < c_idx < a_idx, "Connections list must sort chronologically: Note_B (page 5) -> Note_C (page 8) -> Note_A (page 10)"


def test_smart_pdf_page_filter():
    """Verify smart page filtering, unique keyword coverage, page suggestions limit, and strict exclusion of zero-relevance concepts."""
    class MockService:
        from src.domains.ater.service import AterService
        _build_concept_source_packet = AterService._build_concept_source_packet
        _extract_source_snippet = AterService._extract_source_snippet

    service = MockService()
    
    full_text = (
        "[PAGE 1] Introduction to Modular programming and functions. We write simple programs.\n"
        "[PAGE 2] Dynamic memory allocation allows resizing. It is crucial for heap management.\n"
        "[PAGE 3] Functions are modular building blocks. Functions can call other functions in program design.\n"
        "[PAGE 4] Modular programming separates concerns. Functions help modular programming.\n"
    )

    # 1. Concept: "Modular programming" -> Keywords: "modular", "programming"
    packet, pages = service._build_concept_source_packet(
        full_text=full_text,
        seed_context="",
        title="Modular_programming",
        source_pages=[1, 2, 3, 4]
    )
    assert 2 not in pages, "Page 2 has no matching keywords and should be excluded"
    assert 1 in pages and 4 in pages, "Page 1 and Page 4 have high relevance (all keywords present) and should be matched"
    assert len(pages) <= 3, "Source page suggestions must be capped at 3"

    # 2. Concept with zero relevance: "Quantum Physics"
    packet_none, pages_none = service._build_concept_source_packet(
        full_text=full_text,
        seed_context="",
        title="Quantum_Physics",
        source_pages=[]
    )
    assert pages_none == [], "Zero-relevance concepts must return empty source page anchors"
    assert packet_none == "", "Zero-relevance concepts must return empty source packet"


def test_dynamic_skeleton_fallback_compilation():
    """Verify build_skeleton_note handles CS-SOFTWARE java code blocks and other formats dynamically."""
    from src.domains.ater.templates import build_skeleton_note
    from src.domains.ater.schemas import AtomicNoteSchema
    
    note_schema = AtomicNoteSchema(
        title="Array_List_Implementation",
        course="CS 101",
        mode="CS-SOFTWARE",
        prerequisites=[],
        source_pages=[3],
        description="A dynamic array."
    )
    
    domain = {"persona": "Computer Science"}
    source_snippet = "An ArrayList is a resizable array. It provides O(1) random access to elements but O(N) insertion in the worst case."
    
    # 1. Test CS-SOFTWARE mode
    res_cs = build_skeleton_note(note_schema, source_snippet, domain, all_titles=["ArrayList"])
    assert "```java" in res_cs, "CS-SOFTWARE mode must use executable Java code blocks"
    assert "public class ArrayListImplementation {" in res_cs, "Class name must be camel-cased title"
    assert "O(1) random access" in res_cs, "Should extract context prose correctly"
    assert "Array List Implementation behavior:" in res_cs, "Should have printable demonstration"

    # 2. Test non-CS-SOFTWARE mode (should use markdown table)
    note_schema_other = AtomicNoteSchema(
        title="Supply_Elasticity",
        course="Econ 101",
        mode="ECON-MICRO",
        prerequisites=[],
        source_pages=[10],
        description="Elasticity of supply."
    )
    res_other = build_skeleton_note(note_schema_other, source_snippet, {"persona": "Economics"}, all_titles=[])
    assert "```java" not in res_other, "Non-CS-SOFTWARE modes must not use Java code block fallbacks"
    assert "| Source Detail | Meaning |" in res_other, "Non-CS-SOFTWARE modes must use Markdown table fallbacks"

def test_read_pdf_integration(tmp_path):
    """Verify that read_note helper correctly routes to PDF loading when given a PDF path."""
    from src.domains.ater.assistant import AterAssistant
    from types import SimpleNamespace
    
    # Create a mock file
    pdf_file = tmp_path / "textbook.pdf"
    pdf_file.write_text("Dummy Content", encoding="utf-8")
    
    secrets = SimpleNamespace(
        vault_path=str(tmp_path),
        inbox_path=str(tmp_path),
        academic_path="Notes",
        ai_provider="groq",
        ai_model="llama3-8b-8192",
        ai_key="mock",
        ai_base_url=None,
        ai_max_tpm=None,
        ai_max_rpm=None,
        ai_max_tpd=None,
        ai_max_rpd=None,
        ai_max_concurrency=None
    )
    
    assistant = AterAssistant(secrets)
    
    # Try reading the mock file
    res = assistant.read_note("textbook.pdf")
    # It routes to pypdf.PdfReader and should raise an exception since it's not a valid PDF header,
    # which proves it reached the PDF parsing branch!
    assert "Error reading" in res or "pypdf" in res.lower()

