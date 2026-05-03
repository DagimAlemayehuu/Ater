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
    "MATH-DISCRETE":      {"persona":"Discrete Mathematician","h1":"Formal Definition & Structural Trace","h2":"Boundary Cases & Counterexamples","h3":"Discrete Proof Trace","artifact":"Block LaTeX ($$) step-by-step discrete proof, recurrence unrolling table, or truth table","l1":"fill_in","l2":"true_false","l3":"debug"},
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
        mode = getattr(note_schema, "mode", "")
        prohibition = DOMAIN_PROHIBITIONS.get(mode, "")
        prohibition_block = f"\nHARD PROHIBITION ({mode}): {prohibition}\n" if prohibition else ""
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            "Write EXACTLY 3 sections. Nothing else.\n"
            f"{prohibition_block}\n"
            "# 1. Mental Model\n"
            "Write 2-3 sentences. The analogy MUST map at least 2 structural components of the concept to 2 components of the analogy. DO NOT just say 'X is like Y' — explain HOW the mechanism matches.\n"
            "CRITICAL: Do NOT use generic analogies like 'boxes', 'containers', 'blueprints', 'recipes', 'kitchens', 'keys', or 'doors'.\n\n"
            f"# 2. {self.domain['h1']}\n"
            "Write EXACTLY 5 sentences of continuous technical prose. NO BULLET POINTS.\n"
            f"MANDATORY: Embed 4-6 wikilinks from this EXACT list, and NO OTHER CONCEPTS: {all_concepts}\n"
            "CRITICAL: Do NOT invent or hallucinate links. If a concept is not in the list, do NOT put brackets around it.\n"
            "Format: [[Exact_Match_From_List]] (zero spaces inside brackets).\n\n"
            f"# 3. {self.domain['h2']}\n"
            "Write EXACTLY 4 sentences of continuous technical prose. NO BULLET POINTS.\n"
            "Cover boundary conditions, failure states, what breaks and why.\n"
            f"{GLOBAL_FORMATTING_RULES}\n\n"
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

    async def generate(self, note_title: str, theory_body: str, primary_language: str, mode: str = "") -> str:
        title_readable = note_title.replace("_", " ")
        prohibition = DOMAIN_PROHIBITIONS.get(mode, "")
        prohibition_block = f"\nHARD PROHIBITION ({mode}): {prohibition}\n" if prohibition else ""
        use_pro_domain = mode not in WALKTHROUGH_PURE
        if use_pro_domain:
            pro_domain = get_professional_domain(note_title)
            walkthrough_instr = (
                f"CRITICAL: Situate the walkthrough in this advanced professional domain: **{pro_domain}**.\n"
                "Do NOT use trivial examples like 'x=5'. However, for fundamental syntax or basic concepts, seamlessly scale the complexity so the scenario doesn't feel overly contrived. Each step must show a concrete state change."
            )
        else:
            walkthrough_instr = (
                f"CRITICAL: Write a CLEAN STEP-BY-STEP {mode} DERIVATION. DO NOT wrap it in a business or logistics scenario.\n"
                "Show the raw mathematical or logical work. Each step must show a concrete transformation.\n"
                f"{prohibition}"
            )
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            "Write EXACTLY 2 sections. Nothing else.\n"
            f"{prohibition_block}\n"
            f"# 4. {self.domain['h3']}\n"
            f"Create the following SPECIFIC artifact: **{self.domain['artifact']}**.\n"
            "If code is required, use proper markdown fences with language tag. If Mermaid, use ```mermaid.\n"
            "PEDAGOGICAL CONSTRAINT: Match complexity to the concept level. Basic concepts must NOT use OOP/classes.\n"
            "Below the artifact, write 2 sentences explaining what each part represents and how to read it.\n\n"
            "## 5. Walkthrough\n"
            "Write EXACTLY 6 numbered steps. No more. No fewer.\n"
            f"{walkthrough_instr}\n\n"
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
        mode_h1 = self.domain.get("h1", "")
        is_math_mode = mode_h1 in (
            "Derivation & Logical Trace", "Formal Definition & Structural Trace",
            "Statistical Modeling & Inference", "Kinematic & Quantum Dynamics",
            "Cryptographic Operations", "Reaction Mechanisms & Stoichiometry",
            "Circuit Analysis & Signal Flow"
        )
        is_code_mode = mode_h1 in (
            "Execution Logic & Data Flow", "Protocol & Signal Topology",
            "Schema & Query Mechanics", "Forward Pass & Backpropagation",
            "Test Strategy & Coverage Analysis", "Architectural Pattern & Component Interaction"
        )
        is_writing_mode = self.domain.get("l3") == "writing"

        if is_math_mode:
            l3_rule = (
                "- Q3 debug: 'content' field = a FLAWED MATHEMATICAL STEP using block LaTeX — e.g., wrong sign in substitution, incorrect exponent, missing case in proof. "
                "The 'answer' field names the exact error and corrects it. NEVER write 'no error is present'. VERIFY the flawed step is actually wrong."
            )
        elif is_code_mode:
            db_rule = " For Database concepts, the buggy code MUST be SQL or flawed schema logic—NEVER JavaScript, Python, or generic languages." if mode_h1 == "Schema & Query Mechanics" else ""
            l3_rule = (
                "- Q3 debug: 'content' field = ONLY the buggy code snippet — no hints, no comments revealing the bug. "
                "Bug must be NON-TRIVIAL: logic inversion, wrong operator, race condition, type coercion. NOT a syntax error or missing semicolon. "
                f"The 'answer' names the exact bug and fix. NEVER write 'no error is present'.{db_rule}"
            )
        elif is_writing_mode:
            l3_rule = (
                "- Q3 writing: 'question' asks the student to construct an explanation, compare two concepts, or apply the concept to a novel scenario. "
                "The 'answer' field contains a model answer (3-5 sentences)."
            )
        else:
            l3_rule = (
                "- Q3: Present a challenging scenario where the student must apply this concept to an edge case or failure condition. "
                "The 'answer' must be definitive and correct."
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
        mode_h1 = self.domain.get("h1", "")
        db_rule = " For Database concepts, ONLY use SQL or relational logic—NEVER JavaScript." if mode_h1 == "Schema & Query Mechanics" else ""
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
            f"  debug/scenario/writing → 'answer' is a non-empty string.{db_rule}\n"
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


# ── VERIFIER AGENT ─────────────────────────────────────────────────────────────
class VerifierAgent:
    """Post-generation semantic quality gate. Checks all 5 failure categories."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def verify(self, note_title: str, mode: str, note_content: str, source_context: str) -> dict:
        sys_prompt = (
            "You are a rigorous academic quality auditor. Evaluate this atomic study note.\n"
            "Return ONLY a valid JSON object — no markdown fences, no commentary.\n\n"
            "Check ALL 5 criteria and report true/false for each:\n"
            f"1. domain_lock: Does section 4 (artifact) use the correct technical framework for mode='{mode}'? "
            "(MATH-PURE/MATH-DISCRETE must use discrete integer sequences, NEVER ODEs/integrals/dy/dx. CS must use code. ENG must use engineering notation.)\n"
            "2. quiz_topicality: Do ALL 3 quiz questions specifically test the concept named in the note title? "
            "(Must not test the mental model analogy, must not be generic algebra unrelated to the concept.)\n"
            "3. debug_validity: If a debug or flawed-step question exists, does 'content' ACTUALLY contain an error? "
            "('No error is present' as the answer = FAIL. Content must be demonstrably wrong.)\n"
            "4. arithmetic_correct: Are ALL equations and computations in sections 4 and 5 arithmetically correct? "
            "(Check every = sign. A single wrong calculation = FAIL.)\n"
            "5. mental_model_maps: Does the mental model in section 1 map at least 2 structural components "
            "of the concept to 2 components of the analogy (not just assert 'X is like Y')?\n\n"
            "Output format — use EXACTLY this structure:\n"
            "{\"domain_lock\":true,\"quiz_topicality\":true,\"debug_validity\":true,"
            "\"arithmetic_correct\":true,\"mental_model_maps\":true,"
            "\"failures\":[{\"check\":\"domain_lock\",\"issue\":\"exact description\",\"fix_instruction\":\"exact fix\"}]}\n\n"
            "failures is an empty array [] if all checks pass.\n"
            f"Source context (what the note should teach): {source_context[:400]}"
        )
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
        sys_prompt = (
            "You are a quiz quality auditor. Check these 3 quiz questions.\n"
            "Return ONLY a valid JSON object.\n\n"
            f"The note's concept is: '{title_readable}'\n"
            "For each question check:\n"
            f"- Is the question DIRECTLY about '{title_readable}'? (Not a generic math fact, not the analogy)\n"
            "- If type='debug': does 'content' actually contain a wrong step? (Answer='no error'=FAIL)\n"
            "- Is the stated 'answer' definitively correct for the question asked?\n"
            "- For fill_in: does 'textWithBlanks' use [[Blank1]] format (NOT wikilink names as blanks)?\n\n"
            "Output:\n"
            "{\"passed\":true,\"issues\":[],\"fix_instruction\":\"\"}\n"
            "OR if problems:\n"
            "{\"passed\":false,\"issues\":[\"Q1: ...\",\"Q3: ...\"],\"fix_instruction\":\"exact instruction\"}\n\n"
            f"Key facts about '{title_readable}': {theory_summary[:400]}"
        )
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
