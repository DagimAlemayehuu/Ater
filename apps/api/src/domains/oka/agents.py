import json
import re
import asyncio
from typing import Any, Dict
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import NoteContent, PartialPlan, ProbeEnrichment

# ── DOMAIN MATRIX v25.5 ──────────────────────────────────────────────────────
DOMAIN_MATRIX = {
    "CS-SOFTWARE":        {"persona":"Principal Software Engineer","h1":"Execution Logic & Data Flow","h2":"Edge Cases & Failure States","h3":"Implementation Mechanics","artifact":"Execution block or annotated AST snippet","l1":"fill_in","l2":"true_false","l3":"debug"},
    "CS-SYSTEMS":         {"persona":"Systems Architect","h1":"Protocol & Signal Topology","h2":"Bottlenecks & Partition Failures","h3":"Architecture Topology","artifact":"Mermaid sequence diagram","l1":"mcq","l2":"scenario","l3":"debug"},
    "CS-DB":              {"persona":"Database Administrator","h1":"Schema & Query Mechanics","h2":"ACID Violations & Scaling Limits","h3":"Entity-Relationship Model","artifact":"ER diagram or JSON schema","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-AI":              {"persona":"Machine Learning Engineer","h1":"Forward Pass & Backpropagation","h2":"Overfitting & Dimensionality","h3":"Model Architecture","artifact":"Neural network architecture diagram","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "MATH-PURE":          {"persona":"Formal Logician","h1":"Derivation & Logical Trace","h2":"Theorem Constraints & Incompleteness","h3":"Formal Proof Trace","artifact":"LaTeX step-by-step proof","l1":"mcq","l2":"fill_in","l3":"debug"},
    "MATH-STAT":          {"persona":"Data Scientist","h1":"Statistical Modeling & Inference","h2":"Confounding Variables & Bias","h3":"Probability Distribution","artifact":"Confusion matrix or probability table","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-CRYPTO":        {"persona":"Cryptographer","h1":"Cryptographic Operations","h2":"Collision Vulnerabilities & Brute Force","h3":"Hash Sequence Trace","artifact":"Hash sequence table","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "PHYSICS-KINEMATICS": {"persona":"Theoretical Physicist","h1":"Kinematic & Quantum Dynamics","h2":"Entropy & Boundary Limits","h3":"Physical Force Model","artifact":"Free-body or Feynman diagram","l1":"fill_in","l2":"scenario","l3":"writing"},
    "CHEMISTRY":          {"persona":"Chemist","h1":"Reaction Mechanisms & Stoichiometry","h2":"Equilibrium Shifts & Catalytic Decay","h3":"Molecular Pathway","artifact":"Molecular structure or reaction pathway","l1":"mcq","l2":"scenario","l3":"debug"},
    "BIOLOGY":            {"persona":"Biologist","h1":"Biochemical Pathways","h2":"Genetic Drift & Environmental Collapse","h3":"Metabolic Map","artifact":"Metabolic pathway flowchart","l1":"true_false","l2":"scenario","l3":"writing"},
    "ENG-MECH":           {"persona":"Mechanical Engineer","h1":"Kinematic Linkages & Load Transfer","h2":"Yield Strengths & Fatigue Limits","h3":"Load Tolerance Specs","artifact":"Load-bearing tolerance table","l1":"fill_in","l2":"scenario","l3":"debug"},
    "ENG-ELEC":           {"persona":"Circuit Designer","h1":"Circuit Analysis & Signal Flow","h2":"Thermal Throttling & Impedance Mismatch","h3":"Logic Gate Trace","artifact":"Truth table or logic gate sequence","l1":"true_false","l2":"scenario","l3":"debug"},
    "MED-PHYSIO":         {"persona":"Attending Surgeon","h1":"Systemic Function & Homeostasis","h2":"Pathological Failure & Necrosis","h3":"Spatial Adjacency Model","artifact":"Spatial adjacency matrix","l1":"fill_in","l2":"scenario","l3":"writing"},
    "MED-PHARMA":         {"persona":"Toxicologist","h1":"Pharmacokinetics & Mechanism of Action","h2":"Toxicity Thresholds & Contraindications","h3":"Pharmacokinetic Pathway","artifact":"Pharmacokinetic pathway flowchart","l1":"mcq","l2":"scenario","l3":"debug"},
    "ECON-MACRO":         {"persona":"Macroeconomist","h1":"Market Dynamics & Capital Flow","h2":"Market Failures & Externalities","h3":"Macro Flowchart","artifact":"Supply-demand graph or macro flowchart","l1":"true_false","l2":"scenario","l3":"writing"},
    "ECON-FINANCE":       {"persona":"Comptroller","h1":"Cash Flow Mechanics & Valuation","h2":"Liquidity Crunches & Solvency Risk","h3":"Financial Ledger","artifact":"T-account ledger or cash flow block","l1":"true_false","l2":"scenario","l3":"debug"},
    "BIZ-STRATEGY":       {"persona":"Corporate Strategist","h1":"Go-to-Market Execution & Supply Chain","h2":"Strategic Moat Vulnerabilities","h3":"Value Chain Framework","artifact":"Value chain diagram or SWOT matrix","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CASE":           {"persona":"Appellate Litigator","h1":"Ratio Decidendi (Legal Trace)","h2":"Appellate Reversals & Jurisdictional Limits","h3":"Precedent Analysis","artifact":"IRAC mapping table","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CONTRACT":       {"persona":"Corporate Lawyer","h1":"Obligation Mechanics & Fulfillment","h2":"Breach Conditions & Liability Triggers","h3":"Condition-Result Model","artifact":"Condition-result matrix","l1":"fill_in","l2":"scenario","l3":"writing"},
    "HIST-CATALYST":      {"persona":"Historical Archivist","h1":"Chronological Catalysts & Execution","h2":"Multi-Generational Fallout","h3":"Causality Timeline","artifact":"Annotated timeline","l1":"fill_in","l2":"scenario","l3":"writing"},
    "PHILOSOPHY":         {"persona":"Philosopher","h1":"Dialectical Progression","h2":"Logical Fallacies & Existential Paradoxes","h3":"Dialectical Map","artifact":"Dialectical map","l1":"mcq","l2":"scenario","l3":"writing"},
    "PSYCH-SOCIOLOGY":    {"persona":"Behavioral Researcher","h1":"Behavioral Triggers & Societal Shift","h2":"Cognitive Bias & Systemic Erosion","h3":"Cognitive Map","artifact":"Cognitive bias map","l1":"true_false","l2":"scenario","l3":"writing"},
    "LANG-LINGUISTICS":   {"persona":"Grammarian","h1":"Morphological Transformation","h2":"Semantic Ambiguity & Exceptions","h3":"Syntactical Tree","artifact":"Syntactical parsing tree","l1":"mcq","l2":"fill_in","l3":"writing"},
    "LANG-LIT":           {"persona":"Literary Critic","h1":"Narrative Arc & Rhetorical Execution","h2":"Thematic Subversion & Unreliable Narrators","h3":"Motif Matrix","artifact":"Motif matrix","l1":"mcq","l2":"fill_in","l3":"writing"},
    "ARTS-DESIGN":        {"persona":"Creative Director","h1":"Medium Mechanics & Composition","h2":"Perceptual Dissonance & Rule Breaking","h3":"Design Primitives","artifact":"Color palette or design system matrix","l1":"mcq","l2":"scenario","l3":"writing"},
    "SKILLS-HARD":        {"persona":"Master Craftsman","h1":"Step-by-Step Execution Sequence","h2":"Troubleshooting & Critical Failure Points","h3":"Process Blueprint","artifact":"Process flowchart","l1":"fill_in","l2":"scenario","l3":"writing"},
    "SKILLS-FITNESS":     {"persona":"Kinesiologist","h1":"Biomechanical Execution & Metabolism","h2":"Overtraining Vectors & Injury","h3":"Kinematic Trace","artifact":"Kinematic sequence table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "EDUCATION":          {"persona":"Pedagogical Expert","h1":"Learning Theory & Instructional Design","h2":"Cognitive Load & Knowledge Gaps","h3":"Curriculum Framework","artifact":"Learning objective hierarchy","l1":"fill_in","l2":"scenario","l3":"writing"},
}

VALID_MODES = set(DOMAIN_MATRIX.keys())

# Concept drift guard — keywords that signal the LLM wandered to the wrong domain
# (e.g. writing about OAuth when the topic is C++ tokens)
_DRIFT_SIGNALS = {
    "access_token", "refresh_token", "oauth", "jwt", "authorization_code",
    "token_blacklist", "uuid", "guid", "distributed system",
}


def _has_domain_drift(title: str, body: str) -> bool:
    """Returns True if the body talks about things clearly unrelated to the title."""
    title_words = set(re.sub(r"[_\-]", " ", title.lower()).split())
    body_lower = body.lower()
    # If several drift signals appear AND none of the title words appear prominently
    drift_hits = sum(1 for s in _DRIFT_SIGNALS if s in body_lower)
    title_hits = sum(1 for w in title_words if len(w) > 3 and w in body_lower)
    return drift_hits >= 2 and title_hits == 0


def _count_wikilinks(text: str) -> int:
    return len(re.findall(r"\[\[[^\]]+\]\]", text))


# ── ARCHITECT AGENT ───────────────────────────────────────────────────────────

class ArchitectAgent:
    """
    Plans the curriculum.  Token-efficient: uses a compact prompt and
    falls back to manual JSON parse on structured-output failure.
    """

    def __init__(self, llm: BaseChatModel):
        self.llm = llm
        try:
            self.llm_structured = llm.with_structured_output(PartialPlan)
        except Exception:
            self.llm_structured = None

    async def generate_partial_plan(self, document_text: str) -> PartialPlan:
        modes_str = ", ".join(DOMAIN_MATRIX.keys())
        # Compact prompt — every token saved matters on weak models
        system = (
            "You are the OKA Curriculum Architect. Extract 15-25 atomic concepts from the text.\n"
            "RULES:\n"
            "1. Titles: 1-3 words, Title_Case_With_Underscores, never a question.\n"
            "2. mode: EXACTLY one code from this list: " + modes_str + "\n"
            "3. prerequisites: list the EXACT titles of other concepts in this plan that must be known first.\n"
            "4. source_context: copy the 1-2 most relevant sentences from the text for this concept.\n"
            "5. source_pages: list page numbers mentioned near that concept (integers only).\n"
            "OUTPUT: pure JSON only — no markdown fences.\n"
            '{"atomic_notes":[{"title":"...","description":"...","mode":"...","prerequisites":[],'
            '"source_context":"...","source_pages":[]}],"possible_questions":[]}'
        )

        last_error = None
        for attempt in range(4):
            try:
                if attempt == 0 and self.llm_structured:
                    try:
                        return await self.llm_structured.ainvoke([
                            ("system", system), ("human", document_text[:12000])
                        ])
                    except Exception as e:
                        last_error = e
                        print(f"[ArchitectAgent] Structured output failed: {e}. Falling back.")

                # Manual parse
                retry_note = f"\nPREVIOUS ERROR: {last_error}\nReturn ONLY pure JSON, no markdown.\n" if last_error else ""
                res = await self.llm.ainvoke([
                    ("system", system + retry_note),
                    ("human", f"Document:\n{document_text[:10000]}")
                ])
                data = self._parse_json(res.content)

                # Sanitise
                data.setdefault("atomic_notes", [])
                data.setdefault("possible_questions", [])
                for note in data["atomic_notes"]:
                    if note.get("mode") not in VALID_MODES:
                        note["mode"] = "CS-SOFTWARE"
                    # Normalise title to underscores
                    note["title"] = re.sub(r"\s+", "_", note.get("title", "Unknown").strip())
                    # Ensure source_pages is a list of ints
                    pages = note.get("source_pages", [])
                    note["source_pages"] = [int(p) for p in pages if str(p).strip().isdigit()]

                return PartialPlan(**data)

            except Exception as e:
                last_error = e
                if self._is_rate_limit(e):
                    wait = 30 * (attempt + 1)
                    print(f"[ArchitectAgent] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    print(f"[ArchitectAgent] Attempt {attempt+1} failed: {e}")
        raise last_error

    # ── helpers ──
    @staticmethod
    def _parse_json(content: str) -> Dict[str, Any]:
        if not content or not content.strip():
            raise ValueError("Empty response from LLM")
        # Strip markdown fences if present
        clean = re.sub(r"^```[a-z]*\n?", "", content.strip())
        clean = re.sub(r"\n?```$", "", clean).strip()
        start, end = clean.find("{"), clean.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("No JSON object in response")
        return json.loads(clean[start:end+1], strict=False)

    @staticmethod
    def _is_rate_limit(e: Exception) -> bool:
        s = str(e).lower()
        return "429" in s or "rate_limit" in s or "rate limit" in s


# ── WRITER AGENT ──────────────────────────────────────────────────────────────

class WriterAgent:
    """
    2-Pass content generator.

    Pass 1 (Theorist)  — Sections 1-3: deep prose with mandatory wikilinks.
    Pass 2 (Inquisitor)— Sections 4-6: artifact + walkthrough + quiz JSON.

    Designed to be robust on weak / token-limited models:
    - Compact prompts with exact format examples
    - Drift detection: rejects and retries if body is about the wrong concept
    - Quiz answer never leaked in the question content field
    - Prerequisite titles forced to underscored form
    """

    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    # ─────────────────────────────────────────────────────────────
    # PASS 1 — Theory
    # ─────────────────────────────────────────────────────────────
    async def generate_content(
        self,
        note_schema,
        source_text: str,
        primary_language: str,
        all_concepts: str,
    ) -> NoteContent:
        domain = DOMAIN_MATRIX.get(note_schema.mode, DOMAIN_MATRIX["CS-SOFTWARE"])
        title_readable = note_schema.title.replace("_", " ")

        # ── Token-efficient Pass 1 prompt ──
        sys_prompt = (
            f"You are a hostile, unforgiving senior {domain['persona']}.\n"
            f"Write deep technical notes about: {title_readable}\n\n"
            "FORMAT (use EXACTLY these headings):\n\n"
            "# 1. Mental Model\n"
            "(2-3 sentences. Explain the core idea using a real-world analogy a 10-year-old can picture. "
            "Must be about THIS concept, not a generic concept.)\n\n"
            f"# 2. {domain['h1']}\n"
            "(4-6 sentences of continuous technical prose — NO bullet points. "
            "Explain HOW this concept works mechanically. "
            "MANDATORY: wrap 3-5 related technical terms in [[Wikilinks]] like [[Stack_Frame]] or [[Operator_Precedence]])\n\n"
            f"# 3. {domain['h2']}\n"
            "(4-6 sentences of continuous technical prose — NO bullet points. "
            "Cover boundary conditions, failure states, and constraints. "
            "MANDATORY: wrap 3-5 related technical terms in [[Wikilinks]])\n\n"
            "RULES:\n"
            "- No intro filler. Start immediately with # 1.\n"
            "- Code terms use `backticks`.\n"
            "- Wikilinks use [[Underscore_Title_Case]] format.\n"
            "- Every factual claim must be technically accurate for the specific concept title above.\n"
            f"- The concept is '{title_readable}' — stay 100% on this topic.\n"
        )

        src = (note_schema.source_context or source_text[:4000]).strip()
        user_msg = f"Concept: {title_readable}\nSource:\n{src[:3000]}"

        last_error = None
        for attempt in range(3):
            try:
                if attempt > 0:
                    sys_prompt += f"\n\nPREVIOUS ATTEMPT FAILED: {last_error}. Try again."

                res = await self.llm.ainvoke([("system", sys_prompt), ("human", user_msg)])
                body = res.content.strip()
                # Strip accidental markdown fences
                body = re.sub(r"^```markdown\n?", "", body)
                body = re.sub(r"\n?```$", "", body).strip()

                # ── Quality Gates ──
                if _has_domain_drift(note_schema.title, body):
                    last_error = (
                        f"Domain drift detected: body does not discuss '{title_readable}'. "
                        "You wrote about a completely different concept. Correct this now."
                    )
                    print(f"[WriterAgent] Pass 1 drift on '{note_schema.title}'. Retrying...")
                    continue

                wikilink_count = _count_wikilinks(body)
                if wikilink_count < 3:
                    last_error = (
                        f"Only {wikilink_count} [[Wikilinks]] found. You MUST include at least 3-5 "
                        "Obsidian wikilinks in sections 2 and 3."
                    )
                    print(f"[WriterAgent] Insufficient wikilinks ({wikilink_count}) on '{note_schema.title}'. Retrying...")
                    continue

                if "Error generating" in body or len(body) < 200:
                    last_error = "Output too short or contains error marker."
                    continue

                return NoteContent(markdown_body=body, search_keywords=[])

            except Exception as e:
                last_error = e
                if ArchitectAgent._is_rate_limit(e):
                    # Exponential backoff with 60s floor (matches Groq's 1-min TPM window)
                    wait = min(60 * (2 ** attempt), 300)
                    print(f"[WriterAgent] Pass 1 rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    print(f"[WriterAgent] Pass 1 attempt {attempt+1} failed: {e}")

        raise Exception(f"WriterAgent Pass 1 failed after 3 attempts: {last_error}")

    # ─────────────────────────────────────────────────────────────
    # PASS 2 — Artifacts + Quiz
    # ─────────────────────────────────────────────────────────────
    async def generate_probes(
        self,
        note_title: str,
        note_body: str,
        source_text: str,
        primary_language: str,
        all_concepts: str,
    ) -> ProbeEnrichment:
        # Detect domain from body headings
        domain = DOMAIN_MATRIX["CS-SOFTWARE"]
        for key, vals in DOMAIN_MATRIX.items():
            if vals["h1"] in note_body or vals["h2"] in note_body:
                domain = vals
                break

        title_readable = note_title.replace("_", " ")

        # ── Token-efficient Pass 2 prompt ──
        sys_prompt = (
            f"You are a hostile senior {domain['persona']} writing exam material about: {title_readable}\n\n"
            "PRODUCE exactly these 3 sections:\n\n"
            f"# 4. {domain['h3']}\n"
            f"(Create a {domain['artifact']} for this concept. Use correct markdown code fences with language tag.)\n"
            "(IMMEDIATELY below the block: 2-3 sentences explaining how to read it.)\n\n"
            "---\n\n"
            "## 5. Walkthrough\n"
            "(A rigorous, multi-step exam scenario applying this concept. Use realistic data. "
            "At least 5 numbered steps. Show intermediate calculations or state changes.)\n\n"
            "---\n\n"
            "## 6. The Proving Grounds\n"
            "```interactive-quiz\n"
            "[\n"
            "  {QUESTION_1},\n"
            "  {QUESTION_2},\n"
            "  {QUESTION_3}\n"
            "]\n"
            "```\n\n"
            "QUIZ RULES:\n"
            f"- Q1: type={domain['l1']}, difficulty=L1 (Theory Recall)\n"
            f"- Q2: type={domain['l2']}, difficulty=L2 (Theory Application)\n"
            f"- Q3: type={domain['l3']}, difficulty=L3 (In-Action / Execution)\n"
            "- Exactly 3 questions in a valid JSON array.\n"
            "- CRITICAL for debug type: The `content` field must contain buggy code/logic ONLY. "
            "NEVER put the answer or the word 'bug' in the content field. The student finds the bug.\n"
            "- CRITICAL for fill_in: `textWithBlanks` must use [[blank1]], [[blank2]] markers. "
            "`answer` must be a list of strings.\n"
            "- Every question must test knowledge of '{title_readable}' specifically.\n"
            "- L1: tests definition/recall. L2: tests application to a new scenario. "
            "L3: tests debugging or execution in a complex realistic case.\n"
            "- `explanation` must be 1-2 sentences of clear reasoning.\n\n"
            "JSON TYPE REFERENCE:\n"
            '- mcq: {"id":"q1","type":"mcq","difficulty":"L1","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A","explanation":"..."}\n'
            '- true_false: {"id":"q2","type":"true_false","difficulty":"L1","question":"...","answer":"True","explanation":"..."}\n'
            '- fill_in: {"id":"q3","type":"fill_in","difficulty":"L1","question":"...","textWithBlanks":"The [[blank1]] does X","answer":["term"],"explanation":"..."}\n'
            '- scenario: {"id":"q4","type":"scenario","difficulty":"L2","question":"A system does X...","answer":"...","explanation":"..."}\n'
            '- debug: {"id":"q5","type":"debug","difficulty":"L3","question":"Find the bug.","content":"<BUGGY CODE ONLY - NO HINT>","answer":"<what the bug is and fix>","explanation":"..."}\n'
            '- writing: {"id":"q6","type":"writing","difficulty":"L2","question":"Explain X...","answer":"...","explanation":"..."}\n'
        )

        user_msg = f"Theory:\n{note_body[:3000]}"

        last_error = None
        res_content = ""
        for attempt in range(4):
            try:
                if attempt == 0:
                    res = await self.llm.ainvoke([("system", sys_prompt), ("human", user_msg)])
                else:
                    retry_msg = (
                        f"Your previous JSON was INVALID. Error: {last_error}\n"
                        "Output the FULL response again. The interactive-quiz block MUST be a valid JSON array of exactly 3 objects. "
                        "Escape all backslashes (\\\\) and quotes (\\\") inside JSON strings."
                    )
                    res = await self.llm.ainvoke([
                        ("system", sys_prompt),
                        ("human", user_msg),
                        ("assistant", res_content),
                        ("human", retry_msg),
                    ])

                res_content = res.content.strip()

                # ── Extract artifact + walkthrough ──
                artifact_match = re.search(
                    r"(# 4\..*?)(?=## 6\.|```interactive-quiz|$)", res_content, re.DOTALL
                )
                artifact_text = artifact_match.group(1).strip() if artifact_match else ""

                if not artifact_text:
                    last_error = "Section 4 (artifact) not found in output."
                    continue

                # ── Extract and validate quiz JSON ──
                quiz_match = re.search(r"```interactive-quiz\s*(.*?)\s*```", res_content, re.DOTALL)
                if not quiz_match:
                    # Auto-repair: model sometimes outputs ```json instead of ```interactive-quiz
                    # Try to find ANY json/array block that looks like quiz data
                    fallback_match = re.search(
                        r"```(?:json|JSON|quiz)?\s*(\[\s*\{.*?\}\s*\])\s*```",
                        res_content, re.DOTALL
                    )
                    if fallback_match:
                        # Splice in the correct fence language and continue parsing
                        print(f"[WriterAgent] Auto-repairing quiz fence language on '{note_title}'")
                        res_content = res_content[:fallback_match.start()] + \
                            f"```interactive-quiz\n{fallback_match.group(1).strip()}\n```" + \
                            res_content[fallback_match.end():]
                        quiz_match = re.search(r"```interactive-quiz\s*(.*?)\s*```", res_content, re.DOTALL)

                if not quiz_match:
                    # Find what fence was actually used to give a useful retry hint
                    wrong_fence = re.search(r"```(\w+)", res_content)
                    fence_hint = f" (you used ```{wrong_fence.group(1)})" if wrong_fence else ""
                    last_error = f"```interactive-quiz block not found{fence_hint}. You MUST wrap the JSON array with ```interactive-quiz ... ``` exactly."
                    continue

                quiz_str = quiz_match.group(1).strip()
                quiz_str = re.sub(r",\s*([\]\}])", r"\1", quiz_str)  # trailing commas

                try:
                    quiz_data = json.loads(quiz_str, strict=False)
                except json.JSONDecodeError as e:
                    # Attempt ast fallback
                    try:
                        import ast
                        py_str = quiz_str.replace("true", "True").replace("false", "False").replace("null", "None")
                        quiz_data = ast.literal_eval(py_str)
                        quiz_str = json.dumps(quiz_data, indent=2, ensure_ascii=False)
                    except Exception:
                        last_error = f"JSON parse failed: {e}"
                        continue

                if not isinstance(quiz_data, list) or len(quiz_data) != 3:
                    last_error = f"Quiz must be array of exactly 3 items, got {type(quiz_data).__name__} len={len(quiz_data) if isinstance(quiz_data, list) else 'N/A'}"
                    continue

                # ── Safety: ensure debug content doesn't contain the answer ──
                for q in quiz_data:
                    if q.get("type") == "debug":
                        answer_words = set(str(q.get("answer", "")).lower().split())
                        content_lower = str(q.get("content", "")).lower()
                        # Mirror the validator threshold: >6 long words (>5 chars)
                        # to avoid false-positives on theory/DB concepts
                        leak_count = sum(1 for w in answer_words if len(w) > 5 and w in content_lower)
                        if leak_count > 6:
                            last_error = "The content field must contain ONLY the buggy code, no hints or answer text."
                            break
                else:
                    # No leaks — success
                    canonical_quiz = json.dumps(quiz_data, indent=2, ensure_ascii=False)
                    return ProbeEnrichment(
                        worked_example=artifact_text,
                        interactive_quiz=f"```interactive-quiz\n{canonical_quiz}\n```",
                    )

                # If we broke out of the for loop due to leak
                print(f"[WriterAgent] Pass 2 answer leak on '{note_title}'. Retrying...")
                continue

            except Exception as e:
                last_error = e
                if ArchitectAgent._is_rate_limit(e):
                    # Exponential backoff with 60s floor (matches Groq's 1-min TPM window)
                    wait = min(60 * (2 ** attempt), 300)
                    print(f"[WriterAgent] Pass 2 rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    print(f"[WriterAgent] Pass 2 attempt {attempt+1} failed: {e}")

        raise Exception(f"WriterAgent Pass 2 failed after 4 attempts: {last_error}")
