import httpx
from typing import Dict, Any, List

class NotionClient:
    """
    Life OS Notion API Client.
    Synchronizes with the user's Notion workspace.
    """
    BASE_URL = "https://api.notion.com/v1"
    VERSION = "2022-06-28"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Notion-Version": self.VERSION,
        }

    async def list_databases(self) -> List[Dict[str, Any]]:
        """
        Retrieves all databases accessible by the integration using pagination.
        """
        results = []
        has_more = True
        next_cursor = None
        
        async with httpx.AsyncClient() as client:
            while has_more:
                payload = {
                    "filter": {"value": "database", "property": "object"},
                    "page_size": 100
                }
                if next_cursor:
                    payload["start_cursor"] = next_cursor
                    
                response = await client.post(
                    f"{self.BASE_URL}/search",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                results.extend(data.get("results", []))
                
                has_more = data.get("has_more", False)
                next_cursor = data.get("next_cursor")
                
            return results

    async def query_database(self, database_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Queries a specific Notion database for its entries.
        If limit is 0, it fetches all entries using pagination.
        """
        results = []
        has_more = True
        next_cursor = None
        
        async with httpx.AsyncClient() as client:
            while has_more:
                # Notion API page_size max is 100
                current_page_size = 100
                if limit != 0:
                    remaining = limit - len(results)
                    current_page_size = min(100, remaining)
                
                payload = {"page_size": current_page_size}
                if next_cursor:
                    payload["start_cursor"] = next_cursor
                    
                response = await client.post(
                    f"{self.BASE_URL}/databases/{database_id}/query",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                results.extend(data.get("results", []))
                
                has_more = data.get("has_more", False)
                next_cursor = data.get("next_cursor")
                
                if limit != 0 and len(results) >= limit:
                    break
                    
            return results[:limit] if limit != 0 else results

    async def get_page_content(self, page_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all blocks (content) of a specific page using pagination.
        """
        results = []
        has_more = True
        next_cursor = None
        
        async with httpx.AsyncClient() as client:
            while has_more:
                params = {"page_size": 100}
                if next_cursor:
                    params["start_cursor"] = next_cursor
                    
                response = await client.get(
                    f"{self.BASE_URL}/blocks/{page_id}/children",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                results.extend(data.get("results", []))
                
                has_more = data.get("has_more", False)
                next_cursor = data.get("next_cursor")
                
            return results

    async def update_page_properties(self, page_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates the properties of a specific Notion page.
        """
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.BASE_URL}/pages/{page_id}",
                headers=self.headers,
                json={"properties": properties}
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.json() if e.response.text else str(e)
                raise Exception(f"Notion API Error: {error_detail}")
            return response.json()
    async def create_page_in_database(self, database_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a new page within a specific Notion database.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/pages",
                headers=self.headers,
                json={"parent": {"database_id": database_id}, "properties": properties}
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.json() if e.response.text else str(e)
                raise Exception(f"Notion API Error: {error_detail}")
            return response.json()

    async def archive_page(self, page_id: str) -> Dict[str, Any]:
        """
        Archives (deletes) a Notion page by setting archived=true.
        """
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.BASE_URL}/pages/{page_id}",
                headers=self.headers,
                json={"archived": True}
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                error_detail = e.response.json() if e.response.text else str(e)
                raise Exception(f"Notion API Error: {error_detail}")
            return response.json()

    async def delete_block(self, block_id: str) -> Dict[str, Any]:
        """
        Deletes a specific block.
        """
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.BASE_URL}/blocks/{block_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def append_block_children(self, block_id: str, children: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Appends blocks to a page or a block.
        """
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.BASE_URL}/blocks/{block_id}/children",
                headers=self.headers,
                json={"children": children}
            )
            response.raise_for_status()
            return response.json()

    async def update_page_content(self, page_id: str, markdown: str) -> None:
        """
        Replaces the entire content of a page with the provided markdown text.
        It deletes all existing top-level blocks and appends new paragraph blocks.
        """
        # 1. Get existing blocks
        existing_blocks = await self.get_page_content(page_id)
        
        # 2. Delete existing blocks
        for block in existing_blocks:
            await self.delete_block(block["id"])
            
        # 3. Create new blocks from markdown
        if not markdown.strip():
            return
            
        paragraphs = markdown.split("\n\n")
        new_blocks = []
        
        for para in paragraphs:
            if not para.strip():
                continue
                
            # Handle Notion's 2000 char limit per rich_text block roughly
            chunk_size = 1900
            rich_texts = []
            for i in range(0, len(para), chunk_size):
                rich_texts.append({
                    "type": "text",
                    "text": {"content": para[i:i+chunk_size]}
                })
                
            new_blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": rich_texts
                }
            })
            
        # 4. Append new blocks (Max 100 blocks per request in Notion API)
        for i in range(0, len(new_blocks), 100):
            batch = new_blocks[i:i+100]
            await self.append_block_children(page_id, batch)

    async def get_database(self, database_id: str) -> Dict[str, Any]:
        """
        Retrieves metadata/schema for a specific database.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/databases/{database_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_page(self, page_id: str) -> Dict[str, Any]:
        """
        Retrieves a single Notion page.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/pages/{page_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def list_pages(self) -> List[Dict[str, Any]]:
        """
        Retrieves all pages accessible by the integration using pagination.
        """
        results = []
        has_more = True
        next_cursor = None
        
        async with httpx.AsyncClient() as client:
            while has_more:
                payload = {
                    "filter": {"value": "page", "property": "object"},
                    "page_size": 100
                }
                if next_cursor:
                    payload["start_cursor"] = next_cursor
                    
                response = await client.post(
                    f"{self.BASE_URL}/search",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                results.extend(data.get("results", []))
                
                has_more = data.get("has_more", False)
                next_cursor = data.get("next_cursor")
                
            return results
