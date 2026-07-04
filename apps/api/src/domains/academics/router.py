from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from pathlib import Path
import frontmatter

from src.api.deps import AppSecrets, get_app_secrets

router = APIRouter()

DB_DIR_PREFIX = "database"

def get_note_data(file_path: Path, vault_root: Path) -> Dict[str, Any]:
    try:
        post = frontmatter.load(file_path)
        data = dict(post.metadata)
        data["id"] = file_path.stem
        data["title"] = data.get("title") or file_path.stem
        try:
            data["path"] = file_path.relative_to(vault_root).as_posix()
        except ValueError:
            data["path"] = file_path.as_posix()
        return data
    except Exception:
        path_str = ""
        try:
            path_str = file_path.relative_to(vault_root).as_posix()
        except ValueError:
            path_str = file_path.as_posix()
        return {"id": file_path.stem, "title": file_path.stem, "path": path_str}

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
        "semesters": "semesters",
        "courses": "courses",
        "exams": "exams",
        "assignments": "assignments",
        "study planner": "study_sessions",
        "years": "years"
    }
    
    for folder_name, key in mapping.items():
        folder_path = vault_root / DB_DIR_PREFIX / folder_name
        if folder_path.exists() and folder_path.is_dir():
            files = folder_path.rglob("*.md") if folder_name == "study planner" else folder_path.glob("*.md")
            for f in files:
                if f.name.startswith("."): continue
                note_data = get_note_data(f, vault_root)
                if folder_name == "study planner":
                    # Exclude property option markdown files
                    rel_path = f.relative_to(folder_path)
                    parts = rel_path.parts
                    if len(parts) > 1 and parts[0] in ["status", "confidence", "type", "priority", "difficulty"]:
                        continue
                    # Hubs must have type: "Hub" or "Learning Hub"
                    if note_data.get("type") not in ["Hub", "Learning Hub"]:
                        continue
                data[key].append(note_data)
            
    return data

@router.post("/academics/sync-profile")
async def sync_academics_profile(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    
    # 1. Create Main Folders
    main_folders = ["Inbox", "Notes", "database"]
    for f in main_folders:
        (vault_root / f).mkdir(parents=True, exist_ok=True)
        
    # 2. Create Database Structure
    db_folders = [
        "database/assignments",
        "database/exams",
        "database/study planner",
        "database/courses",
        "database/semesters",
        "database/years"
    ]
    for f in db_folders:
        (vault_root / f).mkdir(parents=True, exist_ok=True)
        
    return {"success": True}
