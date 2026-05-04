import json
import re
import asyncio
import hashlib
from typing import Any, Dict, List
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import PartialPlan

# ── DOMAIN MATRIX v26.1 (UPGRADED) ───────────────────────────────────────────
DOMAIN_MATRIX = {
    "CS-SOFTWARE":        {"persona":"Software Engineer","h1":"How it Works","h2":"Common Pitfalls","artifact":"Code Example","type":"Executable code block (under 20 lines)","question_modes":["fill_in", "true_false", "debug", "trace"]},
    "CS-SYSTEMS":         {"persona":"Systems Architect","h1":"System Flow","h2":"Where it Breaks","artifact":"Architecture Diagram","type":"Basic Mermaid flowchart (graph TD/LR)","question_modes":["mcq", "scenario", "debug", "order"]},
    "CS-DB":              {"persona":"Database Admin","h1":"Query Logic","h2":"Data Integrity","artifact":"Database Schema","type":"SQL code block or Markdown Table","question_modes":["true_false", "scenario", "debug", "matching"]},
    "CS-AI":              {"persona":"Machine Learning Eng.","h1":"Model Mechanics","h2":"Overfitting & Bias","artifact":"Data Pipeline","type":"Basic Mermaid flowchart or Python code","question_modes":["mcq", "fill_in", "scenario", "trace"]},
    "CS-TESTING":         {"persona":"QA Engineer","h1":"Test Strategy","h2":"Edge Cases","artifact":"Test Scenario","type":"Code block (assertions) or Markdown Table","question_modes":["true_false", "scenario", "debug", "synthesis"]},
    "CS-ARCH":            {"persona":"Software Architect","h1":"Design Pattern","h2":"Trade-offs","artifact":"Component Diagram","type":"Basic Mermaid flowchart or Markdown Table","question_modes":["mcq", "scenario", "writing", "order"]},
    "CS-REQUIREMENTS":    {"persona":"Product Manager","h1":"Goal Definition","h2":"Scope Creep","artifact":"Requirements Table","type":"Markdown Table (max 3 columns)","question_modes":["true_false", "scenario", "writing", "matching"]},
    "MATH-PURE":          {"persona":"Mathematician","h1":"Formal Definition","h2":"Proof Strategy","artifact":"Mathematical Proof","type":"Block LaTeX ($$)","question_modes":["mcq", "fill_in", "debug", "synthesis"]},
    "MATH-STAT":          {"persona":"Statistician","h1":"Statistical Concept","h2":"Common Biases","artifact":"Data Distribution","type":"Block LaTeX ($$) or Markdown Table","question_modes":["true_false", "scenario", "writing", "trace"]},
    "MATH-CRYPTO":        {"persona":"Cryptographer","h1":"Encryption Logic","h2":"Vulnerabilities","artifact":"Cryptographic Flow","type":"Markdown Table or Code snippet","question_modes":["mcq", "fill_in", "scenario", "trace"]},
    "MATH-DISCRETE":      {"persona":"Logic Professor","h1":"Discrete Definition","h2":"Base Cases","artifact":"Logical Trace","type":"Truth Table (Markdown) or block LaTeX","question_modes":["fill_in", "true_false", "debug", "order"]},
    "PHYSICS-KINEMATICS": {"persona":"Physicist","h1":"Physical Law","h2":"Boundaries & Limits","artifact":"Formula & Diagram","type":"Block LaTeX ($$) and ASCII Diagram","question_modes":["fill_in", "scenario", "writing", "trace"]},
    "CHEMISTRY":          {"persona":"Chemist","h1":"Reaction Mechanism","h2":"Equilibrium","artifact":"Reaction Pathway","type":"Basic Mermaid flowchart or Block LaTeX","question_modes":["mcq", "scenario", "debug", "order"]},
    "BIOLOGY":            {"persona":"Biologist","h1":"Biological Process","h2":"System Failures","artifact":"Pathway Diagram","type":"Basic Mermaid flowchart (graph TD)","question_modes":["true_false", "scenario", "writing", "matching"]},
    "ENG-MECH":           {"persona":"Mechanical Engineer","h1":"Mechanical Principle","h2":"Load & Fatigue","artifact":"Force Diagram","type":"ASCII Diagram or Markdown Table","question_modes":["fill_in", "scenario", "debug", "order"]},
    "ENG-ELEC":           {"persona":"Circuit Designer","h1":"Circuit Logic","h2":"Resistance & Heat","artifact":"Circuit Schematic","type":"Truth Table (Markdown) or block LaTeX","question_modes":["true_false", "scenario", "debug", "trace"]},
    "MED-PHYSIO":         {"persona":"Surgeon","h1":"Bodily Function","h2":"Disease & Failure","artifact":"System Map","type":"Markdown Adjacency Matrix Table","question_modes":["fill_in", "scenario", "writing", "matching"]},
    "MED-PHARMA":         {"persona":"Toxicologist","h1":"Drug Mechanism","h2":"Side Effects","artifact":"Interaction Pathway","type":"Markdown Table or Basic Mermaid flowchart","question_modes":["mcq", "scenario", "debug", "matching"]},
    "ECON-MACRO":         {"persona":"Macroeconomist","h1":"Economic Theory","h2":"Market Failures","artifact":"Economic Model","type":"Basic Mermaid flowchart (graph LR)","question_modes":["true_false", "scenario", "writing", "order", "trace"]},
    "ECON-FINANCE":       {"persona":"Accountant","h1":"Financial Concept","h2":"Financial Risk","artifact":"Ledger Example","type":"Markdown T-Account/Ledger Table","question_modes":["true_false", "scenario", "debug", "matching"]},
    "BIZ-STRATEGY":       {"persona":"Business Strategist","h1":"Strategic Concept","h2":"Weaknesses","artifact":"Strategy Matrix","type":"Markdown Table (SWOT)","question_modes":["mcq", "scenario", "writing", "synthesis"]},
    "LAW-CASE":           {"persona":"Lawyer","h1":"Legal Principle","h2":"Exceptions & Limits","artifact":"Case Application","type":"IRAC Framework Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "LAW-CONTRACT":       {"persona":"Corporate Lawyer","h1":"Contract Rule","h2":"Breach Conditions","artifact":"Liability Map","type":"Markdown Dependency Table","question_modes":["fill_in", "scenario", "writing", "matching"]},
    "HIST-CATALYST":      {"persona":"Historian","h1":"Historical Event","h2":"Long-term Impact","artifact":"Timeline","type":"Basic Mermaid flowchart (graph TD) or Table","question_modes":["fill_in", "scenario", "writing", "order"]},
    "PHILOSOPHY":         {"persona":"Philosopher","h1":"Core Argument","h2":"Counter-Arguments","artifact":"Logical Flow","type":"ASCII Logic Tree or Block quote","question_modes":["mcq", "scenario", "writing", "synthesis"]},
    "PSYCH-SOCIOLOGY":    {"persona":"Psychologist","h1":"Behavioral Concept","h2":"Cognitive Bias","artifact":"Behavior Map","type":"Markdown Matrix Table","question_modes":["true_false", "scenario", "writing", "matching"]},
    "LANG-LINGUISTICS":   {"persona":"Grammarian","h1":"Grammar Rule","h2":"Exceptions","artifact":"Syntax Tree","type":"ASCII Syntax Tree","question_modes":["mcq", "fill_in", "writing", "order"]},
    "LANG-LIT":           {"persona":"Literary Critic","h1":"Literary Device","h2":"Thematic Impact","artifact":"Textual Analysis","type":"Markdown Quote/Motif Table","question_modes":["mcq", "fill_in", "writing", "synthesis"]},
    "ARTS-DESIGN":        {"persona":"Designer","h1":"Design Principle","h2":"Breaking the Rule","artifact":"Composition Matrix","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "SKILLS-HARD":        {"persona":"Master Craftsman","h1":"Core Technique","h2":"Troubleshooting","artifact":"Execution Steps","type":"Basic Mermaid flowchart or Numbered list","question_modes":["fill_in", "scenario", "writing", "order"]},
    "SKILLS-FITNESS":     {"persona":"Kinesiologist","h1":"Biomechanics","h2":"Injury Prevention","artifact":"Movement Trace","type":"Markdown Kinematic Table","question_modes":["fill_in", "scenario", "writing", "trace"]},
    "EDUCATION":          {"persona":"Teacher","h1":"Learning Theory","h2":"Knowledge Gaps","artifact":"Curriculum Flow","type":"Markdown Table","question_modes":["fill_in", "scenario", "writing", "matching"]},
    "RESEARCH-METHODS":   {"persona":"Researcher","h1":"Research Method","h2":"Validity Threats","artifact":"Methodology Setup","type":"Markdown Research Matrix","question_modes":["mcq", "scenario", "writing", "matching"]},
}

# ── GOLD STANDARD DOMAIN INSTRUCTIONS (v26.5) ───────────────────────────────────
# These are discipline-specific "Perfect Outcome" few-shot constraints.
DOMAIN_SPECIFIC_INSTRUCTIONS = {
    "ECON-MACRO": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Aggregate_Demand]] is the total demand for final goods and services in an economy at a given time. It consists of consumption, investment, government spending, and net exports ($$AD = C + I + G + (X - M)$$). The underlying mechanism follows the wealth effect and interest rate effect, where price level changes shift real wealth and investment demand inversely."

EXAMPLE OF MASTER-LEVEL EDGE (#5):
"The model fails during stagflation (simultaneous high inflation and unemployment) where traditional demand-side interventions exacerbate the crisis. It also ignores the 'Paradox of Thrift' where individual saving reduces aggregate output during recessions."
""",
    "CS-SOFTWARE": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Recursion]] is a programming technique where a function calls itself to solve a smaller instance of the same problem. The mechanism relies on a 'Stack Frame' to store local variables and return addresses, terminating only when the 'Base Case' is reached to prevent a StackOverflowError."

EXAMPLE OF MASTER-LEVEL ARTIFACT (#3):
```python
def fibonacci(n):
    # Professional Domain: Telecommunications (Network Hop Calculation)
    if n <= 1: return n
    return fibonacci(n-1) + fibonacci(n-2)
```
""",
    "MATH-DISCRETE": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Mathematical_Induction]] is a proof technique for proving a property $P(n)$ holds for all natural numbers. The mechanism involves two steps: the 'Base Case' proving $P(0)$ is true, and the 'Inductive Step' proving that if $P(k)$ is true, then $P(k+1)$ must also be true, creating a logical chain reaction."

EXAMPLE OF MASTER-LEVEL EDGE (#5):
"Induction fails if the base case is not properly established (e.g., trying to prove a property of primes starting at 1). It is also insufficient for proving properties of uncountable sets where cardinality exceeds the set of natural numbers."
""",
    "PHYSICS-KINEMATICS": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Velocity]] is the rate of change of displacement with respect to time ($$v = \\frac{dx}{dt}$$). Unlike speed, it is a vector quantity, meaning it has both magnitude and direction. In a professional Aerospace context, velocity vectors are critical for orbital insertion calculations where a 1% error in magnitude results in mission failure."

EXAMPLE OF MASTER-LEVEL ARTIFACT (#3):
$$v_f = v_i + at$$
$$x_f = x_i + v_i t + \\frac{1}{2}at^2$$
""",
    "ENG-ELEC": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Ohms_Law]] states that the current through a conductor between two points is directly proportional to the voltage across the two points ($$V = IR$$). In high-frequency PCB design, this relationship is constrained by trace impedance and thermal dissipation limits, where excess current leads to 'thermal runaway'."

EXAMPLE OF MASTER-LEVEL EDGE (#5):
"Ohm's Law fails at high frequencies due to the skin effect, where current flows only on the surface of the conductor, significantly increasing effective resistance. It also breaks down in non-ohmic materials like semiconductors."
""",
    "CHEMISTRY": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Enthalpy]] ($$H$$) is a measure of the total heat content of a system. The change in enthalpy ($$\\Delta H$$) during a reaction indicates whether it is exothermic (negative) or endothermic (positive) ($$\\Delta H = H_{products} - H_{reactants}$$)."
""",
    "PHILOSOPHY": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Categorical_Imperative]] is the central philosophical concept in the deontological moral philosophy of Immanuel Kant. It represents an unconditional moral obligation that is binding in all circumstances and is not dependent on a person's inclination or purpose. The mechanism relies on 'Universalizability', where an action is only moral if its maxim could be willed as a universal law."
""",
    "LAW-CASE": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Duty_Of_Care]] is a legal obligation which is imposed on an individual requiring adherence to a standard of reasonable care while performing any acts that could foreseeably harm others. Under the Donoghue v Stevenson (1932) precedent, the 'Neighbor Principle' establishes that one must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbor."
""",
    "MED-PHYSIO": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Homeostasis]] is the state of steady internal, physical, and chemical conditions maintained by living systems. This dynamic equilibrium is regulated by 'Negative Feedback Loops' (e.g., baroreceptor reflex for blood pressure), where a deviation from a set point triggers a compensatory response to restore balance."
""",
    "CS-SYSTEMS": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Microservices]] is an architectural style that structures an application as a collection of services that are highly maintainable and testable, loosely coupled, independently deployable, and organized around business capabilities. The mechanism relies on 'API Gateways' to orchestrate requests and 'Service Discovery' to manage dynamic network locations."
""",
    "CS-DB": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Normalization]] is the process of organizing data in a database to reduce redundancy and improve data integrity. The mechanism involves dividing large tables into smaller, related tables and defining relationships between them (e.g., 3rd Normal Form (3NF) requires that all non-key attributes are functionally dependent only on the primary key)."
""",
    "MATH-CRYPTO": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[RSA_Encryption]] is an asymmetric cryptographic algorithm based on the practical difficulty of factoring the product of two large prime numbers. The mechanism involves a public key $(n, e)$ and a private key $d$, where encryption is performed by $c = m^e \\pmod{n}$ and decryption by $m = c^d \\pmod{n}$."
"""
}

def get_domain_instruction(mode: str) -> str:
    return DOMAIN_SPECIFIC_INSTRUCTIONS.get(mode, "Explain the concept with high technical density and professional rigor.")

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
        prof_domain = get_professional_domain(note_schema.title)
        domain_fix = get_domain_instruction(note_schema.get("mode", "ECON-MACRO"))
        
        sys_prompt = f"""You are a world-class {self.domain['persona']} and pedagogical expert.
Your goal is to take a student from ZERO knowledge to TOTAL MASTERY of '{title_readable}'.

{domain_fix}

# 1. Mental Model
Explain the ENTIRE concept to a 12-year-old using a simple, everyday analogy. Do not use ANY technical jargon here. It must make the concept "click" intuitively in 2-4 sentences.

# 2. {self.domain['h1']} (The Logic)
Provide a rigorous, technical definition and the underlying mechanism. Use formal terminology.
MANDATORY: If this is a math/science concept, you MUST use LaTeX ($$ or $) for every formula.
MANDATORY: Embed 2-3 wikilinks from this list ONLY: {all_concepts}
Format: [[Exact_Match_From_List]] (no spaces).

# 3. {self.domain['artifact']} (The Proof)
Apply this concept to the professional domain: **{prof_domain}**.
Provide EXACTLY ONE high-fidelity artifact of type: **{self.domain['type']}**. 
If code, it must be production-grade and under 20 lines. If math, use block LaTeX ($$).
Do NOT write any explanatory text inside this section; let the artifact speak.

Concept: {title_readable}
Source context: {source_text[:2000]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", f"Mastery Note for {title_readable}")])
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
        prof_domain = get_professional_domain(note_title)
        domain_fix = get_domain_instruction(mode)
        
        sys_prompt = f"""You are a helpful {self.domain['persona']} and technical writer.
Complete the mastery note for '{title_readable}' by adding the final technical sections.

{domain_fix}

## 4. Professional Walkthrough (The Execution)
Provide a 3-4 bullet point technical breakdown of how the previous artifact (Section 3) functions in the context of **{prof_domain}**. Each bullet must be dense with technical insight.

## 5. {self.domain['h2']} (The Edge)
Analyze the limitations, edge cases, or failure modes of this concept. Explain where it breaks or where the model fails to apply (2-3 sentences).

Concept: {title_readable}
Theory context: {theory_body[:1000]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", f"Finalize mastery for {title_readable}")])
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

    async def generate(self, note_title: str, context: str, difficulty: str = "L1", persona: str = "Expert Educator") -> dict:
        title_readable = note_title.replace("_", " ")
        prof_domain = get_professional_domain(note_title + str(self.q_type))
        
        prompts = {
            "mcq": f"Find a technical nuance about '{title_readable}' in the context of {prof_domain}. Generate 1 correct answer and 3 distractors. Distractors must be technically plausible, not 'None of the above'.",
            "true_false": f"Generate a high-stakes T/F statement regarding a critical failure point of '{title_readable}' within {prof_domain}.",
            "fill_in": f"Extract a dense technical sentence about '{title_readable}'. Replace the most critical technical term with [[blank]]. REMOVE all other [[wikilinks]] from the sentence.",
            "writing": f"Challenge the user to analyze '{title_readable}' in a {prof_domain} scenario. Provide a 3-5 sentence 'Perfect Response' demonstrating mastery. NO RUBRICS.",
            "matching": f"Extract 4 distinct technical components of '{title_readable}' and their specific roles in {prof_domain}. Shuffle them.",
            "order": f"Identify a 4-5 step technical process or causal chain for '{title_readable}'. Use REAL steps from the text. PROHIBITION: Never use 'step1', 'step2', or generic markers.",
            "debug": f"Act as a Principal Engineer in {prof_domain}. Provide a code/formula snippet for '{title_readable}' with ONE subtle, realistic technical error.",
            "trace": f"Provide a valid, complex technical execution trace for '{title_readable}' in {prof_domain}. Ask for the exact final state/output.",
            "synthesis": f"Create an emergency scenario in {prof_domain} where '{title_readable}' must be applied to prevent system failure. Provide a definitive 'Mastery Solution'."
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
        
        sys_prompt = f"""You are the Dedicated '{self.canonical_type.upper()}' Question Agent, operating as a **{persona}**.
{prompt_logic}

MANDATORY SCHEMA:
{json_schema}

STRICT RULES:
1. Output ONLY a valid JSON object. No markdown fences.
2. The 'answer' field MUST be a definitive correct response. 
   - **PROHIBITION**: NEVER use 'step1', 'step2', 'placeholder', or 'example_code'. Use REAL technical content.
   - **PROHIBITION**: NEVER use rubrics/grading instructions.
3. For 'explanation', explain the underlying mechanism deeply using LaTeX.
4. Professional Context: You are currently operating in the **{prof_domain}** domain.
5. ANTI-LAZINESS: If the question or answer is generic or uses placeholders, the generation will be REJECTED.

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
1. domain_lock: Does the content use the technical framework of '{mode}' and the professional domain rotation? (NO 'toy' examples or buying-groceries analogies).
2. quiz_topicality: Are questions technical and specific? (FAIL if they use placeholders like 'step1', 'example', or if they are too generic).
3. debug_validity: For debug types, is there a REAL error? (FAIL if 'no error' is the answer).
4. mathematical_rigor: Does it use LaTeX for all formulas and is the arithmetic 100% correct?
5. cognitive_ramp: Does the mental model explain the WHOLE concept jargon-free?

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
