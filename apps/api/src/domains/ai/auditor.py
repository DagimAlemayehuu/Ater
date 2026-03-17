from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from src.domains.notion.client import NotionClient
from loguru import logger

class Auditor:
    """
    Agent for productivity audit and goal compliance.
    """
    def __init__(self, gemini_key: str, notion_key: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=gemini_key)
        self.notion = NotionClient(notion_key)
        self.model_id = model

    async def chat(self, query: str, history: Optional[List[Dict[str, Any]]] = None, context: str = "") -> str:
        """Processes a productivity or compliance audit."""
        
        # Gather context from Notion (Tasks, Goals, Habits)
        dbs = await self.notion.list_databases()
        notion_context: str = ""
        for db in dbs:
            title = db.get("title", [{}])[0].get("plain_text", "").lower()
            if any(k in title for k in ["task", "goal", "habit"]):
                results = await self.notion.query_database(db["id"], limit=20)
                notion_context = notion_context + f"Database '{title}': {results}\n"

        system_instruction = (
            "You are 'The Auditor', a high-fidelity performance analyst. Your objective is to audit "
            "the user's productivity, verify goal compliance, and identify behavioral bottlenecks. "
            "You analyze Notion logs to find discrepancies between stated goals and actual time allocation. "
            "Be cold, objective, and data-driven. Do not sugarcoat failures."
        )

        contents = []
        if history:
            for h in history:
                role = "user" if h["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h["content"])]))
        
        prompt = f"Data Context:\n{notion_context}\n\nUser Query: {query}"
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.1
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Auditor generation failed: {e}")
            return f"Audit error: {str(e)}"
