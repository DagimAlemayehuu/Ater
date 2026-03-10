import os
import json
from pathlib import Path
from typing import Dict, Any, List
from src.domains.notion.client import NotionClient

class AcademicsService:
    def __init__(self, notion_key: str):
        self.client = NotionClient(notion_key)
        
        # Hardcoded IDs based on the user's Notion workspace
        self.DB_SEMESTERS = "2a9219ed-7519-8106-8a97-dfdc9c88911b"
        self.DB_COURSES = "2a9219ed-7519-817e-aedb-da156d06134c"
        self.DB_STUDY_PLANNER = "2a9219ed-7519-81e2-81f8-de21e47c26fc"
        self.DB_EXAMS = "2a9219ed-7519-8182-be2c-e7e7523dcf3b"
        self.DB_ASSIGNMENTS = "2a9219ed-7519-816a-a0cf-ed1a32abce49"
        self.DB_CRM = "2a9219ed-7519-8126-a08f-c31d107035ee"

    async def get_dashboard_data(self) -> Dict[str, Any]:
        """
        Gathers related academic data to display on the dashboard.
        We will run async queries on Notion databases.
        For simplicity and performance, we pull the top most relevant items.
        """
        # Fetching Semesters
        semesters = await self.client.query_database(self.DB_SEMESTERS, limit=20)
        # Fetching Courses
        courses = await self.client.query_database(self.DB_COURSES, limit=0)
        # Fetching Study Planner Units
        units = await self.client.query_database(self.DB_STUDY_PLANNER, limit=0)
        # Fetching upcoming Exams
        exams = await self.client.query_database(self.DB_EXAMS, limit=0)
        # Fetching upcoming Assignments
        assignments = await self.client.query_database(self.DB_ASSIGNMENTS, limit=0)
        
        return {
            "semesters": semesters,
            "courses": courses,
            "units": units,
            "exams": exams,
            "assignments": assignments
        }

    async def sync_profile_markdown(self) -> str:
        """
        Creates/Overwrites the academic_profile.md file in Life OS md templates
        This acts as the single source of truth context for OKA and Strategist.
        """
        dashboard_data = await self.get_dashboard_data()
        
        # Parse logic
        active_courses = []
        for c in dashboard_data["courses"]:
            props = c.get("properties", {})
            title_objs = props.get("Course Name", {}).get("title", [])
            title = title_objs[0].get("plain_text", "Untitled") if title_objs else "Untitled"
            grade = props.get("Grade", {}).get("select")
            target = props.get("Goal", {}).get("select")
            active_courses.append({
                "name": title,
                "grade": grade.get("name") if grade else "N/A",
                "target": target.get("name") if target else "A"
            })
            
        upcoming_exams = []
        for e in dashboard_data["exams"]:
            props = e.get("properties", {})
            title_objs = props.get("Name", {}).get("title", [])
            title = title_objs[0].get("plain_text", "Untitled") if title_objs else "Untitled"
            date = props.get("Exam Date", {}).get("date")
            upcoming_exams.append({
                "name": title,
                "date": date.get("start") if date else "Unknown"
            })
            
        knowledge_deficits = []
        for u in dashboard_data["units"]:
            props = u.get("properties", {})
            title_objs = props.get("Name of Unit", {}).get("title", [])
            title = title_objs[0].get("plain_text", "Untitled") if title_objs else "Untitled"
            confidence = props.get("Confidence", {}).get("select")
            if confidence and confidence.get("name") in ["Not Confident", "Neutral"]:
                knowledge_deficits.append({
                    "name": title,
                    "confidence": confidence.get("name")
                })
        
        # Build Markdown Profile
        md_content = "# Academic Profile (Auto-Synced from Notion Synapse Service)\\n\\n"
        
        md_content += "## Active Courses\\n"
        for c in active_courses:
            md_content += f"- **{c['name']}** (Current Grade: {c['grade']} | Target: {c['target']})\\n"
            
        md_content += "\\n## Immediate Threats (Exams & Deadlines)\\n"
        for e in upcoming_exams:
            md_content += f"- 🔴 **{e['name']}** - Date: {e['date']}\\n"
            
        md_content += "\\n## Knowledge Deficits (Requires Study or OKA Generation)\\n"
        if not knowledge_deficits:
            md_content += "- All caught up and confident! 🚀\\n"
        else:
            for d in knowledge_deficits:
                md_content += f"- ⚠️ **{d['name']}** - Confidence: {d['confidence']}\\n"

        # Resolve the absolute path to `md templates/academic_profile.md`
        root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        md_dir = root_dir / "md templates"
        md_dir.mkdir(parents=True, exist_ok=True)
        file_path = md_dir / "academic_profile.md"
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(md_content)
            
        return str(file_path)
