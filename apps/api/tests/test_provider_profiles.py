from src.domains.ai.provider_profiles import get_provider_profile
from src.domains.ater.governor import TokenGovernor


def test_provider_profile_uses_conservative_custom_defaults():
    profile = get_provider_profile("unknown-provider", "tiny-2b-free")
    assert profile.provider == "custom"
    assert profile.max_concurrency == 1
    assert profile.max_tpm <= 12000
    assert profile.safety_margin <= 0.60


def test_governor_quota_scope_includes_provider_model_and_key(tmp_path):
    governor = TokenGovernor(db_path=str(tmp_path / "governor.db"))
    governor.set_api_key("same-key", provider="groq", model="llama-3.3-70b-versatile")
    groq_scope = governor._current_quota_key

    governor.set_api_key("same-key", provider="custom", model="local-model", base_url="http://localhost:1234/v1")
    custom_scope = governor._current_quota_key

    assert groq_scope != custom_scope
    assert "groq:llama-3.3-70b-versatile" in groq_scope
    assert "http://localhost:1234/v1:local-model" in custom_scope


def test_governor_learns_provider_header_limits(tmp_path):
    governor = TokenGovernor(db_path=str(tmp_path / "governor.db"))
    governor.configure("groq", "llama-3.3-70b-versatile")
    governor.update_limits_from_provider(requests_limit=12, tokens_limit=9000)
    assert governor.max_rpm == 12
    assert governor.max_tpm == 9000
