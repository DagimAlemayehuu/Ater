from typing import List, Dict, Any
from apps.api.src.domains.chronos.google_calendar import GoogleCalendar
from apps.api.src.domains.chronos.notion_calendar import NotionCalendar
from apps.api.src.domains.notion.client import NotionClient
import asyncio

class ChronosService:
    def __init__(self, notion_key: str = None, google_token: str = None):
        self.notion_client = NotionClient(notion_key) if notion_key else None
        self.notion_calendar = NotionCalendar(self.notion_client) if self.notion_client else None
        self.google_calendar = GoogleCalendar(google_token) if google_token else None

    async def get_unified_timeline(self) -> List[Dict[str, Any]]:
        tasks = []
        if self.notion_calendar:
            tasks.append(self.notion_calendar.get_all_events())
        if self.google_calendar and self.google_calendar.is_connected():
            tasks.append(self.google_calendar.get_all_events())
            
        results = await asyncio.gather(*tasks) if tasks else []
        unified = []
        for events in results:
            unified.extend(events)
            
        # Sort by start time
        unified.sort(key=lambda x: x["start"] if x.get("start") else "9999-12-31")
        return unified

    async def get_status(self) -> Dict[str, Any]:
        channels = []
        if self.notion_client:
            channels.append({"name": "Notion Mirror", "status": "Active", "last_sync": "Automated"})
        else:
            channels.append({"name": "Notion Mirror", "status": "Disconnected", "last_sync": "Never"})
            
        if self.google_calendar and self.google_calendar.is_connected():
            channels.append({"name": "Google Calendar", "status": "Connected", "last_sync": "Active"})
        else:
            channels.append({"name": "Google Calendar", "status": "Disconnected", "last_sync": "Never"})
            
        return {
            "status": "Healthy" if any(c["status"] == "Active" or c["status"] == "Connected" for c in channels) else "Idle",
            "channels": channels
        }
