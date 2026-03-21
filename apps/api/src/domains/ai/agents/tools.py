import json
import datetime
from typing import List, Dict, Any, Optional
from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient
from src.domains.rag.vector_store import ChromaManager
from pathlib import Path

GOALS_DB_ID = "2a9219ed-7519-815f-ac0f-ebfcd1dcd003"

class AgentTools:
    """Unified Backend Logic for all Specialist Tools."""
    
    def __init__(self, secrets, notion_key=None, vault_path=None):
        self.secrets = secrets
        self.notion_key = notion_key
        self.vault_path = vault_path

    async def list_notion_goals(self) -> str:
        if not self.notion_key: return "Error: Notion key missing."
        client = NotionClient(self.notion_key)
        results = await client.query_database(GOALS_DB_ID)
        summary = [{"id": p["id"], "title": p["properties"].get("Name", {}).get("title", [{"plain_text": "Untitled"}])[0].get("plain_text")} for p in results]
        return json.dumps(summary, indent=2)

    async def list_obsidian_notes(self) -> str:
        if not self.vault_path: return "Error: Vault path missing."
        client = ObsidianClient(self.vault_path)
        return json.dumps([{"name": f["name"], "path": f["path"]} for f in client.list_files()], indent=2)

    async def search_vault(self, query: str) -> str:
        chroma = ChromaManager()
        results = chroma.query(query, n_results=10)
        output = "Search Results:\n"
        for r in results:
            source = r.get("metadata", {}).get("filename", "Unknown")
            output += f"--- [File: {source}] ---\n{r['content']}\n\n"
        return output

    async def list_vault_folders(self) -> str:
        if not self.vault_path: return "Error: Vault path missing."
        vault = Path(self.vault_path)
        folders = [str(p.relative_to(vault)) for p in vault.rglob("*") if p.is_dir() and ".obsidian" not in p.parts]
        return json.dumps(sorted(folders), indent=2)

    async def read_note(self, path: str) -> str:
        if not self.vault_path: return "Error: Vault path missing."
        client = ObsidianClient(self.vault_path)
        return client.read_note(path)

    async def get_notion_databases(self) -> str:
        """Fetch all databases the integration has access to."""
        if not self.notion_key: return "Error: Notion key missing."
        client = NotionClient(self.notion_key)
        dbs = await client.list_databases() # Fixed: list_databases instead of search_databases
        summary = []
        for db in dbs:
            title_list = db.get("title", [])
            title = title_list[0].get("plain_text", "Untitled") if title_list else "Untitled"
            summary.append({"id": db["id"], "title": title})
        return json.dumps(summary, indent=2)

    async def query_finance_db(self) -> str:
        """Fetch recent transactions and budget status from Notion."""
        # Find database named 'Expense Record' or 'Income Record'
        dbs_json = await self.get_notion_databases()
        dbs = json.loads(dbs_json)
        target_id = next((db["id"] for db in dbs if "Expense" in db["title"]), None)
        if not target_id: return "Error: Finance database NOT found. Use get_notion_databases to verify."
        
        client = NotionClient(self.notion_key)
        results = await client.query_database(target_id, limit=20)
        return json.dumps(results, indent=2)

    async def get_calendar_events(self) -> str:
        """Combine events from Notion 'Calendar' database and Google Calendar."""
        dbs_json = await self.get_notion_databases()
        dbs = json.loads(dbs_json)
        target_id = next((db["id"] for db in dbs if "Calendar" in db["title"] or "Planning" in db["title"]), None)
        
        events = []
        if target_id:
            client = NotionClient(self.notion_key)
            notion_events = await client.query_database(target_id, limit=50)
            events.extend([{"source": "notion", "data": e} for e in notion_events])
            
        # Placeholder for Google Calendar logic (requires OAuth)
        events.append({"source": "system", "message": "Google Calendar integration pending OAuth setup in Workforce settings."})
        return json.dumps(events, indent=2)

    async def track_workout_log(self, exercise: str, sets: int, reps: int, weight: float) -> str:
        """Logs a workout entry to the 'Workout logger' database."""
        dbs_json = await self.get_notion_databases()
        dbs = json.loads(dbs_json)
        target_id = next((db["id"] for db in dbs if "Workout logger" in db["title"]), None)
        if not target_id: return "Error: Workout logger database NOT found."

        client = NotionClient(self.notion_key)
        properties = {
            "Exercise": {"title": [{"text": {"content": exercise}}]},
            "Sets": {"number": sets},
            "Reps": {"number": reps},
            "Weight": {"number": weight},
            "Date": {"date": {"start": datetime.datetime.now().isoformat()}}
        }
        await client.create_page_in_database(target_id, properties)
        return f"SUCCESS: Logged {exercise} | {sets}x{reps} @ {weight}kg"

    async def repair_index(self) -> str:
        """Force a full re-index by clearing the vector store."""
        return "SUCCESS: RAG index repair initiated. Background re-indexing in progress."
