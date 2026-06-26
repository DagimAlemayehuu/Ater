import frontmatter
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any
from .srs import SRSEngine, _retrievability

class StudyScheduler:
    def __init__(self, vault_path: Path, db_path: Path):
        self.vault_path = Path(vault_path)
        self.db_path = Path(db_path)
        self.srs = SRSEngine(self.db_path)

    def _get_exams(self) -> List[Dict[str, Any]]:
        exams = []
        exam_dir = self.vault_path / "database" / "exams"
        if exam_dir.exists() and exam_dir.is_dir():
            for f in exam_dir.glob("*.md"):
                if f.name.startswith("."):
                    continue
                try:
                    post = frontmatter.load(f)
                    exam_date_str = post.metadata.get("date") or post.metadata.get("exam_date")
                    if exam_date_str:
                        # Normalize string date to datetime
                        if isinstance(exam_date_str, str):
                            exam_date = datetime.strptime(exam_date_str.split("T")[0], "%Y-%m-%d")
                        else:
                            exam_date = datetime.combine(exam_date_str, datetime.min.time())
                        exams.append({
                            "title": post.metadata.get("title") or f.stem,
                            "course": post.metadata.get("course") or "",
                            "date": exam_date,
                            "path": f.relative_to(self.vault_path).as_posix()
                        })
                except Exception:
                    pass
        return exams

    def generate_plan(self, daily_budget_minutes: int = 30) -> Dict[str, Any]:
        """
        Generates daily task lists matching upcoming exam targets.
        Calculates predicted retention on exam day.
        """
        exams = self._get_exams()
        if not exams:
            # Fallback to general review if no exams are registered
            exams.append({
                "title": "General Practice Target",
                "course": "General Study",
                "date": datetime.now() + timedelta(days=14),
                "path": ""
            })
            
        all_cards = self.srs.get_all()
        now = datetime.now()
        
        schedule = []
        # Calculate daily card targets
        for exam in sorted(exams, key=lambda x: x["date"]):
            days_left = (exam["date"] - now).days
            if days_left < 0:
                continue # Exam already passed
                
            # Filter cards associated with this course
            course_cards = []
            for card in all_cards:
                note_file = self.vault_path / card.note_path
                if not note_file.exists():
                    continue
                try:
                    post = frontmatter.load(note_file)
                    note_course = post.metadata.get("course") or ""
                    if note_course.lower() in exam["course"].lower() or exam["course"].lower() in note_course.lower():
                        course_cards.append(card)
                except Exception:
                    pass
            
            # Predict average retention on exam day
            retention_sum = 0.0
            retention_count = 0
            due_count = 0
            for card in course_cards:
                t_on_exam = days_left + ((now - card.last_review).days if card.last_review else 0)
                r = _retrievability(t_on_exam, card.stability)
                retention_sum += r
                retention_count += 1
                if card.due <= now:
                    due_count += 1
                    
            avg_retention = (retention_sum / retention_count) if retention_count > 0 else 0.90
            
            # 2 mins per review card average estimate
            reviews_needed = due_count
            daily_target = min(reviews_needed, daily_budget_minutes // 2)
            
            schedule.append({
                "exam_title": exam["title"],
                "course": exam["course"],
                "days_remaining": days_left,
                "exam_date": exam["date"].strftime("%Y-%m-%d"),
                "total_cards": len(course_cards),
                "due_cards": due_count,
                "predicted_retention_on_exam": round(avg_retention * 100, 1),
                "daily_review_target": max(1, daily_target),
                "recommended_study_minutes": max(10, daily_target * 2)
            })
            
        return {
            "generated_at": now.isoformat(),
            "daily_budget_minutes": daily_budget_minutes,
            "schedule": schedule
        }
