from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any, Optional
import os
import asyncio
import ruamel.yaml
import uuid
import datetime
import traceback
from pathlib import Path
from pydantic import BaseModel
import shutil
import io
import json
from fastapi.responses import StreamingResponse

from src.api.deps import AppSecrets, get_app_secrets
from src.domains.obsidian.client import ObsidianClient

router = APIRouter()

DB_DIR_PREFIX = "3-Database"

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

@router.get("/vault/databases")
async def list_vault_databases(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    db_path = vault_root / DB_DIR_PREFIX
    if not db_path.exists():
        return {"databases": []}
        
    databases = []
    yaml = ruamel.yaml.YAML(typ='safe', pure=True)
    
    for entry in db_path.iterdir():
        if entry.is_dir() and not entry.name.startswith("."):
            # 1. Try to load schema from .base file first for rich metadata
            schema = {}
            area = "Other"
            views = []
            base_file = vault_root / "0-Bases" / f"{entry.name}.base"
            if base_file.exists():
                try:
                    with open(base_file, "r", encoding="utf-8") as bf:
                        base_data = yaml.load(bf)
                        area = base_data.get("area", "Other")
                        views = base_data.get("views", [])
                        # Extract schema from columns definition of the active/first table view
                        for view in views:
                            if view.get("type") == "table":
                                for col in view.get("columns", []):
                                    if isinstance(col, dict):
                                        for k, v in col.items():
                                            if k not in schema:
                                                schema[k] = v
                except Exception as e:
                    print(f"Error reading .base file {base_file}: {e}")

            # 2. Augment/Deduce schema from .md files if base schema is incomplete
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
                                        if k in ["last_synced", "links", "title"]: continue
                                        if k not in schema:
                                            # Map python types to frontend-friendly type names
                                            new_type = 'list' if isinstance(v, list) else \
                                                     'bool' if isinstance(v, bool) else \
                                                     'int' if isinstance(v, int) else \
                                                     'float' if isinstance(v, float) else 'str'
                                            schema[k] = new_type
                except Exception:
                    pass
            
            databases.append({
                "id": entry.name,
                "name": entry.name.split(" - ")[-1] if " - " in entry.name else entry.name,
                "schema": schema,
                "area": area,
                "views": views,
                "type": "obsidian"
            })
            
    return {"databases": databases}

@router.get("/vault/areas")
async def list_vault_areas(secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    areas_path = vault_root / DB_DIR_PREFIX / "01 - Areas"
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
                    # Extract body content for deep search
                    body = ""
                    if content.startswith("---"):
                        end_idx = content.find("---", 3)
                        if end_idx != -1:
                            body = content[end_idx+3:].strip()
                    else:
                        body = content.strip()

                    # Inject file metadata if missing or as shadow props
                    stats = md_file.stat()
                    props["created_time"] = datetime.datetime.fromtimestamp(stats.st_ctime).isoformat()
                    props["last_edited_time"] = datetime.datetime.fromtimestamp(stats.st_mtime).isoformat()
                    
                    rows.append({
                        "id": md_file.name,
                        "title": md_file.stem,
                        "properties": props,
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
    base_file = vault_root / "0-Bases" / f"{db_name}.base"
    db_path = vault_root / DB_DIR_PREFIX / db_name
    
    if not base_file.exists():
        raise HTTPException(status_code=404, detail="Database configuration not found")
        
    try:
        yaml_in = ruamel.yaml.YAML(typ='safe')
        with open(base_file, "r", encoding="utf-8") as f:
            base_data = yaml_in.load(f)
            
        if not base_data:
            base_data = {"views": [{"type": "table", "name": "Table", "columns": []}]}
            
        # Construct new column list
        new_columns = [{"title": {"type": "title"}}]
        for prop_name, prop_meta in req.properties.items():
            # Normalize to dict if it is just a string (legacy format)
            normalized_meta = prop_meta if isinstance(prop_meta, dict) else {"type": prop_meta}
            if prop_name not in ["file.name", "title"]:
                new_columns.append({prop_name: normalized_meta})
            
            # If it's a new selective property, ensure its directory exists
            if normalized_meta.get("type") in ["select", "relation"] and normalized_meta.get("source"):
                source_path = vault_root / normalized_meta["source"]
                source_path.mkdir(parents=True, exist_ok=True)

        # Update base data
        found_table = False
        for view in base_data.get("views", []):
            if view.get("type") == "table":
                view["columns"] = new_columns
                found_table = True
        
        if not found_table:
             base_data["views"].append({
                "type": "table",
                "name": "Table",
                "columns": new_columns,
                "filters": {"and": [{"file.inFolder": f"{DB_DIR_PREFIX}/{db_name}"}]}
            })
                
        yaml_out = ruamel.yaml.YAML(typ='safe')
        with open(base_file, "w", encoding="utf-8") as f:
            yaml_out.dump(base_data, f)
            
        # 4. Perform bulk migration if renaming
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
                            fm_data = yaml_in.load(fm_str)
                            if isinstance(fm_data, dict) and req.rename_from in fm_data:
                                fm_data[req.rename_to] = fm_data.pop(req.rename_from)
                                
                                import io
                                buf = io.StringIO()
                                yaml_out.dump(fm_data, buf)
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
                data["last_edited_time"] = datetime.datetime.now().isoformat()
                data["last_edited_by"] = "LifeOs User"

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

        # Load schema to check for 'id' properties
        vault_root = Path(secrets.vault_path)
        base_file = vault_root / "0-Bases" / f"{db_name}.base"
        schema_props = {}
        if base_file.exists():
            with open(base_file, "r", encoding="utf-8") as bf:
                base_data = yaml.load(bf)
                # base_data["views"][0]["columns"] is a list of {name: meta}
                for col in base_data.get("views", [{}])[0].get("columns", []):
                    for k, v in col.items():
                        schema_props[k] = v

        data = req.properties
        
        # Handle ID Generation
        for prop_name, prop_meta in schema_props.items():
            if isinstance(prop_meta, dict) and prop_meta.get("type") == "id":
                if prop_name not in data or not data[prop_name]:
                    # Find max ID in existing files
                    max_id = 0
                    for md_file in db_path.glob("*.md"):
                        try:
                            with open(md_file, "r", encoding="utf-8") as f:
                                c = f.read()
                                if c.startswith("---"):
                                    idx = c.find("---", 3)
                                    if idx != -1:
                                        fm = yaml.load(c[3:idx])
                                        if fm and prop_name in fm:
                                            val = fm[prop_name]
                                            # handle TASK-123 or just 123
                                            if isinstance(val, (int, float)):
                                                max_id = max(max_id, int(val))
                                            elif isinstance(val, str):
                                                import re
                                                match = re.search(r'(\d+)', val)
                                                if match:
                                                    max_id = max(max_id, int(match.group(1)))
                        except: pass
                    
                    prefix = prop_meta.get("source", "").strip()
                    data[prop_name] = f"{prefix}{max_id + 1}" if prefix else max_id + 1

        now_iso = datetime.datetime.now().isoformat()
        data["last_synced"] = now_iso
        data["created_time"] = now_iso
        data["created_by"] = "LifeOs User"
        data["last_edited_time"] = now_iso
        data["last_edited_by"] = "LifeOs User"
        data["links"] = []
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
        yaml.dump(data, buf)
        new_frontmatter = buf.getvalue()
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"---\n{new_frontmatter}---{body_content}")
            
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

@router.get("/vault/options")
async def get_property_options(source: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Returns a list of all markdown files in a given source folder path (relative to vault root).
    Used for populating select/relation dropdowns.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    source_path = Path(secrets.vault_path) / source
    if not source_path.exists():
        return {"options": []}
        
    options = []
    # Only look at immediate children
    for md_file in source_path.glob("*.md"):
        options.append(md_file.stem)
        
    return {"options": sorted(options)}

@router.post("/vault/options")
async def create_property_option(req: CreateOptionRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Creates a new markdown file (option/relation) in the specified source folder.
    """
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    source_path = Path(secrets.vault_path) / req.source
    if not source_path.exists():
        source_path.mkdir(parents=True, exist_ok=True)
        
    # Sanitize name for filename
    safe_name = "".join([c for c in req.name if c.isalnum() or c in (' ', '-', '_')]).strip()
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid name")
        
    file_path = source_path / f"{safe_name}.md"
    if not file_path.exists():
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"---\ntitle: {safe_name}\n---\n\n")
            
            
    return {"success": True, "name": safe_name}

@router.post("/vault/databases")
async def create_vault_database(req: CreateDatabaseRequest, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    db_name = req.name
    vault_root = Path(secrets.vault_path)
    db_path = vault_root / DB_DIR_PREFIX / db_name
    base_file = vault_root / "0-Bases" / f"{db_name}.base"
    
    if db_path.exists():
        raise HTTPException(status_code=400, detail="Database folder already exists")
        
    try:
        # 1. Create directory structure
        db_path.mkdir(parents=True, exist_ok=True)
        (db_path / "_properties").mkdir(exist_ok=True)
        
        # 2. Create initial .base file
        yaml_out = ruamel.yaml.YAML(typ='safe')
        base_data = {
            "area": req.area or "Other",
            "views": [
                {
                    "type": "table",
                    "name": "Table",
                    "filters": {"and": [{"file.inFolder": f"{DB_DIR_PREFIX}/{db_name}"}]},
                    "columns": [
                        {"title": {"type": "title"}}
                    ]
                }
            ]
        }
        
        # Ensure 0-Bases exists
        base_file.parent.mkdir(parents=True, exist_ok=True)
        with open(base_file, "w", encoding="utf-8") as f:
            yaml_out.dump(base_data, f)
            
        return {"success": True, "id": db_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/vault/databases/{db_name}")
async def delete_vault_database(db_name: str, secrets: AppSecrets = Depends(get_app_secrets)):
    if not secrets.vault_path:
        raise HTTPException(status_code=401, detail="X-Vault-Path header missing")
        
    vault_root = Path(secrets.vault_path)
    db_path = vault_root / DB_DIR_PREFIX / db_name
    base_file = vault_root / "0-Bases" / f"{db_name}.base"
    
    try:
        # Move to archive or delete? For now, let us just remove the .base reference 
        # but keep the folder or move to 12-Archive.
        archive_path = vault_root / "3-Database" / "12 - Archive" / f"{db_name}_{uuid.uuid4().hex[:4]}"
        if db_path.exists():
            archive_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(db_path), str(archive_path))
            
        if base_file.exists():
            base_file.unlink()
            
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
    tags_pattern = re.compile(r"(?:^|\s)#([a-zA-Z0-9_\-\/]+)")
    
    # Store all path mappings for link resolution: stem -> relative path
    # Obsidian links are often just the file stem (e.g. "My Note" links to "subfolder/My Note.md")
    path_map = {}
    
    all_files = list(vault_root.rglob("*.md"))
    
    for f in all_files:
        if '.trash' in f.parts or 'node_modules' in f.parts:
            continue
        rel_path = str(f.relative_to(vault_root))
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
        rel_path = str(f.relative_to(vault_root))
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
                rel_path = str(md_file.relative_to(vault_root))
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
