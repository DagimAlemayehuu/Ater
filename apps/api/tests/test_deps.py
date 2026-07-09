import pytest
from fastapi import HTTPException
from src.api.deps import AppSecrets, sanitize_api_key, get_app_secrets

def test_app_secrets_defaults():
    """Verify the default values of AppSecrets."""
    secrets = AppSecrets()
    assert secrets.ai_provider == "google"
    assert secrets.ai_key is None
    assert secrets.ai_model == "gemini-2.0-flash"
    assert secrets.ai_base_url is None
    assert secrets.ai_max_tpm is None
    assert secrets.ai_max_rpm is None
    assert secrets.ai_max_tpd is None
    assert secrets.ai_max_rpd is None
    assert secrets.ai_max_concurrency is None

    assert secrets.planner_provider == "google"
    assert secrets.planner_key is None
    assert secrets.planner_model == "gemini-2.0-flash"

    assert secrets.utility_provider == "google"
    assert secrets.utility_key is None
    assert secrets.utility_model == "gemini-1.5-flash-8b"

    assert secrets.vault_path is None
    assert secrets.inbox_path is None
    assert secrets.academic_path == "Notes"
    assert secrets.auto_deploy is False
    assert secrets.google_calendar_token is None

def test_app_secrets_initialization():
    """Verify initialization of AppSecrets with specific values."""
    secrets = AppSecrets(
        ai_provider="openai",
        ai_key="test-key",
        ai_model="gpt-4",
        ai_base_url="https://api.openai.com",
        ai_max_tpm=1000,
        ai_max_rpm=100,
        ai_max_tpd=10000,
        ai_max_rpd=1000,
        ai_max_concurrency=10,
        planner_provider="openai",
        planner_key="planner-key",
        planner_model="gpt-4o",
        utility_provider="openai",
        utility_key="utility-key",
        utility_model="gpt-4o-mini",
        vault_path="/tmp/vault",
        inbox_path="/tmp/inbox",
        academic_path="Academics",
        auto_deploy=True,
        google_calendar_token="cal-token"
    )

    assert secrets.ai_provider == "openai"
    assert secrets.ai_key == "test-key"
    assert secrets.ai_model == "gpt-4"
    assert secrets.ai_base_url == "https://api.openai.com"
    assert secrets.ai_max_tpm == 1000
    assert secrets.ai_max_rpm == 100
    assert secrets.ai_max_tpd == 10000
    assert secrets.ai_max_rpd == 1000
    assert secrets.ai_max_concurrency == 10

    assert secrets.planner_provider == "openai"
    assert secrets.planner_key == "planner-key"
    assert secrets.planner_model == "gpt-4o"

    assert secrets.utility_provider == "openai"
    assert secrets.utility_key == "utility-key"
    assert secrets.utility_model == "gpt-4o-mini"

    assert secrets.vault_path == "/tmp/vault"
    assert secrets.inbox_path == "/tmp/inbox"
    assert secrets.academic_path == "Academics"
    assert secrets.auto_deploy is True
    assert secrets.google_calendar_token == "cal-token"


def test_sanitize_api_key_none():
    """Verify that None and empty strings return None."""
    assert sanitize_api_key(None) is None
    assert sanitize_api_key("") is None
    assert sanitize_api_key("   ") is None


def test_sanitize_api_key_strip():
    """Verify stripping of quotes, spaces, newlines, and carriage returns."""
    assert sanitize_api_key("  test-key  ") == "test-key"
    assert sanitize_api_key('"test-key"') == "test-key"
    assert sanitize_api_key("'test-key'") == "test-key"
    assert sanitize_api_key("\n\rtest-key\n") == "test-key"
    assert sanitize_api_key(" \n'\"test-key\"'\r  ") == "test-key"


def test_sanitize_api_key_bearer():
    """Verify stripping of 'Bearer ' prefix."""
    assert sanitize_api_key("Bearer test-key") == "test-key"
    assert sanitize_api_key("bearer test-key") == "test-key"
    assert sanitize_api_key("BEARER test-key") == "test-key"
    assert sanitize_api_key("Bearer   test-key  ") == "test-key"
    assert sanitize_api_key("Bearer 'test-key'") == "test-key"
    assert sanitize_api_key("bearer \ntest-key\n") == "test-key"


def test_sanitize_api_key_non_ascii():
    """Verify ignoring of non-ASCII characters."""
    assert sanitize_api_key("test-key-😊") == "test-key-"
    assert sanitize_api_key("Bearer 😊test-key") == "test-key"
    assert sanitize_api_key("test-key-áéíóú") == "test-key-"


async def _call_get_app_secrets(**kwargs):
    """Helper to bypass FastAPI Header defaults and pass real values."""
    import os
    defaults = {
        "x_ater_token": os.environ.get("ATER_SIDECAR_TOKEN"),
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
async def test_get_app_secrets_auth_success(monkeypatch):
    """Verify successful authentication with valid ATER_SIDECAR_TOKEN."""
    monkeypatch.setenv("ATER_SIDECAR_TOKEN", "valid-token")

    # Should not raise exception
    secrets = await _call_get_app_secrets(x_ater_token="valid-token")
    assert secrets.ai_provider == "google"


@pytest.mark.asyncio
async def test_get_app_secrets_auth_failure(monkeypatch):
    """Verify HTTPException is raised for missing or invalid token."""
    monkeypatch.setenv("ATER_SIDECAR_TOKEN", "valid-token")

    with pytest.raises(HTTPException) as exc_info:
        await _call_get_app_secrets(x_ater_token="invalid-token")
    assert exc_info.value.status_code == 403
    assert "Invalid sidecar authentication token" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info:
        await _call_get_app_secrets(x_ater_token=None)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_get_app_secrets_provider_fallback(monkeypatch):
    """Verify correct environment variable fallback logic based on x_ai_provider."""
    # Test Google fallback
    monkeypatch.setenv("GEMINI_KEY", "env-gemini-key")
    secrets = await _call_get_app_secrets(x_ai_provider="google")
    assert secrets.ai_key == "env-gemini-key"

    # Test OpenAI fallback
    monkeypatch.setenv("OPENAI_API_KEY", "env-openai-key")
    secrets = await _call_get_app_secrets(x_ai_provider="openai")
    assert secrets.ai_key == "env-openai-key"

    # Test Groq fallback
    monkeypatch.setenv("GROQ_KEY", "env-groq-key")
    secrets = await _call_get_app_secrets(x_ai_provider="groq")
    assert secrets.ai_key == "env-groq-key"

    # Test OpenRouter fallback
    monkeypatch.setenv("OPENROUTER_KEY", "env-openrouter-key")
    secrets = await _call_get_app_secrets(x_ai_provider="openrouter")
    assert secrets.ai_key == "env-openrouter-key"


@pytest.mark.asyncio
async def test_get_app_secrets_strict_provider():
    """Verify that planner and utility fields consolidate to primary logic."""
    secrets = await _call_get_app_secrets(
        x_ai_provider="openai",
        x_ai_key="primary-key",
        x_ai_model="primary-model",
        x_planner_provider="google",
        x_planner_key="planner-key",
        x_planner_model="planner-model",
        x_utility_provider="groq",
        x_utility_key="utility-key",
        x_utility_model="utility-model",
    )

    # Primary fields
    assert secrets.ai_provider == "openai"
    assert secrets.ai_key == "primary-key"
    assert secrets.ai_model == "primary-model"

    # Planner fields (should be consolidated to primary)
    assert secrets.planner_provider == "openai"
    assert secrets.planner_key == "primary-key"
    assert secrets.planner_model == "primary-model"

    # Utility fields (should be consolidated to primary)
    assert secrets.utility_provider == "openai"
    assert secrets.utility_key == "primary-key"
    assert secrets.utility_model == "primary-model"


@pytest.mark.asyncio
async def test_get_app_secrets_auto_deploy():
    """Verify boolean conversion of x_auto_deploy."""
    secrets = await _call_get_app_secrets(x_auto_deploy="true")
    assert secrets.auto_deploy is True

    secrets = await _call_get_app_secrets(x_auto_deploy="TRUE")
    assert secrets.auto_deploy is True

    secrets = await _call_get_app_secrets(x_auto_deploy="false")
    assert secrets.auto_deploy is False

    secrets = await _call_get_app_secrets(x_auto_deploy="invalid")
    assert secrets.auto_deploy is False
