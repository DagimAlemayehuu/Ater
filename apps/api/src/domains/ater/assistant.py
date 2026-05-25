"""
Ater Oracle — Comprehensive Tool-Calling Agent (v2)

Tools cover every app feature:
  - Vault: search, tag search, read, write
  - Academic DB: full CRUD on courses, semesters, exams, assignments, planner hubs
  - Practice: generate quiz, list sessions, analytics
  - FSRS: query due cards, override stability, study history
  - Pomodoro: start, pause, stop, set hub, get status  (all via SSE action events)
  - UI navigation: route changes, tab switches, note opens, toast notifications
  - Dynamic UI: render_ui tool wraps data as ater-ui code blocks for rich card rendering
  - App info: get vault stats, list hubs
"""

import re
import json
import logging
import sqlite3
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional

import frontmatter
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import StructuredTool

from src.api.deps import AppSecrets
from src.domains.obsidian.client import ObsidianClient
from src.domains.ai.factory import ModelFactory
from src.domains.ater.service import AterService

logger = logging.getLogger("AterAssistant")

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def to_underscore_title_case(s: str) -> str:
    cleaned = re.sub(r'[\s\-]+', '_', s.strip())
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', cleaned)
    parts = [p.capitalize() for p in cleaned.split('_') if p]
    return '_'.join(parts)


def preprocess_frontmatter(content: str) -> str:
    parts = content.split("---", 2)
    if len(parts) < 3:
        return content
    fm_text = parts[1]
    body_text = parts[2]

    def clean_plain_prop(m):
        key = m.group(1).strip()
        val = m.group(2)
        clean_val = re.sub(r'[\[\]]+', '', val).strip()
        return f'\n{key}: {clean_val}'

    fm_text = re.sub(r'(\n(?:course|semester)):\s*(.*)', clean_plain_prop, "\n" + fm_text, flags=re.IGNORECASE)
    if fm_text.startswith("\n"):
        fm_text = fm_text[1:]

    pattern = r'(\n[a-zA-Z0-9_\-]+:\s*)(?!["\'])(\[\[[^\]]+\]\])(?!["\'])'
    def repl(m):
        prefix = m.group(1)
        wikilink = m.group(2)
        inner = wikilink[2:-2].strip()
        return f'{prefix}"[[{to_underscore_title_case(inner)}]]"'

    fm_text = re.sub(pattern, repl, "\n" + fm_text)
    if fm_text.startswith("\n"):
        fm_text = fm_text[1:]

    return f"--- \n{fm_text}---{body_text}"


def sanitize_note_content(content: str) -> str:
    content = preprocess_frontmatter(content)
    try:
        post = frontmatter.loads(content)
        for key, val in list(post.metadata.items()):
            if key.lower() in ("course", "semester"):
                if isinstance(val, str):
                    post.metadata[key] = re.sub(r'[\[\]]+', '', val).strip()
            elif isinstance(val, str) and val.startswith("[[") and val.endswith("]]"):
                inner = val[2:-2].strip()
                post.metadata[key] = f"[[{to_underscore_title_case(inner)}]]"
        body = post.content
        def wikilink_sub(match):
            inner = match.group(1).strip()
            return f"[[{to_underscore_title_case(inner)}]]"
        body = re.sub(r'\[\[([^\]]+)\]\]', wikilink_sub, body)
        body_lines = body.splitlines()
        cleaned_body = []
        for i, line in enumerate(body_lines):
            stripped = line.strip()
            is_heading = stripped.startswith('#') and ' ' in stripped
            is_code_block = stripped.startswith('```')
            is_table_row = stripped.startswith('|')
            is_hr = stripped == "---"
            if (is_heading or is_code_block or is_table_row or is_hr) and cleaned_body:
                prev = cleaned_body[-1].strip()
                if prev != "":
                    if not (is_table_row and prev.startswith('|')):
                        cleaned_body.append("")
                        if is_hr:
                            cleaned_body.append("")
            cleaned_body.append(line)
            if is_heading and i < len(body_lines) - 1:
                nxt = body_lines[i + 1].strip()
                if nxt != "":
                    cleaned_body.append("")
        post.content = "\n".join(cleaned_body)
        dumped = frontmatter.dumps(post)
        parts = dumped.split("---", 2)
        if len(parts) >= 3:
            fm = parts[1]
            fm = re.sub(r"'\s*(\[\[[^\]]+\]\])\s*'", r'"\1"', fm)
            dumped = f"---{fm}---{parts[2]}"
        return dumped
    except Exception as e:
        logger.warning(f"Failed to parse frontmatter during sanitization: {e}")
        return content


# ─────────────────────────────────────────────────────────────────────────────
# Input Schemas
# ─────────────────────────────────────────────────────────────────────────────

class SearchNotesInput(BaseModel):
    query: str = Field(description="Keywords to search for across all markdown notes.")

class SearchVaultByTagInput(BaseModel):
    tag: str = Field(description="Tag to search for (without the '#' prefix).")

class ReadNoteInput(BaseModel):
    path: str = Field(description="Relative vault path or note title to read.")

class WriteNoteInput(BaseModel):
    path: str = Field(description="Relative vault path to write (e.g. 'Notes/My_Note.md').")
    content: str = Field(description="Complete markdown content.")

class CreateAcademicRecordInput(BaseModel):
    record_type: str = Field(description="Type: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'.")
    title: str = Field(description="Title of the record.")
    properties: Dict[str, Any] = Field(default_factory=dict, description="YAML frontmatter fields to set.")

class UpdateAcademicRecordInput(BaseModel):
    record_type: str = Field(description="Type: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'.")
    id: str = Field(description="Title or ID of the record to update.")
    properties: Dict[str, Any] = Field(description="Properties to merge into the frontmatter.")

class DeleteAcademicRecordInput(BaseModel):
    record_type: str = Field(description="Type: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'.")
    id: str = Field(description="Title or ID of the record to delete.")

class QueryAcademicDatabaseInput(BaseModel):
    record_type: str = Field(description="Type to list: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'.")

class GenerateQuizInput(BaseModel):
    hub_id: str = Field(description="Name/ID of the study hub to generate questions for.")
    count: int = Field(default=5, description="Number of questions (1-15).")
    difficulty: str = Field(default="L1", description="Difficulty: 'L1' (easy), 'L2' (medium), 'L3' (hard).")

class StartGenerationInput(BaseModel):
    file_path: str = Field(description="Absolute path to the inbox file to process for note generation.")
    target_hub_id: Optional[str] = Field(default=None, description="Optional: specific hub ID to anchor the notes to.")

class NavigateToRouteInput(BaseModel):
    route: str = Field(
        description=(
            "App route to navigate to. Options: "
            "'/oracle', '/obsidian', '/academic', '/practice', '/agents', '/settings'. "
            "Append query params like '/academic?tab=exams' or '/obsidian?path=Notes/My_Note.md'."
        )
    )

class NavigateToNoteInput(BaseModel):
    note_path: str = Field(description="Relative vault path or note title to open in the vault viewer.")

class SwitchAcademicTabInput(BaseModel):
    tab: str = Field(description="Tab to switch to: 'courses', 'semesters', 'exams', 'assignments', 'planner', 'program'.")

class TriggerNotificationInput(BaseModel):
    variant: str = Field(description="Toast type: 'success', 'error', 'info', 'warning'.")
    message: str = Field(description="Text to show in the notification.")

class GetSrsCardsInput(BaseModel):
    hub_id: Optional[str] = Field(default=None, description="Filter due cards by hub name. Leave empty for all cards.")

class OverrideSrsStabilityInput(BaseModel):
    note_path: str = Field(description="Relative vault path to the note whose FSRS stability should be overridden.")
    manual_stability: float = Field(description="New stability score. Higher = further future review date. Typical range 0.1-30.")

class GetStudyHistoryInput(BaseModel):
    limit: int = Field(default=10, description="Max number of recent sessions to return.")

class PomodoroStartInput(BaseModel):
    duration_minutes: int = Field(default=25, description="Focus session duration in minutes (5-60). Default is 25.")
    hub_id: Optional[str] = Field(default=None, description="Study hub to focus on during the session.")

class PomodoroSetHubInput(BaseModel):
    hub_id: str = Field(description="Study hub name to set as the current focus target.")

class RenderUIInput(BaseModel):
    ui_type: str = Field(
        description=(
            "Type of UI block to render. Options:\n"
            "- 'course_cards': Grid of clickable course cards. data = list of {name, status, semester, credits, grade}.\n"
            "- 'note_cards': List of clickable note cards. data = list of {title, path, tags, snippet}.\n"
            "- 'hub_cards': Study hub cards. data = list of {name, note_count, description}.\n"
            "- 'exam_list': Exam rows. data = list of {name, course, date, weight, status}.\n"
            "- 'assignment_list': Assignment rows. data = list of {name, course, due_date, status, priority}.\n"
            "- 'stats': Summary stats panel. data = {sessions_today, total_notes, due_cards, active_hub, streak}.\n"
            "- 'srs_deck': SRS review cards. data = list of {title, path, due, difficulty, reps}.\n"
            "- 'semester_list': Semester overview cards. data = list of {name, year, status, course_count}."
        )
    )
    data: Any = Field(description="The data payload for the UI block. Must match the structure described for ui_type.")
    caption: Optional[str] = Field(default=None, description="Short optional caption/header shown above the block.")

class GetVaultStatsInput(BaseModel):
    pass  # No params needed

class ListHubsInput(BaseModel):
    pass  # No params needed

class RenameNoteInput(BaseModel):
    old_path: str = Field(description="Relative vault path to the existing note.")
    new_path: str = Field(description="New relative vault path or new title.")

class DeleteNoteInput(BaseModel):
    path: str = Field(description="Relative vault path to the note to delete.")

class GetInboxFilesInput(BaseModel):
    pass

class GetQueueStatusInput(BaseModel):
    pass

class ToggleAutoDeployInput(BaseModel):
    state: bool = Field(description="True to enable auto-deploy, False to disable.")


class GetAppConfigInput(BaseModel):
    pass


class UpdateAppConfigInput(BaseModel):
    key_values: Dict[str, Any] = Field(
        description=(
            "Key-value pairs to update in settings. "
            "Valid keys: 'display_name', 'obsidian_vault_path', 'inbox_path', 'academic_folder_path', "
            "'auto_deploy', 'show_properties', 'pomodoro_work_duration', 'pomodoro_short_break_duration', "
            "'pomodoro_long_break_duration', 'pomodoro_sessions_before_long_break', 'ai_provider', 'ai_model', 'ai_base_url'."
        )
    )

class FactoryResetInput(BaseModel):
    pass

class ClearStudyHistoryInput(BaseModel):
    pass

class ValidateFeynmanExplanationInput(BaseModel):
    note_path: str = Field(description="Relative vault path to the note being explained.")
    explanation: str = Field(description="The student's explanation to validate using Feynman method.")

class GenerateCustomPracticeInput(BaseModel):
    hub_id: str = Field(description="Name/ID of the study hub.")
    difficulty: str = Field(default="Mixed", description="Difficulty level ('Easy', 'Medium', 'Hard', 'Mixed').")
    preset: str = Field(default="balanced", description="Practice preset ('balanced', 'mcq_blitz', 'deep_write', 'math_mode', 'recall', 'hard_mode', 'exam_sim').")

class GetGeneratedFilesInput(BaseModel):
    pass



# ─────────────────────────────────────────────────────────────────────────────
# AterAssistant Class
# ─────────────────────────────────────────────────────────────────────────────

class AterAssistant:
    def __init__(self, secrets: AppSecrets, user_context: Optional[Dict[str, Any]] = None):
        self.secrets = secrets
        self.user_context = user_context or {}
        self.vault_path = secrets.vault_path
        self.academic_path = secrets.academic_path or "Notes"

        self.llm = ModelFactory.get_model(
            provider=secrets.ai_provider,
            model_name=secrets.ai_model,
            api_key=secrets.ai_key,
            temperature=0.1,
            base_url=secrets.ai_base_url,
            max_tpm=secrets.ai_max_tpm,
            max_rpm=secrets.ai_max_rpm,
            max_tpd=secrets.ai_max_tpd,
            max_rpd=secrets.ai_max_rpd,
            max_concurrency=secrets.ai_max_concurrency
        )

        self.folder_map = {
            "courses": "courses",
            "semesters": "semesters",
            "exams": "exams",
            "assignments": "assignments",
            "study planner": "study planner",
            "study_sessions": "study planner",
            "years": "years"
        }

    # ── Vault helpers ──────────────────────────────────────────────────────

    def get_all_vault_notes(self) -> List[Dict[str, str]]:
        if not self.vault_path:
            return []
        root = Path(self.vault_path)
        notes = []
        for file in root.rglob("*"):
            if not file.is_file():
                continue
            if any(p.startswith(".") for p in file.parts) or ".trash" in file.parts:
                continue
            suffix = file.suffix.lower()
            if suffix in (".md", ".pdf"):
                try:
                    rel_path = file.relative_to(root).as_posix()
                    notes.append({
                        "title": file.name if suffix == ".pdf" else file.stem,
                        "path": rel_path
                    })
                except Exception:
                    continue
        notes.sort(key=lambda x: x["path"])
        return notes

    def truncate_note_if_large(self, content: str) -> str:
        if len(content.encode('utf-8')) <= 20 * 1024:
            return content
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_part = f"---{parts[1]}---"
            body = parts[2]
        else:
            fm_part = ""
            body = content
        body_bytes = body.encode('utf-8')
        limit = 4 * 1024
        if len(body_bytes) <= limit * 2:
            return content
        first_part = body_bytes[:limit].decode('utf-8', errors='ignore')
        last_part = body_bytes[-limit:].decode('utf-8', errors='ignore')
        warning = "\n\n[Content truncated — file exceeds limit. Showing head and tail.]\n\n"
        return f"{fm_part}\n{first_part}{warning}{last_part}"

    # ── Vault tools ────────────────────────────────────────────────────────

    def search_notes_fulltext(self, query: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        matches = []
        query_lower = query.lower()
        for file in root.rglob("*.md"):
            if ".obsidian" in file.parts or ".git" in file.parts:
                continue
            try:
                content = file.read_text(encoding="utf-8")
                if query_lower in content.lower():
                    lines = content.splitlines()
                    snippets = []
                    for idx, line in enumerate(lines):
                        if query_lower in line.lower():
                            snippets.append(line.strip()[:100])
                            if len(snippets) >= 2:
                                break
                    matches.append({
                        "title": file.stem,
                        "path": file.relative_to(root).as_posix(),
                        "snippet": " | ".join(snippets)
                    })
                    if len(matches) >= 15:
                        break
            except Exception:
                continue

        if not matches:
            return f"No notes matched '{query}'."

        # Return rich search navigator UI
        return self.render_ui("search_navigator", {"query": query, "results": matches})

    def search_notes_by_tag(self, tag: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        tag_pattern = re.compile(r'#' + re.escape(tag.lstrip('#')), re.IGNORECASE)
        matches = []
        for file in root.rglob("*.md"):
            if any(p.startswith(".") for p in file.parts):
                continue
            try:
                content = file.read_text(encoding="utf-8")
                if tag_pattern.search(content):
                    matches.append({"title": file.stem, "path": file.relative_to(root).as_posix()})
                    if len(matches) >= 20:
                        break
            except Exception:
                continue
        if not matches:
            return f"No notes found with tag '#{tag}'."
        return self.render_ui("note_cards", matches, caption=f"Notes tagged #{tag}")

    def read_note(self, path: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        
        # Clean path of obsidian link brackets
        clean_path = path.replace("[[", "").replace("]]", "").strip()
        
        suffixes = ["", ".md", ".pdf", ".txt"]
        possible_paths = []
        for s in suffixes:
            if s:
                possible_paths.append(root / f"{clean_path}{s}")
                possible_paths.append(root / self.academic_path / f"{clean_path}{s}")
            else:
                possible_paths.append(root / clean_path)
                possible_paths.append(root / self.academic_path / clean_path)
                
        target_path = None
        for p in possible_paths:
            if p.exists() and p.is_file():
                target_path = p
                break
                
        if not target_path:
            # Search by stem (case-insensitive, ignoring spaces/underscores)
            stem_target = Path(clean_path).stem.replace(" ", "_").lower()
            for file in root.rglob("*"):
                if file.is_file() and not any(p.startswith(".") for p in file.parts) and ".trash" not in file.parts:
                    if file.stem.replace(" ", "_").lower() == stem_target:
                        target_path = file
                        break
                        
        if not target_path:
            return f"File '{path}' not found in the vault."
            
        try:
            if target_path.suffix.lower() == ".pdf":
                import pypdf
                reader = pypdf.PdfReader(target_path)
                pages = []
                total_chars = 0
                for i, page in enumerate(reader.pages):
                    text = page.extract_text() or ""
                    if text.strip():
                        page_text = f"--- [PDF PAGE {i+1}] ---\n{text}"
                        pages.append(page_text)
                        total_chars += len(page_text)
                        if total_chars > 30000:
                            pages.append("\n\n[PDF content truncated due to size limits.]")
                            break
                return "\n\n".join(pages)
            else:
                return self.truncate_note_if_large(target_path.read_text(encoding="utf-8"))
        except Exception as e:
            return f"Error reading {target_path.name}: {e}"

    def write_note(self, path: str, content: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        rel_path = path if path.endswith(".md") else path + ".md"
        sanitized = sanitize_note_content(content)
        client = ObsidianClient(self.vault_path)
        success = client.write_note(rel_path, sanitized)
        if success:
            return f"Written: '{rel_path}'."
        return f"Failed to write '{rel_path}'."

    def rename_note(self, old_path: str, new_path: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        old_full = root / old_path
        if not old_full.exists():
            old_full = root / f"{old_path}.md"
        if not old_full.exists():
            return f"Error: '{old_path}' not found."
            
        new_full = root / new_path if new_path.endswith(".md") else root / f"{new_path}.md"
        new_full.parent.mkdir(parents=True, exist_ok=True)
        try:
            old_full.rename(new_full)
            return f"Renamed '{old_path}' to '{new_full.relative_to(root).as_posix()}'."
        except Exception as e:
            return f"Failed to rename: {e}"

    def delete_note(self, path: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        full = root / path
        if not full.exists():
            full = root / f"{path}.md"
        if not full.exists():
            return f"Error: '{path}' not found."
        try:
            full.unlink()
            return f"Deleted '{path}'."
        except Exception as e:
            return f"Failed to delete: {e}"

    def get_vault_stats(self) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        total_notes = 0
        hubs = set()
        db_dir = root / "database"
        for file in root.rglob("*.md"):
            if any(p.startswith(".") for p in file.parts) or ".trash" in file.parts:
                continue
            total_notes += 1
            # Detect hub folders (non-database, non-root .md files)
            rel = file.relative_to(root)
            if len(rel.parts) > 1:
                top = rel.parts[0]
                if top.lower() not in ("database", ".obsidian", ".trash"):
                    hubs.add(top)
        return self.render_ui("stats", {
            "total_notes": total_notes,
            "hub_count": len(hubs),
        }, caption="Vault Intelligence Statistics")

    def list_hubs(self) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        root = Path(self.vault_path)
        hubs = {}
        for file in root.rglob("*.md"):
            if any(p.startswith(".") for p in file.parts) or ".trash" in file.parts:
                continue
            rel = file.relative_to(root)
            if len(rel.parts) > 1:
                top = rel.parts[0]
                if top.lower() not in ("database", ".obsidian", ".trash"):
                    hubs[top] = hubs.get(top, 0) + 1
        result = [{"name": k, "note_count": v, "path": k} for k, v in sorted(hubs.items())]
        if not result:
            return "No study hubs found in vault."
        return self.render_ui("hub_cards", result)

    # ── Academic database tools ────────────────────────────────────────────

    def query_academic_database(self, record_type: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        folder = self.folder_map.get(record_type.lower(), record_type.lower())
        db_dir = Path(self.vault_path) / "database" / folder
        if not db_dir.exists():
            return json.dumps({"type": "academic_records", "record_type": record_type, "records": []})
        records = []
        for file in sorted(db_dir.glob("*.md")):
            try:
                post = frontmatter.loads(file.read_text(encoding="utf-8"))
                meta = dict(post.metadata)
                
                # Clean metadata for UI (convert empty lists/dicts to empty strings)
                for k, v in meta.items():
                    if isinstance(v, (list, dict)) and not v:
                        meta[k] = ""
                    elif isinstance(v, (list, dict)):
                        meta[k] = str(v)
                
                meta["_title"] = file.stem
                meta["id"] = file.stem
                meta["path"] = f"database/{folder}/{file.name}"
                records.append(meta)
            except Exception:
                records.append({"_title": file.stem, "id": file.stem})
        # Map record_type to ui_type
        ui_map = {
            "courses": "course_cards",
            "semesters": "semester_list",
            "exams": "exam_list",
            "assignments": "assignment_list",
            "study planner": "hub_cards",
            "years": "stats"
        }
        ui_type = ui_map.get(record_type.lower(), "course_cards")
        
        return self.render_ui(ui_type, records[:50])

    def create_academic_record(self, record_type: str, title: str, properties: Dict[str, Any]) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        folder = self.folder_map.get(record_type.lower(), record_type.lower())
        filename = f"{to_underscore_title_case(title)}.md"
        relative_path = f"database/{folder}/{filename}"
        post = frontmatter.Post("")
        post.metadata["type"] = record_type.rstrip('s')
        post.metadata["title"] = to_underscore_title_case(title)
        for k, v in properties.items():
            if k.lower() in ("course", "semester"):
                post.metadata[k] = re.sub(r'[\[\]]+', '', str(v)).strip()
            else:
                post.metadata[k] = v
        client = ObsidianClient(self.vault_path)
        success = client.write_note(relative_path, frontmatter.dumps(post))
        if success:
            return f"Created {record_type} '{title}'."
        return f"Failed to create {record_type} '{title}'."

    def update_academic_record(self, record_type: str, id: str, properties: Dict[str, Any]) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        folder = self.folder_map.get(record_type.lower(), record_type.lower())
        filename = f"{to_underscore_title_case(id)}.md"
        relative_path = f"database/{folder}/{filename}"
        client = ObsidianClient(self.vault_path)
        note_data = client.read_note(relative_path)
        if not note_data:
            dir_path = Path(self.vault_path) / "database" / folder
            if dir_path.exists():
                for f in dir_path.glob("*.md"):
                    if f.stem.lower() == id.lower() or f.stem.replace("_", " ").lower() == id.lower():
                        relative_path = f.relative_to(self.vault_path).as_posix()
                        note_data = client.read_note(relative_path)
                        break
        if not note_data:
            return f"'{id}' not found in {record_type}."
        post = frontmatter.Post(note_data["content"])
        post.metadata.update(note_data["metadata"])
        for k, v in properties.items():
            if k.lower() in ("course", "semester"):
                post.metadata[k] = re.sub(r'[\[\]]+', '', str(v)).strip()
            else:
                post.metadata[k] = v
        success = client.write_note(relative_path, frontmatter.dumps(post))
        if success:
            return f"Updated {record_type} '{id}'."
        return f"Failed to update {record_type} '{id}'."

    def delete_academic_record(self, record_type: str, id: str) -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        folder = self.folder_map.get(record_type.lower(), record_type.lower())
        filename = f"{to_underscore_title_case(id)}.md"
        relative_path = f"database/{folder}/{filename}"
        client = ObsidianClient(self.vault_path)
        success = client.delete_item(relative_path)
        if success:
            return f"Deleted {record_type} '{id}'."
        return f"'{id}' not found in {record_type}."

    # ── Practice / FSRS tools ──────────────────────────────────────────────

    async def generate_quiz(self, hub_id: str, count: int = 5, difficulty: str = "L1") -> str:
        if not self.vault_path:
            return "Error: Vault path not configured."
        service = AterService(self.secrets)
        config_raw = {"question_count": min(max(count, 1), 15), "difficulty": difficulty, "question_type": "Multiple Choice"}
        try:
            res = await service.generate_practice(hub_id, config_raw)
            questions = res.get("questions", [])
            if not questions:
                return "No questions generated. The hub may be empty or the AI service returned nothing."
            questions_list = []
            for q in questions:
                q_dict = q.model_dump() if hasattr(q, "model_dump") else dict(q)
                q_dict = {k: v for k, v in q_dict.items() if v is not None}
                questions_list.append(q_dict)
            hub_display = hub_id.replace("_", " ")
            # Return full interactive quiz block
            return f"Quiz on **{hub_display}** ({len(questions_list)} questions, {difficulty}):\n\n```interactive-quiz\n{json.dumps(questions_list, indent=2)}\n```"
        except Exception as e:
            return f"Error generating quiz: {e}"

    def get_srs_cards(self, hub_id: Optional[str] = None) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        db_path = Path(self.secrets.inbox_path) / "ater_queue.db"
        if not db_path.exists():
            return "No SRS cards yet."
        try:
            from src.domains.ater.srs import SRSEngine
            engine = SRSEngine(db_path)
            hub_notes = []
            if hub_id and hub_id != "all" and self.vault_path:
                service = AterService(self.secrets)
                hub_notes = [n["path"] for n in service.list_atomic_notes(hub_id)]
            cards = engine.get_due(hub_notes if hub_notes else None)
            if not cards:
                label = f"hub '{hub_id}'" if hub_id else "any hub"
                return f"No cards due for review in {label}."
            card_list = [
                {
                    "title": Path(c.note_path).stem.replace("_", " "),
                    "path": c.note_path,
                    "due": c.due.strftime('%Y-%m-%d'),
                    "difficulty": round(c.difficulty, 2),
                    "stability": round(c.stability, 2),
                    "reps": c.reps
                }
                for c in cards[:20]
            ]
            return self.render_ui("srs_deck", card_list)
        except Exception as e:
            return f"Error fetching SRS cards: {e}"

    def override_srs_stability(self, note_path: str, manual_stability: float) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        db_path = Path(self.secrets.inbox_path) / "ater_queue.db"
        if not db_path.exists():
            return "SRS database does not exist."
        try:
            from src.domains.ater.srs import SRSEngine
            engine = SRSEngine(db_path)
            days_ahead = max(1, int(manual_stability * 9))
            new_due = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat()
            engine.conn.execute(
                "UPDATE srs_cards SET stability=?, due=? WHERE note_path=?",
                (manual_stability, new_due, note_path)
            )
            engine.conn.commit()
            stem = Path(note_path).stem.replace("_", " ")
            return f"Updated SRS stability for '{stem}'. Next review in ~{days_ahead} days."
        except Exception as e:
            return f"Error overriding SRS stability: {e}"

    def get_study_history(self, limit: int = 10) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        db_path = Path(self.secrets.inbox_path) / "ater_queue.db"
        if not db_path.exists():
            return "No study history yet."
        try:
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            sessions = [dict(r) for r in conn.execute(
                "SELECT * FROM study_sessions ORDER BY timestamp DESC LIMIT ?", (limit,)
            ).fetchall()]
            practice = [dict(r) for r in conn.execute(
                "SELECT * FROM practice_log ORDER BY timestamp DESC LIMIT ?", (limit,)
            ).fetchall()]
            conn.close()
            return self.render_ui("study_history", {"sessions": sessions, "practice": practice}, caption="Recent Study History")
        except Exception as e:
            return f"Error reading study history: {e}"

    def get_app_config(self) -> str:
        """Fetch all current application and configuration settings."""
        config_data = {
            "display_name": self.user_context.get("display_name", ""),
            "obsidian_vault_path": self.user_context.get("obsidian_vault_path", self.secrets.vault_path or ""),
            "inbox_path": self.user_context.get("inbox_path", self.secrets.inbox_path or ""),
            "academic_folder_path": self.user_context.get("academic_folder_path", self.secrets.academic_path or ""),
            "auto_deploy": self.user_context.get("auto_deploy", self.secrets.auto_deploy),
            "pomodoro_work_duration": self.user_context.get("pomodoro_work_duration", 25),
            "pomodoro_short_break_duration": self.user_context.get("pomodoro_short_break_duration", 5),
            "pomodoro_long_break_duration": self.user_context.get("pomodoro_long_break_duration", 15),
            "pomodoro_sessions_before_long_break": self.user_context.get("pomodoro_sessions_before_long_break", 4),
            "show_properties": self.user_context.get("show_properties", False),
            "ai_provider": self.user_context.get("ai_provider", self.secrets.ai_provider),
            "ai_model": self.user_context.get("ai_model", self.secrets.ai_model),
            "ai_base_url": self.user_context.get("ai_base_url", self.secrets.ai_base_url or ""),
        }
        return self.render_ui("app_config", config_data, caption="System Configuration Settings")

    def update_app_config(self, key_values: Dict[str, Any]) -> str:
        """
        Update system settings.
        Valid keys: 'display_name', 'obsidian_vault_path', 'inbox_path', 'academic_folder_path',
        'auto_deploy', 'show_properties', 'pomodoro_work_duration', 'pomodoro_short_break_duration',
        'pomodoro_long_break_duration', 'pomodoro_sessions_before_long_break', 'ai_provider', 'ai_model', 'ai_base_url'.
        """
        mapped = {}
        key_map = {
            "display_name": "displayName",
            "displayname": "displayName",
            "displayName": "displayName",
            "obsidian_vault_path": "obsidianVaultPath",
            "obsidianvaultpath": "obsidianVaultPath",
            "obsidianVaultPath": "obsidianVaultPath",
            "inbox_path": "inboxPath",
            "inboxpath": "inboxPath",
            "inboxPath": "inboxPath",
            "academic_folder_path": "academicFolderPath",
            "academicfolderpath": "academicFolderPath",
            "academicFolderPath": "academicFolderPath",
            "auto_deploy": "autoDeploy",
            "autodeploy": "autoDeploy",
            "autoDeploy": "autoDeploy",
            "show_properties": "showProperties",
            "showproperties": "showProperties",
            "showProperties": "showProperties",
            "pomodoro_work_duration": "pomodoroWorkDuration",
            "pomodoroworkduration": "pomodoroWorkDuration",
            "pomodoroWorkDuration": "pomodoroWorkDuration",
            "pomodoro_short_break_duration": "pomodoroShortBreakDuration",
            "pomodoroshortbreakduration": "pomodoroShortBreakDuration",
            "pomodoroShortBreakDuration": "pomodoroShortBreakDuration",
            "pomodoro_long_break_duration": "pomodoroLongBreakDuration",
            "pomodorolongbreakduration": "pomodoroLongBreakDuration",
            "pomodoroLongBreakDuration": "pomodoroLongBreakDuration",
            "pomodoro_sessions_before_long_break": "pomodoroSessionsBeforeLongBreak",
            "pomodorosessionsbeforelongbreak": "pomodoroSessionsBeforeLongBreak",
            "pomodoroSessionsBeforeLongBreak": "pomodoroSessionsBeforeLongBreak",
            "ai_provider": "aiProvider",
            "aiprovider": "aiProvider",
            "aiProvider": "aiProvider",
            "ai_model": "aiModel",
            "aimodel": "aiModel",
            "aiModel": "aiModel",
            "ai_base_url": "aiBaseUrl",
            "aibaseurl": "aiBaseUrl",
            "aiBaseUrl": "aiBaseUrl",
        }
        
        for k, v in key_values.items():
            mapped_key = key_map.get(k, k)
            if mapped_key in ("pomodoroWorkDuration", "pomodoroShortBreakDuration", "pomodoroLongBreakDuration", "pomodoroSessionsBeforeLongBreak"):
                try:
                    mapped[mapped_key] = int(v)
                except ValueError:
                    mapped[mapped_key] = v
            elif mapped_key in ("autoDeploy", "showProperties"):
                if isinstance(v, str):
                    mapped[mapped_key] = v.lower() == "true"
                else:
                    mapped[mapped_key] = bool(v)
            else:
                mapped[mapped_key] = v
                
        payload = {"action": "update_config", "key_values": mapped}
        return f"ACTION:{json.dumps(payload)}"

    def factory_reset(self) -> str:
        """Perform system factory reset."""
        return f"ACTION:{json.dumps({'action': 'factory_reset'})}"

    def clear_study_history(self) -> str:
        """Clear all practice and session logs."""
        return f"ACTION:{json.dumps({'action': 'clear_study_history'})}"

    async def validate_feynman_explanation(self, note_path: str, explanation: str) -> str:
        """Use AI to validate the user's Feynman explanation for a note."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        try:
            # We call the FastAPI endpoint or service directly to validate
            service = AterService(self.secrets)
            # Find the actual FSRS note path or resolve relative path
            # Resolve db_path
            db_path = Path(self.secrets.inbox_path) / "ater_queue.db" if self.secrets.inbox_path else None
            if not db_path or not db_path.exists():
                return "Error: SRS queue database not initialized."
            from src.domains.ater.srs import SRSEngine
            engine = SRSEngine(db_path)
            res = await engine.validate_feynman(self.secrets, note_path, explanation)
            
            # Emit action to frontend to update UI state
            payload = {
                "action": "feynman_validated",
                "note_path": note_path,
                "is_valid": res.get("is_valid", False),
                "feedback": res.get("feedback", ""),
                "score": res.get("score", 0)
            }
            return f"ACTION:{json.dumps(payload)}"
        except Exception as e:
            logger.error(f"Feynman validation failed: {e}", exc_info=True)
            return f"Error validating explanation: {e}"

    async def generate_custom_practice(self, hub_id: str, difficulty: str = "Mixed", preset: str = "balanced") -> str:
        """Generate a practice quiz session with custom parameters."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        try:
            # Look up preset distribution
            presets = {
                "balanced": {"mcq":2, "true_false":2, "writing":1, "fill_in":2, "matching":1, "order":1, "synthesis":1, "calculation":1, "data_analysis":1},
                "mcq_blitz": {"mcq":15, "true_false":5},
                "deep_write": {"writing":4, "synthesis":3, "trace":2, "debug":2},
                "math_mode": {"calculation":6, "data_analysis":4, "trace":3},
                "recall": {"mcq":5, "true_false":5, "fill_in":5},
                "hard_mode": {"writing":2, "synthesis":3, "calculation":3, "debug":2, "trace":2, "data_analysis":2},
                "exam_sim": {"mcq":5, "true_false":3, "writing":2, "fill_in":3, "calculation":2, "matching":2, "order":1}
            }
            dist = presets.get(preset.lower(), presets["balanced"])
            service = AterService(self.secrets)
            config_payload = {
                "difficulty": difficulty,
                "questionDistribution": dist,
                "hubId": hub_id
            }
            res = await service.generate_practice(hub_id, config_payload)
            questions = res.get("questions", [])
            if not questions:
                return "No questions generated."
            
            # Emit action to start custom quiz
            payload = {
                "action": "custom_practice_start",
                "hub_id": hub_id,
                "quiz_path": res.get("quiz_path"),
                "questions_count": len(questions)
            }
            return f"ACTION:{json.dumps(payload)}"
        except Exception as e:
            logger.error(f"Generate custom practice failed: {e}", exc_info=True)
            return f"Error: {e}"

    def get_generated_files(self) -> str:
        """Get list of successfully processed notes in the Generated archive."""
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        
        generated_dir = Path(self.secrets.inbox_path) / "Generated"
        if not generated_dir.exists() or not generated_dir.is_dir():
            return "No files in the Generated folder."
            
        files = []
        try:
            for f in generated_dir.rglob("*"):
                if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in {'.pdf', '.txt', '.md', '.py', '.js', '.ts'}:
                    size_mb = f.stat().st_size / (1024 * 1024)
                    files.append({
                        "name": f.name,
                        "path": str(f.absolute()),
                        "size": f"{size_mb:.2f} MB",
                        "type": f.suffix.upper()[1:]
                    })
                    if len(files) >= 30:
                        break
        except Exception as e:
            logger.error(f"Error reading generated files: {e}")
            return f"Error reading generated files: {e}"
            
        if not files:
            return "No generated files found."
            
        return self.render_ui("inbox_gallery", {"files": files})


    # ── Pomodoro control tools (SSE action events → frontend store) ────────

    def start_pomodoro(self, duration_minutes: int = 25, hub_id: Optional[str] = None) -> str:
        """Start the Pomodoro focus timer."""
        duration = max(5, min(duration_minutes, 90))
        payload = {"action": "pomodoro_start", "duration_minutes": duration}
        if hub_id:
            payload["hub_id"] = hub_id
        return f"ACTION:{json.dumps(payload)}"

    def pause_pomodoro(self) -> str:
        """Pause/resume the Pomodoro timer."""
        return f"ACTION:{json.dumps({'action': 'pomodoro_pause'})}"

    def stop_pomodoro(self) -> str:
        """Stop and reset the Pomodoro timer."""
        return f"ACTION:{json.dumps({'action': 'pomodoro_stop'})}"

    def set_pomodoro_hub(self, hub_id: str) -> str:
        """Set the study hub for the Pomodoro session."""
        return f"ACTION:{json.dumps({'action': 'pomodoro_set_hub', 'hub_id': hub_id})}"

    # ── Navigation tools ───────────────────────────────────────────────────

    def navigate_to_route(self, route: str) -> str:
        valid_routes = {"/oracle", "/obsidian", "/academic", "/practice", "/agents", "/settings"}
        base = route.split("?")[0]
        if base not in valid_routes:
            return f"'{base}' is not a valid route. Valid: {', '.join(sorted(valid_routes))}."
        return f"ACTION:{json.dumps({'action': 'navigate', 'route': route})}"

    def navigate_to_note(self, note_path: str) -> str:
        if self.vault_path and not note_path.endswith(".md"):
            root = Path(self.vault_path)
            stem_target = note_path.replace(" ", "_").lower()
            for file in root.rglob("*.md"):
                if file.stem.replace(" ", "_").lower() == stem_target:
                    note_path = file.relative_to(root).as_posix()
                    break
        from urllib.parse import quote
        encoded = quote(note_path)
        return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/obsidian?path={encoded}'})}"

    def switch_academic_tab(self, tab: str) -> str:
        # The academic route uses uppercase tab params: ?tab=COURSES
        tab_map = {
            "courses": "COURSES",
            "semesters": "PROGRAM",  # semesters are under Program
            "exams": "EXAMS",
            "assignments": "ASSIGNMENTS",
            "planner": "PLANNER",
            "program": "PROGRAM",
            "practice": "PRACTICE",
            "calendar": "CALENDAR",
        }
        tab_lower = tab.lower()
        tab_value = tab_map.get(tab_lower, tab.upper())
        return f"ACTION:{json.dumps({'action': 'navigate', 'route': f'/academic?tab={tab_value}'})}"

    def trigger_notification(self, variant: str, message: str) -> str:
        valid = {"success", "error", "info", "warning"}
        if variant not in valid:
            variant = "info"
        return f"ACTION:{json.dumps({'action': 'toast', 'variant': variant, 'message': message})}"

    # ── Dynamic UI rendering tool ──────────────────────────────────────────

    def render_ui(self, ui_type: str, data: Any, caption: Optional[str] = None) -> str:
        """
        Wraps structured data in an ater-ui code block.
        The frontend CodeRenderer intercepts this and renders rich card/list components.
        """
        payload = {"ui_type": ui_type, "data": data}
        if caption:
            payload["caption"] = caption
        block = f"```ater-ui\n{json.dumps(payload, indent=2)}\n```"
        return block

    # ── Agent Pipeline / Ingestion tools ───────────────────────────────────

    def get_inbox_files(self) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        inbox = Path(self.secrets.inbox_path)
        if not inbox.exists() or not inbox.is_dir():
            return f"Inbox directory not found at {inbox}."
        
        files = []
        try:
            # Look for files directly in inbox and in subfolders
            # Avoid the 'Generated' folder if it exists
            generated_dir = inbox / "Generated"
            
            for f in inbox.rglob("*"):
                if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in {'.pdf', '.txt', '.md', '.py', '.js'}:
                    # Skip files inside the 'Generated' directory
                    if generated_dir.exists() and (generated_dir in f.parents or str(f.absolute()).startswith(str(generated_dir.absolute()))):
                        continue
                        
                    size_mb = f.stat().st_size / (1024 * 1024)
                    files.append({
                        "name": f.name,
                        "path": str(f.absolute()),
                        "size": f"{size_mb:.1f} MB",
                        "type": f.suffix.upper()[1:]
                    })
                    
                    if len(files) >= 20: # Limit to 20 files for UI performance
                        break
        except Exception as e:
            logger.error(f"[Assistant] Error reading inbox: {e}")
            return f"Error reading inbox: {e}"
            
        if not files:
            return "Your inbox is currently empty."
        
        return self.render_ui("inbox_gallery", {"files": files})

    def get_queue_status(self) -> str:
        if not self.secrets.inbox_path:
            return "Error: Inbox path not configured."
        db_path = Path(self.secrets.inbox_path) / "ater_queue.db"
        if not db_path.exists():
            return "Queue database not found. Ingestion may not have run yet."
        try:
            import sys
            main_module = sys.modules.get("src.api.main")
            watcher = getattr(main_module, "ater_watcher", None) if main_module else None
            
            if watcher:
                status_dict = watcher.get_status()
            else:
                conn = sqlite3.connect(str(db_path))
                conn.row_factory = sqlite3.Row
                # Correct table is 'queue' per watcher.py line 129
                rows = conn.execute("SELECT status, count(*) as c FROM queue GROUP BY status").fetchall()
                status_counts = {r['status']: r['c'] for r in rows}
                pending_count = status_counts.get("pending", 0)
                conn.close()
                status_dict = {
                    "status": "idle",
                    "auto_process": self.secrets.auto_deploy,
                    "active_files": [],
                    "current_file": None,
                    "current_batch": 0,
                    "total_batches": 0,
                    "last_action": "Offline",
                    "queue_size": pending_count,
                    "governor_pressure": 0,
                }
            return self.render_ui("queue_status", status_dict, caption="Background Ingestion Pipeline")
        except Exception as e:
            logger.error(f"[Assistant] Error reading queue status: {e}", exc_info=True)
            return f"Error reading queue: {e}"

    def toggle_auto_deploy(self, state: bool) -> str:
        """
        Emits an SSE action that the frontend handles to toggle auto-deploy in Tauri config
        and hit the backend watcher toggle endpoint.
        """
        return f"ACTION:{json.dumps({'action': 'toggle_auto_deploy', 'state': state})}"

    async def start_generation(self, file_path: str, target_hub_id: Optional[str] = None) -> str:
        """Phase 1-3 trigger: Detect -> Plan -> Confirm automatically."""
        if not self.vault_path:
            return "Error: Vault path not configured."
        
        service = AterService(self.secrets)
        si_path = str(AterService.resolve_si_path())
        
        try:
            # Phase 1: Detection
            detection = await service.detect_curriculum(file_path)
            curriculum = detection.get("detected_curriculum", {})
            
            # Phase 2: Planning
            plan_res = await service.generate_plan(file_path, si_path, curriculum, target_hub_id)
            session_id = plan_res.get("session_id")
            plan = plan_res.get("plan_structured", {})
            
            if not session_id:
                return "Failed to initialize generation session."
            
            # Return interactive stepper instead of just confirming
            return self.render_ui("generation_stepper", {
                "session_id": session_id,
                "file_path": file_path,
                "curriculum": curriculum,
                "plan": plan,
                "current_step": 2
            }, caption="Note Generation Pipeline")

        except Exception as e:
            logger.error(f"[Ater Assistant] Generation trigger failed: {e}")
            return f"Failed to start generation: {e}"

    def get_focus_hud(self) -> str:
        """Renders the interactive Pomodoro Focus HUD."""
        return self.render_ui("focus_hud", {})

    def get_academic_calendar(self) -> str:
        """Fetches upcoming exams and assignments for the calendar bar."""
        if not self.vault_path: return "Error: Vault path not configured."
        
        exams = json.loads(self.query_academic_database("exams")).get("records", [])
        assignments = json.loads(self.query_academic_database("assignments")).get("records", [])
        
        events = []
        for e in exams[:5]:
            events.append({
                "type": "Exam",
                "title": e.get("title", "Exam").replace("_", " "),
                "date": e.get("metadata", {}).get("Date") or e.get("date") or "TBD",
                "priority": "High"
            })
        for a in assignments[:5]:
            events.append({
                "type": "Assignment",
                "title": a.get("title", "Assignment").replace("_", " "),
                "date": a.get("metadata", {}).get("Due Date") or a.get("due_date") or "TBD",
                "priority": "Normal"
            })
        
        # Sort by date (naive)
        events.sort(key=lambda x: x["date"])
        return self.render_ui("calendar_bar", {"events": events})

    # ── Tool registry ──────────────────────────────────────────────────────

    def get_tools(self) -> List[StructuredTool]:
        return [
            # Vault
            StructuredTool.from_function(name="search_notes_fulltext", func=self.search_notes_fulltext,
                description="Search vault notes for keywords. Returns matching files. Always call render_ui after with the results.",
                args_schema=SearchNotesInput),
            StructuredTool.from_function(name="search_notes_by_tag", func=self.search_notes_by_tag,
                description="Find all notes with a specific Obsidian tag.",
                args_schema=SearchVaultByTagInput),
            StructuredTool.from_function(name="read_note", func=self.read_note,
                description="Read the full markdown content of a note by path or title.",
                args_schema=ReadNoteInput),
            StructuredTool.from_function(name="write_note", func=self.write_note,
                description="Create or overwrite a markdown note in the vault.",
                args_schema=WriteNoteInput),
            StructuredTool.from_function(name="rename_note", func=self.rename_note,
                description="Rename or move a note in the vault.",
                args_schema=RenameNoteInput),
            StructuredTool.from_function(name="delete_note", func=self.delete_note,
                description="Delete a markdown note from the vault.",
                args_schema=DeleteNoteInput),
            StructuredTool.from_function(name="get_vault_stats", func=self.get_vault_stats,
                description="Get vault statistics: total note count, hub count, hub names.",
                args_schema=GetVaultStatsInput),
            StructuredTool.from_function(name="get_hubs", func=self.list_hubs,
                description="List all study hubs in the vault with their note counts. Always call render_ui after with ui_type='hub_cards'.",
                args_schema=ListHubsInput),
            # Pipeline
            StructuredTool.from_function(name="get_inbox_files", func=self.get_inbox_files,
                description="Get a list of PDF/Text files currently waiting in the inbox.",
                args_schema=GetInboxFilesInput),
            StructuredTool.from_function(name="get_queue_status", func=self.get_queue_status,
                description="Check the background ingestion queue status and AI pressure.",
                args_schema=GetQueueStatusInput),
            StructuredTool.from_function(name="toggle_auto_deploy", func=self.toggle_auto_deploy,
                description="Enable or disable the background auto-deploy pipeline. Emits an action to the frontend.",
                args_schema=ToggleAutoDeployInput),
            StructuredTool.from_function(name="start_generation", coroutine=self.start_generation,
                description="Start the full Ater note generation pipeline for an inbox file. This detects curriculum, builds a study plan, and deploys agents to generate atomic notes.",
                args_schema=StartGenerationInput),
            # Academic DB
            StructuredTool.from_function(name="query_academic_database", func=self.query_academic_database,
                description="List all records of a given type (courses, semesters, exams, assignments, planner, years). Always call render_ui after.",
                args_schema=QueryAcademicDatabaseInput),
            StructuredTool.from_function(name="create_academic_record", func=self.create_academic_record,
                description="Create a new course, semester, exam, assignment, or study planner entry.",
                args_schema=CreateAcademicRecordInput),
            StructuredTool.from_function(name="update_academic_record", func=self.update_academic_record,
                description="Update metadata fields on an existing academic record.",
                args_schema=UpdateAcademicRecordInput),
            StructuredTool.from_function(name="delete_academic_record", func=self.delete_academic_record,
                description="Delete an academic record from the database.",
                args_schema=DeleteAcademicRecordInput),
            # Practice / FSRS
            StructuredTool.from_function(name="generate_quiz", coroutine=self.generate_quiz,
                description="Generate an interactive MCQ quiz for a study hub.",
                args_schema=GenerateQuizInput),
            StructuredTool.from_function(name="get_srs_cards", func=self.get_srs_cards,
                description="Get FSRS cards due for review. Always call render_ui after with ui_type='srs_deck'.",
                args_schema=GetSrsCardsInput),
            StructuredTool.from_function(name="override_srs_stability", func=self.override_srs_stability,
                description="Override FSRS memory stability for a note to postpone or accelerate its review.",
                args_schema=OverrideSrsStabilityInput),
            StructuredTool.from_function(name="get_study_history", func=self.get_study_history,
                description="Get recent study sessions and practice log entries.",
                args_schema=GetStudyHistoryInput),
            # Pomodoro
            StructuredTool.from_function(name="start_pomodoro", func=self.start_pomodoro,
                description="Start the Pomodoro focus timer. Optionally set duration and hub.",
                args_schema=PomodoroStartInput),
            StructuredTool.from_function(name="pause_pomodoro", func=self.pause_pomodoro,
                description="Pause or resume the Pomodoro timer.",
                args_schema=BaseModel),
            StructuredTool.from_function(name="stop_pomodoro", func=self.stop_pomodoro,
                description="Stop and reset the Pomodoro timer.",
                args_schema=BaseModel),
            StructuredTool.from_function(name="set_pomodoro_hub", func=self.set_pomodoro_hub,
                description="Set the study hub for the current Pomodoro session.",
                args_schema=PomodoroSetHubInput),
            StructuredTool.from_function(name="get_focus_hud", func=self.get_focus_hud,
                description="Show the interactive Pomodoro Focus HUD for timer control.",
                args_schema=BaseModel),
            StructuredTool.from_function(name="get_academic_calendar", func=self.get_academic_calendar,
                description="Show the academic calendar bar with upcoming exams and assignments.",
                args_schema=BaseModel),
            # Navigation
            StructuredTool.from_function(name="navigate_to_route", func=self.navigate_to_route,
                description=(
                    "Navigate the app to a page. Options: /oracle, /obsidian, /academic, /practice, /agents, /settings. "
                    "Use /academic?tab=courses etc. for specific tabs."
                ),
                args_schema=NavigateToRouteInput),
            StructuredTool.from_function(name="navigate_to_note", func=self.navigate_to_note,
                description="Open a specific note in the vault viewer.",
                args_schema=NavigateToNoteInput),
            StructuredTool.from_function(name="switch_academic_tab", func=self.switch_academic_tab,
                description="Switch the Academic Dashboard to a specific tab: courses, semesters, exams, assignments, planner, program.",
                args_schema=SwitchAcademicTabInput),
            StructuredTool.from_function(name="trigger_notification", func=self.trigger_notification,
                description="Show a toast notification (success, error, info, warning).",
                args_schema=TriggerNotificationInput),
            # Settings Management
            StructuredTool.from_function(name="get_app_config", func=self.get_app_config,
                description="Fetch all current application and configuration settings.",
                args_schema=GetAppConfigInput),
            StructuredTool.from_function(name="update_app_config", func=self.update_app_config,
                description="Update one or more application configurations or system settings.",
                args_schema=UpdateAppConfigInput),
            StructuredTool.from_function(name="factory_reset", func=self.factory_reset,
                description="Perform a system factory reset, clearing all settings, configurations, and keys.",
                args_schema=FactoryResetInput),
            StructuredTool.from_function(name="clear_study_history", func=self.clear_study_history,
                description="Delete all study history (telemetry, practice log, study sessions) from the database.",
                args_schema=ClearStudyHistoryInput),
            # Practice presets / Feynman
            StructuredTool.from_function(name="generate_custom_practice", func=self.generate_custom_practice,
                description="Generate a custom practice quiz session with specific preset question type distributions.",
                args_schema=GenerateCustomPracticeInput),
            StructuredTool.from_function(name="validate_feynman_explanation", func=self.validate_feynman_explanation,
                description="Validate a user's Feynman explanation for a note using AI.",
                args_schema=ValidateFeynmanExplanationInput),
            StructuredTool.from_function(name="get_generated_files", func=self.get_generated_files,
                description="List all processed notes in the Generated folder.",
                args_schema=GetGeneratedFilesInput),
            # Dynamic UI
            StructuredTool.from_function(name="render_ui", func=self.render_ui,
                description=(
                    "ALWAYS use this after fetching data to display it as rich UI cards instead of plain text. "
                    "For courses → ui_type='course_cards'. For notes → 'note_cards'. For hubs → 'hub_cards'. "
                    "For exams → 'exam_list'. For assignments → 'assignment_list'. For SRS → 'srs_deck'. "
                    "For stats → 'stats'. For semesters → 'semester_list'."
                ),
                args_schema=RenderUIInput),
        ]

    async def execute_tool(self, name: str, args: dict) -> str:
        try:
            dispatch = {
                "search_notes_fulltext": lambda: self.search_notes_fulltext(**args),
                "search_notes_by_tag": lambda: self.search_notes_by_tag(**args),
                "read_note": lambda: self.read_note(**args),
                "write_note": lambda: self.write_note(**args),
                "rename_note": lambda: self.rename_note(**args),
                "delete_note": lambda: self.delete_note(**args),
                "get_vault_stats": lambda: self.get_vault_stats(),
                "get_hubs": lambda: self.list_hubs(),
                "list_hubs": lambda: self.list_hubs(),
                "get_inbox_files": lambda: self.get_inbox_files(),
                "get_queue_status": lambda: self.get_queue_status(),
                "toggle_auto_deploy": lambda: self.toggle_auto_deploy(**args),
                "start_generation": lambda: self.start_generation(**args),
                "query_academic_database": lambda: self.query_academic_database(**args),
                "create_academic_record": lambda: self.create_academic_record(**args),
                "update_academic_record": lambda: self.update_academic_record(**args),
                "delete_academic_record": lambda: self.delete_academic_record(**args),
                "generate_quiz": lambda: self.generate_quiz(**args),
                "get_srs_cards": lambda: self.get_srs_cards(**args),
                "override_srs_stability": lambda: self.override_srs_stability(**args),
                "get_study_history": lambda: self.get_study_history(**args),
                "start_pomodoro": lambda: self.start_pomodoro(**args),
                "pause_pomodoro": lambda: self.pause_pomodoro(),
                "stop_pomodoro": lambda: self.stop_pomodoro(),
                "set_pomodoro_hub": lambda: self.set_pomodoro_hub(**args),
                "get_focus_hud": lambda: self.get_focus_hud(),
                "get_academic_calendar": lambda: self.get_academic_calendar(),
                "navigate_to_route": lambda: self.navigate_to_route(**args),
                "navigate_to_note": lambda: self.navigate_to_note(**args),
                "switch_academic_tab": lambda: self.switch_academic_tab(**args),
                "trigger_notification": lambda: self.trigger_notification(**args),
                "render_ui": lambda: self.render_ui(**args),
                "get_app_config": lambda: self.get_app_config(),
                "update_app_config": lambda: self.update_app_config(**args),
                "factory_reset": lambda: self.factory_reset(),
                "clear_study_history": lambda: self.clear_study_history(),
                "generate_custom_practice": lambda: self.generate_custom_practice(**args),
                "validate_feynman_explanation": lambda: self.validate_feynman_explanation(**args),
                "get_generated_files": lambda: self.get_generated_files(),
            }
            fn = dispatch.get(name)
            if fn is None:
                return f"Unknown tool '{name}'."
            result = fn()
            if asyncio.iscoroutine(result):
                return await result
            return result
        except Exception as e:
            logger.error(f"[Tool Error] {name}({args}): {e}", exc_info=True)
            return f"Error executing '{name}': {e}"


# ─────────────────────────────────────────────────────────────────────────────
# Status messages
# ─────────────────────────────────────────────────────────────────────────────

def get_tool_status_message(name: str, args: dict) -> str:
    msgs = {
        "search_notes_fulltext": lambda: f"Searching vault for '{args.get('query', '')}'...",
        "search_notes_by_tag": lambda: f"Finding notes tagged #{args.get('tag', '')}...",
        "read_note": lambda: f"Reading '{args.get('path', '')}'...",
        "write_note": lambda: f"Writing '{args.get('path', '')}'...",
        "rename_note": lambda: f"Renaming '{args.get('old_path', '')}'...",
        "delete_note": lambda: f"Deleting '{args.get('path', '')}'...",
        "get_vault_stats": lambda: "Getting vault stats...",
        "get_hubs": lambda: "Listing study hubs...",
        "list_hubs": lambda: "Listing study hubs...",
        "get_inbox_files": lambda: "Checking inbox...",
        "get_queue_status": lambda: "Checking background pipeline...",
        "toggle_auto_deploy": lambda: f"{'Enabling' if args.get('state') else 'Disabling'} auto-deploy...",
        "start_generation": lambda: f"Triggering agent pipeline for '{Path(args.get('file_path', '')).name}'...",
        "query_academic_database": lambda: f"Fetching {args.get('record_type', '')}...",
        "create_academic_record": lambda: f"Creating {args.get('record_type', '')} '{args.get('title', '')}'...",
        "update_academic_record": lambda: f"Updating {args.get('record_type', '')} '{args.get('id', '')}'...",
        "delete_academic_record": lambda: f"Deleting {args.get('record_type', '')} '{args.get('id', '')}'...",
        "generate_quiz": lambda: f"Generating quiz for '{args.get('hub_id', '')}'...",
        "get_srs_cards": lambda: "Loading review cards...",
        "override_srs_stability": lambda: f"Updating SRS for '{args.get('note_path', '')}'...",
        "get_study_history": lambda: "Fetching study history...",
        "start_pomodoro": lambda: f"Starting {args.get('duration_minutes', 25)}min focus timer...",
        "pause_pomodoro": lambda: "Pausing timer...",
        "stop_pomodoro": lambda: "Stopping timer...",
        "set_pomodoro_hub": lambda: f"Setting focus hub to '{args.get('hub_id', '')}'...",
        "get_focus_hud": lambda: "Opening Focus HUD...",
        "get_academic_calendar": lambda: "Opening academic calendar...",
        "navigate_to_route": lambda: f"Navigating to {args.get('route', '')}...",
        "navigate_to_note": lambda: f"Opening '{args.get('note_path', '')}'...",
        "switch_academic_tab": lambda: f"Switching to {args.get('tab', '')} tab...",
        "trigger_notification": lambda: "Sending notification...",
        "render_ui": lambda: "Rendering...",
        "get_app_config": lambda: "Fetching settings...",
        "update_app_config": lambda: "Updating settings...",
        "factory_reset": lambda: "Performing factory reset...",
        "clear_study_history": lambda: "Clearing study history...",
        "generate_custom_practice": lambda: f"Generating custom quiz preset for '{args.get('hub_id', '')}'...",
        "validate_feynman_explanation": lambda: f"Analyzing Feynman explanation for '{Path(args.get('note_path', '')).stem.replace('_', ' ')}'...",
        "get_generated_files": lambda: "Listing generated notes...",
    }
    fn = msgs.get(name)
    return fn() if fn else f"Running {name}..."


# ─────────────────────────────────────────────────────────────────────────────
# Main agent loop
# ─────────────────────────────────────────────────────────────────────────────

async def run_assistant_chat(
    secrets: AppSecrets,
    messages_history: List[Dict[str, Any]],
    rag_context: Optional[str] = None,
    user_context: Optional[Dict[str, Any]] = None
):
    """
    Ater agent loop. Yields SSE events:
      data: {"type": "status",  "message": "..."}
      data: {"type": "chunk",   "content": "..."}
      data: {"type": "action",  "action": "navigate"|"toast"|"pomodoro_*", ...}
      data: {"type": "error",   "message": "..."}
    """
    assistant = AterAssistant(secrets, user_context)
    tools = assistant.get_tools()
    llm_with_tools = assistant.llm.bind_tools(tools)

    # ── Build system prompt ────────────────────────────────────────────────

    # Build pomodoro context string
    pomodoro_str = ""
    user_identity = "User"
    if user_context:
        display_name = user_context.get("display_name")
        if display_name:
            user_identity = display_name

        pm = user_context.get("pomodoro", {})
        if pm:
            status = "running" if pm.get("is_active") else "paused/stopped"
            time_left = pm.get("time_left", 0)
            mins = time_left // 60
            secs = time_left % 60
            pomodoro_str = (
                f"\n  Timer: {status}, {mins}m {secs}s left"
                f"\n  Mode: {pm.get('mode', 'focus')}"
                f"\n  Sessions completed: {pm.get('session_count', 0)}"
            )

    # Dynamically build vault and hub knowledge
    vault_notes = assistant.get_all_vault_notes()
    top_level_folders: set = set()
    if vault_notes:
        for n in vault_notes:
            parts = n["path"].split("/")
            if len(parts) > 1 and parts[0].lower() not in ("database", ".obsidian", ".trash"):
                top_level_folders.add(parts[0])

    # Retrieve actual study-planner hub IDs for generate_quiz / get_srs_cards
    planner_hub_entries: List[Dict[str, Any]] = []
    try:
        ater_service = AterService(secrets)
        planner_hub_entries = ater_service.list_planner_hubs()
    except Exception:
        pass

    hub_catalog_lines = []
    for h in planner_hub_entries:
        hub_id = h.get("id", "").replace(".md", "")
        hub_title = h.get("title", hub_id)
        hub_course = h.get("course", "")
        hub_semester = h.get("semester", "")
        meta = " | ".join(x for x in [hub_course, hub_semester] if x)
        hub_catalog_lines.append(f"  - ID: '{hub_id}' → {hub_title}" + (f" ({meta})" if meta else ""))

    hub_catalog_str = "\n".join(hub_catalog_lines) if hub_catalog_lines else "  (No study-planner hubs found — user must create them first.)"

    sys_prompt = (
        f"You are Ater, an AI assistant and controller for a desktop knowledge and study management app.\n"
        f"You are speaking with {user_identity}. You control every feature of the app through tool calls.\n\n"

        "=== STRICT BEHAVIORAL RULES ===\n"
        "1. TOOL-FIRST: For ANY request involving data (courses, hubs, exams, inbox, quiz, history, vault stats), call the correct tool. NEVER answer from memory or guess.\n"
        "2. NO MANUAL LISTS: NEVER write out lists, tables, or data manually. Always use the rendering tools.\n"
        "3. NO NARRATION: Never say 'I will now query...' or 'Let me check...'. Just call the tool and give a one-sentence reply.\n"
        "4. AFTER RICH UI TOOL: When you call a data tool (query_academic_database, list_hubs, generate_quiz, etc.) the UI renders automatically. Say one sentence only (e.g., 'Here are your courses.'). DO NOT repeat the data in text.\n"
        "5. SHORT REPLIES: Keep conversational text concise. No preambles, no filler like 'Of course!', 'Sure!', 'Great!'.\n"
        "6. NAVIGATION: When navigating ('/obsidian', '/academic?tab=EXAMS'), confirm in one sentence.\n"
        "7. POMODORO: For timer commands, call the Pomodoro tools immediately. Do not explain.\n"
        "8. PDF READING: When reading PDFs with read_note, cite pages as '[PDF Page X]'.\n"
        "9. IDENTITY: If the user asks for their name and you only know them as 'User', tell them to set their display name in Settings.\n\n"

        "=== APP PAGES ===\n"
        "  /oracle — This AI chat (you are here)\n"
        "  /obsidian — Vault browser and note editor\n"
        "  /academic — Academic dashboard (tabs: COURSES, EXAMS, ASSIGNMENTS, PLANNER, PROGRAM, CALENDAR)\n"
        "  /practice — FSRS spaced repetition practice arena\n"
        "  /agents — Note generation agent dashboard\n"
        "  /settings — AI keys, vault path, model config\n\n"

        "=== TOOL CATALOG ===\n"
        "VAULT TOOLS:\n"
        "  search_notes_fulltext(query) — Full-text keyword search across all notes. Returns note_cards UI.\n"
        "  search_notes_by_tag(tag) — Find notes by Obsidian tag. Returns note_cards UI.\n"
        "  read_note(path) — Read full content of a note or PDF by its relative vault path or title.\n"
        "  write_note(path, content) — Create or overwrite a note.\n"
        "  rename_note(old_path, new_path) — Rename/move a note.\n"
        "  delete_note(path) — Delete a note permanently.\n"
        "  get_vault_stats() — Get vault statistics (total notes, hub count). Returns stats UI.\n"
        "  get_hubs() — List all top-level study folders with note counts. Returns hub_cards UI.\n"
        "ACADEMIC DATABASE TOOLS:\n"
        "  query_academic_database(record_type) — List records. record_type must be one of: 'courses', 'semesters', 'exams', 'assignments', 'study planner', 'years'. Returns rich card UI automatically.\n"
        "  create_academic_record(record_type, title, properties) — Create a course, semester, exam, or assignment.\n"
        "    For 'courses': properties can include {Professor, Credits, Grade, Semester, Status}.\n"
        "    For 'exams': properties can include {course, date, weight, status, location}.\n"
        "    For 'assignments': properties can include {course, due_date, status, priority, weight}.\n"
        "  update_academic_record(record_type, id, properties) — Update fields on an existing record. 'id' is the record's title/filename stem.\n"
        "  delete_academic_record(record_type, id) — Delete a record.\n"
        "PIPELINE / INGESTION TOOLS:\n"
        "  get_inbox_files() — List PDFs and text files waiting in the inbox. Returns inbox_gallery UI.\n"
        "  get_queue_status() — Check the background ingestion queue. Returns queue_status UI.\n"
        "  toggle_auto_deploy(state: bool) — Enable/disable the auto-processing pipeline.\n"
        "  start_generation(file_path) — Kick off the full Ater note generation pipeline for an inbox file. Shows a live progress stepper in chat.\n"
        "PRACTICE / SRS TOOLS:\n"
        "  generate_quiz(hub_id, count, difficulty) — Generate an interactive quiz. hub_id MUST be the exact ID from the STUDY PLANNER HUB CATALOG below. difficulty is 'L1', 'L2', or 'L3'.\n"
        "  get_srs_cards(hub_id?) — Get FSRS flashcards due for review. hub_id is optional; if omitted, returns all due cards.\n"
        "  override_srs_stability(note_path, manual_stability) — Override the FSRS memory stability for a note (0.0-1.0 range).\n"
        "  get_study_history(limit?) — View recent study sessions and practice log. Returns study_history UI.\n"
        "POMODORO TOOLS:\n"
        "  start_pomodoro(duration_minutes?, hub_id?) — Start the focus timer (default: 25 min).\n"
        "  pause_pomodoro() — Toggle pause/resume the timer.\n"
        "  stop_pomodoro() — Stop and reset the timer.\n"
        "  set_pomodoro_hub(hub_id) — Set the study hub for the current session.\n"
        "  get_focus_hud() — Render the interactive Focus HUD in chat for timer control.\n"
        "  get_academic_calendar() — Render upcoming exams/assignments as a calendar bar.\n"
        "NAVIGATION TOOLS:\n"
        "  navigate_to_route(route) — Navigate to a page. Valid: /oracle, /obsidian, /academic, /practice, /agents, /settings. Use query params like /academic?tab=EXAMS.\n"
        "  navigate_to_note(note_path) — Open a specific note in the vault viewer.\n"
        "  switch_academic_tab(tab) — Switch academic dashboard tab. Tab names: courses, semesters, exams, assignments, planner, program.\n"
        "  trigger_notification(variant, message) — Show a toast. variant: 'success', 'error', 'info', 'warning'.\n"
        "CONFIG & RESET TOOLS:\n"
        "  get_app_config() — Fetch all settings: paths, AI provider/model, Pomodoro durations, display name. Returns app_config UI.\n"
        "  update_app_config(key_values) — Update settings. Valid keys: 'display_name', 'obsidian_vault_path', 'inbox_path', 'academic_folder_path', 'auto_deploy', 'show_properties', 'pomodoro_work_duration', 'pomodoro_short_break_duration', 'pomodoro_long_break_duration', 'pomodoro_sessions_before_long_break', 'ai_provider', 'ai_model', 'ai_base_url'.\n"
        "  factory_reset() — Perform a factory reset. This clears all keys, paths, and metadata, and reloads the application.\n"
        "  clear_study_history() — Delete all accumulated study history (telemetry, logs, sessions).\n"
        "PRACTICE PRESETS & FEYNMAN VALIDATION:\n"
        "  generate_custom_practice(hub_id, difficulty, preset) — Start a custom practice quiz session using specific question types distribution preset.\n"
        "  validate_feynman_explanation(note_path, explanation) — Validate a user's Feynman explanation for a specific note.\n"
        "  get_generated_files() — Get the list of files in the Generated folder.\n"
        "MANUAL UI RENDERING:\n"
        "  render_ui(ui_type, data, caption?) — Manually render a UI block. ui_type options:\n"
        "    'course_cards': data=[{title, Professor, Semester, Credits, Grade}]\n"
        "    'note_cards': data=[{title, path, tags, snippet}]\n"
        "    'hub_cards': data=[{name, note_count, description}]\n"
        "    'exam_list': data=[{name, course, date, weight, status}]\n"
        "    'assignment_list': data=[{name, course, due_date, status, priority}]\n"
        "    'stats': data={sessions_today, total_notes, due_cards, active_hub, streak}\n"
        "    'srs_deck': data=[{title, path, due, difficulty, reps}]\n"
        "    'semester_list': data=[{name, year, status, course_count}]\n\n"

        "=== STUDY PLANNER HUB CATALOG ===\n"
        "These are the EXACT hub IDs to use with generate_quiz and get_srs_cards:\n"
        + hub_catalog_str + "\n\n"

        "=== VAULT & POMODORO STATUS ===\n"
        f"Top-level study folders in vault: {', '.join(sorted(top_level_folders)) if top_level_folders else 'None found'}\n"
        f"Total notes in vault: {len(vault_notes)}\n"
        f"Pomodoro status: {pomodoro_str if pomodoro_str else 'not active'}\n"
    )

    # Active user context
    if user_context:
        active_hub = user_context.get("active_hub")
        if active_hub:
            sys_prompt += f"Current focus hub: {to_underscore_title_case(active_hub)}\n"

    # RAG context
    if rag_context:
        sys_prompt += f"\n<rag_context>\n{rag_context}\n</rag_context>\n"

    # ── Format message history ─────────────────────────────────────────────
    formatted_messages = [SystemMessage(content=sys_prompt)]
    for msg in messages_history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            formatted_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            clean = re.sub(r'ACTION:\{.*?\}', '', content).strip()
            if clean:
                formatted_messages.append(AIMessage(content=clean))

    # ── Agentic loop ───────────────────────────────────────────────────────
    for _ in range(8):
        accumulated_chunks = []
        has_tool_calls = False

        try:
            async for chunk in llm_with_tools.astream(formatted_messages):
                accumulated_chunks.append(chunk)
                if hasattr(chunk, "tool_call_chunks") and chunk.tool_call_chunks:
                    has_tool_calls = True
                elif not has_tool_calls and hasattr(chunk, "content") and chunk.content:
                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk.content})}\n\n"

            if not accumulated_chunks:
                break

            response = accumulated_chunks[0]
            for c in accumulated_chunks[1:]:
                response = response + c

        except Exception as stream_err:
            logger.warning(f"Streaming failed, falling back to invoke: {stream_err}")
            try:
                response = await llm_with_tools.ainvoke(formatted_messages)
            except Exception as invoke_err:
                logger.error(f"[Ater] invoke failed: {invoke_err}", exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'message': str(invoke_err)})}\n\n"
                return
            if not (hasattr(response, "tool_calls") and response.tool_calls):
                content = response.content or ""
                yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"
                return

        # Tool calls
        if hasattr(response, "tool_calls") and response.tool_calls:
            formatted_messages.append(response)
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_id = tool_call["id"]

                yield f"data: {json.dumps({'type': 'status', 'message': get_tool_status_message(tool_name, tool_args)})}\n\n"

                tool_result = await assistant.execute_tool(tool_name, tool_args)
                tool_result_str = str(tool_result)

                # Stream tool results that contain rich UI blocks
                is_rich_ui = tool_name in (
                    "render_ui", "generate_quiz", "search_notes_fulltext",
                    "get_inbox_files", "get_hubs", "list_hubs",
                    "query_academic_database", "get_srs_cards", "get_vault_stats",
                    "start_generation", "get_focus_hud", "get_academic_calendar",
                    "get_study_history", "get_app_config", "get_queue_status",
                    "get_generated_files"
                )

                if is_rich_ui:
                    ui_chunk_content = "\n\n" + tool_result_str + "\n\n"
                    yield f"data: {json.dumps({'type': 'chunk', 'content': ui_chunk_content})}\n\n"
                    # Tell the LLM the UI rendered — forbid any text summary of the data
                    tool_result_str = "[UI block rendered for user. Do NOT repeat or summarize this data in plain text. Just end your turn or ask a follow-up question.]"

                # ACTION: payloads → emit as SSE action events
                elif tool_result_str.startswith("ACTION:"):
                    try:
                        action_payload = json.loads(tool_result_str[7:])
                        yield f"data: {json.dumps({'type': 'action', **action_payload})}\n\n"
                        action_name = action_payload.get("action", "action")
                        tool_result_str = f"{action_name} executed."
                    except json.JSONDecodeError:
                        pass

                formatted_messages.append(ToolMessage(content=tool_result_str, tool_call_id=tool_id))
        else:
            break
