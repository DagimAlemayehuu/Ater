import re
import json
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field

from src.domains.ai.factory import ModelFactory
from src.domains.ater.vault_manager import VaultManager
from src.domains.ater import learning_object as lo

class IntentClarificationResponse(BaseModel):
    is_learning: bool = Field(
        ...,
        description="True if the prompt represents a request to learn/study a topic. False if it is a general administrative query, checking stats, adding unrelated tasks, etc."
    )
    needs_clarification: bool = Field(
        ...,
        description="True if the prompt is too vague or lacks context (e.g. 'Teach me Chemistry'). False if specific subtopics, goals, or reference materials are provided."
    )
    questions: List[str] = Field(
        default_factory=list,
        description="1 to 3 targeted clarification questions to ask the user if needs_clarification is True. Empty list if False."
    )

class PlannedChapter(BaseModel):
    title: str = Field(..., description="Title of the chapter.")
    order: int = Field(..., description="Sequential order of the chapter (1-indexed).")
    atomic_notes: List[str] = Field(..., description="List of Atomic Note titles for this chapter.")

class CurriculumPlan(BaseModel):
    topic: str = Field(..., description="The main topic being learned.")
    learning_mode: str = Field(..., description="The selected learning mode (e.g. 'self-study', 'coursework').")
    chapters: List[PlannedChapter] = Field(..., description="List of chapters in sequential order.")

class AterPlanner:
    def __init__(self, secrets, llm=None):
        self.secrets = secrets
        self.vault_path = Path(secrets.vault_path) if secrets.vault_path else None
        self.llm = llm
        if not self.llm and secrets.ai_key:
            # Fallback/default LLM constructor if not supplied
            self.llm = ModelFactory.get_model(
                provider=secrets.ai_provider,
                model_name=secrets.ai_model,
                api_key=secrets.ai_key,
                temperature=0.0,
                max_retries=0
            )

    async def extract_topic(self, prompt: str) -> str:
        """
        Extracts the main topic/subject from the prompt, normalized to Title Case.
        """
        if not self.llm:
            raise ValueError("LLM client is not configured.")
        
        class TopicExtractorResponse(BaseModel):
            topic: str = Field(..., description="The main subject or topic name from the prompt, normalized to Title Case (e.g. 'Git Branching', 'Python Async').")
            
        structured_llm = self.llm.with_structured_output(TopicExtractorResponse)
        response = await structured_llm.ainvoke([
            {"role": "system", "content": "Extract the single main subject or topic name from the prompt, normalized to Title Case. (e.g., 'Teach me Python async' -> 'Python Async')."},
            {"role": "user", "content": f"Prompt: {prompt}"}
        ])
        return response.topic

    async def classify_intent_and_clarification(self, prompt: str) -> Dict[str, Any]:
        """
        Classifies incoming prompt to see if it is a learning request,
        and evaluates if it requires clarification.
        """
        if not self.llm:
            raise ValueError("LLM client is not configured.")
        
        system_prompt = (
            "You are Ater's Ingestion and Clarification Assistant.\n"
            "Analyze the user's prompt and output the structured JSON matching the schema.\n"
            "1. Detect if the user wants to learn a topic (is_learning = true) or perform administrative tasks like checking FSRS/SRS stats, adding simple daily checklist items, etc. (is_learning = false).\n"
            "2. If it is a learning request, evaluate if it is too vague (needs_clarification = true) e.g., 'Teach me Chemistry' or 'Learn about math'. If specific subtopics or context are given, needs_clarification = false.\n"
            "3. If needs_clarification is true, generate 1 to 3 targeted, high-impact clarification questions to ask. Otherwise, return empty questions list."
        )

        structured_llm = self.llm.with_structured_output(IntentClarificationResponse)
        response = await structured_llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"User Prompt: {prompt}"}
        ])
        return response.model_dump()

    async def generate_curriculum(self, prompt: str, existing_chapters: Optional[List[str]] = None, learning_mode: str = "self-study") -> Dict[str, Any]:
        """
        Plans a structured curriculum for the given prompt, potentially extending existing chapters.
        """
        if not self.llm:
            raise ValueError("LLM client is not configured.")
        
        existing_context = ""
        if existing_chapters:
            existing_context = f"\nExisting chapters in this Hub: {', '.join(existing_chapters)}. Please do NOT duplicate these chapters. Generate new chapters to extend the curriculum based on the prompt."

        system_prompt = (
            f"You are Ater's Curriculum Planner. Create a structured curriculum JSON matching the schema.\n"
            f"Set the learning_mode to '{learning_mode}'. {existing_context}"
        )

        structured_llm = self.llm.with_structured_output(CurriculumPlan)
        response = await structured_llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Request: {prompt}"}
        ])
        return response.model_dump()

    def write_curriculum(self, curriculum: Dict[str, Any], mode: Literal["Generate All", "Progressive"], semester: Optional[str] = None, course: Optional[str] = None, unit: Optional[str] = None) -> Dict[str, Any]:
        """
        Writes the planned curriculum files into the Obsidian Vault.
        """
        if not self.vault_path:
            raise ValueError("Vault path is not configured.")
        
        topic = curriculum.get("topic", "Unknown")
        learning_mode = curriculum.get("learning_mode", "self-study")
        chapters_data = curriculum.get("chapters", [])
        
        # 1. Resolve Hub Path
        hub_rel_path = lo.get_hub_path(topic, semester, course, unit)
        hub_abs_path = self.vault_path / hub_rel_path
        hub_abs_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Retrieve or construct chapters list for Hub body/metadata
        all_chapter_links = []
        for ch in chapters_data:
            ch_title = ch.get("title", "")
            ch_order = ch.get("order", 1)
            norm_ch_title = lo.normalize_title(ch_title)
            # Chapter link filename representation (canonical title)
            padded_order = f"{ch_order:02d}"
            all_chapter_links.append(f"Chapter_{padded_order}_{norm_ch_title}")
            
        # If Hub exists, load its existing chapters first
        existing_hub_chapters = []
        is_existing = hub_abs_path.exists()
        if is_existing:
            try:
                import frontmatter
                post = frontmatter.loads(hub_abs_path.read_text(encoding="utf-8"))
                existing_hub_chapters = post.metadata.get("chapters", [])
            except Exception:
                pass
                
        # Merge chapters
        merged_chapters = list(existing_hub_chapters)
        for link in all_chapter_links:
            # Avoid duplicating chapter links
            clean_link = re.sub(r"[\[\]]+", "", link).strip()
            if clean_link not in [re.sub(r"[\[\]]+", "", x).strip() for x in merged_chapters]:
                merged_chapters.append(link)
                
        # Build and write Hub content
        hub_content = lo.build_hub_content(topic, learning_mode, merged_chapters)
        hub_abs_path.write_text(hub_content, encoding="utf-8")
        
        written_files = [str(hub_rel_path)]
        
        # 2. Process Chapters and Atomic Notes based on mode
        for idx, ch in enumerate(chapters_data):
            ch_title = ch.get("title", "")
            ch_order = ch.get("order", 1)
            ch_notes = ch.get("atomic_notes", [])
            
            # Normalize list of notes for chapter
            norm_notes = [lo.normalize_title(n) for n in ch_notes]
            
            # Build Chapter details
            ch_rel_path = lo.get_chapter_path(topic, ch_title, ch_order, semester, course, unit)
            ch_abs_path = self.vault_path / ch_rel_path
            
            # Determine if we write this chapter/note
            should_write = True
            if mode == "Progressive" and idx > 0:
                should_write = False
                
            if should_write:
                # Write Chapter file
                ch_abs_path.parent.mkdir(parents=True, exist_ok=True)
                ch_content = lo.build_chapter_content(f"{lo.normalize_title(topic)}_Hub", ch_order, norm_notes)
                ch_abs_path.write_text(ch_content, encoding="utf-8")
                written_files.append(str(ch_rel_path))
                
                # Write Atomic Note stubs
                for note_title in norm_notes:
                    note_rel_path = lo.get_note_path(topic, ch_title, ch_order, note_title, semester, course, unit)
                    note_abs_path = self.vault_path / note_rel_path
                    note_abs_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Create artifact pack path and write minimal JSON
                    art_pack_rel = lo.get_artifact_pack_path(note_rel_path)
                    art_pack_abs = self.vault_path / art_pack_rel
                    art_pack_abs.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Check if artifact pack already exists
                    if not art_pack_abs.exists():
                        minimal_pack = lo.build_minimal_artifact_pack(note_title, str(note_rel_path))
                        art_pack_abs.write_text(json.dumps(minimal_pack, indent=2), encoding="utf-8")
                    
                    # Use existing content or empty string
                    existing_content = ""
                    if note_abs_path.exists():
                        existing_content = note_abs_path.read_text(encoding="utf-8")
                        
                    # Merge metadata
                    note_content = lo.merge_atomic_note_metadata(
                        existing_content=existing_content,
                        chapter_title=f"Chapter_{ch_order:02d}_{lo.normalize_title(ch_title)}",
                        lesson_variants={},
                        artifact_pack_path=art_pack_rel,
                        hub_title=f"{lo.normalize_title(topic)}_Hub"
                    )
                    note_abs_path.write_text(note_content, encoding="utf-8")
                    written_files.append(str(note_rel_path))
                    
        return {
            "hub_path": str(hub_rel_path),
            "written_files": written_files,
            "chapters_merged": len(merged_chapters)
        }
