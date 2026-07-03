import hashlib
import json
import re
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from src.domains.ater import learning_object as lo
from src.domains.ater.planner import AterPlanner, ROADMAP_BLUEPRINTS
from src.domains.ater.source_service import (
    SourceConceptGraphService,
    SourceLearningJobService,
    build_source_map_sections,
    build_teaching_profile,
    classify_concept_modality,
    extract_source_objectives,
    scope_concept_graph_ids,
)
from src.domains.ater.router import router as domain_router


TEACHER_INTENT_RE = re.compile(
    r"\b(teach|learn|study|master|practice|lesson|roadmap|curriculum|exam prep|prepare me)\b",
    re.IGNORECASE,
)
QUICK_EXPLANATION_RE = re.compile(r"^\s*(what is|what are|define|explain what|why does|how does)\b", re.IGNORECASE)


def classify_prompt_learning_intent(prompt: str) -> Dict[str, Any]:
    text = str(prompt or "").strip()
    lower = text.lower()
    if not text:
        return {"intent": "not_learning", "reason": "empty_prompt"}
    if QUICK_EXPLANATION_RE.search(text) and not TEACHER_INTENT_RE.search(text):
        return {"intent": "quick_explanation", "reason": "one_off_explanation"}
    if TEACHER_INTENT_RE.search(text):
        return {"intent": "teacher_job", "reason": "learning_intent"}
    return {"intent": "not_learning", "reason": "no_learning_verb"}


def _topic_from_prompt(prompt: str) -> str:
    topic = AterPlanner._extract_topic_from_prompt(prompt)
    topic = re.sub(r"\b(for|by)\b.*$", "", topic, flags=re.IGNORECASE).strip()
    if not topic or topic.lower() in {"it", "this", "that", "something", "anything"}:
        return "Learning Path"
    return topic


def _infer_domain(topic: str, prompt: str) -> str:
    text = f"{topic} {prompt}".lower()
    if any(token in text for token in ["consumer behavior", "utility", "budget line", "indifference", "microeconomics"]):
        return "ECON-MICRO"
    if any(token in text for token in ["cellular respiration", "biology", "mitochondria", "glycolysis"]):
        return "BIOLOGY"
    if any(token in text for token in ["python", "javascript", "algorithm", "software", "programming"]):
        return "CS-SOFTWARE"
    routed = domain_router.route(text, course=topic)
    return routed if routed != "DOMAIN-UNKNOWN" else "ACADEMIC-GENERAL"


def _diagnostic_intake(prompt: str, topic: str) -> Tuple[Dict[str, Any], List[str], Optional[str]]:
    lower = prompt.lower()
    too_ambiguous = topic == "Learning Path" or re.fullmatch(r"\s*(teach|learn|study|master|practice)\s+(it|this|that|something|anything)?\s*", lower or "")
    if too_ambiguous:
        return (
            {
                "goal": "learn",
                "level": "unknown",
                "depth": "unknown",
                "timeframe": "",
                "target": "",
                "prerequisites": [],
                "rigor": "standard",
                "constraints": [],
            },
            [],
            "What topic should Ater teach, and what outcome are you aiming for?",
        )

    target = "exam" if any(token in lower for token in ["exam", "test", "quiz", "midterm", "final"]) else "general mastery"
    timeframe_match = re.search(r"\b(by|before|in|within)\s+([a-z0-9 ,/-]+)", prompt, flags=re.IGNORECASE)
    timeframe = timeframe_match.group(2).strip(" .") if timeframe_match else ""
    if not timeframe:
        next_match = re.search(r"\b(next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month))\b", prompt, flags=re.IGNORECASE)
        timeframe = next_match.group(1).strip(" .") if next_match else ""
    level = "beginner/intermediate"
    if "advanced" in lower:
        level = "advanced"
    elif "beginner" in lower or "from scratch" in lower:
        level = "beginner"
    depth = "exam-focused" if target == "exam" else "structured overview"
    assumptions = [
        f"Assuming {level} starting level because no precise learner state was provided.",
        "Using a compact staged curriculum that can expand after tutor performance data.",
    ]
    if target == "exam":
        assumptions.append("Prioritizing high-yield concepts, practice, and transfer gates for assessment readiness.")
    return (
        {
            "goal": "learn and practice",
            "level": level,
            "depth": depth,
            "timeframe": timeframe,
            "target": target,
            "prerequisites": [],
            "rigor": "standard",
            "constraints": ["offline-first", "no live web dependency"],
        },
        assumptions,
        None,
    )


class PromptTeacherJobService:
    def __init__(self, db_path: Path, vault_path: Optional[Path] = None):
        self.db_path = Path(db_path)
        self.vault_path = Path(vault_path) if vault_path else None
        self.source_service = SourceLearningJobService(self.db_path)
        self._init_schema()

    def _connect(self):
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self):
        conn = self._connect()
        try:
            with conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS prompt_teacher_jobs (
                        job_id TEXT PRIMARY KEY,
                        prompt TEXT NOT NULL,
                        normalized_prompt TEXT NOT NULL,
                        diagnostic_intake TEXT DEFAULT '{}',
                        assumptions TEXT DEFAULT '[]',
                        clarification_question TEXT,
                        synthetic_source_pack TEXT DEFAULT '{}',
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                """)
        finally:
            conn.close()

    def _identity(self, prompt: str) -> Tuple[str, str]:
        normalized = re.sub(r"\s+", " ", prompt.strip().lower())
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        return f"prompt:{digest}", normalized

    def _local_matches(self, topic: str, limit: int = 5) -> List[Dict[str, Any]]:
        matches: List[Dict[str, Any]] = []
        topic_terms = [term for term in re.split(r"\W+", topic.lower()) if len(term) > 3]
        conn = self._connect()
        try:
            for row in conn.execute(
                "SELECT job_id, title, topic, source_type FROM source_learning_jobs WHERE source_type != 'synthetic_source_pack' ORDER BY updated_at DESC"
            ).fetchall():
                haystack = f"{row['title'] or ''} {row['topic'] or ''}".lower()
                score = sum(1 for term in topic_terms if term in haystack)
                if score:
                    matches.append({
                        "type": "prior_source_job",
                        "job_id": row["job_id"],
                        "title": row["topic"] or row["title"] or row["job_id"],
                        "source_type": row["source_type"],
                        "confidence": min(0.96, 0.65 + score * 0.15),
                        "snippet": f"Existing source learning job for {row['topic'] or row['title']}.",
                    })
        finally:
            conn.close()
        if len(matches) >= limit:
            return matches[:limit]
        if not self.vault_path or not self.vault_path.exists():
            return matches
        for path in self.vault_path.rglob("*.md"):
            rel = path.relative_to(self.vault_path).as_posix()
            if rel.startswith("Inbox/"):
                continue
            try:
                content = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            haystack = f"{path.stem} {content[:2000]}".lower()
            score = sum(1 for term in topic_terms if term in haystack)
            if score:
                matches.append({
                    "type": "local_vault_note",
                    "path": rel,
                    "title": path.stem.replace("_", " "),
                    "confidence": min(0.95, 0.55 + score * 0.15),
                    "snippet": re.sub(r"\s+", " ", content).strip()[:500],
                })
            if len(matches) >= limit:
                break
        return matches

    def _generic_pages(self, topic: str, assumptions: List[str], local_matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        local = " ".join(match.get("snippet", "") for match in local_matches)
        pages = []
        for idx, (chapter_template, note_templates) in enumerate(ROADMAP_BLUEPRINTS[:5], start=1):
            title = chapter_template.format(topic=topic)
            notes = ", ".join(note.format(topic=topic) for note in note_templates)
            pages.append({
                "page_number": idx,
                "content": f"{title}. Scope: {notes}. {local if idx == 1 else ''}",
                "text_length": 0,
            })
        return pages

    def _build_synthetic_pack(self, prompt: str, topic: str, intake: Dict[str, Any], assumptions: List[str], domain: str) -> Dict[str, Any]:
        local_matches = self._local_matches(topic)
        pages = self._generic_pages(topic, assumptions, local_matches)
        for page in pages:
            page["text_length"] = len(page["content"])
        confidence = 0.72 if local_matches else 0.48
        provenance = local_matches + [{
            "type": "deterministic_synthetic_pack",
            "title": f"{topic} starter pack",
            "confidence": confidence,
            "prompt": prompt,
        }]
        warnings = [{
            "concept": topic,
            "dimension": "definition",
            "severity": "medium" if local_matches else "high",
            "description": "Prompt-first learning is grounded in an auditable synthetic source pack; verify against external sources for high-stakes use.",
        }]
        if confidence < 0.6:
            warnings.append({
                "concept": topic,
                "dimension": "mechanism",
                "severity": "medium",
                "description": "No strong matching local vault evidence was found; model-free deterministic fallback material is marked as lower confidence.",
            })
        return {
            "topic": topic,
            "scope": intake,
            "assumptions": assumptions,
            "outline": [{"title": re.split(r"[.:\n]", page["content"], maxsplit=1)[0], "page": page["page_number"]} for page in pages],
            "snippets": [{"page": page["page_number"], "text": page["content"][:800]} for page in pages],
            "pages": pages,
            "provenance": provenance,
            "confidence": confidence,
            "warnings": warnings,
        }

    def _fallback_nodes(self, topic: str, pages: List[Dict[str, Any]], domain: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        nodes = []
        for idx, page in enumerate(pages[:6], start=1):
            title = re.split(r"[.:\n]", page["content"], maxsplit=1)[0].strip() or f"{topic} Concept {idx}"
            modality = classify_concept_modality(title, page["content"], domain)
            nodes.append({
                "id": f"concept_{idx}",
                "title": title[:80],
                "domain": domain,
                "modality": modality,
                "source_pages": [page["page_number"]],
                "source_excerpts": [{"page": page["page_number"], "text": page["content"][:800]}],
                "objective_ids": [f"obj_{idx}"],
                "teaching_order": idx,
                "warnings": ["synthetic-source"],
            })
        edges = [{"from": nodes[i]["id"], "to": nodes[i + 1]["id"], "type": "prerequisite"} for i in range(len(nodes) - 1)]
        return nodes, edges

    def _status_with_prompt(self, job_id: str) -> Dict[str, Any]:
        job = self.source_service.get_job(job_id)
        conn = self._connect()
        try:
            row = conn.execute("SELECT * FROM prompt_teacher_jobs WHERE job_id = ?", (job_id,)).fetchone()
            if row:
                job["prompt_teacher"] = {
                    "prompt": row["prompt"],
                    "diagnostic_intake": json.loads(row["diagnostic_intake"] or "{}"),
                    "assumptions": json.loads(row["assumptions"] or "[]"),
                    "clarification_question": row["clarification_question"],
                    "synthetic_source_pack": json.loads(row["synthetic_source_pack"] or "{}"),
                }
                job["prompt_job_id"] = job_id
                if row["clarification_question"]:
                    job["next_action"] = "answer_clarification"
            return job
        finally:
            conn.close()

    def create_or_resume(self, prompt: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        identity, normalized = self._identity(prompt)
        conn = self._connect()
        try:
            existing = conn.execute("SELECT job_id FROM source_learning_jobs WHERE source_identity = ?", (identity,)).fetchone()
            if existing:
                job_id = existing["job_id"]
                now = datetime.now().isoformat()
                with conn:
                    conn.execute("UPDATE source_learning_jobs SET conversation_id = COALESCE(?, conversation_id), updated_at = ? WHERE job_id = ?", (conversation_id, now, job_id))
                    conn.execute("UPDATE prompt_teacher_jobs SET updated_at = ? WHERE job_id = ?", (now, job_id))
                return self._status_with_prompt(job_id)

            topic = _topic_from_prompt(prompt)
            intake, assumptions, clarification = _diagnostic_intake(prompt, topic)
            domain = _infer_domain(topic, prompt)
            now = datetime.now().isoformat()
            job_id = f"promptjob_{uuid.uuid4().hex[:16]}"
            pack = {} if clarification else self._build_synthetic_pack(prompt, topic, intake, assumptions, domain)
            pages = pack.get("pages", [])
            objectives = extract_source_objectives(pages)
            if not objectives and pages:
                objectives = [{"id": f"obj_{idx}", "text": item["title"], "page_number": item["page"], "required": True} for idx, item in enumerate(pack.get("outline", []), start=1)]
            sections = build_source_map_sections(f"{lo.normalize_title(topic)}_Synthetic_Source.md", pages, id_prefix=job_id)
            nodes: List[Dict[str, Any]] = []
            edges: List[Dict[str, Any]] = []
            graph_warnings: List[Dict[str, Any]] = []
            if pages:
                nodes, edges, graph_warnings = SourceConceptGraphService().build_from_pages(topic, objectives, pages, domain)
                if not nodes:
                    nodes, edges = self._fallback_nodes(topic, pages, domain)
                nodes, edges = scope_concept_graph_ids(job_id, nodes, edges)
            warnings = list(pack.get("warnings", [])) + graph_warnings
            status = "awaiting_clarification" if clarification else "roadmap_ready"
            with conn:
                conn.execute("""
                    INSERT INTO source_learning_jobs (job_id, source_identity, file_path, file_name, file_size, content_hash, title, topic, domain, source_type, page_count, status, conversation_id, attachment_id, created_at, updated_at, metadata)
                    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 'synthetic_source_pack', ?, ?, ?, NULL, ?, ?, ?)
                """, (
                    job_id, identity, f"synthetic://{job_id}", f"{lo.normalize_title(topic)}_Synthetic_Source.md",
                    hashlib.sha256(json.dumps(pack, sort_keys=True).encode("utf-8")).hexdigest(),
                    topic, topic, domain, len(pages), status, conversation_id, now, now,
                    json.dumps({"next_action": "answer_clarification" if clarification else "start_learning", "prompt_teacher": True}),
                ))
                conn.execute("""
                    INSERT INTO prompt_teacher_jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (job_id, prompt, normalized, json.dumps(intake), json.dumps(assumptions), clarification, json.dumps(pack), now, now))
                for page in pages:
                    conn.execute("INSERT OR REPLACE INTO source_pages VALUES (?, ?, ?, ?)", (job_id, page["page_number"], page["content"], page["text_length"]))
                for warning in warnings:
                    conn.execute("INSERT INTO source_audit_warnings VALUES (?, ?, ?, ?, ?, ?, 0)", (f"warn_{uuid.uuid4().hex}", job_id, warning["concept"], warning["dimension"], warning["severity"], warning["description"]))
                for section in sections:
                    conn.execute("INSERT INTO source_map_sections VALUES (?, ?, ?, ?, ?, ?)", (section["id"], job_id, section["title"], section["source_file"], json.dumps(section["pages"]), json.dumps(section["citations"])))
                for obj in objectives:
                    mapped = any(obj["id"] in node.get("objective_ids", []) for node in nodes)
                    conn.execute("INSERT INTO source_objectives VALUES (?, ?, ?, ?, ?, ?, ?)", (f"{job_id}_{obj['id']}", job_id, obj["id"], obj["text"], obj["page_number"], 1, 1 if mapped else 0))
                    conn.execute("INSERT INTO coverage_matrix_rows (id, job_id, row_type, objective_id, source_extracted, objective_mapped, mastery_state, updated_at) VALUES (?, ?, 'objective', ?, 1, ?, 'not_started', ?)", (f"cov_{job_id}_{obj['id']}", job_id, obj["id"], 1 if mapped else 0, now))
                for node in nodes:
                    conn.execute("INSERT INTO concept_graph_nodes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (node["id"], job_id, node["title"], node["domain"], node["modality"], json.dumps(node["source_pages"]), json.dumps(node["source_excerpts"]), json.dumps(node["objective_ids"]), node["teaching_order"], json.dumps(node["warnings"])))
                    profile = build_teaching_profile(node["domain"], node["modality"], " ".join(ex.get("text", "") for ex in node.get("source_excerpts", [])))
                    conn.execute("INSERT INTO teaching_profiles VALUES (?, ?, ?, ?)", (f"profile_{job_id}_{node['id']}", job_id, node["id"], json.dumps(profile)))
                    conn.execute("INSERT INTO coverage_matrix_rows (id, job_id, row_type, concept_node_id, source_extracted, objective_mapped, mastery_state, warnings, updated_at) VALUES (?, ?, 'concept', ?, 1, ?, 'not_started', ?, ?)", (f"cov_{job_id}_{node['id']}", job_id, node["id"], 1 if node.get("objective_ids") else 0, json.dumps(["synthetic_source_pack"]), now))
                for edge in edges:
                    conn.execute("INSERT INTO concept_graph_edges VALUES (?, ?, ?, ?, ?)", (f"edge_{job_id}_{edge['from']}_{edge['to']}", job_id, edge["from"], edge["to"], edge["type"]))
            return self._status_with_prompt(job_id)
        finally:
            conn.close()

    def get_job(self, job_id: str) -> Dict[str, Any]:
        return self._status_with_prompt(job_id)

    def start_learning(self, job_id: str) -> Dict[str, Any]:
        started = self.source_service.start_learning(job_id)
        started["source_job"] = self._status_with_prompt(job_id)
        started["prompt_job"] = started["source_job"].get("prompt_teacher")
        return started

    def update_coverage_for_answer(self, job_id: str, concept_node_id: str, correct: bool, transfer_passed: bool = False, remediation_completed: bool = False):
        return self.source_service.update_coverage_for_answer(job_id, concept_node_id, correct, transfer_passed, remediation_completed)

    def deploy_to_vault(self, job_id: str, vault_path: str) -> Dict[str, Any]:
        return self.source_service.deploy_to_vault(job_id, vault_path)
