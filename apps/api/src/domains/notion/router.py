from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any, Optional
from src.api.deps import AppSecrets, get_app_secrets
from src.domains.notion.client import NotionClient
from src.domains.notion.cache_service import NotionCacheService

router = APIRouter(prefix="/notion", tags=["notion"])
cache = NotionCacheService()

@router.get("/databases")
async def list_cached_databases():
    """Returns a list of all locally cached databases."""
    return cache.get_all_databases()

@router.get("/databases/{database_id}")
async def get_database_data(database_id: str, force_sync: bool = False, secrets: AppSecrets = Depends(get_app_secrets)):
    """
    Returns the schema and rows for a specific database.
    If not in cache or force_sync=True, it fetches from Notion API first.
    """
    db_meta = cache.get_database(database_id)
    
    if not db_meta or force_sync:
        if not secrets.notion_key:
            raise HTTPException(status_code=400, detail="Notion API Key required for sync")
        
        client = NotionClient(secrets.notion_key)
        # Fetch Schema
        schema = await client.get_database(database_id)
        title_list = schema.get("title", [])
        title = title_list[0].get("plain_text", "Untitled") if title_list else "Untitled"
        cache.save_database(database_id, title, schema)
        
        # Fetch Pages
        pages = await client.query_database(database_id, limit=0) # Fetch all
        cache.save_pages(database_id, pages)
        
        db_meta = cache.get_database(database_id)

    pages = cache.get_pages(database_id)
    
    return {
        "metadata": db_meta,
        "rows": pages
    }

@router.post("/databases/{database_id}/sync")
async def sync_database(database_id: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Forcefully syncs a specific database from Notion to the local cache."""
    if not secrets.notion_key:
        raise HTTPException(status_code=400, detail="Notion API Key required")
    
    client = NotionClient(secrets.notion_key)
    schema = await client.get_database(database_id)
    title_list = schema.get("title", [])
    title = title_list[0].get("plain_text", "Untitled") if title_list else "Untitled"
    cache.save_database(database_id, title, schema)
    
    pages = await client.query_database(database_id, limit=0)
    cache.save_pages(database_id, pages)
    
    return {"success": True, "message": f"Synced {len(pages)} rows for {title}"}

@router.post("/databases/{database_id}/pages")
async def create_notion_page(
    database_id: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Creates a new page in a Notion database."""
    if not secrets.notion_key:
        raise HTTPException(status_code=400, detail="Notion API Key required")
    
    client = NotionClient(secrets.notion_key)
    try:
        properties = payload.get("properties", {})
        new_page = await client.create_page_in_database(database_id, properties)
        # Update local cache
        cache.save_pages(database_id, [new_page])
        return {"success": True, "page": new_page}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pages/{page_id}")
async def get_notion_page(page_id: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Retrieves a single Notion page from cache or API."""
    page = cache.get_page(page_id)
    if not page:
        if not secrets.notion_key:
            raise HTTPException(status_code=400, detail="Notion API Key required")
        client = NotionClient(secrets.notion_key)
        try:
            page = await client.get_page(page_id)
            db_id = page.get("parent", {}).get("database_id")
            if db_id:
                cache.save_pages(db_id, [page])
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return page

@router.delete("/pages/{page_id}")
async def delete_notion_page(page_id: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Archives (deletes) a Notion page."""
    if not secrets.notion_key:
        raise HTTPException(status_code=400, detail="Notion API Key required")
    
    client = NotionClient(secrets.notion_key)
    try:
        await client.archive_page(page_id)
        # Remove from local cache immediately
        cache.delete_page(page_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/pages/{page_id}")
async def update_page_properties(
    page_id: str, 
    properties: Dict[str, Any] = Body(...), 
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Updates properties of a Notion page and refreshes the local cache."""
    if not secrets.notion_key:
        raise HTTPException(status_code=400, detail="Notion API Key required")
    
    client = NotionClient(secrets.notion_key)
    try:
        # 1. Update in Notion
        updated_page = await client.update_page_properties(page_id, properties)
        
        # 2. Update local cache
        db_id = updated_page.get("parent", {}).get("database_id")
        if db_id:
            cache.save_pages(db_id, [updated_page])
            
        return {"success": True, "page": updated_page}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pages/{page_id}/content")
async def get_page_content(page_id: str, secrets: AppSecrets = Depends(get_app_secrets)):
    """Gets the blocks of a page."""
    if not secrets.notion_key:
        raise HTTPException(status_code=400, detail="Notion API Key required")
    client = NotionClient(secrets.notion_key)
    try:
        blocks = await client.get_page_content(page_id)
        return {"blocks": blocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/pages/{page_id}/content")
async def update_page_content(
    page_id: str, 
    payload: Dict[str, Any] = Body(...), 
    secrets: AppSecrets = Depends(get_app_secrets)
):
    """Updates the content of a Notion page."""
    if not secrets.notion_key:
        raise HTTPException(status_code=400, detail="Notion API Key required")
    client = NotionClient(secrets.notion_key)
    try:
        markdown = payload.get("markdown", "")
        await client.update_page_content(page_id, markdown)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
