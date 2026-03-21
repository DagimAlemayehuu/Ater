from typing import List, Optional
from langchain_core.tools import tool
from src.domains.ai.agents.base_agent import BaseAgent
from src.api.deps import AppSecrets
import json

class NotionLibrarian(BaseAgent):
    """Notion Expert with full CRUD access."""
    def __init__(self, secrets: AppSecrets, tools: List):
        persona = (
            "You are the Notion Librarian. You are the sole expert in Notion databases, pages, and blocks.\n"
            "MANDATORY: You prioritize accuracy in property mapping (select, checkbox, date).\n"
            "If a database is not found, use get_notion_databases to find it."
        )
        super().__init__(secrets, persona, tools, name="NotionLibrarian")

class ObsidianScribe(BaseAgent):
    """Obsidian/Markdown and Knowledge Base expert."""
    def __init__(self, secrets: AppSecrets, tools: List):
        persona = (
            "You are the Obsidian Scribe. You manage the vault's hierarchical structure and long-form notes.\n"
            "Your domain is Academic year-semester-course-unit files and General Research notes.\n"
            "Never overwrite a file without reading it first."
        )
        super().__init__(secrets, persona, tools, name="ObsidianScribe")

class OKASentinel(BaseAgent):
    """Document Ingestion specialist."""
    def __init__(self, secrets: AppSecrets, tools: List):
        persona = (
            "You are the OKA Sentinel. Your task is to process raw inbox files and deploy them into the vault structure.\n"
            "Directives: Read raw files -> Analyze -> Categorize -> Generate Note -> Deploy to Academic or Research."
        )
        super().__init__(secrets, persona, tools, name="OKASentinel")

class ChronosChronometer(BaseAgent):
    """Timeline and Multi-Calendar expert."""
    def __init__(self, secrets: AppSecrets, tools: List):
        persona = (
            "You are Chronos. You manage time. You merge Google Calendar, Notion Calendar, and database date properties.\n"
            "Goal: Give the user a unified view of their day, week, and upcoming deadlines."
        )
        super().__init__(secrets, persona, tools, name="ChronosChronometer")

class Scholar(BaseAgent):
    """Research and Summarization expert."""
    def __init__(self, secrets: AppSecrets, tools: List):
        persona = (
            "You are the Scholar. You are an expert at reading complex PDFs, CS textbooks, and AI research papers.\n"
            "Output: Structured technical notes with key takeaways, formulas, and diagrams."
        )
        super().__init__(secrets, persona, tools, name="Scholar")

class WealthStrategist(BaseAgent):
    """Finance and Assets auditor."""
    def __init__(self, secrets: AppSecrets, tools: List):
        persona = (
            "You are the Wealth Strategist. You track income, expenses, bank accounts, and budgets in Notion Finance databases.\n"
            "Goal: Financial growth and strict budget monitoring."
        )
        super().__init__(secrets, persona, tools, name="WealthStrategist")

class GymCoach(BaseAgent):
    """Fitness and Nutrition expert."""
    def __init__(self, secrets: AppSecrets, tools: List):
        persona = (
            "You are the Gym Coach. You track workouts (sets/reps/PRs) in the Fitness database and manage meals in the Kitchen database."
        )
        super().__init__(secrets, persona, tools, name="GymCoach")

class DevOpsGuardian(BaseAgent):
    """System Health and RAG maintainer."""
    def __init__(self, secrets: AppSecrets, tools: List):
        persona = (
            "You are the DevOps Guardian. You monitor the Life OS sidecar health and repair the RAG index if corruption occurs."
        )
        super().__init__(secrets, persona, tools, name="DevOpsGuardian")
