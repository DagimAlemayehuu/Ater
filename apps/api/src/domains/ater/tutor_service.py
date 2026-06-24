import sqlite3
import json
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage

class TutorSessionManager:
    def __init__(self, db_path: Path, vault_path: Path, ai_service=None):
        self.db_path = Path(db_path)
        self.vault_path = Path(vault_path)
        self.ai_service = ai_service  # AterService
        self._init_conn()

    def _init_conn(self):
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

    def _resolve_vault_path(self, note_id: str) -> Optional[Path]:
        p = Path(note_id)
        if p.is_absolute() and p.exists():
            return p
        if (self.vault_path / note_id).exists():
            return self.vault_path / note_id
            
        stem = p.stem
        stem = stem.replace("[", "").replace("]", "").replace(" ", "_").lower()
        
        for md_path in self.vault_path.rglob("*.md"):
            if any(ignored in md_path.parts for ignored in [".git", ".ater", ".obsidian", "Practice"]):
                continue
            if md_path.stem.lower() == stem or md_path.stem.replace(" ", "_").lower() == stem:
                return md_path
        return None

    def _extract_wikilinks(self, content: str) -> List[str]:
        links = re.findall(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", content)
        return [l.strip() for l in links]

    def _get_curriculum(self, hub_path: Path) -> List[str]:
        if not hub_path.exists():
            return []
            
        content = hub_path.read_text(encoding="utf-8")
        
        frontmatter = {}
        yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL | re.MULTILINE)
        if yaml_match:
            try:
                import yaml
                frontmatter = yaml.safe_load(yaml_match.group(1)) or {}
            except Exception:
                pass
                
        chapters_list = frontmatter.get("chapters", [])
        if not chapters_list:
            chapters_list = self._extract_wikilinks(content)
        else:
            cleaned = []
            for c in chapters_list:
                m = re.search(r"\[\[([^\]]+)\]\]", str(c))
                cleaned.append(m.group(1) if m else str(c))
            chapters_list = cleaned

        all_notes = []
        for chap_name in chapters_list:
            chap_path = self._resolve_vault_path(chap_name)
            if not chap_path or not chap_path.exists():
                continue
            
            chap_content = chap_path.read_text(encoding="utf-8")
            chap_fm = {}
            chap_yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", chap_content, re.DOTALL | re.MULTILINE)
            if chap_yaml_match:
                try:
                    import yaml
                    chap_fm = yaml.safe_load(chap_yaml_match.group(1)) or {}
                except Exception:
                    pass
            
            notes_list = chap_fm.get("notes", [])
            if not notes_list:
                notes_list = self._extract_wikilinks(chap_content)
            else:
                cleaned = []
                for n in notes_list:
                    m = re.search(r"\[\[([^\]]+)\]\]", str(n))
                    cleaned.append(m.group(1) if m else str(n))
                notes_list = cleaned
                
            for note_name in notes_list:
                note_path = self._resolve_vault_path(note_name)
                if note_path:
                    all_notes.append(note_path.relative_to(self.vault_path).as_posix())
                    
        return all_notes

    def start_session(self, session_id: str, hub_relative_path: str) -> Dict[str, Any]:
        hub_path = self.vault_path / hub_relative_path
        if not hub_path.exists():
            resolved = self._resolve_vault_path(hub_relative_path)
            if resolved:
                hub_path = resolved
                hub_relative_path = resolved.relative_to(self.vault_path).as_posix()
                
        notes = self._get_curriculum(hub_path)
        first_note = notes[0] if notes else ""
        
        self.conn.execute("""
            INSERT OR REPLACE INTO tutor_sessions 
            (session_id, hub_path, current_note_path, completed_notes, wagers, score, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            hub_relative_path,
            first_note,
            json.dumps([]),
            json.dumps({}),
            0,
            "active",
            datetime.now().isoformat()
        ))
        self.conn.commit()
        
        return {
            "session_id": session_id,
            "hub_path": hub_relative_path,
            "current_note_path": first_note,
            "completed_notes": [],
            "wagers": {},
            "score": 0,
            "status": "active",
            "curriculum": notes
        }

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        row = self.conn.execute(
            "SELECT * FROM tutor_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if not row:
            return None
            
        hub_path = self.vault_path / row["hub_path"]
        curriculum = self._get_curriculum(hub_path)
        
        return {
            "session_id": row["session_id"],
            "hub_path": row["hub_path"],
            "current_note_path": row["current_note_path"],
            "completed_notes": json.loads(row["completed_notes"]),
            "wagers": json.loads(row["wagers"]),
            "score": row["score"],
            "status": row["status"],
            "updated_at": row["updated_at"],
            "curriculum": curriculum
        }

    def submit_answer(self, session_id: str, question_id: str, is_correct: bool, wager: str, user_answer: str = "") -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        score_change = 0
        wager_lower = wager.lower()
        if is_correct:
            if wager_lower == "high":
                score_change = 10
            else:
                score_change = 5
        else:
            if wager_lower == "high":
                score_change = -5
            else:
                score_change = 0
                
        new_score = session["score"] + score_change
        if new_score < 0:
            new_score = 0
            
        wagers = session["wagers"]
        wagers[question_id] = {
            "wager": wager_lower,
            "correct": is_correct
        }
        
        diagnosis = {"is_misconception": False, "misconception_text": "", "hint": ""}
        if not is_correct:
            diagnosis = self._diagnose_mistake(session["current_note_path"], question_id, user_answer)
            if diagnosis.get("is_misconception"):
                self.log_misconception(
                    topic=session["hub_path"], 
                    note_title=Path(session["current_note_path"]).stem,
                    misconception_text=diagnosis["misconception_text"]
                )
                
        self.conn.execute("""
            UPDATE tutor_sessions 
            SET score = ?, wagers = ?, updated_at = ?
            WHERE session_id = ?
        """, (
            new_score,
            json.dumps(wagers),
            datetime.now().isoformat(),
            session_id
        ))
        self.conn.commit()
        
        return {
            "score": new_score,
            "score_change": score_change,
            "diagnosis": diagnosis,
            "session": self.get_session(session_id)
        }

    def advance_note(self, session_id: str) -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        curr_note = session["current_note_path"]
        curriculum = session["curriculum"]
        completed = session["completed_notes"]
        
        if curr_note and curr_note not in completed:
            completed.append(curr_note)
            
        next_note = ""
        status = "active"
        if curriculum:
            try:
                curr_idx = curriculum.index(curr_note)
                if curr_idx + 1 < len(curriculum):
                    next_note = curriculum[curr_idx + 1]
                else:
                    status = "completed"
            except ValueError:
                remaining = [n for n in curriculum if n not in completed]
                if remaining:
                    next_note = remaining[0]
                else:
                    status = "completed"
        else:
            status = "completed"
            
        self.conn.execute("""
            UPDATE tutor_sessions
            SET current_note_path = ?, completed_notes = ?, status = ?, updated_at = ?
            WHERE session_id = ?
        """, (
            next_note,
            json.dumps(completed),
            status,
            datetime.now().isoformat(),
            session_id
        ))
        self.conn.commit()
        
        return self.get_session(session_id)

    def _diagnose_mistake(self, note_path: str, question_id: str, user_answer: str) -> Dict[str, Any]:
        if self.ai_service and getattr(self.ai_service, "llm", None):
            try:
                note_file = self.vault_path / note_path
                note_content = note_file.read_text(encoding="utf-8") if note_file.exists() else ""
                
                from langchain_core.output_parsers import PydanticOutputParser
                from pydantic import BaseModel, Field
                
                class DiagnosisSchema(BaseModel):
                    is_misconception: bool = Field(description="True if conceptual misconception, False otherwise.")
                    misconception_text: str = Field(description="Concept misconception explanation in 1 sentence.")
                    hint: str = Field(description="A clue guiding user to correct answer.")
                
                parser = PydanticOutputParser(pydantic_object=DiagnosisSchema)
                prompt = f"""You are an expert tutor. A student made an error on question '{question_id}' in note '{note_path}'.
Note content:
{note_content}

Student answer: '{user_answer}'

{parser.get_format_instructions()}
"""
                messages = [
                    SystemMessage(content="You are a helpful tutor diagnosing student errors."),
                    HumanMessage(content=prompt)
                ]
                response = self.ai_service.llm.invoke(messages)
                parsed = parser.parse(response.content)
                return {
                    "is_misconception": parsed.is_misconception,
                    "misconception_text": parsed.misconception_text,
                    "hint": parsed.hint
                }
            except Exception:
                pass
                
        return {
            "is_misconception": True,
            "misconception_text": f"Misunderstanding of key concept related to {question_id}.",
            "hint": "Review the core concepts in this lesson and try again!"
        }

    def log_misconception(self, topic: str, note_title: str, misconception_text: str):
        self.conn.execute("""
            INSERT INTO user_misconceptions (topic, note_title, misconception_text, created_at)
            VALUES (?, ?, ?, ?)
        """, (
            topic,
            note_title,
            misconception_text,
            datetime.now().isoformat()
        ))
        self.conn.commit()
