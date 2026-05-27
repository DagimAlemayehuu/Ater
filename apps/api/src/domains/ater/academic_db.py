import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional

class AcademicDB:
    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.db_dir = self.vault_path / ".ater"
        self.db_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.db_dir / "academic.db"
        
        self.db = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self._init_db()

    def _init_db(self):
        # 1. Note Embeddings
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS note_embeddings (
                note_path TEXT PRIMARY KEY,
                content_hash TEXT,
                embedding BLOB
            )
        """)
        
        # 2. Tutor Sessions
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS tutor_sessions (
                session_id TEXT PRIMARY KEY,
                note_path TEXT,
                history_json TEXT,
                updated_at TEXT
            )
        """)
        
        # 3. Exam Sessions
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS exam_sessions (
                exam_id TEXT PRIMARY KEY,
                config_json TEXT,
                state_json TEXT,
                report_json TEXT,
                created_at TEXT
            )
        """)
        
        # 4. Note Versions
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_path TEXT,
                timestamp TEXT,
                content TEXT
            )
        """)
        self.db.commit()

    # --- Note Embeddings Operations ---
    def save_embedding(self, note_path: str, content_hash: str, embedding: List[float]):
        import array
        # Pack floats into bytes
        emb_array = array.array('f', embedding)
        emb_bytes = emb_array.tobytes()
        self.db.execute("""
            INSERT OR REPLACE INTO note_embeddings (note_path, content_hash, embedding)
            VALUES (?, ?, ?)
        """, (note_path, content_hash, emb_bytes))
        self.db.commit()

    def get_embedding(self, note_path: str) -> Optional[List[float]]:
        row = self.db.execute(
            "SELECT embedding FROM note_embeddings WHERE note_path = ?", (note_path,)
        ).fetchone()
        if not row:
            return None
        import array
        emb_array = array.array('f')
        emb_array.frombytes(row[0])
        return list(emb_array)

    def get_all_embeddings(self) -> Dict[str, List[float]]:
        rows = self.db.execute("SELECT note_path, embedding FROM note_embeddings").fetchall()
        result = {}
        import array
        for row in rows:
            emb_array = array.array('f')
            emb_array.frombytes(row[1])
            result[row[0]] = list(emb_array)
        return result

    # --- Tutor Sessions Operations ---
    def save_tutor_session(self, session_id: str, note_path: str, history: List[Dict[str, Any]]):
        self.db.execute("""
            INSERT OR REPLACE INTO tutor_sessions (session_id, note_path, history_json, updated_at)
            VALUES (?, ?, ?, ?)
        """, (session_id, note_path, json.dumps(history), datetime.now().isoformat()))
        self.db.commit()

    def get_tutor_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        row = self.db.execute(
            "SELECT note_path, history_json, updated_at FROM tutor_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if not row:
            return None
        return {
            "session_id": session_id,
            "note_path": row[0],
            "history": json.loads(row[1]),
            "updated_at": row[2]
        }

    # --- Exam Sessions Operations ---
    def save_exam_session(self, exam_id: str, config: Dict[str, Any], state: Dict[str, Any], report: Optional[Dict[str, Any]] = None):
        self.db.execute("""
            INSERT OR REPLACE INTO exam_sessions (exam_id, config_json, state_json, report_json, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            exam_id, 
            json.dumps(config), 
            json.dumps(state), 
            json.dumps(report) if report else None, 
            datetime.now().isoformat()
        ))
        self.db.commit()

    def get_exam_session(self, exam_id: str) -> Optional[Dict[str, Any]]:
        row = self.db.execute(
            "SELECT config_json, state_json, report_json, created_at FROM exam_sessions WHERE exam_id = ?", (exam_id,)
        ).fetchone()
        if not row:
            return None
        return {
            "exam_id": exam_id,
            "config": json.loads(row[0]),
            "state": json.loads(row[1]),
            "report": json.loads(row[2]) if row[2] else None,
            "created_at": row[3]
        }

    # --- Note Versioning Operations ---
    def save_version(self, note_path: str, content: str):
        self.db.execute("""
            INSERT INTO versions (note_path, timestamp, content)
            VALUES (?, ?, ?)
        """, (note_path, datetime.now().isoformat(), content))
        self.db.commit()

    def get_versions(self, note_path: str) -> List[Dict[str, Any]]:
        rows = self.db.execute(
            "SELECT id, timestamp, content FROM versions WHERE note_path = ? ORDER BY timestamp DESC", (note_path,)
        ).fetchall()
        return [
            {"id": row[0], "timestamp": row[1], "content": row[2]}
            for row in rows
        ]

    def get_version_by_id(self, version_id: int) -> Optional[Dict[str, Any]]:
        row = self.db.execute(
            "SELECT note_path, timestamp, content FROM versions WHERE id = ?", (version_id,)
        ).fetchone()
        if not row:
            return None
        return {
            "id": version_id,
            "note_path": row[0],
            "timestamp": row[1],
            "content": row[2]
        }
