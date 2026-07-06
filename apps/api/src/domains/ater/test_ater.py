import json
import re
import pytest
import inspect
from src.domains.ater.router import DomainRouter
from src.domains.ater.healer import LogicHealer
from src.domains.ater.templates import render_atomic_note
from src.domains.ater.agents import DOMAIN_MATRIX

def test_google_model_factory_respects_explicit_long_timeout(monkeypatch):
    from src.domains.ai.factory import ModelFactory
    from src.domains.ater.governor import governor

    class FakeGoogleModel:
        last_config = None

        def __init__(self, **config):
            FakeGoogleModel.last_config = config

        def invoke(self, *args, **kwargs):
            return None

        async def ainvoke(self, *args, **kwargs):
            return None

        def generate(self, *args, **kwargs):
            return None

        async def agenerate(self, *args, **kwargs):
            return None

        def stream(self, *args, **kwargs):
            return iter(())

        async def astream(self, *args, **kwargs):
            if False:
                yield None

    monkeypatch.setitem(ModelFactory.PROVIDERS, "google", FakeGoogleModel)
    monkeypatch.setattr(governor, "configure", lambda *args, **kwargs: None)
    monkeypatch.setattr(governor, "get_valid_api_key", lambda key, **kwargs: key)

    ModelFactory.get_model(
        provider="google",
        model_name="Gemma-4-31b-it",
        api_key="test-key",
        timeout=180,
        request_timeout=180,
    )

    assert FakeGoogleModel.last_config["timeout"] == 180
    assert FakeGoogleModel.last_config["request_timeout"] == 180

def test_source_roadmap_json_parser_accepts_wrapped_gemma_object():
    from src.api.routers.ater import _extract_json_array

    parsed = _extract_json_array(
        """```json
{"roadmap":[{"title":"Consumer Preferences","source_pages":[3]}]}
```"""
    )

    assert parsed == [{"title": "Consumer Preferences", "source_pages": [3]}]


def test_source_roadmap_json_parser_ignores_preamble_brackets_before_array():
    from src.api.routers.ater import _extract_json_array

    parsed = _extract_json_array(
        """I used the source pages [3, 4].

[
  {"title":"Consumer Preferences","source_pages":[3]},
  {"title":"Budget Line","source_pages":[12]}
]"""
    )

    assert [item["title"] for item in parsed] == ["Consumer Preferences", "Budget Line"]


def test_source_roadmap_refiner_repairs_non_json_gemma_response(monkeypatch):
    from types import SimpleNamespace
    import src.api.routers.ater as ater_router

    class FakeResponse:
        def __init__(self, content):
            self.content = content

    class FakeLLM:
        def __init__(self):
            self.calls = []

        def invoke(self, messages):
            self.calls.append(messages)
            if len(self.calls) == 1:
                return FakeResponse("The roadmap should start with Consumer Preferences, then later include Budget Line.")
            return FakeResponse('[{"title":"Consumer Preferences","source_pages":[3]}]')

    fake_llm = FakeLLM()
    monkeypatch.setattr(ater_router, "_build_source_llm", lambda *_args, **_kwargs: fake_llm)
    secrets = SimpleNamespace(
        ai_key="configured",
        ai_provider="google",
        ai_model="Gemma-4-31b-it",
        ai_base_url=None,
        ai_max_tpm=None,
        ai_max_rpm=None,
        ai_max_tpd=None,
        ai_max_rpd=None,
        ai_max_concurrency=None,
    )

    refine = ater_router._source_roadmap_refiner(secrets)
    parsed = refine(
        {
            "topic": "Consumer Preferences",
            "domain": "ECON-MICRO",
            "objectives": [],
            "pages": [{"page_number": 3, "content": "Consumer preferences rank bundles."}],
            "nodes": [{"title": "Consumer Preferences", "source_pages": [3]}],
        }
    )

    assert parsed == [{"title": "Consumer Preferences", "source_pages": [3]}]
    assert len(fake_llm.calls) == 2
    assert "10-28" not in fake_llm.calls[0][0][1]
    assert "10-28" not in fake_llm.calls[0][1][1]
    assert "Convert this model response into valid JSON" in fake_llm.calls[1][1][1]


def test_source_roadmap_refiner_accepts_ai_bullets_without_repair(monkeypatch):
    from types import SimpleNamespace
    import src.api.routers.ater as ater_router

    class FakeResponse:
        content = "- Consumer Preferences\n- Budget Line"

    class FakeLLM:
        def __init__(self):
            self.calls = 0

        def invoke(self, _messages):
            self.calls += 1
            return FakeResponse()

    fake_llm = FakeLLM()
    monkeypatch.setattr(ater_router, "_build_source_llm", lambda *_args, **_kwargs: fake_llm)
    secrets = SimpleNamespace(
        ai_key="configured",
        ai_provider="google",
        ai_model="Gemma-4-31b-it",
        ai_base_url=None,
        ai_max_tpm=None,
        ai_max_rpm=None,
        ai_max_tpd=None,
        ai_max_rpd=None,
        ai_max_concurrency=None,
    )

    parsed = ater_router._source_roadmap_refiner(secrets)(
        {
            "topic": "Consumer Preferences",
            "domain": "ECON-MICRO",
            "objectives": [],
            "pages": [{"page_number": 3, "content": "Consumer preferences and budget line."}],
            "nodes": [
                {"title": "Consumer Preferences", "source_pages": [3]},
                {"title": "Budget Line", "source_pages": [12]},
            ],
        }
    )

    assert parsed == [
        {"title": "Consumer Preferences", "source_pages": [3]},
        {"title": "Budget Line", "source_pages": [12]},
    ]
    assert fake_llm.calls == 1

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
  {"type": "writing", "question": "Q1", "answer": "10", "explanation": "This explanation is cut of -"},
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

def test_search_web_and_schemas(tmp_path):
    from src.domains.ater.assistant import AterAssistant
    from types import SimpleNamespace
    from unittest.mock import patch

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
    
    # 1. Verify schema integration in get_tools
    tools = assistant.get_tools()
    tool_names = [t.name for t in tools]
    assert "search_web" in tool_names
    
    # 2. Test search_web offline fallback (when DDGS throws)
    with patch("src.domains.ater.assistant.DDGS") as mock_ddgs:
        # Simulate DDGS instance throwing exception on context manager enter
        mock_ddgs.return_value.__enter__.side_effect = Exception("No internet")
        res = assistant.search_web("quantum computing")
        assert "*(Offline: falling back to local vault RAG)*" in res

    # 3. Test search_web filters Prime Video noise and retries office-holder queries
    with patch("src.domains.ater.assistant.DDGS") as mock_ddgs:
        ddgs = mock_ddgs.return_value.__enter__.return_value
        ddgs.text.side_effect = [
            [
                {
                    "title": "The Grand Tour - Welcome to Prime Video",
                    "href": "https://www.primevideo.com/",
                    "body": "Watch movies and TV shows with Prime.",
                },
                {
                    "title": "Amazon.com: Prime Video",
                    "href": "https://www.amazon.com/Prime-Video/",
                    "body": "Included with Prime.",
                },
            ],
            [
                {
                    "title": "Prime Minister of Ethiopia",
                    "href": "https://en.wikipedia.org/wiki/Prime_Minister_of_Ethiopia",
                    "body": "The incumbent prime minister is Abiy Ahmed, serving since 2 April 2018.",
                }
            ],
        ]

        res = assistant.search_web("prime minister of ethiopia 2024")
        assert "Abiy Ahmed" in res
        assert "Prime Video" not in res
        assert ddgs.text.call_count == 2


def test_source_job_deploys_academic_pdf_to_study_planner_and_notes(tmp_path, monkeypatch):
    from types import SimpleNamespace
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Chapter_4_Production_Cost.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic source")

    docs = [
        SimpleNamespace(
            page_content=(
                "Chapter 4 Production And Cost\n"
                "Objectives\n"
                "Define production function\n"
                "Describe short run production"
            ),
            metadata={"page": 0},
        ),
        SimpleNamespace(
            page_content="Production function shows the relationship between inputs and output.",
            metadata={"page": 1},
        ),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Microeconomics",
        unit="04_Production_And_Cost",
    )
    deployed = service.deploy_to_vault(job["job_id"], str(tmp_path))

    hub_path = tmp_path / "database" / "study planner" / "Winter2026" / "Microeconomics" / "04_Production_And_Cost" / "Production_And_Cost_Hub.md"
    note_path = tmp_path / "Notes" / "academic" / "Winter2026" / "Microeconomics" / "04_Production_And_Cost" / "01_Source_Roadmap" / "Production_Function.md"
    processed_pdf = tmp_path / "Inbox" / "generated" / "academic" / "Chapter_4_Production_Cost.pdf"

    assert hub_path.exists()
    assert note_path.exists()
    assert processed_pdf.exists()
    assert not pdf_path.exists()
    assert "SourceJobs" not in "\n".join(deployed["written_files"])


def test_source_job_builds_nested_chapter_roadmap_with_full_coverage(tmp_path, monkeypatch):
    from types import SimpleNamespace
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Chapter_2_Web_Foundations.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic source")

    docs = [
        SimpleNamespace(
            page_content=(
                "Chapter 2 Web Foundations\n"
                "Objectives\n"
                "Define HTML document structure\n"
                "Explain CSS selectors\n"
                "Describe JavaScript event handling"
            ),
            metadata={"page": 0},
        ),
        SimpleNamespace(
            page_content=(
                "HTML document structure uses semantic elements, attributes, and nested tags "
                "to describe the meaning of page content."
            ),
            metadata={"page": 1},
        ),
        SimpleNamespace(
            page_content=(
                "CSS selectors target elements by type, class, id, and attributes. The cascade "
                "resolves competing declarations using specificity and source order."
            ),
            metadata={"page": 2},
        ),
        SimpleNamespace(
            page_content=(
                "JavaScript event handling connects user actions to functions through listeners. "
                "Handlers receive event objects and update document state."
            ),
            metadata={"page": 3},
        ),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Web Development",
        unit="Chapter_2_Web_Foundations",
    )

    assert job["chapters"], "Roadmap must expose nested chapter groups, not only a flat note list."
    assert all(chapter["atomic_notes"] for chapter in job["chapters"])
    assert all("Chapter" not in note["title"] for chapter in job["chapters"] for note in chapter["atomic_notes"])

    coverage_items = job["coverage"]["source_items"]
    assert coverage_items, "Every PDF should produce a source-item coverage ledger."
    assert all(item["status"] in {"covered", "merged", "ignored", "warning"} for item in coverage_items)
    assert all(item["status"] != "warning" for item in coverage_items if item["importance"] == "high")
    assert {item["page_number"] for item in coverage_items if item["status"] in {"covered", "merged"}} >= {1, 2, 3, 4}

    deployed = service.deploy_to_vault(job["job_id"], str(tmp_path))
    hub_content = (
        tmp_path
        / "database"
        / "study planner"
        / "Winter2026"
        / "Web_Development"
        / "Chapter_2_Web_Foundations"
        / "Web_Foundations_Hub.md"
    ).read_text(encoding="utf-8")

    assert "## Chapter Roadmap" in hub_content
    assert "### Chapter 1:" in hub_content
    assert "- [[" in hub_content
    assert any(path.endswith("_Hub.md") for path in deployed["written_files"])


def test_source_roadmap_finalizer_splits_large_notes_and_assigns_all_pages():
    from src.domains.ater.source_service import (
        build_nested_chapters,
        build_source_coverage_items,
        finalize_source_roadmap_nodes,
    )

    pages = [
        {"page_number": 1, "content": "CSS Basics: CSS controls presentation for HTML documents.", "text_length": 62},
        {"page_number": 2, "content": "Layer Page\nCSS belongs to the presentation layer of a web page.", "text_length": 64},
        {"page_number": 3, "content": "CSS Selectors\nSelectors target elements in a document.", "text_length": 55},
        {"page_number": 4, "content": "Element Selectors\nElement selectors match HTML tag names.", "text_length": 58},
        {"page_number": 5, "content": "Class Selectors\nClass selectors match reusable class attributes.", "text_length": 64},
        {"page_number": 6, "content": "ID Selectors\nID selectors match one unique id attribute.", "text_length": 56},
        {"page_number": 7, "content": "Attribute Selectors\nAttribute selectors match elements by attribute presence or value.", "text_length": 83},
        {"page_number": 8, "content": "Pseudo Class Selectors\nPseudo classes match element states such as hover.", "text_length": 77},
        {"page_number": 9, "content": "Pseudo Element Selectors\nPseudo elements style parts of elements.", "text_length": 68},
        {"page_number": 10, "content": "Combinator Selectors\nCombinators describe relationships between elements.", "text_length": 76},
        {"page_number": 11, "content": "Specificity\nSpecificity decides which declaration wins.", "text_length": 55},
        {"page_number": 12, "content": "Cascade Order\nSource order resolves otherwise equal CSS rules.", "text_length": 59},
    ]
    nodes = [
        {
            "id": "concept_1",
            "title": "CSS Basics",
            "domain": "CS-WEB-DEV",
            "modality": "Qualitative/Definitional",
            "source_pages": [1],
            "source_excerpts": [],
            "objective_ids": [],
            "teaching_order": 1,
            "warnings": [],
        },
        {
            "id": "concept_2",
            "title": "CSS Selectors",
            "domain": "CS-WEB-DEV",
            "modality": "Qualitative/Definitional",
            "source_pages": list(range(3, 13)),
            "source_excerpts": [],
            "objective_ids": ["obj_selectors"],
            "teaching_order": 2,
            "warnings": [],
        },
    ]

    finalized = finalize_source_roadmap_nodes(nodes, pages, "CSS", "CS-WEB-DEV")
    titles = [node["title"] for node in finalized]

    assert "CSS Selectors" in titles
    assert "Element Selectors" in titles
    assert "Class Selectors" in titles
    assert "Attribute Selectors" in titles
    assert "Pseudo Class Selectors" in titles
    assert {page for node in finalized for page in node["source_pages"]} >= set(range(1, 13))

    coverage_items = build_source_coverage_items(pages, [], finalized)
    assert all(item["status"] in {"covered", "merged"} for item in coverage_items)
    assert {item["page_number"] for item in coverage_items if item["status"] == "covered"} >= set(range(1, 13))

    chapters = build_nested_chapters({"file_name": "CSS.pdf", "topic": "CSS"}, finalized)
    chapter_titles = " ".join(chapter["title"] for chapter in chapters)
    assert "Clas Selector" not in chapter_titles
    assert "Sheet Sourc" not in chapter_titles


def test_source_roadmap_finalizer_does_not_overload_broad_css_parent_notes():
    from src.domains.ater.source_service import finalize_source_roadmap_nodes

    page_text = {
        1: "CHAPTER 3 CSS(CASCADING STYLE SHEETS)",
        2: "Quiz one ..Create the ff page. Boxes represent a div element.",
        3: "What is CSS? Every web page is composed of HTML code that describes content.",
        4: "What is CSS? Layers of a web page: Content, Presentation, Behavior.",
        5: "Style Sheet Languages are used to describe the presentation of structured documents.",
        6: "What is CSS? Cascading Style Sheets contains rules for presentation of HTML.",
        7: "What are Cascading Style Sheets? Cascading style sheets define presentation rules.",
        8: "Why CSS? Flexible, easy to maintain, and improves accessibility.",
        9: "Why use Style Sheets? Separate structure from appearance and create consistency.",
        10: "What is CSS? Before CSS designers used presentation tags like FONT and BR.",
        11: "Brief history 1997-2001 Content: HTML 4.01 Presentation: CSS1",
        12: "Brief history 2001-2006 Content: XHTML 1 Presentation: CSS2",
        13: "Brief history 2007-present Content: HTML5 Presentation: CSS3",
        14: "Pros and Cons of Using CSS Pros include designer control and maintainability.",
        15: "General Syntax Style Definition: Selector { property: value; }",
        16: "CSS Syntax Case insensitive and whitespace rules.",
        17: "Source of Styles Author Developer Style Sheets Inline Embedded External.",
        18: "Source of Styles > Author Developer Style Sheets Inline Styles.",
        19: "Source of Styles > Author Developer Style Sheets Embedded Styles.",
        20: "Source of Styles > Author Developer Style Sheets External Styles.",
        21: "Source of Styles > Author Developer Style Sheets External Styles import.",
        22: "Source of Styles > User Style Sheets User-created style sheet.",
        23: "Source of Styles > Browser Default Style Sheets user agent style sheets.",
        24: "Structuring HTML Correctly Without logical consistent HTML, writing CSS is harder.",
        25: "Use tools for website designing, planning and prototyping such as mockups.",
        26: "Planning and prototyping using mindmeister and mockups.",
        27: "CSS SELECTORS",
        28: "CSS Selectors selectors are patterns used to select elements.",
        29: "CSS Selectors > Element Selector Also known as type selector.",
        30: "Quiz Use Element Selector",
        31: "CSS Selectors > Class Selector Class selectors target class attributes.",
        32: "CSS Selectors > Id Selector Identifier Selector ID selectors target id attributes.",
        33: "CSS Selectors > Considerations Id and Class attributes extend meaning.",
        34: "CSS Selectors > Considerations Id and Class",
        35: "CSS Selectors > Class and Id Selectors with the Element example.",
        36: "Quiz use class and id selectors",
        37: "CSS Selectors > Universal Selectors Universal selectors select any element.",
        38: "CSS Selectors > Grouping Selectors Often several elements use same style.",
        39: "Quiz Group selectors",
        40: "CSS Selectors > Descendant Selector The most powerful targeting ability.",
        41: "CSS Selectors > Descendant Selector space",
        42: "Quiz use a descendant selector to change font size.",
        43: "CSS Selectors > Child Selectors A child selector selects direct children.",
        44: "CSS Selectors > Child Selectors",
        45: "Quiz Use Child Selectors to change paragraph colors.",
        46: "CSS Selectors > Adjacent Selectors Also called adjacent sibling selectors.",
        47: "CSS Selectors > Adjacent Selectors",
        48: "Quiz Use Adjacent Selectors to change the last paragraph color.",
        49: "CSS Selectors > General Sibling Selectors Sibling has the same parent.",
        50: "Quiz Use General Sibling Selectors",
        51: "CSS Selectors > Attribute Selectors select elements based on attributes.",
        52: "CSS Selectors > Attribute Selectors",
        53: "CSS Selectors > Attribute Selectors",
        54: "CSS Selectors > Attribute Selectors",
        55: "Quiz Use Attribute selectors to change the color of the second link.",
        56: "CSS Selectors > Attribute Selectors Tilde pattern matching.",
        57: "CSS Selectors > Attribute Selectors Caret pattern matching.",
        58: "CSS Selectors > Attribute Selectors Dollar sign pattern matching.",
        59: "CSS Selectors > Attribute Selectors Asterisk sign pattern matching.",
        60: "Quiz Use attribute selector and Asterisk Sign.",
    }
    pages = [
        {"page_number": page_no, "content": content, "text_length": len(content)}
        for page_no, content in page_text.items()
    ]
    nodes = [
        {"id": "concept_1", "title": "Css Basics", "domain": "CS-WEB-DEV", "modality": "Qualitative/Definitional", "source_pages": [1, 3, 6], "source_excerpts": [], "objective_ids": [], "teaching_order": 1, "warnings": []},
        {"id": "concept_2", "title": "Style Sheet Languages", "domain": "CS-WEB-DEV", "modality": "Qualitative/Definitional", "source_pages": [1, 5, 6], "source_excerpts": [], "objective_ids": [], "teaching_order": 2, "warnings": []},
        {"id": "concept_3", "title": "Web Page Layers", "domain": "CS-WEB-DEV", "modality": "Qualitative/Definitional", "source_pages": [4], "source_excerpts": [], "objective_ids": [], "teaching_order": 3, "warnings": []},
        {"id": "concept_4", "title": "Css Syntax", "domain": "CS-WEB-DEV", "modality": "Qualitative/Definitional", "source_pages": [15, 16], "source_excerpts": [], "objective_ids": [], "teaching_order": 4, "warnings": []},
        {"id": "concept_5", "title": "Style Sheet Sources", "domain": "CS-WEB-DEV", "modality": "Qualitative/Definitional", "source_pages": [17, 18, 19, 20, 21, 22, 23], "source_excerpts": [], "objective_ids": [], "teaching_order": 5, "warnings": []},
        {"id": "concept_6", "title": "Css Selectors", "domain": "CS-WEB-DEV", "modality": "Qualitative/Definitional", "source_pages": list(range(27, 61)), "source_excerpts": [], "objective_ids": ["obj_selectors"], "teaching_order": 6, "warnings": []},
    ]

    finalized = finalize_source_roadmap_nodes(nodes, pages, "CSS", "CS-WEB-DEV")
    by_title = {node["title"]: node for node in finalized}

    assert any("Evolution" in title for title in by_title)
    assert any("Prototyping" in title for title in by_title)
    assert "General Sibling Selectors" in by_title
    assert "Attribute Selectors" in by_title
    assert "Essentially General" not in by_title
    assert "Essentially Adjacent" not in by_title
    if "Css Selectors" in by_title:
        assert len(by_title["Css Selectors"]["source_pages"]) <= 3
    assert len(by_title["Css Basics"]["source_pages"]) <= 4
    assert {page for node in finalized for page in node["source_pages"]} >= set(range(1, 61))


def test_source_job_deploy_uses_ai_generator_when_available(tmp_path, monkeypatch):
    from types import SimpleNamespace
    import frontmatter
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Chapter_3_Consumer_Behavior.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic source")
    docs = [
        SimpleNamespace(
            page_content=(
                "Chapter 3 Consumer Preferences And Utility\n"
                "Objectives\n"
                "Define consumer preferences"
            ),
            metadata={"page": 0},
        ),
        SimpleNamespace(
            page_content="Consumer preferences rank bundles by the satisfaction a consumer expects from each bundle.",
            metadata={"page": 1},
        ),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    prompts = []

    def ai_generator(prompt):
        prompts.append(prompt)
        h = prompt["user"]["teaching_headings"]
        return inspect.cleandoc(f"""## Mental Model

Consumer preferences are the ranking rule that lets a consumer compare bundles before choosing. The source anchors the idea in expected satisfaction from each bundle [PAGE 1].

## {h[0]}

The learner should connect preferences to ranking, not to prices first: preferences order bundles by expected satisfaction, then later constraints decide what can be bought [PAGE 1].

## {h[1]}

Secondary concept explanation placeholder.

## {h[2]}

Tertiary concept explanation placeholder.

## The Proving Grounds

```interactive-quiz
[
  {{
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "family": "recognize",
    "format": "choice",
    "variant": "conceptual",
    "skill_target": "Consumer Preferences",
    "question": "What do consumer preferences do in the source?",
    "options": {{"A": "Rank bundles by expected satisfaction", "B": "Set the market price"}},
    "answer": "A",
    "explanation": "The cited page says preferences rank bundles by satisfaction.",
    "rubric": {{"grading_mode": "objective"}},
    "remediation": {{"misconception_codes": ["missing_definition"]}}
  }}
]
```""")

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Economics",
        unit="Chapter_3",
    )
    deployed = service.deploy_to_vault(job["job_id"], str(tmp_path), ai_generator=ai_generator)

    note_path = tmp_path / deployed["written_files"][0]
    post = frontmatter.loads(note_path.read_text(encoding="utf-8"))
    assert prompts
    assert post.metadata["fallback_generation"] is False
    assert "ranking rule" in post.content
    assert "[PAGE 1]" not in post.content


def test_source_job_roadmap_can_be_ai_refined_before_persisting(tmp_path, monkeypatch):
    from types import SimpleNamespace
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Chapter_3_Consumer_Behavior.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic source")
    docs = [
        SimpleNamespace(
            page_content=(
                "Chapter 3 Consumer Preferences And Utility\n"
                "Objectives\n"
                "Define consumer preferences\n"
                "Explain budget line\n"
                "Discuss consumer equilibrium"
            ),
            metadata={"page": 0},
        ),
        SimpleNamespace(
            page_content="Consumer preferences rank bundles. A budget line separates affordable and unaffordable bundles.",
            metadata={"page": 1},
        ),
        SimpleNamespace(
            page_content="Consumer equilibrium is the optimal affordable choice under preferences and the budget constraint.",
            metadata={"page": 2},
        ),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    def roadmap_refiner(payload):
        assert payload["topic"] == "Consumer Preferences And Utility"
        assert payload["nodes"]
        return [
            {"title": "Consumer Preferences Rank Bundles", "source_pages": [1]},
            {"title": "Budget Line", "source_pages": [1]},
            {"title": "Consumer Equilibrium", "source_pages": [2]},
        ]

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Economics",
        unit="Chapter_3",
        roadmap_refiner=roadmap_refiner,
    )

    assert [item["title"] for item in job["roadmap"]] == [
        "Budget Line",
        "Consumer Equilibrium",
        "Consumer Preferences Rank Bundles",
    ]


def test_source_job_roadmap_timeout_uses_compacted_deterministic_fallback(tmp_path, monkeypatch):
    from src.domains.ater.source_service import _refine_concept_graph

    def roadmap_refiner(_payload):
        raise TimeoutError("simulated timeout")

    raw_titles = [
        "Consumer Preferences And Utility",
        "Ordinal Utility",
        "Cardinal Versus Ordinal Utility",
        "Indifference Curve",
        "Budget Line",
        "Equilibrium Condition Of A Consumer",
        "Theory Of Consumer Behavior",
        "Consumer Preferences",
        "Assumptions (Axioms) Of Consumer Preference",
        "Complete",
        "Reflexive",
        "Transitivity",
        "Concept Of Utility",
        "Budget Set",
        "Budget Equation",
        "Determinants Of The Budget Line",
        "Consumers Income",
        "Prices Of Goods",
        "Taxes, Subsides And Rationing",
        "Equilibrium Of The Consumer",
        "Optimal Choice",
    ] + [f"Minor Slide Heading {idx}" for idx in range(30)]
    nodes = [
        {
            "id": f"concept_{idx}",
            "title": title,
            "domain": "ECON-MICRO",
            "modality": "Quantitative",
            "source_pages": [max(1, idx)],
            "source_excerpts": [{"page": max(1, idx), "text": f"{title} source context."}],
            "objective_ids": ["obj_1"] if idx <= 8 else [],
            "teaching_order": idx,
            "warnings": [],
        }
        for idx, title in enumerate(raw_titles, start=1)
    ]
    pages = [{"page_number": idx, "content": f"Page {idx} content"} for idx in range(1, 60)]

    refined, _edges, warnings = _refine_concept_graph(
        "Theory of Consumer Behavior",
        [],
        pages,
        "ECON-MICRO",
        nodes,
        roadmap_refiner=roadmap_refiner,
    )
    titles = [item["title"] for item in refined]

    assert "Complete" not in titles
    assert "Reflexive" not in titles
    assert "Transitivity" not in titles
    assert not any(title.startswith("Minor Slide Heading") for title in titles)
    assert any("Consumer Preferences" in title for title in titles)
    assert any("Budget" in title for title in titles)
    assert any("Equilibrium" in title for title in titles)
    assert warnings


def test_source_roadmap_refinement_restores_all_weighted_source_concepts_without_caps():
    from src.domains.ater.source_service import _refine_concept_graph

    concept_names = [
        "Alpha Mechanism",
        "Beta Transfer",
        "Gamma Constraint",
        "Delta Feedback",
        "Epsilon Model",
        "Zeta Calibration",
        "Eta Sampling",
        "Theta Objective",
        "Iota Pipeline",
        "Kappa Boundary",
        "Lambda Signal",
        "Mu Estimator",
        "Nu Regularizer",
        "Xi Optimizer",
        "Omicron Metric",
        "Pi Classifier",
        "Rho Encoder",
        "Sigma Decoder",
        "Tau Scheduler",
        "Upsilon Buffer",
        "Phi Transformer",
        "Chi Validator",
        "Psi Aggregator",
        "Omega Policy",
        "Vector Index",
        "Matrix Factor",
        "Tensor Shape",
        "Gradient Flow",
        "Loss Surface",
        "Feature Store",
        "Batch Window",
        "Query Planner",
        "State Machine",
        "Error Budget",
        "Control Plane",
        "Data Contract",
    ]
    pages = [
        {
            "page_number": idx,
            "content": (
                f"{name} is a substantive source-backed idea. "
                f"{name} shows the definition, process, and example for page {idx}."
            ),
        }
        for idx, name in enumerate(concept_names, start=1)
    ]
    nodes = [
        {
            "id": f"concept_{idx}",
            "title": name,
            "domain": "GENERIC",
            "modality": "Qualitative/Definitional",
            "source_pages": [idx],
            "source_excerpts": [{"page": idx, "text": pages[idx - 1]["content"]}],
            "objective_ids": [f"obj_{idx}"] if idx % 4 == 0 else [],
            "teaching_order": idx,
            "warnings": [],
        }
        for idx, name in enumerate(concept_names, start=1)
    ]

    def roadmap_refiner(_payload):
        return [
            {"title": "Alpha Mechanism", "source_pages": [1]},
            {"title": "Beta Transfer", "source_pages": [2]},
        ]

    refined, edges, warnings = _refine_concept_graph(
        "Any PDF Source",
        [],
        pages,
        "GENERIC",
        nodes,
        roadmap_refiner=roadmap_refiner,
    )

    titles = [node["title"] for node in refined]
    assert len(titles) == 36
    assert titles[0] == "Alpha Mechanism"
    assert titles[-1] == "Data Contract"
    assert len(edges) == 35
    assert warnings


def test_source_roadmap_rejects_junk_fragments_and_splits_atomic_selector_family():
    from src.domains.ater.source_service import finalize_source_roadmap_nodes

    pages = [
        {"page_number": 1, "content": "CSS Selectors\nSelectors target document elements.", "text_length": 52},
        {"page_number": 2, "content": "Element Selectors\nElement selectors match HTML tag names.", "text_length": 58},
        {"page_number": 3, "content": "Class Selectors\nClass selectors match reusable class attributes.", "text_length": 64},
        {"page_number": 4, "content": "ID Selectors\nID selectors match one unique id attribute.", "text_length": 56},
        {"page_number": 5, "content": "General Sibling Selectors\nSibling elements share the same parent.", "text_length": 70},
        {"page_number": 6, "content": "Attribute Selectors\nAttribute selectors match elements by attributes.", "text_length": 72},
    ]
    nodes = [
        {
            "id": "concept_1",
            "title": "Css Selectors",
            "domain": "CS-WEB-DEV",
            "modality": "Qualitative/Definitional",
            "source_pages": [1, 2, 3, 4, 5, 6],
            "source_excerpts": [],
            "objective_ids": ["obj_selectors"],
            "teaching_order": 1,
            "warnings": [],
        },
        {
            "id": "concept_2",
            "title": "Contents",
            "domain": "CS-WEB-DEV",
            "modality": "Qualitative/Definitional",
            "source_pages": [1],
            "source_excerpts": [{"page": 1, "text": "Contents"}],
            "objective_ids": [],
            "teaching_order": 2,
            "warnings": [],
        },
        {
            "id": "concept_3",
            "title": "Original",
            "domain": "CS-WEB-DEV",
            "modality": "Qualitative/Definitional",
            "source_pages": [2],
            "source_excerpts": [{"page": 2, "text": "Original"}],
            "objective_ids": [],
            "teaching_order": 3,
            "warnings": [],
        },
        {
            "id": "concept_4",
            "title": "Essentially General",
            "domain": "CS-WEB-DEV",
            "modality": "Qualitative/Definitional",
            "source_pages": [5],
            "source_excerpts": [{"page": 5, "text": "Essentially General"}],
            "objective_ids": [],
            "teaching_order": 4,
            "warnings": [],
        },
        {
            "id": "concept_5",
            "title": "If You Wish To Access The Superclass Version Of",
            "domain": "CS-WEB-DEV",
            "modality": "Qualitative/Definitional",
            "source_pages": [6],
            "source_excerpts": [{"page": 6, "text": "If you wish to access the superclass version of a method, use super."}],
            "objective_ids": [],
            "teaching_order": 5,
            "warnings": [],
        },
    ]

    finalized = finalize_source_roadmap_nodes(nodes, pages, "CSS", "CS-WEB-DEV")
    titles = [node["title"] for node in finalized]

    assert "Contents" not in titles
    assert "Original" not in titles
    assert "Essentially General" not in titles
    assert not any(title.startswith("If You Wish") for title in titles)
    assert "Element Selectors" in titles
    assert "Class Selectors" in titles
    assert "ID Selectors" in titles
    assert "General Sibling Selectors" in titles
    assert "Attribute Selectors" in titles
    assert all(len(node["source_pages"]) <= 2 for node in finalized if "Selector" in node["title"])


def test_source_roadmap_does_not_restore_selector_family_pages_to_broad_parent():
    from src.domains.ater.source_service import finalize_source_roadmap_nodes

    page_titles = {
        27: "CSS Selectors\nSelectors are patterns used to select elements.",
        28: "CSS Selectors\nSelectors are patterns used to select elements.",
        29: "Element Selectors\nElement selectors match tag names.",
        31: "Class Selectors\nClass selectors target class attributes.",
        32: "ID Selectors\nID selectors target id attributes.",
        38: "Grouping Selectors\nGrouping selectors share declarations.",
        40: "Descendant Selector\nDescendant selectors target nested elements.",
        43: "Child Selector\nChild selectors target direct children.",
        46: "Adjacent Selector\nAdjacent selectors target the next sibling.",
        49: "General Sibling Selector\nGeneral sibling selectors target later siblings.",
        51: "Attribute Selector\nAttribute selectors target attributes.",
        52: "Attribute Selector\nTilde pattern matching.",
        53: "Attribute Selector\nCaret pattern matching.",
        54: "Attribute Selector\nDollar pattern matching.",
        55: "Attribute Selector\nAsterisk pattern matching.",
    }
    pages = [
        {
            "page_number": page_no,
            "content": page_titles.get(page_no, f"Quiz Use Selector Page {page_no}"),
            "text_length": len(page_titles.get(page_no, "Quiz")),
        }
        for page_no in range(27, 61)
    ]
    nodes = [
        {
            "id": "concept_1",
            "title": "CSS Selectors",
            "domain": "CS-WEB-DEV",
            "modality": "Qualitative/Definitional",
            "source_pages": list(range(27, 61)),
            "source_excerpts": [],
            "objective_ids": ["obj_selectors"],
            "teaching_order": 1,
            "warnings": [],
        }
    ]

    finalized = finalize_source_roadmap_nodes(nodes, pages, "CSS", "CS-WEB-DEV")
    by_title = {node["title"]: node for node in finalized}

    assert set(by_title["CSS Selectors"]["source_pages"]) <= {27, 28}
    assert 29 in by_title["Element Selectors"]["source_pages"]
    assert 31 in by_title["Class Selectors"]["source_pages"]
    assert 32 in by_title["ID Selectors"]["source_pages"]
    assert 49 in by_title["General Sibling Selector"]["source_pages"]
    assert {51, 52, 53, 54, 55}.issubset(set(by_title["Attribute Selector"]["source_pages"]))


def test_source_job_rebuilds_cached_roadmap_when_pipeline_version_changes(tmp_path, monkeypatch):
    from types import SimpleNamespace
    import json
    from src.domains.ater.source_service import SOURCE_LEARNING_PIPELINE_VERSION, SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "css.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF css source")

    docs = [
        SimpleNamespace(page_content="CSS\nOriginal\nCSS Selectors", metadata={"page": 0}),
        SimpleNamespace(page_content="Element Selectors\nElement selectors match tags.", metadata={"page": 1}),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    first = service.create_or_resume_from_path(str(pdf_path))
    first_job_id = first["job_id"]

    conn = service._connect()
    try:
        with conn:
            conn.execute(
                "UPDATE source_learning_jobs SET metadata = ? WHERE job_id = ?",
                (json.dumps({"pipeline_version": "source-roadmap-v9"}), first_job_id),
            )
    finally:
        conn.close()

    rebuilt = service.create_or_resume_from_path(str(pdf_path))

    assert rebuilt["job_id"] != first_job_id
    conn = service._connect()
    try:
        row = conn.execute("SELECT metadata FROM source_learning_jobs WHERE job_id = ?", (rebuilt["job_id"],)).fetchone()
        metadata = json.loads(row["metadata"])
    finally:
        conn.close()
    assert metadata["pipeline_version"] == SOURCE_LEARNING_PIPELINE_VERSION


def test_source_job_roadmap_strict_ai_refinement_raises_on_failure():
    from src.domains.ater.source_service import SourceAIGenerationError, _refine_concept_graph

    nodes = [
        {
            "id": "concept_1",
            "title": "Consumer Preferences",
            "domain": "ECON-MICRO",
            "modality": "Qualitative/Definitional",
            "source_pages": [1],
            "source_excerpts": [{"page": 1, "text": "Consumer preferences rank bundles."}],
            "objective_ids": ["obj_1"],
            "teaching_order": 1,
            "warnings": [],
        }
    ]

    def roadmap_refiner(_payload):
        raise RuntimeError("provider 500")

    try:
        _refine_concept_graph(
            "Theory of Consumer Behavior",
            [],
            [{"page_number": 1, "content": "Consumer preferences rank bundles."}],
            "ECON-MICRO",
            nodes,
            roadmap_refiner=roadmap_refiner,
            strict_ai=True,
        )
    except SourceAIGenerationError as exc:
        assert "AI roadmap refinement failed" in str(exc)
        assert "provider 500" in str(exc)
    else:
        raise AssertionError("strict roadmap refinement should raise on AI failure")


def test_start_source_learning_uses_ai_note_for_first_lesson(tmp_path, monkeypatch):
    from types import SimpleNamespace
    import frontmatter
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Chapter_3_Consumer_Behavior.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic source")
    docs = [
        SimpleNamespace(
            page_content="Chapter 3 Consumer Preferences And Utility\nObjectives\nDefine consumer preferences",
            metadata={"page": 0},
        ),
        SimpleNamespace(
            page_content="Consumer preferences rank bundles by expected satisfaction.",
            metadata={"page": 1},
        ),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    def ai_generator(prompt):
        h = prompt["user"]["teaching_headings"]
        return inspect.cleandoc(f"""## Mental Model

Consumer preferences are the learner's first source-grounded ranking rule [PAGE 1].

## {h[0]}

Prose explanation 1 [PAGE 1].

## {h[1]}

Prose explanation 2.

## {h[2]}

Prose explanation 3.

## The Proving Grounds

```interactive-quiz
[
  {{
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "family": "recognize",
    "format": "choice",
    "variant": "conceptual",
    "skill_target": "Consumer Preferences",
    "question": "What does the source use preferences for?",
    "options": {{"A": "Ranking bundles", "B": "Changing taxes"}},
    "answer": "A",
    "explanation": "The cited page ties preferences to ranking bundles.",
    "rubric": {{"grading_mode": "objective"}},
    "remediation": {{"misconception_codes": ["missing_definition"]}}
  }}
]
```""")

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Economics",
        unit="Chapter_3",
    )

    started = service.start_learning(job["job_id"], ai_generator=ai_generator, ai_metadata={"ai_model": "Gemma-4-31b-it"})
    note = started["tutor_session"]["current_note"]
    note_path = tmp_path / started["tutor_session"]["current_note_path"]
    post = frontmatter.loads(note_path.read_text(encoding="utf-8"))

    assert note["frontmatter"]["fallback_generation"] is False
    assert note["frontmatter"]["ai_model"] == "Gemma-4-31b-it"
    assert post.metadata["fallback_generation"] is False


def test_start_source_learning_strict_ai_failure_does_not_write_fallback_note(tmp_path, monkeypatch):
    from types import SimpleNamespace
    from src.domains.ater.source_service import SourceAIGenerationError, SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Chapter_3_Consumer_Behavior.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic source")
    docs = [
        SimpleNamespace(
            page_content="Chapter 3 Consumer Preferences And Utility\nObjectives\nDefine consumer preferences",
            metadata={"page": 0},
        ),
        SimpleNamespace(
            page_content="Consumer preferences rank bundles by expected satisfaction.",
            metadata={"page": 1},
        ),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Economics",
        unit="Chapter_3",
    )

    def failing_ai(_prompt):
        raise RuntimeError("provider 500")

    try:
        service.start_learning(job["job_id"], ai_generator=failing_ai, strict_ai=True)
    except SourceAIGenerationError as exc:
        assert "AI note generation failed" in str(exc)
    else:
        raise AssertionError("strict note generation should raise on AI failure")

    assert not list((tmp_path / "Notes" / "academic" / "Winter2026" / "Economics" / "Chapter_3").glob("**/*.md"))


def test_source_note_generation_repairs_malformed_ai_output_in_strict_mode():
    from src.domains.ater.source_service import SourceAtomicNoteCompiler

    compiler = SourceAtomicNoteCompiler()
    job = {"file_name": "Chapter_3.pdf", "learning_scope": "academic"}
    node = {
        "title": "Consumer Preferences",
        "domain": "ECON-MICRO",
        "modality": "Qualitative/Definitional",
        "source_pages": [2],
        "source_excerpts": [{"page": 2, "text": "Consumer preferences rank bundles by expected satisfaction."}],
    }
    profile = {"artifact_constraints": {}, "question_modes": ["mcq"]}
    calls = []

    def ai_generator(prompt):
        calls.append(prompt)
        if len(calls) == 1:
            return "Consumer preferences rank bundles by expected satisfaction [PAGE 2]."
        h = prompt["user"]["teaching_headings"]
        return inspect.cleandoc(f"""## Mental Model

Consumer preferences are the ranking rule that lets a consumer compare bundles by expected satisfaction [PAGE 2].

## {h[0]}

The note should keep the idea separate from budget constraints: preferences rank bundles before affordability is checked [PAGE 2].

## {h[1]}

Secondary details.

## {h[2]}

Tertiary details.

## The Proving Grounds

```interactive-quiz
[
  {{
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "family": "recognize",
    "format": "choice",
    "variant": "conceptual",
    "skill_target": "Consumer Preferences",
    "question": "What do consumer preferences do?",
    "options": {{"A": "Rank bundles by expected satisfaction", "B": "Set the tax rate"}},
    "answer": "A",
    "explanation": "The source says preferences rank bundles by expected satisfaction.",
    "rubric": {{"grading_mode": "objective"}},
    "remediation": {{"misconception_codes": ["missing_definition"]}}
  }}
]
```""")

    note = compiler.compile_note(job, node, profile, ai_generator=ai_generator, strict_ai=True)

    assert len(calls) == 2
    assert calls[1]["user"]["validation_errors_to_fix"]
    assert note["fallback"] is False
    assert "## Mental Model" in note["content"]
    assert "```interactive-quiz" in note["content"]


def test_source_note_validation_rejects_mcq_without_options():
    from src.domains.ater.source_service import SourceAtomicNoteCompiler

    compiler = SourceAtomicNoteCompiler()
    node = {"title": "Consumer Preferences", "source_pages": [2], "domain": "ECON-MICRO"}
    content = """## Mental Model

Consumer preferences rank bundles [PAGE 2].

## The Proving Grounds

```interactive-quiz
[{"id":"q1","type":"mcq","question":"What is ranked?","answer":"Bundles","explanation":"The source says bundles are ranked."}]
```"""

    valid, errors = compiler.validate_content(content, node, {"artifact_constraints": {"forbidden": []}})

    assert valid is False
    assert "missing_mcq_options:1" in errors


def test_source_note_compiler_trims_ai_prompt_echo_before_first_heading():
    from src.domains.ater.source_service import SourceAtomicNoteCompiler

    compiler = SourceAtomicNoteCompiler()
    content = """* Concept: Consumer Preferences.
* Source: Page 3.
* Required Sections: Mental Model, Proving Grounds.

## Mental Model

Consumer preferences rank consumption bundles by expected satisfaction [PAGE 3].

## The Proving Grounds

```interactive-quiz
[{"id":"q1","type":"mcq","question":"What do consumer preferences rank?","options":{"A":"Consumption bundles","B":"Weather patterns"},"answer":"A","explanation":"The source says preferences rank consumption bundles."}]
```"""

    trimmed = compiler._trim_ai_preamble(content)

    assert trimmed.startswith("## Mental Model")
    assert "Concept: Consumer Preferences" not in trimmed


def test_source_note_compiler_renders_structured_ai_payload():
    from src.domains.ater.source_service import SourceAtomicNoteCompiler

    compiler = SourceAtomicNoteCompiler()
    payload = {
        "mental_model": "Consumer preferences rank consumption bundles by expected satisfaction [PAGE 3].",
        "how_it_works": "The ranking comes before the budget constraint filters what can be bought [PAGE 3].",
        "quiz": [
            {
                "id": "q1",
                "type": "mcq",
                "question": "What do consumer preferences rank?",
                "options": {"A": "Consumption bundles", "B": "Weather patterns"},
                "answer": "A",
                "explanation": "The cited page says preferences rank consumption bundles.",
            }
        ],
    }

    content = compiler._coerce_structured_ai_note(json.dumps(payload), {"title": "Consumer Preferences"})

    assert content.startswith("## Mental Model")
    assert "## How the Economics Actually Work" in content
    assert "```interactive-quiz" in content
    valid, errors = compiler.validate_content(
        content,
        {"title": "Consumer Preferences", "source_pages": [3], "domain": "ECON-MICRO"},
        {"artifact_constraints": {"forbidden": []}},
    )
    print("COERCED NOTE ERRORS ARE:", errors)
    print("MATCHED HEADINGS ARE:", re.findall(r"^##\s+(.+?)\s*$", content, flags=re.MULTILINE))
    assert valid is True
    assert errors == []


def test_source_note_forbidden_artifact_does_not_match_single_letter_substrings():
    from src.domains.ater.source_service import SourceAtomicNoteCompiler

    compiler = SourceAtomicNoteCompiler()
    content = """## Mental Model

Cardinal utility measures satisfaction and represents preferences [PAGE 8].

## The Economic Intuition

Some economic intuition here [PAGE 8].

## The Choice Mechanism

Some choice mechanism here.

## The Formal Math & Models

Some formal math here.

## The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "family": "recognize",
    "format": "choice",
    "variant": "conceptual",
    "skill_target": "Cardinal Utility",
    "question": "What does cardinal utility measure?",
    "options": {"A": "Satisfaction", "B": "Nothing"},
    "answer": "A",
    "explanation": "This follows from the source.",
    "rubric": {"grading_mode": "objective"},
    "remediation": {"misconception_codes": ["missing_definition"]}
  }
]
```"""

    valid, errors = compiler.validate_content(
        content,
        {"title": "Cardinal Utility", "source_pages": [8], "domain": "ECON-MICRO"},
        {"artifact_constraints": {"forbidden": ["R", "Java"]}},
    )

    assert valid is True
    assert "forbidden_artifact" not in errors


def test_source_job_deploy_limits_ai_generation_to_selected_nodes(tmp_path, monkeypatch):
    from types import SimpleNamespace
    import frontmatter
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Chapter_3_Consumer_Behavior.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic source")
    docs = [
        SimpleNamespace(
            page_content=(
                "Chapter 3 Consumer Preferences And Utility\n"
                "Objectives\n"
                "Define consumer preferences\n"
                "Explain budget line"
            ),
            metadata={"page": 0},
        ),
        SimpleNamespace(
            page_content="Consumer preferences rank bundles by expected satisfaction.",
            metadata={"page": 1},
        ),
        SimpleNamespace(
            page_content="A budget line separates affordable bundles from unaffordable bundles.",
            metadata={"page": 2},
        ),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    calls = []

    def ai_generator(prompt):
        calls.append(prompt["user"]["concept"])
        h = prompt["user"]["teaching_headings"]
        return inspect.cleandoc(f"""## Mental Model

Consumer preferences are generated with AI for the selected current lesson only [PAGE 1].

## {h[0]}

Explanation 1.

## {h[1]}

Explanation 2.

## {h[2]}

Explanation 3.

## The Proving Grounds

```interactive-quiz
[
  {{
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "family": "recognize",
    "format": "choice",
    "variant": "conceptual",
    "skill_target": "Consumer Preferences",
    "question": "Which lesson used AI?",
    "options": {{"A": "The selected current lesson", "B": "Every roadmap node"}},
    "answer": "A",
    "explanation": "Only the selected node should call AI.",
    "rubric": {{"grading_mode": "objective"}},
    "remediation": {{"misconception_codes": ["missing_definition"]}}
  }}
]
```""")

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Economics",
        unit="Chapter_3",
    )
    first_node_id = job["concept_graph"]["nodes"][0]["id"]
    deployed = service.deploy_to_vault(
        job["job_id"],
        str(tmp_path),
        ai_generator=ai_generator,
        ai_node_ids={first_node_id},
    )

    first_note = frontmatter.loads((tmp_path / deployed["written_files"][0]).read_text(encoding="utf-8"))
    fallback_notes = [
        frontmatter.loads((tmp_path / rel_path).read_text(encoding="utf-8"))
        for rel_path in deployed["written_files"]
        if rel_path.endswith(".md") and rel_path.startswith("Notes/") and "01_Source_Roadmap" in rel_path
    ][1:]

    assert calls == [job["concept_graph"]["nodes"][0]["title"]]
    assert first_note.metadata["fallback_generation"] is False
    assert fallback_notes
    assert all(note.metadata["fallback_generation"] is True for note in fallback_notes)


def test_source_job_deploy_can_write_only_selected_ai_nodes_without_fallbacks(tmp_path, monkeypatch):
    from types import SimpleNamespace
    import frontmatter
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Chapter_3_Consumer_Behavior.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic source")
    docs = [
        SimpleNamespace(
            page_content="Chapter 3 Consumer Preferences And Utility\nObjectives\nDefine consumer preferences\nExplain budget line",
            metadata={"page": 0},
        ),
        SimpleNamespace(page_content="Consumer preferences rank bundles by expected satisfaction.", metadata={"page": 1}),
        SimpleNamespace(page_content="A budget line separates affordable bundles from unaffordable bundles.", metadata={"page": 2}),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    def ai_generator(prompt):
        page = (prompt["user"].get("valid_source_pages") or [1])[0]
        concept = prompt["user"]["concept"]
        h = prompt["user"]["teaching_headings"]
        return inspect.cleandoc(f"""## Mental Model

{concept} was generated by AI from the selected source page [PAGE {page}].

## {h[0]}

Explanation 1 [PAGE {page}].

## {h[1]}

Explanation 2.

## {h[2]}

Explanation 3.

## The Proving Grounds

```interactive-quiz
[
  {{
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "family": "recognize",
    "format": "choice",
    "variant": "conceptual",
    "skill_target": "{concept}",
    "question": "Was this note generated by AI?",
    "options": {{"A": "Yes", "B": "No"}},
    "answer": "A",
    "explanation": "The selected background node used AI.",
    "rubric": {{"grading_mode": "objective"}},
    "remediation": {{"misconception_codes": ["missing_definition"]}}
  }}
]
```""")

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Economics",
        unit="Chapter_3",
    )
    selected_id = job["concept_graph"]["nodes"][1]["id"]
    deployed = service.deploy_to_vault(
        job["job_id"],
        str(tmp_path),
        ai_generator=ai_generator,
        ai_node_ids={selected_id},
        write_node_ids={selected_id},
        strict_ai=True,
        write_hub_files=False,
    )

    note_files = [path for path in deployed["written_files"] if path.startswith("Notes/")]
    assert len(note_files) == 1
    post = frontmatter.loads((tmp_path / note_files[0]).read_text(encoding="utf-8"))
    assert post.metadata["fallback_generation"] is False
    assert not (tmp_path / "database" / "study planner" / "Winter2026" / "Economics" / "Chapter_3" / "Chapter_01_Source_Roadmap.md").exists()


def test_source_job_attaches_to_existing_academic_chapter_hub(tmp_path, monkeypatch):
    from types import SimpleNamespace
    import frontmatter
    from src.domains.ater.source_service import SourceLearningJobService

    parent_hub = "database/study planner/Winter2026/Microeconomics/Elasticity/Elasticity_Hub.md"
    hub_path = tmp_path / parent_hub
    hub_path.parent.mkdir(parents=True)
    hub_path.write_text("---\ntype: \"Hub\"\nstatus: \"Not Started\"\n---\n\n# Elasticity\n", encoding="utf-8")
    pdf_path = tmp_path / "Inbox" / "academic" / "Elasticity.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic chapter")

    docs = [
        SimpleNamespace(
            page_content="Elasticity\nObjectives\nDefine price elasticity\nDescribe income elasticity",
            metadata={"page": 0},
        )
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Microeconomics",
        unit="Elasticity",
        chapter_title="Elasticity",
        parent_hub_path=parent_hub,
    )
    deployed = service.deploy_to_vault(job["job_id"], str(tmp_path))

    note_path = tmp_path / "Notes" / "academic" / "Winter2026" / "Microeconomics" / "Elasticity" / "01_Source_Roadmap" / "Price_Elasticity.md"
    assert hub_path.exists()
    assert note_path.exists()
    assert parent_hub in deployed["written_files"]
    hub_post = frontmatter.loads(hub_path.read_text(encoding="utf-8"))
    note_post = frontmatter.loads(note_path.read_text(encoding="utf-8"))
    assert hub_post.metadata["source_job_id"] == job["job_id"]
    assert hub_post.metadata["status"] == "In Progress"
    assert note_post.metadata["hub"] == "[[Elasticity_Hub]]"
    assert deployed["processed_source_path"] == "Inbox/generated/academic/Elasticity.pdf"


def test_source_job_roadmap_title_edits_deploy_updated_note_paths(tmp_path, monkeypatch):
    from types import SimpleNamespace
    from src.domains.ater.source_service import SourceLearningJobService

    parent_hub = "database/study planner/Winter2026/Microeconomics/Elasticity/Elasticity_Hub.md"
    hub_path = tmp_path / parent_hub
    hub_path.parent.mkdir(parents=True)
    hub_path.write_text("---\ntype: \"Hub\"\n---\n\n# Elasticity\n", encoding="utf-8")
    pdf_path = tmp_path / "Inbox" / "academic" / "Elasticity.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic chapter")

    docs = [
        SimpleNamespace(
            page_content="Elasticity\nObjectives\nDefine price elasticity\nDescribe income elasticity",
            metadata={"page": 0},
        )
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Microeconomics",
        unit="Elasticity",
        chapter_title="Elasticity",
        parent_hub_path=parent_hub,
    )
    updated = service.update_roadmap_titles(job["job_id"], ["Price Elasticity of Demand", "Income Elasticity"])
    assert updated["roadmap"][0]["title"] == "Price Elasticity of Demand"

    service.deploy_to_vault(job["job_id"], str(tmp_path))
    assert (
        tmp_path
        / "Notes"
        / "academic"
        / "Winter2026"
        / "Microeconomics"
        / "Elasticity"
        / "01_Source_Roadmap"
        / "Price_Elasticity_Of_Demand.md"
    ).exists()


def test_start_source_learning_restores_existing_session_progress(tmp_path, monkeypatch):
    from types import SimpleNamespace
    import json
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "academic" / "Elasticity.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF academic chapter")
    docs = [
        SimpleNamespace(
            page_content="Elasticity\nObjectives\nDefine price elasticity\nDescribe income elasticity",
            metadata={"page": 0},
        )
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(pdf_path),
        learning_scope="academic",
        semester="Winter2026",
        course="Microeconomics",
        unit="Elasticity",
        chapter_title="Elasticity",
    )
    service.update_roadmap_titles(job["job_id"], ["Price Elasticity", "Income Elasticity"])
    first_start = service.start_learning(job["job_id"])
    session_id = first_start["tutor_session"]["session_id"]
    second_path = "Notes/academic/Winter2026/Microeconomics/Elasticity/01_Source_Roadmap/Income_Elasticity.md"

    conn = service._connect()
    try:
        with conn:
            second_node_id = conn.execute(
                "SELECT id FROM concept_graph_nodes WHERE job_id = ? ORDER BY teaching_order LIMIT 1 OFFSET 1",
                (job["job_id"],),
            ).fetchone()["id"]
            conn.execute(
                "UPDATE tutor_sessions SET current_note_path = ?, current_concept_node_id = ?, active_note_unlocks = ? WHERE session_id = ?",
                (second_path, second_node_id, json.dumps([second_path]), session_id),
            )
    finally:
        conn.close()

    resumed = service.start_learning(job["job_id"])
    assert resumed["tutor_session"]["current_note_path"] == second_path
    assert resumed["tutor_session"]["active_note_unlocks"] == [second_path]


def test_source_job_deploys_external_pdf_to_external_database_and_notes(tmp_path, monkeypatch):
    from types import SimpleNamespace
    from src.domains.ater.source_service import SourceLearningJobService

    pdf_path = tmp_path / "Inbox" / "external" / "System_Design_Primer.pdf"
    pdf_path.parent.mkdir(parents=True)
    pdf_path.write_bytes(b"%PDF external source")

    docs = [
        SimpleNamespace(
            page_content=(
                "System Design\n"
                "Objectives\n"
                "Define load balancing\n"
                "Describe reliability"
            ),
            metadata={"page": 0},
        )
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: docs)

    service = SourceLearningJobService(tmp_path / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(str(pdf_path), learning_scope="external", external_domain="Computer_Science")
    deployed = service.deploy_to_vault(job["job_id"], str(tmp_path))

    hub_path = tmp_path / "database" / "external" / "Computer_Science" / "System_Design" / "System_Design_Hub.md"
    note_path = tmp_path / "Notes" / "external" / "Computer_Science" / "System_Design" / "01_Source_Roadmap" / "Load_Balancing.md"
    processed_pdf = tmp_path / "Inbox" / "generated" / "external" / "System_Design_Primer.pdf"

    assert hub_path.exists()
    assert note_path.exists()
    assert processed_pdf.exists()
    assert not pdf_path.exists()
    assert "SourceJobs" not in "\n".join(deployed["written_files"])


def test_learning_object_paths_separate_academic_and_external_vault_roots():
    from src.domains.ater import learning_object as lo

    assert lo.get_hub_path(
        "Production And Cost",
        semester="Winter2026",
        course="Microeconomics",
        unit="04_Production_And_Cost",
    ) == "database/study planner/Winter2026/Microeconomics/04_Production_And_Cost/Production_And_Cost_Hub.md"
    assert lo.get_note_path(
        "Production And Cost",
        "Foundations",
        1,
        "Production Function",
        semester="Winter2026",
        course="Microeconomics",
        unit="04_Production_And_Cost",
    ) == "Notes/academic/Winter2026/Microeconomics/04_Production_And_Cost/01_Foundations/Production_Function.md"
    assert lo.get_hub_path("System Design") == "database/learning paths/System_Design_Hub.md"
    assert lo.get_note_path("System Design", "Foundations", 1, "Load Balancing") == "database/General/System_Design/01_Foundations/Load_Balancing.md"


@pytest.mark.asyncio
async def test_ai_retry_recovers_from_transient_async_provider_error():
    from src.domains.ai.retry import ainvoke_llm_with_retry

    class FakeResponse:
        content = "OK"

    class FlakyLLM:
        def __init__(self):
            self.calls = 0

        async def ainvoke(self, _messages):
            self.calls += 1
            if self.calls == 1:
                raise RuntimeError("500 Internal Server Error")
            return FakeResponse()

    llm = FlakyLLM()
    res = await ainvoke_llm_with_retry(llm, [("human", "hello")], label="test", base_delay=0)

    assert res.content == "OK"
    assert llm.calls == 2


def test_ai_retry_treats_read_operation_timed_out_as_retryable():
    from src.domains.ai.retry import is_retryable_ai_error

    assert is_retryable_ai_error(RuntimeError("ReadTimeout: The read operation timed out"))


@pytest.mark.asyncio
async def test_remediation_lesson_strict_ai_failure_does_not_use_fallback(tmp_path):
    from types import SimpleNamespace
    from src.domains.ater.tutor_service import TutorAIGenerationError, TutorSessionManager

    note_path = "Notes/academic/Test.md"
    note_file = tmp_path / note_path
    note_file.parent.mkdir(parents=True)
    note_file.write_text("# Test\n\nConsumer preferences rank bundles.", encoding="utf-8")

    class FailingLLM:
        async def ainvoke(self, _messages):
            raise RuntimeError("500 Internal Server Error")

    (tmp_path / "Inbox").mkdir()
    ai_service = SimpleNamespace(llm=FailingLLM(), secrets=SimpleNamespace(ai_key="configured"))
    manager = TutorSessionManager(tmp_path / "Inbox" / "ater_queue.db", tmp_path, ai_service)

    with pytest.raises(TutorAIGenerationError):
        await manager.generate_detailed_remediation_lesson(
            note_path,
            {"id": "q1", "question": "What do preferences do?", "answer": "Rank bundles"},
            "They set prices",
        )
