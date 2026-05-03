import json
import re
import asyncio
import hashlib
from typing import Any, Dict, List
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import NoteContent, PartialPlan, ProbeEnrichment

# ── DOMAIN MATRIX v26.1 (UPGRADED) ───────────────────────────────────────────
DOMAIN_MATRIX = {
    "CS-SOFTWARE":        {"persona":"Principal Software Engineer","h1":"Execution Logic & Data Flow","h2":"Edge Cases & Failure States","h3":"Implementation Mechanics","artifact":"Executable code block (use primary_language) + Mermaid flowchart of state changes","l1":"fill_in","l2":"true_false","l3":"debug"},
    "CS-SYSTEMS":         {"persona":"Systems Architect","h1":"Protocol & Signal Topology","h2":"Bottlenecks & Partition Failures","h3":"Architecture Topology","artifact":"Mermaid sequence diagram with actors and async messages","l1":"mcq","l2":"scenario","l3":"debug"},
    "CS-DB":              {"persona":"Database Administrator","h1":"Schema & Query Mechanics","h2":"ACID Violations & Scaling Limits","h3":"Entity-Relationship Model","artifact":"Mermaid erDiagram showing 1:N and M:N entity relationships","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-AI":              {"persona":"Machine Learning Engineer","h1":"Forward Pass & Backpropagation","h2":"Overfitting & Dimensionality","h3":"Model Architecture","artifact":"Mermaid flowchart (LR) or Markdown advanced matrix table of hyperparameters","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "CS-TESTING":         {"persona":"QA Lead Engineer","h1":"Test Strategy & Coverage Analysis","h2":"Defect Taxonomy & Regression Risk","h3":"Test Case Matrix","artifact":"Advanced Markdown table: Test ID | Inputs | Expected | Actual | Status","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-ARCH":            {"persona":"Principal Architect","h1":"Architectural Pattern & Component Interaction","h2":"Coupling Failures & Scalability Walls","h3":"Component Diagram","artifact":"Mermaid classDiagram or component stateDiagram-v2","l1":"mcq","l2":"scenario","l3":"writing"},
    "CS-REQUIREMENTS":    {"persona":"Requirements Engineer","h1":"Requirement Elicitation & Specification","h2":"Ambiguity Failures & Scope Creep","h3":"Requirements Traceability Matrix","artifact":"Requirements traceability Markdown matrix","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-PURE":          {"persona":"Formal Logician","h1":"Derivation & Logical Trace","h2":"Theorem Constraints & Incompleteness","h3":"Formal Proof Trace","artifact":"Block LaTeX ($$) step-by-step formal mathematical derivation","l1":"mcq","l2":"fill_in","l3":"debug"},
    "MATH-STAT":          {"persona":"Data Scientist","h1":"Statistical Modeling & Inference","h2":"Confounding Variables & Bias","h3":"Probability Distribution","artifact":"Markdown probability table AND block LaTeX ($$) equation","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-CRYPTO":        {"persona":"Cryptographer","h1":"Cryptographic Operations","h2":"Collision Vulnerabilities & Brute Force","h3":"Hash Sequence Trace","artifact":"Hash sequence data structure table","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "PHYSICS-KINEMATICS": {"persona":"Theoretical Physicist","h1":"Kinematic & Quantum Dynamics","h2":"Entropy & Boundary Limits","h3":"Physical Force Model","artifact":"Block LaTeX equations ($$) + ASCII free-body diagram","l1":"fill_in","l2":"scenario","l3":"writing"},
    "CHEMISTRY":          {"persona":"Chemist","h1":"Reaction Mechanisms & Stoichiometry","h2":"Equilibrium Shifts & Catalytic Decay","h3":"Molecular Pathway","artifact":"Mermaid graph TD of reaction pathway + Inline LaTeX ($)","l1":"mcq","l2":"scenario","l3":"debug"},
    "BIOLOGY":            {"persona":"Biologist","h1":"Biochemical Pathways","h2":"Genetic Drift & Environmental Collapse","h3":"Metabolic Map","artifact":"Mermaid flowchart (TD) of metabolic pathway","l1":"true_false","l2":"scenario","l3":"writing"},
    "ENG-MECH":           {"persona":"Mechanical Engineer","h1":"Kinematic Linkages & Load Transfer","h2":"Yield Strengths & Fatigue Limits","h3":"Load Tolerance Specs","artifact":"Advanced Markdown load-bearing tolerance matrix","l1":"fill_in","l2":"scenario","l3":"debug"},
    "ENG-ELEC":           {"persona":"Circuit Designer","h1":"Circuit Analysis & Signal Flow","h2":"Thermal Throttling & Impedance Mismatch","h3":"Logic Gate Trace","artifact":"Boolean logic truth table (Markdown) + Inline LaTeX","l1":"true_false","l2":"scenario","l3":"debug"},
    "MED-PHYSIO":         {"persona":"Attending Surgeon","h1":"Systemic Function & Homeostasis","h2":"Pathological Failure & Necrosis","h3":"Spatial Adjacency Model","artifact":"Spatial adjacency matrix table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "MED-PHARMA":         {"persona":"Toxicologist","h1":"Pharmacokinetics & Mechanism of Action","h2":"Toxicity Thresholds & Contraindications","h3":"Pharmacokinetic Pathway","artifact":"Mermaid stateDiagram-v2 of PK pathway","l1":"mcq","l2":"scenario","l3":"debug"},
    "ECON-MACRO":         {"persona":"Macroeconomist","h1":"Market Dynamics & Capital Flow","h2":"Market Failures & Externalities","h3":"Macro Flowchart","artifact":"Mermaid graph LR of supply-demand or macro flow","l1":"true_false","l2":"scenario","l3":"writing"},
    "ECON-FINANCE":       {"persona":"Comptroller","h1":"Cash Flow Mechanics & Valuation","h2":"Liquidity Crunches & Solvency Risk","h3":"Financial Ledger","artifact":"Advanced Markdown T-account ledger table","l1":"true_false","l2":"scenario","l3":"debug"},
    "BIZ-STRATEGY":       {"persona":"Corporate Strategist","h1":"Go-to-Market Execution & Supply Chain","h2":"Strategic Moat Vulnerabilities","h3":"Value Chain Framework","artifact":"Mermaid mindmap or SWOT matrix table","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CASE":           {"persona":"Appellate Litigator","h1":"Ratio Decidendi (Legal Trace)","h2":"Appellate Reversals & Jurisdictional Limits","h3":"Precedent Analysis","artifact":"Advanced IRAC (Issue, Rule, Application, Conclusion) mapping table","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CONTRACT":       {"persona":"Corporate Lawyer","h1":"Obligation Mechanics & Fulfillment","h2":"Breach Conditions & Liability Triggers","h3":"Condition-Result Model","artifact":"Condition-result dependency matrix table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "HIST-CATALYST":      {"persona":"Historical Archivist","h1":"Chronological Catalysts & Execution","h2":"Multi-Generational Fallout","h3":"Causality Timeline","artifact":"Mermaid gantt chart with precise temporal annotations","l1":"fill_in","l2":"scenario","l3":"writing"},
    "PHILOSOPHY":         {"persona":"Philosopher","h1":"Dialectical Progression","h2":"Logical Fallacies & Existential Paradoxes","h3":"Dialectical Map","artifact":"Mermaid flowchart (TD) of dialectical reasoning","l1":"mcq","l2":"scenario","l3":"writing"},
    "PSYCH-SOCIOLOGY":    {"persona":"Behavioral Researcher","h1":"Behavioral Triggers & Societal Shift","h2":"Cognitive Bias & Systemic Erosion","h3":"Cognitive Map","artifact":"Advanced Markdown matrix of cognitive biases","l1":"true_false","l2":"scenario","l3":"writing"},
    "LANG-LINGUISTICS":   {"persona":"Grammarian","h1":"Morphological Transformation","h2":"Semantic Ambiguity & Exceptions","h3":"Syntactical Tree","artifact":"Mermaid graph TD of syntactical parsing tree","l1":"mcq","l2":"fill_in","l3":"writing"},
    "LANG-LIT":           {"persona":"Literary Critic","h1":"Narrative Arc & Rhetorical Execution","h2":"Thematic Subversion & Unreliable Narrators","h3":"Motif Matrix","artifact":"Thematic motif correlation matrix (Markdown)","l1":"mcq","l2":"fill_in","l3":"writing"},
    "ARTS-DESIGN":        {"persona":"Creative Director","h1":"Medium Mechanics & Composition","h2":"Perceptual Dissonance & Rule Breaking","h3":"Design Primitives","artifact":"Design system component matrix table","l1":"mcq","l2":"scenario","l3":"writing"},
    "SKILLS-HARD":        {"persona":"Master Craftsman","h1":"Step-by-Step Execution Sequence","h2":"Troubleshooting & Critical Failure Points","h3":"Process Blueprint","artifact":"Mermaid flowchart of standard operating procedure","l1":"fill_in","l2":"scenario","l3":"writing"},
    "SKILLS-FITNESS":     {"persona":"Kinesiologist","h1":"Biomechanical Execution & Metabolism","h2":"Overtraining Vectors & Injury","h3":"Kinematic Trace","artifact":"Kinematic sequence/force transfer table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "EDUCATION":          {"persona":"Pedagogical Expert","h1":"Learning Theory & Instructional Design","h2":"Cognitive Load & Knowledge Gaps","h3":"Curriculum Framework","artifact":"Mermaid graph TD of learning objective hierarchy","l1":"fill_in","l2":"scenario","l3":"writing"},
    "RESEARCH-METHODS":   {"persona":"Research Methodologist","h1":"Research Design & Data Collection","h2":"Validity Threats & Confounds","h3":"Research Framework","artifact":"Advanced research design validity matrix","l1":"mcq","l2":"scenario","l3":"writing"},
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
            "   **CRITICAL**: If the text contains formal math, discrete math, calculus, recurrence relations, algebra, or proofs, YOU MUST USE `MATH-PURE` or `MATH-STAT`. DO NOT use CS-SOFTWARE for mathematics!\n"
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
                        print(f"[ArchitectAgent] Structured output failed: {e}. Falling back.")

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
        start, end = clean.find("{"), clean.rfind("}")
        if start == -1 or end == -1: raise ValueError("No JSON object in response")
        return json.loads(clean[start:end+1], strict=False)

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
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            "Write EXACTLY 3 sections. Nothing else.\n\n"
            "# 1. Mental Model\n"
            "Write 2-3 sentences. Use a SPECIFIC, UNCOMMON real-world professional analogy (e.g., aviation, logistics, medicine, astrophysics).\n"
            "CRITICAL: Do NOT use generic analogies like 'boxes', 'containers', 'blueprints', 'recipes', 'kitchens', 'keys', or 'doors'.\n\n"
            f"# 2. {self.domain['h1']}\n"
            "Write EXACTLY 5 sentences of continuous technical prose. NO BULLET POINTS.\n"
            f"MANDATORY: Embed 4-6 wikilinks from this EXACT list, and NO OTHER CONCEPTS: {all_concepts}\n"
            "CRITICAL: Do NOT invent, guess, or hallucinate links. If a word isn't in the list, DO NOT put brackets around it.\n"
            "Format: [[Exact_Match_From_List]] (zero spaces inside brackets).\n\n"
            f"# 3. {self.domain['h2']}\n"
            "Write EXACTLY 4 sentences of continuous technical prose. NO BULLET POINTS.\n"
            "Cover boundary conditions, failure states, what breaks and why.\n"
            "MANDATORY: Embed 3-5 wikilinks from the EXACT list above.\n\n"
            f"Concept: {title_readable}\n"
            f"Source context: {source_text[:1500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the theory sections.")])
        return res.content.strip()

    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            f"PREVIOUS ATTEMPT FAILED. FIX INSTRUCTION: {diagnosis}\n\n"
            "Write EXACTLY 3 sections. Nothing else. Ensure zero bullet points in sections 2 and 3.\n\n"
            "# 1. Mental Model\n"
            "Write 2-3 sentences. Vivid, specific professional analogy (No kitchens or boxes).\n\n"
            f"# 2. {self.domain['h1']}\n"
            "Write EXACTLY 5 sentences of continuous technical prose.\n"
            f"MANDATORY: embed 4-6 [[Wikilinks]] from this STRICT list ONLY: {all_concepts}\n"
            "Format: [[Exact_Match_From_List]]\n\n"
            f"# 3. {self.domain['h2']}\n"
            "Write EXACTLY 4 sentences. Cover boundary conditions.\n"
            "MANDATORY: embed 3-5 [[Wikilinks]] from the list ONLY.\n\n"
            f"Concept: {title_readable}\n"
            f"Source context: {source_text[:1500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected theory sections.")])
        return res.content.strip()

class PractitionerAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate(self, note_title: str, theory_body: str, primary_language: str) -> str:
        title_readable = note_title.replace("_", " ")
        pro_domain = get_professional_domain(note_title)
        
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            "Write EXACTLY 2 sections. Nothing else.\n\n"
            f"# 4. {self.domain['h3']}\n"
            f"Create the following SPECIFIC artifact: **{self.domain['artifact']}**.\n"
            "If code is required, use proper markdown fences with language tag. If Mermaid, use ```mermaid.\n"
            "PEDAGOGICAL CONSTRAINT: Keep the syntax and complexity strictly appropriate for the concept being taught! If the concept is basic (e.g., 'Variables', 'Arithmetic'), DO NOT write complex Object-Oriented code with Classes or Enums. Represent the professional domain using only the syntax features relevant to the current concept.\n"
            "Below the artifact, write 2 sentences ONLY explaining what each part represents and how to read it.\n\n"
            "## 5. Walkthrough\n"
            "Write EXACTLY 6 numbered steps. No more. No fewer.\n"
            f"CRITICAL: The walkthrough MUST be heavily situated in this advanced professional domain: **{pro_domain}**.\n"
            "Do NOT use trivial examples like 'x=5'. Use domain-specific terminology but keep the actual technical mechanics grounded in the concept's difficulty level.\n"
            "Each step must show a concrete state change or execution step.\n\n"
            f"Concept: {title_readable}\n"
            f"Theory context: {theory_body[:600]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the artifact and walkthrough.")])
        return res.content.strip()

    async def retry(self, note_title: str, theory_body: str, primary_language: str, diagnosis: str) -> str:
        title_readable = note_title.replace("_", " ")
        pro_domain = get_professional_domain(note_title)
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            f"PREVIOUS ATTEMPT FAILED. FIX: {diagnosis}\n\n"
            "Write EXACTLY 2 sections.\n\n"
            f"# 4. {self.domain['h3']}\n"
            f"Create: **{self.domain['artifact']}**. Use correct markdown fences.\n"
            "CONSTRAINT: Match code complexity to the concept! No classes/OOP for basic concepts.\n"
            "Below the artifact, write 2 sentences explaining it.\n\n"
            "## 5. Walkthrough\n"
            f"Write EXACTLY 6 numbered steps set in **{pro_domain}**. Show concrete state changes without overcomplicating the syntax.\n\n"
            f"Concept: {title_readable}\n"
            f"Theory context: {theory_body[:600]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected artifact and walkthrough.")])
        return res.content.strip()

class ExaminerAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate(self, note_title: str, theory_summary: str, primary_language: str) -> str:
        title_readable = note_title.replace("_", " ")
        is_math = self.domain.get("h1", "") in ("Derivation & Logical Trace", "Statistical Modeling & Inference", "Kinematic & Quantum Dynamics", "Cryptographic Operations")

        l3_rule = (
            "- Q3 debug: 'content' field = a FLAWED MATHEMATICAL STEP using LaTeX (e.g. wrong exponent, incorrect root substitution, missing case). NOT code. The 'answer' field explains the algebraic/logical error."
            if is_math else
            "- Q3 debug: 'content' field = ONLY the buggy code, no hints. Bug must be NON-TRIVIAL (logic inversion, wrong operator, race condition). NOT an off-by-one loop or syntax error."
        )

        sys_prompt = (
            "Output a VALID JSON array of exactly 3 quiz questions. No markdown fences. Just the raw array.\n\n"
            "MANDATORY SCHEMA — copy these field names EXACTLY for each type:\n"
            '  mcq:      {"id":"q1","type":"mcq","difficulty":"L1","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"B","explanation":"..."}\n'
            '  fill_in:  {"id":"q1","type":"fill_in","difficulty":"L1","question":"...","textWithBlanks":"The [[Blank1]] is...","answer":["word"],"explanation":"..."}\n'
            '  true_false:{"id":"q2","type":"true_false","difficulty":"L2","question":"...","answer":false,"explanation":"..."}\n'
            '  debug:    {"id":"q3","type":"debug","difficulty":"L3","question":"Find the error.","content":"...only buggy code or flawed step...","answer":"The bug is...","explanation":"..."}\n'
            '  scenario: {"id":"q2","type":"scenario","difficulty":"L2","question":"Given that... what happens?","answer":"...","explanation":"..."}\n'
            '  writing:  {"id":"q3","type":"writing","difficulty":"L3","question":"Explain how...","answer":"...","explanation":"..."}\n\n'
            f"Generate 3 questions using EXACTLY these types:\n"
            f"Q1: type=\"{self.domain['l1']}\", difficulty=\"L1\" — Tests CORE CONCEPT DEFINITION only. Do NOT quiz the mental model analogy.\n"
            f"Q2: type=\"{self.domain['l2']}\", difficulty=\"L2\" — Tests application to a non-obvious edge case.\n"
            f"Q3: type=\"{self.domain['l3']}\", difficulty=\"L3\" — Hardest.\n"
            f"{l3_rule}\n\n"
            "CRITICAL — THE 'answer' FIELD IS REQUIRED IN EVERY QUESTION. NEVER OMIT IT:\n"
            "  mcq → answer must be the exact letter ('A', 'B', 'C', or 'D') OR the exact option text.\n"
            "  fill_in → answer must be a JSON array of strings, e.g. [\"word\"].\n"
            "  true_false → answer must be bare boolean: true or false. NO QUOTES.\n"
            "  debug/scenario/writing → answer must be a non-empty string.\n\n"
            "JSON ESCAPING: double-escape LaTeX (\\\\frac not \\frac). No unescaped double-quotes inside string values.\n\n"
            f"Concept: {title_readable}\n"
            f"Key facts: {theory_summary[:500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Output the 3-question JSON array.")])
        return res.content.strip()

    async def retry(self, note_title: str, theory_summary: str, primary_language: str, diagnosis: str) -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = (
            "PREVIOUS JSON FAILED. Output a VALID JSON array of exactly 3 quiz questions. No fences. Just the array.\n"
            f"FIX INSTRUCTION: {diagnosis}\n\n"
            f"Q1: type=\"{self.domain['l1']}\" — MUST have 'answer' field.\n"
            f"Q2: type=\"{self.domain['l2']}\" — MUST have 'answer' field.\n"
            f"Q3: type=\"{self.domain['l3']}\" — MUST have 'answer' field.\n\n"
            "SCHEMA REMINDERS (the 'answer' field is mandatory in ALL questions):\n"
            "  mcq → needs 'options' (4-item array) AND 'answer' (letter like 'B').\n"
            "  fill_in → needs 'textWithBlanks' AND 'answer' (list of strings, e.g. ['word']).\n"
            "  true_false → 'answer' is bare boolean true or false. NO QUOTES.\n"
            "  debug/scenario/writing → 'answer' is a non-empty string.\n"
            "Escape all LaTeX with double backslashes. Do not quiz the mental model analogy.\n\n"
            f"Concept: {title_readable}\n"
            f"Key facts: {theory_summary[:500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Output the corrected JSON quiz.")])
        return res.content.strip()

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
        except:
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

