from src.utils.vault_path import resolve_vault_path
from fastapi import HTTPException
import sqlite3
import json
import logging
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.messages import SystemMessage, HumanMessage
from src.domains.ai.retry import ainvoke_llm_with_retry
from src.domains.ater.quiz_builder import enrich_question_v2

logger = logging.getLogger("Ater.TutorService")


class TutorAIGenerationError(RuntimeError):
    pass


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

    def _strict_ai_enabled(self) -> bool:
        secrets = getattr(self.ai_service, "secrets", None)
        return bool(self.ai_service and getattr(self.ai_service, "llm", None) and getattr(secrets, "ai_key", None))

    def _raise_ai_error(self, label: str, exc: BaseException) -> None:
        raise TutorAIGenerationError(f"{label} failed with the configured AI model: {exc}") from exc

    def _fallback_remediation_lesson(self, question: Dict[str, Any], user_answer: str, note_content: str = "") -> str:
        prompt = str(question.get("question") or "the question").strip()
        correct = question.get("answer")
        correct_text = ", ".join(map(str, correct)) if isinstance(correct, list) else str(correct or "the correct concept")
        explanation = str(question.get("explanation") or "").strip()
        skill = str(question.get("skill_target") or question.get("note_title") or "this concept").replace("_", " ")
        note_anchor = self._remediation_note_anchor(note_content, skill)
        wrong_model = self._diagnose_wrong_answer(question, user_answer)
        if not explanation:
            explanation = "A correct answer must apply the concept's mechanism, not only match a familiar word from the question."
        return (
            f"### What you got wrong\n\n"
            f"You answered `{user_answer}` for a question testing {skill}: {prompt}. The expected answer is `{correct_text}`. "
            f"Your answer points to this wrong mental model: {wrong_model}\n\n"
            f"### Why that is wrong\n\n"
            f"{explanation} The problem is not just the selected option; it is the relationship your answer implies. "
            f"A correct answer must keep the object, condition, and mechanism in the same roles as the note teaches them.\n\n"
            f"### Deeper correction\n\n"
            f"Rebuild the idea from the mechanism. First identify the object being studied, then state the relationship, then separate it from nearby concepts that look similar. "
            f"{note_anchor}"
        )

    def _remediation_note_anchor(self, note_content: str, skill: str) -> str:
        text = re.sub(r"```interactive-quiz[\s\S]*?```", "", note_content or "", flags=re.IGNORECASE).strip()
        text = re.sub(r"^---[\s\S]*?---", "", text, count=1).strip()
        sections = re.split(r"(?m)^##\s+", text)
        best = ""
        skill_terms = [term for term in re.findall(r"[A-Za-z]{4,}", skill.lower())]
        for section in sections:
            cleaned = re.sub(r"\s+", " ", section).strip()
            if not cleaned:
                continue
            score = sum(1 for term in skill_terms if term in cleaned.lower())
            if score > 0 and len(cleaned) > len(best):
                best = cleaned
        if not best:
            best = re.sub(r"\s+", " ", text).strip()
        best = re.sub(r"^(Mental Model|The [A-Za-z &]+|Limits [A-Za-z &]+)\s+", "", best).strip()
        if len(best) > 700:
            best = best[:700].rsplit(" ", 1)[0] + "."
        return best or "Use the original note as the anchor, then test whether the same rule still holds in a new case."

    def _diagnose_wrong_answer(self, question: Dict[str, Any], user_answer: str) -> str:
        options = question.get("options") or {}
        selected = ""
        if isinstance(options, dict):
            selected = str(options.get(str(user_answer), ""))
        selected = selected or str(user_answer or "")
        lowered = selected.lower()
        if any(token in lowered for token in ["afford", "income", "price", "budget", "buy"]):
            return "you are mixing desire/ranking with affordability or final purchase."
        if any(token in lowered for token in ["happiness", "satisfaction", "utility", "units"]):
            return "you are mixing a ranking concept with measured utility or satisfaction."
        if any(token in lowered for token in ["label", "unrelated", "irrelevant"]):
            return "you are treating the concept as a loose label instead of a working relationship."
        if any(token in lowered for token in ["reverse", "opposite", "contradict"]):
            return "you are inverting the relationship instead of preserving the source mechanism."
        return "you recognized a nearby idea but did not preserve the exact mechanism being tested."

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
                active_question_overrides TEXT DEFAULT '{}',
                generated_ahead_paths TEXT DEFAULT '[]',
                transfer_gate_outcomes TEXT DEFAULT '{}',
                offline_readiness TEXT DEFAULT '{}',
                source_job_id TEXT,
                current_concept_node_id TEXT
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
        for col_name in [
            "active_note_unlocks", "consecutive_failures", "active_question_overrides",
            "generated_ahead_paths", "transfer_gate_outcomes", "offline_readiness",
            "source_job_id", "current_concept_node_id"
        ]:
            try:
                self.conn.execute(f"ALTER TABLE tutor_sessions ADD COLUMN {col_name} TEXT")
            except sqlite3.OperationalError as e:
                if "duplicate column name" not in str(e).lower():
                    raise e
        self.conn.commit()

    def _resolve_vault_path(self, note_id: str) -> Optional[Path]:
        try:
            target_path = resolve_vault_path(self.vault_path, note_id)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        if target_path.exists():
            return target_path

        p = Path(note_id)
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
        return [l.strip() for l in links if l.strip()]

    def _get_curriculum(self, hub_path: Path) -> List[str]:
        if not hub_path.exists():
            return []
        content = hub_path.read_text(encoding="utf-8")
        links = self._extract_wikilinks(content)
        
        all_notes = []
        seen_notes = set()
        seen_chapters = set()
        
        for l in links:
            ch_name = l.split("|")[0].strip()
            if "chapter" in ch_name.lower() or ch_name.startswith("Chapter_"):
                if ch_name in seen_chapters:
                    continue
                seen_chapters.add(ch_name)
                
                ch_path = self._resolve_vault_path(ch_name)
                if not ch_path:
                    continue
                ch_content = ch_path.read_text(encoding="utf-8")
                notes_list = self._extract_wikilinks(ch_content)
                
                for n in notes_list:
                    note_name = n.split("|")[0].strip()
                    if "chapter" in note_name.lower() or note_name.startswith("Chapter_"):
                        continue
                    if note_name == hub_path.stem:
                        continue
                    
                    resolved = self._resolve_vault_path(note_name)
                    if resolved:
                        if resolved.resolve() == hub_path.resolve():
                            continue
                        note_file_path = resolved
                    else:
                        note_file_path = ch_path.parent / f"{note_name}.md"
                    
                    try:
                        rel_path = note_file_path.relative_to(self.vault_path).as_posix()
                    except ValueError:
                        rel_path = note_file_path.as_posix()
                        
                    if rel_path not in seen_notes:
                        seen_notes.add(rel_path)
                        all_notes.append(rel_path)
                    
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
            (session_id, hub_path, current_note_path, completed_notes, wagers, score, status, updated_at, active_note_unlocks, consecutive_failures, active_question_overrides, generated_ahead_paths, transfer_gate_outcomes, offline_readiness)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            json.dumps({}),
            json.dumps([]),
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
        keys = row.keys()
        
        completed = json.loads(row["completed_notes"])
        active_unlocks = json.loads(row["active_note_unlocks"]) if row["active_note_unlocks"] else []
        generated_ahead = json.loads(row["generated_ahead_paths"]) if ("generated_ahead_paths" in keys and row["generated_ahead_paths"]) else []
        source_job_id = row["source_job_id"] if "source_job_id" in keys else None
        current_concept_node_id = row["current_concept_node_id"] if "current_concept_node_id" in keys else None
        source_job_state = None
        if source_job_id:
            try:
                from src.domains.ater.source_service import SourceLearningJobService
                from src.domains.ater.source_service import _source_note_rel_path
                source_job_state = SourceLearningJobService(self.db_path).get_job(source_job_id)
                source_nodes = (source_job_state.get("concept_graph") or {}).get("nodes") or []
                if source_nodes:
                    curriculum = [
                        _source_note_rel_path(source_job_state, node["title"])
                        for node in source_nodes
                    ]
                elif row["current_note_path"]:
                    curriculum = [
                        (source_job_state.get("current_tutor_link") or {}).get("current_note_path")
                        or row["current_note_path"]
                    ]
            except Exception as e:
                logger.warning(f"[TutorSessionManager] Failed to restore source job state: {e}")
        
        # Reconciliation: Treat existing note files as generated
        reconciled = False
        source_nodes_by_path = {}
        if source_job_state:
            try:
                from src.domains.ater.source_service import _source_note_rel_path
                source_nodes_by_path = {
                    _source_note_rel_path(source_job_state, node["title"]): node
                    for node in ((source_job_state.get("concept_graph") or {}).get("nodes") or [])
                }
            except Exception:
                source_nodes_by_path = {}

        for path_rel in curriculum:
            if path_rel not in completed and path_rel not in active_unlocks:
                if (self.vault_path / path_rel).exists() and path_rel not in generated_ahead:
                    generated_ahead.append(path_rel)
                    reconciled = True
                    
        if reconciled:
            self.conn.execute(
                "UPDATE tutor_sessions SET generated_ahead_paths = ? WHERE session_id = ?",
                (json.dumps(generated_ahead), session_id)
            )
            self.conn.commit()
            
        # Build roadmap list of dicts
        roadmap = []
        for path_rel in curriculum:
            status = "locked"
            if path_rel in completed:
                status = "completed"
            elif path_rel == row["current_note_path"]:
                status = "current"
            elif path_rel in active_unlocks:
                status = "unlocked"
            elif path_rel in generated_ahead:
                status = "generated"
                
            # Check offline readiness
            offline_ready = (self.vault_path / path_rel).exists()
            
            note_stem = Path(path_rel).stem
            source_node = source_nodes_by_path.get(path_rel, {})
            roadmap.append({
                "path": path_rel,
                "id": source_node.get("id"),
                "title": source_node.get("title") or note_stem.replace("_", " "),
                "status": status,
                "offline_ready": offline_ready,
                "source_pages": source_node.get("source_pages", [])
            })
            
        session_data = {
            "session_id": row["session_id"],
            "hub_path": row["hub_path"],
            "current_note_path": row["current_note_path"],
            "completed_notes": completed,
            "wagers": json.loads(row["wagers"]),
            "score": row["score"],
            "status": row["status"],
            "updated_at": row["updated_at"],
            "curriculum": curriculum,
            "active_note_unlocks": active_unlocks,
            "consecutive_failures": json.loads(row["consecutive_failures"]) if row["consecutive_failures"] else {},
            "active_question_overrides": json.loads(row["active_question_overrides"]) if row["active_question_overrides"] else {},
            "generated_ahead_paths": generated_ahead,
            "transfer_gate_outcomes": json.loads(row["transfer_gate_outcomes"]) if ("transfer_gate_outcomes" in keys and row["transfer_gate_outcomes"]) else {},
            "offline_readiness": json.loads(row["offline_readiness"]) if ("offline_readiness" in keys and row["offline_readiness"]) else {},
            "source_job_id": source_job_id,
            "current_concept_node_id": current_concept_node_id,
            "source_job": source_job_state,
            "source_coverage": (source_job_state or {}).get("coverage"),
            "warnings": (source_job_state or {}).get("warnings", []),
            "roadmap": roadmap
        }
        session_data["current_note_mastery"] = self.get_note_mastery_state(session_data, session_data["current_note_path"])
        return session_data

    def _read_note_frontmatter(self, note_path: str) -> Dict[str, Any]:
        if not note_path:
            return {}
        note_file = self.vault_path / note_path
        if not note_file.exists():
            resolved = self._resolve_vault_path(note_path)
            note_file = resolved if resolved else note_file
        if not note_file.exists():
            return {}
        try:
            import frontmatter
            post = frontmatter.loads(note_file.read_text(encoding="utf-8"))
            return dict(post.metadata or {})
        except Exception:
            return {}

    def get_note_mastery_state(self, session: Dict[str, Any], note_path: str) -> Dict[str, Any]:
        if not note_path:
            return {
                "note_path": note_path,
                "recall_passed": True,
                "transfer_passed": True,
                "has_transfer": False,
                "transfer_task": None,
            }

        questions = self._extract_note_questions(note_path)
        wagers = session.get("wagers", {})
        missing_questions = []
        recall_passed = True
        for q in questions:
            q_id = str(q.get("id"))
            if q_id not in wagers or not wagers[q_id].get("correct"):
                recall_passed = False
                missing_questions.append(q_id)

        metadata = self._read_note_frontmatter(note_path)
        transfer_task = metadata.get("transfer_task")
        has_transfer = bool(transfer_task)
        transfer_gate_outcomes = session.get("transfer_gate_outcomes", {})
        transfer_passed = (
            transfer_gate_outcomes.get(note_path, {}).get("status") == "passed"
            if has_transfer
            else True
        )

        return {
            "note_path": note_path,
            "recall_passed": recall_passed,
            "transfer_passed": transfer_passed,
            "has_transfer": has_transfer,
            "transfer_task": transfer_task,
            "missing_questions": missing_questions,
            "outcome": transfer_gate_outcomes.get(note_path),
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
            
            # Fetch note questions to find the original question details
            questions = self._extract_note_questions(session["current_note_path"])
            question_data = None
            for q in questions:
                if str(q.get("id")) == question_id:
                    question_data = q
                    break
            if not question_data:
                question_data = active_question_overrides.get(question_id)
            if not question_data:
                question_data = {"id": question_id, "question": f"Question {question_id}", "type": "mcq"}

            if failures == 1:
                # First failure: get mistake diagnosis lesson but no remediation question
                lesson = await self.generate_source_remediation_lesson(session, question_data, user_answer)
                diagnosis = {
                    "is_misconception": False,
                    "misconception_text": lesson,
                    "hint": "Focus on the core definitions and try again.",
                    "remediation_question": None
                }
            else:
                # Consecutive failures: get detailed lesson & clean remediation question
                lesson = await self.generate_source_remediation_lesson(session, question_data, user_answer)
                remediation_q = await self.generate_clean_remediation_question(session["current_note_path"], question_data, user_answer, lesson)

                diagnosis = {
                    "is_misconception": True,
                    "misconception_text": lesson,
                    "hint": "Analyze the lesson and attempt the follow-up question.",
                    "remediation_question": remediation_q
                }

                self.log_misconception(
                    topic=session["hub_path"], 
                    note_title=Path(session["current_note_path"]).stem,
                    misconception_text=lesson
                )
                
                if remediation_q:
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
        if session.get("source_job_id") and session.get("current_concept_node_id"):
            try:
                from src.domains.ater.source_service import SourceLearningJobService
                service = SourceLearningJobService(self.db_path)
                service.update_coverage_for_answer(
                    session["source_job_id"],
                    session["current_concept_node_id"],
                    correct=is_correct,
                    transfer_passed=False,
                    remediation_completed=not is_correct and bool(diagnosis.get("remediation_question")),
                )
            except Exception as e:
                logger.warning(f"[TutorSessionManager] Failed to update source coverage: {e}")
        
        return {
            "score": new_score,
            "score_change": score_change,
            "diagnosis": diagnosis,
            "session": self.get_session(session_id)
        }

    async def generate_source_remediation_lesson(self, session: Dict[str, Any], question: Dict[str, Any], user_answer: str) -> str:
        if not session.get("source_job_id"):
            return await self.generate_detailed_remediation_lesson(session["current_note_path"], question, user_answer)
        source_job = session.get("source_job") or {}
        node = None
        for candidate in source_job.get("concept_graph", {}).get("nodes", []):
            if candidate.get("id") == session.get("current_concept_node_id"):
                node = candidate
                break
        if not node:
            return await self.generate_detailed_remediation_lesson(session["current_note_path"], question, user_answer)

        excerpt = " ".join(ex.get("text", "") for ex in node.get("source_excerpts", []))[:1200]
        profile = node.get("teaching_profile", {})
        if self.ai_service and getattr(self.ai_service, "llm", None):
            try:
                prompt = f"""Create source-grounded remediation for a failed tutor answer.
Use only the cited source excerpt and teaching profile. Do not introduce macroeconomics, programming, biology, or outside examples.

Concept: {node.get("title")}
Source pages: {node.get("source_pages")}
Teaching profile: {json.dumps(profile, ensure_ascii=False)}
Source excerpt: {excerpt}
Question: {json.dumps(question, ensure_ascii=False)}
Learner answer: {user_answer}

Write 2 continuous paragraphs plus one retry prompt."""
                response = await ainvoke_llm_with_retry(self.ai_service.llm, [
                    SystemMessage(content="You are a source-grounded tutor. Stay inside the provided source."),
                    HumanMessage(content=prompt),
                ], label="source-remediation")
                text = response.content if hasattr(response, "content") else str(response)
                lowered = text.lower()
                if not any(term in lowered for term in ["central banking", "exchange rates", "programming", "biology"]):
                    return text
                if self._strict_ai_enabled():
                    raise TutorAIGenerationError("source remediation drifted outside the source context")
            except Exception as e:
                logger.warning(f"[TutorSessionManager] Source remediation AI failed: {e}")
                if self._strict_ai_enabled():
                    self._raise_ai_error("Source remediation lesson", e)
        return (
            f"{node.get('title')} should be repaired from the source evidence on page(s) "
            f"{', '.join(map(str, node.get('source_pages', [])))}. {excerpt[:500]} "
            "Use the cited definition or relationship, then retry by explaining the concept in your own words."
        )

    async def generate_detailed_remediation_lesson(self, note_path: str, question: Dict[str, Any], user_answer: str, attempt_number: int = 0, seen_summaries=None) -> str:
        if self.ai_service and getattr(self.ai_service, "llm", None):
            try:
                note_file = self.vault_path / note_path
                if not note_file.exists():
                    resolved = self._resolve_vault_path(note_path)
                    note_file = resolved if resolved else note_file
                note_content = note_file.read_text(encoding="utf-8") if (note_file and note_file.exists()) else ""
                note_content = re.sub(r"^---\s*\n.*?\n---\s*\n?", "", note_content, flags=re.DOTALL)
                note_content = re.sub(r"```interactive-quiz\s*\n?.*?\n?```", "", note_content, flags=re.DOTALL)

                prompt = f"""You are Ater's expert system design and academic tutor. A student got a practice question wrong.
Your task is to generate a detailed educational lesson explaining exactly what they got wrong, why it is wrong, and the deeper concept they need so they do not repeat the mistake.

Strict Rules for the Lesson:
- Use exactly these Markdown headings: ### What you got wrong, ### Why that is wrong, ### Deeper correction.
- Each heading must contain one detailed paragraph.
- Do NOT use bullet points, numbered lists, checklists, or emojis.
- Directly name the learner's wrong idea and contrast it with the correct idea.
- Focus on the specific misconception, not the entire note.
- The remediation lesson should feel like a small Atomic Note about the missed sub-skill.

Note Path: {note_path}
Note Content:
{note_content[:6000]}

Failed Question:
{json.dumps(question, ensure_ascii=False)}

Student's Incorrect Answer:
{user_answer}

Attempt Number: {attempt_number + 1}
Avoid repeating these previously taught lessons (summaries): {json.dumps(seen_summaries or [])}

If this is a later attempt (attempt_number > 0), go deeper — explain underlying mechanisms, edge cases, or related concepts rather than restating the same basics.

Detailed Lesson:"""
                
                messages = [
                    SystemMessage(content="You are a helpful, expert academic tutor. You write continuous, detailed educational lessons to clarify misconceptions."),
                    HumanMessage(content=prompt)
                ]
                response = await ainvoke_llm_with_retry(
                    self.ai_service.llm,
                    messages,
                    label="detailed-remediation",
                    timeout=20,
                )
                text = response.content if hasattr(response, "content") else str(response)
                if all(marker in text for marker in ["What you got wrong", "Why that is wrong", "Deeper correction"]):
                    return text
                if self._strict_ai_enabled():
                    raise TutorAIGenerationError("Detailed remediation lesson output was missing the required headers")
                return self._fallback_remediation_lesson(question, user_answer, note_content)
            except Exception as e:
                logger.warning(f"[TutorSessionManager] Failed to generate detailed remediation lesson: {e}")
                if self._strict_ai_enabled():
                    if isinstance(e, TutorAIGenerationError):
                        raise
                    self._raise_ai_error("Detailed remediation lesson", e)

        try:
            note_file = self.vault_path / note_path
            if not note_file.exists():
                resolved = self._resolve_vault_path(note_path)
                note_file = resolved if resolved else note_file
            note_content = note_file.read_text(encoding="utf-8") if (note_file and note_file.exists()) else ""
            note_content = re.sub(r"^---\s*\n.*?\n---\s*\n?", "", note_content, flags=re.DOTALL)
            note_content = re.sub(r"```interactive-quiz\s*\n?.*?\n?```", "", note_content, flags=re.DOTALL)
        except Exception:
            note_content = ""
        return self._fallback_remediation_lesson(question, user_answer, note_content)

    _SUPPORTED_PROVING_GROUND_TYPES = {
        "mcq", "true_false", "writing", "fill_in", "matching", "order", "debug",
        "synthesis", "trace", "scenario", "code", "calculation", "data_analysis", "find_error"
    }

    _QUESTION_TYPE_ALIASES = {
        "multiple-choice": "mcq",
        "multiple_choice": "mcq",
        "multiple choice": "mcq",
        "true-false": "true_false",
        "true false": "true_false",
        "true/false": "true_false",
        "boolean": "true_false",
        "fill-in": "fill_in",
        "fill in": "fill_in",
        "fill_blank": "fill_in",
        "fill in the blank": "fill_in",
        "fill-in-the-blank": "fill_in",
        "find-error": "find_error",
        "find error": "find_error",
    }

    def _normalize_question_type(self, q_type: Any) -> str:
        raw = str(q_type or "writing").strip().lower()
        normalized = self._QUESTION_TYPE_ALIASES.get(raw, raw)
        return normalized if normalized in self._SUPPORTED_PROVING_GROUND_TYPES else "writing"

    def _question_context_text(self, question: Dict[str, Any], lesson: str = "", note_content: str = "") -> str:
        return " ".join([
            str(question.get("question") or ""),
            str(question.get("content") or ""),
            str(question.get("codeSnippet") or ""),
            str(question.get("buggyCode") or ""),
            str(question.get("explanation") or ""),
            str(lesson or ""),
            str(note_content or "")[:2000],
        ]).lower()

    def _is_code_question_context(self, context: str) -> bool:
        return any(token in context for token in [
            "```", "def ", "class ", "function", "bug", "debug", "exception", "compile", "runtime",
            "javascript", "typescript", "python", "programming", "algorithm", "code",
        ])

    def _is_economics_question_context(self, context: str) -> bool:
        return any(token in context for token in [
            "econ-", "economics", "consumer", "utility", "budget", "preference", "preferences",
            "indifference", "marginal", "commodity", "commodities", "price", "income",
            "demand", "supply", "mrs", "budget line", "cardinal", "ordinal",
        ])

    def _allowed_proving_ground_types(self, context: str = "") -> List[str]:
        unsupported_for_non_code = {"debug", "code", "trace", "find_error"}
        if self._is_economics_question_context(context) and not self._is_code_question_context(context):
            return sorted(self._SUPPORTED_PROVING_GROUND_TYPES - unsupported_for_non_code)
        return sorted(self._SUPPORTED_PROVING_GROUND_TYPES)

    def _coerce_type_for_context(self, q_type: str, context: str) -> str:
        normalized = self._normalize_question_type(q_type)
        allowed = set(self._allowed_proving_ground_types(context))
        if normalized in allowed:
            return normalized
        if "calculation" in allowed and any(token in context for token in ["budget", "price", "income", "equation", "formula", "solve"]):
            return "calculation"
        return "scenario" if "scenario" in allowed else "writing"

    def _choose_proving_ground_type(
        self,
        question: Dict[str, Any],
        lesson: str = "",
        note_content: str = "",
        seen_question_types: Optional[List[str]] = None,
        attempt_number: int = 0,
    ) -> str:
        seen = {self._normalize_question_type(t) for t in (seen_question_types or [])}
        context = self._question_context_text(question, lesson, note_content)
        original_type = self._normalize_question_type(question.get("type"))
        allowed = set(self._allowed_proving_ground_types(context))

        ranked: List[str] = []
        if self._is_code_question_context(context) and {"debug", "trace", "code", "find_error"} & allowed:
            ranked.extend(["debug", "trace", "code", "find_error", "scenario"])
        if any(token in context for token in ["calculate", "equation", "formula", "solve", "number", "ratio", "probability", "derivative", "integral"]):
            ranked.extend(["calculation", "trace", "data_analysis", "fill_in"])
        if any(token in context for token in ["table", "dataset", "chart", "graph", "trend", "correlation", "row", "column"]):
            ranked.extend(["data_analysis", "calculation", "scenario"])
        if any(token in context for token in ["sequence", "order", "step", "workflow", "pipeline", "process", "first", "then"]):
            ranked.extend(["order", "trace", "scenario"])
        if any(token in context for token in ["compare", "contrast", "mapping", "pair", "relationship", "matches", "term"]):
            ranked.extend(["matching", "synthesis", "mcq"])

        ranked.extend([original_type, "scenario", "synthesis", "fill_in", "matching", "mcq", "writing", "true_false"])
        if attempt_number >= 1:
            ranked = ["scenario", "calculation", "synthesis"] + ranked

        for q_type in ranked:
            normalized = self._coerce_type_for_context(q_type, context)
            if normalized not in seen:
                return normalized
        return self._coerce_type_for_context(ranked[attempt_number % len(ranked)] if ranked else "scenario", context)

    def _as_list(self, value: Any) -> List[Any]:
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, tuple):
            return list(value)
        if isinstance(value, str) and "," in value:
            return [item.strip() for item in value.split(",") if item.strip()]
        return [value]

    def _fallback_proving_ground_question(
        self,
        note_path: str,
        original_question: Dict[str, Any],
        lesson: str = "",
        attempt_number: int = 0,
        seen_question_types: Optional[List[str]] = None,
        preferred_type: Optional[str] = None,
        note_content: str = "",
        adaptive: bool = False,
    ) -> Dict[str, Any]:
        context = self._question_context_text(original_question, lesson, note_content)
        q_type = self._normalize_question_type(preferred_type) if preferred_type else self._choose_proving_ground_type(
            original_question, lesson, note_content, seen_question_types, attempt_number
        )
        q_type = self._coerce_type_for_context(q_type, context)
        orig_id = str(original_question.get("id") or f"q_{Path(note_path).stem}")
        concept = str(original_question.get("question") or Path(note_path).stem.replace("_", " "))
        answer = original_question.get("answer") or "A correct answer explains the core mechanism and applies it to the case."
        answer_text = ", ".join(map(str, answer)) if isinstance(answer, list) else str(answer)
        base = {
            "id": f"{orig_id}_{'adaptive' if adaptive else 'remediation'}_{attempt_number + 1}",
            "type": q_type,
            "difficulty": f"L{min(4, max(2, attempt_number + 2))}",
            "question": f"Apply the same concept in a new case: {concept}",
            "answer": answer,
            "explanation": lesson or original_question.get("explanation") or "The answer must connect the concept's mechanism to the result.",
            "required_keywords": original_question.get("required_keywords") or [],
            "note_id": note_path,
            "is_remediation": not adaptive,
            "is_adaptive": adaptive,
        }

        if q_type == "mcq":
            base.update({
                "question": f"Which option best applies the concept tested here: {concept}",
                "options": {
                    "A": answer_text[:180] or "The explanation that preserves the core mechanism.",
                    "B": "A surface-level description that ignores the mechanism.",
                    "C": "A related but irrelevant fact from the topic.",
                    "D": "The inverse of the concept's actual relationship.",
                },
                "answer": "A",
            })
        elif q_type == "true_false":
            base.update({"question": f"True or False: {answer_text}", "answer": "True"})
        elif q_type == "fill_in":
            base.update({
                "question": f"Complete the key claim about this concept: {concept}",
                "textWithBlanks": f"The core mechanism is [[{answer_text[:80] or 'the correct relationship'}]].",
                "text_with_blanks": f"The core mechanism is [[{answer_text[:80] or 'the correct relationship'}]].",
                "answer": [answer_text[:80] or "the correct relationship"],
            })
        elif q_type == "matching":
            base.update({
                "question": "Match each concept role to the correct function.",
                "pairs": [
                    {"left": "Core mechanism", "right": "Transforms inputs into the expected result"},
                    {"left": "Misleading cue", "right": "Looks relevant but does not explain causality"},
                    {"left": "Application check", "right": "Uses the concept in a new case"},
                ],
                "answer": "See pairs for correct matching.",
            })
        elif q_type == "order":
            steps = [
                f"Identify the concept being tested: {Path(note_path).stem.replace('_', ' ')}",
                "State the exact relationship from the note",
                "Separate it from the misconception in the wrong answer",
                "Apply the corrected relationship to the new case",
            ]
            base.update({"question": "Put the reasoning steps in the correct order.", "steps": list(reversed(steps)), "answer": steps})
        elif q_type in {"debug", "find_error"}:
            base.update({
                "question": "Find the conceptual flaw in this reasoning and correct it.",
                "buggyCode": "Claim: the answer is valid because a related keyword appears, even if the mechanism is not applied.",
                "content": "Claim: the answer is valid because a related keyword appears, even if the mechanism is not applied.",
                "answer": "The flaw is substituting keyword recognition for applying the concept's mechanism.",
            })
        elif q_type == "code":
            base.update({
                "question": "Write a small function or pseudocode sketch that applies this concept.",
                "codeSnippet": "# Implement the concept's input -> mechanism -> output flow here",
                "language": "text",
                "answer": answer_text,
            })
        elif q_type == "calculation":
            base.update({"question": "Solve the applied calculation implied by the concept.", "content": concept, "answer": answer_text})
        elif q_type == "data_analysis":
            base.update({"question": "Interpret the evidence and state what the concept predicts.", "content": concept, "answer": answer_text})
        elif q_type == "trace":
            base.update({
                "question": "Trace how the concept moves from condition to result.",
                "content": concept,
                "steps": ["Start from the condition", "Apply the mechanism", "State the consequence"],
                "answer": answer_text,
            })
        elif q_type in {"scenario", "synthesis", "writing"}:
            base.update({
                "question": f"{'Synthesize' if q_type == 'synthesis' else 'Explain'} how the concept applies in a new situation: {concept}",
                "answer": answer_text,
            })
        return enrich_question_v2(
            base,
            q_type=q_type,
            concept=str(original_question.get("skill_target") or Path(note_path).stem.replace("_", " ")),
            note_title=Path(note_path).stem.replace("_", " "),
        )

    def _normalize_proving_ground_question(
        self,
        raw_question: Dict[str, Any],
        note_path: str,
        original_question: Optional[Dict[str, Any]] = None,
        lesson: str = "",
        attempt_number: int = 0,
        seen_question_types: Optional[List[str]] = None,
        preferred_type: Optional[str] = None,
        adaptive: bool = False,
        note_content: str = "",
    ) -> Dict[str, Any]:
        original_question = original_question or {}
        q = dict(raw_question or {})
        context = self._question_context_text({**original_question, **q}, lesson, note_content)
        q_type = self._coerce_type_for_context(q.get("type") or preferred_type, context)
        if preferred_type:
            preferred_normalized = self._coerce_type_for_context(preferred_type, context)
            if q_type != preferred_normalized:
                q_type = preferred_normalized
        if not str(q.get("question") or "").strip():
            if self._strict_ai_enabled():
                raise TutorAIGenerationError("AI question did not include a usable question prompt")
            return self._fallback_proving_ground_question(note_path, original_question, lesson, attempt_number, seen_question_types, q_type, note_content, adaptive)

        q["type"] = q_type
        q["id"] = str(q.get("id") or f"{original_question.get('id') or Path(note_path).stem}_{'adaptive' if adaptive else 'remediation'}_{attempt_number + 1}")
        q.setdefault("difficulty", f"L{min(4, max(2, attempt_number + 2))}")
        q.setdefault("explanation", lesson or original_question.get("explanation") or "Review the concept's mechanism and apply it directly.")
        q.setdefault("required_keywords", original_question.get("required_keywords") or [])
        q["note_id"] = note_path
        if adaptive:
            q["is_adaptive"] = True
        else:
            q["is_remediation"] = True

        if q_type == "mcq":
            options = q.get("options") or {}
            if isinstance(options, list):
                options = {chr(65 + idx): str(opt) for idx, opt in enumerate(options[:6])}
            if not isinstance(options, dict) or len(options) < 2:
                if self._strict_ai_enabled():
                    raise TutorAIGenerationError("AI MCQ question did not include enough options")
                return self._fallback_proving_ground_question(note_path, original_question, lesson, attempt_number, seen_question_types, "mcq", note_content, adaptive)
            q["options"] = {str(k): str(v) for k, v in options.items()}
            if str(q.get("answer") or "") not in q["options"]:
                q["answer"] = next(iter(q["options"].keys()))
        elif q_type == "true_false":
            ans = str(q.get("answer", "True")).strip().lower()
            q["answer"] = "False" if ans in {"false", "f", "no", "0"} else "True"
            q["options"] = {"True": "True", "False": "False"}
        elif q_type == "fill_in":
            answers = [str(item) for item in self._as_list(q.get("answer")) if str(item).strip()]
            if not answers:
                answers = [str(original_question.get("answer") or "the correct concept")]
            text = q.get("textWithBlanks") or q.get("text_with_blanks") or q.get("question") or ""
            if "[[" not in str(text):
                text = f"{str(text).rstrip('.?')} [[{answers[0]}]]."
            q["textWithBlanks"] = str(text)
            q["text_with_blanks"] = str(text)
            q["answer"] = answers
        elif q_type == "matching":
            pairs = q.get("pairs")
            if not isinstance(pairs, list) or len(pairs) < 2 or any(not isinstance(pair, dict) or "left" not in pair or "right" not in pair for pair in pairs):
                if self._strict_ai_enabled():
                    raise TutorAIGenerationError("AI matching question did not include valid pairs")
                return self._fallback_proving_ground_question(note_path, original_question, lesson, attempt_number, seen_question_types, "matching", note_content, adaptive)
            q["pairs"] = [{"left": str(pair["left"]), "right": str(pair["right"])} for pair in pairs]
            q.setdefault("answer", "See pairs for correct matching.")
        elif q_type == "order":
            answer_steps = [str(item) for item in self._as_list(q.get("answer")) if str(item).strip()]
            steps = [str(item) for item in self._as_list(q.get("steps")) if str(item).strip()]
            if len(answer_steps) < 2 and len(steps) >= 2:
                answer_steps = steps
            if len(steps) < 2 and len(answer_steps) >= 2:
                steps = list(reversed(answer_steps))
            if len(steps) < 2:
                if self._strict_ai_enabled():
                    raise TutorAIGenerationError("AI ordering question did not include enough steps")
                return self._fallback_proving_ground_question(note_path, original_question, lesson, attempt_number, seen_question_types, "order", note_content, adaptive)
            q["steps"] = steps
            q["answer"] = answer_steps or steps
        elif q_type in {"debug", "find_error"}:
            snippet = q.get("buggyCode") or q.get("content") or q.get("codeSnippet")
            if not snippet:
                if self._strict_ai_enabled():
                    raise TutorAIGenerationError("AI debug question did not include inspectable content")
                return self._fallback_proving_ground_question(note_path, original_question, lesson, attempt_number, seen_question_types, q_type, note_content, adaptive)
            q["buggyCode"] = str(snippet)
            q.setdefault("content", str(snippet))
            q.setdefault("answer", original_question.get("answer") or "Identify and correct the flawed reasoning.")
        elif q_type == "code":
            q.setdefault("codeSnippet", q.get("content") or "# Write your solution here")
            q.setdefault("language", "text")
            q.setdefault("answer", original_question.get("answer") or "A correct implementation applies the concept.")
        elif q_type in {"calculation", "data_analysis", "trace"}:
            q.setdefault("content", original_question.get("content") or original_question.get("question") or "")
            q.setdefault("answer", original_question.get("answer") or "See explanation.")
            if q_type == "trace":
                q.setdefault("steps", ["Identify the condition", "Apply the rule", "State the result"])
        else:
            q.setdefault("answer", original_question.get("answer") or "A complete answer explains and applies the concept.")
        return q

    async def generate_clean_remediation_question(self, note_path: str, question: Dict[str, Any], user_answer: str, lesson: str, attempt_number: int = 0, seen_question_types=None) -> Optional[Dict[str, Any]]:
        if self.ai_service and getattr(self.ai_service, "llm", None):
            try:
                note_file = self.vault_path / note_path
                if not note_file.exists():
                    resolved = self._resolve_vault_path(note_path)
                    note_file = resolved if resolved else note_file
                note_content = note_file.read_text(encoding="utf-8") if (note_file and note_file.exists()) else ""
                
                from langchain_core.output_parsers import PydanticOutputParser
                from pydantic import BaseModel, Field
                
                class RemediationQuestionSchema(BaseModel):
                    type: str = Field(description="One supported UI type: mcq, true_false, writing, fill_in, matching, order, debug, synthesis, trace, scenario, code, calculation, data_analysis, find_error.")
                    question: str = Field(description="Clean standalone question. Do not reference a prior attempt.")
                    options: Any = Field(default_factory=dict, description="MCQ options as {'A':'...', 'B':'...'} or a list; empty for non-MCQ.")
                    answer: Any = Field(default="", description="Correct answer. MCQ uses option key. order uses ordered list. fill_in uses string or list.")
                    explanation: str = Field(description="Explanation of the correct answer. Do NOT reference the student's past attempt.")
                    required_keywords: List[str] = Field(default_factory=list)
                    textWithBlanks: str = ""
                    text_with_blanks: str = ""
                    pairs: List[Dict[str, str]] = Field(default_factory=list)
                    steps: List[str] = Field(default_factory=list)
                    content: str = ""
                    codeSnippet: str = ""
                    buggyCode: str = ""
                    language: str = "text"

                _seen = [self._normalize_question_type(t) for t in (seen_question_types or [])]
                preferred_type = self._choose_proving_ground_type(question, lesson, note_content, _seen, attempt_number)
                allowed_types = self._allowed_proving_ground_types(
                    self._question_context_text(question, lesson, note_content)
                )

                parser = PydanticOutputParser(pydantic_object=RemediationQuestionSchema)
                prompt = f"""You are Ater's expert tutor. A student made an error on a question in the note below.
Your task is to generate a new related follow-up practice question that tests the same concept but is different, helping verify that they have understood the concept now.

Strict Rules:
- The question must be a clean, standalone question.
- Do NOT include any meta-references to the previous attempt, previous answer, or say 'Original question', 'previous answer', 'retry', 'error', or 'mistake'. Banned words: 'Original', 'previous', 'retry'. Banned phrases: 'Try the same idea another way', 'What mistake did the wrong answer make'.
- It must be a standard question that stands on its own.
- First choose the most effective supported UI question type for this concept, then write one question in that exact schema.
- Prefer transfer/application over definition recall.
- Use the preferred type unless the note content clearly demands a better supported type.
- For mcq, specify at least 4 options and put the correct option key in answer.
- For fill_in, include textWithBlanks with [[blank]] markers and answer as a list.
- For matching, include pairs with left and right keys.
- For order, include shuffled steps and answer as the correct ordered list.
- For code/debug/find_error, include codeSnippet, buggyCode, or content as appropriate.

Attempt number: {attempt_number + 1}
Previously used question types: {_seen}
Preferred question type: {preferred_type}
Supported types: {allowed_types}

Rules:
- Make this question harder than a basic recall. Test application of the concept, not just definition.
- NEVER use these banned words or phrases: 'original question', 'previous answer', 'retry', 'mistake', 'error', 'what went wrong'.

Note content:
{note_content[:6000]}

Misconception lesson:
{lesson}

Failed question ID: {question.get("id")}
Original question type: {question.get("type")}

{parser.get_format_instructions()}
"""
                messages = [
                    SystemMessage(content="You are an expert tutor generating a clean, standalone remediation question."),
                    HumanMessage(content=prompt)
                ]
                response = await ainvoke_llm_with_retry(
                    self.ai_service.llm,
                    messages,
                    label="clean-remediation-question",
                    timeout=20,
                )
                parsed = parser.parse(response.content)
                raw = parsed.model_dump()
                raw["id"] = f"{question.get('id')}_remediation_{attempt_number + 1}"
                return self._normalize_proving_ground_question(
                    raw,
                    note_path,
                    original_question=question,
                    lesson=lesson,
                    attempt_number=attempt_number,
                    seen_question_types=_seen,
                    preferred_type=preferred_type,
                    note_content=note_content,
                )
            except Exception as e:
                logger.warning(f"[TutorSessionManager] Failed to generate clean remediation question: {e}")

        return self._fallback_proving_ground_question(
            note_path,
            question,
            lesson,
            attempt_number,
            seen_question_types,
        )

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
        return self._fallback_proving_ground_question(
            note_path,
            {
                "id": f"adaptive_{Path(note_path).stem}_{session_id or 'session'}",
                "type": "writing",
                "question": f"Explain the most important idea from {title} in your own words.",
                "answer": "A correct answer should accurately use the lesson's core terms and explain the relationship between them.",
                "explanation": "This checks whether you can restate the lesson's central concept without copying the note.",
            },
            note_content=content,
            attempt_number=attempt_count,
            preferred_type=self._choose_proving_ground_type({}, "", content, [], attempt_count),
            adaptive=True,
        )

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
            if self._strict_ai_enabled():
                raise TutorAIGenerationError("Adaptive follow-up question failed with the configured AI model")
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
                if self._strict_ai_enabled():
                    raise TutorAIGenerationError("Adaptive correction follow-up failed with the configured AI model")
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
                type: str = Field(description="One supported UI type: mcq, true_false, writing, fill_in, matching, order, debug, synthesis, trace, scenario, code, calculation, data_analysis, find_error.")
                question: str
                options: Any = Field(default_factory=dict)
                answer: Any = ""
                explanation: str
                required_keywords: List[str] = Field(default_factory=list)
                textWithBlanks: str = ""
                text_with_blanks: str = ""
                pairs: List[Dict[str, str]] = Field(default_factory=list)
                steps: List[str] = Field(default_factory=list)
                content: str = ""
                codeSnippet: str = ""
                buggyCode: str = ""
                language: str = "text"

            parser = PydanticOutputParser(pydantic_object=AdaptiveQuestionSchema)
            clean_content = self._clean_note_content(note_path)
            source_question = {}
            if history:
                last_history = history[-1]
                if isinstance(last_history, dict):
                    source_question = last_history.get("question") if isinstance(last_history.get("question"), dict) else {}
            preferred_type = self._choose_proving_ground_type(
                source_question,
                json.dumps(last_result or {}, ensure_ascii=False),
                clean_content,
                [item.get("type") for item in history if isinstance(item, dict) and item.get("type")],
                len(history),
            )
            allowed_types = self._allowed_proving_ground_types(
                self._question_context_text(source_question, json.dumps(last_result or {}, ensure_ascii=False), clean_content)
            )
            prompt = f"""Generate exactly one next Proving Grounds question for this Atomic Note.

Atomic Note:
{clean_content[:6000]}

Recent learner history:
{json.dumps(history[-6:], ensure_ascii=False)}

Last grading result:
{json.dumps(last_result or {}, ensure_ascii=False)}

Pick the best supported UI question type for the learner's performance. If they were wrong, target the misconception with a concrete follow-up. If they were correct, increase transfer/application slightly. Do not generate a batch.
Preferred type from Ater's selector: {preferred_type}
Supported types: {allowed_types}

Schema rules:
- mcq: options as option-key map and answer as option key.
- true_false: answer is True or False.
- fill_in: textWithBlanks must include [[blank]] markers and answer should be a list.
- matching: pairs must be a list of left/right objects.
- order: steps are displayed order; answer is the correct ordered list.
- code/debug/find_error: include codeSnippet, buggyCode, or content.
- calculation/data_analysis/trace/scenario/synthesis/writing: include enough content/context for the UI prompt to stand alone.

{parser.get_format_instructions()}
"""
            response = await ainvoke_llm_with_retry(self.ai_service.llm, [
                SystemMessage(content="You are Ater's adaptive Proving Grounds question generator."),
                HumanMessage(content=prompt),
            ], label="adaptive-follow-up")
            question = parser.parse(response.content).model_dump()
            question["id"] = f"adaptive_{Path(note_path).stem}_{abs(hash(response.content)) % 100000}"
            question["difficulty"] = "L2"
            return self._normalize_proving_ground_question(
                question,
                note_path,
                original_question=source_question,
                lesson=json.dumps(last_result or {}, ensure_ascii=False),
                attempt_number=len(history),
                preferred_type=preferred_type,
                adaptive=True,
                note_content=clean_content,
            )
        except Exception as e:
            logger.warning(f"[TutorSessionManager] Failed to generate adaptive follow-up: {e}")
            if self._strict_ai_enabled():
                self._raise_ai_error("Adaptive follow-up question", e)
            return None

    async def _grade_adaptive_answer(self, note_path: str, question: Dict[str, Any], user_answer: Any) -> Dict[str, Any]:
        expected = question.get("answer")
        q_type = self._normalize_question_type(question.get("type"))
        answer_text = str(user_answer).strip()

        if q_type in {"mcq", "true_false", "fill_in"}:
            expected_values = self._as_list(expected)
            is_correct = any(str(item).strip().lower() == answer_text.lower() for item in expected_values)
            return {
                "is_correct": is_correct,
                "feedback": "Correct." if is_correct else "Not quite. Compare your answer against the lesson's exact claim.",
                "hint": "" if is_correct else (question.get("hints") or ["Look for the core definition in the note."])[0],
                "lesson": "" if is_correct else question.get("explanation", ""),
            }

        if q_type == "matching" and isinstance(question.get("pairs"), list) and isinstance(user_answer, dict):
            is_correct = all(str(user_answer.get(pair.get("left"))) == str(pair.get("right")) for pair in question.get("pairs", []))
            return {
                "is_correct": is_correct,
                "feedback": "Correct." if is_correct else "Not quite. Review the relationship each pair is testing.",
                "hint": "" if is_correct else "Match by function, not by surface wording.",
                "lesson": "" if is_correct else question.get("explanation", ""),
            }

        if q_type == "order" and isinstance(expected, list) and isinstance(user_answer, list):
            is_correct = [str(item).strip().lower() for item in expected] == [str(item).strip().lower() for item in user_answer]
            return {
                "is_correct": is_correct,
                "feedback": "Correct." if is_correct else "Not quite. The order should follow the concept's causal sequence.",
                "hint": "" if is_correct else "Start from the condition, then apply the mechanism, then state the result.",
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
                response = await ainvoke_llm_with_retry(self.ai_service.llm, [
                    SystemMessage(content="You are Ater's adaptive tutor grader."),
                    HumanMessage(content=prompt),
                ], label="adaptive-answer-grading")
                return parser.parse(response.content).model_dump()
            except Exception as e:
                logger.warning(f"[TutorSessionManager] AI adaptive grading failed: {e}")
                if self._strict_ai_enabled():
                    self._raise_ai_error("Adaptive answer grading", e)

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
                response = await ainvoke_llm_with_retry(
                    self.ai_service.llm,
                    messages,
                    label="remediation-question",
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
                if self._strict_ai_enabled():
                    self._raise_ai_error("Remediation question", e)
                
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

    async def generate_note_files(self, session_id: str, note_path_rel: str):
        session = self.get_session(session_id)
        if not session:
            return
            
        note_abs_path = self.vault_path / note_path_rel
        if note_abs_path.exists():
            try:
                content = note_abs_path.read_text(encoding="utf-8")
                parts = content.strip().split("---")
                if len(parts) >= 3 and len(parts[2].strip()) > 50:
                    logger.info(f"[Tutor] Note {note_path_rel} already exists and is generated. Skipping generation.")
                    return
            except Exception:
                pass

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
        
        pdf_context = None
        pdf_note_schema = None
        if session.get("metadata") and isinstance(session["metadata"], dict):
            pdf_notes = session["metadata"].get("atomic_notes", [])
            pdf_note_schema = next((n for n in pdf_notes if n.get("title") == note_title), None)
            if pdf_note_schema:
                pdf_context = pdf_note_schema.get("source_context")
        
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
            all_note_titles=all_note_titles,
            source_context=pdf_context
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
        
        if pdf_note_schema:
            post.metadata["course"] = session["metadata"].get("course")
            post.metadata["unit"] = str(session["metadata"].get("unit"))
            post.metadata["semester"] = session["metadata"].get("semester")
            post.metadata["mode"] = pdf_note_schema.get("mode")
            post.metadata["prerequisites"] = pdf_note_schema.get("prerequisites", [])
            post.metadata["source_pages"] = pdf_note_schema.get("source_pages", [])
            
        # Generate transfer task
        transfer_task = await self.generate_transfer_task(topic, note_title, final_body)
        post.metadata["transfer_task"] = transfer_task
        post.metadata["offline_ready"] = True

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
            content=final_body,
            force_regenerate=True
        )

    async def unlock_and_generate_note(self, session_id: str, note_path_rel: str):
        session = self.get_session(session_id)
        if not session:
            return
            
        await self.generate_note_files(session_id, note_path_rel)
        
        # Remove from generated ahead if present
        generated_ahead = session["generated_ahead_paths"]
        if note_path_rel in generated_ahead:
            generated_ahead.remove(note_path_rel)
            self.conn.execute(
                "UPDATE tutor_sessions SET generated_ahead_paths = ? WHERE session_id = ?",
                (json.dumps(generated_ahead), session_id)
            )
            self.conn.commit()
            
        info = self._find_note_chapter_info(self.vault_path / session["hub_path"], note_path_rel)
        if not info:
            return
        topic, order, chapter_title, note_title = info
        
        hub_path = self.vault_path / session["hub_path"]
        if hub_path.exists():
            hub_content = hub_path.read_text(encoding="utf-8")
            locked_pattern = f"[[{note_title}|🔒 {note_title.replace('_', ' ')}]]"
            active_pattern = f"[[{note_title}]]"
            if locked_pattern in hub_content:
                hub_content = hub_content.replace(locked_pattern, active_pattern)
                hub_path.write_text(hub_content, encoding="utf-8")

    async def generate_ahead_buffer(self, session_id: str, count: int = 3):
        session = self.get_session(session_id)
        if not session:
            return
            
        curriculum = session["curriculum"]
        completed = session["completed_notes"]
        active_unlocks = session["active_note_unlocks"]
        generated_ahead = session["generated_ahead_paths"]
        
        # Next locked notes
        next_locked = [n for n in curriculum if n not in active_unlocks and n not in completed]
        
        changed = False
        for note_path_rel in next_locked[:count]:
            if note_path_rel not in generated_ahead:
                try:
                    await self.generate_note_files(session_id, note_path_rel)
                    generated_ahead.append(note_path_rel)
                    changed = True
                except Exception as e:
                    logger.warning(f"[Tutor] Failed background generation for {note_path_rel}: {e}")
                    
        if changed:
            self.conn.execute(
                "UPDATE tutor_sessions SET generated_ahead_paths = ? WHERE session_id = ?",
                (json.dumps(generated_ahead), session_id)
            )
            self.conn.commit()

    async def generate_transfer_task(self, topic: str, note_title: str, content: str) -> Dict[str, Any]:
        if not (self.ai_service and getattr(self.ai_service, "llm", None)):
            return {
                "type": "scenario",
                "prompt": f"Apply the concept of {note_title} in a real-world scenario.",
                "domain": "ACADEMIC-GENERAL",
                "grading_criteria": "Student shows conceptual application."
            }
        try:
            from pydantic import BaseModel, Field
            from langchain_core.output_parsers import PydanticOutputParser
            
            class TransferTaskSchema(BaseModel):
                type: str = Field(description="One of code, debug, calculation, trace, writing, checklist, scenario.")
                prompt: str = Field(description="The question or task prompt. Must ask to apply the concept in a new scenario, not just define it. For physical/external skills, generate a socratic checklist or reflection.")
                domain: str = Field(description="The domain key representing this concept's field (e.g. CS-SOFTWARE, MATH-PURE, HIST-CATALYST, etc.)")
                grading_criteria: str = Field(description="Brief guidelines for grading the user's attempt.")
                
            parser = PydanticOutputParser(pydantic_object=TransferTaskSchema)
            
            sys_prompt = """You are Ater's master educational task architect. Your job is to create a high-quality transfer or application task that tests whether a student can APPLY a concept in a new scenario (depth of understanding, rather than rote recall).
Use the concept content and title to determine the domain and generate an appropriate task.
Return ONLY valid JSON matching the schema format. No formatting, no markdown wrappers, just the JSON."""
            
            user_prompt = f"Note Title: {note_title}\nTopic: {topic}\n\nNote Content Excerpt:\n{content[:4000]}\n\n{parser.get_format_instructions()}"
            
            response = await ainvoke_llm_with_retry(self.ai_service.llm, [
                ("system", sys_prompt),
                ("human", user_prompt)
            ], label="transfer-task")
            text = response.content.strip()
            if text.startswith("```"):
                lines = text.splitlines()
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    text = "\n".join(lines[1:-1]).strip()
            import json as _json
            return _json.loads(text)
        except Exception as e:
            logger.warning(f"[Tutor] Failed to generate transfer task: {e}")
            if self._strict_ai_enabled():
                self._raise_ai_error("Transfer task generation", e)
            return {
                "type": "scenario",
                "prompt": f"Apply the concept of {note_title} in a real-world scenario.",
                "domain": "ACADEMIC-GENERAL",
                "grading_criteria": "Student shows conceptual application."
            }

    async def submit_transfer_answer(self, session_id: str, note_path: str, user_answer: str) -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        note_file = self.vault_path / note_path
        if not note_file.exists():
            resolved = self._resolve_vault_path(note_path)
            note_file = resolved if resolved else note_file
            
        if not note_file.exists():
            raise ValueError(f"Note file {note_path} not found")
            
        import frontmatter
        post = frontmatter.loads(note_file.read_text(encoding="utf-8"))
        transfer_task = post.metadata.get("transfer_task")
        if not transfer_task:
            from src.domains.ater.vault_manager import VaultManager

            transfer_task = await self.generate_transfer_task(session["hub_path"], Path(note_path).stem, post.content)
            post.metadata["transfer_task"] = transfer_task
            post.metadata["offline_ready"] = True
            
            vm = self.ai_service.vm if self.ai_service else VaultManager(".")
            yaml_part = vm.dump_obsidian_yaml(post.metadata)
            body = post.content if post.content.startswith("\n") else f"\n{post.content}"
            note_file.write_text(f"---\n{yaml_part}---\n{body}", encoding="utf-8")
            
        is_correct = False
        feedback = ""
        remediation = ""
        
        task_type = str(transfer_task.get("type", "scenario")).lower()
        
        if task_type in ["checklist", "reflection"]:
            is_correct = True
            feedback = "Reflection checklist completed. Prerequisite met."
        else:
            if self.ai_service and getattr(self.ai_service, "llm", None):
                try:
                    sys_prompt = """You are Ater's academic evaluator. Grade the user's attempt at the transfer task.
Analyze whether the user demonstrates clear conceptual application according to the grading criteria.
Output JSON format:
{
  "is_correct": true/false,
  "feedback": "...",
  "remediation": "..."
}"""
                    user_prompt = f"""Note: {Path(note_path).stem}
Transfer Task Prompt: {transfer_task.get("prompt")}
Grading Criteria: {transfer_task.get("grading_criteria")}
User Answer: {user_answer}"""
                    
                    response = await ainvoke_llm_with_retry(self.ai_service.llm, [
                        ("system", sys_prompt),
                        ("human", user_prompt)
                    ], label="transfer-grading")
                    text = response.content.strip()
                    if text.startswith("```"):
                        lines = text.splitlines()
                        if lines[0].startswith("```json") or lines[0].startswith("```"):
                            text = "\n".join(lines[1:-1]).strip()
                    import json as _json
                    graded_json = _json.loads(text)
                    is_correct = bool(graded_json.get("is_correct"))
                    feedback = str(graded_json.get("feedback"))
                    remediation = str(graded_json.get("remediation", ""))
                except Exception as e:
                    logger.warning(f"[Tutor] Failed LLM transfer grading: {e}")
                    if self._strict_ai_enabled():
                        self._raise_ai_error("Transfer answer grading", e)
                    is_correct = True
                    feedback = "System grading failed, defaulting to pass."
            else:
                is_correct = True
                feedback = "Offline / AI service unavailable. Auto-pass."
                
        transfer_gate_outcomes = session["transfer_gate_outcomes"]
        transfer_gate_outcomes[note_path] = {
            "status": "passed" if is_correct else "failed",
            "feedback": feedback,
            "remediation": remediation,
            "answer": user_answer,
            "updated_at": datetime.now().isoformat()
        }
        
        if not is_correct:
            self.log_misconception(
                topic=session["hub_path"],
                note_title=Path(note_path).stem,
                misconception_text=f"Failed Transfer Gate: {feedback}. Remediation: {remediation}"
            )
            
        self.conn.execute(
            "UPDATE tutor_sessions SET transfer_gate_outcomes = ? WHERE session_id = ?",
            (json.dumps(transfer_gate_outcomes), session_id)
        )
        self.conn.commit()
        if session.get("source_job_id") and session.get("current_concept_node_id"):
            try:
                from src.domains.ater.source_service import SourceLearningJobService
                SourceLearningJobService(self.db_path).update_coverage_for_answer(
                    session["source_job_id"],
                    session["current_concept_node_id"],
                    correct=True,
                    transfer_passed=is_correct,
                    remediation_completed=not is_correct,
                )
            except Exception as e:
                logger.warning(f"[Tutor] Failed to update source transfer coverage: {e}")
        
        return {
            "is_correct": is_correct,
            "feedback": feedback,
            "remediation": remediation,
            "session": self.get_session(session_id)
        }

    def is_note_mastered(self, session: Dict[str, Any], note_path: str) -> Tuple[bool, bool, bool]:
        if not note_path:
            return True, True, True
            
        mastery = self.get_note_mastery_state(session, note_path)
        recall_passed = mastery["recall_passed"]
        transfer_passed = mastery["transfer_passed"]
        return (recall_passed and transfer_passed), recall_passed, transfer_passed

    def _source_chapter_for_note(self, session: Dict[str, Any], note_path: str) -> Optional[Dict[str, Any]]:
        source_job = session.get("source_job") or {}
        for chapter in source_job.get("chapters") or []:
            for note in chapter.get("atomic_notes") or []:
                if note.get("path") == note_path:
                    return chapter
        return None

    def _source_chapter_note_paths(self, chapter: Dict[str, Any]) -> List[str]:
        return [
            str(note.get("path"))
            for note in chapter.get("atomic_notes") or []
            if note.get("path")
        ]

    def advance_note(self, session_id: str) -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        curr_note = session["current_note_path"]
        curriculum = session["curriculum"]
        completed = session["completed_notes"]
        active_note_unlocks = session["active_note_unlocks"]
        
        # Enforce recall and transfer gates
        is_mastered, recall_passed, transfer_passed = self.is_note_mastered(session, curr_note)
        if not is_mastered:
            res = session.copy()
            res.update({
                "can_advance": False,
                "recall_passed": recall_passed,
                "transfer_passed": transfer_passed,
                "message": "Mastery gates (Recall and Transfer) must be cleared before advancing."
            })
            return res
        
        if curr_note and curr_note not in completed:
            completed.append(curr_note)
            
            # Create or update local FSRS card
            try:
                from src.domains.ater.srs import SRSEngine
                srs = SRSEngine(self.db_path)
                srs.review(curr_note, 3) # good
            except Exception as e:
                logger.warning(f"[Tutor] Failed to record FSRS card for {curr_note}: {e}")
            
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

        next_concept_node_id = session.get("current_concept_node_id")
        if session.get("source_job_id") and next_note:
            for item in session.get("roadmap") or []:
                if item.get("path") == next_note and item.get("id"):
                    next_concept_node_id = item["id"]
                    break
            
        if next_note:
            source_curr_chapter = self._source_chapter_for_note(session, curr_note) if session.get("source_job_id") else None
            source_next_chapter = self._source_chapter_for_note(session, next_note) if session.get("source_job_id") else None
            if source_curr_chapter or source_next_chapter:
                same_chapter = (
                    bool(source_curr_chapter)
                    and bool(source_next_chapter)
                    and source_curr_chapter.get("id") == source_next_chapter.get("id")
                )
            else:
                curr_chapter = Path(curr_note).parts[-2] if len(Path(curr_note).parts) >= 2 else ""
                next_chapter = Path(next_note).parts[-2] if len(Path(next_note).parts) >= 2 else ""
                same_chapter = curr_chapter == next_chapter
            
            if same_chapter:
                if next_note not in active_note_unlocks:
                    active_note_unlocks.append(next_note)
                    import asyncio
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            loop.create_task(self.unlock_and_generate_note(session_id, next_note))
                            loop.create_task(self.generate_ahead_buffer(session_id, 3))
                        else:
                            loop.run_until_complete(self.unlock_and_generate_note(session_id, next_note))
                            loop.run_until_complete(self.generate_ahead_buffer(session_id, 3))
                    except Exception:
                        try:
                            asyncio.run(self.unlock_and_generate_note(session_id, next_note))
                            asyncio.run(self.generate_ahead_buffer(session_id, 3))
                        except Exception as e:
                            print(f"[TutorSessionManager] Failed to unlock note: {e}")
            else:
                # Chapter boundary! Lock until consolidation quiz is passed.
                # Do not advance current_note_path to next_note yet.
                status = "consolidation_quiz"
                next_note = curr_note # Keep it at current note for now until quiz passes
                
        self.conn.execute("""
            UPDATE tutor_sessions
            SET current_note_path = ?, completed_notes = ?, active_note_unlocks = ?, status = ?, updated_at = ?, current_concept_node_id = ?
            WHERE session_id = ?
        """, (
            next_note,
            json.dumps(completed),
            json.dumps(active_note_unlocks),
            status,
            datetime.now().isoformat(),
            next_concept_node_id,
            session_id
        ))
        if session.get("source_job_id"):
            self.conn.execute(
                """
                UPDATE source_job_tutor_links
                SET current_concept_node_id = ?, current_note_path = ?, updated_at = ?
                WHERE job_id = ? AND tutor_session_id = ?
                """,
                (
                    next_concept_node_id,
                    next_note,
                    datetime.now().isoformat(),
                    session["source_job_id"],
                    session_id,
                ),
            )
        self.conn.commit()
        
        updated_session = self.get_session(session_id)
        res = updated_session.copy()
        res.update({
            "can_advance": True,
            "recall_passed": recall_passed,
            "transfer_passed": transfer_passed
        })
        return res

    def start_consolidation_quiz(self, session_id: str) -> Dict[str, Any]:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        curr_note = session["current_note_path"]
        source_chapter = self._source_chapter_for_note(session, curr_note) if session.get("source_job_id") else None
        if source_chapter:
            target_chapter_title = str(source_chapter.get("title") or "Chapter")
            chapter_notes = self._source_chapter_note_paths(source_chapter)
        else:
            hub_path = self.vault_path / session["hub_path"]
            if not hub_path.exists():
                raise ValueError("Hub file not found")

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
                response = await ainvoke_llm_with_retry(
                    self.ai_service.llm,
                    messages,
                    label="mistake-diagnosis",
                    timeout=15,
                )
                parsed = parser.parse(response.content)
                return {
                    "is_misconception": parsed.is_misconception,
                    "misconception_text": parsed.misconception_text,
                    "hint": parsed.hint
                }
            except Exception as e:
                if self._strict_ai_enabled():
                    self._raise_ai_error("Mistake diagnosis", e)
                
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
