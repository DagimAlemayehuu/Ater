from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from pathlib import Path
import frontmatter

from src.api.deps import AppSecrets, get_app_secrets

router = APIRouter()

DB_DIR_PREFIX = "Database"

def get_note_data(file_path: Path) -> Dict[str, Any]:
    try:
        post = frontmatter.load(file_path)
        data = dict(post.metadata)
        data["id"] = file_path.stem
        data["title"] = data.get("title") or file_path.stem
        return data
    except Exception:
        return {"id": file_path.stem, "title": file_path.stem}

@router.get("/academics/dashboard")
async def get_academics_dashboard(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    
    data = {
        "semesters": [],
        "courses": [],
        "units": [],
        "exams": [],
        "assignments": [],
        "study_sessions": [],
        "years": []
    }
    
    mapping = {
        "08 - Semesters": "semesters",
        "07 - Courses": "courses",
        "04 - Exams": "exams",
        "03 - Assignments": "assignments",
        "06 - Study Planner": "study_sessions",
        "09 - Years": "years"
    }
    
    for folder_name, key in mapping.items():
        folder_path = vault_root / DB_DIR_PREFIX / folder_name
        if folder_path.exists() and folder_path.is_dir():
            for f in folder_path.glob("*.md"):
                if f.name.startswith("."): continue
                data[key].append(get_note_data(f))
            
    return data

@router.post("/academics/sync-profile")
async def sync_academics_profile(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    
    # 1. Create Main Folders
    main_folders = ["Inbox", "Notes", "Database"]
    for f in main_folders:
        (vault_root / f).mkdir(parents=True, exist_ok=True)
        
    # 2. Create Database Structure
    db_folders = [
        "Database/03 - Assignments",
        "Database/04 - Exams",
        "Database/06 - Study Planner",
        "Database/07 - Courses",
        "Database/08 - Semesters",
        "Database/09 - Years",
        "0-Bases"
    ]
    for f in db_folders:
        (vault_root / f).mkdir(parents=True, exist_ok=True)
        
    # 3. Create Seed Files (Only if they don't exist)
    year_path = vault_root / "Database/09 - Years/2025.md"
    if not year_path.exists():
        year_path.write_text("---\ntitle: 2025\nstatus: active\n---")
        
    semester_path = vault_root / "Database/08 - Semesters/Autumn 2025.md"
    if not semester_path.exists():
        semester_path.write_text("---\ntitle: Autumn 2025\nyear: [[2025]]\nstatus: active\n---")
        
    return {"success": True}
