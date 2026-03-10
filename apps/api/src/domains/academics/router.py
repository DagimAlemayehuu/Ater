from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, List
from src.api.deps import AppSecrets, get_app_secrets
from src.domains.academics.service import AcademicsService

router = APIRouter(prefix="/academics", tags=["academics"])

@router.get("/dashboard")
async def get_academics_dashboard(secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Fetches a comprehensive view of the user's academic status:
    - Active Semester
    - Courses
    - Upcoming Exams & Assignments
    - Study Planner items (Units needing review)
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    try:
        service = AcademicsService(secrets.notion_key)
        dashboard_data = await service.get_dashboard_data()
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-profile")
async def sync_academic_profile(secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Forces a sync of the current academic data into the local Markdown profile (academic_profile.md).
    """
    if not secrets.notion_key:
        raise HTTPException(status_code=401, detail="X-Notion-Key header missing")
    
    try:
        service = AcademicsService(secrets.notion_key)
        profile_path = await service.sync_profile_markdown()
        return {"success": True, "profile_path": str(profile_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
