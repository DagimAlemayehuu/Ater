import os
import asyncio
import json
from dotenv import load_dotenv
from src.domains.notion.client import NotionClient

# Load secrets from apps/api/.env
load_dotenv()

async def discover():
    notion_key = os.getenv("NOTION_KEY")
    if not notion_key or "your_notion_key_here" in notion_key:
        print("ERROR: NOTION_KEY is missing or not set in apps/api/.env")
        return

    client = NotionClient(notion_key)
    print(f"Connecting to Notion...")
    
    try:
        # Search for all databases
        databases = await client.list_databases()
        
        if not databases:
            print("No databases found. Make sure you have shared the databases with your Integration in Notion.")
            return

        print(f"\n--- DISCOVERY COMPLETED: Found {len(databases)} Databases ---\n")
        
        for db in databases:
            db_id = db.get("id")
            title_list = db.get("title", [])
            title = title_list[0].get("plain_text", "Untitled") if title_list else "Untitled"
            
            print(f"DATABASE: {title}")
            print(f"ID: {db_id}")
            print("PROPERTIES:")
            
            properties = db.get("properties", {})
            for prop_name, prop_data in properties.items():
                prop_type = prop_data.get("type")
                print(f"  - {prop_name} ({prop_type})")
            
            print("-" * 30)

    except Exception as e:
        print(f"API ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(discover())
