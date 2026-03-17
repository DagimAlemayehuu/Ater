from google import genai
from google.genai import types
from typing import List, Dict, Any, Optional
import json
import datetime

from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient
from src.domains.vault.client import VaultManager

GOALS_DB_ID = "2a9219ed-7519-815f-ac0f-ebfcd1dcd003"
# Placeholder for Habits DB ID - I'll use a generic one or search later
HABITS_DB_ID = "2a9219ed-7519-81bc-a083-d34e9e4f5a3e" 

class Coach:
    """
    Life OS Coach - Powered by Google Gemini.
    Focuses on habit formation, motivation, and goal calibration.
    Equipped with Habit Tracking and Goal Management tools.
    """

    def __init__(self, api_key: str, notion_key: Optional[str] = None, vault_path: Optional[str] = None):
        self.client = genai.Client(api_key=api_key)
        self.api_key = api_key
        self.notion_key = notion_key
        self.vault_path = vault_path

    async def _search_vault(self, query: str):
        """Searches the Obsidian vault for context."""
        if not self.vault_path: return "Error: Obsidian vault path not configured."
        try:
            vault_manager = VaultManager(self.vault_path, self.api_key)
            results = await vault_manager.search(query, limit=5)
            if not results: return "No relevant information found."
            return "\n---\n".join([f"Source: {r['path']}\nContent: {r['content']}" for r in results])
        except Exception as e:
            return f"Error searching vault: {str(e)}"

    async def _list_habits(self):
        """Retrieves current habits and their status from Notion."""
        if not self.notion_key: return "Error: Notion key not configured."
        client = NotionClient(self.notion_key)
        try:
            # We assume a database with Checkbox properties for days or a 'Status' property
            results = await client.query_database(HABITS_DB_ID)
            summary = []
            for page in results:
                props = page.get("properties", {})
                title = props.get("Name", {}).get("title", [{}])[0].get("plain_text", "Untitled")
                # This is a simplification; real habit DBs might have complex structures
                summary.append({"id": page["id"], "title": title})
            return json.dumps(summary)
        except Exception as e:
            return f"Error retrieving habits: {str(e)}"

    async def _list_goals(self):
        """Retrieves current goals from Notion."""
        if not self.notion_key: return "Error: Notion key not configured."
        client = NotionClient(self.notion_key)
        try:
            results = await client.query_database(GOALS_DB_ID)
            summary = []
            for page in results:
                props = page.get("properties", {})
                title = props.get("Name", {}).get("title", [{}])[0].get("plain_text", "Untitled")
                completed = props.get("Completed", {}).get("checkbox", False)
                summary.append({"id": page["id"], "title": title, "completed": completed})
            return json.dumps(summary)
        except Exception as e:
            return f"Error retrieving goals: {str(e)}"

    async def chat(self, query: str, context: Optional[str] = None, model: str = 'gemini-2.5-flash', history: Optional[List[Dict[str, str]]] = None) -> str:
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        system_instruction = f"""
        You are THE COACH, a high-performance habit architect and motivational strategist for Life OS.
        Current System Time: {now}.

        ### MISSION
        - Your goal is to ensure the user sticks to their habits and achieves their goals.
        - You use a combination of "Aggressive Accountability" and "Empathetic Calibration".
        - If the user fails, you don't judge; you analyze why the system failed and redesign the habit to be easier (Atomic Habits approach).

        ### OPERATIONAL RULES
        - No fluff. No generic motivation.
        - Focus on "Binary Inputs": Did you do X or not?
        - If habits are being missed, suggest "Reducing the Friction" or "Habit Stacking".
        - Conclude every session with a single "Ignition Task" (< 5 mins).

        ### TOOLS
        - list_habits: Check status of current habits.
        - list_goals: Check alignment with long-term goals.
        - search_vault: Retrieve personal context (Journal entries, "Why" statements).
        """

        tools = [self._list_habits, self._list_goals, self._search_vault]

        try:
            chat = self.client.aio.chats.create(
                model=model,
                history=history,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=tools,
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=False)
                )
            )
            response = await chat.send_message(query)
            return response.text
        except Exception as e:
            print(f"[Coach Agent] Error: {e}")
            return f"Coach encountered an error: {str(e)}"
