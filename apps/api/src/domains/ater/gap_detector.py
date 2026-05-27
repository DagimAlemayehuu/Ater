import frontmatter
from pathlib import Path
from typing import List, Dict, Any, Optional
from .srs import SRSEngine
from .service import AterService

class KnowledgeGapDetector:
    def __init__(self, vault_path: Path, db_path: Path, secrets: Optional[Any] = None):
        self.vault_path = Path(vault_path)
        self.db_path = Path(db_path)
        self.srs = SRSEngine(self.db_path)
        self.secrets = secrets

    def detect_gaps(self, hub_id: str) -> List[Dict[str, Any]]:
        """
        Traverses prerequisite links and FSRS mastery to find gaps:
        1. Prerequisites referenced but missing (missing notes).
        2. High SRS difficulty notes (>7.0).
        3. Low stability notes (<2.0).
        4. Highly lapsed notes (lapses > 2).
        """
        if not self.secrets:
            from src.api.deps import AppSecrets
            self.secrets = AppSecrets(
                vault_path=str(self.vault_path),
                inbox_path=str(self.db_path.parent),
                academic_path="Notes"
            )
            
        service = AterService(self.secrets)
        
        hub_notes = service.list_atomic_notes(hub_id)
        existing_notes = {n["id"]: n for n in hub_notes}
        
        gaps = []
        
        # Track missing prerequisites
        missing_prereqs = set()
        
        for note_info in hub_notes:
            note_path = self.vault_path / note_info["path"]
            if not note_path.exists():
                continue
                
            try:
                post = frontmatter.load(note_path)
                prereqs = post.metadata.get("prerequisites") or []
                
                # Check for missing notes
                for prereq in prereqs:
                    cleaned = prereq.replace("[[", "").replace("]]", "").strip()
                    if cleaned not in existing_notes:
                        missing_prereqs.add(cleaned)
            except Exception:
                pass
                
            # Query SRS metrics
            card = self.srs.get_card(note_info["path"])
            
            if card.reps > 0:
                if card.difficulty > 7.0:
                    gaps.append({
                        "type": "high_difficulty",
                        "note_path": note_info["path"],
                        "note_title": note_info["title"],
                        "metric": f"Difficulty: {card.difficulty:.1f}",
                        "priority": "High",
                        "description": "Concept is consistently rated as difficult during review."
                    })
                if card.stability < 2.0 and card.reps > 2:
                    gaps.append({
                        "type": "low_stability",
                        "note_path": note_info["path"],
                        "note_title": note_info["title"],
                        "metric": f"Stability: {card.stability:.2f} days",
                        "priority": "Medium",
                        "description": "Memory half-life is too short; details are fading quickly."
                    })
                if card.lapses > 2:
                    gaps.append({
                        "type": "high_lapses",
                        "note_path": note_info["path"],
                        "note_title": note_info["title"],
                        "metric": f"Lapses: {card.lapses}",
                        "priority": "Critical",
                        "description": "Concept has been forgotten and re-learned multiple times."
                    })
                    
        for missing in missing_prereqs:
            gaps.append({
                "type": "missing_prerequisite",
                "note_path": f"Notes/{missing}.md",
                "note_title": missing.replace("_", " "),
                "metric": "Missing note file",
                "priority": "High",
                "description": "This concept is a declared prerequisite but has no note generated yet."
            })
            
        return gaps
