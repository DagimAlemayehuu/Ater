import sqlite3
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import datetime

logger = logging.getLogger(__name__)

class NotionCacheService:
    """
    Local SQLite caching layer for Notion data.
    Provides 0ms latency for frontend dashboards.
    """
    def __init__(self, db_path: Optional[str] = None):
        if not db_path:
            home_dir = Path.home()
            self.db_dir = home_dir / ".lifeos" / "cache"
        else:
            self.db_dir = Path(db_path)
            
        self.db_dir.mkdir(parents=True, exist_ok=True)
        self.db_file = self.db_dir / "notion_cache.db"
        
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(str(self.db_file))

    def _init_db(self):
        """Initializes the SQLite tables."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Table for Database Metadata (Schemas)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notion_databases (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    schema_json TEXT,
                    last_synced TEXT
                )
            """)
            
            # Table for Page Data
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notion_pages (
                    id TEXT PRIMARY KEY,
                    database_id TEXT,
                    properties_json TEXT,
                    url TEXT,
                    last_synced TEXT,
                    FOREIGN KEY (database_id) REFERENCES notion_databases (id)
                )
            """)
            
            conn.commit()
        logger.info(f"Notion Cache initialized at {self.db_file}")

    def save_database(self, db_id: str, title: str, schema: Dict[str, Any]):
        """Saves or updates a database schema."""
        now = datetime.datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO notion_databases (id, title, schema_json, last_synced)
                VALUES (?, ?, ?, ?)
            """, (db_id, title, json.dumps(schema), now))
            conn.commit()

    def save_pages(self, database_id: str, pages: List[Dict[str, Any]]):
        """Saves a batch of pages for a specific database."""
        now = datetime.datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # First, we could optionally clear old pages for this DB or just upsert
            # For simplicity, we upsert.
            for page in pages:
                page_id = page.get("id")
                properties = page.get("properties", {})
                url = page.get("url", "")
                
                cursor.execute("""
                    INSERT OR REPLACE INTO notion_pages (id, database_id, properties_json, url, last_synced)
                    VALUES (?, ?, ?, ?, ?)
                """, (page_id, database_id, json.dumps(properties), url, now))
            
            conn.commit()

    def get_database(self, db_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a cached database schema."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, schema_json, last_synced FROM notion_databases WHERE id = ?", (db_id,))
            row = cursor.fetchone()
            if row:
                return {
                    "id": row[0],
                    "title": row[1],
                    "properties": json.loads(row[2]).get("properties", {}),
                    "last_synced": row[3]
                }
        return None

    def get_pages(self, db_id: str) -> List[Dict[str, Any]]:
        """Retrieves all cached pages for a database."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, properties_json, url, last_synced FROM notion_pages WHERE database_id = ?", (db_id,))
            rows = cursor.fetchall()
            
            return [
                {
                    "id": r[0],
                    "properties": json.loads(r[1]),
                    "url": r[2],
                    "last_synced": r[3]
                }
                for r in rows
            ]

    def get_page(self, page_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single cached page by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, properties_json, url, last_synced, database_id FROM notion_pages WHERE id = ?", (page_id,))
            row = cursor.fetchone()
            if row:
                return {
                    "id": row[0],
                    "properties": json.loads(row[1]),
                    "url": row[2],
                    "last_synced": row[3],
                    "database_id": row[4]
                }
        return None

    def get_all_databases(self) -> List[Dict[str, Any]]:
        """Lists all cached databases."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, last_synced FROM notion_databases")
            rows = cursor.fetchall()
            return [{"id": r[0], "title": r[1], "last_synced": r[2]} for r in rows]

    def delete_page(self, page_id: str):
        """Removes a page from the cache."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM notion_pages WHERE id = ?", (page_id,))
            conn.commit()
