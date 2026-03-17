from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from src.domains.notion.client import NotionClient
from loguru import logger

class Financer:
    """
    Agent for expense analysis and budgeting.
    """
    def __init__(self, gemini_key: str, notion_key: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=gemini_key)
        self.notion = NotionClient(notion_key)
        self.model_id = model
        self.expense_db_id = None
        self.budget_db_id = None

    async def _ensure_db_ids(self):
        """Finds IDs for Expenses and Budget databases if not cached."""
        if self.expense_db_id and self.budget_db_id:
            return
            
        dbs = await self.notion.list_databases()
        for db in dbs:
            title = db.get("title", [{}])[0].get("plain_text", "").lower()
            if "expense" in title:
                self.expense_db_id = db["id"]
            elif "budget" in title:
                self.budget_db_id = db["id"]

    async def get_expenses(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Queries the expenses database."""
        await self._ensure_db_ids()
        if not self.expense_db_id:
            return []
        return await self.notion.query_database(self.expense_db_id, limit=limit)

    async def get_budgets(self) -> List[Dict[str, Any]]:
        """Queries the budget database."""
        await self._ensure_db_ids()
        if not self.budget_db_id:
            return []
        return await self.notion.query_database(self.budget_db_id)

    async def chat(self, query: str, history: Optional[List[Dict[str, Any]]] = None, context: str = "") -> str:
        """Processes a financer query."""
        
        # 1. Gather context
        expenses = await self.get_expenses(limit=50)
        budgets = await self.get_budgets()
        
        # 2. Format context for Gemini
        finance_context = f"Current Budgets: {budgets}\nRecent Expenses: {expenses}\n"
        if context:
            finance_context += f"Extra Context: {context}"

        system_instruction = (
            "You are 'The Financer', a ruthless fiscal optimization agent. Your goal is to identify waste, "
            "enforce budget limits, and ensure long-term wealth building. You have access to the user's "
            "Notion expense and budget records. Be direct, technical, and analytical. "
            "If a user is overspending, point it out immediately with numbers."
        )

        contents = []
        if history:
            for h in history:
                role = "user" if h["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h["content"])]))
        
        prompt = f"Context:\n{finance_context}\n\nUser Question: {query}"
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Financer generation failed: {e}")
            return f"Financial analysis error: {str(e)}"
