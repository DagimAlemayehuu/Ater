import asyncio
import httpx

API_KEY = "ntn_g90249270019KNvPDGstaPYBp86V6zg3wlWkNBXk1pkgws"

async def list_databases():
    results = []
    has_more = True
    next_cursor = None
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        while has_more:
            payload = {
                "filter": {"value": "database", "property": "object"},
                "page_size": 100
            }
            if next_cursor:
                payload["start_cursor"] = next_cursor
                
            response = await client.post(
                "https://api.notion.com/v1/search",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            results.extend(data.get("results", []))
            
            has_more = data.get("has_more", False)
            next_cursor = data.get("next_cursor")
            
    print(f"Total databases fetched: {len(results)}")
    
    unique_dbs = {}
    for db in results:
        normalized_id = db["id"].replace("-", "")
        if normalized_id not in unique_dbs:
            title_arr = db.get("title", [])
            title = "".join(t.get("plain_text", "") for t in title_arr) if title_arr else "Untitled Database"
            unique_dbs[normalized_id] = title

    print(f"Unique databases: {len(unique_dbs)}")
    for i, (db_id, title) in enumerate(unique_dbs.items(), 1):
        print(f"{i}. {title} ({db_id})")

asyncio.run(list_databases())
