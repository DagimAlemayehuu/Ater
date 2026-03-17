from google import genai
from google.genai import types
from typing import List, Dict, Any, Optional
import datetime
from pathlib import Path

from src.domains.notion.client import NotionClient
from src.domains.obsidian.client import ObsidianClient

TASKS_DB_ID = "2a9219ed-7519-813d-888e-c3358996fcba" # Placeholder for Tasks DB

class DailyBriefing:
    """
    Life OS Daily Briefing Automation.
    Aggregates data from Notion and Obsidian to generate a morning summary.
    """

    def __init__(self, gemini_api_key: str, notion_api_key: str, vault_path: str):
        self.genai_client = genai.Client(api_key=gemini_api_key)
        self.notion_client = NotionClient(notion_api_key)
        self.obsidian_client = ObsidianClient(vault_path)
        self.gemini_api_key = gemini_api_key

    async def generate(self) -> str:
        now = datetime.datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        
        # 1. Fetch Notion Tasks for today
        try:
            # Simplistic filter: tasks with Due Date = today or no due date
            tasks = await self.notion_client.query_database(TASKS_DB_ID, limit=50)
            task_list = []
            for t in tasks:
                props = t.get("properties", {})
                name = props.get("Name", {}).get("title", [{}])[0].get("plain_text", "Untitled")
                status = props.get("Status", {}).get("status", {}).get("name", "Unknown")
                task_list.append(f"- {name} [{status}]")
            notion_context = "\n".join(task_list) if task_list else "No tasks found for today."
        except Exception as e:
            notion_context = f"Error fetching Notion tasks: {str(e)}"

        # 2. Fetch Obsidian Daily Note
        daily_note_path = f"Daily/{date_str}.md"
        try:
            obsidian_content = self.obsidian_client.read_note(daily_note_path)
            if not obsidian_content:
                obsidian_content = "No daily note found for today."
        except Exception as e:
            obsidian_content = f"Error reading daily note: {str(e)}"

        # 3. Synthesize with Gemini
        prompt = f"""
        You are THE SCRIBE, responsible for the Life OS Daily Briefing.
        Current Date: {date_str}

        ### NOTION TASKS
        {notion_context}

        ### OBSIDIAN DAILY NOTE
        {obsidian_content}

        ### MISSION
        Generate a concise, high-impact morning briefing.
        1. **The Objective**: What is the single most important thing to do today?
        2. **The Landscape**: Brief summary of tasks and scheduled items.
        3. **The Friction**: Identify potential roadblocks based on the daily note.
        4. **Cognitive Load**: Evaluate if the user is overcommitted.

        Be technical, concise, and objective. No emojis.
        """

        try:
            response = await self.genai_client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"Briefing generation failed: {str(e)}"
