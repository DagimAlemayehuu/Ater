from fastapi import Header, HTTPException
from typing import Optional
from pydantic import BaseModel

class AppSecrets(BaseModel):
    notion_key: Optional[str] = None
    ai_provider: str = "google"
    ai_key: Optional[str] = None
    ai_model: str = "gemini-2.0-flash"
    
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
    academic_path: str = "1-Academic"
    auto_deploy: bool = False
    google_calendar_token: Optional[str] = None

async def get_app_secrets(
    x_notion_key: Optional[str] = Header(None),
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
    x_academic_path: str = Header("1-Academic"),
    x_auto_deploy: str = Header("false"),
    x_google_calendar_token: Optional[str] = Header(None)
) -> AppSecrets:
    """
    Extracts core secrets from request headers.
    Supports 3-tier reasoning levels.
    """
    primary_provider = x_ai_provider.lower()
    
    return AppSecrets(
        notion_key=x_notion_key,
        ai_provider=primary_provider,
        ai_key=x_ai_key,
        ai_model=x_ai_model,
        
        # Level 2: Fallback to primary if not specified
        planner_provider=(x_planner_provider or x_ai_provider).lower(),
        planner_key=x_planner_key or x_ai_key,
        planner_model=x_planner_model or x_ai_model,

        # Level 3: Fallback to planner if not specified
        utility_provider=(x_utility_provider or x_planner_provider or x_ai_provider).lower(),
        utility_key=x_utility_key or x_planner_key or x_ai_key,
        utility_model=x_utility_model or "gemini-1.5-flash-8b",

        vault_path=x_vault_path,
        inbox_path=x_inbox_path,
        academic_path=x_academic_path,
        auto_deploy=x_auto_deploy.lower() == "true",
        google_calendar_token=x_google_calendar_token
    )
