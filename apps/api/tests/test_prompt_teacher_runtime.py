import asyncio
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient

from src.api.deps import AppSecrets, get_app_secrets
from src.api.main import app
from src.domains.ater.prompt_teacher_service import (
    PromptTeacherJobService,
    classify_prompt_learning_intent,
)
from src.domains.ater.tutor_service import TutorSessionManager


def test_prompt_teacher_job_creation_resume_diagnostic_and_clarification():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        service = PromptTeacherJobService(root / "Inbox" / "ater_queue.db", vault_path=root)
        job = service.create_or_resume("Teach me consumer behavior for an exam next Friday", conversation_id="conv_1")
        resumed = service.create_or_resume("Teach me consumer behavior for an exam next Friday", conversation_id="conv_1")
        ambiguous = service.create_or_resume("teach me it", conversation_id="conv_1")

    assert resumed["job_id"] == job["job_id"]
    assert job["prompt_teacher"]["diagnostic_intake"]["target"] == "exam"
    assert job["prompt_teacher"]["diagnostic_intake"]["timeframe"]
    assert job["prompt_teacher"]["assumptions"]
    assert job["status"] == "roadmap_ready"
    assert ambiguous["status"] == "awaiting_clarification"
    assert ambiguous["prompt_teacher"]["clarification_question"]


def test_synthetic_source_pack_prefers_local_vault_and_exposes_confidence():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        note = root / "database" / "Microeconomics" / "Consumer_Behavior.md"
        note.parent.mkdir(parents=True)
        note.write_text("# Consumer Behavior\nBudget line and utility notes from class.", encoding="utf-8")
        service = PromptTeacherJobService(root / "Inbox" / "ater_queue.db", vault_path=root)
        job = service.create_or_resume("Teach me consumer behavior")

    pack = job["prompt_teacher"]["synthetic_source_pack"]
    assert pack["topic"] == "Consumer Behavior"
    assert any(item["type"] == "local_vault_note" for item in pack["provenance"])
    assert pack["confidence"] >= 0.7
    assert job["source_type"] == "synthetic_source_pack"
    assert any("synthetic" in warning["description"].lower() for warning in job["warnings"])
    assert all(node["source_pages"] for node in job["concept_graph"]["nodes"])


def test_prompt_graph_profiles_weak_fallback_and_tutor_reuse():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        service = PromptTeacherJobService(root / "Inbox" / "ater_queue.db", vault_path=root)
        job = service.create_or_resume("Teach me consumer behavior")
        started = service.start_learning(job["job_id"])
        session_id = started["tutor_session"]["session_id"]
        node_id = started["tutor_session"]["current_concept_node_id"]
        manager = TutorSessionManager(root / "Inbox" / "ater_queue.db", root)
        asyncio.run(manager.submit_answer(session_id, "q1", False, "high", "central banking"))
        service.update_coverage_for_answer(job["job_id"], node_id, correct=True, transfer_passed=True)
        updated = service.get_job(job["job_id"])

    first_node = job["concept_graph"]["nodes"][0]
    assert all(node["domain"] == "ECON-MICRO" for node in job["concept_graph"]["nodes"])
    assert all(node["source_pages"] for node in job["concept_graph"]["nodes"])
    assert first_node["teaching_profile"]["persona"]
    assert started["tutor_session"]["source_job_id"] == job["job_id"]
    concept_row = next(row for row in updated["coverage"]["rows"] if row.get("concept_node_id") == node_id)
    assert concept_row["practice_scheduled"] == 1


def test_prompt_teacher_api_lifecycle_and_quick_explanation_classifier():
    assert classify_prompt_learning_intent("what is consumer surplus?")["intent"] == "quick_explanation"
    assert classify_prompt_learning_intent("help me master consumer behavior")["intent"] == "teacher_job"

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        root = Path(tmp)
        inbox = root / "Inbox"
        inbox.mkdir()
        secrets = AppSecrets(vault_path=str(root), inbox_path=str(inbox), ai_key=None)
        app.dependency_overrides[get_app_secrets] = lambda: secrets
        try:
            client = TestClient(app)
            created = client.post("/api/ater/prompt/jobs", json={"prompt": "Teach me consumer behavior", "conversation_id": "conv_api"})
            assert created.status_code == 200
            job = created.json()
            status = client.get(f"/api/ater/prompt/jobs/{job['job_id']}").json()
            started = client.post(f"/api/ater/prompt/jobs/{job['job_id']}/start").json()
            resumed = client.post("/api/ater/prompt/jobs", json={"prompt": "Teach me consumer behavior"}).json()

            assert job["job_id"].startswith("promptjob_")
            assert status["prompt_teacher"]["synthetic_source_pack"]
            assert started["tutor_session"]["source_job_id"] == job["job_id"]
            assert resumed["job_id"] == job["job_id"]
        finally:
            app.dependency_overrides.pop(get_app_secrets, None)
