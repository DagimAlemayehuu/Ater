from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class ProviderProfile:
    provider: str
    model: str
    max_tpm: int
    max_rpm: int
    max_tpd: int
    max_rpd: int
    max_concurrency: int
    safety_margin: float = 0.70
    supports_structured_output: bool = True
    openai_compatible: bool = False


DEFAULT_PROFILES = {
    # Conservative free-tier-ish defaults. Live response headers can tighten or
    # relax these during runtime when a provider exposes rate-limit metadata.
    "groq": ProviderProfile("groq", "*", 30000, 30, 300000, 300, 10, 0.98, True, False),
    "google": ProviderProfile("google", "*", 250000, 15, 1000000, 1500, 1, 0.75, True, False),
    "openai": ProviderProfile("openai", "*", 30000, 30, 500000, 5000, 2, 0.65, True, True),
    "anthropic": ProviderProfile("anthropic", "*", 30000, 30, 500000, 5000, 2, 0.65, True, False),
    "openrouter": ProviderProfile("openrouter", "*", 20000, 20, 300000, 3000, 1, 0.60, True, True),
    "custom": ProviderProfile("custom", "*", 6000, 10, 100000, 1000, 1, 0.55, True, True),
}


MODEL_HINTS = (
    ("free", {"max_tpm": 6000, "max_rpm": 10, "max_tpd": 100000, "max_rpd": 1000, "max_concurrency": 1, "safety_margin": 0.55}),
    ("2b", {"max_tpm": 12000, "max_rpm": 20, "max_tpd": 250000, "max_rpd": 3000, "max_concurrency": 1, "safety_margin": 0.60}),
    ("8b", {"max_tpm": 20000, "max_rpm": 25, "max_tpd": 350000, "max_rpd": 4000, "max_concurrency": 2, "safety_margin": 0.65}),
)


def _coerce_int(value: Optional[int], fallback: int) -> int:
    try:
        if value is None:
            return fallback
        parsed = int(value)
        return parsed if parsed > 0 else fallback
    except Exception:
        return fallback


def get_provider_profile(
    provider: str,
    model: str = "",
    *,
    max_tpm: Optional[int] = None,
    max_rpm: Optional[int] = None,
    max_tpd: Optional[int] = None,
    max_rpd: Optional[int] = None,
    max_concurrency: Optional[int] = None,
) -> ProviderProfile:
    provider_key = (provider or "custom").lower().strip()
    model_name = (model or "").strip()
    known_provider = provider_key in DEFAULT_PROFILES
    base = DEFAULT_PROFILES.get(provider_key, DEFAULT_PROFILES["custom"])
    values = {
        "max_tpm": base.max_tpm,
        "max_rpm": base.max_rpm,
        "max_tpd": base.max_tpd,
        "max_rpd": base.max_rpd,
        "max_concurrency": base.max_concurrency,
        "safety_margin": base.safety_margin,
    }

    model_lower = model_name.lower()
    for hint, overrides in MODEL_HINTS:
        if hint in model_lower:
            values.update(overrides)
            break

    values["max_tpm"] = _coerce_int(max_tpm, values["max_tpm"])
    values["max_rpm"] = _coerce_int(max_rpm, values["max_rpm"])
    values["max_tpd"] = _coerce_int(max_tpd, values["max_tpd"])
    values["max_rpd"] = _coerce_int(max_rpd, values["max_rpd"])
    values["max_concurrency"] = _coerce_int(max_concurrency, values["max_concurrency"])

    return ProviderProfile(
        provider=provider_key if known_provider else "custom",
        model=model_name,
        supports_structured_output=base.supports_structured_output,
        openai_compatible=base.openai_compatible,
        **values,
    )
