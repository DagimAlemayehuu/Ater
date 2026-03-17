from typing import List, Dict, Any
from google import genai
from google.genai import types
from src.domains.notion.client import NotionClient
from loguru import logger

class ExpenseCategorizer:
    """
    Automation worker to auto-categorize expenses in Notion.
    """
    def __init__(self, gemini_key: str, notion_key: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=gemini_key)
        self.notion = NotionClient(notion_key)
        self.model_id = model
        self.expense_db_id = None

    async def _find_expense_db(self):
        if self.expense_db_id:
            return
        dbs = await self.notion.list_databases()
        for db in dbs:
            title = db.get("title", [{}])[0].get("plain_text", "").lower()
            if "expense" in title:
                self.expense_db_id = db["id"]

    async def run(self) -> Dict[str, Any]:
        """Scans for uncategorized expenses and labels them."""
        await self._find_expense_db()
        if not self.expense_db_id:
            return {"status": "error", "message": "No 'Expenses' database found in Notion."}

        # Fetch recent entries
        entries = await self.notion.query_database(self.expense_db_id, limit=50)
        
        uncategorized = []
        for entry in entries:
            props = entry.get("properties", {})
            category = props.get("Category", {}).get("select") or props.get("Category", {}).get("multi_select")
            if not category or (isinstance(category, list) and len(category) == 0):
                uncategorized.append(entry)

        if not uncategorized:
            return {"status": "success", "processed": 0, "message": "No uncategorized expenses found."}

        processed = 0
        for entry in uncategorized:
            name = entry["properties"].get("Name", {}).get("title", [{}])[0].get("plain_text", "Unknown")
            amount = entry["properties"].get("Amount", {}).get("number", 0)
            
            # Predict category
            category = await self._predict_category(name, amount)
            
            # Update Notion
            await self.notion.update_page_properties(entry["id"], {
                "Category": {"select": {"name": category}}
            })
            processed += 1
            logger.info(f"Categorized '{name}' (${amount}) as '{category}'")

        return {"status": "success", "processed": processed, "message": f"Successfully categorized {processed} expenses."}

    async def _predict_category(self, merchant: str, amount: float) -> str:
        """Uses Gemini to guess the category."""
        prompt = (
            f"Predict the single best expense category for the following transaction:\n"
            f"Merchant: {merchant}\n"
            f"Amount: ${amount}\n\n"
            f"Possible categories: Food, Transport, Utilities, Entertainment, Subscriptions, Health, Shopping, Misc.\n"
            f"Return ONLY the category name. No other text."
        )
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.0)
            )
            return response.text.strip()
        except:
            return "Misc"
