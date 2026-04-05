from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from src.domains.ai.agents.base_agent import BaseAgent
from src.domains.ai.agents.specialists import (
    NotionLibrarian, ObsidianScribe, ObsidianKnowledgeArchitect, Scholar
)
from src.domains.ai.agents.tools import AgentTools
from src.api.deps import AppSecrets

class Orchestrator(BaseAgent):
    """
    Life OS Orchestrator (The Master Architect).
    Optimized for CS students and AI Engineers.
    Uses Tiered Reasoning to manage rate limits efficiently.
    """

    def __init__(self, secrets: AppSecrets, notion_key: Optional[str] = None, vault_path: Optional[str] = None):
        self.secrets = secrets
        self.notion_key = notion_key
        self.vault_path = vault_path
        self.at = AgentTools(secrets, notion_key, vault_path)

        # Specialist Workforce (Consolidated)
        self.notion_agent = NotionLibrarian(secrets, self._notion_tools())
        self.obsidian_agent = ObsidianScribe(secrets, self._obsidian_tools())
        self.oka_agent = ObsidianKnowledgeArchitect(secrets, self._oka_tools())
        self.scholar_agent = Scholar(secrets, self._scholar_tools())

        @tool
        async def delegate_to_notion_librarian(task: str) -> str:
            """Handles all structured data: Task lists, Project trackers, Course syllabi in Notion."""
            return await self.notion_agent.run(task)

        @tool
        async def delegate_to_obsidian_scribe(task: str) -> str:
            """Handles markdown documentation, daily planning, and archival in the vault."""
            return await self.obsidian_agent.run(task)

        @tool
        async def delegate_to_oka(task: str) -> str:
            """Autonomous Ingestion: Processes files from Inbox and deploys them to the vault."""
            return await self.oka_agent.run(task)

        @tool
        async def delegate_to_scholar(task: str) -> str:
            """Deep Technical Intelligence: Analyzes code, complex RAG queries, and CS research."""
            return await self.scholar_agent.run(task)

        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)

        persona = (
            "You are the Life OS Master Orchestrator.\n"
            "Your mission: Provide ruthless efficiency for a CS student and AI Engineer.\n"
            "You manage 4 elite specialists: Notion Librarian, Obsidian Scribe, OKA, and Scholar.\n"
            "OPERATIONAL PROTOCOLS:\n"
            "1. TIERED REASONING: Use the Librarian for Notion data, the Scribe for Obsidian writes, OKA for file ingestion, and the Scholar for complex technical synthesis.\n"
            "2. STRATEGIC PLAN: Always start with a concise plan. Tell the user which specialists you are deploying.\n"
            "3. NO BLOAT: Be direct, technical, and accurate. Do not apologize for being brutal with efficiency.\n"
            "4. RAG FIRST: If the user asks about their own data, use 'search_vault' or 'delegate_to_scholar' immediately."
        )
        tools = [
            delegate_to_notion_librarian, delegate_to_obsidian_scribe,
            delegate_to_oka, delegate_to_scholar, search_vault
        ]
        super().__init__(secrets, persona, tools, name="Orchestrator")

    def _notion_tools(self):
        @tool
        async def list_databases() -> str:
            """Discovery Mode: Finds all Notion databases and their IDs."""
            return await self.at.get_notion_databases()
        @tool
        async def query_database(database_id: str, query: str = "") -> str:
            """Queries a specific database for items matching a search term."""
            return await self.at.query_database(database_id, query)
        @tool
        async def read_page(page_id: str) -> str:
            """Reads full content and properties of a Notion page."""
            return await self.at.read_notion_page_content(page_id)
        @tool
        async def create_task(database_id: str, title: str, status: str = "Todo") -> str:
            """Creates a new entry in a Notion database."""
            props = {"Name": {"title": [{"text": {"content": title}}]}}
            return await self.at.create_page_in_database(database_id, props)
        return [list_databases, query_database, read_page, create_task]

    def _obsidian_tools(self):
        @tool
        async def read_note(path: str) -> str:
            """Reads a specific markdown file."""
            return await self.at.read_note(path)
        @tool
        async def write_note(path: str, content: str) -> str:
            """Saves content to the vault."""
            return await self.at.write_obsidian_note(path, content)
        @tool
        async def list_vault_map() -> str:
            """Lists the entire vault folder structure for navigational context."""
            return await self.at.list_vault_folders()
        return [read_note, write_note, list_vault_map]

    def _oka_tools(self):
        @tool
        async def process_inbox() -> str:
            """Scans the Inbox and triggers the ingestion pipeline."""
            return await self.at.list_inbox_files()
        @tool
        async def move_to_vault(source_path: str, target_vault_path: str) -> str:
            """Finalizes ingestion by moving a file into its permanent vault location."""
            content = await self.at.read_note(source_path)
            await self.at.write_obsidian_note(target_vault_path, content)
            return await self.at.delete_obsidian_note(source_path)
        return [process_inbox, move_to_vault]

    def _scholar_tools(self):
        @tool
        async def deep_rag(query: str) -> str:
            """Performs heavy-duty semantic search with expanded context for CS research."""
            return await self.at.search_vault(query)
        return [deep_rag]

    async def brainstorm(self, query: str, context: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None) -> str:
        input_text = f"User Request: {query}"
        if context: input_text += f"\nContext: {context}"
        return await self.run(input_text, history=history, max_iterations=12)
