from fastapi import Header, HTTPException
from typing import Optional
from pydantic import BaseModel

class AppSecrets(BaseModel):
    notion_key: Optional[str] = None
    ai_provider: str = "google"
    ai_key: Optional[str] = None
    ai_model: str = "gemini-2.5-flash"
    vault_path: Optional[str] = None
    inbox_path: Optional[str] = None
    academic_path: str = "1-Academic"
    auto_deploy: bool = False
    google_calendar_token: Optional[str] = None

async def get_app_secrets(
    x_notion_key: Optional[str] = Header(None),
    x_ai_provider: str = Header("google"),
    x_ai_key: Optional[str] = Header(None),
    x_ai_model: str = Header("gemini-2.5-flash"),
    x_vault_path: Optional[str] = Header(None),
    x_inbox_path: Optional[str] = Header(None),
    x_academic_path: str = Header("1-Academic"),
    x_auto_deploy: str = Header("false"),
    x_google_calendar_token: Optional[str] = Header(None)
) -> AppSecrets:
    """
    Dependency to extract core secrets from request headers.
    Ensures they are cleaned and ready for use.
    """
    return AppSecrets(
        notion_key=x_notion_key,
        ai_provider=x_ai_provider.lower(),
        ai_key=x_ai_key,
        ai_model=x_ai_model,
        vault_path=x_vault_path,
        inbox_path=x_inbox_path,
        academic_path=x_academic_path,
        auto_deploy=x_auto_deploy.lower() == "true",
        google_calendar_token=x_google_calendar_token
    )
