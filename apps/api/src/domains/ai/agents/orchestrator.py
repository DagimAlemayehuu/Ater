from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from src.domains.ai.agents.base_agent import BaseAgent
from src.domains.ai.agents.specialists import (
    NotionLibrarian, ObsidianScribe, ObsidianKnowledgeArchitect,
    ChronosChronometer, Scholar, WealthStrategist,
    GymCoach, DevOpsGuardian
)
from src.domains.ai.agents.tools import AgentTools
from src.api.deps import AppSecrets

class Orchestrator(BaseAgent):
    """
    Life OS Orchestrator (The Planner and Workforce Manager).
    """

    def __init__(self, secrets: AppSecrets, notion_key: Optional[str] = None, vault_path: Optional[str] = None):
        self.secrets = secrets
        self.notion_key = notion_key
        self.vault_path = vault_path
        
        # Initialize Backend Tools
        self.at = AgentTools(secrets, notion_key, vault_path)

        # Specialist instantiation
        self.notion_agent = NotionLibrarian(secrets, self._notion_tools())
        self.obsidian_agent = ObsidianScribe(secrets, self._obsidian_tools())
        self.oka_agent = ObsidianKnowledgeArchitect(secrets, self._oka_tools())
        self.chronos_agent = ChronosChronometer(secrets, self._chronos_tools())
        self.scholar_agent = Scholar(secrets, self._scholar_tools())
        self.wealth_agent = WealthStrategist(secrets, self._wealth_tools())
        self.gym_agent = GymCoach(secrets, self._gym_tools())
        self.devops_agent = DevOpsGuardian(secrets, self._devops_tools())

        # Orchestrator Delegation Tools
        @tool
        async def delegate_to_notion_librarian(task: str) -> str:
            """Delegates Notion database interactions, page updates, and metadata management."""
            return await self.notion_agent.run(task)

        @tool
        async def delegate_to_obsidian_scribe(task: str) -> str:
            """Delegates note creation, folder organization, and long-form writing in the vault."""
            return await self.obsidian_agent.run(task)

        @tool
        async def delegate_to_obsidian_knowledge_architect(task: str) -> str:
            """Delegates raw file ingestion and document deployment from the Inbox."""
            return await self.oka_agent.run(task)

        @tool
        async def delegate_to_chronos(task: str) -> str:
            """Delegates timeline management, calendar syncing, and deadline tracking."""
            return await self.chronos_agent.run(task)

        @tool
        async def delegate_to_scholar(task: str) -> str:
            """Delegates complex document analysis, technical summarization, and research retrieval."""
            return await self.scholar_agent.run(task)

        @tool
        async def delegate_to_wealth_strategist(task: str) -> str:
            """Delegates financial audits, budget tracking, and income/expense monitoring."""
            return await self.wealth_agent.run(task)

        @tool
        async def delegate_to_gym_coach(task: str) -> str:
            """Delegates workout frequency analysis, nutrition tracking, and health metrics monitoring."""
            return await self.gym_agent.run(task)

        @tool
        async def delegate_to_devops_guardian(task: str) -> str:
            """Delegates RAG index repair, system health monitoring, and monorepo maintenance."""
            return await self.devops_agent.run(task)

        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)

        persona = (
            "You are the Life OS Orchestrator (Master Planner).\n"
            "You manage an autonomous workforce of specialists: Notion Librarian, Obsidian Scribe, Obsidian Knowledge Architect, Chronos, Scholar, Wealth Strategist, Gym Coach, and DevOps Guardian.\n"            "RULES:\n"
            "1. PLAN BEFORE ACT: Every response MUST start with a 'STRATEGIC PLAN' section. Explain which agents you are calling.\n"
            "2. DELEGATE IMMEDIATELY: If you have enough info, include your STRATEGIC PLAN and call your specialist tools in the SAME turn to save time.\n"
            "3. NO REPETITION: Do not tell the user what you 'will' do. Tell them what you are doing or have done.\n"
            "4. DATA-DRIVEN: Use 'search_vault' to get context before assuming.\n"
            "5. NO emojis. NO conversational filler."
        )
        tools = [
            delegate_to_notion_librarian, delegate_to_obsidian_scribe,
            delegate_to_obsidian_knowledge_architect, delegate_to_chronos,
            delegate_to_scholar, delegate_to_wealth_strategist,
            delegate_to_gym_coach, delegate_to_devops_guardian,
            search_vault
        ]
        super().__init__(secrets, persona, tools, name="Orchestrator")

    def _notion_tools(self):
        @tool
        async def list_databases() -> str:
            """Lists all available Notion databases to find specific IDs."""
            return await self.at.get_notion_databases()
        @tool
        async def list_pages() -> str:
            """Lists/Searches for Notion pages."""
            return await self.at.list_notion_pages()
        @tool
        async def read_page_blocks(page_id: str) -> str:
            """Reads the content (blocks) of a specific Notion page."""
            return await self.at.read_notion_page_content(page_id)
        @tool
        async def append_content(page_id: str, markdown_text: str) -> str:
            """Appends content to a Notion page."""
            return await self.at.append_notion_content(page_id, markdown_text)
        @tool
        async def list_goals() -> str:
            """Lists current life goals from Notion."""
            return await self.at.list_notion_goals()
        @tool
        async def create_page(database_id: str, properties: Dict[str, Any]) -> str:
            """
            Creates a new page in a database. 
            'properties' MUST follow the Notion API schema.
            Example (Title only): {"Name": {"title": [{"text": {"content": "New Page Name"}}]}}
            Example (Title + Select): {"Name": {"title": [{"text": {"content": "Task"}}]}, "Status": {"select": {"name": "In Progress"}}}
            """
            return await self.at.create_page_in_database(database_id, properties)
        @tool
        async def update_page(page_id: str, properties: Dict[str, Any]) -> str:
            """Updates properties of a specific Notion page."""
            return await self.at.update_notion_page(page_id, properties)
        @tool
        async def archive_page(page_id: str) -> str:
            """Archives (deletes) a specific Notion page."""
            return await self.at.archive_notion_page(page_id)
        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)
        return [list_databases, list_pages, read_page_blocks, append_content, list_goals, create_page, update_page, archive_page, search_vault]

    def _obsidian_tools(self):
        @tool
        async def list_notes() -> str:
            """Lists all markdown files in the Obsidian vault."""
            return await self.at.list_obsidian_notes()
        @tool
        async def read_note(path: str) -> str:
            """Reads the full content of a specified markdown file."""
            return await self.at.read_note(path)
        @tool
        async def write_note(path: str, content: str) -> str:
            """Creates or overwrites a markdown file. Use this for all long-form note taking."""
            return await self.at.write_obsidian_note(path, content)
        @tool
        async def move_note(old_path: str, new_path: str) -> str:
            """Moves or renames a markdown file in the vault."""
            return await self.at.move_obsidian_note(old_path, new_path)
        @tool
        async def delete_note(path: str) -> str:
            """Deletes a markdown file from the vault."""
            return await self.at.delete_obsidian_note(path)
        @tool
        async def list_structure() -> str:
            """Lists the numbered folder structure of the vault."""
            return await self.at.list_vault_folders()
        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)
        return [list_notes, read_note, write_note, move_note, delete_note, list_structure, search_vault]

    def _oka_tools(self):
        @tool
        async def list_inbox() -> str:
            """Lists files waiting in the 05-Inbox folder."""
            return await self.at.list_inbox_files()
        @tool
        async def read_file(path: str) -> str:
            """Reads a file from the vault (including the inbox). Path should be relative to vault root."""
            return await self.at.read_note(path)
        @tool
        async def deploy_to_vault(path: str, content: str) -> str:
            """Deploys a processed note to the vault. Use this to move info from Inbox to structured folders."""
            return await self.at.write_obsidian_note(path, content)
        @tool
        async def delete_processed_file(path: str) -> str:
            """Deletes a file from the inbox after it has been successfully deployed."""
            return await self.at.delete_obsidian_note(path)
        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)
        return [list_inbox, read_file, deploy_to_vault, delete_processed_file, search_vault]

    def _chronos_tools(self):
        @tool
        async def get_calendar_events() -> str:
            """Combined view of all deadlines and events from Notion and System calendars."""
            return await self.at.get_calendar_events()
        @tool
        async def update_notion_deadline(page_id: str, properties: Dict[str, Any]) -> str:
            """Updates date/deadline properties in a Notion page."""
            return await self.at.update_notion_page(page_id, properties)
        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)
        return [get_calendar_events, update_notion_deadline, search_vault]

    def _scholar_tools(self):
        @tool
        async def search_scholar_vault(query: str) -> str:
            """Deep search across academic notes and research papers."""
            return await self.at.search_vault(f"Academic Research: {query}")
        @tool
        async def write_research_note(path: str, content: str) -> str:
            """Saves a structured research summary to the vault."""
            return await self.at.write_obsidian_note(path, content)
        return [search_scholar_vault, write_research_note]

    def _wealth_tools(self):
        @tool
        async def audit_finances() -> str:
            """Fetches recent transactions and budget alignment data."""
            return await self.at.query_finance_db()
        @tool
        async def update_budget(page_id: str, properties: Dict[str, Any]) -> str:
            """Updates financial records in Notion."""
            return await self.at.update_notion_page(page_id, properties)
        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)
        return [audit_finances, update_budget, search_vault]

    def _gym_tools(self):
        @tool
        async def log_workout(exercise: str, sets: int, reps: int, weight: float) -> str:
            """Logs a specific exercise set to the Workout Logger."""
            return await self.at.track_workout_log(exercise, sets, reps, weight)
        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)
        return [log_workout, search_vault]

    def _devops_tools(self):
        @tool
        async def repair_rag() -> str:
            """Forces a re-index of the knowledge base if search is failing."""
            return await self.at.repair_index()
        @tool
        async def search_vault(query: str) -> str:
            """Global semantic search across the entire knowledge vault (RAG)."""
            return await self.at.search_vault(query)
        return [repair_rag, search_vault]

    async def brainstorm(self, query: str, context: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None) -> str:
        input_text = f"User Request: {query}"
        if context: input_text += f"\nContext: {context}"
        return await self.run(input_text, history=history, max_iterations=12)
