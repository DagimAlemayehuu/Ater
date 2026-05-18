"""
Reference Vault — Multi-Agent Pipeline (LLM-efficient design)
=============================================================
Pipeline:
  1. ExtractorAgent   — Parses source text into raw question objects (small chunks, one pass each)
  2. ClassifierAgent  — Tags each question with type + difficulty (single batched pass)
  3. SolverAgent      — Solves each question with explanation (batched, type-aware)
  4. VaultWriter      — Serialises everything to a structured .md file in the vault

Design goals for weak LLMs:
  - Each agent has ONE job, small context window per call
  - Classifier batches up to 20 items per call (just a JSON map)
  - Solver sends ONE question at a time with a compact prompt
  - JSON parsing is aggressive with multiple fallbacks
"""

import re
import json
import asyncio
import hashlib
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

logger = logging.getLogger("Ater")

# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_json_safe(text: str) -> Any:
    """Aggressive JSON extraction with multiple fallbacks."""
    text = text.strip()
    # Strip markdown fences
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    # Extract first JSON structure
    for start, end in [('{', '}'), ('[', ']')]:
        si = text.find(start)
        ei = text.rfind(end)
        if si != -1 and ei != -1 and ei > si:
            candidate = text[si:ei+1]
            candidate = re.sub(r',\s*([\]\}])', r'\1', candidate)
            try:
                return json.loads(candidate, strict=False)
            except Exception:
                pass
    # Final: try whole text
    try:
        return json.loads(text, strict=False)
    except Exception:
        return None


QUESTION_TYPE_LABELS = [
    "mcq", "true_false", "fill_in", "writing", "calculation",
    "matching", "order", "debug", "synthesis", "trace",
    "scenario", "data_analysis", "code"
]

DIFFICULTY_LABELS = ["L0", "L1", "L2", "L3", "L4"]


# ── Agent 1: Extractor ────────────────────────────────────────────────────────

class ExtractorAgent:
    """
    Extracts raw questions from a chunk of source text.
    Returns a list of {raw_text, number} dicts.
    Designed for small context: processes 2000-char chunks.
    """

    CHUNK_SIZE = 2500
    OVERLAP = 200

    def __init__(self, llm):
        self.llm = llm

    def _chunk(self, text: str) -> List[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + self.CHUNK_SIZE, len(text))
            chunks.append(text[start:end])
            start = end - self.OVERLAP
        return chunks

    async def extract(self, text: str, governor) -> List[Dict]:
        """Returns list of {raw_text, source_chunk_idx}."""
        chunks = self._chunk(text)
        all_questions = []
        seen_hashes: set = set()

        for chunk_idx, chunk in enumerate(chunks):
            prompt = (
                "Extract ALL exam/worksheet questions from the text below.\n"
                "Return a JSON array of strings. Each string = one complete question.\n"
                "Include all parts (a, b, c). Preserve numbering.\n"
                "If NO questions found, return [].\n"
                "RETURN ONLY THE JSON ARRAY. NO EXPLANATION.\n\n"
                f"TEXT:\n{chunk}"
            )
            try:
                await governor.get_permit(expected_tokens=800)
                res = await self.llm.ainvoke([("human", prompt)])
                data = _parse_json_safe(res.content)
                if isinstance(data, list):
                    for item in data:
                        raw = str(item).strip()
                        if not raw or len(raw) < 10:
                            continue
                        h = hashlib.md5(raw[:80].encode()).hexdigest()
                        if h in seen_hashes:
                            continue
                        seen_hashes.add(h)
                        all_questions.append({"raw_text": raw, "chunk_idx": chunk_idx})
            except Exception as e:
                logger.warning(f"[Extractor] Chunk {chunk_idx} failed: {e}")

        return all_questions


# ── Agent 2: Classifier ───────────────────────────────────────────────────────

class ClassifierAgent:
    """
    Tags each raw question with type + difficulty in a single batched LLM call.
    Batch size ≤20 to keep context small.
    """

    BATCH_SIZE = 15

    def __init__(self, llm):
        self.llm = llm

    async def classify_batch(self, questions: List[Dict], governor) -> List[Dict]:
        """Returns questions with 'q_type' and 'difficulty' fields added."""
        result = list(questions)
        for i in range(0, len(result), self.BATCH_SIZE):
            batch = result[i:i + self.BATCH_SIZE]
            numbered = "\n".join(
                f"{j+1}. {q['raw_text'][:200]}" for j, q in enumerate(batch)
            )
            types_str = ", ".join(QUESTION_TYPE_LABELS)
            prompt = (
                f"Classify each question below. For each, output type and difficulty.\n"
                f"Types: {types_str}\n"
                f"Difficulties: L0 (recall) L1 (understand) L2 (apply) L3 (analyze) L4 (create/evaluate)\n\n"
                f"Return a JSON array with one object per question:\n"
                f'[{{"idx":1,"type":"mcq","difficulty":"L1"}}, ...]\n'
                f"RETURN ONLY THE JSON ARRAY.\n\n"
                f"QUESTIONS:\n{numbered}"
            )
            try:
                await governor.get_permit(expected_tokens=600)
                res = await self.llm.ainvoke([("human", prompt)])
                data = _parse_json_safe(res.content)
                if isinstance(data, list):
                    for item in data:
                        if not isinstance(item, dict):
                            continue
                        idx = item.get("idx", 0)
                        if 1 <= idx <= len(batch):
                            batch[idx - 1]["q_type"] = item.get("type", "writing")
                            batch[idx - 1]["difficulty"] = item.get("difficulty", "L1")
            except Exception as e:
                logger.warning(f"[Classifier] Batch {i} failed: {e}")

            # Fill defaults for any that failed
            for q in batch:
                q.setdefault("q_type", "writing")
                q.setdefault("difficulty", "L1")

        return result


# ── Agent 3: Solver ───────────────────────────────────────────────────────────

class SolverAgent:
    """
    Solves one question at a time to keep context minimal.
    Returns answer + explanation for each.
    """

    # Prompt templates per type (compact)
    _TEMPLATES: Dict[str, str] = {
        "mcq": (
            "Question (MCQ):\n{q}\n\n"
            "Generate:\n"
            '{"options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","explanation":"..."}\n'
            "ONLY JSON."
        ),
        "true_false": (
            "Question (True/False):\n{q}\n\n"
            '{"answer":"True","explanation":"..."}\nONLY JSON.'
        ),
        "fill_in": (
            "Question (Fill in blank):\n{q}\n\n"
            '{"textWithBlanks":"sentence with [[blank]]","answer":["word"],"explanation":"..."}\nONLY JSON.'
        ),
        "matching": (
            "Question (Matching):\n{q}\n\n"
            '{"pairs":[{"left":"A","right":"1"},{"left":"B","right":"2"}],"explanation":"..."}\nONLY JSON.'
        ),
        "order": (
            "Question (Ordering):\n{q}\n\n"
            '{"steps":["Step 2","Step 1","Step 3"],"answer":["Step 1","Step 2","Step 3"],"explanation":"..."}\nONLY JSON.'
        ),
        "calculation": (
            "Question (Calculation):\n{q}\n\n"
            '{"content":"show working setup","answer":"final numeric answer","explanation":"step by step"}\nONLY JSON.'
        ),
        "default": (
            "Question:\n{q}\n\n"
            '{"answer":"complete answer","explanation":"why this is correct"}\nONLY JSON.'
        ),
    }

    def __init__(self, llm):
        self.llm = llm

    def _get_template(self, q_type: str) -> str:
        return self._TEMPLATES.get(q_type, self._TEMPLATES["default"])

    async def solve(self, question: Dict, governor) -> Dict:
        """Solves a single question and merges the result back into the dict."""
        q_type = question.get("q_type", "writing")
        prompt = self._get_template(q_type).format(q=question["raw_text"][:800])
        try:
            await governor.get_permit(expected_tokens=500)
            res = await self.llm.ainvoke([("human", prompt)])
            data = _parse_json_safe(res.content)
            if isinstance(data, dict):
                question.update(data)
        except Exception as e:
            logger.warning(f"[Solver] Failed for question: {e}")
            question.setdefault("answer", "See source material.")
            question.setdefault("explanation", "Could not auto-solve.")
        return question

    async def solve_all(self, questions: List[Dict], governor) -> List[Dict]:
        """Solves all questions sequentially (rate-limit safe)."""
        solved = []
        for q in questions:
            solved.append(await self.solve(q, governor))
        return solved


# ── Vault Writer ──────────────────────────────────────────────────────────────

class VaultWriter:
    """
    Serialises solved questions to a structured .md file.
    Structure:
      Notes/Practice/Reference_Vault/<hub_id>/<source_name>.md
    """

    def __init__(self, vault_path: Path):
        self.vault_path = vault_path

    def _vault_dir(self, hub_id: str) -> Path:
        # Standardised path: Unified with list_vaults
        d = self.vault_path / "Notes" / "Practice" / "Reference_Vault" / hub_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _render_question(self, q: Dict, num: int) -> str:
        q_type = q.get("q_type", "writing")
        difficulty = q.get("difficulty", "L1")
        raw = q.get("raw_text", "").strip()
        answer = q.get("answer", "")
        explanation = q.get("explanation", "")

        lines = [f"### Q{num} — {q_type.replace('_',' ').title()} ({difficulty})\n"]
        lines.append(f"**Question:** {raw}\n")

        # Type-specific rendering
        if q_type == "mcq" and isinstance(q.get("options"), dict):
            for key, val in q["options"].items():
                marker = "✓" if key == answer else " "
                lines.append(f"- [{marker}] **{key}.** {val}")
            lines.append(f"\n**Answer:** {answer}")
        elif q_type == "true_false":
            lines.append(f"\n**Answer:** {answer}")
        elif q_type == "fill_in":
            tw = q.get("textWithBlanks", "")
            ans_list = q.get("answer", [])
            lines.append(f"\n**Sentence:** {tw}")
            if isinstance(ans_list, list):
                lines.append(f"**Answers:** {', '.join(str(a) for a in ans_list)}")
            else:
                lines.append(f"**Answer:** {ans_list}")
        elif q_type == "matching" and isinstance(q.get("pairs"), list):
            lines.append("\n**Pairs:**")
            for p in q["pairs"]:
                lines.append(f"- {p.get('left','')} ↔ {p.get('right','')}")
        elif q_type == "order":
            correct = q.get("answer", q.get("steps", []))
            if isinstance(correct, list):
                lines.append("\n**Correct Order:**")
                for i, s in enumerate(correct, 1):
                    lines.append(f"{i}. {s}")
        elif q_type in ("calculation", "data_analysis"):
            content = q.get("content", "")
            if content:
                lines.append(f"\n**Setup:** {content}")
            lines.append(f"\n**Answer:** {answer}")
        elif q_type in ("debug", "code"):
            code = q.get("content", q.get("codeSnippet", ""))
            if code:
                lines.append(f"\n```\n{code}\n```")
            lines.append(f"\n**Answer:** {answer}")
        else:
            if answer:
                lines.append(f"\n**Answer:** {answer}")

        if explanation:
            lines.append(f"\n> **Explanation:** {explanation}\n")

        lines.append("\n---\n")
        return "\n".join(lines)

    def write(self, hub_id: str, source_name: str, questions: List[Dict]) -> Path:
        """Writes the vault file and returns its absolute path."""
        vault_dir = self._vault_dir(hub_id)
        safe_name = re.sub(r'[^\w\-_. ]', '_', Path(source_name).stem)
        file_path = vault_dir / f"{safe_name}.md"

        # Group by difficulty then type
        by_difficulty: Dict[str, List] = {d: [] for d in DIFFICULTY_LABELS}
        for q in questions:
            diff = q.get("difficulty", "L1")
            if diff not in by_difficulty:
                diff = "L1"
            by_difficulty[diff].append(q)

        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        lines = [
            f"---",
            f"title: {safe_name} — Reference Vault",
            f"hub: {hub_id}",
            f"source: {source_name}",
            f"created: {now}",
            f"total_questions: {len(questions)}",
            f"tags: [reference-vault, practice]",
            f"---",
            f"",
            f"# {safe_name} — Question Vault",
            f"",
            f"> Source: `{source_name}` | Hub: `{hub_id}` | Generated: {now}",
            f"",
        ]

        q_num = 1
        for diff in DIFFICULTY_LABELS:
            batch = by_difficulty.get(diff, [])
            if not batch:
                continue
            lines.append(f"## {diff} — {self._diff_label(diff)}\n")
            # Sub-group by type
            by_type: Dict[str, List] = {}
            for q in batch:
                t = q.get("q_type", "writing")
                by_type.setdefault(t, []).append(q)
            for q_type, type_qs in by_type.items():
                lines.append(f"### {q_type.replace('_',' ').title()}\n")
                for q in type_qs:
                    lines.append(self._render_question(q, q_num))
                    q_num += 1

        file_path.write_text("\n".join(lines), encoding="utf-8")
        return file_path

    def _diff_label(self, diff: str) -> str:
        return {
            "L0": "Basic Recall",
            "L1": "Understanding",
            "L2": "Application",
            "L3": "Analysis",
            "L4": "Synthesis & Evaluation",
        }.get(diff, diff)

    def list_vaults(self, hub_id: str) -> List[Dict]:
        """Lists all vault files for a hub."""
        vault_dir = self.vault_path / "Notes" / "Practice" / "Reference_Vault" / hub_id
        if not vault_dir.exists():
            return []
        result = []
        for f in vault_dir.glob("*.md"):
            try:
                content = f.read_text(encoding="utf-8")
                total = 0
                m = re.search(r'total_questions:\s*(\d+)', content)
                if m:
                    total = int(m.group(1))
                result.append({
                    "name": f.stem,
                    "path": str(f.absolute()),
                    "total_questions": total,
                    "mtime": f.stat().st_mtime,
                })
            except Exception:
                pass
        result.sort(key=lambda x: x["mtime"], reverse=True)
        return result

    def load_questions(self, vault_path_str: str) -> List[Dict]:
        """
        Parses a vault .md file back into a list of question dicts
        suitable for the practice session engine.
        """
        p = Path(vault_path_str)
        if not p.exists():
            return []
        content = p.read_text(encoding="utf-8")

        questions = []
        # Pattern: ### Q{n} — {type} ({difficulty})
        blocks = re.split(r'(?=### Q\d+)', content)
        q_id = 1
        for block in blocks:
            m = re.match(r'### Q(\d+) — ([\w /]+?) \((L\d)\)', block)
            if not m:
                continue
            q_type_raw = m.group(2).lower().replace(' ', '_')
            difficulty = m.group(3)

            # Extract question text
            q_m = re.search(r'\*\*Question:\*\* (.+?)(?=\n\n|\n-|\n\*\*|\Z)', block, re.DOTALL)
            question_text = q_m.group(1).strip() if q_m else ""

            q = {
                "id": q_id,
                "type": q_type_raw,
                "difficulty": difficulty,
                "question": question_text,
                "answer": "",
                "explanation": "",
                "hints": [],
                "required_keywords": [],
            }

            # Extract answer
            ans_m = re.search(r'\*\*Answer:\*\* (.+?)(?=\n|\Z)', block)
            if ans_m:
                q["answer"] = ans_m.group(1).strip()

            # Extract explanation
            exp_m = re.search(r'> \*\*Explanation:\*\* (.+?)(?=\n|\Z)', block)
            if exp_m:
                q["explanation"] = exp_m.group(1).strip()

            # MCQ options
            opts_m = re.findall(r'- \[[ ✓]\] \*\*([A-D])\.\*\* (.+)', block)
            if opts_m:
                q["options"] = {k: v for k, v in opts_m}

            # Fill in blanks
            tw_m = re.search(r'\*\*Sentence:\*\* (.+?)(?=\n)', block)
            if tw_m:
                q["textWithBlanks"] = tw_m.group(1).strip()
                ans_list_m = re.search(r'\*\*Answers:\*\* (.+?)(?=\n|\Z)', block)
                if ans_list_m:
                    q["answer"] = [a.strip() for a in ans_list_m.group(1).split(',')]

            # Pairs
            pairs_m = re.findall(r'- (.+?) ↔ (.+)', block)
            if pairs_m:
                q["pairs"] = [{"left": l.strip(), "right": r.strip()} for l, r in pairs_m]

            # Order steps
            steps_m = re.findall(r'(\d+)\. (.+)', block)
            if steps_m and q["type"] in ("order",):
                q["steps"] = [s for _, s in steps_m]
                q["answer"] = [s for _, s in steps_m]

            # Normalise type to canonical
            mapping = {
                "multiple_choice": "mcq",
                "true/false": "true_false",
                "fill_in_the_blank": "fill_in",
                "fill_in_blank": "fill_in",
                "matching_pairs": "matching",
                "ordering": "order",
                "debugging": "debug",
                "scenario_analysis": "scenario",
                "data_analysis": "data_analysis",
            }
            q["type"] = mapping.get(q["type"], q["type"])

            questions.append(q)
            q_id += 1

        return questions


# ── Pipeline Orchestrator ─────────────────────────────────────────────────────

class ReferenceVaultPipeline:
    """
    Orchestrates the full extract → classify → solve → write pipeline.
    Designed to be token-efficient with weak LLMs.
    """

    def __init__(self, llm, vault_path: Path, governor):
        self.llm = llm
        self.vault_path = vault_path
        self.governor = governor
        self.extractor = ExtractorAgent(llm)
        self.classifier = ClassifierAgent(llm)
        self.solver = SolverAgent(llm)
        self.writer = VaultWriter(vault_path)

    async def run(
        self,
        hub_id: str,
        source_name: str,
        source_text: str,
        status_callback=None,
    ) -> Dict[str, Any]:
        """
        Full pipeline run.
        Returns {"path": str, "total": int, "questions": [...]}
        """
        def _status(msg: str):
            if status_callback:
                status_callback(msg)
            logger.info(f"[ReferenceVault] {msg}")

        _status("Extracting questions from source...")
        raw_questions = await self.extractor.extract(source_text, self.governor)

        if not raw_questions:
            return {"path": None, "total": 0, "questions": [], "error": "No questions found in source."}

        _status(f"Classifying {len(raw_questions)} questions...")
        classified = await self.classifier.classify_batch(raw_questions, self.governor)

        _status(f"Solving {len(classified)} questions...")
        solved = await self.solver.solve_all(classified, self.governor)

        _status("Writing vault file...")
        file_path = self.writer.write(hub_id, source_name, solved)

        _status("Done.")
        return {
            "path": str(file_path.absolute()),
            "relative_path": file_path.relative_to(self.vault_path).as_posix(),
            "total": len(solved),
            "questions": solved,
        }
