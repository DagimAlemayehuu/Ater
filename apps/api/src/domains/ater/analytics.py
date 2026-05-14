import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any

class AnalyticsEngine:
    def __init__(self, db_path: Path):
        self.db = sqlite3.connect(str(db_path), check_same_thread=False)
        self._init_db()

    def _init_db(self):
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS note_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                note_path TEXT NOT NULL,
                session_id TEXT,
                timestamp TEXT NOT NULL,
                question_id TEXT,
                question_type TEXT,
                was_correct INTEGER,
                time_ms INTEGER,
                difficulty TEXT,
                confidence INTEGER
            )
        """)
        self.db.commit()

    def record(self, 
               note_path: str, 
               was_correct: bool, 
               time_ms: int, 
               question_type: str = "", 
               difficulty: str = "L1", 
               confidence: int = None, 
               session_id: str = None, 
               question_id: str = None):
        self.db.execute("""
            INSERT INTO note_performance 
            (note_path, session_id, timestamp, question_id, question_type, was_correct, time_ms, difficulty, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            note_path, session_id, datetime.now().isoformat(), question_id, question_type, 
            1 if was_correct else 0, time_ms, difficulty, confidence
        ))
        self.db.commit()

    def get_weak_notes(self, hub_notes: List[str], threshold: float = 0.65) -> List[str]:
        """Returns notes where the correct_rate is below threshold."""
        if not hub_notes:
            return []
        placeholders = ",".join("?" * len(hub_notes))
        rows = self.db.execute(f"""
            SELECT note_path, AVG(was_correct) as correct_rate, COUNT(*) as attempts
            FROM note_performance
            WHERE note_path IN ({placeholders})
            GROUP BY note_path
            HAVING attempts >= 1 AND correct_rate < ?
        """, hub_notes + [threshold]).fetchall()
        return [row[0] for row in rows]

    def get_study_trend(self, days: int = 30) -> List[Dict[str, Any]]:
        """Returns daily correct/incorrect counts for trend graph."""
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        rows = self.db.execute("""
            SELECT date(timestamp) as day, 
                   SUM(was_correct) as correct, 
                   COUNT(*) - SUM(was_correct) as incorrect
            FROM note_performance
            WHERE timestamp >= ?
            GROUP BY day
            ORDER BY day ASC
        """, (cutoff,)).fetchall()
        return [{"date": row[0], "correct": row[1], "incorrect": row[2]} for row in rows]

    def get_confusion_matrix(self, note_path: str) -> Dict[str, float]:
        """Returns per-question-type accuracy rates for a single note."""
        rows = self.db.execute("""
            SELECT question_type, AVG(was_correct) as correct_rate
            FROM note_performance
            WHERE note_path = ?
            GROUP BY question_type
        """, (note_path,)).fetchall()
        return {row[0]: row[1] for row in rows}
