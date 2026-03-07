from fastapi import Header, HTTPException
from typing import Optional
from pydantic import BaseModel

class AppSecrets(BaseModel):
    notion_key: Optional[str] = None
    gemini_key: Optional[str] = None
    gemini_model: Optional[str] = "gemini-2.5-flash"
    vault_path: Optional[str] = None

async def get_app_secrets(
    x_notion_key: Optional[str] = Header(None),
    x_gemini_key: Optional[str] = Header(None),
    x_gemini_model: Optional[str] = Header("gemini-2.5-flash"),
    x_vault_path: Optional[str] = Header(None)
) -> AppSecrets:
    """
    Dependency to extract core secrets from request headers.
    Ensures they are cleaned and ready for use.
    """
    return AppSecrets(
        notion_key=x_notion_key,
        gemini_key=x_gemini_key,
        gemini_model=x_gemini_model,
        vault_path=x_vault_path
    )
