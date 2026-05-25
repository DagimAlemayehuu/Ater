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


# ─────────────────────────────────────────────────────────────────────────────
# AterAssistant Class
# ─────────────────────────────────────────────────────────────────────────────

class AterAssistant:
    def __init__(self, secrets: AppSecrets):
        self.secrets = secrets
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

        # Return structured data for rich UI rendering
        return json.dumps({"type": "search_results", "query": query, "results": matches})

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
        return json.dumps({"type": "tag_results", "tag": tag, "results": matches})

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
        return json.dumps({
            "type": "vault_stats",
            "total_notes": total_notes,
            "hub_count": len(hubs),
            "hubs": sorted(list(hubs))
        })

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
        result = [{"name": k, "note_count": v} for k, v in sorted(hubs.items())]
        if not result:
            return "No study hubs found in vault."
        return json.dumps({"type": "hub_list", "hubs": result})

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
                meta["_title"] = file.stem
                records.append(meta)
            except Exception:
                records.append({"_title": file.stem})
        return json.dumps({"type": "academic_records", "record_type": record_type, "records": records}, default=str)

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
            return f"Quiz on **{hub_display}** ({count} questions, {difficulty}):\n\n```interactive-quiz\n{json.dumps(questions_list[0], indent=2)}\n```"
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
                    "reps": c.reps
                }
                for c in cards[:20]
            ]
            return json.dumps({"type": "srs_cards", "cards": card_list})
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
            return json.dumps({"type": "study_history", "sessions": sessions, "practice": practice}, default=str)
        except Exception as e:
            return f"Error reading study history: {e}"

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
            StructuredTool.from_function(name="get_vault_stats", func=self.get_vault_stats,
                description="Get vault statistics: total note count, hub count, hub names.",
                args_schema=GetVaultStatsInput),
            StructuredTool.from_function(name="get_hubs", func=self.list_hubs,
                description="List all study hubs in the vault with their note counts. Always call render_ui after with ui_type='hub_cards'.",
                args_schema=ListHubsInput),
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
                "get_vault_stats": lambda: self.get_vault_stats(),
                "get_hubs": lambda: self.list_hubs(),
                "list_hubs": lambda: self.list_hubs(),
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
                "navigate_to_route": lambda: self.navigate_to_route(**args),
                "navigate_to_note": lambda: self.navigate_to_note(**args),
                "switch_academic_tab": lambda: self.switch_academic_tab(**args),
                "trigger_notification": lambda: self.trigger_notification(**args),
                "render_ui": lambda: self.render_ui(**args),
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
        "get_vault_stats": lambda: "Getting vault stats...",
        "get_hubs": lambda: "Listing study hubs...",
        "list_hubs": lambda: "Listing study hubs...",
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
        "navigate_to_route": lambda: f"Navigating to {args.get('route', '')}...",
        "navigate_to_note": lambda: f"Opening '{args.get('note_path', '')}'...",
        "switch_academic_tab": lambda: f"Switching to {args.get('tab', '')} tab...",
        "trigger_notification": lambda: "Sending notification...",
        "render_ui": lambda: "Rendering...",
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
    assistant = AterAssistant(secrets)
    tools = assistant.get_tools()
    llm_with_tools = assistant.llm.bind_tools(tools)

    # ── Build system prompt ────────────────────────────────────────────────
    # CRITICAL: Use XML tags, NOT square brackets.
    # Square brackets (e.g. [SECTION]) confuse Groq/Llama's tool-call parser
    # and cause 400 tool_use_failed errors.

    # Build pomodoro context string
    pomodoro_str = ""
    if user_context:
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

    sys_prompt = (
        "You are Ater, an AI assistant built into a desktop knowledge and study management app.\n"
        "You control every feature of the app through tool calls.\n\n"
        "STRICT RULES:\n"
        "1. Keep conversational replies short and direct (no conversational filler, no preambles like 'Of course!'). However, when asked to explain, summarize, or teach a concept or PDF textbook, you must provide comprehensive, rich, and high-quality educational content directly in plain markdown (use headers, bullet points, and equations; never wrap these explanations/summaries in code blocks unless showing actual code snippets).\n"
        "2. For any database lists (courses, notes, hubs, SRS cards, history): ALWAYS call render_ui AFTER fetching the data. Never show raw JSON or raw database lists as text.\n"
        "3. For navigation requests ('open', 'go to', 'show me'): call the navigate tool AND say one short sentence.\n"
        "4. For Pomodoro ('start timer', 'pause', 'stop', 'focus on X'): call the Pomodoro tool immediately.\n"
        "5. When you're unsure what the user wants, ask ONE short clarifying question.\n"
        "6. State what you CAN'T do (e.g. 'I can't edit settings directly, but I can take you there').\n"
        "7. For note links use ((Note_Title)) not [[...]] — double brackets crash the parser.\n"
        "8. When you navigate, briefly confirm what you did in one sentence.\n"
        "9. You can read and study PDF files (.pdf) in the vault using the read_note tool. When explaining or summarizing from PDFs, cite pages as '[PDF Page X]' where appropriate.\n\n"
        "APP PAGES:\n"
        "  /oracle — This AI chat (you are here)\n"
        "  /obsidian — Vault browser and note editor\n"
        "  /academic — Academic dashboard (tabs: courses, semesters, exams, assignments, planner, program)\n"
        "  /practice — FSRS spaced repetition practice arena\n"
        "  /agents — Note generation agent dashboard\n"
        "  /settings — AI keys, vault path, model config\n\n"
        "POMODORO TIMER:\n"
        "  The timer lives in the app header. You can start (25min default), pause, stop, or set a hub.\n"
        "  Current pomodoro status:" + (pomodoro_str if pomodoro_str else " unknown (no context provided)") + "\n"
    )

    # Vault notes index (grouped by folder, XML-tagged)
    vault_notes = assistant.get_all_vault_notes()
    if vault_notes:
        groups: Dict[str, List[str]] = {}
        for n in vault_notes:
            parts = n["path"].split("/")
            folder = parts[0] if len(parts) > 1 else "root"
            groups.setdefault(folder, []).append(f"    - (({n['title']})) [{n['path']}]")
        notes_lines = []
        for folder, items in sorted(groups.items()):
            notes_lines.append(f"  {folder}/")
            notes_lines.extend(items[:25])
            if len(items) > 25:
                notes_lines.append(f"    ... +{len(items) - 25} more")
        sys_prompt += "\n<vault_notes>\n" + "\n".join(notes_lines) + "\n</vault_notes>\n"

    # Active user context
    if user_context:
        active_hub = user_context.get("active_hub")
        recent_notes = user_context.get("recent_notes")
        ctx_lines = []
        if active_hub:
            ctx_lines.append(f"  Active hub: (({to_underscore_title_case(active_hub)}))")
        if recent_notes:
            recent = ", ".join(f"(({to_underscore_title_case(Path(n).stem)}))" for n in recent_notes[:3])
            ctx_lines.append(f"  Recently viewed: {recent}")
        if ctx_lines:
            sys_prompt += "\n<user_context>\n" + "\n".join(ctx_lines) + "\n</user_context>\n"

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

                # render_ui tool returns an ater-ui markdown block — stream it as a chunk
                if tool_name == "render_ui":
                    ui_chunk_content = "\n\n" + tool_result_str + "\n\n"
                    yield f"data: {json.dumps({'type': 'chunk', 'content': ui_chunk_content})}\n\n"
                    tool_result_str = "Rendered."

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
