from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any, Optional
import os
import asyncio
import ruamel.yaml
import uuid
import datetime
from pathlib import Path
from pydantic import BaseModel

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.obsidian.client import ObsidianClient

router = APIRouter()

DB_DIR_PREFIX = "3-Database"

class UpdateRowRequest(BaseModel):
    properties: Dict[str, Any]

class CreateRowRequest(BaseModel):
    title: str
    properties: Dict[str, Any]

import json
from fastapi.responses import StreamingResponse
from src.domains.obsidian.events import vault_events

@router.get("/vault/events")
async def sse_vault_events():
    async def event_generator():
        q = vault_events.subscribe()
        try:
            while True:
                event = await q.get()
                yield f"data: {json.dumps(event)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            vault_events.unsubscribe(q)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/vault/databases")
async def list_vault_databases(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    db_path = Path(secrets.vault_path) / DB_DIR_PREFIX
    if not db_path.exists():
        return {"databases": []}
        
    databases = []
    yaml = ruamel.yaml.YAML(typ='safe', pure=True)
    
    for entry in db_path.iterdir():
        if entry.is_dir() and not entry.name.startswith("."):
            # Deduce schema by aggregating from all .md files
            schema = {}
            for md_file in entry.glob("*.md"):
                try:
                    with open(md_file, "r", encoding="utf-8") as f:
                        content = f.read()
                        if content.startswith("---"):
                            end_idx = content.find("---", 3)
                            if end_idx != -1:
                                frontmatter = yaml.load(content[3:end_idx])
                                if isinstance(frontmatter, dict):
                                    for k, v in frontmatter.items():
                                        if k not in ["last_synced", "links"]:
                                            # If we haven't seen this property yet, or we saw it as None/str, 
                                            # prefer more specific types like list or bool.
                                            current_type = schema.get(k)
                                            new_type = type(v).__name__
                                            if not current_type or current_type == 'NoneType' or new_type in ['list', 'bool', 'int', 'float']:
                                                schema[k] = new_type
                except Exception:
                    pass
            
            databases.append({
                "id": entry.name,
                "name": entry.name.split(" - ")[-1] if " - " in entry.name else entry.name,
                "schema": schema,
                "type": "obsidian"
            })
            
    return {"databases": databases}

@router.get("/vault/databases/{db_name}")
async def query_vault_database(db_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    db_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name
    if not db_path.exists():
        raise HTTPException(status_code=404, detail="Database not found")
        
    yaml = ruamel.yaml.YAML(typ='safe', pure=True)
    rows = []
    
    for md_file in db_path.glob("*.md"):
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()
                props = {}
                if content.startswith("---"):
                    end_idx = content.find("---", 3)
                    if end_idx != -1:
                        props = yaml.load(content[3:end_idx]) or {}
                        
                # Ensure the title is always part of the properties
                if isinstance(props, dict):
                    # Replace internal list representation to match frontend expectations
                    rows.append({
                        "id": md_file.name,
                        "title": md_file.stem,
                        "properties": props
                    })
        except Exception as e:
            print(f"Error parsing {md_file.name}: {e}")
            
    return {"results": rows}

@router.patch("/vault/databases/{db_name}/{file_name}")
async def update_vault_row(db_name: str, file_name: str, req: UpdateRowRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    file_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        yaml = ruamel.yaml.YAML()
        yaml.preserve_quotes = True
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        if content.startswith("---"):
            end_idx = content.find("---", 3)
            if end_idx != -1:
                frontmatter_str = content[3:end_idx]
                body_str = content[end_idx+3:]
                
                data = yaml.load(frontmatter_str) or {}
                
                # Apply updates
                for k, v in req.properties.items():
                    data[k] = v
                    
                data["last_synced"] = datetime.datetime.now().isoformat()
                
                import io
                buf = io.StringIO()
                yaml.dump(data, buf)
                new_frontmatter = buf.getvalue()
                
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(f"---\n{new_frontmatter}---{body_str}")
                    
                return {"success": True, "id": file_name, "properties": data}
        
        return {"success": False, "message": "No frontmatter found"}
    except Exception as e:
        print(f"Error updating {file_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vault/databases/{db_name}")
async def create_vault_row(db_name: str, req: CreateRowRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    db_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name
    if not db_path.exists():
        db_path.mkdir(parents=True, exist_ok=True)
        
    # Sanitize title
    safe_title = "".join([c for c in req.title if c.isalnum() or c in (' ', '-', '_')]).strip()
    if not safe_title:
        safe_title = "Untitled"
        
    file_name = f"{safe_title}.md"
    file_path = db_path / file_name
    
    # Handle duplicates
    counter = 1
    while file_path.exists():
        file_name = f"{safe_title} ({counter}).md"
        file_path = db_path / file_name
        counter += 1
        
    try:
        yaml = ruamel.yaml.YAML()
        yaml.preserve_quotes = True
        
        data = req.properties
        data["last_synced"] = datetime.datetime.now().isoformat()
        data["links"] = []
        
        import io
        buf = io.StringIO()
        yaml.dump(data, buf)
        new_frontmatter = buf.getvalue()
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"---\n{new_frontmatter}---\n\n")
            
        return {"success": True, "id": file_name, "title": file_name.replace(".md", ""), "properties": data}
    except Exception as e:
        print(f"Error creating {file_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/vault/databases/{db_name}/{file_name}")
async def delete_vault_row(db_name: str, file_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    file_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        file_path.unlink()
        return {"success": True}
    except Exception as e:
        print(f"Error deleting {file_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vault/search")
async def find_vault_page(page_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    db_root = vault_root / DB_DIR_PREFIX
    
    # 1. Search in 3-Database first (to prioritize database views)
    if db_root.exists():
        for db_dir in db_root.iterdir():
            if db_dir.is_dir():
                target_file = db_dir / f"{page_name}.md"
                if target_file.exists():
                    return {
                        "found": True,
                        "type": "database",
                        "db_id": db_dir.name,
                        "file_name": target_file.name
                    }
                
    # 2. Search everywhere else in the vault
    for md_file in vault_root.rglob(f"{page_name}.md"):
        # Calculate relative path from vault root
        rel_path = str(md_file.relative_to(vault_root))
        return {
            "found": True,
            "type": "note",
            "path": rel_path
        }
                
    return {"found": False}
