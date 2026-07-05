from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, Optional
import asyncio
import json
import uuid
from pathlib import Path
from pydantic import BaseModel
import shutil
from urllib.parse import unquote, quote
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse

from src.api.deps import AppSecrets, get_app_secrets
from src.utils.vault_path import resolve_vault_path

router = APIRouter()

DB_DIR_PREFIX = "database"

import yaml

# Obsidian-specific YAML dumper to ensure wiki links are valid properties
class ObsidianDumper(yaml.Dumper):
    pass

def _str_representer(dumper, data):
    # If the string perfectly wraps a wikilink, force double quotes.
    # This allows Obsidian's Properties UI to parse it as an internal link natively.
    if data.startswith('[[') and data.endswith(']]'):
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

ObsidianDumper.add_representer(str, _str_representer)

class UpdateRowRequest(BaseModel):
    properties: Dict[str, Any]

class CreateRowRequest(BaseModel):
    title: str
    properties: Dict[str, Any]

class CreateOptionRequest(BaseModel):
    source: str
    name: str

class CreateDatabaseRequest(BaseModel):
    name: str
    area: Optional[str] = None

class UpdateSchemaRequest(BaseModel):
    properties: Dict[str, Any] # PropertyName -> {type: str, source: Optional[str]}
    rename_from: Optional[str] = None
    rename_to: Optional[str] = None

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

@router.post("/vault/initialize")
async def initialize_vault(secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Scaffolds the entire folder structure for a new Ater vault.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    
    # 1. Try to copy from monorepo vault_template or Obsidian_Vault template folder
    candidates = [
        Path(__file__).parents[5] / "vault_template",
        Path(__file__).parents[4] / "vault_template",
        Path(__file__).parents[4] / "Obsidian_Vault",
    ]
    template_path = None
    for cand in candidates:
        if cand.exists() and cand.is_dir():
            template_path = cand
            break

    if template_path:
        try:
            def copy_tree(src: Path, dst: Path):
                dst.mkdir(parents=True, exist_ok=True)
                for item in src.iterdir():
                    if item.name.startswith("."):
                        continue
                    dst_item = dst / item.name
                    if item.is_dir():
                        copy_tree(item, dst_item)
                    else:
                        if not dst_item.exists():
                            shutil.copy2(item, dst_item)
            copy_tree(template_path, vault_root)
        except Exception as e:
            print(f"Warning: Failed to copy template folder: {e}")

    # 2. Fallback: Core Hierarchy (Only essential folders)
    folders = [
        f"{DB_DIR_PREFIX}/years",
        f"{DB_DIR_PREFIX}/assignments",
        f"{DB_DIR_PREFIX}/inbox",
        f"{DB_DIR_PREFIX}/semesters",
        f"{DB_DIR_PREFIX}/study planner",
        f"{DB_DIR_PREFIX}/courses",
        f"{DB_DIR_PREFIX}/exams",
        "Inbox/Generated",
        "Notes"
    ]
    
    # 3. Select Sources (for Properties)
    select_sources = [
        f"{DB_DIR_PREFIX}/study planner/status",
        f"{DB_DIR_PREFIX}/study planner/confidence",
        f"{DB_DIR_PREFIX}/study planner/type",
        f"{DB_DIR_PREFIX}/courses/difficulty",
        f"{DB_DIR_PREFIX}/courses/grade",
        f"{DB_DIR_PREFIX}/courses/professor",
        f"{DB_DIR_PREFIX}/courses/status",
        f"{DB_DIR_PREFIX}/years/status",
        f"{DB_DIR_PREFIX}/years/academic level",
        f"{DB_DIR_PREFIX}/semesters/status",
        f"{DB_DIR_PREFIX}/exams/type",
        f"{DB_DIR_PREFIX}/assignments/status",
        f"{DB_DIR_PREFIX}/assignments/priority",
        f"{DB_DIR_PREFIX}/assignments/type"
    ]
    
    try:
        # 1. Create all folders
        for folder in folders + select_sources:
            (vault_root / folder).mkdir(parents=True, exist_ok=True)
            
        # 2. Pre-seed Default Property Options (.md files)
        seeds = {
            f"{DB_DIR_PREFIX}/courses/grade": ["A", "B", "C", "D", "F", "P"],
            f"{DB_DIR_PREFIX}/courses/difficulty": ["Easy", "Medium", "Hard", "Expert"],
            f"{DB_DIR_PREFIX}/study planner/status": ["Not Started", "Planned", "In Progress", "Reviewing", "Completed"],
            f"{DB_DIR_PREFIX}/study planner/confidence": ["High", "Medium", "Low"],
            f"{DB_DIR_PREFIX}/study planner/type": ["Hub", "Atomic", "Possible Questions"],
            f"{DB_DIR_PREFIX}/courses/status": ["Planned", "In Progress", "Completed"],
            f"{DB_DIR_PREFIX}/years/status": ["Active", "Completed", "Future"],
            f"{DB_DIR_PREFIX}/years/academic level": ["Undergraduate", "Graduate", "PhD"],
            f"{DB_DIR_PREFIX}/semesters/status": ["Planned", "Active", "Completed"],
            f"{DB_DIR_PREFIX}/exams/type": ["Midterm", "Final", "Quiz", "Assignment"],
            f"{DB_DIR_PREFIX}/assignments/status": ["Planned", "In Progress", "Completed"],
            f"{DB_DIR_PREFIX}/assignments/priority": ["Low", "Medium", "High"],
            f"{DB_DIR_PREFIX}/assignments/type": ["Homework", "Project", "Reading", "Lab"]
        }
        
        for folder, files in seeds.items():
            for filename in files:
                file_path = vault_root / folder / f"{filename}.md"
                if not file_path.exists():
                    file_path.write_text(f"---\ntitle: {filename}\n---")

        # 3. Create default .obsidian folder if it doesn't exist
        (vault_root / ".obsidian").mkdir(exist_ok=True)
        
        return {"success": True, "message": "Vault structure initialized with refined properties"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vault/databases")
async def list_vault_databases(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    db_path = vault_root / DB_DIR_PREFIX
    if not db_path.exists():
        return {"databases": []}
        
    databases = []
    
    
    for entry in db_path.iterdir():
        if entry.is_dir() and not entry.name.startswith("."):
            schema = {}
            # Defaults
            area = "Academic" if any(x in entry.name for x in ["03", "04", "06", "07", "08", "09"]) else "Other"
            
            # 1. Identify "Select" properties by checking for subdirectories
            # If a subdirectory contains .md files, we treat it as a Select source
            for sub in entry.iterdir():
                if sub.is_dir() and not sub.name.startswith("."):
                    md_count = len(list(sub.glob("*.md")))
                    if md_count > 0:
                        schema[sub.name] = {
                            "type": "select",
                            "source": sub.relative_to(vault_root).as_posix()
                        }

            # Pre-seed schema for Study Planner to guarantee Ater properties always exist
            if "study planner" in entry.name:
                schema.update({
                    "course": {"type": "relation", "source": f"{DB_DIR_PREFIX}/courses"},
                    "status": {"type": "select", "source": f"{DB_DIR_PREFIX}/study planner/status"},
                    "confidence": {"type": "select", "source": f"{DB_DIR_PREFIX}/study planner/confidence"},
                    "study date": {"type": "date"},
                    "type": {"type": "select", "source": f"{DB_DIR_PREFIX}/study planner/type"},
                    "generated": {"type": "bool"},
                    "source": {"type": "relation", "source": "Inbox"},
                    "source_pages": {"type": "str"}
                })

            # 2. Infer property types from .md files in the main folder
            # We only look at the first few files for performance
            sample_files = list(entry.glob("*.md"))[:10]
            for md_file in sample_files:
                if md_file.name.startswith("."): continue
                try:
                    with open(md_file, "r", encoding="utf-8") as f:
                        content = f.read()
                        if content.startswith("---"):
                            end_idx = content.find("---", 3)
                            if end_idx != -1:
                                frontmatter = yaml.safe_load(content[3:end_idx])
                                if isinstance(frontmatter, dict):
                                    for k, v in frontmatter.items():
                                        # STRICT FILTER: ignore internal or redundant properties
                                        k_low = k.lower()
                                        if k_low in ["last_synced", "links", "title", "last_edited_time", "last_edited_by", "created_time", "created_by", "file.name", "academic year", "completed"]: 
                                            continue
                                        if k not in schema:
                                            # Known Academic Types Hardcoding
                                            known_types = {
                                                "current year": {"type": "bool"},
                                                "year": {"type": "relation", "source": f"{DB_DIR_PREFIX}/years"},
                                                "semester": {"type": "relation", "source": f"{DB_DIR_PREFIX}/semesters"},
                                                "course": {"type": "relation", "source": f"{DB_DIR_PREFIX}/courses"},
                                                "start date": {"type": "date"},
                                                "end date": {"type": "date"},
                                                "due date": {"type": "date"},
                                                "study date": {"type": "date"},
                                                "exam date": {"type": "date"},
                                                "credits": {"type": "number"},
                                                "score": {"type": "number"},
                                                "total score": {"type": "number"},
                                                "status": {"type": "select", "source": f"{DB_DIR_PREFIX}/{entry.name}/status"},
                                                "confidence": {"type": "select", "source": f"{DB_DIR_PREFIX}/{entry.name}/confidence"},
                                                "academic level": {"type": "select", "source": f"{DB_DIR_PREFIX}/{entry.name}/academic level"},
                                                "grade": {"type": "select", "source": f"{DB_DIR_PREFIX}/{entry.name}/grade"},
                                                "professor": {"type": "select", "source": f"{DB_DIR_PREFIX}/{entry.name}/professor"},
                                                "difficulty": {"type": "select", "source": f"{DB_DIR_PREFIX}/{entry.name}/difficulty"},
                                                "priority": {"type": "select", "source": f"{DB_DIR_PREFIX}/{entry.name}/priority"},
                                                "generated": {"type": "bool"},
                                                "source": {"type": "relation", "source": "inbox"},
                                                "source_pages": {"type": "str"},
                                                "target years": {"type": "number"},
                                                "target credits": {"type": "number"},
                                                "earned credits": {"type": "number"},
                                                "cumulative gpa": {"type": "number"}
                                            }
                                            
                                            # Special handling for exams/assignments database 'type'
                                            if "exams" in entry.name and k_low == "type":
                                                schema[k] = {"type": "select", "source": f"{DB_DIR_PREFIX}/exams/type"}
                                            elif "assignments" in entry.name and k_low == "type":
                                                schema[k] = {"type": "select", "source": f"{DB_DIR_PREFIX}/assignments/type"}
                                            elif "assignments" in entry.name and k_low == "status":
                                                schema[k] = {"type": "select", "source": f"{DB_DIR_PREFIX}/assignments/status"}
                                            elif k_low in known_types:
                                                schema[k] = known_types[k_low]
                                            else:
                                                # Relation detection: if value is [[...]] and not already a select
                                                if isinstance(v, str) and v.startswith("[[") and v.endswith("]]"):
                                                    source = ""
                                                    if k_low == "course": source = f"{DB_DIR_PREFIX}/courses"
                                                    elif k_low == "semester": source = f"{DB_DIR_PREFIX}/semesters"
                                                    elif k_low == "year": source = f"{DB_DIR_PREFIX}/years"
                                                    schema[k] = {"type": "relation", "source": source}
                                                else:
                                                    new_type = 'bool' if isinstance(v, bool) else \
                                                             'number' if isinstance(v, (int, float)) else 'str'
                                                    schema[k] = {"type": new_type}
                except Exception:
                    pass
            
            # Add title column
            schema_with_title = {"title": {"type": "title"}}
            schema_with_title.update(schema)

            databases.append({
                "id": entry.name,
                "name": entry.name.split(" - ")[-1] if " - " in entry.name else entry.name,
                "schema": schema_with_title,
                "area": area,
                "views": [{
                    "type": "table",
                    "name": "Table",
                    "columns": [{"title": {"type": "title"}}] + [{k: v} for k, v in schema.items()]
                }],
                "type": "obsidian"
            })
            
    return {"databases": databases}

@router.get("/vault/areas")
async def list_vault_areas(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    areas_path = vault_root / DB_DIR_PREFIX / "areas"
    if not areas_path.exists():
        return {"areas": ["Core", "Academic", "Projects", "Resources", "Reference"]}
        
    areas = []
    for md_file in areas_path.glob("*.md"):
        areas.append(md_file.stem)
        
    if "Other" not in areas: areas.append("Other")
    return {"areas": sorted(areas)}

@router.get("/vault/databases/{db_name}")
async def query_vault_database(db_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    db_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name
    if not db_path.exists():
        raise HTTPException(status_code=404, detail="Database not found")
        
    
    rows = []
    
    for md_file in db_path.rglob("*.md"):
        if md_file.name.startswith("."): continue
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()
                props = {}
                if content.startswith("---"):
                    end_idx = content.find("---", 3)
                    if end_idx != -1:
                        props = yaml.safe_load(content[3:end_idx]) or {}
                        
                # Ensure the title is always part of the properties
                if isinstance(props, dict):
                    # STRICT FILTER properties for the frontend
                    cleaned_props = {}
                    internal_keys = ["last_synced", "links", "last_edited_time", "last_edited_by", "created_time", "created_by", "file.name", "academic year", "completed"]
                    for k, v in props.items():
                        if k.lower() not in internal_keys:
                            cleaned_props[k] = v

                    # Extract body content for deep search
                    body = ""
                    if content.startswith("---"):
                        end_idx = content.find("---", 3)
                        if end_idx != -1:
                            body = content[end_idx+3:].strip()
                    else:
                        body = content.strip()
                    
                    rows.append({
                        "id": md_file.stem,
                        "title": md_file.stem,
                        "properties": cleaned_props,
                        "content": body # Include body for deep search
                    })
        except Exception as e:
            print(f"Error parsing {md_file.name}: {e}")
            
    return {"results": rows}

@router.patch("/vault/databases/{db_name}/schema")
async def update_database_schema(db_name: str, req: UpdateSchemaRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    db_path = vault_root / DB_DIR_PREFIX / db_name
    
    if not db_path.exists():
        db_path.mkdir(parents=True, exist_ok=True)
        
    try:
        
        
        # 1. Manage select property directories
        for prop_name, prop_meta in req.properties.items():
            meta = prop_meta if isinstance(prop_meta, dict) else {"type": prop_meta}
            if meta.get("type") == "select":
                # Ensure the subfolder exists in the DB folder
                source_path = db_path / prop_name
                source_path.mkdir(exist_ok=True)
                
        # 2. Perform bulk migration if renaming in all MD files
        if req.rename_from and req.rename_to:
            print(f"Renaming property '{req.rename_from}' to '{req.rename_to}' in {db_name}")
            for md_file in db_path.glob("*.md"):
                try:
                    with open(md_file, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    if content.startswith("---"):
                        end_idx = content.find("---", 3)
                        if end_idx != -1:
                            fm_str = content[3:end_idx]
                            fm_data = yaml.safe_load(fm_str)
                            if isinstance(fm_data, dict) and req.rename_from in fm_data:
                                fm_data[req.rename_to] = fm_data.pop(req.rename_from)
                                
                                import io
                                buf = io.StringIO()
                                yaml.dump(fm_data, buf)
                                new_content = f"---\n{buf.getvalue()}---{content[end_idx+3:]}"
                                with open(md_file, "w", encoding="utf-8") as f:
                                    f.write(new_content)
                except Exception as e:
                    print(f"Failed to migrate {md_file.name}: {e}")

        return {"success": True}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/vault/databases/{db_name}/{file_name}")
async def update_vault_row(db_name: str, file_name: str, req: UpdateRowRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    file_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name / file_name
    if not file_path.exists():
        if not file_name.endswith(".md"):
            file_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name / f"{file_name}.md"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        if content.startswith("---"):
            end_idx = content.find("---", 3)
            if end_idx != -1:
                frontmatter_str = content[3:end_idx]
                body_str = content[end_idx+3:]
                
                data = yaml.safe_load(frontmatter_str) or {}
                
                # Apply updates
                for k, v in req.properties.items():
                    data[k] = v

                # CLEANUP: Remove any system properties that might have sneaked in
                for k in ["last_synced", "last_edited_time", "last_edited_by", "created_time", "created_by", "file.name", "academic year", "completed"]:
                    if k in data: del data[k]

                import io
                buf = io.StringIO()
                yaml.dump(data, buf, Dumper=ObsidianDumper, allow_unicode=True, default_flow_style=False, sort_keys=False)
                new_frontmatter = buf.getvalue()

                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(f"---\n{new_frontmatter}---{body_str}")

                return {"success": True, "id": file_name, "properties": data}

        return {"success": False, "message": "No frontmatter found"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
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

        # In folder-driven mode, we don't look at bases for ID generation.
        # Future: infer ID generation from existing file patterns if needed.

        data = req.properties
        
        # CLEANUP: Remove any system properties
        for k in ["last_synced", "last_edited_time", "last_edited_by", "created_time", "created_by", "file.name", "links", "academic year", "completed"]:
            if k in data: del data[k]

        # Check for template content
        template_path = db_path / "_template.md"
        body_content = "\n\n"
        if template_path.exists():
            try:
                with open(template_path, "r", encoding="utf-8") as tf:
                    t_content = tf.read()
                    if t_content.startswith("---"):
                        end_idx = t_content.find("---", 3)
                        if end_idx != -1:
                            body_content = t_content[end_idx+3:]
                    else:
                        body_content = t_content
            except Exception as te:
                print(f"Template load failed for {db_name}: {te}")

        import io
        buf = io.StringIO()
        yaml.dump(data, buf, Dumper=ObsidianDumper, allow_unicode=True, default_flow_style=False, sort_keys=False)
        new_frontmatter = buf.getvalue()
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"---\n{new_frontmatter}---{body_content}")
            
        return {"success": True, "id": file_path.stem, "title": file_path.stem, "properties": data}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        print(f"Error creating {file_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class RenameRowRequest(BaseModel):
    new_name: str

@router.post("/vault/databases/{db_name}/{old_file_name}/rename")
async def rename_vault_row(db_name: str, old_file_name: str, req: RenameRowRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")

    db_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name
    
    old_file_path = db_path / f"{old_file_name}.md" if not old_file_name.endswith(".md") else db_path / old_file_name
    
    if not old_file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    safe_title = "".join([c for c in req.new_name if c.isalnum() or c in (' ', '-', '_')]).strip()
    if not safe_title:
        safe_title = "Untitled"
        
    new_file_name = f"{safe_title}.md"
    new_file_path = db_path / new_file_name
    
    counter = 1
    while new_file_path.exists() and new_file_path != old_file_path:
        new_file_name = f"{safe_title} ({counter}).md"
        new_file_path = db_path / new_file_name
        counter += 1

    try:
        if old_file_path.exists():
            import yaml
            from src.domains.obsidian.router import ObsidianDumper
            with open(old_file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            if content.startswith("---"):
                end_idx = content.find("---", 3)
                if end_idx != -1:
                    frontmatter_str = content[3:end_idx]
                    body_str = content[end_idx+3:]
                    data = yaml.safe_load(frontmatter_str) or {}
                    if "title" in data or True:  # always set title
                        data["title"] = req.new_name
                    import io
                    buf = io.StringIO()
                    yaml.dump(data, buf, Dumper=ObsidianDumper, allow_unicode=True, default_flow_style=False, sort_keys=False)
                    new_frontmatter = buf.getvalue()
                    with open(old_file_path, "w", encoding="utf-8") as f:
                        f.write(f"---\n{new_frontmatter}---{body_str}")
        
        old_file_path.rename(new_file_path)
        return {"success": True}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        print(f"Error renaming {old_file_name} to {new_file_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vault/databases/{db_name}/{file_name}")
async def delete_vault_row(db_name: str, file_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    file_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name / file_name
    if not file_path.exists():
        if not file_name.endswith(".md"):
            file_path = Path(secrets.vault_path) / DB_DIR_PREFIX / db_name / f"{file_name}.md"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        file_path.unlink()
        return {"success": True}
    except Exception as e:
        print(f"Error deleting {file_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class CreateFileRequest(BaseModel):
    path: str
    content: Optional[str] = ""
    overwrite: Optional[bool] = True

@router.post("/vault/files")
async def create_vault_file(req: CreateFileRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    try:
        full_path = resolve_vault_path(secrets.vault_path, req.path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if full_path.exists() and not req.overwrite:
        raise HTTPException(status_code=400, detail="File already exists")
    
    try:
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(req.content or "")
        return {"success": True, "path": req.path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateFolderRequest(BaseModel):
    path: str

@router.post("/vault/folders")
async def create_vault_folder(req: CreateFolderRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    try:
        full_path = resolve_vault_path(secrets.vault_path, req.path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    try:
        full_path.mkdir(parents=True, exist_ok=True)
        return {"success": True, "path": req.path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class MoveItemRequest(BaseModel):
    old_path: str
    new_path: str

@router.patch("/vault/items")
async def move_vault_item(req: MoveItemRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    try:
        old_full_path = resolve_vault_path(secrets.vault_path, req.old_path)
        new_full_path = resolve_vault_path(secrets.vault_path, req.new_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if not old_full_path.exists():
        raise HTTPException(status_code=404, detail="Source item not found")
    
    try:
        new_full_path.parent.mkdir(parents=True, exist_ok=True)
        old_full_path.rename(new_full_path)
        return {"success": True, "old_path": req.old_path, "new_path": req.new_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/vault/items")
async def delete_vault_item(path: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    try:
        full_path = resolve_vault_path(secrets.vault_path, path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Item not found")
    
    try:
        if full_path.is_file():
            full_path.unlink()
        else:
            shutil.rmtree(full_path)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vault/search")
async def find_vault_page(page_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    
    # 0. Try direct relative path first (if page_name is a path)
    direct_path = vault_root / page_name
    if direct_path.exists() and direct_path.is_file():
        return {
            "found": True,
            "type": "note" if direct_path.suffix == ".md" else "pdf",
            "path": direct_path.relative_to(vault_root).as_posix()
        }

    def find_case_insensitive(root: Path, pattern: str, recursive: bool = True):
        # pattern is like "file.md"
        # We want to match "FILE.md" or "file.MD"
        # Use rglob if recursive, else glob
        method = root.rglob if recursive else root.glob
        # Use [*] to make it more case-insensitive in glob is tricky, easier to just list and filter
        try:
            for item in method("*"):
                if item.is_file() and item.name.lower() == pattern.lower():
                    return item
        except Exception: pass
        return None

    # 1. Check for PDFs in common locations first (if it looks like a PDF)
    if page_name.lower().endswith('.pdf') or '.' not in page_name:
        stem = page_name[:-4] if page_name.lower().endswith('.pdf') else page_name
        target_pdf_name = f"{stem}.pdf"
        
        # Check in Inbox first (high priority)
        pdf_store = vault_root / "Inbox"
        if pdf_store.exists():
            # Try exact
            found = find_case_insensitive(pdf_store, target_pdf_name)
            if found:
                return {"found": True, "type": "pdf", "path": found.relative_to(vault_root).as_posix()}

    # 2. Search in 3-Database (prioritize database views)
    db_root = vault_root / DB_DIR_PREFIX
    if db_root.exists():
        for db_dir in db_root.iterdir():
            if db_dir.is_dir():
                target_md = f"{page_name}.md" if not page_name.endswith('.md') else page_name
                # Check within this specific database dir
                found = find_case_insensitive(db_dir, target_md, recursive=False)
                if found:
                    return {"found": True, "type": "database", "db_id": db_dir.name, "file_name": found.name, "path": found.relative_to(vault_root).as_posix()}

    # 3. Search everywhere else (targeted extensions first)
    # Search for .md
    target_md = f"{page_name}.md" if not page_name.lower().endswith('.md') else page_name
    found = find_case_insensitive(vault_root, target_md)
    if found:
        return {"found": True, "type": "note", "path": found.relative_to(vault_root).as_posix()}

    # Search for .pdf if not found yet
    if not page_name.lower().endswith('.pdf'):
        target_pdf = f"{page_name}.pdf"
        found = find_case_insensitive(vault_root, target_pdf)
        if found:
            return {"found": True, "type": "note", "path": found.relative_to(vault_root).as_posix()}

    # Finally try exact name (whatever it is) case-insensitive
    found = find_case_insensitive(vault_root, page_name)
    if found:
        return {"found": True, "type": "note", "path": found.relative_to(vault_root).as_posix()}
                
    return {"found": False}

@router.get("/vault/search-full")
async def search_vault_full(query: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Deep search across file names AND file content."""
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    vault_root = Path(secrets.vault_path)
    results = []
    query_low = query.lower()
    
    # 1. Search for matching paths (fast)
    for item in vault_root.rglob("*"):
        if any(p in item.parts for p in ['.trash', 'node_modules', '.git', '.obsidian']):
            continue
        
        rel_path = item.relative_to(vault_root).as_posix()
        if query_low in rel_path.lower():
            results.append(rel_path)
            continue
            
        # 2. Search for matching content in .md files
        if item.is_file() and item.suffix == ".md":
            try:
                # Read only first 50k to prevent hanging on huge files
                with open(item, "r", encoding="utf-8") as f:
                    content = f.read(50000)
                    if query_low in content.lower():
                        results.append(rel_path)
            except:
                continue
                
    return {"paths": list(set(results))}

@router.get("/vault/options")
async def get_property_options(source: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Returns a list of all markdown files in a given source folder path (relative to vault root).
    Used for populating select/relation dropdowns.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    try:
        source_path = resolve_vault_path(secrets.vault_path, source)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not source_path.exists():
        return {"options": []}
        
    options = []
    # Only look at immediate children
    for md_file in source_path.glob("*.md"):
        options.append(md_file.stem)
        
    return {"options": sorted(options)}

def sanitize_property_option_name(name: str) -> str:
    return "".join([c for c in name if c.isalnum() or c in (' ', '-', '_')]).strip()

@router.post("/vault/options")
async def create_property_option(req: CreateOptionRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Creates a new markdown file (option/relation) in the specified source folder.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    try:
        source_path = resolve_vault_path(secrets.vault_path, req.source)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not source_path.exists():
        source_path.mkdir(parents=True, exist_ok=True)
        
    # Sanitize name for filename
    safe_name = sanitize_property_option_name(req.name)
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid name")
        
    md_file = source_path / f"{safe_name}.md"
    if not md_file.exists():
        with open(md_file, "w") as f:
            f.write(f"---\ntitle: {req.name}\n---")
    return {"success": True, "name": req.name}

@router.patch("/vault/options")
async def update_property_option(req: CreateOptionRequest, old_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Renames an option (markdown file) in the source folder.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    try:
        source_path = resolve_vault_path(secrets.vault_path, req.source)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    safe_old_name = sanitize_property_option_name(old_name)
    safe_new_name = sanitize_property_option_name(req.name)
    if not safe_old_name or not safe_new_name:
        raise HTTPException(status_code=400, detail="Invalid name")

    old_file = source_path / f"{safe_old_name}.md"
    new_file = source_path / f"{safe_new_name}.md"
    
    if old_file.exists():
        old_file.rename(new_file)
        return {"success": True, "name": req.name}
    raise HTTPException(status_code=404, detail="Option not found")

@router.delete("/vault/options")
async def delete_property_option(source: str, name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Deletes an option (markdown file) from the source folder.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
    
    try:
        source_path = resolve_vault_path(secrets.vault_path, source)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    safe_name = sanitize_property_option_name(name)
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid name")

    md_file = source_path / f"{safe_name}.md"
    
    if md_file.exists():
        md_file.unlink()
        return {"success": True}
    raise HTTPException(status_code=404, detail="Option not found")

@router.post("/vault/databases")
async def create_vault_database(req: CreateDatabaseRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    db_name = req.name
    vault_root = Path(secrets.vault_path)
    db_path = vault_root / DB_DIR_PREFIX / db_name
    try:
        # 1. Create directory structure
        db_path.mkdir(parents=True, exist_ok=True)
            
        return {"success": True, "id": db_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/vault/databases/{db_name}")
async def delete_vault_database(db_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    db_path = vault_root / DB_DIR_PREFIX / db_name
    try:
        # Move to archive or delete?
        archive_path = vault_root / "database" / "12 - Archive" / f"{db_name}_{uuid.uuid4().hex[:4]}"
        if db_path.exists():
            archive_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(db_path), str(archive_path))
            
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vault/graph")
async def get_vault_graph(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    if not vault_root.exists():
        return {"nodes": [], "links": []}
        
    import re
    nodes = []
    links = []
    
    # regex to find unescaped wikilinks like [[Link]] or [[Link|Alias]]
    wiki_link_pattern = re.compile(r"\[\[(.*?)\]\]")
    re.compile(r"(?:^|\s)#([a-zA-Z0-9_\-\/]+)")
    
    # Store all path mappings for link resolution: stem -> relative path
    # Obsidian links are often just the file stem (e.g. "My Note" links to "subfolder/My Note.md")
    path_map = {}
    
    all_files = list(vault_root.rglob("*.md"))
    
    for f in all_files:
        if '.trash' in f.parts or 'node_modules' in f.parts:
            continue
        rel_path = f.relative_to(vault_root).as_posix()
        path_map[f.stem] = rel_path
        
        # Determine group from root-level folder 
        parts = f.relative_to(vault_root).parts
        group = parts[0] if len(parts) > 1 else "root"
        
        nodes.append({
            "id": rel_path,
            "name": f.stem,
            "val": 1, # default size
            "group": group
        })
        
    for f in all_files:
        if '.trash' in f.parts or 'node_modules' in f.parts:
            continue
        rel_path = f.relative_to(vault_root).as_posix()
        try:
            content = f.read_text(encoding="utf-8")
        except Exception:
            continue
            
        # Optional: extract tags and make them nodes too?
        # Let's keep it simple: file-to-file links
        links_found = wiki_link_pattern.findall(content)
        for link in links_found:
            # Handle aliases: [[Link|Alias]]
            target_name = link.split("|")[0].strip()
            
            # Remove header hash: [[Link#Header]]
            target_name = target_name.split("#")[0]
            
            if not target_name:
                continue
                
            # If we know this note, create a link
            if target_name in path_map:
                target_id = path_map[target_name]
                links.append({
                    "source": rel_path,
                    "target": target_id
                })
            else:
                # Ghost node for unresolved links
                target_id = f"unresolved://{target_name}"
                if target_name not in path_map:
                    path_map[target_name] = target_id
                    nodes.append({
                        "id": target_id,
                        "name": target_name,
                        "val": 0.5,
                        "group": "unresolved"
                    })
                links.append({
                    "source": rel_path,
                    "target": path_map[target_name]
                })
                
    # Deduplicate links
    unique_links = []
    seen_links = set()
    for link in links:
        key = f"{link['source']}->{link['target']}"
        if key not in seen_links:
            seen_links.add(key)
            unique_links.append(link)
            
    return {"nodes": nodes, "links": unique_links}


@router.get("/vault/backlinks")
async def get_vault_backlinks(page_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    import re
    # Match [[PageName]] or [[PageName|Alias]] or [[PageName#Header]]
    pattern = re.compile(rf"\[\[{re.escape(page_name)}(?:[|#].*?)?\]\]", re.IGNORECASE)
    
    backlinks = []
    for md_file in vault_root.rglob("*.md"):
        if '.trash' in md_file.parts or 'node_modules' in md_file.parts:
            continue
        try:
            # We only read the first 10k characters to speed up if notes are huge
            # Generally frontmatter and mentions are near the top or bottom
            content = md_file.read_text(encoding="utf-8")
            if pattern.search(content):
                # Calculate relative path
                rel_path = md_file.relative_to(vault_root).as_posix()
                # Check if it is a database file to give better UI info
                is_db = DB_DIR_PREFIX in rel_path
                backlinks.append({
                    "name": md_file.stem,
                    "path": rel_path,
                    "type": "database" if is_db else "note"
                })
        except Exception:
            continue
            
    return {"backlinks": backlinks}
    
def resolve_absolute_or_vault_path(decoded_path: str, effective_vault_path: Optional[str]) -> Optional[Path]:
    if effective_vault_path:
        vault_root = Path(effective_vault_path).resolve()
        candidate = Path(decoded_path)
        if not candidate.is_absolute() and decoded_path.startswith(vault_root.as_posix().lstrip("/") + "/"):
            try:
                return resolve_vault_path(vault_root, "/" + decoded_path)
            except ValueError:
                return None
        try:
            return resolve_vault_path(vault_root, decoded_path)
        except ValueError:
            return None
    return None

def to_vault_relative_url_path(resolved_path: Path, effective_vault_path: Optional[str]) -> str:
    if effective_vault_path:
        try:
            return resolved_path.resolve().relative_to(Path(effective_vault_path).resolve()).as_posix()
        except ValueError:
            pass
    return resolved_path.as_posix().lstrip("/")

@router.get("/obsidian/pdf-metadata/{path:path}")
async def get_pdf_metadata(
    path: str,
    vault_path: Optional[str] = None,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Returns total pages and dimensions for a PDF."""
    effective_vault_path = secrets.vault_path or vault_path
    decoded_path = unquote(path).replace("\\", "/")
    resolved_path = resolve_absolute_or_vault_path(decoded_path, effective_vault_path)
    
    if not resolved_path:
        raise HTTPException(status_code=400, detail="Invalid path")
        
    if not resolved_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        from pypdf import PdfReader
        reader = PdfReader(str(resolved_path))
        page = reader.pages[0]
        return {
            "page_count": len(reader.pages),
            "width": float(page.mediabox.width),
            "height": float(page.mediabox.height)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/obsidian/viewer/{path:path}")
async def get_pdf_viewer(
    path: str,
    vault_path: Optional[str] = None,
    page: int = 1,
    filter_pages: Optional[str] = None,
    theme: str = "light",
    sidecar_token: Optional[str] = Query(None),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Returns an HTML wrapper for the PDF that handles selection and scrolling locks using PDF.js."""
    effective_vault_path = secrets.vault_path or vault_path
    decoded_path = unquote(path).replace("\\", "/")
    resolved_path = resolve_absolute_or_vault_path(decoded_path, effective_vault_path)
    
    if not resolved_path:
        raise HTTPException(status_code=400, detail="Invalid path")
        
    if not resolved_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    resolved_str = to_vault_relative_url_path(resolved_path, effective_vault_path)
        
    auth_query = f"?vault_path={quote(effective_vault_path)}" if effective_vault_path else ""
    effective_token = sidecar_token
    if effective_token:
        auth_query += f"&sidecar_token={quote(effective_token)}" if auth_query else f"?sidecar_token={quote(effective_token)}"
        
    # Ensure the path is URL-encoded so spaces do not break pdf.js fetch requests
    pdf_src = f"/api/obsidian/serve/{quote(resolved_str)}{auth_query}"
    
    # Process filter pages
    filter_list_json = "null"
    if filter_pages:
        try:
            parts = [int(p.strip()) for p in filter_pages.split(',') if p.strip()]
            if parts:
                filter_list_json = json.dumps(parts)
        except Exception:
            pass

    # Theme-aware styles
    bg_color = "#0a0a0a" if theme == "dark" else "#ffffff"
    container_bg = "white" # Always white so it inverts correctly, or stays white in light mode
    
    # We apply the invert directly to the container in dark mode, NOT the body.
    # This ensures the margins/body stay pure #0a0a0a and the PDF page becomes dark.
    container_filter = "filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.1);" if theme == "dark" else ""
    selection_bg = "rgba(0, 120, 255, 0.4)" 

    html_content = f"""
    <!DOCTYPE html>
    <html class="{theme}">
    <head>
        <meta charset="UTF-8">
        <script src="/api/obsidian/assets/pdf.min.js"></script>
        <link rel="stylesheet" href="/api/obsidian/assets/pdf_viewer.min.css">
        <style>
            body, html {{ 
                margin: 0; padding: 0; width: 100%; height: 100%; 
                overflow: hidden; background: {bg_color}; 
                display: flex; align-items: center; justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }}
            #page-container {{
                position: relative;
                background: {container_bg};
                box-shadow: none;
                display: none; /* Hidden until rendered */
                margin: 0;
                {container_filter}
            }}
            canvas {{ 
                display: block; 
                pointer-events: none; /* Let clicks pass through to text layer */
            }}
            
            /* Enhanced Text Layer Styles */
            .textLayer {{
                position: absolute;
                text-align: initial;
                inset: 0;
                overflow: hidden;
                opacity: 1.0; 
                line-height: 1.0 !important;
                -webkit-text-size-adjust: none;
                text-size-adjust: none;
                forced-color-adjust: none;
                transform-origin: 0% 0% !important;
                z-index: 2;
                mix-blend-mode: multiply; /* Always multiply, the invert handles the dark mode */
                pointer-events: auto;
            }}
            
            .textLayer span {{
                color: transparent !important;
                background: none !important;
                position: absolute;
                white-space: pre !important;
                cursor: text;
                transform-origin: 0% 0% !important;
                pointer-events: auto;
                -webkit-user-select: text;
                user-select: text;
                line-height: 1.0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }}

            /* Custom selection color */
            .textLayer ::selection {{
                background: {selection_bg} !important;
                color: transparent !important;
            }}
            .textLayer span::selection {{
                background: {selection_bg} !important;
                color: transparent !important;
            }}
            
            #status {{
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                font-size: 10px; font-weight: 800; text-transform: uppercase;
                letter-spacing: 0.2em; color: #999;
            }}
            
            #filter-indicator {{
                position: fixed; top: 12px; right: 12px;
                background: rgba(0,0,0,0.85); color: white;
                font-size: 9px; font-weight: 800; text-transform: uppercase;
                letter-spacing: 0.15em; padding: 6px 12px; border-radius: 6px;
                z-index: 1000; display: none;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                align-items: center; gap: 6px;
            }}
            #filter-indicator svg {{ opacity: 0.7; }}
        </style>
    </head>
    <body>
        <div id="status">Loading Engine...</div>
        <div id="filter-indicator">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            <span>Surgical View</span>
        </div>
        <div id="page-container" style="position: relative; margin: 0 auto; display: none;">
            <canvas id="pdf-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
            <div id="text-layer" class="textLayer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div>
        </div>

        <script>
            const url = "{pdf_src}";
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/api/obsidian/assets/pdf.worker.min.js';

            let pdfDoc = null;
            let pageNum = {page};
            const filterList = {filter_list_json};
            
            const status = document.getElementById('status');
            const container = document.getElementById('viewer-container');
            const indicator = document.getElementById('filter-indicator');

            if (filterList && filterList.length > 0) {{
                indicator.style.display = 'flex';
                // Find nearest index if requested page is not exactly in list
                if (!filterList.includes(pageNum)) {{
                    const nearest = filterList.reduce((prev, curr) => 
                        Math.abs(curr - pageNum) < Math.abs(prev - pageNum) ? curr : prev
                    );
                    pageNum = nearest;
                }}
            }}

            async function renderPage(num) {{
                if (!pdfDoc) {{
                    pageNum = num;
                    return;
                }}
                const totalPages = pdfDoc.numPages;
                const targetPage = Math.max(1, Math.min(num, totalPages));
                pageNum = targetPage;
                try {{
                    const page = await pdfDoc.getPage(targetPage);
                    const baseViewportRef = page.getViewport({{ scale: 1.0 }});
                    
                    if (window.innerWidth === 0 || window.innerHeight === 0) return;
                    
                    const scaleX = window.innerWidth / baseViewportRef.width;
                    const scaleY = window.innerHeight / baseViewportRef.height;
                    const baseScale = Math.min(scaleX, scaleY);
                    
                    // High-DPI (Retina) support
                    const retinaScale = window.devicePixelRatio || 1;
                    
                    // 1. Generate Base Viewport (Logical Pixels)
                    const baseViewport = page.getViewport({{ scale: baseScale }});

                    // 2. Lock the DOM Container to Logical Pixels
                    const container = document.getElementById('page-container');
                    container.style.width = `${{baseViewport.width}}px`;
                    container.style.height = `${{baseViewport.height}}px`;

                    // 3. Configure Canvas for Retina (Physical Pixels)
                    const canvas = document.getElementById('pdf-canvas');
                    const context = canvas.getContext('2d');
                    // Attributes scale UP for retina sharpness
                    canvas.width = baseViewport.width * retinaScale;
                    canvas.height = baseViewport.height * retinaScale;

                    // 4. Render Canvas Visuals (Using the Transform Matrix)
                    // We use the baseViewport but scale the drawing matrix to match the retina canvas attributes
                    const renderContext = {{
                        canvasContext: context,
                        viewport: baseViewport, 
                        transform: [retinaScale, 0, 0, retinaScale, 0, 0] 
                    }};
                    
                    await page.render(renderContext).promise;

                    const textLayer = document.getElementById('text-layer');
                    textLayer.innerHTML = '';
                    
                    // 5. Render Text Layer (Strictly using Base logical pixels)
                    // Sync the text layer scale factor (critical for modern PDF.js)
                    textLayer.style.setProperty('--scale-factor', baseScale);
                    
                    const textContent = await page.getTextContent();
                    
                    await pdfjsLib.renderTextLayer({{
                        textContent: textContent,
                        container: textLayer,
                        viewport: baseViewport, // MUST use the baseViewport, NOT scaled
                        textDivs: []
                    }}).promise;

                    status.style.display = 'none';
                    container.style.display = 'block';
                    
                    // Notify parent of actual page change (for synchronization)
                    window.parent.postMessage({{ type: 'page_change', page: num }}, '*');
                }} catch (e) {{
                    status.innerText = "Processing Error: " + e.message;
                }}
            }}

            let resizeTimeout;
            window.addEventListener('resize', () => {{
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {{
                    if (pdfDoc) renderPage(pageNum);
                }}, 150); // Debounce to allow layout transitions to settle
            }});

            pdfjsLib.getDocument(url).promise.then(pdf => {{
                pdfDoc = pdf;
                status.innerText = "Rendering Page...";
                
                // If filtered, tell parent about the virtual page count
                if (filterList) {{
                    window.parent.postMessage({{ type: 'metadata', pageCount: filterList.length, isFiltered: true, filterList }}, '*');
                }}
                
                renderPage(pageNum);
            }}).catch(err => {{
                status.innerText = "Load Failed: " + err.message;
                window.parent.postMessage({{ type: 'error', message: err.message }}, '*');
            }});

            document.addEventListener('mouseup', (e) => {{
                const selection = window.getSelection().toString().trim();
                // Send selection and mouse coordinates to parent for positioning
                window.parent.postMessage({{ 
                    type: 'selection', 
                    text: selection,
                    mouseX: e.clientX,
                    mouseY: e.clientY
                }}, '*');
            }});

            const handleNavigate = (direction) => {{
                if (!filterList) {{
                    if (direction === 'next') {{
                        if (pageNum < pdfDoc.numPages) {{
                            pageNum++;
                            renderPage(pageNum);
                        }}
                    }} else {{
                        if (pageNum > 1) {{
                            pageNum--;
                            renderPage(pageNum);
                        }}
                    }}
                }} else {{
                    const idx = filterList.indexOf(pageNum);
                    if (direction === 'next') {{
                        if (idx < filterList.length - 1) {{
                            pageNum = filterList[idx+1];
                            renderPage(pageNum);
                        }}
                    }} else {{
                        if (idx > 0) {{
                            pageNum = filterList[idx-1];
                            renderPage(pageNum);
                        }}
                    }}
                }}
            }};

            window.addEventListener('message', (e) => {{
                if (e.data.type === 'navigate') {{
                    handleNavigate(e.data.direction);
                }} else if (e.data.type === 'jump') {{
                    pageNum = e.data.page;
                    renderPage(pageNum);
                }}
            }});

            window.addEventListener('keydown', (e) => {{
                if (e.key === 'ArrowRight') handleNavigate('next');
                if (e.key === 'ArrowLeft') handleNavigate('prev');
                window.parent.postMessage({{ type: 'keydown', key: e.key, isControlled: true }}, '*');
            }});
        </script>
    </body>
    </html>
    """
    return HTMLResponse(
        content=html_content, 
        headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"}
    )

@router.get("/obsidian/serve/{path:path}")
async def serve_obsidian_file(
    path: str, 
    vault_path: Optional[str] = None,
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Serves a file directly from the vault or absolute path (for PDFs, images, etc.)"""
    effective_vault_path = secrets.vault_path or vault_path
    decoded_path = unquote(path).replace("\\", "/")
    resolved_path = resolve_absolute_or_vault_path(decoded_path, effective_vault_path)
    
    if not resolved_path:
        raise HTTPException(status_code=400, detail="Invalid path")
        
    if not resolved_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {decoded_path}")
        
    return FileResponse(str(resolved_path))
