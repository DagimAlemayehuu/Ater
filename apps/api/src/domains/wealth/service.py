import json
import time
from pathlib import Path
from typing import Dict, Any, List
from src.domains.notion.client import NotionClient

class WealthService:
    def __init__(self, notion_key: str, vault_path: str = None):
        self.notion_key = notion_key
        self.vault_path = vault_path
        self.client = NotionClient(notion_key)
        
    async def get_status(self) -> Dict[str, Any]:
        """Returns dynamic status for Wealth Strategist."""
        # Find databases
        dbs = await self.client.list_databases()
        expense_db = next((db for db in dbs if "Expense" in db.get("title", [{}])[0].get("plain_text", "")), None)
        income_db = next((db for db in dbs if "Income" in db.get("title", [{}])[0].get("plain_text", "")), None)
        
        transactions = []
        net_position = 0.0
        monthly_delta = 0.0
        
        if expense_db:
            expenses = await self.client.query_database(expense_db["id"], limit=10)
            for e in expenses:
                props = e.get("properties", {})
                amount = props.get("Amount", {}).get("number", 0.0)
                date = props.get("Date", {}).get("date", {}).get("start", "No Date")
                desc = props.get("Name", {}).get("title", [{}])[0].get("plain_text", "Untitled")
                transactions.append({"date": date, "desc": desc, "amount": f"-${amount:,.2f}"})
                net_position -= amount

        if income_db:
            income = await self.client.query_database(income_db["id"], limit=10)
            for i in income:
                props = i.get("properties", {})
                amount = props.get("Amount", {}).get("number", 0.0)
                date = props.get("Date", {}).get("date", {}).get("start", "No Date")
                desc = props.get("Name", {}).get("title", [{}])[0].get("plain_text", "Untitled")
                transactions.append({"date": date, "desc": desc, "amount": f"+${amount:,.2f}"})
                net_position += amount
                
        # Sort transactions by date
        transactions.sort(key=lambda x: x["date"], reverse=True)
        transactions = transactions[:15]

        # Net position would actually be an aggregation over all records, but for status we show a placeholder or sum context
        return {
            "net_position": f"${net_position:,.2f}",
            "monthly_delta": f"{'+' if net_position >= 0 else ''}${net_position:,.2f}",
            "savings_rate": "15%", # Hardcoded for now
            "burn_rate": "$2,100.00", # Hardcoded for now
            "recent_transactions": transactions if transactions else [
                {"date": "2026-03-21", "desc": "Ledger Synchronized", "amount": "Ready"}
            ]
        }
