import tempfile
import sqlite3
import re
import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from fastapi.testclient import TestClient

from src.domains.ater.agents import get_persona
from src.domains.ater.chat_runtime.attachments import AttachmentManager
from src.domains.ater.chat_runtime.store import ChatStorage
from src.domains.ater.learner_model_service import LearnerModelManager
from src.domains.ater.source_service import (
    SourceConceptGraphService,
    SourceAtomicNoteCompiler,
    SourceLearningJobService,
    build_teaching_profile,
    classify_concept_modality,
    extract_source_objectives,
    _merge_roadmap_duplicate_clusters,
    _is_teachable_title,
)
from src.domains.ater.router import DomainRouter
from src.domains.ater.service import AterService
from src.domains.ater.tutor_service import TutorSessionManager
from src.api.deps import AppSecrets, get_app_secrets
from src.api.main import app


def _chapter_pdf() -> Path:
    return Path(__file__).resolve().parents[3] / "Chapter 3 2024-1.pdf"


def _fake_docs():
    page_text = [
        "CHAPTER THREE 3. Theory of Consumer Behavior",
        "Chapter objectives After successful completion of this chapter, you will be able to: "
        "• explain consumer preferences and utility • differentiate between cardinal and ordinal utility approach "
        "• define indifference curve and discuss its properties • derive and explain the budget line "
        "• describe the equilibrium condition of a consumer",
        "Consumer Preferences: What the Consumer Wants. Given consumption bundles A, B and C, rank them according to preference.",
        "Consumer Preferences. Consumers make choices by comparing bundles of goods or consumption bundles.",
        "Utility is the satisfaction a consumer gets from consuming goods and services.",
        "Cardinal utility measures utility numerically while ordinal utility ranks bundles by preference.",
        "Indifference curve shows combinations of goods that give equal satisfaction and has specific properties.",
        "The budget line shows affordable bundles given income and prices; its slope depends on prices.",
        "Consumer equilibrium occurs where the consumer reaches the best affordable bundle.",
    ]
    docs = [SimpleNamespace(page_content=text, metadata={"page": idx}) for idx, text in enumerate(page_text)]
    docs.extend(SimpleNamespace(page_content=f"Slide text page {i}", metadata={"page": i - 1}) for i in range(10, 49))
    return docs


def _generic_chapter_docs():
    page_text = [
        "CHAPTER FOUR Production and Cost Analysis",
        "Chapter objectives After successful completion of this chapter, you will be able to: "
        "• explain production functions • describe total product, average product, and marginal product "
        "• analyze short run costs • compare fixed cost and variable cost",
        "Production Function: A production function shows the relationship between inputs and output.",
        "Total Product, Average Product, and Marginal Product describe how output changes as labor changes.",
        "Short Run Costs include fixed cost, variable cost, total cost, average cost, and marginal cost.",
        "Fixed Cost: Fixed cost does not change with output in the short run.",
        "Variable Cost: Variable cost changes as output changes.",
        "Marginal Cost: Marginal cost is the additional cost of producing one more unit.",
    ]
    return [SimpleNamespace(page_content=text, metadata={"page": idx}) for idx, text in enumerate(page_text)]


def _production_cost_slide_docs():
    page_text = [
        "Chapter Four\nThe Theory of Production and Cost",
        "Production\n• Production is the process of transforming inputs into outputs.",
        "Production function\n• Production function is a technical relationship between inputs and outputs.\n• A general equation for production function can be given as: Q = f(X1, X2).",
        "Inputs\n• Fixed inputs: inputs whose quantity cannot readily be changed.\n• Variable inputs: inputs whose quantity can be altered.",
        "Short run and Long run\n• Short run: a period where at least one input is fixed.",
        "Theory of production in the short run\n• Long run: time period sufficient to change all inputs.",
        "Total, Average, and Marginal Product\nTotal Product (TP): total amount of output.\nTotal Product Curve: represents output levels.",
        "Marginal Product (MP): change in total product from one more unit of labor.",
        "Average Product (AP): output per unit of labor.",
        "The Law of Variable Proportions\n• The law of diminishing returns applies with fixed technology.",
        "Stages of Production\n• Stage I, Stage II, and Stage III describe production ranges.",
        "Theory of costs in the short run\nBasic Concepts:\n1. Social Cost\n2. Private Cost",
        "Theory of costs in the short run\n1. Accounting Cost: direct expenses paid by the firm.",
        "Theory of costs in the short run\n2. Economic Cost: accounting cost plus opportunity cost.",
        "Theory of costs in the short run\nProfit: difference between revenue and cost.",
        "Total Costs in the Short Run\n• Total costs split into fixed and variable costs.",
        "Total Cost Curves in the Short Run\nTFC Curve:\nTVC Curve:\nTC Curve:",
        "Per Unit Costs in the Short Run\nAverage Fixed Cost (AFC): total fixed cost per unit of output.",
        "$/output unit\nAFC(Q) -> 0 as Q -> infinity",
        "Per Unit Costs in the Short Run\nAverage Variable Cost (AVC): total variable cost per unit of output.",
        "Derivation of SAVC from TVC\nFig. TVC\nFig. SAVC",
        "Per Unit Costs in the Short Run\nAverage Total Cost (ATC or AC): total cost per unit of output.",
        "Derivation of SATC from TC\nFig. TC\nFig. SATC",
        "Per Unit Costs in the Short Run\nMarginal Cost (MC): additional cost to produce one extra unit.",
        "The Relationship between AVC, ATC and MC\n• MC passes through the minimum points of ATC and AVC.",
        "The Relationship b/n Short run Production and Short run Cost\n• Production curves and cost curves move inversely.",
        "The Relationship Between AP and AVC Curves",
        "The Relationship Between MP and MC Curves",
        "The Relationship Between Production & Cost Curves",
        "The Theory of Production and Cost",
    ]
    return [SimpleNamespace(page_content=text, metadata={"page": idx}) for idx, text in enumerate(page_text)]


def _arbitrary_ml_docs():
    page_text = [
        "Machine Learning Foundations",
        "Supervised Learning: models learn a mapping from labeled examples to predict labels for new inputs.",
        "Training Data. Training data contains input-output examples used to fit model parameters.",
        "Loss Function: A loss function measures prediction error and gives the optimizer a target.",
        "Gradient Descent updates model parameters step by step to reduce the loss function.",
        "Overfitting occurs when a model memorizes training data and performs poorly on unseen data.",
        "Evaluation Metrics include accuracy, precision, recall, and F1 score for judging model behavior.",
    ]
    return [SimpleNamespace(page_content=text, metadata={"page": idx}) for idx, text in enumerate(page_text)]


def test_practice_discovers_nested_academic_study_planner_hubs(tmp_path):
    root = tmp_path
    hub_rel = "database/study planner/Winter2026/Economics/Chapter_3/Chapter_3_Hub.md"
    hub_path = root / hub_rel
    hub_path.parent.mkdir(parents=True)
    hub_path.write_text(
        """---
title: "Chapter_3_Hub"
type: "Hub"
semester: "Winter2026"
course: "Economics"
unit: "Chapter_3"
---

# Chapter 3

## Atomic Notes
- [[Ordinal_Utility]]
""",
        encoding="utf-8",
    )

    note_dir = root / "Notes" / "academic" / "Winter2026" / "Economics" / "Chapter_3" / "01_Source_Roadmap"
    note_dir.mkdir(parents=True)
    (note_dir / "Ordinal_Utility.md").write_text("# Ordinal Utility", encoding="utf-8")

    secrets = AppSecrets(vault_path=str(root), inbox_path=str(root / "Inbox"), academic_path="Notes/academic", ai_key=None)
    service = AterService(secrets)

    hubs = service.list_planner_hubs()
    assert any(hub["path"] == hub_rel for hub in hubs)
    resolved = service._find_hub("database/study planner/Winter2026/Economics/Chapter_3/Chapter_3_Hub")
    assert resolved is not None
    assert resolved["path"] == hub_rel
    assert service._get_unit_dir(resolved) == note_dir


def test_practice_resolves_academic_notes_when_academic_root_is_notes(tmp_path):
    root = tmp_path
    hub_rel = "database/study planner/Winter2026/Economics/Chapter_3/Chapter_3_Hub.md"
    hub_path = root / hub_rel
    hub_path.parent.mkdir(parents=True)
    hub_path.write_text(
        """---
title: "Chapter_3_Hub"
type: "Hub"
semester: "Winter2026"
course: "Economics"
unit: "Chapter_3"
---
""",
        encoding="utf-8",
    )
    note_dir = root / "Notes" / "academic" / "Winter2026" / "Economics" / "Chapter_3" / "01_Source_Roadmap"
    note_dir.mkdir(parents=True)
    (note_dir / "Budget_Line.md").write_text("# Budget Line", encoding="utf-8")

    secrets = AppSecrets(vault_path=str(root), inbox_path=str(root / "Inbox"), academic_path="Notes", ai_key=None)
    service = AterService(secrets)
    resolved = service._find_hub(hub_rel.removesuffix(".md"))

    assert resolved is not None
    assert service._get_unit_dir(resolved) == note_dir


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_academic_source_learning_uses_canonical_paths_without_visible_sourcejobs(_mock_pdf, tmp_path):
    root = tmp_path
    source = root / "Inbox" / "academic" / "Chapter 3 2024-1.pdf"
    source.parent.mkdir(parents=True)
    source.write_bytes(b"fake pdf bytes")

    parent_hub = "database/study planner/Winter2026/Economics/Chapter_3/Chapter_3_Hub.md"
    service = SourceLearningJobService(root / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(source),
        learning_scope="academic",
        semester="Winter2026",
        course="Economics",
        unit="Chapter_3",
        chapter_title="Chapter_3",
        parent_hub_path=parent_hub,
    )

    started = service.start_learning(job["job_id"])
    tutor = started["tutor_session"]

    assert tutor["hub_path"] == parent_hub
    assert tutor["current_note_path"].startswith("Notes/academic/Winter2026/Economics/Chapter_3/01_Source_Roadmap/")
    assert all(path.startswith("Notes/academic/Winter2026/Economics/Chapter_3/01_Source_Roadmap/") for path in tutor["curriculum"])
    assert not (root / "SourceJobs" / job["job_id"]).exists()
    first_note = root / tutor["current_note_path"]
    assert "source_file: \"Inbox/generated/academic/Chapter 3 2024-1.pdf\"" in first_note.read_text(encoding="utf-8")


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_source_tutor_advance_updates_source_job_link_to_next_canonical_note(_mock_pdf, tmp_path):
    import json

    root = tmp_path
    source = root / "Inbox" / "academic" / "Chapter 3 2024-1.pdf"
    source.parent.mkdir(parents=True)
    source.write_bytes(b"fake pdf bytes")
    parent_hub = "database/study planner/Winter2026/Economics/Chapter_3/Chapter_3_Hub.md"
    service = SourceLearningJobService(root / "Inbox" / "ater_queue.db")
    job = service.create_or_resume_from_path(
        str(source),
        learning_scope="academic",
        semester="Winter2026",
        course="Economics",
        unit="Chapter_3",
        chapter_title="Chapter_3",
        parent_hub_path=parent_hub,
    )
    service.update_roadmap_titles(job["job_id"], ["Consumer Preferences", "Ordinal Utility"])
    started = service.start_learning(job["job_id"])
    session_id = started["tutor_session"]["session_id"]
    current_path = started["tutor_session"]["current_note_path"]
    next_path = started["tutor_session"]["curriculum"][1]

    conn = service._connect()
    try:
        with conn:
            conn.execute(
                "UPDATE tutor_sessions SET completed_notes = ?, transfer_gate_outcomes = ? WHERE session_id = ?",
                (
                    json.dumps([]),
                    json.dumps({current_path: {"status": "passed"}}),
                    session_id,
                ),
            )
            for qid in ["Consumer_Preferences_q1", "Consumer_Preferences_q2", "Consumer_Preferences_q3"]:
                conn.execute(
                    "UPDATE tutor_sessions SET wagers = json_set(coalesce(wagers, '{}'), ?, json(?)) WHERE session_id = ?",
                    (f"$.{qid}", json.dumps({"wager": "low", "correct": True}), session_id),
                )
    finally:
        conn.close()

    manager = TutorSessionManager(root / "Inbox" / "ater_queue.db", root)
    advanced = manager.advance_note(session_id)
    assert advanced["can_advance"] is True
    assert advanced["current_note_path"] == next_path

    linked = service.get_job(job["job_id"])["current_tutor_link"]
    assert linked["current_note_path"] == next_path
    assert linked["current_concept_node_id"].endswith("_concept_2")


def test_source_tutor_stops_for_chapter_quiz_between_nested_source_chapters(tmp_path, monkeypatch):
    root = tmp_path
    db_path = root / "Inbox" / "ater_queue.db"
    db_path.parent.mkdir(parents=True)
    manager = TutorSessionManager(db_path, root)
    now = "2026-07-06T00:00:00"
    paths = [
        "Notes/external/General/Unit/01_Source_Roadmap/Alpha.md",
        "Notes/external/General/Unit/01_Source_Roadmap/Beta.md",
        "Notes/external/General/Unit/01_Source_Roadmap/Gamma.md",
    ]
    for path, qid in zip(paths, ["alpha_q1", "beta_q1", "gamma_q1"]):
        note_path = root / path
        note_path.parent.mkdir(parents=True, exist_ok=True)
        note_path.write_text(
            f"```interactive-quiz\n[{json.dumps({'id': qid, 'question': 'Recall?', 'answer': 'Yes'})}]\n```",
            encoding="utf-8",
        )
    hub_path = root / "Unit_Hub.md"
    hub_path.write_text("# Unit\n", encoding="utf-8")

    fake_job = {
        "job_id": "srcjob_nested",
        "file_name": "Unit.pdf",
        "placement": {
            "learning_scope": "external",
            "external_domain": "General",
            "learning_path": "Unit",
            "chapter": "01_Source_Roadmap",
        },
        "concept_graph": {
            "nodes": [
                {"id": "concept_1", "title": "Alpha", "teaching_order": 1, "source_pages": [1]},
                {"id": "concept_2", "title": "Beta", "teaching_order": 2, "source_pages": [2]},
                {"id": "concept_3", "title": "Gamma", "teaching_order": 3, "source_pages": [3]},
            ]
        },
        "chapters": [
            {
                "id": "chapter_01",
                "title": "Chapter 1: Alpha And Beta",
                "atomic_notes": [
                    {"id": "concept_1", "title": "Alpha", "path": paths[0]},
                    {"id": "concept_2", "title": "Beta", "path": paths[1]},
                ],
            },
            {
                "id": "chapter_02",
                "title": "Chapter 2: Gamma",
                "atomic_notes": [
                    {"id": "concept_3", "title": "Gamma", "path": paths[2]},
                ],
            },
        ],
        "coverage": {"rows": []},
        "warnings": [],
    }
    monkeypatch.setattr(SourceLearningJobService, "get_job", lambda self, job_id: fake_job)

    manager.conn.execute(
        "CREATE TABLE IF NOT EXISTS source_job_tutor_links (job_id TEXT PRIMARY KEY, tutor_session_id TEXT, current_concept_node_id TEXT, current_note_path TEXT, updated_at TEXT)"
    )
    manager.conn.execute(
        """
        INSERT INTO tutor_sessions (
            session_id, hub_path, current_note_path, completed_notes, wagers, score, status,
            updated_at, active_note_unlocks, consecutive_failures, active_question_overrides,
            generated_ahead_paths, transfer_gate_outcomes, offline_readiness, source_job_id,
            current_concept_node_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "sess_nested",
            "Unit_Hub.md",
            paths[1],
            json.dumps([paths[0]]),
            json.dumps({"beta_q1": {"correct": True}}),
            0,
            "active",
            now,
            json.dumps(paths[:2]),
            json.dumps({}),
            json.dumps({}),
            json.dumps(paths[:2]),
            json.dumps({}),
            json.dumps({}),
            "srcjob_nested",
            "concept_2",
        ),
    )
    manager.conn.execute(
        "INSERT INTO source_job_tutor_links VALUES (?, ?, ?, ?, ?)",
        ("srcjob_nested", "sess_nested", "concept_2", paths[1], now),
    )
    manager.conn.commit()

    advanced = manager.advance_note("sess_nested")
    assert advanced["can_advance"] is True
    assert advanced["status"] == "consolidation_quiz"
    assert advanced["current_note_path"] == paths[1]

    quiz = manager.start_consolidation_quiz("sess_nested")
    assert quiz["chapter_title"] == "Chapter 1: Alpha And Beta"
    assert {question["note_id"] for question in quiz["questions"]} == {paths[0], paths[1]}


def test_fallback_economics_note_uses_source_facts_not_generic_boilerplate():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Quantitative")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_budget",
        "title": "Budget Line",
        "domain": "ECON-MICRO",
        "modality": "Quantitative",
        "source_pages": [43, 44],
        "source_excerpts": [
            {
                "page": 43,
                "text": "Budget set: the set of affordable bundles given prices Px and Py and income M. The budget equation is PxX + PyY = M.",
            },
            {
                "page": 44,
                "text": "Any bundle on or within the budget line is affordable. Any bundle outside the budget line is unaffordable. The slope is negative because consuming more of good X requires consuming less of good Y.",
            },
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"]
    quiz = note["quiz"]

    assert "organic agricultural soil-enrichment cycle" not in content
    assert "works by connecting the source's key terms" not in content
    assert "PxX + PyY = M" in content or "𝑷𝑿𝑿" in content
    assert "affordable" in content.lower()
    assert quiz[0]["answer"] != "A" or "Chapter objectives" not in quiz[0]["options"]["A"]
    assert all("explanation_page" in question for question in quiz)


def test_fallback_note_cleans_numbered_slide_fragments_into_usable_facts():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Comparative")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_ordinal",
        "title": "Ordinal Utility",
        "domain": "ECON-MICRO",
        "modality": "Comparative",
        "source_pages": [10, 11],
        "source_excerpts": [
            {
                "page": 10,
                "text": (
                    "Two major approaches to measure or compare consumer's utility: 1. Cardinal Approach "
                    "2. Ordinal Approach. Ordinal utility ranks bundles by preference rather than measuring "
                    "utility numerically."
                ),
            },
            {
                "page": 11,
                "text": "Utility is ordinal when the consumer can rank bundles but the exact amount of satisfaction is not measured.",
            },
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"]
    option_a = note["quiz"][0]["options"]["A"]

    assert ": 1." not in content
    assert "Cardinal Approach 2." not in content
    assert "Cardinal Approach and Ordinal Approach" in content
    assert "ranks bundles by preference" in content
    assert len(option_a.split()) >= 8
    assert not option_a.strip().lower() in {"cardinal approach", "ordinal approach", "two major approaches"}


def test_fallback_note_prefers_title_side_when_source_contrasts_opposing_approaches():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Comparative")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_ordinal",
        "title": "Ordinal Utility",
        "domain": "ECON-MICRO",
        "modality": "Comparative",
        "source_pages": [10, 11],
        "source_excerpts": [
            {"page": 10, "text": "Approaches of measuring utility • Cardinal Approach • Ordinal Approach."},
            {
                "page": 11,
                "text": (
                    "The Cardinalist school measures utility objectively using utils. "
                    "It is possible to express utility in cardinal numbers such as 1, 2, 3, 4, 5 and so on. "
                    "The Ordinalist school compares utility by ranking bundles in order of preference."
                ),
            },
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    option_a = note["quiz"][0]["options"]["A"].lower()
    content = note["content"].lower()

    assert "ordinalist" in option_a or "ranking bundles" in option_a
    assert "cardinal numbers" not in option_a
    assert "ranking bundles" in content


def test_fallback_cardinal_utility_does_not_reuse_preference_template():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Quantitative")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_cardinal",
        "title": "Cardinal Utility Theory",
        "domain": "ECON-MICRO",
        "modality": "Quantitative",
        "source_pages": [12, 13, 14],
        "source_excerpts": [
            {
                "page": 12,
                "text": "Utility is measurable by arbitrary unit of measurement called utils. Utils help in understanding how much utility is derived from consumption of a product.",
            },
            {
                "page": 13,
                "text": "The cardinal utility is based on marginal utility analysis.",
            },
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"].lower()

    assert "satisfaction score" in content
    assert "marginal utility" in content
    assert "measurable" in content
    assert "sorting complete baskets" not in content
    assert "ranks whole bundles" not in content


def test_roadmap_compression_merges_fragments_without_domain_title_table():
    nodes = [
        {
            "id": "concept_1",
            "title": "Concept Of Utility",
            "source_pages": [8],
            "source_excerpts": [{"page": 8, "text": "Utility is the satisfaction from consuming goods and services."}],
        },
        {
            "id": "concept_2",
            "title": "Utility",
            "source_pages": [8],
            "source_excerpts": [{"page": 8, "text": "Utility means satisfaction from consumption."}],
        },
        {
            "id": "concept_3",
            "title": "Cardinal Utility Theory",
            "source_pages": [12, 13],
            "source_excerpts": [{"page": 12, "text": "Cardinal utility measures utility numerically using utils."}],
        },
        {
            "id": "concept_4",
            "title": "Cardinal Approach",
            "source_pages": [12],
            "source_excerpts": [{"page": 12, "text": "The cardinal approach measures utility numerically using utils."}],
        },
        {
            "id": "concept_5",
            "title": "Indifference Curves",
            "source_pages": [34],
            "source_excerpts": [{"page": 34, "text": "An indifference curve contains bundles that give equal satisfaction."}],
        },
        {
            "id": "concept_6",
            "title": "Indifference Set",
            "source_pages": [34],
            "source_excerpts": [{"page": 34, "text": "An indifference set groups bundles that give equal satisfaction."}],
        },
        {
            "id": "concept_7",
            "title": "Case Of One Commodity(X)",
            "source_pages": [20],
            "source_excerpts": [{"page": 20, "text": "Case of one commodity X."}],
        },
    ]

    merged = _merge_roadmap_duplicate_clusters(nodes, [])
    titles = [node["title"] for node in merged]

    assert "Concept Of Utility" in titles
    assert "Utility" not in titles
    assert "Cardinal Utility Theory" in titles
    assert "Cardinal Approach" not in titles
    assert "Indifference Curves" in titles
    assert "Indifference Set" not in titles
    assert "Case Of One Commodity(X)" not in titles


def test_programming_pdf_routes_to_cs_and_rejects_code_line_titles():
    text = """
    Chapter Three Encapsulation, Inheritance, Abstraction and Polymorphism.
    public class Plant {
      public void meth3() { System.out.println("Plant"); }
    }
    Abstract classes are incomplete by themselves and subclasses provide complete implementations.
    Interfaces define behavior contracts that implementing classes must satisfy.
    """

    assert DomainRouter().route(text, course="OOP With Java") == "CS-SOFTWARE"
    assert _is_teachable_title("Abstract Classes") is True
    assert _is_teachable_title("Interfaces") is True
    assert _is_teachable_title("Public Class Plant {") is False
    assert _is_teachable_title("Public Void Meth3() {") is False
    assert _is_teachable_title("System.Out.Println);") is False
    assert _is_teachable_title("Output From The Program Is Shown Here") is False
    assert _is_teachable_title("Dollar Sign ($)") is False
    assert _is_teachable_title("In The") is False


def test_cs_fallback_renders_code_anchor_as_code_not_latex():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("CS-SOFTWARE", "Procedural")
    job = {"job_id": "srcjob_java", "file_name": "Chapter three.pdf"}
    node = {
        "id": "concept_abstract",
        "title": "Abstract Classes",
        "domain": "CS-SOFTWARE",
        "modality": "Procedural",
        "source_pages": [48],
        "source_excerpts": [
            {
                "page": 48,
                "text": "The Shape Abstract Class public abstract class Shape { public abstract double area(); public void move(){ } } Abstract classes are incomplete by themselves and rely on subclasses.",
            }
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"]

    assert "```java" in content
    assert "$$\n" not in content
    assert note["frontmatter"]["domain"] == "CS-SOFTWARE"


def test_fallback_note_rejects_source_prompts_and_prefers_explanatory_facts():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Quantitative")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_preferences",
        "title": "Consumer Preferences And Utility",
        "domain": "ECON-MICRO",
        "modality": "Quantitative",
        "source_pages": [3, 4],
        "source_excerpts": [
            {
                "page": 3,
                "text": (
                    "Consumer Preferences: What the Consumer Wants. Given three consumption Bundles A, B and C. "
                    "Which Bundle do you prefer? Rank them according to your preference."
                ),
            },
            {
                "page": 4,
                "text": (
                    "Consumer Preferences • Consumers make choices by comparing bundles of goods or consumption bundles. "
                    "A consumption bundle is a complete list of goods and services that are available for choice by the consumer."
                ),
            },
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"]
    option_a = note["quiz"][0]["options"]["A"]

    assert "Which Bundle do you prefer" not in content
    assert "Rank them according" not in content
    assert "Consumers make choices by comparing bundles" in content
    assert "Consumers make choices by comparing bundles" in option_a
    assert not option_a.startswith("Consumer Preferences:")


def test_fallback_note_writes_source_specific_lesson_prose():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Quantitative")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_budget_line",
        "title": "Budget Line",
        "domain": "ECON-MICRO",
        "modality": "Quantitative",
        "source_pages": [43, 44],
        "source_excerpts": [
            {"page": 43, "text": "Budget set: the set of affordable bundles given prices Px and Py and income M."},
            {"page": 43, "text": "The budget equation is PxX + PyY = M."},
            {"page": 44, "text": "Any bundle outside the budget line is unaffordable."},
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"]

    assert "Use that source statement" not in content
    assert "source statement as the mental handle" not in content
    assert "The formal reading" not in content
    assert "separating affordable choices" in content
    assert "PxX + PyY = M" in content


def test_source_atomic_note_contract_uses_three_dynamic_teaching_headings_without_inline_citations():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Qualitative/Definitional")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_preferences",
        "title": "Consumer Preferences",
        "domain": "ECON-MICRO",
        "modality": "Qualitative/Definitional",
        "source_pages": [3, 4, 5, 6],
        "source_excerpts": [
            {"page": 3, "text": "A bundle may contain pizza and Coca-Cola, or burger and beer."},
            {"page": 4, "text": "A consumption bundle is a complete list of goods and services that are available for choice by the consumer."},
            {"page": 6, "text": "If X is weakly preferred to Y and Y is weakly preferred to X, then X is indifferent to Y."},
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"]
    headings = re.findall(r"^##\s+(.+)$", content, flags=re.MULTILINE)

    assert headings[0] == "Mental Model"
    assert headings[-1] == "The Proving Grounds"
    assert len([heading for heading in headings if heading not in {"Mental Model", "The Proving Grounds"}]) == 3
    assert "[PAGE" not in content
    assert "## Source Evidence" not in content


def test_fallback_formal_anchor_avoids_slide_heading_when_no_equation_exists():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Quantitative")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_preferences",
        "title": "Consumer Preferences And Utility",
        "domain": "ECON-MICRO",
        "modality": "Quantitative",
        "source_pages": [3, 4],
        "source_excerpts": [
            {"page": 3, "text": "Consumer Preferences: What the Consumer Wants."},
            {"page": 4, "text": "Consumers make choices by comparing bundles of goods or consumption bundles."},
            {"page": 4, "text": "A consumption bundle is a complete list of goods and services that are available for choice by the consumer."},
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"]

    formal_section = content.split("## The Formal Math & Models", 1)[1].split("## The Proving Grounds", 1)[0]
    assert "Consumer Preferences: What the Consumer Wants" not in formal_section
    assert "Consumers make choices by comparing bundles" in formal_section


def test_fallback_note_filters_chapter_objective_boilerplate_from_facts():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Quantitative")
    job = {"job_id": "srcjob_quality", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_preferences",
        "title": "Consumer Preferences And Utility",
        "domain": "ECON-MICRO",
        "modality": "Quantitative",
        "source_pages": [2, 3, 4],
        "source_excerpts": [
            {"page": 2, "text": "Chapter objectives After successful completion of this chapter, you will be able to: explain consumer preferences and utility. differentiate between cardinal and ordinal utility approach."},
            {"page": 3, "text": "Consumer Preferences: What the Consumer Wants. Our goal is to understand how consumers make choices. Given consumption bundles A, B and C, the consumer ranks bundles according to preference."},
            {"page": 4, "text": "Consumers make choices by comparing bundles of goods. Preferences describe what the consumer wants before the budget constraint is applied."},
        ],
        "warnings": [],
    }

    note = compiler.compile_fallback_note(job, node, profile)
    content = note["content"]
    option_a = note["quiz"][0]["options"]["A"]

    assert "Chapter objectives" not in content
    assert "After successful completion" not in content
    assert not option_a.lower().startswith("chapter objectives")
    assert "consumers make choices" in content.lower() or "comparing bundles" in content.lower()


def test_golden_pdf_extraction_audit_when_fixture_available():
    pdf_path = _chapter_pdf()
    if not pdf_path.exists():
        return
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        service = SourceLearningJobService(Path(tmp) / "ater_queue.db")
        job = service.create_or_resume_from_path(str(pdf_path))
    assert job["audit"]["page_count"] == 48
    assert job["title"] == "Chapter 3"
    assert job["topic"] == "Theory of Consumer Behavior"
    assert job["domain"] == "ECON-MICRO"
    assert "explain consumer preferences and utility" in " ".join(obj["text"].lower() for obj in job["source_map"]["objectives"])


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_source_job_builds_objectives_concept_graph_profiles_and_coverage(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        source = Path(tmp) / "Chapter 3 2024-1.pdf"
        source.write_bytes(b"fake pdf bytes")
        service = SourceLearningJobService(Path(tmp) / "ater_queue.db")
        job = service.create_or_resume_from_path(str(source), conversation_id="conv_1")
        rerun = service.create_or_resume_from_path(str(source), conversation_id="conv_1")

    assert rerun["job_id"] == job["job_id"]
    assert job["audit"]["page_count"] == 48
    assert job["source_type"] == "ppt_exported_pdf"
    assert job["domain"] == "ECON-MICRO"
    objectives = [obj["text"].lower() for obj in job["source_map"]["objectives"]]
    assert any("cardinal and ordinal utility" in obj for obj in objectives)
    titles = [node["title"] for node in job["concept_graph"]["nodes"]]
    assert "Consumer Preferences And Utility" in titles
    assert "Budget Line" in titles
    assert "Equilibrium Condition Of A Consumer" in titles
    ordinal = next(node for node in job["concept_graph"]["nodes"] if node["title"] == "Ordinal Utility")
    assert any(page > 2 for page in ordinal["source_pages"])
    assert any("ordinal utility" in excerpt["text"].lower() for excerpt in ordinal["source_excerpts"])
    assert all(node["source_pages"] for node in job["concept_graph"]["nodes"])
    assert len(job["concept_graph"]["edges"]) == len(job["concept_graph"]["nodes"]) - 1
    budget = next(node for node in job["concept_graph"]["nodes"] if node["title"] == "Budget Line")
    assert budget["modality"] == "Quantitative"
    assert "Python" in budget["teaching_profile"]["artifact_constraints"]["forbidden"]
    assert job["coverage"]["rows"]


def test_dynamic_domain_matrix_precedes_universal_modality_fallback():
    econ_profile = get_persona("ECON-MICRO", "Quantitative")
    assert econ_profile["persona"] == "Microeconomist"
    assert "Python" in econ_profile["prohibited_anti_patterns"]
    assert "Calculation" in econ_profile["artifact"]

    bio_profile = get_persona("BIOLOGY", "Qualitative/Definitional")
    assert "Biologist" in bio_profile["persona"]
    assert "utility" not in str(bio_profile).lower()

    cs_profile = get_persona("CS-SOFTWARE", "Comparative")
    assert "Systems Analyst" in cs_profile["persona"]


def test_objective_and_modality_helpers_are_deterministic():
    objectives = extract_source_objectives([
        {"page_number": 2, "content": _fake_docs()[1].page_content}
    ])
    assert len(objectives) == 5
    assert classify_concept_modality("Cardinal Versus Ordinal Utility", "") == "Comparative"
    assert classify_concept_modality("Budget Line", "income price slope") == "Quantitative"


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_start_learning_compiles_fallback_note_and_updates_coverage(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        source = Path(tmp) / "Chapter 3 2024-1.pdf"
        source.write_bytes(b"fake pdf bytes")
        service = SourceLearningJobService(Path(tmp) / "ater_queue.db")
        job = service.create_or_resume_from_path(str(source))
        started = service.start_learning(job["job_id"])
        node_id = started["tutor_session"]["current_concept_node_id"]
        service.update_coverage_for_answer(job["job_id"], node_id, correct=True, transfer_passed=True)
        updated = service.get_job(job["job_id"])

    note = started["tutor_session"]["current_note"]
    assert note["valid"] is True
    assert note["fallback"] is True
    assert note["frontmatter"]["source_job_id"] == job["job_id"]
    concept_row = next(row for row in updated["coverage"]["rows"] if row.get("concept_node_id") == node_id)
    assert concept_row["mastery_state"] == "mastered"
    assert concept_row["practice_scheduled"] == 1


def test_compiler_rejects_ungrounded_node_without_warning():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Qualitative/Definitional")
    job = {"job_id": "srcjob_test", "file_name": "Chapter 3 2024-1.pdf"}
    node = {"title": "Ungrounded", "domain": "ECON-MICRO", "modality": "Qualitative/Definitional", "source_pages": [], "warnings": []}
    try:
        compiler.compile_fallback_note(job, node, profile)
    except ValueError as exc:
        assert "requires source pages" in str(exc)
    else:
        raise AssertionError("Expected ungrounded node rejection")


def test_old_compiler_graph_service_and_schema_migration_compatibility():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        db_path = Path(tmp) / "ater_queue.db"
        conn = sqlite3.connect(db_path)
        conn.execute("CREATE TABLE queue_items (id TEXT PRIMARY KEY, path TEXT)")
        conn.execute("INSERT INTO queue_items VALUES ('old', '/tmp/old.pdf')")
        conn.execute("CREATE TABLE tutor_sessions (session_id TEXT PRIMARY KEY, hub_path TEXT)")
        conn.commit()
        conn.close()

        service = SourceLearningJobService(db_path)
        conn = sqlite3.connect(db_path)
        columns = [row[1] for row in conn.execute("PRAGMA table_info(tutor_sessions)").fetchall()]
        assert "source_job_id" in columns
        assert conn.execute("SELECT path FROM queue_items WHERE id = 'old'").fetchone()[0] == "/tmp/old.pdf"
        conn.close()

    nodes, edges, warnings = SourceConceptGraphService().build_from_pages(
        "Theory of Consumer Behavior",
        extract_source_objectives([{"page_number": 2, "content": _fake_docs()[1].page_content}]),
        [{"page_number": idx + 1, "content": doc.page_content, "text_length": len(doc.page_content)} for idx, doc in enumerate(_fake_docs())],
        "ECON-MICRO",
    )
    assert any(node["title"] == "Budget Line" for node in nodes)
    assert len(edges) == len(nodes) - 1
    assert warnings == []


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_tutor_runtime_source_session_restart_remediation_transfer_and_fsrs_gate(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        source = root / "Chapter 3 2024-1.pdf"
        source.write_bytes(b"fake pdf bytes")
        db_path = root / "ater_queue.db"
        service = SourceLearningJobService(db_path)
        job = service.create_or_resume_from_path(str(source))
        started = service.start_learning(job["job_id"])
        session_id = started["tutor_session"]["session_id"]
        note_path = started["tutor_session"]["current_note_path"]
        note_file = root / note_path
        note_file.parent.mkdir(parents=True, exist_ok=True)
        note_file.write_text(
            """---
title: Consumption Bundles
source_job_id: "%s"
transfer_task:
  type: scenario
  prompt: Apply consumption bundles.
  grading_criteria: Identifies bundles and preference ranking.
---
# 1. Mental Model
Source text.
# 3. Proving Grounds
```interactive-quiz
[{"id":"q1","type":"mcq","question":"What is a bundle?","options":{"A":"A set of goods","B":"A bank policy"},"answer":"A"}]
```
""" % job["job_id"],
            encoding="utf-8",
        )

        restored = TutorSessionManager(db_path, root).get_session(session_id)
        assert restored["source_job_id"] == job["job_id"]
        assert restored["current_concept_node_id"] == started["tutor_session"]["current_concept_node_id"]
        assert restored["source_coverage"]["rows"]

        manager = TutorSessionManager(db_path, root)
        wrong = __import__("asyncio").run(manager.submit_answer(session_id, "q1", False, "high", "central banking"))
        assert "source evidence" in wrong["diagnosis"]["misconception_text"].lower() or "page" in wrong["diagnosis"]["misconception_text"].lower()
        failed_job = service.get_job(job["job_id"])
        concept_row = next(row for row in failed_job["coverage"]["rows"] if row.get("concept_node_id") == started["tutor_session"]["current_concept_node_id"])
        assert concept_row["remediation_required"] == 1
        assert concept_row["practice_scheduled"] == 0

        __import__("asyncio").run(manager.submit_answer(session_id, "q1", True, "high", "A"))
        __import__("asyncio").run(manager.submit_transfer_answer(session_id, note_path, "I rank affordable bundles by preference."))
        mastered_job = service.get_job(job["job_id"])
        concept_row = next(row for row in mastered_job["coverage"]["rows"] if row.get("concept_node_id") == started["tutor_session"]["current_concept_node_id"])
        assert concept_row["transfer_passed"] == 1
        assert concept_row["practice_scheduled"] == 1


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_adaptive_learner_source_mastery_and_recommendations(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        source = root / "Chapter 3 2024-1.pdf"
        source.write_bytes(b"fake pdf bytes")
        db_path = root / "ater_queue.db"
        service = SourceLearningJobService(db_path)
        job = service.create_or_resume_from_path(str(source))
        node_id = job["concept_graph"]["nodes"][0]["id"]
        service.update_coverage_for_answer(job["job_id"], node_id, correct=True, transfer_passed=False)

        learner = LearnerModelManager(db_path, root)
        summary = learner.summarize_source_mastery(job["job_id"])
        assert summary["transfer_weaknesses"]
        first_obj = job["concept_graph"]["nodes"][0]["objective_ids"][0]
        learner.record_source_misconception(job["job_id"], first_obj, "confuses utility with budget line")
        learner.record_source_misconception(job["job_id"], first_obj, "confuses utility with budget line")
        learner.record_source_transfer_failure(job["job_id"], first_obj)
        recommendations = learner.recommend_source_next_actions(job["job_id"])
        assert any(rec["type"] in {"application_practice", "objective_remediation"} for rec in recommendations)


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_multiple_pdf_jobs_do_not_collide_on_source_map_or_concept_ids(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        db_path = root / "ater_queue.db"
        chapter_3 = root / "Chapter 3 2024-1.pdf"
        chapter_4 = root / "Chapter 4 2024-1.pdf"
        chapter_3.write_bytes(b"chapter 3 fake pdf bytes")
        chapter_4.write_bytes(b"chapter 4 fake pdf bytes")

        service = SourceLearningJobService(db_path)
        first = service.create_or_resume_from_path(str(chapter_3))
        second = service.create_or_resume_from_path(str(chapter_4))

        assert first["job_id"] != second["job_id"]
        assert first["source_map"]["sections"][0]["id"].startswith(first["job_id"])
        assert second["source_map"]["sections"][0]["id"].startswith(second["job_id"])
        assert first["concept_graph"]["nodes"][0]["id"].startswith(first["job_id"])
        assert second["concept_graph"]["nodes"][0]["id"].startswith(second["job_id"])
        assert service.start_learning(second["job_id"])["tutor_session"]["source_job_id"] == second["job_id"]


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_generic_chapter_docs())
def test_non_chapter_three_pdf_builds_generic_teachable_roadmap(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        source = root / "Chapter 4 2024-1.pdf"
        source.write_bytes(b"chapter 4 fake pdf bytes")

        service = SourceLearningJobService(root / "ater_queue.db")
        job = service.create_or_resume_from_path(str(source))
        titles = [node["title"] for node in job["concept_graph"]["nodes"]]

        assert len(titles) >= 7
        assert "Production Functions" in titles
        assert "Total Product" in titles
        assert "Average Product" in titles
        assert "Marginal Product" in titles
        assert "Fixed Cost" in titles
        assert "Variable Cost" in titles
        assert job["roadmap"]
        started = service.start_learning(job["job_id"])
        assert started["tutor_session"]["roadmap"]
        assert started["tutor_session"]["current_note_path"].startswith(f"SourceJobs/{job['job_id']}/")


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_arbitrary_ml_docs())
def test_arbitrary_pdf_without_objectives_builds_complete_grounded_roadmap(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        source = root / "ml-foundations.pdf"
        source.write_bytes(b"ml fake pdf bytes")

        service = SourceLearningJobService(root / "ater_queue.db")
        job = service.create_or_resume_from_path(str(source))
        titles = [node["title"] for node in job["concept_graph"]["nodes"]]

        assert job["topic"] == "Machine Learning Foundations"
        assert job["domain"] == "CS-AI"
        assert "Supervised Learning" in titles
        assert "Training Data" in titles
        assert "Loss Function" in titles
        assert "Gradient Descent" in titles
        assert "Overfitting" in titles
        assert "Evaluation Metrics" in titles
        assert all(node["source_pages"] for node in job["concept_graph"]["nodes"])
        assert not any("Consumer" in title or "Budget Line" in title for title in titles)
        assert len(job["roadmap"]) == len(job["concept_graph"]["nodes"])


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_production_cost_slide_docs())
def test_slide_pdf_uses_headings_and_labels_for_complete_production_cost_roadmap(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        source = root / "Chapter 4 2025.6. student.pdf"
        source.write_bytes(b"production cost fake pdf bytes")

        service = SourceLearningJobService(root / "ater_queue.db")
        job = service.create_or_resume_from_path(str(source))
        titles = [node["title"] for node in job["concept_graph"]["nodes"]]

        assert job["topic"] == "The Theory of Production and Cost"
        assert job["domain"] == "ECON-MICRO"
        assert "Production" in titles
        assert "Production Function" in titles
        assert "Fixed Inputs" in titles
        assert "Variable Inputs" in titles
        assert "Total, Average, And Marginal Product" in titles
        assert "Law Of Variable Proportions" in titles
        assert "Social Cost" in titles
        assert "Private Cost" in titles
        assert "Average Fixed Cost (Afc)" in titles
        assert "Average Variable Cost (Avc)" in titles
        assert "Average Total Cost (Atc Or Ac)" in titles
        assert "Marginal Cost (Mc)" in titles
        assert "Relationship Between Avc, Atc And Mc" in titles
        assert not any(title in {"Utility", "Budget Line", "Given As", "Example 1"} for title in titles)
        assert len(titles) >= 24
        assert all(node["source_pages"] for node in job["concept_graph"]["nodes"])


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_production_cost_slide_docs())
def test_stale_source_job_cache_rebuilds_after_pipeline_version_change(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        source = root / "Chapter 4 2025.6. student.pdf"
        source.write_bytes(b"production cost fake pdf bytes")
        service = SourceLearningJobService(root / "ater_queue.db")
        identity, digest, file_size = service._source_identity(source)
        stale_job_id = "srcjob_stale"
        now = "2026-07-03T00:00:00"
        conn = sqlite3.connect(root / "ater_queue.db")
        try:
            with conn:
                conn.execute(
                    "INSERT INTO source_learning_jobs (job_id, source_identity, file_path, file_name, file_size, content_hash, title, topic, domain, source_type, page_count, status, created_at, updated_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (stale_job_id, identity, str(source), source.name, file_size, digest, "Chapter Four", "Chapter Four The Theory of Production and Cost", "ECON-MICRO", "pdf", 54, "roadmap_ready", now, now, '{"next_action":"start_learning"}'),
                )
                conn.execute("INSERT INTO source_pages VALUES (?, ?, ?, ?)", (stale_job_id, 1, "old page", 8))
                conn.execute("INSERT INTO concept_graph_nodes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", ("stale_1", stale_job_id, "Utility", "ECON-MICRO", "Qualitative/Definitional", "[2]", "[]", "[]", 1, "[]"))
                conn.execute("INSERT INTO concept_graph_nodes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", ("stale_2", stale_job_id, "Budget Line", "ECON-MICRO", "Quantitative", "[26]", "[]", "[]", 2, "[]"))
        finally:
            conn.close()

        rebuilt = service.create_or_resume_from_path(str(source))
        titles = [node["title"] for node in rebuilt["concept_graph"]["nodes"]]

        assert rebuilt["job_id"] != stale_job_id
        assert "Production Function" in titles
        assert "Average Fixed Cost (Afc)" in titles
        assert "Utility" not in titles
        assert "Budget Line" not in titles


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_source_job_api_lifecycle_warning_resume_and_attachment_promotion(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        inbox = root / "Inbox"
        inbox.mkdir()
        pdf = inbox / "Chapter 3 2024-1.pdf"
        pdf.write_bytes(b"fake pdf bytes")
        secrets = AppSecrets(vault_path=str(root), inbox_path=str(inbox), ai_key=None)
        app.dependency_overrides[get_app_secrets] = lambda: secrets
        try:
            client = TestClient(app)
            created = client.post("/api/ater/source/jobs", json={"file_path": str(pdf), "conversation_id": "conv_api"})
            assert created.status_code == 200
            job = created.json()
            assert job["job_id"].startswith("srcjob_")
            assert job["warnings"]
            resumed = client.post("/api/ater/source/jobs", json={"file_path": str(pdf)}).json()
            assert resumed["job_id"] == job["job_id"]
            status = client.get(f"/api/ater/source/jobs/{job['job_id']}").json()
            assert status["audit"]["page_count"] == 48
            started = client.post(f"/api/ater/source/jobs/{job['job_id']}/start").json()
            assert started["tutor_session"]["source_job_id"] == job["job_id"]
            assert started["deployment"]["status"] == "deployed"
            assert started["tutor_session"]["current_note_path"].startswith(f"SourceJobs/{job['job_id']}/")
            assert (root / started["tutor_session"]["current_note_path"]).exists()
            deployed = client.post(f"/api/ater/source/jobs/{job['job_id']}/deploy").json()
            assert deployed["status"] == "deployed"

            storage = ChatStorage(inbox / "ater_queue.db")
            storage.create_conversation("Source", conv_id="conv_api")
            attachment = storage.create_attachment("conv_api", pdf.name, str(pdf), "pdf", "extracted", [])
            promoted = client.post("/api/ater/source/jobs", json={"attachment_id": attachment["id"]}).json()
            assert promoted["job_id"] == job["job_id"]
        finally:
            app.dependency_overrides.pop(get_app_secrets, None)


def test_compiler_ai_validation_repair_and_prompt_bounds():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Quantitative")
    job = {"job_id": "srcjob_test", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_1",
        "title": "Budget Line",
        "domain": "ECON-MICRO",
        "modality": "Quantitative",
        "source_pages": [8],
        "source_excerpts": [{"page": 8, "text": "The budget line shows affordable bundles given income and prices."}],
        "warnings": [],
    }
    prompt = compiler.build_ai_prompt(job, node, profile)
    assert "deployment paths" in prompt["system"]
    assert prompt["user"]["valid_source_pages"] == [8]
    repaired = compiler.compile_note(job, node, profile, ai_generator=lambda _prompt: "system prompt\n```python\nprint('bad')\n``` [PAGE 999]")
    assert repaired["fallback"] is True
    assert "invalid_citation" in repaired["validation_errors"]
    failed = compiler.compile_note(job, node, profile, ai_generator=lambda _prompt: (_ for _ in ()).throw(RuntimeError("rate limit")))
    assert failed["fallback"] is True
    assert failed["frontmatter"]["fallback_reason"] == "ai_failure"


def test_strict_ai_note_count_validation_falls_back_instead_of_failing():
    compiler = SourceAtomicNoteCompiler()
    profile = build_teaching_profile("ECON-MICRO", "Conceptual")
    job = {"job_id": "srcjob_test", "file_name": "Chapter 3 2024-1.pdf"}
    node = {
        "id": "concept_1",
        "title": "Consumer Preferences",
        "domain": "ECON-MICRO",
        "modality": "Conceptual",
        "source_pages": [4, 6],
        "source_excerpts": [
            {"page": 4, "text": "A consumption bundle is a complete list of goods and services."},
            {"page": 6, "text": "Consumers rank bundles using preference relations."},
        ],
        "warnings": [],
    }
    invalid_count_note = """
## Mental Model
Consumers choose between bundles.

## Only One Teaching Heading
This intentionally violates the three-heading teaching contract.

## The Proving Grounds
```interactive-quiz
[]
```
"""

    note = compiler.compile_note(job, node, profile, ai_generator=lambda _prompt: invalid_count_note, strict_ai=True)

    assert note["fallback"] is True
    assert "invalid_teaching_heading_count" in note["validation_errors"]
    assert "invalid_quiz_count" in note["validation_errors"]
    assert note["frontmatter"]["fallback_reason"]
    assert note["content"].count("\n## ") >= 4
    assert "## The Proving Grounds" in note["content"]


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_vault_deployment_idempotency_frontmatter_links_and_user_collision(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        source = root / "Chapter 3 2024-1.pdf"
        source.write_bytes(b"fake pdf bytes")
        db_path = root / "ater_queue.db"
        service = SourceLearningJobService(db_path)
        job = service.create_or_resume_from_path(str(source))
        first = service.deploy_to_vault(job["job_id"], str(root))
        second = service.deploy_to_vault(job["job_id"], str(root))
        assert first["status"] == "deployed"
        assert second["status"] == "deployed"
        note_paths = [p for p in first["written_files"] if p.endswith(".md") and "Hub" not in p and "Chapter_" not in p]
        note_content = (root / note_paths[0]).read_text(encoding="utf-8")
        assert f'source_job_id: "{job["job_id"]}"' in note_content
        assert "source_pages:" in note_content
        assert any("Hub.md" in p for p in first["written_files"])

        collision_path = root / note_paths[0]
        collision_path.write_text(collision_path.read_text(encoding="utf-8").replace(f'source_job_id: "{job["job_id"]}"', f'source_job_id: {job["job_id"]}').replace('generated_by: "ater_source_job"', 'generated_by: ater_source_job'), encoding="utf-8")
        unquoted_metadata = service.deploy_to_vault(job["job_id"], str(root))
        assert unquoted_metadata["status"] == "deployed"

        collision_path.write_text("# User-authored note\nNo source metadata.", encoding="utf-8")
        collision = service.deploy_to_vault(job["job_id"], str(root))
        assert collision["status"] == "review_required"
        assert collision["collisions"][0]["path"] == note_paths[0]


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_chat_attachment_promotion_creates_source_job(_mock_pdf):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        inbox = root / "Inbox"
        inbox.mkdir()
        pdf = inbox / "Chapter 3 2024-1.pdf"
        pdf.write_bytes(b"fake pdf bytes")
        storage = ChatStorage(root / "ater_queue.db")
        storage.create_conversation("Source", conv_id="conv_1")
        attachment = storage.create_attachment("conv_1", pdf.name, str(pdf), "pdf", "extracted", [])
        manager = AttachmentManager(storage, vault_path=str(root), inbox_path=str(inbox))
        promoted = manager.promote_to_source_grounded_curriculum(attachment["id"])
    assert promoted["job_id"].startswith("srcjob_")
    assert promoted["current_tutor_link"] is None
    assert promoted["audit"]["page_count"] == 48
