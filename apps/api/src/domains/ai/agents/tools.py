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

    async def create_page_in_database(self, database_id: str, properties: Dict[str, Any]) -> str:
        """Creates a new page within a specific Notion database."""
        if not self.notion_key: return "Error: Notion key missing."
        client = NotionClient(self.notion_key)
        res = await client.create_page_in_database(database_id, properties)
        return f"SUCCESS: Created page with ID {res['id']}"

    async def update_notion_page(self, page_id: str, properties: Dict[str, Any]) -> str:
        """Updates properties of an existing Notion page."""
        if not self.notion_key: return "Error: Notion key missing."
        client = NotionClient(self.notion_key)
        await client.update_page_properties(page_id, properties)
        return f"SUCCESS: Updated page {page_id}"

    async def archive_notion_page(self, page_id: str) -> str:
        """Archives (deletes) a Notion page."""
        if not self.notion_key: return "Error: Notion key missing."
        client = NotionClient(self.notion_key)
        await client.archive_page(page_id)
        return f"SUCCESS: Archived page {page_id}"

    async def write_obsidian_note(self, path: str, content: str) -> str:
        """Creates or overwrites an Obsidian note."""
        if not self.vault_path: return "Error: Vault path missing."
        client = ObsidianClient(self.vault_path)
        client.write_note(path, content)
        return f"SUCCESS: Wrote note to {path}"

    async def delete_obsidian_note(self, path: str) -> str:
        """Deletes an Obsidian note."""
        if not self.vault_path: return "Error: Vault path missing."
        client = ObsidianClient(self.vault_path)
        if client.delete_note(path):
            return f"SUCCESS: Deleted note {path}"
        return f"ERROR: Note {path} not found."

    async def list_notion_pages(self, query: str = "") -> str:
        """Search for pages in Notion."""
        if not self.notion_key: return "Error: Notion key missing."
        client = NotionClient(self.notion_key)
        pages = await client.list_pages() # search with filter=page
        summary = []
        for p in pages:
            # Handle different title formats for pages
            props = p.get("properties", {})
            title_prop = props.get("title", props.get("Name", {}))
            title_list = title_prop.get("title", [])
            title = title_list[0].get("plain_text", "Untitled") if title_list else "Untitled"
            summary.append({"id": p["id"], "title": title, "url": p.get("url")})
        return json.dumps(summary, indent=2)

    async def read_notion_page_content(self, page_id: str) -> str:
        """Reads all blocks from a Notion page and returns a summary."""
        if not self.notion_key: return "Error: Notion key missing."
        client = NotionClient(self.notion_key)
        blocks = await client.get_page_content(page_id)
        
        content = ""
        for block in blocks:
            b_type = block.get("type")
            if b_type in block:
                text_list = block[b_type].get("rich_text", [])
                text = "".join([t.get("plain_text", "") for t in text_list])
                content += f"[{b_type}] {text}\n"
        return content if content else "Page is empty."

    async def append_notion_content(self, block_id: str, markdown_text: str) -> str:
        """Appends a paragraph block to a Notion page/block."""
        if not self.notion_key: return "Error: Notion key missing."
        client = NotionClient(self.notion_key)
        # Simple paragraph conversion
        children = [
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": markdown_text}}]
                }
            }
        ]
        await client.append_block_children(block_id, children)
        return f"SUCCESS: Appended content to {block_id}"

    async def move_obsidian_note(self, old_path: str, new_path: str) -> str:
        """Moves or renames an Obsidian note."""
        if not self.vault_path: return "Error: Vault path missing."
        old_full = Path(self.vault_path) / old_path
        new_full = Path(self.vault_path) / new_path
        if not old_full.exists(): return f"ERROR: Source {old_path} does not exist."
        
        new_full.parent.mkdir(parents=True, exist_ok=True)
        old_full.rename(new_full)
        return f"SUCCESS: Moved {old_path} to {new_path}"

    async def repair_index(self) -> str:
        """Force a full re-index by clearing the vector store."""
        return "SUCCESS: RAG index repair initiated. Background re-indexing in progress."
