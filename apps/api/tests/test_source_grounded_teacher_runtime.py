import tempfile
import sqlite3
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
)
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


def test_golden_pdf_extraction_audit_when_fixture_available():
    pdf_path = _chapter_pdf()
    if not pdf_path.exists():
        return
    with tempfile.TemporaryDirectory() as tmp:
        service = SourceLearningJobService(Path(tmp) / "ater_queue.db")
        job = service.create_or_resume_from_path(str(pdf_path))
    assert job["audit"]["page_count"] == 48
    assert job["title"] == "Chapter 3"
    assert job["topic"] == "Theory of Consumer Behavior"
    assert job["domain"] == "ECON-MICRO"
    assert "explain consumer preferences and utility" in " ".join(obj["text"].lower() for obj in job["source_map"]["objectives"])


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_source_job_builds_objectives_concept_graph_profiles_and_coverage(_mock_pdf):
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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


@patch("src.domains.ater.source_service.load_pdf_robust", return_value=_fake_docs())
def test_vault_deployment_idempotency_frontmatter_links_and_user_collision(_mock_pdf):
    with tempfile.TemporaryDirectory() as tmp:
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
    with tempfile.TemporaryDirectory() as tmp:
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
