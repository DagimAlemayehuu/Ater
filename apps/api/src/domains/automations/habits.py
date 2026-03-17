from typing import Dict, Any
from src.domains.notion.client import NotionClient
from loguru import logger
from datetime import datetime

class HabitStreak:
    """
    Worker to validate habit completion and manage streaks.
    """
    def __init__(self, notion_key: str):
        self.notion = NotionClient(notion_key)

    async def run(self) -> Dict[str, Any]:
        """Calculates current habit streaks from Notion."""
        dbs = await self.notion.list_databases()
        habit_db_id = None
        for db in dbs:
            if "habit" in db.get("title", [{}])[0].get("plain_text", "").lower():
                habit_db_id = db["id"]
                break
        
        if not habit_db_id:
            return {"status": "error", "message": "No Habits database found."}

        # Query habits
        entries = await self.notion.query_database(habit_db_id, limit=50)
        
        summary = []
        for entry in entries:
            name = entry["properties"].get("Name", {}).get("title", [{}])[0].get("plain_text", "Unknown")
            streak = entry["properties"].get("Streak", {}).get("number", 0)
            last_done = entry["properties"].get("Last Done", {}).get("date", {}).get("start")
            
            # Simple logic: If not updated today, streak might be at risk
            today = datetime.now().strftime("%Y-%m-%d")
            status = "active" if last_done == today else "pending"
            
            summary.append({"habit": name, "streak": streak, "status": status})
            logger.info(f"Habit '{name}': Streak {streak} ({status})")

        return {
            "status": "success", 
            "habits": summary,
            "message": "Validated daily habit streaks."
        }
