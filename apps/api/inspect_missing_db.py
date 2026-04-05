from src.domains.notion.client import NotionClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

# Try to find .env file
env_path = Path("apps/api/.env")
if not env_path.exists():
    env_path = Path(".env")

load_dotenv(env_path)

async def main():
    api_key = os.getenv("NOTION_API_KEY")
    if not api_key:
        print("NOTION_API_KEY not found")
        return
        
    client = NotionClient(api_key)
    db_id = "2a9219ed7519816fbcd9f1bcc9d3aa78"
    
    print(f"Inspecting database: {db_id}")
    try:
        data = await client.query_database(db_id, limit=1)
        if data:
            print("Database has data. First entry:")
            print(data[0].get("properties", {}).keys())
        else:
            print("Database is empty.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
