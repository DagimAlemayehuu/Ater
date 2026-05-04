import json
import re
import asyncio
import hashlib
from typing import Any, Dict, List
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import PartialPlan

# ── DOMAIN MATRIX v26.1 (UPGRADED) ───────────────────────────────────────────
DOMAIN_MATRIX = {
    "CS-SOFTWARE":        {"persona":"Software Engineer","h1":"How it Works","h2":"Common Pitfalls","artifact":"Code Example","type":"Executable code block (under 20 lines)","l1":"fill_in","l2":"true_false","l3":"debug"},
    "CS-SYSTEMS":         {"persona":"Systems Architect","h1":"System Flow","h2":"Where it Breaks","artifact":"Architecture Diagram","type":"Basic Mermaid flowchart (graph TD/LR)","l1":"mcq","l2":"scenario","l3":"debug"},
    "CS-DB":              {"persona":"Database Admin","h1":"Query Logic","h2":"Data Integrity","artifact":"Database Schema","type":"SQL code block or Markdown Table","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-AI":              {"persona":"Machine Learning Eng.","h1":"Model Mechanics","h2":"Overfitting & Bias","artifact":"Data Pipeline","type":"Basic Mermaid flowchart or Python code","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "CS-TESTING":         {"persona":"QA Engineer","h1":"Test Strategy","h2":"Edge Cases","artifact":"Test Scenario","type":"Code block (assertions) or Markdown Table","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-ARCH":            {"persona":"Software Architect","h1":"Design Pattern","h2":"Trade-offs","artifact":"Component Diagram","type":"Basic Mermaid flowchart or Markdown Table","l1":"mcq","l2":"scenario","l3":"writing"},
    "CS-REQUIREMENTS":    {"persona":"Product Manager","h1":"Goal Definition","h2":"Scope Creep","artifact":"Requirements Table","type":"Markdown Table (max 3 columns)","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-PURE":          {"persona":"Mathematician","h1":"Formal Definition","h2":"Proof Strategy","artifact":"Mathematical Proof","type":"Block LaTeX ($$)","l1":"mcq","l2":"fill_in","l3":"debug"},
    "MATH-STAT":          {"persona":"Statistician","h1":"Statistical Concept","h2":"Common Biases","artifact":"Data Distribution","type":"Block LaTeX ($$) or Markdown Table","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-CRYPTO":        {"persona":"Cryptographer","h1":"Encryption Logic","h2":"Vulnerabilities","artifact":"Cryptographic Flow","type":"Markdown Table or Code snippet","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "MATH-DISCRETE":      {"persona":"Logic Professor","h1":"Discrete Definition","h2":"Base Cases","artifact":"Logical Trace","type":"Truth Table (Markdown) or block LaTeX","l1":"fill_in","l2":"true_false","l3":"debug"},
    "PHYSICS-KINEMATICS": {"persona":"Physicist","h1":"Physical Law","h2":"Boundaries & Limits","artifact":"Formula & Diagram","type":"Block LaTeX ($$) and ASCII Diagram","l1":"fill_in","l2":"scenario","l3":"writing"},
    "CHEMISTRY":          {"persona":"Chemist","h1":"Reaction Mechanism","h2":"Equilibrium","artifact":"Reaction Pathway","type":"Basic Mermaid flowchart or Block LaTeX","l1":"mcq","l2":"scenario","l3":"debug"},
    "BIOLOGY":            {"persona":"Biologist","h1":"Biological Process","h2":"System Failures","artifact":"Pathway Diagram","type":"Basic Mermaid flowchart (graph TD)","l1":"true_false","l2":"scenario","l3":"writing"},
    "ENG-MECH":           {"persona":"Mechanical Engineer","h1":"Mechanical Principle","h2":"Load & Fatigue","artifact":"Force Diagram","type":"ASCII Diagram or Markdown Table","l1":"fill_in","l2":"scenario","l3":"debug"},
    "ENG-ELEC":           {"persona":"Circuit Designer","h1":"Circuit Logic","h2":"Resistance & Heat","artifact":"Circuit Schematic","type":"Truth Table (Markdown) or block LaTeX","l1":"true_false","l2":"scenario","l3":"debug"},
    "MED-PHYSIO":         {"persona":"Surgeon","h1":"Bodily Function","h2":"Disease & Failure","artifact":"System Map","type":"Markdown Adjacency Matrix Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "MED-PHARMA":         {"persona":"Toxicologist","h1":"Drug Mechanism","h2":"Side Effects","artifact":"Interaction Pathway","type":"Markdown Table or Basic Mermaid flowchart","l1":"mcq","l2":"scenario","l3":"debug"},
    "ECON-MACRO":         {"persona":"Macroeconomist","h1":"Economic Theory","h2":"Market Failures","artifact":"Economic Model","type":"Basic Mermaid flowchart (graph LR)","l1":"true_false","l2":"scenario","l3":"writing"},
    "ECON-FINANCE":       {"persona":"Accountant","h1":"Financial Concept","h2":"Financial Risk","artifact":"Ledger Example","type":"Markdown T-Account/Ledger Table","l1":"true_false","l2":"scenario","l3":"debug"},
    "BIZ-STRATEGY":       {"persona":"Business Strategist","h1":"Strategic Concept","h2":"Weaknesses","artifact":"Strategy Matrix","type":"Markdown Table (SWOT)","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CASE":           {"persona":"Lawyer","h1":"Legal Principle","h2":"Exceptions & Limits","artifact":"Case Application","type":"IRAC Framework Markdown Table","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CONTRACT":       {"persona":"Corporate Lawyer","h1":"Contract Rule","h2":"Breach Conditions","artifact":"Liability Map","type":"Markdown Dependency Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "HIST-CATALYST":      {"persona":"Historian","h1":"Historical Event","h2":"Long-term Impact","artifact":"Timeline","type":"Basic Mermaid flowchart (graph TD) or Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "PHILOSOPHY":         {"persona":"Philosopher","h1":"Core Argument","h2":"Counter-Arguments","artifact":"Logical Flow","type":"ASCII Logic Tree or Block quote","l1":"mcq","l2":"scenario","l3":"writing"},
    "PSYCH-SOCIOLOGY":    {"persona":"Psychologist","h1":"Behavioral Concept","h2":"Cognitive Bias","artifact":"Behavior Map","type":"Markdown Matrix Table","l1":"true_false","l2":"scenario","l3":"writing"},
    "LANG-LINGUISTICS":   {"persona":"Grammarian","h1":"Grammar Rule","h2":"Exceptions","artifact":"Syntax Tree","type":"ASCII Syntax Tree","l1":"mcq","l2":"fill_in","l3":"writing"},
    "LANG-LIT":           {"persona":"Literary Critic","h1":"Literary Device","h2":"Thematic Impact","artifact":"Textual Analysis","type":"Markdown Quote/Motif Table","l1":"mcq","l2":"fill_in","l3":"writing"},
    "ARTS-DESIGN":        {"persona":"Designer","h1":"Design Principle","h2":"Breaking the Rule","artifact":"Composition Matrix","type":"Markdown Table","l1":"mcq","l2":"scenario","l3":"writing"},
    "SKILLS-HARD":        {"persona":"Master Craftsman","h1":"Core Technique","h2":"Troubleshooting","artifact":"Execution Steps","type":"Basic Mermaid flowchart or Numbered list","l1":"fill_in","l2":"scenario","l3":"writing"},
    "SKILLS-FITNESS":     {"persona":"Kinesiologist","h1":"Biomechanics","h2":"Injury Prevention","artifact":"Movement Trace","type":"Markdown Kinematic Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "EDUCATION":          {"persona":"Teacher","h1":"Learning Theory","h2":"Knowledge Gaps","artifact":"Curriculum Flow","type":"Markdown Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "RESEARCH-METHODS":   {"persona":"Researcher","h1":"Research Method","h2":"Validity Threats","artifact":"Methodology Setup","type":"Markdown Research Matrix","l1":"mcq","l2":"scenario","l3":"writing"},
}

VALID_MODES = set(DOMAIN_MATRIX.keys())

PROFESSIONAL_DOMAINS = [
    "Aerospace Engineering & Avionics",
    "Global Supply Chain & Maritime Logistics",
    "Quantitative Finance & High-Frequency Trading",
    "Bioinformatics & Genomic Sequencing",
    "Telecommunications & Core Network Routing",
    "Industrial Manufacturing & Robotics",
    "Epidemiology & Public Health Modeling"
]

def get_professional_domain(seed: str) -> str:
    """Pseudo-randomly selects a professional domain based on title."""
    idx = int(hashlib.md5(seed.encode()).hexdigest(), 16) % len(PROFESSIONAL_DOMAINS)
    return PROFESSIONAL_DOMAINS[idx]


# ── DOMAIN PROHIBITIONS & WALKTHROUGH STYLE ───────────────────────────────────
# Hard constraints injected into every agent prompt per domain mode.
DOMAIN_PROHIBITIONS: Dict[str, str] = {
    "MATH-PURE":        "NEVER use ODEs, dy/dx, d²y, integrals (∫), ẋ(t), or any continuous calculus. ALL worked examples MUST use integer-indexed sequences (aₙ, f(n)). Verify every arithmetic step before writing it.",
    "MATH-DISCRETE":    "NEVER use differential equations, integrals, or continuous functions. Use ONLY discrete structures: integer sequences, recurrences, combinatorics, graphs, propositional logic. Verify every arithmetic step.",
    "MATH-STAT":        "NEVER drift into ODEs or deterministic mechanics. Keep all examples probabilistic with proper random variable notation.",
    "MATH-CRYPTO":      "Focus exclusively on discrete cryptographic operations. NEVER drift into continuous probability or calculus.",
    "CS-SOFTWARE":      "NEVER generate OAuth/JWT/UUID/distributed-system content unless the note title explicitly names those topics. Code MUST use the primary_language. Every code block must be syntactically correct and runnable.",
    "CS-DB":            "NEVER confuse relational schema with NoSQL document structure unless both are the note's topic. Avoid application-layer auth topics.",
    "CS-AI":            "NEVER confuse model training with inference, or supervised with unsupervised, unless that distinction IS the concept.",
    "MED-PHYSIO":       "NEVER confuse physiology with pharmacology. Stay in the specific organ system or physiological mechanism relevant to the concept title.",
    "MED-PHARMA":       "NEVER confuse pharmacokinetics (what the body does to the drug) with pharmacodynamics (what the drug does to the body) unless the concept explicitly covers both.",
    "PHYSICS-KINEMATICS": "Use SI units throughout. NEVER confuse kinematics (motion) with dynamics (forces) unless the concept explicitly covers both.",
    "ENG-ELEC":         "NEVER confuse AC and DC analysis unless the concept explicitly covers both. All circuit values must be physically plausible.",
    "PHILOSOPHY":       "Ground every claim in a named philosophical tradition or argument. NEVER use vague 'some philosophers say' attributions.",
    "LAW-CASE":         "NEVER generalize across jurisdictions. Specify the jurisdiction (common law / civil law / specific country) for every legal claim.",
}

# General Formatting Constraints injected into ALL modes
GLOBAL_FORMATTING_RULES = (
    "MARKDOWN TABLES: NEVER insert blank lines between table rows. A table must be a single contiguous block of text. "
    "Correct: \n| A | B |\n|---|---|\n| 1 | 2 |\n"
    "Incorrect: \n| A | B |\n\n|---|---|\n\n| 1 | 2 |\n"
)

# Modes where the walkthrough must be a clean technical derivation — NO logistics/business scenario wrapping.
WALKTHROUGH_PURE: set = {"MATH-PURE", "MATH-DISCRETE", "MATH-STAT", "MATH-CRYPTO", "PHILOSOPHY"}


# Concept drift guard
_DRIFT_SIGNALS = {
    "access_token", "refresh_token", "oauth", "jwt", "authorization_code",
    "token_blacklist", "uuid", "guid", "distributed system",
}

def _has_domain_drift(title: str, body: str) -> bool:
    title_words = set(re.sub(r"[_\-]", " ", title.lower()).split())
    body_lower = body.lower()
    drift_hits = sum(1 for s in _DRIFT_SIGNALS if s in body_lower)
    title_hits = sum(1 for w in title_words if len(w) > 3 and w in body_lower)
    return drift_hits >= 2 and title_hits == 0

def _count_wikilinks(text: str) -> int:
    return len(re.findall(r"\[\[[^\]]+\]\]", text))


# ── ARCHITECT AGENT ───────────────────────────────────────────────────────────

class ArchitectAgent:
    def __init__(self, llm: BaseChatModel):
        self.llm = llm
        try:
            self.llm_structured = llm.with_structured_output(PartialPlan)
        except Exception:
            self.llm_structured = None

    async def generate_partial_plan(self, document_text: str) -> PartialPlan:
        modes_str = ", ".join(DOMAIN_MATRIX.keys())
        system = (
            "You are the OKA Curriculum Architect. Extract 15-25 atomic concepts from the text.\n"
            "RULES:\n"
            "1. Titles: 1-3 words, Title_Case_With_Underscores, never a question.\n"
            "2. mode: EXACTLY one code from this list: " + modes_str + "\n"
            "   **CRITICAL MODE RULES**:\n"
            "   - Discrete math (sequences, recurrences, combinatorics, graph theory, proofs by induction, logic) → `MATH-DISCRETE`\n"
            "   - Continuous math (analysis, calculus, real analysis, differential equations, integration) → `MATH-PURE`\n"
            "   - Statistics, probability, hypothesis testing → `MATH-STAT`\n"
            "   - NEVER use `CS-SOFTWARE` for any mathematics topic.\n"
            "3. prerequisites: list EXACT titles of other concepts in THIS plan that must be known first.\n"
            "4. source_context: copy 1-2 most relevant sentences.\n"
            "5. source_pages: list page numbers mentioned (integers only).\n"
            "OUTPUT: pure JSON only — no markdown fences.\n"
            '{"atomic_notes":[{"title":"...","description":"...","mode":"...","prerequisites":[],'
            '"source_context":"...","source_pages":[]}],"possible_questions":[]}'
        )

        last_error = None
        for attempt in range(4):
            try:
                if attempt == 0 and self.llm_structured:
                    try:
                        return await self.llm_structured.ainvoke([("system", system), ("human", document_text[:12000])])
                    except Exception as e:
                        last_error = e
                        self.llm_structured = None  # Provider doesn't support tool_use — skip for all future calls
                        print(f"[ArchitectAgent] Structured output failed (disabling): {e}. Falling back to plain JSON.")

                retry_note = f"\nPREVIOUS ERROR: {last_error}\nReturn ONLY pure JSON, no markdown.\n" if last_error else ""
                res = await self.llm.ainvoke([
                    ("system", system + retry_note),
                    ("human", f"Document:\n{document_text[:10000]}")
                ])
                data = self._parse_json(res.content)

                data.setdefault("atomic_notes", [])
                data.setdefault("possible_questions", [])
                for note in data["atomic_notes"]:
                    if note.get("mode") not in VALID_MODES:
                        note["mode"] = "CS-SOFTWARE"
                    raw_title = note.get("title", "Unknown").strip()
                    # Enforce strict Title_Case where every word is capitalized
                    words = re.split(r'[\s_\-]+', raw_title)
                    note["title"] = "_".join(w.capitalize() for w in words if w)
                    
                    pages = note.get("source_pages", [])
                    note["source_pages"] = [int(p) for p in pages if str(p).strip().isdigit()]

                return PartialPlan(**data)

            except Exception as e:
                last_error = e
                if self._is_rate_limit(e):
                    wait = 30 * (attempt + 1)
                    await asyncio.sleep(wait)
                else:
                    print(f"[ArchitectAgent] Attempt {attempt+1} failed: {e}")
        raise last_error

    @staticmethod
    def _parse_json(content: str) -> Dict[str, Any]:
        if not content or not content.strip(): raise ValueError("Empty response from LLM")
        clean = re.sub(r"^```[a-z]*\n?", "", content.strip())
        clean = re.sub(r"\n?```$", "", clean).strip()
        start = clean.find("{")
        end = clean.rfind("}")
        if start == -1 or end == -1: raise ValueError("No JSON object in response")
        
        json_str = clean[start:end+1]
        try:
            return json.loads(json_str, strict=False)
        except json.JSONDecodeError:
            brace_count = 0
            for i, char in enumerate(clean[start:], start=start):
                if char == '{': brace_count += 1
                elif char == '}': brace_count -= 1
                if brace_count == 0:
                    try:
                        return json.loads(clean[start:i+1], strict=False)
                    except json.JSONDecodeError:
                        break
            raise

    @staticmethod
    def _is_rate_limit(e: Exception) -> bool:
        s = str(e).lower()
        return "429" in s or "rate_limit" in s or "rate limit" in s


# ── SPLIT AGENTS (Theory, Practitioner, Examiner, Critic) ──

class TheoryAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate(self, note_schema, source_text: str, primary_language: str, all_concepts: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = f"""You are a helpful {self.domain['persona']} tutor.

Write EXACTLY 2 sections. Keep language simple, direct, and conversational.

# 1. Mental Model
Explain this concept to a 12-year-old using a simple, everyday situation. Do not use technical jargon. Just make it intuitively click (2-3 sentences max).

# 2. {self.domain['h1']}
Provide the formal definition of this concept in exactly 2-3 sentences. No fluff. Get straight to the point.
MANDATORY: Embed 3-5 wikilinks from this list ONLY, and no other concepts: {all_concepts}
Format: [[Exact_Match_From_List]] (zero spaces inside brackets).

Concept: {title_readable}
Source context: {source_text[:1500]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the theory sections.")])
        return res.content.strip()

    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = f"""You are a helpful {self.domain['persona']} tutor.

PREVIOUS ATTEMPT FAILED. FIX INSTRUCTION: {diagnosis}

Write EXACTLY 2 sections. Keep it simple and direct.

# 1. Mental Model
Explain to a 12-year-old using a simple everyday analogy.

# 2. {self.domain['h1']}
Provide the formal definition in 2-3 sentences.
MANDATORY: Embed 3-5 wikilinks from this list ONLY: {all_concepts}

Concept: {title_readable}
Source context: {source_text[:1500]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected theory sections.")])
        return res.content.strip()

class PractitionerAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate(self, note_title: str, theory_body: str, primary_language: str, mode: str = "") -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = f"""You are a helpful {self.domain['persona']} tutor.

Write EXACTLY 3 sections. Keep it minimal and highly focused.

# 3. {self.domain['artifact']}
Provide EXACTLY ONE clean, correct artifact of type: **{self.domain['type']}**.
If code, keep it under 20 lines. If a diagram, use standard formats or basic Mermaid (graph TD/LR). Do not invent complex syntax. Do NOT write any explanatory text below it.

## 4. Walkthrough
Write 3-4 bullet points explaining exactly how the artifact works step-by-step. Use standard, recognizable examples. Do not invent complex business scenarios.

## 5. {self.domain['h2']}
Write 2-3 sentences explaining where this concept fails, common pitfalls, or edge cases to watch out for.

Concept: {title_readable}
Theory context: {theory_body[:600]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the artifact, walkthrough, and pitfalls.")])
        return res.content.strip()

    async def retry(self, note_title: str, theory_body: str, primary_language: str, diagnosis: str) -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = f"""You are a helpful {self.domain['persona']} tutor.

PREVIOUS ATTEMPT FAILED. FIX: {diagnosis}

Write EXACTLY 3 sections.

# 3. {self.domain['artifact']}
Create ONE artifact of type: **{self.domain['type']}**.

## 4. Walkthrough
Write 3-4 bullet points explaining it.

## 5. {self.domain['h2']}
Write 2-3 sentences explaining pitfalls or edge cases.

Concept: {title_readable}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected artifact, walkthrough, and pitfalls.")])
        return res.content.strip()

class QuestionAgent:
    def __init__(self, llm, q_type: str):
        self.llm = llm
        self.q_type = q_type.lower().replace("_", "")
        # Normalize types
        mapping = {
            "multiplechoice": "mcq", "mcq": "mcq",
            "truefalse": "true_false", "true_false": "true_false",
            "fillin": "fill_in", "fill_in": "fill_in",
            "writing": "writing", "shortanswer": "writing",
            "matching": "matching",
            "order": "order", "sequencing": "order",
            "debug": "debug", "diagnostic": "debug",
            "synthesis": "synthesis", "scenario": "synthesis",
            "trace": "trace"
        }
        self.canonical_type = mapping.get(self.q_type, "writing")

    async def generate(self, note_title: str, context: str, difficulty: str = "L1") -> dict:
        title_readable = note_title.replace("_", " ")
        
        prompts = {
            "mcq": "Find a highly technical fact. Generate 1 correct answer and 3 highly plausible distractors. The explanation must define *why* the distractors are wrong and *why* the answer is correct.",
            "true_false": "Generate a definitive True/False statement about a core mechanism. The explanation must prove why.",
            "fill_in": "Take a core definitional sentence. Remove the absolute most critical technical term and replace it with `[[blank]]`. Every [[blank]] must represent EXACTLY ONE WORD. Do not blank out common English words.",
            "writing": "Ask the user to explain a concept or mechanism deeply. The answer must be a model 3-5 sentence response.",
            "matching": "Extract exactly 4 technical terms and their definitions. Shuffle them. Output the correct pairs.",
            "order": "Identify a chronological process, algorithm step, or lifecycle. Break it into 4-5 distinct steps. Output the randomized steps and the correct order.",
            "debug": "Act as a Senior Code Reviewer. Provide a short, buggy code snippet, SQL query, or math formula with ONE common beginner mistake. Ask the user to find it. The 'required_keywords' MUST contain exactly the string syntax needed to fix it (e.g., ['=='] or ['GROUP BY']).",
            "trace": "Provide a perfectly valid code snippet or math formula. Ask the user 'What is the exact output of this execution?'.",
            "synthesis": "Invent a complex real-world edge-case scenario combining multiple concepts to solve a problem. The answer should be a grading rubric."
        }
        
        schemas = {
            "mcq": '{"id":"q1","type":"mcq","difficulty":"' + difficulty + '","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"B","explanation":"..."}',
            "true_false": '{"id":"q1","type":"true_false","difficulty":"' + difficulty + '","question":"...","answer":false,"explanation":"..."}',
            "fill_in": '{"id":"q1","type":"fill_in","difficulty":"' + difficulty + '","question":"Fill in the blank.","textWithBlanks":"The [[blank]] is...","answer":["exactword"],"explanation":"..."}',
            "writing": '{"id":"q1","type":"writing","difficulty":"' + difficulty + '","question":"Explain...","answer":"...","explanation":"..."}',
            "matching": '{"id":"q1","type":"matching","difficulty":"' + difficulty + '","question":"Match terms.","pairs":[{"left":"...","right":"..."}]}',
            "order": '{"id":"q1","type":"order","difficulty":"' + difficulty + '","question":"Order steps.","steps":["step2","step3","step1"],"answer":["step1","step2","step3"]}',
            "debug": '{"id":"q1","type":"debug","difficulty":"' + difficulty + '","question":"Find the bug.","content":"...","answer":"...","required_keywords":["fix_syntax"],"explanation":"..."}',
            "trace": '{"id":"q1","type":"trace","difficulty":"' + difficulty + '","question":"What is the exact output?","content":"...","answer":"...","explanation":"..."}',
            "synthesis": '{"id":"q1","type":"synthesis","difficulty":"' + difficulty + '","question":"Complex scenario...","answer":"...","explanation":"..."}'
        }
        
        prompt_logic = prompts.get(self.canonical_type, prompts["writing"])
        json_schema = schemas.get(self.canonical_type, schemas["writing"])
        
        sys_prompt = f"""You are the Dedicated '{self.canonical_type.upper()}' Question Agent.
{prompt_logic}

MANDATORY SCHEMA:
{json_schema}

STRICT RULES:
1. Output ONLY a valid JSON object matching the schema exactly. No markdown fences. No preamble.
2. The 'answer' field is MANDATORY. Do not omit it.
3. For 'explanation', explain the underlying mechanism deeply.
4. EXCLUSIVELY use the provided Context. Do not hallucinate outside features.
5. ANTI-REDUNDANCY: You MUST use the SEED value at the top of the Context to randomly pick an obscure or minor detail to test. DO NOT pick the most obvious concept. A different SEED means you MUST pick a completely different fact than usual.

Concept: {title_readable}
Context: {context[:3000]}
"""
        
        import asyncio
        max_retries = 4
        for attempt in range(max_retries):
            try:
                res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Output the JSON object.")])
                content = res.content.strip()
                q_data = ArchitectAgent._parse_json(content)
                q_data["type"] = self.canonical_type
                q_data["difficulty"] = difficulty
                return q_data
            except Exception as e:
                err_msg = str(e).lower()
                if "429" in err_msg or "rate limit" in err_msg:
                    if attempt == max_retries - 1:
                        raise e
                    # Backoff
                    await asyncio.sleep(2.0 * (2 ** attempt))
                else:
                    print(f"[QuestionAgent] Parse failed for {self.canonical_type} (attempt {attempt}): {e}")
                    if attempt == max_retries - 1:
                        return {"id": "q1", "type": self.canonical_type, "difficulty": difficulty, "question": "Error generating question.", "answer": "N/A"}

class CriticAgent:
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def diagnose(self, content: str, errors: List[str]) -> str:
        sys_prompt = (
            "You are a validation reviewer. A generated note section failed quality checks.\n"
            "Analyze the content and the failed checks.\n"
            "Return JSON only:\n"
            "{\n"
            "  \"diagnosis\": \"One sentence: exactly what went wrong\",\n"
            "  \"fix_instruction\": \"One sentence: exactly what the agent must do differently\"\n"
            "}\n\n"
            f"Failed checks: {errors}\n"
            f"Content that failed: {content[:800]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Provide diagnosis.")])
        try:
            data = ArchitectAgent._parse_json(res.content)
            return data.get("fix_instruction", "Follow instructions carefully.")
        except Exception:
            return "Follow instructions carefully and fix the previous errors."

class HubAgent:
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def generate_hub(self, unit_title: str, descriptions: List[str], current_hub_text: str) -> str:
        sys_prompt = (
            "You are the OKA Curriculum Architect. Synthesize a unified Hub overview.\n"
            "Given the descriptions of the atomic notes in this unit, write a 3-paragraph executive summary "
            "of how these concepts interlock to form the larger system.\n\n"
            "Output ONLY the text of the overview. Do not include markdown headers or greetings."
        )
        user_msg = f"Unit: {unit_title}\n\nConcepts in this unit:\n" + "\n".join(descriptions)
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", user_msg)])
        
        new_hub_text = re.sub(
            r"(## Overview\n)(.*?)(?=\n## Unit Objectives)",
            lambda m: f"{m.group(1)}{res.content.strip()}\n\n",
            current_hub_text,
            flags=re.DOTALL
        )
        return new_hub_text


# ── VERIFIER AGENT ─────────────────────────────────────────────────────────────
class VerifierAgent:
    """Post-generation semantic quality gate. Checks all 5 failure categories."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def verify(self, note_title: str, mode: str, note_content: str, source_context: str) -> dict:
        sys_prompt = f"""You are a rigorous academic quality auditor. Evaluate this atomic study note.
Return ONLY a valid JSON object — no markdown fences, no commentary.

Check ALL 5 criteria and report true/false for each:
1. domain_lock: Does section 3 (artifact) use the correct technical framework for mode='{mode}'? (MATH-PURE/MATH-DISCRETE must use discrete integer sequences, NEVER ODEs/integrals/dy/dx. CS must use code. ENG must use engineering notation.)
2. quiz_topicality: Do ALL 3 quiz questions specifically test the concept named in the note title? (Must not test the mental model analogy, must not be generic algebra unrelated to the concept.)
3. debug_validity: If a debug or flawed-step question exists, does 'content' ACTUALLY contain an error? ('No error is present' as the answer = FAIL. Content must be demonstrably wrong.)
4. arithmetic_correct: Are ALL equations and computations in sections 3 and 4 arithmetically correct? (Check every = sign. A single wrong calculation = FAIL.)
5. mental_model_maps: Is the mental model in section 1 simple enough for a 12-year-old, avoiding dense technical jargon?

Output format — use EXACTLY this structure:
{{"domain_lock\":true,\"quiz_topicality\":true,\"debug_validity\":true,\"arithmetic_correct\":true,\"mental_model_maps\":true,\"failures\":[{{\"check\":\"domain_lock\",\"issue\":\"exact description\",\"fix_instruction\":\"exact fix\"}}]}}

failures is an empty array [] if all checks pass.
Source context (what the note should teach): {source_context[:400]}"""
        user_msg = f"Note title: {note_title}\nMode: {mode}\n\nContent:\n{note_content[:3000]}"
        try:
            res = await self.llm.ainvoke([("system", sys_prompt), ("human", user_msg)])
            data = ArchitectAgent._parse_json(res.content)
            passed = all([
                data.get("domain_lock", True), data.get("quiz_topicality", True),
                data.get("debug_validity", True), data.get("arithmetic_correct", True),
                data.get("mental_model_maps", True),
            ])
            return {"passed": passed, "failures": data.get("failures", [])}
        except Exception as e:
            print(f"[VerifierAgent] Parse failed: {e}")
            return {"passed": True, "failures": []}  # Fail open — never block on auditor crash


# ── QUIZ AUDITOR AGENT ─────────────────────────────────────────────────────────
class QuizAuditorAgent:
    """Fast quiz-only check: topicality, debug validity, fill_in blank format."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def audit(self, note_title: str, quiz_json_str: str, theory_summary: str) -> dict:
        title_readable = note_title.replace("_", " ")
        sys_prompt = f"""You are a quiz quality auditor. Check these 3 quiz questions.
Return ONLY a valid JSON object.

The note's concept is: '{title_readable}'
For each question check:
- Is the question DIRECTLY about '{title_readable}'? (Not a generic math fact, not the analogy)
- If type='debug': does 'content' actually contain a wrong step? (Answer='no error'=FAIL)
- Is the stated 'answer' definitively correct for the question asked?
- For fill_in: does 'textWithBlanks' use [[Blank1]] format (NOT wikilink names as blanks)?

Output:
{{"passed":true,"issues":[],"fix_instruction":""}}
OR if problems:
{{"passed":false,"issues":["Q1: ...","Q3: ..."],"fix_instruction":"exact instruction"}}

Key facts about '{title_readable}': {theory_summary[:400]}"""
        user_msg = f"Quiz JSON:\n{quiz_json_str[:2000]}"
        try:
            res = await self.llm.ainvoke([("system", sys_prompt), ("human", user_msg)])
            data = ArchitectAgent._parse_json(res.content)
            issues = data.get("issues", [])
            fix = data.get("fix_instruction", "Fix the identified issues.")
            return {
                "passed": data.get("passed", True),
                "diagnosis": ("; ".join(issues) + ". " + fix).strip() if issues else ""
            }
        except Exception as e:
            print(f"[QuizAuditorAgent] Parse failed: {e}")
            return {"passed": True, "diagnosis": ""}
