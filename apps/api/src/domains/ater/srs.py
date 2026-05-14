import math
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Literal, List
import sqlite3
from pathlib import Path

Rating = Literal[1, 2, 3, 4]  # 1=Again, 2=Hard, 3=Good, 4=Easy

# FSRS v4 default weights (pre-trained)
FSRS_W = [
    0.4072, 1.1829, 3.1262, 15.4722,
    7.2102, 0.5316, 1.0651, 0.0589,
    1.5330, 0.1544, 1.0070, 1.9394,
    0.1100, 0.2900, 2.2700, 0.2100
]

@dataclass
class FSRSCard:
    note_path: str
    stability: float = 1.0   # Memory "half-life" in days
    difficulty: float = 5.0  # Intrinsic difficulty 1–10
    due: datetime = field(default_factory=datetime.now)
    reps: int = 0
    lapses: int = 0
    last_review: datetime = None

def _retrievability(t: float, s: float) -> float:
    """Probability of recall after t days with stability s."""
    if s <= 0: return 0.0
    return (1 + t / (9 * s)) ** -1

def _next_interval(stability: float, target_retention: float = 0.90) -> int:
    if stability <= 0: return 1
    return max(1, round(9 * stability * (target_retention**-1 - 1)**-1))

def fsrs_update(card: FSRSCard, rating: Rating) -> FSRSCard:
    now = datetime.now()
    t = (now - card.last_review).days if card.last_review else 0
    r = _retrievability(t, card.stability) if card.reps > 0 else 0.0

    card.difficulty = min(10.0, max(1.0,
        card.difficulty - FSRS_W[6] * (rating - 3)
    ))

    if rating == 1:  # Forgot
        card.stability = (
            FSRS_W[11] * (card.difficulty ** -FSRS_W[12]) *
            ((card.stability + 1) ** FSRS_W[13] - 1) *
            math.exp(FSRS_W[14] * (1 - r))
        )
        card.lapses += 1
    else:
        card.stability = card.stability * math.exp(
            FSRS_W[8] * (11 - card.difficulty) *
            (card.stability ** -FSRS_W[9]) *
            (math.exp(FSRS_W[10] * (1 - r)) - 1)
        ) * (FSRS_W[15] if rating == 4 else 1.0)

    card.reps += 1
    card.last_review = now
    card.due = now + timedelta(days=_next_interval(card.stability))
    return card

class SRSEngine:
    def __init__(self, db_path: Path):
        self.db = sqlite3.connect(str(db_path), check_same_thread=False)
        self._init_db()

    def _init_db(self):
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS srs_cards (
                note_path TEXT PRIMARY KEY,
                stability REAL DEFAULT 1.0,
                difficulty REAL DEFAULT 5.0,
                due TEXT,
                reps INTEGER DEFAULT 0,
                lapses INTEGER DEFAULT 0,
                last_review TEXT
            )
        """)
        self.db.commit()

    def get_card(self, note_path: str) -> FSRSCard:
        row = self.db.execute(
            "SELECT * FROM srs_cards WHERE note_path=?", (note_path,)
        ).fetchone()
        if not row:
            return FSRSCard(note_path=note_path)
        return FSRSCard(
            note_path=row[0], stability=row[1], difficulty=row[2],
            due=datetime.fromisoformat(row[3]) if row[3] else datetime.now(),
            reps=row[4], lapses=row[5],
            last_review=datetime.fromisoformat(row[6]) if row[6] else None
        )

    def review(self, note_path: str, rating: int) -> FSRSCard:
        if rating not in [1, 2, 3, 4]:
            rating = 3 # default to good
        card = self.get_card(note_path)
        card = fsrs_update(card, rating)
        self.db.execute("""
            INSERT OR REPLACE INTO srs_cards
            VALUES (?,?,?,?,?,?,?)
        """, (
            card.note_path, card.stability, card.difficulty,
            card.due.isoformat(), card.reps, card.lapses,
            card.last_review.isoformat() if card.last_review else None
        ))
        self.db.commit()
        return card

    def get_due(self, hub_notes: List[str] = None) -> List[FSRSCard]:
        now = datetime.now().isoformat()
        if hub_notes and len(hub_notes) > 0:
            placeholders = ",".join("?" * len(hub_notes))
            rows = self.db.execute(
                f"SELECT * FROM srs_cards WHERE due <= ? AND note_path IN ({placeholders})",
                [now] + hub_notes
            ).fetchall()
        else:
            rows = self.db.execute(
                "SELECT * FROM srs_cards WHERE due <= ?", (now,)
            ).fetchall()
        return [self.get_card(r[0]) for r in rows]
