import logging
import asyncio
import re
from pathlib import Path
from typing import Dict, Any, List, Tuple
from src.domains.notion.client import NotionClient

logger = logging.getLogger(__name__)

MACRO_CATEGORIES = [
    {
        'name': '1-Personal',
        'groups': [
            { 'name': '1-Planning', 'keywords': ['calendar', 'goals', 'projects', 'tasks', 'time block'] },
            { 'name': '2-Finance', 'keywords': ['bank', 'expense', 'budget', 'income', 'transfer', 'finance'] },
            { 'name': '3-Library', 'keywords': ['notes archive', 'summary archive', 'prompt library', 'library'] },
            { 'name': '4-Fitness', 'keywords': ['muscle', 'exercises', 'workouts', 'workout logger', 'body measurements', 'fitness'] },
            { 'name': '5-Kitchen', 'keywords': ['food', 'meals', 'ingredient', 'nutrition', 'shopping', 'groceries', 'daily tracker', 'journal', 'meal plan', 'kitchen'] },
        ]
    },
    {
        'name': '2-Intellectual',
        'groups': [
            { 'name': '1-Skills', 'keywords': ['skills'] },
            { 'name': '2-Resources', 'keywords': ['resources', 'references'] }
        ]
    }
]

# Academic Database IDs for hierarchy resolution
DB_SEMESTERS = "2a9219ed-7519-8106-8a97-dfdc9c88911b"
DB_COURSES = "2a9219ed-7519-817e-aedb-da156d06134c"
DB_STUDY_PLANNER = "2a9219ed-7519-81e2-81f8-de21e47c26fc"

class NotionMirrorService:
    """
    Pulls structured data from Notion Databases and writes them as 
    individual Markdown files into categorized folders in the Obsidian Vault.
    Strictly follows a 0-, 1- numbering system and hierarchical academic structure.
    """
    def __init__(self, notion_key: str, vault_path: str):
        self.client = NotionClient(notion_key)
        self.vault_path = Path(vault_path)
        # Root folders as requested
        self.meta_dir = self.vault_path / "0-Meta"
        self.mirror_dir = self.vault_path / "1-NotionMirror"
        self.academic_dir = self.vault_path / "2-Academic"
        self._title_cache = {} # page_id -> title
        
    def _categorize_database(self, title: str) -> Tuple[str, str, bool]:
        """Returns (MacroCategory, Group, IsAcademic) based on the database title."""
        t_lower = title.lower()
        
        # Academic is handled separately at the root level now
        academic_keywords = ['courses', 'study planner', 'exams', 'assignments', 'crm', 'semesters', 'academic']
        if any(kw in t_lower for kw in academic_keywords):
            return "2-Academic", "Strictly-School", True

        for macro in MACRO_CATEGORIES:
            for group in macro['groups']:
                if any(kw in t_lower for kw in group['keywords']):
                    return macro['name'], group['name'], False
        return "9-Uncategorized", "General", False

    def _sanitize_path_segment(self, name: str) -> str:
        """Removes emojis and special characters for clean folder names."""
        # Remove emojis (very basic regex)
        no_emoji = re.sub(r'[^\w\s\-\.\(\)\[\]]', '', name)
        # Collapse multiple spaces
        clean = " ".join(no_emoji.split())
        return "".join([c for c in clean if c.isalnum() or c in (' ', '-', '_')]).strip()

    async def _get_page_title(self, page_id: str) -> str:
        if not page_id: return "Unknown"
        if page_id in self._title_cache:
            return self._title_cache[page_id]
        
        try:
            page = await self.client.get_page(page_id)
            props = page.get("properties", {})
            title = "Untitled"
            for p in props.values():
                if p.get("type") == "title":
                    title_arr = p.get("title", [])
                    if title_arr:
                        title = title_arr[0].get("plain_text", "Untitled")
                    break
            self._title_cache[page_id] = title
            return title
        except Exception:
            return "Unknown"

    async def sync_all_databases(self, status_callback=None):
        """
        Fetches all accessible databases and mirrors them with strict numbering.
        """
        logger.info("Starting Notion -> Obsidian Hierarchical Mirror Sync...")
        if status_callback:
            status_callback({"status": "syncing", "progress": 0, "total": 0, "message": "Fetching databases list..."})
            
        try:
            self.mirror_dir.mkdir(parents=True, exist_ok=True)
            self.academic_dir.mkdir(parents=True, exist_ok=True)
            
            databases = await self.client.list_databases()
            total_dbs = len(databases)
            
            if status_callback:
                status_callback({"status": "syncing", "progress": 0, "total": total_dbs, "message": f"Found {total_dbs} databases."})
            
            for i, db in enumerate(databases):
                db_id = db['id']
                db_title = db['title'][0]['plain_text'] if db['title'] else f"Database_{db_id}"
                
                macro, group, is_academic = self._categorize_database(db_title)
                safe_db_title = self._sanitize_path_segment(db_title)
                
                # Determine target directory
                if is_academic:
                    # Academic notes are handled with special hierarchy
                    base_dir = self.academic_dir
                else:
                    base_dir = self.mirror_dir / macro / group / safe_db_title
                
                base_dir.mkdir(parents=True, exist_ok=True)
                
                logger.info(f"Mirroring Database: {macro}/{group}/{safe_db_title}")
                if status_callback:
                    status_callback({"status": "syncing", "progress": i, "total": total_dbs, "message": f"Mirroring {safe_db_title}..."})
                    
                await self._sync_database_pages(db_id, base_dir, is_academic)
                
            logger.info("✅ Notion -> Obsidian Mirror Sync Complete.")
            if status_callback:
                status_callback({"status": "completed", "progress": total_dbs, "total": total_dbs, "message": "Notion mirror sync complete."})
            return True
            
        except Exception as e:
            logger.error(f"Failed to sync Notion to mirror: {e}")
            if status_callback:
                status_callback({"status": "error", "message": f"Sync failed: {e}"})
            return False

    async def _sync_database_pages(self, db_id: str, db_dir: Path, is_academic: bool):
        try:
            results = await self.client.query_database(db_id, limit=0) 
        except Exception as e:
            logger.error(f"Failed to query database {db_id}: {e}")
            return
            
        for page in results:
            try:
                props = page.get("properties", {})
                page_id = page['id']
                
                # Find the title
                title = "Untitled"
                for prop_data in props.values():
                    if prop_data.get("type") == "title":
                        title_array = prop_data.get("title", [])
                        if title_array:
                            title = title_array[0].get("plain_text", "Untitled")
                        break
                
                # Determine final file path
                if is_academic:
                    file_path = await self._resolve_academic_path(props, title, page_id)
                else:
                    safe_filename = self._sanitize_path_segment(title)
                    if not safe_filename: safe_filename = page_id
                    file_path = db_dir / f"{safe_filename}.md"
                
                # Build Content
                yaml_content = "---\n"
                yaml_content += f'notion_id: "{page_id}"\n'
                yaml_content += f'notion_url: "{page.get("url", "")}"\n'
                
                for prop_name, prop_data in props.items():
                    if prop_data.get("type") == "title":
                        continue
                    val = self._extract_property_value(prop_data)
                    if val:
                        safe_val = str(val).replace('"', '\\"').replace('\n', ' ')
                        yaml_content += f'{prop_name.lower().replace(" ", "_").replace(".", "")}: "{safe_val}"\n'
                yaml_content += "---\n\n"
                
                # Fetch Blocks
                blocks = await self.client.get_page_content(page_id)
                markdown_body = self._blocks_to_markdown(blocks)
                
                final_content = yaml_content + f"# {title}\n\n" + markdown_body
                
                # Write File
                file_path.parent.mkdir(parents=True, exist_ok=True)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(final_content)
                
                await asyncio.sleep(0.05) 
            except Exception as e:
                logger.error(f"Failed processing page {page.get('id')}: {e}")

    async def _resolve_academic_path(self, props: Dict[str, Any], title: str, page_id: str) -> Path:
        """
        Builds hierarchy: Year > Semester > Course > Unit > Note.md
        Uses Notion relations to traverse up the tree.
        """
        year = "Unknown_Year"
        semester = "Unknown_Semester"
        course = "Unknown_Course"
        unit = "" # Optional
        
        # 1. Check for Unit/Study Planner properties
        # In Study Planner (Units), "Course" is a relation
        if "Course" in props and props["Course"].get("relation"):
            course_id = props["Course"]["relation"][0]["id"]
            course = await self._get_page_title(course_id)
            unit = title
            # Get Semester from Course
            course_page = await self.client.get_page(course_id)
            c_props = course_page.get("properties", {})
            if "Semester" in c_props and c_props["Semester"].get("relation"):
                semester_id = c_props["Semester"]["relation"][0]["id"]
                semester = await self._get_page_title(semester_id)
        
        # 2. Check for Course properties
        elif "Semester" in props and props["Semester"].get("relation"):
            course = title
            semester_id = props["Semester"]["relation"][0]["id"]
            semester = await self._get_page_title(semester_id)
            
        # 3. Check for Exam/Assignment properties (they relate to Course)
        elif "Course" in props and props["Course"].get("relation"):
            course_id = props["Course"]["relation"][0]["id"]
            course = await self._get_page_title(course_id)
            # Semester from Course
            course_page = await self.client.get_page(course_id)
            c_props = course_page.get("properties", {})
            if "Semester" in c_props and c_props["Semester"].get("relation"):
                semester_id = c_props["Semester"]["relation"][0]["id"]
                semester = await self._get_page_title(semester_id)
        
        # 4. Handle Semester itself
        elif DB_SEMESTERS in page_id: # Usually Semester title
            semester = title
            
        # 5. Determine Year from Semester Title (e.g., "Fall 2025")
        year_match = re.search(r'\d{4}', semester)
        if year_match:
            year = year_match.group(0)

        # Sanitize everything
        s_year = self._sanitize_path_segment(year)
        s_semester = self._sanitize_path_segment(semester)
        s_course = self._sanitize_path_segment(course)
        s_unit = self._sanitize_path_segment(unit) if unit else ""
        s_title = self._sanitize_path_segment(title)
        
        if s_unit:
            return self.academic_dir / s_year / s_semester / s_course / s_unit / f"{s_title}.md"
        return self.academic_dir / s_year / s_semester / s_course / f"{s_title}.md"

    def _blocks_to_markdown(self, blocks: List[Dict[str, Any]]) -> str:
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
            elif b_type == 'quote':
                md += f"> {rich_text}\n\n"
            elif b_type == 'code':
                lang = content.get('language', '')
                code_text = "".join([t.get("plain_text", "") for t in content.get("rich_text", [])])
                md += f"```{lang}\n{code_text}\n```\n\n"
            elif b_type == 'divider':
                md += "---\n\n"
            elif b_type == 'callout':
                icon = content.get('icon', {}).get('emoji', '')
                md += f"> {icon} {rich_text}\n\n"
            elif b_type == 'image':
                url = content.get('file', {}).get('url') or content.get('external', {}).get('url')
                if url: md += f"![Image]({url})\n\n"
        return md

    def _extract_property_value(self, prop_data: Dict[str, Any]) -> str:
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
            elif prop_type == "relation":
                # For relations, we return the IDs as a comma separated string
                # Paths use actual page titles fetched via cache
                relations = prop_data.get("relation", [])
                return ", ".join([r.get("id", "") for r in relations])
        except Exception:
            pass
        return ""