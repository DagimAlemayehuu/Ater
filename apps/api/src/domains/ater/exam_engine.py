import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
from .academic_db import AcademicDB
from .service import AterService

class ExamEngine:
    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.db = AcademicDB(self.vault_path)

    async def create_exam(self, hub_ids: List[str], config: Dict[str, Any], secrets: Any) -> Dict[str, Any]:
        """
        Assembles a comprehensive exam across multiple study hubs.
        Generates questions and strips answers/explanations for exam security.
        """
        exam_id = f"exam_{uuid.uuid4().hex[:8]}"
        
        service = AterService(secrets)
        service.vm.vault_path = self.vault_path
        
        all_questions = []
        q_counter = 1
        
        # Determine questions limit from config
        total_questions_limit = config.get("total_questions", 10)
        q_type_dist = config.get("question_types", {"mcq": 5, "true_false": 5})
        
        for hub_id in hub_ids:
            config_raw = {
                "question_count": total_questions_limit,
                "difficulty": config.get("difficulty", "Mixed"),
                "questionDistribution": q_type_dist,
                "hubId": hub_id
            }
            try:
                res = await service.generate_practice(hub_id, config_raw)
                questions = res.get("questions", [])
                for q in questions:
                    q_dict = q.model_dump() if hasattr(q, "model_dump") else dict(q)
                    # Deduplicate questions
                    if not any(existing.get("question") == q_dict.get("question") for existing in all_questions):
                        all_questions.append(q_dict)
            except Exception:
                pass
                
        # Limit to config total
        all_questions = all_questions[:total_questions_limit]
        
        # Save correct answers state inside sqlite
        exam_state = {}
        client_questions = []
        
        for q in all_questions:
            q_id = f"eq_{q_counter}"
            q_counter += 1
            
            # Map state
            exam_state[q_id] = {
                "correct_answer": q.get("answer"),
                "explanation": q.get("explanation"),
                "note_path": q.get("note_path"),
                "required_keywords": q.get("required_keywords", [])
            }
            
            # Strip secret fields for client representation
            q_client = {
                "id": q_id,
                "type": q.get("type"),
                "difficulty": q.get("difficulty", "L1"),
                "question": q.get("question"),
                "options": q.get("options", []),
                "content": q.get("content", ""),
                "text_with_blanks": q.get("text_with_blanks", ""),
                "note_path": q.get("note_path")
            }
            client_questions.append(q_client)
            
        exam_payload = {
            "exam_id": exam_id,
            "hub_ids": hub_ids,
            "questions": client_questions,
            "created_at": datetime.now().isoformat()
        }
        
        self.db.save_exam_session(
            exam_id=exam_id,
            config={"hub_ids": hub_ids, "config": config},
            state={"questions": client_questions, "answers_state": exam_state},
            report=None
        )
        
        return exam_payload

    def grade_exam(self, exam_id: str, student_answers: Dict[str, Any]) -> Dict[str, Any]:
        """
        Grades submitted answers, logs performance into the SQLite analytics table, 
        and produces a post-exam diagnostic report.
        """
        session = self.db.get_exam_session(exam_id)
        if not session:
            raise ValueError(f"Exam session {exam_id} not found.")
            
        answers_state = session["state"]["answers_state"]
        questions = {q["id"]: q for q in session["state"]["questions"]}
        
        correct_count = 0
        total_count = len(answers_state)
        graded_results = {}
        
        weak_notes = set()
        
        # Load Analytics to save history
        from .analytics import AnalyticsEngine
        inbox_dir = self.vault_path / "Inbox"
        analytics_db_path = inbox_dir / "ater_queue.db"
        analytics = AnalyticsEngine(analytics_db_path)
        
        for q_id, state in answers_state.items():
            student_val = student_answers.get(q_id)
            correct_val = state["correct_answer"]
            
            is_correct = False
            q_type = questions[q_id].get("type", "mcq")
            
            if q_type in ("mcq", "true_false"):
                # Clean compare
                is_correct = str(student_val).strip().lower() == str(correct_val).strip().lower()
            elif q_type == "writing":
                # Check keywords
                keywords = state.get("required_keywords") or []
                if keywords:
                    missing = []
                    student_clean = str(student_val).lower()
                    for kw in keywords:
                        if kw.lower() not in student_clean:
                            missing.append(kw)
                    is_correct = len(missing) == 0
                else:
                    is_correct = len(str(student_val).strip()) > 10 # generic write check
            else:
                # Fallback matching/fill-in
                is_correct = str(student_val).strip().lower() == str(correct_val).strip().lower()
                
            if is_correct:
                correct_count += 1
            else:
                if state.get("note_path"):
                    weak_notes.add(state["note_path"])
                    
            graded_results[q_id] = {
                "question": questions[q_id]["question"],
                "student_answer": student_val,
                "correct_answer": correct_val,
                "is_correct": is_correct,
                "explanation": state["explanation"],
                "note_path": state["note_path"]
            }
            
            # Record in note performance DB
            if state.get("note_path"):
                analytics.record(
                    note_path=state["note_path"],
                    was_correct=is_correct,
                    time_ms=5000, # Mock time
                    question_type=q_type,
                    difficulty=questions[q_id].get("difficulty", "L1"),
                    session_id=exam_id,
                    question_id=q_id
                )
                
        score_percent = round((correct_count / total_count) * 100, 1) if total_count > 0 else 100.0
        
        report = {
            "exam_id": exam_id,
            "graded_at": datetime.now().isoformat(),
            "total_questions": total_count,
            "correct_answers": correct_count,
            "score_percentage": score_percent,
            "passed": score_percent >= 70.0,
            "results": graded_results,
            "recommended_review_notes": list(weak_notes)
        }
        
        # Save graded report back to DB
        self.db.save_exam_session(
            exam_id=exam_id,
            config=session["config"],
            state=session["state"],
            report=report
        )
        
        return report
