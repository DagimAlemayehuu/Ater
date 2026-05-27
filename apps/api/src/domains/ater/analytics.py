import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

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

    # --- Upgraded Pedagogical Methods ---

    def get_mastery_signal(self, note_path: str) -> float:
        """Calculates a mastery index (0.0 to 1.0) based on correct rate and attempt frequency."""
        row = self.db.execute("""
            SELECT AVG(was_correct), COUNT(*)
            FROM note_performance
            WHERE note_path = ?
        """, (note_path,)).fetchone()
        if not row or row[1] == 0:
            return 0.5  # Neutral default
        avg_correct, attempts = row
        # Weight with attempts count to avoid high mastery on a single correct answer
        weight = min(attempts / 5.0, 1.0)
        return float(avg_correct * weight + (1.0 - weight) * 0.5)

    def get_forgetting_risk_map(self, hub_notes: List[str]) -> Dict[str, float]:
        """Calculates forgetting risk based on time elapsed since the last correct practice."""
        risk_map = {}
        now = datetime.now()
        for note in hub_notes:
            row = self.db.execute("""
                SELECT timestamp FROM note_performance
                WHERE note_path = ? AND was_correct = 1
                ORDER BY timestamp DESC LIMIT 1
            """, (note,)).fetchone()
            if not row:
                risk_map[note] = 1.0  # Maximum risk if never correctly answered
            else:
                last_time = datetime.fromisoformat(row[0])
                days_since = (now - last_time).days
                # Risk grows logarithmically/exponentially with days elapsed
                risk = min(days_since / 14.0, 1.0)
                risk_map[note] = float(risk)
        return risk_map

    def get_learning_velocity(self, days: int = 7) -> float:
        """Returns the rate of correctly answered questions per day in the last N days."""
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        row = self.db.execute("""
            SELECT SUM(was_correct) FROM note_performance
            WHERE timestamp >= ?
        """, (cutoff,)).fetchone()
        if not row or row[0] is None:
            return 0.0
        return float(row[0] / days)

    def get_difficulty_distribution(self, hub_notes: List[str]) -> Dict[str, int]:
        """Buckets hub notes by their perceived difficulty in history."""
        if not hub_notes:
            return {"easy": 0, "medium": 0, "hard": 0}
        placeholders = ",".join("?" * len(hub_notes))
        rows = self.db.execute(f"""
            SELECT note_path, AVG(was_correct) as rate
            FROM note_performance
            WHERE note_path IN ({placeholders})
            GROUP BY note_path
        """, hub_notes).fetchall()
        
        dist = {"easy": 0, "medium": 0, "hard": 0}
        # Include notes that have no history as medium
        known = set()
        for note, rate in rows:
            known.add(note)
            if rate >= 0.8:
                dist["easy"] += 1
            elif rate >= 0.5:
                dist["medium"] += 1
            else:
                dist["hard"] += 1
                
        for note in hub_notes:
            if note not in known:
                dist["medium"] += 1
        return dist

    def get_time_efficiency_report(self) -> Dict[str, Any]:
        """Summarizes typical response times and time efficiency by difficulty."""
        rows = self.db.execute("""
            SELECT difficulty, AVG(time_ms), SUM(was_correct), COUNT(*)
            FROM note_performance
            GROUP BY difficulty
        """).fetchall()
        report = {}
        for diff, avg_time, correct, total in rows:
            report[diff or "L1"] = {
                "avg_time_ms": float(avg_time) if avg_time else 0.0,
                "accuracy": float(correct / total) if total else 0.0,
                "total_attempts": total
            }
        return report

    def get_concept_mastery_heatmap(self, hub_notes: List[str]) -> Dict[str, float]:
        """Generates a mapping of concept paths to computed mastery signals."""
        return {note: self.get_mastery_signal(note) for note in hub_notes}
