import pytest


def _default_header_kwargs():
    return {
        "x_ater_token": None,
        "sidecar_token": None,
        "x_ai_base_url": None,
        "x_ai_max_tpm": None,
        "x_ai_max_rpm": None,
        "x_ai_max_tpd": None,
        "x_ai_max_rpd": None,
        "x_ai_max_concurrency": None,
        "x_vault_path": None,
        "x_inbox_path": None,
        "x_academic_path": "Notes",
        "x_auto_deploy": "false",
        "x_google_calendar_token": None,
    }


@pytest.mark.asyncio
async def test_get_app_secrets_preserves_explicit_planner_tier(monkeypatch):
    from src.api.deps import get_app_secrets

    monkeypatch.delenv("ATER_SIDECAR_TOKEN", raising=False)

    secrets = await get_app_secrets(
        **_default_header_kwargs(),
        x_ai_provider="google",
        x_ai_key="primary-key",
        x_ai_model="Gemma-4-31b-it",
        x_planner_provider="google",
        x_planner_key="planner-key",
        x_planner_model="gemini-3.1-flash-lite",
        x_utility_key=None,
        x_utility_provider=None,
        x_utility_model=None,
    )

    assert secrets.ai_model == "Gemma-4-31b-it"
    assert secrets.ai_key == "primary-key"
    assert secrets.planner_provider == "google"
    assert secrets.planner_key == "planner-key"
    assert secrets.planner_model == "gemini-3.1-flash-lite"


@pytest.mark.asyncio
async def test_get_app_secrets_defaults_gemma_primary_to_fast_google_planner(monkeypatch):
    from src.api.deps import get_app_secrets

    monkeypatch.delenv("ATER_SIDECAR_TOKEN", raising=False)

    secrets = await get_app_secrets(
        **_default_header_kwargs(),
        x_ai_provider="google",
        x_ai_key="primary-key",
        x_ai_model="Gemma-4-31b-it",
        x_planner_key=None,
        x_planner_provider=None,
        x_planner_model=None,
        x_utility_key=None,
        x_utility_provider=None,
        x_utility_model=None,
    )

    assert secrets.ai_model == "Gemma-4-31b-it"
    assert secrets.planner_provider == "google"
    assert secrets.planner_key == "primary-key"
    assert secrets.planner_model == "Gemma-4-31b-it"
