import sqlite3
import json
import logging
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger("Ater.TutorService")

class TutorSessionManager:
    def __init__(self, db_path: Path, vault_path: Path, ai_service=None):
        self.db_path = Path(db_path)
        self.vault_path = Path(vault_path)
        self.ai_service = ai_service  # AterService
        self._init_conn()

    def __del__(self):
        try:
            if hasattr(self, 'conn') and self.conn:
                self.conn.close()
        except Exception:
            pass

    def _init_conn(self):
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS tutor_sessions (
                session_id TEXT PRIMARY KEY,
                hub_path TEXT,
                current_note_path TEXT,
                completed_notes TEXT DEFAULT '[]',
                wagers TEXT DEFAULT '{}',
                score INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                updated_at TEXT,
                active_note_unlocks TEXT DEFAULT '[]',
                consecutive_failures TEXT DEFAULT '{}',
                active_question_overrides TEXT DEFAULT '{}'
            )
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS user_misconceptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT,
                note_title TEXT,
                misconception_text TEXT,
                created_at TEXT
            )
        """)
        # Run safety schema migrations on DB connection initialization
        for col_name in ["active_note_unlocks", "consecutive_failures", "active_question_overrides"]:
            try:
                self.conn.execute(f"ALTER TABLE tutor_sessions ADD COLUMN {col_name} TEXT")
            except sqlite3.OperationalError as e:
                if "duplicate column name" not in str(e).lower():
                    raise e
        self.conn.commit()

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

    def start_session(self, session_id: str, hub_relative_path: str, mode: str = "Progressive") -> Dict[str, Any]:
        hub_path = self.vault_path / hub_relative_path
        if not hub_path.exists():
            resolved = self._resolve_vault_path(hub_relative_path)
            if resolved:
                hub_path = resolved
                hub_relative_path = resolved.relative_to(self.vault_path).as_posix()
                
        notes = self._get_curriculum(hub_path)
        first_note = notes[0] if notes else ""
        
        if mode == "Progressive":
            active_note_unlocks = [first_note] if first_note else []
        else:
            active_note_unlocks = notes
            
        self.conn.execute("""
            INSERT OR REPLACE INTO tutor_sessions 
            (session_id, hub_path, current_note_path, completed_notes, wagers, score, status, updated_at, active_note_unlocks, consecutive_failures, active_question_overrides)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            hub_relative_path,
            first_note,
            json.dumps([]),
            json.dumps({}),
            0,
            "active",
            datetime.now().isoformat(),
            json.dumps(active_note_unlocks),
            json.dumps({}),
            json.dumps({})
        ))
        self.conn.commit()
        
        return self.get_session(session_id)

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
            "curriculum": curriculum,
            "active_note_unlocks": json.loads(row["active_note_unlocks"]) if row["active_note_unlocks"] else [],
            "consecutive_failures": json.loads(row["consecutive_failures"]) if row["consecutive_failures"] else {},
            "active_question_overrides": json.loads(row["active_question_overrides"]) if row["active_question_overrides"] else {}
        }

    async def submit_answer(self, session_id: str, question_id: str, is_correct: bool, wager: str, user_answer: str = "") -> Dict[str, Any]:
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
        
        consecutive_failures = session["consecutive_failures"]
        active_question_overrides = session["active_question_overrides"]
        
        diagnosis = {"is_misconception": False, "misconception_text": "", "hint": "", "remediation_question": None}
        
        if is_correct:
            consecutive_failures[question_id] = 0
        else:
            failures = consecutive_failures.get(question_id, 0) + 1
            consecutive_failures[question_id] = failures
            
            if failures == 1:
                diagnosis = await self._diagnose_mistake(session["current_note_path"], question_id, user_answer)
                diagnosis["is_misconception"] = False
                diagnosis["remediation_question"] = None
            elif failures >= 2:
                diagnosis = await self._diagnose_mistake(session["current_note_path"], question_id, user_answer)
                diagnosis["is_misconception"] = True
                
                self.log_misconception(
                    topic=session["hub_path"], 
                    note_title=Path(session["current_note_path"]).stem,
                    misconception_text=diagnosis["misconception_text"]
                )
                
                remediation_q = await self.get_remediation_question(
                    note_path=session["current_note_path"],
                    question_id=question_id,
                    user_answer=user_answer,
                    misconception_text=diagnosis["misconception_text"]
                )
                if remediation_q:
                    diagnosis["remediation_question"] = remediation_q
                    active_question_overrides[question_id] = remediation_q
                
        self.conn.execute("""
            UPDATE tutor_sessions 
            SET score = ?, wagers = ?, consecutive_failures = ?, active_question_overrides = ?, updated_at = ?
            WHERE session_id = ?
        """, (
            new_score,
            json.dumps(wagers),
            json.dumps(consecutive_failures),
            json.dumps(active_question_overrides),
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

    def _extract_note_questions(self, note_path: str) -> List[Dict[str, Any]]:
        note_file = self.vault_path / note_path
        if not note_file.exists():
            resolved = self._resolve_vault_path(note_path)
            note_file = resolved if resolved else note_file
        if not note_file.exists():
            return []

        content = note_file.read_text(encoding="utf-8")
        match = re.search(r"```interactive-quiz\s*\n?(.*?)\n?```", content, re.DOTALL)
        if not match:
            return []
        try:
            parsed = json.loads(match.group(1).strip())
        except Exception:
            return []
        if not isinstance(parsed, list):
            return []

        questions = []
        for idx, question in enumerate(parsed):
            if not isinstance(question, dict) or not question.get("question"):
                continue
            normalized = dict(question)
            normalized.setdefault("id", f"{Path(note_path).stem}_q{idx + 1}")
            normalized.setdefault("type", "writing")
            normalized.setdefault("difficulty", "L1")
            normalized.setdefault("explanation", "")
            normalized["note_id"] = note_path
            questions.append(normalized)
        return questions

    def _clean_note_content(self, note_path: str) -> str:
        note_file = self.vault_path / note_path
        if not note_file.exists():
            resolved = self._resolve_vault_path(note_path)
            note_file = resolved if resolved else note_file
        if not note_file.exists():
            return ""
        content = note_file.read_text(encoding="utf-8")
        content = re.sub(r"^---\s*\n.*?\n---\s*\n?", "", content, flags=re.DOTALL)
        content = re.sub(r"```interactive-quiz\s*\n?.*?\n?```", "", content, flags=re.DOTALL)
        return content.strip()

    def _fallback_question(self, note_path: str, session_id: str = "", attempt_count: int = 0) -> Dict[str, Any]:
        content = self._clean_note_content(note_path)
        title = Path(note_path).stem.replace("_", " ").replace("-", " ")
        q_type = "writing" if attempt_count <= 0 else ("mcq" if attempt_count % 2 else "fill_in")
        question_text = f"Explain the most important idea from {title} in your own words."
        if q_type == "mcq":
            question_text = f"Which statement best captures the core point of {title}?"
        elif q_type == "fill_in":
            question_text = f"The key idea in {title} is best summarized as ____."

        question = {
            "id": f"adaptive_{Path(note_path).stem}_{session_id or 'session'}_{attempt_count + 1}",
            "type": q_type,
            "difficulty": "L1" if attempt_count <= 1 else "L2",
            "question": question_text,
            "answer": "A correct answer should accurately use the lesson's core terms and explain the relationship between them.",
            "explanation": "This checks whether you can restate the lesson's central concept without copying the note.",
            "required_keywords": [],
            "note_id": note_path,
            "is_adaptive": True,
        }
        if q_type == "mcq":
            excerpt = content[:180].replace("\n", " ") or "the lesson's main concept"
            question["options"] = {
                "A": f"It explains {excerpt}",
                "B": "It is only a list of unrelated facts.",
                "C": "It says the topic can be skipped safely.",
                "D": "It focuses only on memorizing filenames.",
            }
            question["answer"] = "A"
        return question

    async def get_adaptive_question(
        self,
        session_id: str,
        note_path: str,
        history: Optional[List[Dict[str, Any]]] = None,
        last_result: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        history = history or []
        answered_ids = {str(item.get("question_id") or item.get("id") or "") for item in history}
        for question in self._extract_note_questions(note_path):
            if str(question.get("id")) not in answered_ids:
                return {
                    "question": question,
                    "progression": {
                        "source": "note",
                        "generated_follow_up": False,
                        "answered_count": len(history),
                    },
                }

        generated = await self._generate_adaptive_follow_up(note_path, history, last_result)
        if not generated:
            generated = self._fallback_question(note_path, session_id, len(history))
        generated["note_id"] = note_path
        generated.setdefault("is_adaptive", True)
        return {
            "question": generated,
            "progression": {
                "source": "ai" if self.ai_service and getattr(self.ai_service, "llm", None) else "fallback",
                "generated_follow_up": True,
                "answered_count": len(history),
            },
        }

    async def check_adaptive_answer(
        self,
        session_id: str,
        note_path: str,
        question: Dict[str, Any],
        user_answer: Any,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        graded = await self._grade_adaptive_answer(note_path, question, user_answer)
        history = history or []
        if graded.get("is_correct"):
            next_question = (await self.get_adaptive_question(
                session_id,
                note_path,
                history + [{"question_id": question.get("id"), "is_correct": True}],
                graded,
            ))["question"]
        else:
            next_question = await self._generate_adaptive_follow_up(
                note_path,
                history + [{"question_id": question.get("id"), "is_correct": False, "user_answer": user_answer}],
                graded,
            )
            if not next_question:
                next_question = self._fallback_question(note_path, session_id, len(history) + 1)

        return {
            "is_correct": bool(graded.get("is_correct")),
            "feedback": graded.get("feedback") or ("Correct." if graded.get("is_correct") else "Not quite."),
            "hint": graded.get("hint", ""),
            "lesson": graded.get("lesson", ""),
            "next_question": next_question,
            "can_advance": bool(graded.get("is_correct")),
        }

    async def _generate_adaptive_follow_up(
        self,
        note_path: str,
        history: List[Dict[str, Any]],
        last_result: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        if not (self.ai_service and getattr(self.ai_service, "llm", None)):
            return None
        try:
            from langchain_core.output_parsers import PydanticOutputParser
            from pydantic import BaseModel, Field

            class AdaptiveQuestionSchema(BaseModel):
                type: str = Field(description="One of mcq, true_false, fill_in, writing, matching, order, scenario, synthesis, trace, debug.")
                question: str
                options: Dict[str, str] = Field(default_factory=dict)
                answer: Any = ""
                explanation: str
                required_keywords: List[str] = Field(default_factory=list)

            parser = PydanticOutputParser(pydantic_object=AdaptiveQuestionSchema)
            prompt = f"""Generate exactly one next Proving Grounds question for this Atomic Note.

Atomic Note:
{self._clean_note_content(note_path)[:6000]}

Recent learner history:
{json.dumps(history[-6:], ensure_ascii=False)}

Last grading result:
{json.dumps(last_result or {}, ensure_ascii=False)}

Pick the best question type for the learner's performance. If they were wrong, target the misconception with a concrete follow-up. If they were correct, increase transfer/application slightly. Do not generate a batch.

{parser.get_format_instructions()}
"""
            response = await self.ai_service.llm.ainvoke([
                SystemMessage(content="You are Ater's adaptive Proving Grounds question generator."),
                HumanMessage(content=prompt),
            ])
            question = parser.parse(response.content).model_dump()
            question["id"] = f"adaptive_{Path(note_path).stem}_{abs(hash(response.content)) % 100000}"
            question["difficulty"] = "L2"
            return question
        except Exception as e:
            logger.warning(f"[TutorSessionManager] Failed to generate adaptive follow-up: {e}")
            return None

    async def _grade_adaptive_answer(self, note_path: str, question: Dict[str, Any], user_answer: Any) -> Dict[str, Any]:
        expected = question.get("answer")
        q_type = str(question.get("type") or "writing").lower()
        answer_text = str(user_answer).strip()

        if q_type in {"mcq", "multiple-choice", "true_false", "true-false", "fill_in", "fill-in"}:
            is_correct = str(expected).strip().lower() == answer_text.lower()
            return {
                "is_correct": is_correct,
                "feedback": "Correct." if is_correct else "Not quite. Compare your answer against the lesson's exact claim.",
                "hint": "" if is_correct else (question.get("hints") or ["Look for the core definition in the note."])[0],
                "lesson": "" if is_correct else question.get("explanation", ""),
            }

        if self.ai_service and getattr(self.ai_service, "llm", None):
            try:
                from langchain_core.output_parsers import PydanticOutputParser
                from pydantic import BaseModel, Field

                class AdaptiveGradeSchema(BaseModel):
                    is_correct: bool
                    feedback: str = Field(description="Direct feedback to the learner.")
                    hint: str = Field(default="", description="A short hint if incorrect.")
                    lesson: str = Field(default="", description="Detailed teaching explanation if incorrect.")

                parser = PydanticOutputParser(pydantic_object=AdaptiveGradeSchema)
                prompt = f"""Grade the learner's answer against the Atomic Note and expected answer.

Atomic Note:
{self._clean_note_content(note_path)[:6000]}

Question:
{json.dumps(question, ensure_ascii=False)}

Expected answer:
{expected}

Learner answer:
{answer_text}

Be fair but rigorous. Correct answers can use different wording. If wrong, give a useful hint or a detailed mini-lesson.

{parser.get_format_instructions()}
"""
                response = await self.ai_service.llm.ainvoke([
                    SystemMessage(content="You are Ater's adaptive tutor grader."),
                    HumanMessage(content=prompt),
                ])
                return parser.parse(response.content).model_dump()
            except Exception as e:
                logger.warning(f"[TutorSessionManager] AI adaptive grading failed: {e}")

        expected_terms = [str(term).lower() for term in question.get("required_keywords", []) if str(term).strip()]
        lower_answer = answer_text.lower()
        if expected_terms:
            hits = sum(1 for term in expected_terms if term in lower_answer)
            is_correct = hits >= max(1, len(expected_terms) // 2)
        else:
            expected_words = {w for w in re.findall(r"[a-zA-Z]{4,}", str(expected).lower())}
            answer_words = set(re.findall(r"[a-zA-Z]{4,}", lower_answer))
            is_correct = bool(expected_words) and len(expected_words & answer_words) >= max(1, min(3, len(expected_words)))
        return {
            "is_correct": is_correct,
            "feedback": "Correct." if is_correct else "Not quite. Your answer is missing one of the core relationships from the lesson.",
            "hint": "" if is_correct else "Name the main concept, then explain what it changes or enables.",
            "lesson": "" if is_correct else question.get("explanation", "Review the Atomic Note, then answer with the main claim and one consequence."),
        }

    async def get_remediation_question(self, note_path: str, question_id: str, user_answer: str, misconception_text: str) -> Optional[Dict[str, Any]]:
        if self.ai_service and getattr(self.ai_service, "llm", None):
            try:
                note_file = self.vault_path / note_path
                note_content = note_file.read_text(encoding="utf-8") if note_file.exists() else ""
                
                from langchain_core.output_parsers import PydanticOutputParser
                from pydantic import BaseModel, Field
                
                class RemediationQuestionSchema(BaseModel):
                    question: str = Field(description="The question text targeting the same concept as the failed question.")
                    type: str = Field(description="The question type: 'multiple-choice' or 'true_false' or 'fill-in' or 'writing'. Use same type as the original question if possible.")
                    options: List[str] = Field(default_factory=list, description="List of options if type is 'multiple-choice'. Empty list otherwise.")
                    answer: str = Field(description="The correct answer.")
                    explanation: str = Field(description="Explanation of the correct answer.")
                
                parser = PydanticOutputParser(pydantic_object=RemediationQuestionSchema)
                prompt = f"""You are an expert tutor. A student made an error on question '{question_id}' in note '{note_path}' due to this misconception: '{misconception_text}'.
Note content:
{note_content}

Student's incorrect answer: '{user_answer}'

Generate a new related remediation question that tests the same concept but is different, helping verify that they have understood the concept now.
Use the exact same format and question type as the original if possible.

{parser.get_format_instructions()}
"""
                messages = [
                    SystemMessage(content="You are a helpful tutor generating a remediation question."),
                    HumanMessage(content=prompt)
                ]
                import asyncio
                response = await asyncio.wait_for(
                    self.ai_service.llm.ainvoke(messages),
                    timeout=15,
                )
                parsed = parser.parse(response.content)
                
                q_type = parsed.type
                if q_type == "multiple-choice":
                    q_type = "mcq"
                elif q_type == "fill-in":
                    q_type = "fill_in"
                
                options_dict = {}
                if q_type == "mcq" and parsed.options:
                    for idx, opt in enumerate(parsed.options):
                        letter = chr(65 + idx)
                        options_dict[letter] = opt
                
                return {
                    "id": f"{question_id}_remediation",
                    "type": q_type,
                    "question": parsed.question,
                    "options": options_dict or parsed.options,
                    "answer": parsed.answer,
                    "explanation": parsed.explanation,
                    "note_id": note_path,
                    "is_remediation": True
                }
            except Exception as e:
                logger.warning(f"[TutorSessionManager] Failed to generate remediation question: {e}")
                
        # Fallback question
        return {
            "id": f"{question_id}_remediation",
            "type": "true_false",
            "question": f"Do you understand the core concept behind {question_id} now?",
            "answer": True,
            "explanation": "Mastery of the concept is required to proceed.",
            "note_id": note_path,
            "is_remediation": True
        }

    def _find_note_chapter_info(self, hub_path: Path, note_path_rel: str) -> Optional[Tuple[str, int, str, str]]:
        parts = Path(note_path_rel).parts
        if len(parts) >= 2:
            note_file = parts[-1]
            chapter_folder = parts[-2]
            note_title = Path(note_file).stem
            
            match = re.match(r"^(\d+)_(.*)$", chapter_folder)
            if match:
                order = int(match.group(1))
                chapter_title = match.group(2).replace("_", " ")
                topic = ""
                if "General" in parts:
                    gen_idx = parts.index("General")
                    if gen_idx + 1 < len(parts):
                        topic = parts[gen_idx + 1]
                else:
                    topic = parts[-3] if len(parts) >= 3 else ""
                return topic, order, chapter_title, note_title
        return None

    async def unlock_and_generate_note(self, session_id: str, note_path_rel: str):
        session = self.get_session(session_id)
        if not session:
            return
            
        info = self._find_note_chapter_info(self.vault_path / session["hub_path"], note_path_rel)
        if not info:
            return
        topic, order, chapter_title, note_title = info
        
        hub_path = self.vault_path / session["hub_path"]
        prompt = topic
        if hub_path.exists():
            try:
                import frontmatter
                post = frontmatter.loads(hub_path.read_text(encoding="utf-8"))
                prompt = post.metadata.get("prompt", topic)
            except Exception:
                pass
                
        from src.domains.ater import learning_object as lo
        
        ch_rel_path = lo.get_chapter_path(topic, chapter_title, order)
        ch_abs_path = self.vault_path / ch_rel_path
        if not ch_abs_path.exists():
            ch_abs_path.parent.mkdir(parents=True, exist_ok=True)
            notes_cleaned = []
            if hub_path.exists():
                hub_content = hub_path.read_text(encoding="utf-8")
                lines = hub_content.split("\n")
                in_chap = False
                for line in lines:
                    if f"[[Chapter_{order:02d}_{lo.normalize_title(chapter_title)}]]" in line or f"Chapter_{order:02d}_{lo.normalize_title(chapter_title)}" in line:
                        in_chap = True
                    elif in_chap and line.strip().startswith("- [["):
                        note_match = re.search(r"\[\[([^\]]+)\]\]", line)
                        if note_match:
                            notes_cleaned.append(note_match.group(1))
                    elif in_chap and line.strip().startswith("-") and not line.strip().startswith("- [["):
                        break
            
            ch_content = lo.build_chapter_content(
                f"{lo.normalize_title(topic)}_Hub",
                order,
                notes_cleaned,
                f"Chapter {order:02d} {chapter_title}"
            )
            ch_abs_path.write_text(ch_content, encoding="utf-8")
            
        note_abs_path = self.vault_path / note_path_rel
        note_abs_path.parent.mkdir(parents=True, exist_ok=True)
        
        art_pack_rel = lo.get_artifact_pack_path(note_path_rel)
        art_pack_abs = self.vault_path / art_pack_rel
        art_pack_abs.parent.mkdir(parents=True, exist_ok=True)
        if not art_pack_abs.exists():
            minimal_pack = lo.build_minimal_artifact_pack(note_title, note_path_rel)
            art_pack_abs.write_text(json.dumps(minimal_pack, indent=2), encoding="utf-8")
            
        note_content = lo.merge_atomic_note_metadata(
            existing_content="",
            chapter_title=f"Chapter_{order:02d}_{lo.normalize_title(chapter_title)}",
            lesson_variants={},
            artifact_pack_path=art_pack_rel,
            hub_title=f"{lo.normalize_title(topic)}_Hub"
        )
        note_abs_path.write_text(note_content, encoding="utf-8")
        
        all_note_titles = self._get_curriculum(hub_path)
        all_note_titles = [Path(n).stem for n in all_note_titles]
        
        from src.domains.ater.assistant import _generate_learning_runtime_note_markdown, ensure_teaching_markdown_quality, TeachingConceptSpec
        from src.domains.ater.compiler_service import AterLessonCompiler
        from src.domains.ater.artifact_service import ArtifactService
        
        generated_body = await _generate_learning_runtime_note_markdown(
            llm=getattr(self.ai_service, "llm", None),
            llm_creative=getattr(self.ai_service, "llm_creative", None),
            topic=topic,
            chapter_title=chapter_title,
            note_title=note_title,
            prompt=prompt,
            all_note_titles=all_note_titles
        )
        
        if generated_body:
            write_spec = TeachingConceptSpec(
                topic=topic,
                chapter_title=chapter_title,
                note_title=note_title,
                prompt=prompt,
                related_titles=tuple(all_note_titles or ()),
            )
            final_body = ensure_teaching_markdown_quality(generated_body, write_spec)
        else:
            from src.domains.ater.assistant import _ensure_interactive_quiz_block, _learning_runtime_note_markdown
            fallback_body = _ensure_interactive_quiz_block(
                _learning_runtime_note_markdown(topic, note_title),
                topic,
                note_title,
            )
            write_spec = TeachingConceptSpec(
                topic=topic,
                chapter_title=chapter_title,
                note_title=note_title,
                prompt=prompt,
                related_titles=tuple(all_note_titles or ()),
            )
            final_body = ensure_teaching_markdown_quality(fallback_body, write_spec)
            
        import frontmatter
        from src.domains.ater.vault_manager import VaultManager
        post = frontmatter.loads(note_abs_path.read_text(encoding="utf-8"))
        post.content = final_body
        vm = self.ai_service.vm if self.ai_service else VaultManager(".")
        yaml_part = vm.dump_obsidian_yaml(post.metadata)
        body = post.content if post.content.startswith("\n") else f"\n{post.content}"
        note_abs_path.write_text(f"---\n{yaml_part}---\n{body}", encoding="utf-8")
        
        compiler = AterLessonCompiler(str(self.vault_path))
        for variant in ("simple", "deep", "cram", "exam"):
            compiler.compile_lesson(note_abs_path, variant)
            
        artifact_service = ArtifactService(vault_path=str(self.vault_path))
        await artifact_service.generate_artifacts(
            note_title=note_title,
            note_path_rel=note_path_rel,
            frontmatter=post.metadata,
            force=True
        )
        
        if hub_path.exists():
            hub_content = hub_path.read_text(encoding="utf-8")
            locked_pattern = f"[[{note_title}|🔒 {note_title.replace('_', ' ')}]]"
            active_pattern = f"[[{note_title}]]"
            if locked_pattern in hub_content:
                hub_content = hub_content.replace(locked_pattern, active_pattern)
                hub_path.write_text(hub_content, encoding="utf-8")

    def advance_note(self, session_id: str) -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        curr_note = session["current_note_path"]
        curriculum = session["curriculum"]
        completed = session["completed_notes"]
        active_note_unlocks = session["active_note_unlocks"]
        
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
            
        # Paced progressive unlocking check
        if next_note:
            curr_chapter = Path(curr_note).parts[-2] if len(Path(curr_note).parts) >= 2 else ""
            next_chapter = Path(next_note).parts[-2] if len(Path(next_note).parts) >= 2 else ""
            
            if curr_chapter == next_chapter:
                if next_note not in active_note_unlocks:
                    active_note_unlocks.append(next_note)
                    import asyncio
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            loop.create_task(self.unlock_and_generate_note(session_id, next_note))
                        else:
                            loop.run_until_complete(self.unlock_and_generate_note(session_id, next_note))
                    except Exception:
                        try:
                            asyncio.run(self.unlock_and_generate_note(session_id, next_note))
                        except Exception as e:
                            print(f"[TutorSessionManager] Failed to unlock note: {e}")
            else:
                # Chapter boundary! Lock until consolidation quiz is passed.
                # Do not advance current_note_path to next_note yet.
                status = "consolidation_quiz"
                next_note = curr_note # Keep it at current note for now until quiz passes
                
        self.conn.execute("""
            UPDATE tutor_sessions
            SET current_note_path = ?, completed_notes = ?, active_note_unlocks = ?, status = ?, updated_at = ?
            WHERE session_id = ?
        """, (
            next_note,
            json.dumps(completed),
            json.dumps(active_note_unlocks),
            status,
            datetime.now().isoformat(),
            session_id
        ))
        self.conn.commit()
        
        return self.get_session(session_id)

    def start_consolidation_quiz(self, session_id: str) -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        hub_path = self.vault_path / session["hub_path"]
        if not hub_path.exists():
            raise ValueError("Hub file not found")
            
        curr_note = session["current_note_path"]
        chapters_list = self._extract_wikilinks(hub_path.read_text(encoding="utf-8"))
        
        target_chapter_path = None
        target_chapter_title = ""
        chapter_notes = []
        
        for chap_name in chapters_list:
            chap_path = self._resolve_vault_path(chap_name)
            if not chap_path or not chap_path.exists():
                continue
            
            chap_content = chap_path.read_text(encoding="utf-8")
            notes_list = self._extract_wikilinks(chap_content)
            
            chap_note_rel_paths = []
            for n in notes_list:
                note_p = self._resolve_vault_path(n)
                if note_p:
                    chap_note_rel_paths.append(note_p.relative_to(self.vault_path).as_posix())
            
            if curr_note in chap_note_rel_paths:
                target_chapter_path = chap_path
                target_chapter_title = chap_path.stem
                chapter_notes = chap_note_rel_paths
                break
                
        if not target_chapter_path:
            raise ValueError(f"Could not find chapter containing note {curr_note}")
            
        all_questions = []
        for note_rel in chapter_notes:
            note_abs = self.vault_path / note_rel
            if note_abs.exists():
                note_content = note_abs.read_text(encoding="utf-8")
                match = re.search(r"```interactive-quiz\s*\n(.*?)\n```", note_content, re.DOTALL)
                if match:
                    try:
                        questions_list = json.loads(match.group(1))
                        if isinstance(questions_list, list):
                            for q in questions_list:
                                q["note_id"] = note_rel
                                q["note_title"] = note_abs.stem
                                all_questions.append(q)
                    except Exception:
                        pass
                        
        return {
            "chapter_title": target_chapter_title,
            "questions": all_questions
        }

    def verify_consolidation_quiz(self, session_id: str) -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        curr_note = session["current_note_path"]
        curriculum = session["curriculum"]
        active_note_unlocks = session["active_note_unlocks"]
        
        # Advance to the first note of the next chapter
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
                status = "completed"
                
        if next_note:
            if next_note not in active_note_unlocks:
                active_note_unlocks.append(next_note)
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(self.unlock_and_generate_note(session_id, next_note))
                    else:
                        loop.run_until_complete(self.unlock_and_generate_note(session_id, next_note))
                except Exception:
                    try:
                        asyncio.run(self.unlock_and_generate_note(session_id, next_note))
                    except Exception as e:
                        print(f"[TutorSessionManager] Failed to unlock note: {e}")
                        
        self.conn.execute("""
            UPDATE tutor_sessions
            SET current_note_path = ?, active_note_unlocks = ?, status = ?, updated_at = ?
            WHERE session_id = ?
        """, (
            next_note,
            json.dumps(active_note_unlocks),
            status,
            datetime.now().isoformat(),
            session_id
        ))
        self.conn.commit()
        
        return self.get_session(session_id)


    async def _diagnose_mistake(self, note_path: str, question_id: str, user_answer: str) -> Dict[str, Any]:
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
                import asyncio
                response = await asyncio.wait_for(
                    self.ai_service.llm.ainvoke(messages),
                    timeout=15,
                )
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
