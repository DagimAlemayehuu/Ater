import asyncio

import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.domains.notebooklm.runner import NotebookLMRunner, NotebookLMException


@pytest.mark.asyncio
async def test_auth_status_uses_supported_login_check(monkeypatch):
    calls = []

    async def fake_run_command(args, parse_json=False):
        calls.append((args, parse_json))
        assert args == ["login", "--check"]
        assert parse_json is False
        return "\n".join(
            [
                "Checking credentials for profile: default...",
                "Authentication valid!",
                "Profile: default",
                "Notebooks found: 19",
                "Account: learner@example.com",
            ]
        )

    monkeypatch.setattr(NotebookLMRunner, "run_command", fake_run_command)
    NotebookLMRunner.clear_auth_status_cache()

    status = await NotebookLMRunner.get_auth_status()

    assert status == {
        "auth_status": "configured",
        "email": "learner@example.com",
        "profile": "default",
        "notebooks_found": 19,
        "cached": False,
    }
    assert calls == [(["login", "--check"], False)]


@pytest.mark.asyncio
async def test_start_login_forces_browser_flow(monkeypatch):
    created = {}

    class FakeProcess:
        pid = 4242

    async def fake_create_subprocess_exec(*cmd, **kwargs):
        created["cmd"] = list(cmd)
        return FakeProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", classmethod(lambda cls: "nlm"))

    message = await NotebookLMRunner.start_login(force=True)

    assert created["cmd"] == ["nlm", "login", "--force"]
    assert "PID: 4242" in message


@pytest.mark.asyncio
async def test_start_login_can_clear_browser_profile(monkeypatch):
    created = {}

    class FakeProcess:
        pid = 4343

    async def fake_create_subprocess_exec(*cmd, **kwargs):
        created["cmd"] = list(cmd)
        return FakeProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", classmethod(lambda cls: "nlm"))

    await NotebookLMRunner.start_login(force=True, clear=True)

    assert created["cmd"] == ["nlm", "login", "--force", "--clear"]


def test_artifact_type_normalization_matches_nlm_commands():
    assert NotebookLMRunner.normalize_artifact_type("mind_map") == "mindmap"
    assert NotebookLMRunner.normalize_artifact_type("slide_deck") == "slides"
    assert NotebookLMRunner.normalize_artifact_type("data_table") == "data-table"
    assert NotebookLMRunner.normalize_artifact_type("audio") == "audio"


def test_studio_create_args_include_all_common_options():
    args = NotebookLMRunner.build_studio_create_args(
        "nb-1",
        {
            "artifact_type": "slide_deck",
            "slide_format": "presenter_slides",
            "slide_length": "short",
            "language": "en-US",
            "focus_prompt": "exam prep",
            "source_ids": ["src-1", "src-2"],
        },
    )

    assert args == [
        "slides",
        "create",
        "nb-1",
        "--confirm",
        "--format",
        "presenter_slides",
        "--length",
        "short",
        "--language",
        "en-US",
        "--focus",
        "exam prep",
        "--source-ids",
        "src-1,src-2",
    ]


def test_studio_create_args_cover_video_options():
    args = NotebookLMRunner.build_studio_create_args(
        "nb-1",
        {
            "artifact_type": "video",
            "video_format": "cinematic",
            "video_style": "custom",
            "video_style_prompt": "calm monochrome explainer",
            "language": "en",
            "source_ids": "src-1",
        },
    )

    assert args == [
        "video",
        "create",
        "nb-1",
        "--confirm",
        "--format",
        "cinematic",
        "--style",
        "custom",
        "--style-prompt",
        "calm monochrome explainer",
        "--language",
        "en",
        "--source-ids",
        "src-1",
    ]


def test_studio_create_args_require_data_table_description():
    with pytest.raises(ValueError, match="description is required"):
        NotebookLMRunner.build_studio_create_args("nb-1", {"artifact_type": "data-table"})


def test_download_args_match_nlm_download_surface(tmp_path):
    output_path = tmp_path / "deck.pdf"

    args = NotebookLMRunner.build_download_args(
        "slide_deck",
        "nb-1",
        output_path,
        artifact_id="artifact-1",
        output_format="pdf",
    )

    assert args == [
        "download",
        "slide-deck",
        "nb-1",
        "--output",
        str(output_path),
        "--id",
        "artifact-1",
        "--format",
        "pdf",
        "--no-progress",
    ]


def test_cli_error_compaction_keeps_actionable_line():
    noisy = """
    ╭─ Error ─────────────────────────────────────────────────────────────╮
    │ No such option: --json                                               │
    ╰──────────────────────────────────────────────────────────────────────╯
    """

    assert NotebookLMRunner.compact_cli_error(noisy) == "No such option: --json"


@pytest.mark.asyncio
async def test_auth_status_reports_network_failure_as_unverified(monkeypatch):
    async def fake_run_command(args, parse_json=False):
        raise RuntimeError("ConnectError: [Errno 8] nodename nor servname provided, or not known")

    monkeypatch.setattr(NotebookLMRunner, "run_command", fake_run_command)
    NotebookLMRunner.clear_auth_status_cache()

    status = await NotebookLMRunner.get_auth_status(force=True)

    assert status["auth_status"] == "unverified"
    assert "NotebookLM could not be reached" in status["error"]


def test_auth_login_endpoint_forwards_force_and_clear(monkeypatch):
    received = {}

    async def fake_start_login(force=True, clear=False):
        received["force"] = force
        received["clear"] = clear
        return "Spawning browser login (PID: 99)"

    monkeypatch.setattr(NotebookLMRunner, "start_login", fake_start_login)

    response = TestClient(app).post("/api/notebooklm/auth/login?force=true&clear=true")

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert received == {"force": True, "clear": True}


def test_auth_status_endpoint_can_bypass_cache(monkeypatch):
    received = {}

    async def fake_get_auth_status(force=False):
        received["force"] = force
        return {"auth_status": "configured", "email": "learner@example.com"}

    monkeypatch.setattr(NotebookLMRunner, "get_auth_status", fake_get_auth_status)

    response = TestClient(app).get("/api/notebooklm/auth/status?force=true")

    assert response.status_code == 200
    assert response.json()["auth_status"] == "configured"
    assert received == {"force": True}


def test_notebooklm_exception_can_be_instantiated():
    exc = NotebookLMException("Something went wrong")
    assert isinstance(exc, Exception)
    assert str(exc) == "Something went wrong"


@pytest.mark.asyncio
async def test_notebooklm_runner_command_failed_raises_exception(monkeypatch):
    class FakeProcess:
        returncode = 1

        async def communicate(self):
            return b"", b"Error processing request"

    async def fake_create_subprocess_exec(*args, **kwargs):
        return FakeProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", classmethod(lambda cls: "nlm"))

    with pytest.raises(NotebookLMException, match="NotebookLM Command Failed: Error processing request"):
        await NotebookLMRunner.run_command(["some", "command"])


@pytest.mark.asyncio
async def test_notebooklm_runner_invalid_json_raises_exception(monkeypatch):
    class FakeProcess:
        returncode = 0

        async def communicate(self):
            return b"invalid json", b""

    async def fake_create_subprocess_exec(*args, **kwargs):
        return FakeProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", classmethod(lambda cls: "nlm"))

    with pytest.raises(NotebookLMException, match="Invalid JSON response from CLI:"):
        await NotebookLMRunner.run_command(["some", "command"], parse_json=True)


@pytest.mark.asyncio
async def test_notebooklm_runner_start_login_raises_exception(monkeypatch):
    async def fake_create_subprocess_exec(*args, **kwargs):
        raise RuntimeError("Something failed")

    monkeypatch.setattr(asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", classmethod(lambda cls: "nlm"))

    with pytest.raises(NotebookLMException, match="Failed to trigger login browser: Something failed"):
        await NotebookLMRunner.start_login()
