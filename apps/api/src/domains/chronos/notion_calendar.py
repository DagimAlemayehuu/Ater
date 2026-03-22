from typing import List, Dict, Any
from apps.api.src.domains.notion.client import NotionClient
import asyncio
from datetime import datetime

class NotionCalendar:
    """
    Scans all accessible Notion databases for items with date properties.
    """
    def __init__(self, client: NotionClient):
        self.client = client

    async def get_all_events(self) -> List[Dict[str, Any]]:
        databases = await self.client.list_databases()
        all_events = []
        
        # Process databases in parallel
        tasks = [self._process_database(db) for db in databases]
        results = await asyncio.gather(*tasks)
        
        for events in results:
            all_events.extend(events)
            
        return all_events

    async def _process_database(self, db: Dict[str, Any]) -> List[Dict[str, Any]]:
        db_id = db["id"]
        db_title = db.get("title", [{}])[0].get("plain_text", "Untitled Database")
        properties = db.get("properties", {})
        
        # Find date properties
        date_props = [name for name, prop in properties.items() if prop["type"] == "date"]
        if not date_props:
            return []
            
        pages = await self.client.query_database(db_id)
        events = []
        
        for page in pages:
            page_props = page.get("properties", {})
            title_prop = next((p for p in page_props.values() if p["type"] == "title"), None)
            title = title_prop["title"][0]["plain_text"] if title_prop and title_prop["title"] else "Untitled"
            
            for prop_name in date_props:
                date_val = page_props[prop_name].get("date")
                if date_val:
                    events.append({
                        "id": page["id"],
                        "title": title,
                        "start": date_val["start"],
                        "end": date_val.get("end"),
                        "source": f"Notion: {db_title}",
                        "source_url": page["url"],
                        "property": prop_name,
                        "type": "notion"
                    })
        return events
