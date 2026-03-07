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
            "Content-Type": "application/json"
        }

    async def list_pages(self, page_size: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieves a list of pages/databases accessible by the integration.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/search",
                headers=self.headers,
                json={"filter": {"value": "page", "property": "object"}, "page_size": page_size}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    async def list_databases(self, page_size: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieves a list of databases accessible by the integration.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/search",
                headers=self.headers,
                json={"filter": {"value": "database", "property": "object"}, "page_size": page_size}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    async def query_database(self, database_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Queries a specific Notion database for all its entries.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/databases/{database_id}/query",
                headers=self.headers,
                json={"page_size": limit}
            )
            response.raise_for_status()
            return response.json().get("results", [])

    async def get_page_content(self, page_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves the blocks (content) of a specific page.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/blocks/{page_id}/children",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json().get("results", [])

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
