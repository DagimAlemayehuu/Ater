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

def test_compact_cli_error_empty():
    assert NotebookLMRunner.compact_cli_error(None) == ""
    assert NotebookLMRunner.compact_cli_error("   ") == ""

def test_compact_cli_error_connect_error():
    assert NotebookLMRunner.compact_cli_error("ConnectError: connection refused") == "ConnectError: connection refused"
    assert NotebookLMRunner.compact_cli_error("Some output\nConnectError: timed out\nMore output") == "ConnectError: timed out"


def test_get_nlm_binary_which(monkeypatch):
    import shutil
    monkeypatch.setattr(shutil, "which", lambda cmd: "/usr/bin/nlm")
    assert NotebookLMRunner.get_nlm_binary() == "/usr/bin/nlm"

def test_get_nlm_binary_fallback_local(monkeypatch):
    import shutil
    import sys
    from pathlib import Path

    monkeypatch.setattr(shutil, "which", lambda cmd: None)

    def mock_exists(self):
        return True

    monkeypatch.setattr(Path, "exists", mock_exists)

    local_nlm = str(Path(sys.executable).parent / "nlm")
    assert NotebookLMRunner.get_nlm_binary() == local_nlm

def test_get_nlm_binary_last_fallback(monkeypatch):
    import shutil
    from pathlib import Path

    monkeypatch.setattr(shutil, "which", lambda cmd: None)

    def mock_exists(self):
        return False

    monkeypatch.setattr(Path, "exists", mock_exists)
    assert NotebookLMRunner.get_nlm_binary() == "nlm"



@pytest.mark.asyncio
async def test_run_command_success_raw(monkeypatch):
    class FakeProcess:
        returncode = 0
        async def communicate(self):
            return b"success output", b""

    async def mock_exec(*args, **kwargs):
        return FakeProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", mock_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", lambda: "nlm")

    result = await NotebookLMRunner.run_command(["arg1"])
    assert result == "success output"

@pytest.mark.asyncio
async def test_run_command_success_json(monkeypatch):
    class FakeProcess:
        returncode = 0
        async def communicate(self):
            return b'{"key": "value"}', b""

    async def mock_exec(*args, **kwargs):
        return FakeProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", mock_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", lambda: "nlm")

    result = await NotebookLMRunner.run_command(["arg1"], parse_json=True)
    assert result == {"key": "value"}

@pytest.mark.asyncio
async def test_run_command_failure_nonzero(monkeypatch):
    class FakeProcess:
        returncode = 1
        async def communicate(self):
            return b"", b"error occurred"

    async def mock_exec(*args, **kwargs):
        return FakeProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", mock_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", lambda: "nlm")

    with pytest.raises(NotebookLMException, match="NotebookLM Command Failed: error occurred"):
        await NotebookLMRunner.run_command(["arg1"])

@pytest.mark.asyncio
async def test_run_command_failure_json_decode(monkeypatch):
    class FakeProcess:
        returncode = 0
        async def communicate(self):
            return b"not json", b""

    async def mock_exec(*args, **kwargs):
        return FakeProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", mock_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", lambda: "nlm")

    with pytest.raises(NotebookLMException, match="Invalid JSON response from CLI"):
        await NotebookLMRunner.run_command(["arg1"], parse_json=True)

@pytest.mark.asyncio
async def test_run_command_unexpected_error(monkeypatch):
    async def mock_exec(*args, **kwargs):
        raise ValueError("unexpected")

    monkeypatch.setattr(asyncio, "create_subprocess_exec", mock_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", lambda: "nlm")

    with pytest.raises(NotebookLMException, match="Execution Error: unexpected"):
        await NotebookLMRunner.run_command(["arg1"])


def test_studio_create_args_missing_artifact_type():
    with pytest.raises(ValueError, match="artifact_type is required"):
        NotebookLMRunner.build_studio_create_args("nb-1", {})

def test_studio_create_args_audio():
    args = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "audio",
        "audio_format": "mp3",
        "audio_length": "long"
    })
    assert args == ["audio", "create", "nb-1", "--confirm", "--format", "mp3", "--length", "long"]

def test_studio_create_args_report():
    args = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "report",
        "report_format": "pdf",
        "custom_prompt": "summary"
    })
    assert args == ["report", "create", "nb-1", "--confirm", "--format", "pdf", "--prompt", "summary"]

    args2 = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "report",
        "prompt": "summary2"
    })
    assert args2 == ["report", "create", "nb-1", "--confirm", "--prompt", "summary2"]

def test_studio_create_args_quiz():
    args = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "quiz",
        "question_count": 5,
        "difficulty": "hard"
    })
    assert args == ["quiz", "create", "nb-1", "--confirm", "--count", "5", "--difficulty", "hard"]

def test_studio_create_args_flashcards():
    args = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "flashcards",
        "difficulty": "easy"
    })
    assert args == ["flashcards", "create", "nb-1", "--confirm", "--difficulty", "easy"]

def test_studio_create_args_mindmap():
    args = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "mindmap",
        "title": "concept",
        "source_ids": ["src1"]
    })
    assert args == ["mindmap", "create", "nb-1", "--confirm", "--title", "concept", "--source-ids", "src1"]

def test_studio_create_args_infographic():
    args = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "infographic",
        "orientation": "portrait",
        "detail_level": "high",
        "infographic_style": "modern"
    })
    assert args == ["infographic", "create", "nb-1", "--confirm", "--orientation", "portrait", "--detail", "high", "--style", "modern"]

def test_studio_create_args_data_table_success():
    args = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "data-table",
        "description": "table stats"
    })
    assert args == ["data-table", "create", "nb-1", "--confirm", "table stats"]

def test_studio_create_args_default():
    args = NotebookLMRunner.build_studio_create_args("nb-1", {
        "artifact_type": "unknown",
        "language": "es"
    })
    assert args == ["unknown", "create", "nb-1", "--confirm", "--language", "es"]


def test_classify_auth_error_stale():
    error = Exception("unauthorized request")
    status = NotebookLMRunner.classify_auth_error(error)
    assert status["auth_status"] == "stale"
    assert status["error"] == "NotebookLM authentication is stale. Reconnect your Google account."

def test_classify_auth_error_not_configured_missing():
    error = Exception("no such file or directory: nlm")
    status = NotebookLMRunner.classify_auth_error(error)
    assert status["auth_status"] == "not_configured"
    assert status["error"] == "The nlm CLI is not available in the sidecar environment."

def test_classify_auth_error_not_configured_unrecognized():
    error = Exception("something weird happened")
    status = NotebookLMRunner.classify_auth_error(error)
    assert status["auth_status"] == "not_configured"
    assert status["error"] == "something weird happened"

def test_classify_auth_error_empty_message():
    error = Exception("")
    status = NotebookLMRunner.classify_auth_error(error)
    assert status["auth_status"] == "not_configured"
    assert status["error"] == "NotebookLM authentication could not be checked."

def test_parse_auth_status_text_no_prefix():
    text = "logged in\nusing profile: secondary\nuser: test@example.com"
    status = NotebookLMRunner.parse_auth_status_text(text)
    assert status["auth_status"] == "configured"
    assert status["profile"] == "secondary"
    assert status["email"] == "test@example.com"

def test_parse_auth_status_text_stale():
    text = "authentication required"
    status = NotebookLMRunner.parse_auth_status_text(text)
    assert status["auth_status"] == "stale"
    assert status["profile"] == "default"
    assert status["email"] == "default"


@pytest.mark.asyncio
async def test_get_auth_status_cached(monkeypatch):
    import time

    # Pre-populate cache
    monkeypatch.setattr(NotebookLMRunner, "_auth_status_cache", {
        "auth_status": "configured",
        "email": "cached@example.com",
        "profile": "default",
        "notebooks_found": 10,
    })
    monkeypatch.setattr(NotebookLMRunner, "_auth_status_cache_at", time.monotonic())

    # Ensure run_command is not called
    async def mock_run(*args, **kwargs):
        raise ValueError("should not be called")

    monkeypatch.setattr(NotebookLMRunner, "run_command", mock_run)

    status = await NotebookLMRunner.get_auth_status(force=False)
    assert status["auth_status"] == "configured"
    assert status["email"] == "cached@example.com"
    assert status["cached"] is True

@pytest.mark.asyncio
async def test_start_login_failure(monkeypatch):
    async def mock_exec(*args, **kwargs):
        raise Exception("browser error")

    monkeypatch.setattr(asyncio, "create_subprocess_exec", mock_exec)
    monkeypatch.setattr(NotebookLMRunner, "get_nlm_binary", lambda: "nlm")

    with pytest.raises(NotebookLMException, match="Failed to trigger login browser: browser error"):
        await NotebookLMRunner.start_login()
