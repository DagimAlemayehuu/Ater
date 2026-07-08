import pytest
import os
import numpy as np
from fastapi import HTTPException
from src.api.deps import AppSecrets, sanitize_api_key, get_app_secrets
from src.domains.ater.embeddings_linker import EmbeddingsLinker

async def _call_get_app_secrets(**kwargs):
    """Helper to bypass FastAPI Header defaults and pass real values."""
    defaults = {
        "x_ater_token": None,
        "x_ai_provider": "google",
        "x_ai_key": None,
        "x_ai_model": "gemini-2.0-flash",
        "x_ai_base_url": None,
        "x_ai_max_tpm": None,
        "x_ai_max_rpm": None,
        "x_ai_max_tpd": None,
        "x_ai_max_rpd": None,
        "x_ai_max_concurrency": None,
        "x_planner_provider": None,
        "x_planner_key": None,
        "x_planner_model": None,
        "x_utility_provider": None,
        "x_utility_key": None,
        "x_utility_model": None,
        "x_vault_path": None,
        "x_inbox_path": None,
        "x_academic_path": "Notes",
        "x_auto_deploy": "false",
        "x_google_calendar_token": None,
    }
    defaults.update(kwargs)
    return await get_app_secrets(**defaults)

@pytest.mark.asyncio
async def test_strict_token_validation_no_env(monkeypatch):
    """Verify 500 error if ATER_SIDECAR_TOKEN is not set."""
    monkeypatch.delenv("ATER_SIDECAR_TOKEN", raising=False)

    with pytest.raises(HTTPException) as exc_info:
        await _call_get_app_secrets(x_ater_token="any")
    assert exc_info.value.status_code == 500
    assert "Sidecar security token not configured" in exc_info.value.detail

@pytest.mark.asyncio
async def test_strict_token_validation_invalid_token(monkeypatch):
    """Verify 403 error if token is incorrect."""
    monkeypatch.setenv("ATER_SIDECAR_TOKEN", "secret-token")

    with pytest.raises(HTTPException) as exc_info:
        await _call_get_app_secrets(x_ater_token="wrong-token")
    assert exc_info.value.status_code == 403
    assert "Invalid sidecar authentication token" in exc_info.value.detail

@pytest.mark.asyncio
async def test_strict_token_validation_success(monkeypatch):
    """Verify success if token is correct."""
    monkeypatch.setenv("ATER_SIDECAR_TOKEN", "secret-token")

    secrets = await _call_get_app_secrets(x_ater_token="secret-token")
    assert secrets is not None

def test_embeddings_linker_robustness_missing_model(monkeypatch):
    """Verify that EmbeddingsLinker returns zeros if model loading fails."""
    # Force failure by setting a non-existent model dir and disabling common paths
    monkeypatch.setenv("ATER_ONNX_MODEL_DIR", "/non/existent/path")

    # We need to mock _get_model_paths to return a non-existent path reliably
    from pathlib import Path
    monkeypatch.setattr(EmbeddingsLinker, "_get_model_paths", lambda: (Path("/non/existent"), Path("/non/existent/model.onnx")))

    linker = EmbeddingsLinker()
    # Reset internal state to ensure it tries to load
    EmbeddingsLinker._session = None
    EmbeddingsLinker._tokenizer = None
    EmbeddingsLinker._load_failed = False

    embeddings = linker.get_embeddings(["test text"])
    assert embeddings.shape == (1, 384)
    assert np.all(embeddings == 0)
    assert EmbeddingsLinker._load_failed is True

def test_embeddings_linker_persistence_of_failure(monkeypatch):
    """Verify that EmbeddingsLinker doesn't keep retrying if load_failed is True."""
    EmbeddingsLinker._load_failed = True

    linker = EmbeddingsLinker()
    embeddings = linker.get_embeddings(["test text"])
    assert embeddings.shape == (1, 384)
    assert np.all(embeddings == 0)
