import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Tuple
from src.domains.notion.client import NotionClient

logger = logging.getLogger(__name__)

MACRO_CATEGORIES = [
    {
        'name': 'Personal',
        'groups': [
            { 'name': 'Planning', 'keywords': ['calendar', 'goals', 'projects', 'tasks', 'time block'] },
            { 'name': 'Finance', 'keywords': ['bank', 'expense', 'budget', 'income', 'transfer', 'finance'] },
            { 'name': 'Library', 'keywords': ['notes archive', 'summary archive', 'prompt library', 'library'] },
            { 'name': 'Fitness', 'keywords': ['muscle', 'exercises', 'workouts', 'workout logger', 'body measurements', 'fitness'] },
            { 'name': 'Kitchen', 'keywords': ['food', 'meals', 'ingredient', 'nutrition', 'shopping', 'groceries', 'daily tracker', 'journal', 'meal plan', 'kitchen'] },
        ]
    },
    {
        'name': 'Intellectual',
        'groups': [
            { 'name': 'Academic', 'keywords': ['courses', 'study planner', 'exams', 'assignments', 'crm', 'semesters', 'academic'] },
            { 'name': 'Skills', 'keywords': ['skills'] }
        ]
    }
]

class NotionMirrorService:
    """
    Pulls structured data from Notion Databases and writes them as 
    individual Markdown files (one per page) into categorized folders 
    in the Obsidian Vault. Includes YAML frontmatter and actual page content.
    """
    def __init__(self, notion_key: str, vault_path: str):
        self.client = NotionClient(notion_key)
        self.vault_path = Path(vault_path)
        self.mirror_dir = self.vault_path / "NotionMirror"
        
    def _categorize_database(self, title: str) -> Tuple[str, str]:
        """Returns (MacroCategory, Group) based on the database title."""
        t_lower = title.lower()
        for macro in MACRO_CATEGORIES:
            for group in macro['groups']:
                if any(kw in t_lower for kw in group['keywords']):
                    return macro['name'], group['name']
        return "Uncategorized", "General"

    async def sync_all_databases(self, status_callback=None):
        """
        Fetches all accessible databases, creates the folder structure, 
        and extracts all pages as individual markdown files.
        """
        logger.info("Starting Notion -> Obsidian Hierarchical Mirror Sync...")
        if status_callback:
            status_callback({"status": "syncing", "progress": 0, "total": 0, "message": "Fetching databases list..."})
            
        try:
            self.mirror_dir.mkdir(parents=True, exist_ok=True)
            databases = await self.client.list_databases()
            total_dbs = len(databases)
            
            if status_callback:
                status_callback({"status": "syncing", "progress": 0, "total": total_dbs, "message": f"Found {total_dbs} databases."})
            
            for i, db in enumerate(databases):
                db_id = db['id']
                db_title = db['title'][0]['plain_text'] if db['title'] else f"Database_{db_id}"
                safe_title = "".join([c for c in db_title if c.isalnum() or c in (' ', '-', '_')]).strip()
                
                macro, group = self._categorize_database(db_title)
                
                # e.g., Vault/NotionMirror/Personal/Planning/Tasks
                db_dir = self.mirror_dir / macro / group / safe_title
                db_dir.mkdir(parents=True, exist_ok=True)
                
                logger.info(f"Mirroring Database: {macro}/{group}/{safe_title}")
                if status_callback:
                    status_callback({"status": "syncing", "progress": i, "total": total_dbs, "message": f"Mirroring {safe_title}..."})
                    
                await self._sync_database_pages(db_id, db_dir)
                
            logger.info("✅ Notion -> Obsidian Mirror Sync Complete.")
            if status_callback:
                status_callback({"status": "completed", "progress": total_dbs, "total": total_dbs, "message": "Notion mirror sync complete."})
            return True
            
        except Exception as e:
            logger.error(f"Failed to sync Notion to mirror: {e}")
            if status_callback:
                status_callback({"status": "error", "message": f"Sync failed: {e}"})
            return False

    async def _sync_database_pages(self, db_id: str, db_dir: Path):
        """
        Queries a database, extracts properties for YAML, fetches block content, 
        and saves each page as a separate .md file.
        """
        try:
            results = await self.client.query_database(db_id, limit=100) 
        except Exception as e:
            logger.error(f"Failed to query database {db_id}: {e}")
            return
            
        pages = results if isinstance(results, list) else []

        for page in pages:
            try:
                props = page.get("properties", {})
                page_id = page['id']
                
                # Find the title
                title = "Untitled"
                for prop_name, prop_data in props.items():
                    if prop_data.get("type") == "title":
                        title_array = prop_data.get("title", [])
                        if title_array:
                            title = title_array[0].get("plain_text", "Untitled")
                        break
                
                # Sanitize filename (replace slashes to avoid accidental folder creation)
                safe_filename = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_', ',')]).strip()
                if not safe_filename: safe_filename = page_id
                file_path = db_dir / f"{safe_filename}.md"
                
                # 1. Build YAML Frontmatter
                yaml_content = "---\n"
                yaml_content += f'notion_id: "{page_id}"\n'
                yaml_content += f'notion_url: "{page.get("url", "")}"\n'
                
                for prop_name, prop_data in props.items():
                    if prop_data.get("type") == "title":
                        continue
                    val = self._extract_property_value(prop_data)
                    if val:
                        # Very basic escaping to avoid breaking YAML
                        safe_val = str(val).replace('"', '\\"').replace('\n', ' ')
                        yaml_content += f'{prop_name.lower().replace(" ", "_")}: "{safe_val}"\n'
                        
                yaml_content += "---\n\n"
                
                # 2. Fetch Actual Page Content (Blocks)
                try:
                    blocks = await self.client.get_page_content(page_id)
                    markdown_body = self._blocks_to_markdown(blocks)
                    # Small delay to respect rate limits during bulk syncs
                    await asyncio.sleep(0.1) 
                except Exception as e:
                    logger.warning(f"Could not fetch blocks for {title}: {e}")
                    markdown_body = f"\n> [Error: Could not fetch page content from Notion: {e}]"

                # 3. Write File
                final_content = yaml_content + f"# {title}\n\n" + markdown_body
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(final_content)
            except Exception as e:
                logger.error(f"Failed processing page {page.get('id')} in {db_dir.name}: {e}")

    def _blocks_to_markdown(self, blocks: List[Dict[str, Any]]) -> str:
        """Converts a list of Notion block objects into a raw Markdown string."""
        md = ""
        for block in blocks:
            b_type = block.get('type')
            content = block.get(b_type, {})
            if not content: continue
            
            rich_text = ""
            if 'rich_text' in content:
                rich_text = "".join([t.get("plain_text", "") for t in content.get("rich_text", [])])

            if b_type == 'paragraph':
                md += f"{rich_text}\n\n"
            elif b_type == 'heading_1':
                md += f"# {rich_text}\n\n"
            elif b_type == 'heading_2':
                md += f"## {rich_text}\n\n"
            elif b_type == 'heading_3':
                md += f"### {rich_text}\n\n"
            elif b_type == 'bulleted_list_item':
                md += f"- {rich_text}\n"
            elif b_type == 'numbered_list_item':
                md += f"1. {rich_text}\n"
            elif b_type == 'to_do':
                checked = "x" if content.get("checked") else " "
                md += f"- [{checked}] {rich_text}\n"
            elif b_type == 'code':
                lang = content.get('language', '')
                md += f"```{lang}\n{rich_text}\n```\n\n"
            elif b_type == 'quote':
                md += f"> {rich_text}\n\n"
            elif b_type == 'divider':
                md += "---\n\n"
            elif b_type == 'callout':
                icon = content.get('icon', {}).get('emoji', '')
                md += f"> {icon} {rich_text}\n\n"
        return md

    def _extract_property_value(self, prop_data: Dict[str, Any]) -> str:
        """Extracts a string representation from various Notion property types."""
        prop_type = prop_data.get("type")
        if not prop_type: return ""
            
        try:
            if prop_type == "rich_text":
                return "".join([t.get("plain_text", "") for t in prop_data.get("rich_text", [])])
            elif prop_type == "number":
                return str(prop_data.get("number", ""))
            elif prop_type == "select":
                select = prop_data.get("select")
                return select.get("name", "") if select else ""
            elif prop_type == "multi_select":
                return ", ".join([s.get("name", "") for s in prop_data.get("multi_select", [])])
            elif prop_type == "date":
                date_obj = prop_data.get("date")
                if not date_obj: return ""
                start = date_obj.get("start", "")
                end = date_obj.get("end", "")
                return f"{start} to {end}" if end else start
            elif prop_type == "checkbox":
                return "true" if prop_data.get("checkbox") else "false"
            elif prop_type == "url":
                return prop_data.get("url", "")
            elif prop_type == "formula":
                form = prop_data.get("formula", {})
                f_type = form.get("type")
                return str(form.get(f_type, ""))
            elif prop_type == "status":
                status = prop_data.get("status")
                return status.get("name", "") if status else ""
        except Exception:
            pass
            
        return ""