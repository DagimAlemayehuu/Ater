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
    "ECON-MICRO":         {"persona":"Microeconomist","h1":"Micro Theory","h2":"Efficiency & Distortions","artifact":"Market Graph","type":"Basic Mermaid flowchart (graph TD/LR) or LaTeX","question_modes":["mcq", "fill_in", "debug", "trace"]},
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
    "ECON-MICRO": """
EXAMPLE OF MASTER-LEVEL LOGIC (#2):
"[[Price_Elasticity_Of_Demand]] measures the responsiveness of quantity demanded to a change in price ($$E_d = \\frac{\\%\\Delta Q_d}{\\%\\Delta P}$$). For normal goods, demand curves slope downward ($$\\frac{\\partial Q_d}{\\partial P} < 0$$) due to the substitution and income effects. A perfectly inelastic demand curve is vertical, meaning quantity demanded remains constant regardless of price."

EXAMPLE OF MASTER-LEVEL ARTIFACT (#4):
```mermaid
graph TD
    P[Price Increase] --> Q[Quantity Demanded Decrease]
    Q --> TR[Total Revenue Effect]
    TR -->|Elastic| D[Revenue Falls]
    TR -->|Inelastic| I[Revenue Rises]
```
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

# ── MODE-AWARE PROFESSIONAL DOMAINS (v26.6) ───────────────────────────────────
MODE_SPECIALITIES = {
    "ECON-MACRO": ["Central Banking & Monetary Policy", "International Trade Analysis", "Fiscal Policy Research", "Market Strategy", "Development Economics"],
    "ECON-MICRO": ["Consumer Behavior Analysis", "Industrial Organization", "Labor Market Economics", "Game Theory Application", "Environmental Economics"],
    "ECON-FINANCE": ["Investment Banking", "Corporate Finance", "Asset Management", "Financial Audit"],
    "CS-SOFTWARE": ["DevOps & Site Reliability", "Backend Systems Architecture", "Cloud Infrastructure", "Embedded Systems", "Cybersecurity Audit"],
    "CS-SYSTEMS": ["Network Infrastructure", "Distributed Systems", "High-Performance Computing", "Cloud Architecture"],
    "CS-DB": ["Data Engineering", "Database Administration", "Business Intelligence", "Large-scale Data Warehousing"],
    "CS-AI": ["Machine Learning Operations (MLOps)", "Natural Language Processing", "Computer Vision Research", "AI Ethics & Safety"],
    "MATH-PURE": ["Cryptographic Research", "Theoretical Physics", "Algorithmic Analysis", "Pure Math Research"],
    "MATH-STAT": ["Actuarial Science", "Risk Management", "Biostatistics", "Data Science"],
    "PHYSICS-KINEMATICS": ["Aerospace Engineering", "Automotive Design", "Robotics Kinematics", "Ballistics Analysis"],
    "CHEMISTRY": ["Pharmaceutical Research", "Materials Science", "Chemical Engineering", "Forensic Toxicology"],
    "BIOLOGY": ["Biomedical Research", "Genetics & Genomics", "Ecology & Conservation", "Neuroscience"],
    "ENG-MECH": ["Structural Engineering", "Manufacturing Systems", "Aerospace Design", "Mechanical Reliability"],
    "ENG-ELEC": ["Circuit Design", "Power Systems Engineering", "Telecommunications", "Semiconductor Mfg"],
    "MED-PHYSIO": ["Clinical Physiology", "Emergency Medicine", "Internal Medicine", "Surgical Planning"],
    "MED-PHARMA": ["Pharmacology", "Drug Development", "Clinical Trials", "Regulatory Affairs"],
    "BIZ-STRATEGY": ["Management Consulting", "Corporate Strategy", "Venture Capital", "Market Research"],
    "LAW-CASE": ["Litigation Strategy", "Judicial Review", "Constitutional Law", "Legal Analysis"],
    "PHILOSOPHY": ["Ethics Advisory", "Logic & Argumentation", "Social Philosophy", "Political Theory"]
}

def get_professional_domain(seed: str, mode: str = "ECON-MACRO") -> str:
    options = MODE_SPECIALITIES.get(mode, ["General Technical Research", "Professional Consulting", "Industry Analysis"])
    idx = int(hashlib.md5(seed.encode()).hexdigest(), 16) % len(options)
    return options[idx]

# ── DOMAIN QUESTION PROTOCOLS (v27.0) ─────────────────────────────────────────
# Specialized sub-agent instructions for each domain's cognitive modality.
DOMAIN_QUESTION_PROTOCOLS = {
    "ECON-MACRO": {
        "mcq": "Focus on the direction of shifts in curves (AD, AS, IS-LM). Ensure distractors reflect common student errors in directionality.",
        "true_false": "Test the 'Ceteris Paribus' boundary. Create a statement where a factor hidden in the assumption is changed.",
        "synthesis": "Present a 'Macro Shock' (e.g., sudden currency devaluation) and require a 3-step policy response. PROHIBITION: Do not use the 'Azura' scenario if already used.",
        "trace": "Trace a specific macroeconomic shock through 4 distinct interconnected sectors. Provide numerical intermediate states.",
        "order": "Order the sequence of events in a 'Multiplier Effect' or 'Liquidity Trap' chain."
    },
    "ECON-MICRO": {
        "mcq": "Focus on the Law of Demand/Supply and elasticity calculations. PROHIBITION: Demand curves MUST NOT be described as positively sloped.",
        "true_false": "Test the relationship between income and normal/inferior goods. Use tricky combinations of price and income changes.",
        "synthesis": "Design a 'Market Entry' or 'Tax Impact' scenario for a specific commodity (e.g., Coffee, Smartphones). PROHIBITION: Never use currency devaluation for Micro notes.",
        "trace": "Trace the impact of a cost increase (e.g., higher wages) through the supply curve to equilibrium price and total revenue.",
        "order": "Order the causal steps of a market moving from a shortage/surplus back to equilibrium."
    },
    "CS-SOFTWARE": {
        "mcq": "Focus on memory management, scope, and side effects. Distractors must include potential runtime errors.",
        "debug": "Provide a snippet with a subtle race condition, off-by-one, or memory leak. The answer must explain the fix.",
        "trace": "Provide a recursive or complex loop structure. The user must provide the exact value of the accumulator at termination.",
        "synthesis": "Design a migration strategy from Monolithic to Microservices for a specific stateful component.",
        "order": "Order the steps of a CI/CD pipeline or a complex Git rebase conflict resolution."
    },
    "MATH-STAT": {
        "mcq": "Focus on the difference between correlation and causation, and the misuse of P-values.",
        "trace": "Provide a data set and require the exact calculation of a Z-score or Confidence Interval using LaTeX.",
        "synthesis": "Design an A/B test for a high-traffic system that accounts for 'Survivor Bias'.",
        "true_false": "Challenge the 'Law of Large Numbers' or 'Central Limit Theorem' with a small-sample counter-example."
    },
    "MED-PHYSIO": {
        "mcq": "Focus on 'Differential Diagnosis'. Distractors should be pathologies with similar symptoms but different mechanisms.",
        "synthesis": "Present a patient case with 3 conflicting vitals. Require a prioritized diagnostic pathway.",
        "true_false": "Test the limits of 'Negative Feedback Loops'. What happens when the sensor fails versus the effector?",
        "matching": "Match pathologies to their specific cellular-level trigger."
    },
    "LAW-CASE": {
        "mcq": "Focus on the 'Ratio Decidendi'. Distractors should be 'Obiter Dicta' from the same case.",
        "synthesis": "Present a novel fact pattern and require an application of a specific precedent (e.g. Donoghue v Stevenson).",
        "writing": "Analyze the tension between two conflicting legal principles in the given context."
    },
    "BIOLOGY": {
        "mcq": "Focus on the 'Why' of a biological pathway, not just the 'What'. Distractors should include plausible but incorrect regulatory feedback.",
        "synthesis": "Design a CRISPR-based intervention for a specific genetic bottleneck discussed in the text.",
        "matching": "Match specific ligands to their corresponding receptor subtypes and downstream effects."
    },
    "PHILOSOPHY": {
        "mcq": "Focus on subtle logical fallacies in a given argument. Distractors must be common misinterpretations of the philosopher's work.",
        "writing": "Construct a 3-sentence 'Counter-Argument' from the perspective of a rival school of thought.",
        "synthesis": "Apply the core philosophical argument to a modern AI ethics dilemma."
    },
    "CHEMISTRY": {
        "mcq": "Focus on rate-determining steps and transition states. Distractors should include incorrect stereochemistry or thermodynamic states.",
        "debug": "Provide a balanced equation with ONE subtle error in oxidation states or stoichiometry.",
        "trace": "Trace the movement of electrons in a mechanism (e.g., nucleophilic attack) and identify the exact final intermediate."
    },
    "PHYSICS-KINEMATICS": {
        "mcq": "Focus on boundary conditions (e.g. t=0, v=0). Distractors should reflect sign errors or unit inconsistencies.",
        "debug": "Provide a derivation with a single missing vector component or a misused fundamental constant.",
        "trace": "Calculate the exact state (velocity/position) of a multi-body system after 5 seconds using LaTeX."
    },
    "HIST-CATALYST": {
        "mcq": "Focus on the 'Catalytic Event'. Distractors should be events that were concurrent but not causal.",
        "order": "Order the sequence of social and political shifts that led to the primary historical outcome.",
        "synthesis": "Compare the 'Primary Catalyst' in this note to a similar historical event in a different era."
    }
}


# ── DOMAIN PROHIBITIONS & WALKTHROUGH STYLE ───────────────────────────────────
# Hard constraints injected into every agent prompt per domain mode.
DOMAIN_PROHIBITIONS: Dict[str, str] = {
    "MATH-PURE":        "NEVER use ODEs, dy/dx, d²y, integrals (∫), ẋ(t), or any continuous calculus. ALL worked examples MUST use integer-indexed sequences (aₙ, f(n)). Verify every arithmetic step before writing it.",
    "MATH-DISCRETE":    "NEVER use differential equations, integrals, or continuous functions. Use ONLY discrete structures: integer sequences, recurrences, combinatorics, graphs, propositional logic. Verify every arithmetic step.",
    "MATH-STAT":        "NEVER drift into ODEs or deterministic mechanics. Keep all examples probabilistic with proper random variable notation.",
    "MATH-CRYPTO":      "Focus exclusively on discrete cryptographic operations. NEVER drift into continuous probability or calculus.",
    "ECON-MICRO":       "NEVER use 'Central Banking', 'Exchange Rates', or 'Currency Devaluation'. Focus on individual markets, consumers, and firms. The Demand Curve for a normal good is ALWAYS downward-sloping (negative gradient).",
    "ECON-MACRO":       "Focus on aggregate variables (GDP, Inflation, Interest Rates). Use only one currency devaluation scenario per session.",
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
            "   - Microeconomics (Individual markets, supply/demand, consumer behavior, firms, elasticity, market structure) → `ECON-MICRO`\n"
            "   - Macroeconomics (GDP, aggregate demand, inflation, unemployment, central banks, fiscal policy) → `ECON-MACRO`\n"
            "   - NEVER use `CS-SOFTWARE` for any mathematics topic.\n"
            "3. prerequisites: list EXACT titles of other concepts in THIS plan that must be known first.\n"
            "4. source_context: copy 1-2 most relevant sentences.\n"
            "5. source_pages: list page numbers mentioned (integers only).\n"
            "OUTPUT: pure JSON only — no markdown fences.\n"
            '{"atomic_notes":[{"title":"...","description":"...","mode":"...","prerequisites":[],'
            '"source_context":"...","source_pages":[]}],"possible_questions":[]}'
        )

        last_error = None
        for attempt in range(3):
            try:
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
        if not content or not content.strip(): 
            raise ValueError("Empty response from LLM")
            
        # 1. Clean markdown fences
        clean = content.strip()
        blocks = re.findall(r"```(?:json)?\s*([\s\S]*?)```", clean)
        if blocks:
            json_blocks = [b.strip() for b in blocks if "{" in b and "}" in b]
            if json_blocks:
                clean = max(json_blocks, key=len)
        
        start = clean.find("{")
        end = clean.rfind("}")
        if start == -1 or end == -1: 
            raise ValueError(f"No JSON object found in LLM response. Content: {content[:100]}...")

        json_str = clean[start:end+1]
        
        # 2. Aggressive Sanitization
        # Remove trailing commas
        json_str = re.sub(r",\s*([\]\}])", r"\1", json_str)
        
        # FIX: Missing commas between fields (e.g. "field1": "val" "field2": "val")
        # This regex looks for: "key": value whitespace "key":
        json_str = re.sub(r'("[\s\S]*?"\s*:\s*(?:".*?"|\d+|true|false|null|\[.*?\]|\{.*?\}))\s*(")', r'\1, \2', json_str)

        # Handle unescaped backslashes in LaTeX
        def escape_invalid_slashes(match):
            s = match.group(0)
            if re.match(r'\\[\\"/bfnrtu]|\\u[0-9a-fA-F]{4}', s):
                return s
            return "\\\\" + s[1:]
            
        json_str = re.sub(r'\\.', escape_invalid_slashes, json_str)

        try:
            return json.loads(json_str, strict=False)
        except json.JSONDecodeError as e:
            # Final Fallback: Lazy quote fix
            try:
                alt_json = json_str.replace("'", '"')
                return json.loads(alt_json, strict=False)
            except Exception:
                pass
            
            # Brace counting for truncated output
            brace_count = 0
            for i, char in enumerate(json_str):
                if char == '{': brace_count += 1
                elif char == '}': brace_count -= 1
                if brace_count == 0 and i > 0:
                    try:
                        return json.loads(json_str[:i+1], strict=False)
                    except json.JSONDecodeError:
                        break
            
            raise ValueError(f"Failed to parse JSON: {e}. Snippet: {json_str[:120]}...")

    @staticmethod
    def _is_rate_limit(e: Exception) -> bool:
        s = str(e).lower()
        return "429" in s or "rate_limit" in s or "rate limit" in s


# ── SPLIT AGENTS (Theory, Practitioner, Examiner, Critic) ──

class TheoryAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate(self, note_schema, source_text: str, primary_language: str, all_concepts: str, used_scenarios: list = None) -> str:
        title_readable = note_schema.title.replace("_", " ")
        prof_domain = get_professional_domain(note_schema.title)
        domain_fix = get_domain_instruction(note_schema.mode or "ECON-MACRO")

        # Scenario exclusion: prevent the same everyday analogy from being reused
        # across notes in the same batch (e.g. bake sale appearing 4 times).
        scenario_ban = ""
        if used_scenarios:
            banned = ", ".join(f"'{s}'" for s in used_scenarios[-8:])
            scenario_ban = (
                f"\nANALOGY PROHIBITION: The following everyday scenarios have ALREADY been used in "
                f"this batch and MUST NOT be reused: {banned}. "
                f"Pick a completely different, vivid real-world scenario instead."
            )

        sys_prompt = f"""You are a world-class {self.domain['persona']} and pedagogical expert.
Your goal is to take a student from ZERO knowledge to TOTAL MASTERY of '{title_readable}'.

{domain_fix}

STRICT INSTRUCTION: Output ONLY the requested sections. NO introductory text, NO concluding remarks, NO "Here is your note". Start directly with '# 1. Mental Model'.

# 1. Mental Model
Explain the ENTIRE concept to a 10-year-old using a vivid everyday analogy. Mapping: Map at least 2 mechanical components of the analogy to the concept. 2-3 sentences. No technical jargon.{scenario_ban}

# 2. {self.domain['h1']}
Provide a rigorous, technical definition and the underlying mechanism in continuous analytical prose. No bullet points.
MANDATORY: Embed 3-5 wikilinks from this list ONLY: {all_concepts}
Format: [[Exact_Match_From_List]] (use underscores).

# 3. Limitations & Edge Cases
Analyze the specific limitations, model assumptions that break down, and known edge cases of '{title_readable}' in continuous analytical prose. No bullet points. Do NOT use the heading 'Market Failures' unless this note is specifically about externalities, public goods, or information asymmetry.
MANDATORY: Embed 3-5 wikilinks from this list ONLY: {all_concepts}

Concept: {title_readable}
MANDATORY: For the 'source_pages' metadata, use the ACTUAL TEXTBOOK PAGE NUMBERS visible on the PDF pages, not the PDF software's page index.
Source context: {source_text[:2000]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", f"Theoretical Architecture for {title_readable}")])
        return res.content.strip()

    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = f"""You are a helpful {self.domain['persona']} tutor.

PREVIOUS ATTEMPT FAILED. FIX INSTRUCTION: {diagnosis}

Write EXACTLY 3 sections.

# 1. Mental Model
Explain to a 10-year-old using a vivid everyday analogy.

# 2. {self.domain['h1']}
Provide the rigorous technical definition and mechanism. 
MANDATORY: Embed 3-5 wikilinks from this list ONLY: {all_concepts}

# 3. Limitations & Edge Cases
Analyze the specific limitations and edge cases of '{title_readable}'. Do NOT use the heading 'Market Failures' unless this note is specifically about externalities or market imperfections.

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
        prof_domain = get_professional_domain(note_title, mode=mode)
        domain_fix = get_domain_instruction(mode)
        
        sys_prompt = f"""You are a helpful {self.domain['persona']} and technical writer.
Complete the sovereign note for '{title_readable}' by adding the high-fidelity artifact and execution walkthrough.

{domain_fix}

STRICT INSTRUCTION: Output ONLY the requested sections. NO introductory text like "Here's the rest of the note". Start directly with '# 4. {self.domain['artifact']}'.

# 4. {self.domain['artifact']}
Provide EXACTLY ONE high-fidelity artifact of type: **{self.domain['type']}** for the domain **{prof_domain}**.
If code, use ```primary_language. If math, use block LaTeX ($$).
Followed by 2-3 sentences of prose explaining HOW to read this artifact.

## 5. Walkthrough
Provide a strict, 5-step technical walkthrough of how the concept/artifact operates in **{prof_domain}**.
Show intermediate state changes or data transformations. Use realistic data.

Concept: {title_readable}
Theory context: {theory_body[:1200]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", f"Finalize execution for {title_readable}")])
        return res.content.strip()

    async def retry(self, note_title: str, theory_body: str, primary_language: str, diagnosis: str) -> str:
        title_readable = note_title.replace("_", " ")
        prof_domain = get_professional_domain(note_title)
        sys_prompt = f"""You are a helpful {self.domain['persona']} tutor.

PREVIOUS ATTEMPT FAILED. FIX: {diagnosis}

Write EXACTLY 2 sections.

# 4. {self.domain['artifact']}
Provide the high-fidelity artifact for **{prof_domain}**.

## 5. Walkthrough
Provide the 5-step technical walkthrough for **{prof_domain}**.

Concept: {title_readable}
Theory context: {theory_body[:800]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected walkthrough and edge cases.")])
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

    async def generate(self, note_title: str, context: str, difficulty: str = "L1", persona: str = "Expert Educator", mode: str = "ECON-MACRO", prof_domain: str = None, index: int = 1, total: int = 1, topic_hint: str = "") -> dict:
        title_readable = note_title.replace("_", " ")
        if not prof_domain:
            prof_domain = get_professional_domain(note_title + str(self.q_type), mode=mode)
        
        # Load Specialized Sub-Agent Protocol
        protocol_map = DOMAIN_QUESTION_PROTOCOLS.get(mode, {})
        specialized_instruction = protocol_map.get(self.canonical_type, "Focus on high-fidelity technical application and deep causal understanding.")

        prompts = {
            "mcq": f"Find a technical nuance about '{title_readable}' within {prof_domain}. {specialized_instruction} Generate 1 correct answer and 3 distractors. Distractors must be technically plausible, not 'None of the above'.",
            "true_false": f"Generate a high-stakes T/F statement regarding a critical failure point of '{title_readable}' within {prof_domain}. {specialized_instruction}",
            "fill_in": f"Extract a dense technical sentence about '{title_readable}'. Replace the most critical technical term with [[blank]]. REMOVE all other [[wikilinks]] from the sentence.",
            "writing": f"Challenge the user to analyze '{title_readable}' in a {prof_domain} scenario. {specialized_instruction} Provide a 3-5 sentence 'Perfect Response' demonstrating mastery. NO RUBRICS.",
            "matching": f"Extract 4 distinct technical components of '{title_readable}' and their specific roles in {prof_domain}. {specialized_instruction} Shuffle them.",
            "order": f"Identify a 4-5 step technical process or causal chain for '{title_readable}'. {specialized_instruction} Use REAL steps from the text. SHUFFLE the 'steps' array so they are NOT in order. PROHIBITION: Never use 'step1', 'step2', or generic markers. The steps must be logically sequential (A -> B -> C), not just a list of definitions.",
            "debug": f"Act as a Principal Specialist in {prof_domain}. {specialized_instruction} Provide a code/formula/scenario snippet for '{title_readable}' with ONE subtle, realistic technical error.",
            "trace": f"Provide a valid, complex technical execution trace for '{title_readable}' in {prof_domain}. {specialized_instruction} Ask for the exact final state/output.",
            "synthesis": f"Create an emergency scenario in {prof_domain} where '{title_readable}' must be applied to prevent system failure. {specialized_instruction} Provide a definitive 'Mastery Solution'."
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

ENTROPY ENFORCEMENT:
- You are generating question **{index} of {total}** for this concept.
- FOCUS HINT: {topic_hint}
- YOU MUST ENSURE this question is distinct in sub-topic and angle from other questions in this set.

MANDATORY SCHEMA:
{json_schema}

STRICT RULES:
1. Output ONLY a valid JSON object. No markdown fences.
2. The 'answer' field MUST be a definitive correct response. 
3. Do NOT use ALL-CAPS for questions, options, or explanations unless it is a specific technical constant/identifier. Use standard Sentence Case.
   - **PROHIBITION**: NEVER use 'step1', 'step2', 'placeholder', or 'example_code'. Use REAL technical content.
   - **PROHIBITION**: NEVER use rubrics/grading instructions.
   - **PROHIBITION**: The 'answer' field MUST be a STRING or a STRING-LIST. It MUST NOT be a raw JSON object.
3. For 'explanation', explain the underlying mechanism deeply using LaTeX.
4. Professional Context: You are currently operating in the **{prof_domain}** domain.
5. ANTI-LAZINESS: If the question or answer is generic or uses placeholders, the generation will be REJECTED.
6. SCENARIO DIVERSITY: If this is a 'synthesis' or 'scenario' question, use a novel, specific industry context (e.g., Space Exploration, Deep Sea Mining, Medieval Guilds) to avoid repeating 'Azura' or common AI tropes.

Concept: {title_readable}
Context: {context[:3000]}
"""
        
        max_retries = 3
        last_error = None
        for attempt in range(max_retries):
            try:
                retry_note = f"\n\nCRITICAL: PREVIOUS ATTEMPT FAILED TO PARSE.\nERROR: {last_error}\nEnsure the JSON is perfectly valid. Escape ALL backslashes in LaTeX as \\\\ (double backslash). NO chitchat.\n" if last_error else ""
                res = await self.llm.ainvoke([("system", sys_prompt + retry_note), ("human", "Output the JSON object.")])
                content = res.content.strip()
                q_data = ArchitectAgent._parse_json(content)
                q_data["type"] = self.canonical_type
                q_data["difficulty"] = difficulty
                
                # PHYSICAL SHUFFLE for 'order' type to guarantee robustness
                if self.canonical_type == "order" and "steps" in q_data:
                    import random
                    original_order = list(q_data["steps"])
                    shuffled = list(original_order)
                    # Attempt to shuffle up to 10 times to ensure it's different from original
                    for _ in range(10):
                        random.shuffle(shuffled)
                        if shuffled != original_order:
                            break
                    q_data["steps"] = shuffled
                    q_data["answer"] = original_order

                return q_data
            except Exception as e:
                last_error = e
                err_msg = str(e).lower()
                if "429" in err_msg or "rate limit" in err_msg:
                    if attempt == max_retries - 1:
                        raise e
                    # Backoff
                    await asyncio.sleep(2.0 * (2 ** attempt))
                else:
                    print(f"[QuestionAgent] Parse failed for {self.canonical_type} (attempt {attempt}): {e}")

        # ── NUCLEAR FALLBACK: Weak LLM couldn't parse the full schema. ─────────
        # Drop all complexity — ask for the absolute minimum valid MCQ.
        # A guaranteed L1 MCQ is infinitely better than a dead error stub.
        print(f"[QuestionAgent] NUCLEAR FALLBACK triggered for {self.canonical_type} on '{title_readable}'")
        nuclear_prompt = (
            f"You must output ONLY a raw JSON object. No markdown. No explanation. No extra text.\n"
            f"Fill in ONLY the 4 fields marked with ??? below for the concept '{title_readable}'.\n\n"
            f'{{"id":"q1","type":"mcq","difficulty":"L1",'
            f'"question":"???Write a basic question about {title_readable}???","options":{{"A":"???correct answer???","B":"???wrong option???","C":"???wrong option???","D":"???wrong option???"}},"answer":"A","explanation":"???Why A is correct???"}}'
        )
        try:
            res = await self.llm.ainvoke([("system", nuclear_prompt), ("human", "Output the completed JSON.")])
            raw = res.content.strip()
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw).strip()
            q_data = ArchitectAgent._parse_json(raw)
            q_data["type"] = "mcq"
            q_data["difficulty"] = "L1"
            print(f"[QuestionAgent] Nuclear fallback succeeded for '{title_readable}'")
            return q_data
        except Exception as fallback_err:
            # All attempts exhausted — raise so the service layer triggers full note regeneration
            print(f"[QuestionAgent] FATAL: Nuclear fallback also failed for '{title_readable}': {fallback_err}")
            raise RuntimeError(
                f"QuestionAgent({self.canonical_type}) failed all attempts for '{title_readable}'. "
                f"Last error: {last_error}. Fallback error: {fallback_err}"
            )

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

Check ALL criteria and report true/false for each.
- `clean_output`: No "Wait", "Let me think", or "As an AI". No all-caps text unless technically necessary.
- `economic_laws`: STRICT for ECON: Demand curves MUST slope DOWNWARD.
- `unique_scenario`: Is the scenario/analogy fresh? (FAIL if it uses 'Azura' or currency devaluation for Microeconomics).

Output format — use EXACTLY this structure:
{{"domain_lock\":true,\"quiz_topicality\":true,\"debug_validity\":true,\"arithmetic_correct\":true,\"mental_model_maps\":true,\"clean_output\":true,\"economic_laws\":true,\"unique_scenario\":true,\"failures\":[{{\"check\":\"domain_lock\",\"issue\":\"exact description\",\"fix_instruction\":\"exact fix\"}}]}}

failures is an empty array [] if all checks pass.
Source context (what the note should teach): {source_context[:400]}"""
        user_msg = f"Note title: {note_title}\nMode: {mode}\n\nContent:\n{note_content[:3000]}"
        
        last_error = None
        for attempt in range(2):
            try:
                retry_note = f"\n\nFIX PREVIOUS ERROR: {last_error}\nReturn ONLY pure JSON.\n" if last_error else ""
                res = await self.llm.ainvoke([("system", sys_prompt + retry_note), ("human", user_msg)])
                data = ArchitectAgent._parse_json(res.content)
                passed = all([
                    data.get("domain_lock", True), data.get("quiz_topicality", True),
                    data.get("debug_validity", True), data.get("arithmetic_correct", True),
                    data.get("mental_model_maps", True), data.get("clean_output", True),
                    data.get("economic_laws", True), data.get("unique_scenario", True)
                ])
                return {"passed": passed, "failures": data.get("failures", [])}
            except Exception as e:
                last_error = e
                print(f"[VerifierAgent] Verification attempt {attempt+1} failed: {e}")
                if attempt == 1:
                    return {"passed": True, "failures": []}  # Fail open


# ── QUIZ AUDITOR AGENT ─────────────────────────────────────────────────────────
class QuizAuditorAgent:
    """Fast quiz-only check: topicality, debug validity, fill_in blank format."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def audit(self, note_title: str, quiz_json_str: str, theory_summary: str, prof_domain: str = "General") -> dict:
        max_retries = 2
        title_readable = note_title.replace("_", " ")
        sys_prompt = f"""You are a quiz quality auditor. Evaluate these technical questions for '{title_readable}'.
Return ONLY a valid JSON object.

The note's concept is: '{title_readable}'
For each question check:
- Is the question DIRECTLY about '{title_readable}'? (Not a generic math fact, not the analogy)
- CONTEXT LOCK: Does the question use a professional domain UNRELATED to the concept or the intended domain '{prof_domain}'? (e.g., Bioinformatics in an Economics note = FAIL, but using '{prof_domain}' terminology is REQUIRED).
- GROUNDING: Does the question require specific data (numbers, constants) NOT present in the theory summary? (Hallucinated facts = FAIL).
- SHUFFLE CHECK: For type='order', are the 'steps' already in the correct order? (Identity ordering = FAIL).
- DEBUG CHECK: If type='debug': does 'content' actually contain a wrong step? (Answer='no error'=FAIL).
- SCAFFOLDING CHECK: Are there any 'internal monologues', 'AI signatures', or 'CoT leakage' in the explanation? (e.g. "Wait, let's correct that", "As an AI...", or "Let's simplify"). FAIL if found.
- For fill_in: does 'textWithBlanks' use [[Blank1]] format (NOT wikilink names as blanks)?
- Is the stated 'answer' definitively correct for the question asked?

Output:
{{"passed":true,"issues":[],"fix_instruction":""}}
OR if problems:
{{"passed":false,"issues":["Q1: Context Hallucination detected.","Q3: Identity ordering detected. Steps must be shuffled."],"fix_instruction":"exact instruction"}}

Key facts about '{title_readable}': {theory_summary[:2500]}"""
        user_msg = f"Quiz JSON:\n{quiz_json_str[:2000]}"
        last_error = None
        for attempt in range(2):
            try:
                retry_note = f"\n\nFIX PREVIOUS ERROR: {last_error}\nReturn ONLY pure JSON.\n" if last_error else ""
                res = await self.llm.ainvoke([("system", sys_prompt + retry_note), ("human", user_msg)])
                data = ArchitectAgent._parse_json(res.content)
                issues = data.get("issues", [])
                fix = data.get("fix_instruction", "Fix the identified issues.")
                return {
                    "passed": data.get("passed", True),
                    "diagnosis": ("; ".join(issues) + ". " + fix).strip() if issues else ""
                }
            except Exception as e:
                last_error = e
                print(f"[QuizAuditorAgent] Audit attempt {attempt+1} failed: {e}")
                if attempt == 1:
                    return {"passed": True, "diagnosis": ""}
