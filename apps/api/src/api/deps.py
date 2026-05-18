from fastapi import Header
from typing import Optional
from pydantic import BaseModel

class AppSecrets(BaseModel):
    ai_provider: str = "google"
    ai_key: Optional[str] = None
    ai_model: str = "gemini-2.0-flash"
    ai_base_url: Optional[str] = None
    
    # Level 2: Planner/Router
    planner_provider: str = "google"
    planner_key: Optional[str] = None
    planner_model: str = "gemini-2.0-flash"

    # Level 3: Utility/Extraction (The Worker)
    utility_provider: str = "google"
    utility_key: Optional[str] = None
    utility_model: str = "gemini-1.5-flash-8b"

    vault_path: Optional[str] = None
    inbox_path: Optional[str] = None
    academic_path: str = "Notes"
    auto_deploy: bool = False
    google_calendar_token: Optional[str] = None

def sanitize_api_key(key: Optional[str]) -> Optional[str]:
    if not key:
        return None
    # Strip carriage return, newline, spaces, and quotes
    cleaned = key.strip().strip("'\"").strip("\r\n").strip()
    if cleaned.lower().startswith("bearer "):
        cleaned = cleaned[7:].strip().strip("'\"").strip("\r\n").strip()
    # Decode ascii & ignore non-ascii characters to prevent httpx Header crash
    cleaned = cleaned.encode('ascii', 'ignore').decode('ascii').strip()
    return cleaned if cleaned else None

async def get_app_secrets(
    x_ai_provider: str = Header("google"),
    x_ai_key: Optional[str] = Header(None),
    x_ai_model: str = Header("gemini-2.0-flash"),
    
    # Level 2 Headers
    x_planner_provider: Optional[str] = Header(None),
    x_planner_key: Optional[str] = Header(None),
    x_planner_model: Optional[str] = Header(None),
    
    # Level 3 Headers
    x_utility_provider: Optional[str] = Header(None),
    x_utility_key: Optional[str] = Header(None),
    x_utility_model: Optional[str] = Header(None),
    
    x_vault_path: Optional[str] = Header(None),
    x_inbox_path: Optional[str] = Header(None),
    x_academic_path: str = Header("Notes"),
    x_auto_deploy: str = Header("false"),
    x_google_calendar_token: Optional[str] = Header(None)
) -> AppSecrets:
    """
    Extracts core secrets from request headers.
    Supports 3-tier reasoning levels.
    """
    primary_provider = x_ai_provider.lower()
    
    # Sanitize all incoming keys to prevent quotes, newlines, and non-ascii from crashing httpx
    clean_ai_key = sanitize_api_key(x_ai_key)
    clean_planner_key = sanitize_api_key(x_planner_key) or clean_ai_key
    clean_utility_key = sanitize_api_key(x_utility_key) or clean_ai_key

    return AppSecrets(
        ai_provider=primary_provider,
        ai_key=clean_ai_key,
        ai_model=x_ai_model,
        
        # Consolidate all tiers to primary to enforce "Strict Single Provider" mode
        planner_provider=primary_provider,
        planner_key=clean_ai_key,
        planner_model=x_ai_model,

        utility_provider=primary_provider,
        utility_key=clean_ai_key,
        utility_model=x_ai_model,

        vault_path=x_vault_path,
        inbox_path=x_inbox_path,
        academic_path=x_academic_path,
        auto_deploy=x_auto_deploy.lower() == "true",
        google_calendar_token=x_google_calendar_token
    )

