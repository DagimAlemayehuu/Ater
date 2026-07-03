import sqlite3
import json
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from .learning_object import lookup_existing_hub

class LearnerTopicProfile(BaseModel):
    topic: str
    notes_completed_fraction: float  # notes_completed / notes_total
    accuracy_rate: float
    calibration_status: str  # "overconfident", "underconfident", "calibrated"
    common_misconceptions: List[str]

class LessonRecommendation(BaseModel):
    note_path: str
    title: str
    recommendation_score: float
    reason: str  # e.g., "Low FSRS retrievability" or "Unresolved misconception"

class LearnerModelManager:
    def __init__(self, db_path: Path, vault_path: Path):
        self.db_path = Path(db_path)
        self.vault_path = Path(vault_path)
        self._init_conn()

    def __del__(self):
        try:
            if hasattr(self, 'conn') and self.conn:
                self.conn.close()
        except Exception:
            pass

    def _init_conn(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_tables()

    def _init_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS learner_profile_stats (
                topic TEXT PRIMARY KEY,
                notes_total INTEGER DEFAULT 0,
                notes_completed INTEGER DEFAULT 0,
                accuracy_rate REAL DEFAULT 1.0,
                avg_retrievability REAL DEFAULT 1.0,
                overconfidence_count INTEGER DEFAULT 0,
                calibration_index REAL DEFAULT 0.0,
                last_studied_at TEXT
            )
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS learner_source_objective_stats (
                source_job_id TEXT,
                objective_id TEXT,
                failures INTEGER DEFAULT 0,
                transfer_failures INTEGER DEFAULT 0,
                recurring_misconceptions TEXT DEFAULT '[]',
                updated_at TEXT,
                PRIMARY KEY (source_job_id, objective_id)
            )
        """)
        self.conn.commit()

    def summarize_source_mastery(self, source_job_id: str) -> Dict[str, Any]:
        rows = self.conn.execute(
            "SELECT * FROM coverage_matrix_rows WHERE job_id = ?",
            (source_job_id,),
        ).fetchall()
        total = len(rows)
        mastered = sum(1 for row in rows if row["mastery_state"] == "mastered")
        transfer_weak = [
            dict(row) for row in rows
            if row["row_type"] == "concept" and row["recall_passed"] and not row["transfer_passed"]
        ]
        weak_objectives = [
            dict(row) for row in rows
            if row["row_type"] == "objective" and not row["objective_mapped"]
        ]
        return {
            "source_job_id": source_job_id,
            "completion_fraction": mastered / total if total else 0.0,
            "mastered_rows": mastered,
            "total_rows": total,
            "transfer_weaknesses": transfer_weak,
            "weak_objectives": weak_objectives,
        }

    def record_source_transfer_failure(self, source_job_id: str, objective_id: str) -> Dict[str, Any]:
        now = datetime.now().isoformat()
        self.conn.execute("""
            INSERT INTO learner_source_objective_stats
            (source_job_id, objective_id, failures, transfer_failures, recurring_misconceptions, updated_at)
            VALUES (?, ?, 0, 1, '[]', ?)
            ON CONFLICT(source_job_id, objective_id) DO UPDATE SET
                transfer_failures = transfer_failures + 1,
                updated_at = excluded.updated_at
        """, (source_job_id, objective_id, now))
        self.conn.commit()
        row = self.conn.execute(
            "SELECT * FROM learner_source_objective_stats WHERE source_job_id = ? AND objective_id = ?",
            (source_job_id, objective_id),
        ).fetchone()
        return dict(row)

    def recommend_source_next_actions(self, source_job_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        coverage_rows = [dict(row) for row in self.conn.execute(
            "SELECT * FROM coverage_matrix_rows WHERE job_id = ?",
            (source_job_id,),
        ).fetchall()]
        graph_rows = [dict(row) for row in self.conn.execute(
            "SELECT id, title, objective_ids, teaching_order FROM concept_graph_nodes WHERE job_id = ? ORDER BY teaching_order",
            (source_job_id,),
        ).fetchall()]
        stats_rows = {
            row["objective_id"]: dict(row)
            for row in self.conn.execute(
                "SELECT * FROM learner_source_objective_stats WHERE source_job_id = ?",
                (source_job_id,),
            ).fetchall()
        }
        concept_cov = {row.get("concept_node_id"): row for row in coverage_rows if row.get("row_type") == "concept"}
        objective_cov = {row.get("objective_id"): row for row in coverage_rows if row.get("row_type") == "objective"}
        recommendations: List[Dict[str, Any]] = []

        for node in graph_rows:
            node_id = node["id"]
            cov = concept_cov.get(node_id, {})
            objective_ids = json.loads(node.get("objective_ids") or "[]")
            title = node.get("title", node_id)
            if not cov.get("source_extracted"):
                recommendations.append({"type": "review_source", "concept_node_id": node_id, "title": title, "reason": "Source evidence is missing", "priority": 100})
                continue
            if cov.get("recall_passed") and not cov.get("transfer_passed"):
                recommendations.append({"type": "application_practice", "concept_node_id": node_id, "title": title, "reason": "Recall passed but transfer is still weak", "priority": 110})
            if cov.get("remediation_required") and not cov.get("remediation_completed"):
                recommendations.append({"type": "remediate", "concept_node_id": node_id, "title": title, "reason": "Failed answer needs remediation", "priority": 115})
            for objective_id in objective_ids:
                stats = stats_rows.get(objective_id)
                if stats and (stats.get("failures", 0) >= 2 or stats.get("transfer_failures", 0) >= 1):
                    recommendations.append({"type": "objective_remediation", "objective_id": objective_id, "title": title, "reason": "Recurring source objective weakness", "priority": 120})
            if not cov.get("taught"):
                recommendations.append({"type": "learn_prerequisite", "concept_node_id": node_id, "title": title, "reason": "Uncovered prerequisite concept", "priority": 90 - int(node.get("teaching_order") or 0)})
                continue

        for objective_id, cov in objective_cov.items():
            if not cov.get("objective_mapped"):
                recommendations.append({"type": "map_objective", "objective_id": objective_id, "title": objective_id, "reason": "Required source objective is unmapped", "priority": 100})

        recommendations.sort(key=lambda item: item["priority"], reverse=True)
        return recommendations[:limit]

    def record_source_misconception(self, source_job_id: str, objective_id: str, text: str) -> Dict[str, Any]:
        now = datetime.now().isoformat()
        row = self.conn.execute(
            "SELECT * FROM learner_source_objective_stats WHERE source_job_id = ? AND objective_id = ?",
            (source_job_id, objective_id),
        ).fetchone()
        existing = json.loads(row["recurring_misconceptions"] or "[]") if row else []
        normalized = re.sub(r"\s+", " ", text.strip().lower())
        if normalized and normalized not in existing:
            existing.append(normalized)
        failures = (row["failures"] if row else 0) + 1
        self.conn.execute("""
            INSERT OR REPLACE INTO learner_source_objective_stats
            (source_job_id, objective_id, failures, transfer_failures, recurring_misconceptions, updated_at)
            VALUES (?, ?, ?, COALESCE((SELECT transfer_failures FROM learner_source_objective_stats WHERE source_job_id = ? AND objective_id = ?), 0), ?, ?)
        """, (source_job_id, objective_id, failures, source_job_id, objective_id, json.dumps(existing), now))
        self.conn.commit()
        return {"source_job_id": source_job_id, "objective_id": objective_id, "failures": failures, "recurring_misconceptions": existing}

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
        
        frontmatter_data = {}
        yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL | re.MULTILINE)
        if yaml_match:
            try:
                import yaml
                frontmatter_data = yaml.safe_load(yaml_match.group(1)) or {}
            except Exception:
                pass
                
        chapters_list = frontmatter_data.get("chapters", [])
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

    def _get_note_prerequisites(self, note_path_str: str) -> List[str]:
        full_path = self.vault_path / note_path_str
        if not full_path.exists():
            return []
        try:
            content = full_path.read_text(encoding="utf-8")
            yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL | re.MULTILINE)
            if yaml_match:
                import yaml
                fm = yaml.safe_load(yaml_match.group(1)) or {}
                prereqs = fm.get("prerequisites", [])
                cleaned = []
                for p in prereqs:
                    m = re.search(r"\[\[([^\]]+)\]\]", str(p))
                    cleaned.append(m.group(1) if m else str(p))
                return cleaned
        except Exception:
            pass
        return []

    def _is_note_completed(self, note_path_str: str) -> bool:
        row = self.conn.execute(
            "SELECT reps FROM srs_cards WHERE note_path = ?", (note_path_str,)
        ).fetchone()
        return bool(row and row["reps"] > 0)

    def calculate_retrievability(self, last_review_str: Optional[str], stability: float) -> float:
        if not last_review_str or stability <= 0:
            return 1.0
        try:
            last_review = datetime.fromisoformat(last_review_str.replace('Z', '+00:00'))
            if last_review.tzinfo is not None:
                last_review = last_review.replace(tzinfo=None)
            t = (datetime.now() - last_review).total_seconds() / 86400.0
            t = max(0.0, t)
            return (1 + t / (9 * stability)) ** -1
        except Exception:
            return 1.0

    def update_profile(self, topic: str) -> Optional[LearnerTopicProfile]:
        hub_data = lookup_existing_hub(str(self.vault_path), topic)
        if not hub_data:
            return None

        hub_rel_path = hub_data["path"]
        curriculum = self._get_curriculum(self.vault_path / hub_rel_path)
        notes_total = len(curriculum)
        
        # 1. Notes completed count & avg retrievability
        notes_completed = 0
        retrievabilities = []
        last_studied = None

        for note_path in curriculum:
            row = self.conn.execute(
                "SELECT reps, stability, last_review FROM srs_cards WHERE note_path = ?",
                (note_path,)
            ).fetchone()
            if row:
                if row["reps"] > 0:
                    notes_completed += 1
                r = self.calculate_retrievability(row["last_review"], row["stability"])
                retrievabilities.append(r)
                if row["last_review"]:
                    try:
                        lr = datetime.fromisoformat(row["last_review"].replace('Z', '+00:00'))
                        if lr.tzinfo is not None:
                            lr = lr.replace(tzinfo=None)
                        if last_studied is None or lr > last_studied:
                            last_studied = lr
                    except Exception:
                        pass
            else:
                retrievabilities.append(1.0)

        avg_retrievability = sum(retrievabilities) / len(retrievabilities) if retrievabilities else 1.0

        # 2. Calibration index, accuracy and overconfidence
        # Query all tutor sessions for this hub
        sessions = self.conn.execute(
            "SELECT wagers FROM tutor_sessions WHERE hub_path = ?",
            (hub_rel_path,)
        ).fetchall()

        total_answers = 0
        correct_answers = 0
        overconfidence_count = 0
        calibration_sum = 0.0

        for s_row in sessions:
            try:
                wagers_dict = json.loads(s_row["wagers"])
                for q_id, item in wagers_dict.items():
                    if isinstance(item, dict):
                        wager_level = item.get("wager", "low")
                        is_correct = item.get("correct", True)
                    else:
                        wager_level = str(item)
                        is_correct = True  # Backward compatibility fallback
                    
                    total_answers += 1
                    if is_correct:
                        correct_answers += 1
                    
                    w_i = 1.0 if wager_level.lower() == "high" else 0.2
                    c_i = 1.0 if is_correct else 0.0
                    calibration_sum += (w_i - c_i)

                    if wager_level.lower() == "high" and not is_correct:
                        overconfidence_count += 1
            except Exception:
                pass

        accuracy_rate = (correct_answers / total_answers) if total_answers > 0 else 1.0
        calibration_index = (calibration_sum / total_answers) if total_answers > 0 else 0.0

        if calibration_index > 0.2:
            calibration_status = "overconfident"
        elif calibration_index < -0.2:
            calibration_status = "underconfident"
        else:
            calibration_status = "calibrated"

        last_studied_str = last_studied.isoformat() if last_studied else datetime.now().isoformat()

        # Update table
        self.conn.execute("""
            INSERT OR REPLACE INTO learner_profile_stats
            (topic, notes_total, notes_completed, accuracy_rate, avg_retrievability, overconfidence_count, calibration_index, last_studied_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            topic, notes_total, notes_completed, accuracy_rate, avg_retrievability, overconfidence_count, calibration_index, last_studied_str
        ))
        self.conn.commit()

        # 3. Misconceptions
        misc_rows = self.conn.execute(
            "SELECT DISTINCT misconception_text FROM user_misconceptions WHERE topic = ? OR topic = ?",
            (topic, hub_rel_path)
        ).fetchall()
        common_misconceptions = [r["misconception_text"] for r in misc_rows]

        fraction = (notes_completed / notes_total) if notes_total > 0 else 0.0

        return LearnerTopicProfile(
            topic=topic,
            notes_completed_fraction=fraction,
            accuracy_rate=accuracy_rate,
            calibration_status=calibration_status,
            common_misconceptions=common_misconceptions
        )

    def recommend_next_lessons(self, topic: str, limit: int = 5) -> List[LessonRecommendation]:
        hub_data = lookup_existing_hub(str(self.vault_path), topic)
        if not hub_data:
            return []

        hub_rel_path = hub_data["path"]
        curriculum = self._get_curriculum(self.vault_path / hub_rel_path)

        eligible_notes = []
        for note_path in curriculum:
            # Check if card is unstudied (reps == 0) or due (due <= now)
            card_row = self.conn.execute(
                "SELECT reps, due, stability, last_review FROM srs_cards WHERE note_path = ?",
                (note_path,)
            ).fetchone()

            is_eligible = False
            reps = 0
            stability = 1.0
            last_review = None
            
            if not card_row:
                is_eligible = True
            else:
                reps = card_row["reps"]
                stability = card_row["stability"]
                last_review = card_row["last_review"]
                if reps == 0:
                    is_eligible = True
                else:
                    due_str = card_row["due"]
                    if due_str:
                        try:
                            due_dt = datetime.fromisoformat(due_str.replace('Z', '+00:00'))
                            if due_dt.tzinfo is not None:
                                due_dt = due_dt.replace(tzinfo=None)
                            if due_dt <= datetime.now():
                                is_eligible = True
                        except Exception:
                            is_eligible = True
                    else:
                        is_eligible = True

            if is_eligible:
                eligible_notes.append({
                    "note_path": note_path,
                    "reps": reps,
                    "stability": stability,
                    "last_review": last_review
                })

        if not eligible_notes:
            return []

        # Calculate components for scoring
        recommendations = []
        all_blocked = True

        for item in eligible_notes:
            note_path = item["note_path"]
            
            # Retrievability R
            R = self.calculate_retrievability(item["last_review"], item["stability"])
            
            # Weakness Score Sw (count of misconceptions)
            note_stem = Path(note_path).stem
            sw_row = self.conn.execute(
                "SELECT COUNT(*) as cnt FROM user_misconceptions WHERE note_title = ?",
                (note_stem,)
            ).fetchone()
            Sw = sw_row["cnt"] if sw_row else 0

            # Prerequisite Penalty P
            prereqs = self._get_note_prerequisites(note_path)
            P = 0
            for pr in prereqs:
                pr_path = self._resolve_vault_path(pr)
                if pr_path:
                    pr_rel_path = pr_path.relative_to(self.vault_path).as_posix()
                    if not self._is_note_completed(pr_rel_path):
                        P = 1
                        break
                else:
                    # Prerequisite exists but not found or not created yet
                    P = 1
                    break

            if P == 0:
                all_blocked = False

            recommendations.append({
                "note_path": note_path,
                "title": note_stem.replace("_", " "),
                "R": R,
                "Sw": Sw,
                "P": P
            })

        # Apply score heuristic
        final_list = []
        for rec in recommendations:
            penalty = 0.0 if all_blocked else float(rec["P"])
            score = 50.0 * (1.0 - rec["R"]) + 10.0 * float(rec["Sw"]) - 100.0 * penalty
            
            # Determine reason
            if rec["P"] == 1 and not all_blocked:
                reason = "Prerequisites not met"
            elif rec["Sw"] > 0:
                reason = "Unresolved misconception"
            elif rec["R"] < 0.9:
                reason = "Low memory retrievability"
            else:
                reason = "Next topic in curriculum sequence"

            final_list.append(LessonRecommendation(
                note_path=rec["note_path"],
                title=rec["title"],
                recommendation_score=score,
                reason=reason
            ))

        # Sort descending by recommendation_score
        final_list.sort(key=lambda x: x.recommendation_score, reverse=True)
        return final_list[:limit]
