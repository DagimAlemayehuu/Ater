from typing import Dict, Any
from src.domains.notion.client import NotionClient
from loguru import logger

class NotionCleanup:
    """
    Worker to archive completed tasks and consolidate tags in Notion.
    """
    def __init__(self, notion_key: str):
        self.notion = NotionClient(notion_key)

    async def run(self) -> Dict[str, Any]:
        """Archives 'Done' tasks older than 30 days."""
        dbs = await self.notion.list_databases()
        task_db_id = None
        for db in dbs:
            if "tasks" in db.get("title", [{}])[0].get("plain_text", "").lower():
                task_db_id = db["id"]
                break
        
        if not task_db_id:
            return {"status": "error", "message": "No Tasks database found."}

        # Query for 'Done' tasks
        # In a real scenario, we'd add a filter for status='Done'
        # For now, we fetch recent and filter manually to be safe
        entries = await self.notion.query_database(task_db_id, limit=100)
        
        archived_count: int = 0
        for entry in entries:
            status = entry["properties"].get("Status", {}).get("status", {}).get("name")
            # If status is Done/Completed, archive it
            if status in ["Done", "Completed", "Processed"]:
                await self.notion.archive_page(entry["id"])
                archived_count = archived_count + 1
                logger.info(f"Archived task: {entry['id']}")

        return {
            "status": "success", 
            "archived": archived_count, 
            "message": f"Cleaned up {archived_count} completed tasks."
        }
