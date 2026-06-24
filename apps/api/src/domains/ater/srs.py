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

MAX_STABILITY = 36500.0  # Cap at 100 years to prevent timedelta overflow

def _next_interval(stability: float, target_retention: float = 0.90) -> int:
    if stability <= 0: return 1
    s = min(stability, MAX_STABILITY)
    return max(1, round(9 * s * (target_retention**-1 - 1)**-1))

def fsrs_update(card: FSRSCard, rating: Rating) -> FSRSCard:
    now = datetime.now()

    # ── First-ever review: seed stability from FSRS initial weights W[0..3] ──
    if card.reps == 0:
        card.stability = FSRS_W[rating - 1]   # W[0]=Again, W[1]=Hard, W[2]=Good, W[3]=Easy
        card.difficulty = min(10.0, max(1.0,
            FSRS_W[4] - FSRS_W[5] * (rating - 3)
        ))
        if rating == 1:
            card.lapses += 1
        card.reps += 1
        card.last_review = now
        card.due = now + timedelta(days=_next_interval(card.stability))
        return card

    # ── Subsequent reviews ────────────────────────────────────────────────────
    t = (now - card.last_review).days if card.last_review else 0
    r = _retrievability(t, max(card.stability, 0.01))

    card.difficulty = min(10.0, max(1.0,
        card.difficulty - FSRS_W[6] * (rating - 3)
    ))

    if rating == 1:  # Forgot
        card.stability = min(MAX_STABILITY, (
            FSRS_W[11] * (card.difficulty ** -FSRS_W[12]) *
            ((card.stability + 1) ** FSRS_W[13] - 1) *
            math.exp(FSRS_W[14] * (1 - r))
        ))
        card.lapses += 1
    else:
        card.stability = min(MAX_STABILITY, card.stability * math.exp(
            FSRS_W[8] * (11 - card.difficulty) *
            (card.stability ** -FSRS_W[9]) *
            (math.exp(FSRS_W[10] * (1 - r)) - 1)
        ) * (FSRS_W[15] if rating == 4 else 1.0))

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
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS tutor_sessions (
                session_id TEXT PRIMARY KEY,
                hub_path TEXT,
                current_note_path TEXT,
                completed_notes TEXT,
                wagers TEXT,
                score INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                updated_at TEXT
            )
        """)
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS user_misconceptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT,
                note_title TEXT,
                misconception_text TEXT,
                created_at TEXT
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
            due=datetime.fromisoformat(row[3].replace('Z', '+00:00')) if row[3] else datetime.now(),
            reps=row[4], lapses=row[5],
            last_review=datetime.fromisoformat(row[6].replace('Z', '+00:00')) if row[6] else None
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

    def get_all(self) -> List[FSRSCard]:
        rows = self.db.execute(
            "SELECT * FROM srs_cards"
        ).fetchall()
        return [self.get_card(r[0]) for r in rows]

    def validate_feynman_gate(self, note_path: str, explanation_text: str, vault_path: Path) -> dict:
        """
        Locates a note, extracts its interactive-quiz writing question's keywords,
        and verifies if the explanation contains all required keywords.
        """
        import json
        import re
        vault_path = Path(vault_path) if isinstance(vault_path, str) else vault_path
        abs_path = vault_path / note_path if not Path(note_path).is_absolute() else Path(note_path)
        if not abs_path.exists():
            return {"success": False, "error": f"Note file not found at: {note_path}"}
            
        with open(abs_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Locate the ```interactive-quiz markdown block
        match = re.search(r"```interactive-quiz\s*\n(.*?)\n```", content, re.DOTALL)
        if not match:
            return {"success": False, "error": "No interactive-quiz block found in note."}

        try:
            quiz_data = json.loads(match.group(1).strip())
        except Exception:
            return {"success": False, "error": "Failed to parse interactive-quiz JSON block."}

        # Extract the required_keywords from the writing question
        writing_q = next((q for q in quiz_data if q.get("type") == "writing"), None)
        if not writing_q:
            # If no writing question exists, fallback to standard case-insensitive unlock
            self.review(note_path, rating=3)
            return {"success": True, "unlocked_directly": True}

        keywords = [kw.strip() for kw in writing_q.get("required_keywords", []) if kw.strip()]
        if not keywords:
            self.review(note_path, rating=3)
            return {"success": True, "unlocked_directly": True}

        missing = []
        for kw in keywords:
            kw_clean = re.sub(r'[^\w\s]', '', kw.lower()).strip()
            explanation_clean = re.sub(r'[^\w\s]', ' ', explanation_text.lower()).strip()
            
            # 1. Substring phrase check
            if kw_clean in explanation_clean:
                continue
                
            # 2. Advanced word-level stem, singular/plural, and similarity check
            kw_words = [w for w in kw_clean.split() if w]
            explanation_words = [w for w in explanation_clean.split() if w]
            
            if not kw_words:
                missing.append(kw)
                continue
                
            matched_phrase = True
            for kw_w in kw_words:
                matched_word = False
                for tw in explanation_words:
                    # Exact word match
                    if tw == kw_w:
                        matched_word = True
                        break
                    # Plural form checks
                    if tw.endswith('s') and tw[:-1] == kw_w:
                        matched_word = True
                        break
                    if tw.endswith('es') and tw[:-2] == kw_w:
                        matched_word = True
                        break
                    if tw.endswith('ies') and len(tw) > 3 and tw[:-3] + 'y' == kw_w:
                        matched_word = True
                        break
                    # Singular form checks
                    if kw_w.endswith('s') and kw_w[:-1] == tw:
                        matched_word = True
                        break
                    if kw_w.endswith('es') and kw_w[:-2] == tw:
                        matched_word = True
                        break
                    if kw_w.endswith('ies') and len(kw_w) > 3 and kw_w[:-3] + 'y' == tw:
                        matched_word = True
                        break
                    # Substring prefix/stem match (len >= 5)
                    if len(kw_w) >= 5 and len(tw) >= 5:
                        if kw_w.startswith(tw[:5]) or tw.startswith(kw_w[:5]):
                            matched_word = True
                            break
                if not matched_word:
                    matched_phrase = False
                    break
            
            if not matched_phrase:
                missing.append(kw)

        if len(missing) == 0:
            # Mark FSRS rating as Good (3) and save to srs_cards SQLite table
            self.review(note_path, rating=3)
            return {"success": True}
        else:
            return {"success": False, "missing_keywords": missing}
