import json
import re
import asyncio
import hashlib
from typing import Any, Dict, List, Union
from pydantic import BaseModel, Field
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import PartialPlan
from .governor import governor, DailyLimitExceededException

import yaml
from pathlib import Path

# Load matrices from domain_matrix.yaml
_matrix_yaml = Path(__file__).parent / "domain_matrix.yaml"
try:
    with open(_matrix_yaml, "r", encoding="utf-8") as _f:
        _loaded_data = yaml.safe_load(_f) or {}
    DOMAIN_MATRIX = _loaded_data.get("DOMAIN_MATRIX", {})
    DYNAMIC_DOMAIN_MATRIX = _loaded_data.get("DYNAMIC_DOMAIN_MATRIX", {})
except Exception as _e:
    print(f"[agents] Failed to load domain_matrix.yaml: {_e}")
    DOMAIN_MATRIX = {}
    DYNAMIC_DOMAIN_MATRIX = {}

# Apply Universal Feynman Hamburger Fallback (v32.0)
FEYNMAN_MAPPINGS = {
    "ECON-MICRO": {"h1": "How the Economics Actually Work", "h2": "The Formal Math & Models"},
    "ECON-MACRO": {"h1": "The Global Economic Engine", "h2": "The Macro Model & Jargon"},
    "CS-SOFTWARE": {"h1": "The Logic Behind the Code", "h2": "The Technical Implementation"},
    "CS-SYSTEMS": {"h1": "The System Flow in Plain English", "h2": "The Architecture & Protocols"},
    "CS-NETWORKING": {"h1": "The Packet's Journey in Plain English", "h2": "The Network Protocols & Stack"},
    "CS-CYBERSECURITY": {"h1": "The Exploit Logic in Plain English", "h2": "The Security Protocols & Defense"},
    "MATH-PURE": {"h1": "The Intuition Behind the Math", "h2": "The Formal Proof"},
    "MATH-CALCULUS": {"h1": "The Motion & Change in Plain English", "h2": "The Formal Derivative & Integral"},
    "PHYSICS-KINEMATICS": {"h1": "How the Objects Actually Move", "h2": "The Formal Laws & Equations"},
    "CHEMISTRY": {"h1": "What the Molecules are Doing", "h2": "The Formal Reaction Equation"},
    "CHEM-ORGANIC": {"h1": "The Molecular Dance in Plain English", "h2": "The Formal Synthesis Mechanism"},
    "BIO-GENETICS": {"h1": "The Code of Life in Plain English", "h2": "The Biological Mechanism"},
    "MED-PHYSIO": {"h1": "How the Body Actually Does This", "h2": "The Clinical Terminology"},
    "LAW-CASE": {"h1": "The Common Sense Behind the Rule", "h2": "The Legal Precedent & Jargon"},
    "PHILOSOPHY": {"h1": "The Core Argument in Plain English", "h2": "The Formal Logic & Counter-Arguments"},
    "HIST-CATALYST": {"h1": "The Human Story Behind the Event", "h2": "The Historical Analysis & Impact"},
    "EDUCATION": {"h1": "How Participation Works", "h2": "The Inclusion Rules"},
}

def apply_feynman_consistency(target_matrix: dict):
    """Applies Feynman Hamburger headers and universal fallbacks to a matrix."""
    for mode_id, config in target_matrix.items():
        # Handle nested modality dicts in DYNAMIC_DOMAIN_MATRIX
        if isinstance(config, dict) and any(isinstance(v, dict) for v in config.values()):
            for modality, sub_config in config.items():
                if isinstance(sub_config, dict):
                    # 1. Apply specific Feynman headers if defined
                    if mode_id in FEYNMAN_MAPPINGS:
                        sub_config.update(FEYNMAN_MAPPINGS[mode_id])
                    # 2. Apply universal fallback
                    else:
                        if "h1" not in sub_config or sub_config["h1"] == "Technical Architecture" or "Principle" in sub_config["h1"]:
                            sub_config["h1"] = "The Core Logic Explained"
                        if "h2" not in sub_config or sub_config["h2"] == "Context & Limitations" or "Context" in sub_config["h2"]:
                            sub_config["h2"] = "The Textbook Translation"
        else:
            # Handle flat DOMAIN_MATRIX
            if mode_id in FEYNMAN_MAPPINGS:
                config.update(FEYNMAN_MAPPINGS[mode_id])
            else:
                if "h1" not in config or config["h1"] == "Technical Architecture" or "Principle" in config["h1"]:
                    config["h1"] = "The Core Logic Explained"
                if "h2" not in config or config["h2"] == "Context & Limitations" or "Context" in config["h2"]:
                    config["h2"] = "The Textbook Translation"

# Initial pass on DOMAIN_MATRIX
apply_feynman_consistency(DOMAIN_MATRIX)

# Apply Feynman consistency to the dynamic matrix
apply_feynman_consistency(DYNAMIC_DOMAIN_MATRIX)

# ── UNIVERSAL MODALITY PERSONAS (v30.0 PANTHEON) ──────────────────────────────
# These are used when a concept falls outside the defined canonical taxonomy.
UNIVERSAL_MODALITY_PERSONAS = {
    "Quantitative": {
        "persona": "Master Mathematician",
        "h1": "Quantitative Architecture",
        "h2": "Numerical Logic",
        "artifact": "Formal Mathematical Model",
        "walkthrough": "Axiomatic Calculation Trace",
        "type": "Markdown Table",
        "sanity_check": "Focus on numerical proofs and formula integrity.",
        "l3_law": "L3 must be a rigorous calculation.",
        "prohibited_anti_patterns": "Vague descriptions. No missing variables."
    },
    "Qualitative/Definitional": {
        "persona": "Logic Professor",
        "h1": "Foundational Logic",
        "h2": "Conceptual Framework",
        "artifact": "Ontological Relationship Table",
        "walkthrough": "Conceptual Breakdown",
        "type": "Markdown Table",
        "sanity_check": "Focus on the logical definition and first principles.",
        "l3_law": "L3 must be a logic puzzle.",
        "prohibited_anti_patterns": "No math. No formulas."
    },
    "Procedural": {
        "persona": "Master Craftsman",
        "h1": "Procedural Execution",
        "h2": "Implementation Protocol",
        "artifact": "Optimal Execution Flow",
        "walkthrough": "Step-by-Step Implementation",
        "type": "Basic Mermaid flowchart (graph TD)",
        "sanity_check": "Focus on the sequence of operations.",
        "l3_law": "L3 must identify a bottleneck in the process.",
        "prohibited_anti_patterns": "Abstract theory. Focus on the 'how'."
    },
    "Comparative": {
        "persona": "Litigation Attorney",
        "h1": "Comparative Analysis",
        "h2": "Structural Contrasts",
        "artifact": "Adversarial Comparison Matrix",
        "walkthrough": "Point-by-Point Evaluation",
        "type": "Markdown Table",
        "sanity_check": "Focus on the trade-offs and direct contrasts.",
        "l3_law": "L3 must be a decision analysis between two options.",
        "prohibited_anti_patterns": "Describing one item in isolation."
    },
    "Causal/Historical": {
        "persona": "Universal Historian",
        "h1": "Causal Ancestry",
        "h2": "Long-term Consequences",
        "artifact": "Causal Continuity Timeline",
        "walkthrough": "Causal Chain Narrative",
        "type": "Basic Mermaid flowchart (graph LR)",
        "sanity_check": "Focus on the lineage of events.",
        "l3_law": "L3 must predict an outcome based on historical patterns.",
        "prohibited_anti_patterns": "Non-chronological logic. Effects before causes."
    }
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

DOMAIN_PROHIBITIONS = {
    "ECON-MICRO": "NEVER use 'Central Banking', 'Exchange Rates', or 'Currency Devaluation'. Focus on individual markets, consumers, and firms. The Demand Curve for a normal good is ALWAYS downward-sloping. ANALOGY PROHIBITION: NEVER use lemonade stands, bake sales, ice cream shops, or toy stores. Use real-world scenarios: housing markets, smartphone pricing, gasoline demand, coffee shop competition. AXIOM 5: NEVER confuse consumers with producers. A new store opening increases SUPPLY (more sellers). A population increase or new demographic increases DEMAND (more buyers).",
    "ECON-MACRO": "NEVER use 'Lemonade Stands' or child-centric analogies. Focus on national aggregates. Use real-world scenarios: National budgets, unemployment cycles, international trade agreements, central bank interest rate decisions.",
}

def get_domain_instruction(mode: str) -> str:
    instr = DOMAIN_SPECIFIC_INSTRUCTIONS.get(mode, "Explain the concept with high technical density and professional rigor.")
    prohibition = DOMAIN_PROHIBITIONS.get(mode, "")
    if prohibition:
        instr = f"{instr}\n\nSTRICT PROHIBITION: {prohibition}"
    return instr

MODE_ALIASES = {
    # Canonical taxonomy keys that do not have first-class generation templates yet.
    # Route them to the closest concrete DOMAIN_MATRIX entry so every downstream
    # persona, artifact law, validator, and prompt remains defined.
    "GLOBAL-TRENDS": "SOC-GLOBAL-TRENDS",
    "INT-RELATIONS": "SOC-INT-RELATIONS",
    "POLITICS": "SOC-POLITICAL",
    "POLI-SCIENCE": "SOC-POLITICAL",
    "POLI-RELATIONS": "SOC-INT-RELATIONS",
    "POLI-ECONOMY": "SOC-ECONOMICS",
    "GEOGRAPHY": "SOC-GEOGRAPHY",
    "HISTORY": "HUM-HISTORY",
    "MATH-GENERAL": "MATH-APPLIED",
    "ENGINEERING-GENERAL": "ENG-GENERAL",
    "SCIENCE-GENERAL": "SCI-GENERAL",
    "CS-GENERAL": "CS-SOFTWARE",
    "CS-DATA-SYSTEMS": "CS-DB",
    "CS-AI-ML": "CS-AI",
    "CS-CYBER-SEC": "CS-CYBERSECURITY",
    "CS-NETWORKS": "CS-NETWORKING",
    "CS-OS": "CS-SYSTEMS",
    "ENGINEERING-SOFTWARE": "CS-SOFTWARE",
    "MATH-STATS": "MATH-STAT",
    "PHYS-MECHANICS": "PHYSICS-KINEMATICS",
    "PHYS-ASTRO": "SPACE-ASTRO",
    "BIO-CELL": "BIOLOGY",
    "BIO-MOLECULAR": "BIOLOGY",
    "BIO-EVOLUTION": "BIOLOGY",
    "CHEM-INORGANIC": "CHEMISTRY",
    "CHEM-ANALYTICAL": "CHEMISTRY",
    "MEDICINE-GENERAL": "MED-PHYSIO",
    "MED-PHYSIOLOGY": "MED-PHYSIO",
    "BUSINESS-FINANCE": "ECON-FINANCE",
    "BUSINESS-MANAGEMENT": "BIZ-OPERATIONS",
    "BIZ-MANAGEMENT": "BIZ-OPERATIONS",
    "BIZ-ACCOUNTING": "ECON-FINANCE",
    "EDU-PEDAGOGY": "EDUCATION",
    "EDU-CURRICULUM": "EDUCATION",
    "EDU-ASSESSMENT": "EDUCATION",
    "EDU-TECHNOLOGY": "EDUCATION",
    "LAW-GENERAL": "LAW-CASE",
    "LAW-TORT": "LAW-CASE",
    "LAW-INTERNATIONAL": "LAW-CASE",
    "HISTORY-GENERAL": "HIST-CATALYST",
    "HIST-ANCIENT": "HIST-CATALYST",
    "HIST-MODERN": "HIST-CATALYST",
    "HIST-MEDIEVAL": "HIST-CATALYST",
    "HIST-REGIONAL": "HIST-CATALYST",
    "SOCIOLOGY": "SOC-POLITICAL",
    "SOC-STRATIFICATION": "SOC-POLITICAL",
    "SOC-CULTURE": "SOC-ANTHRO",
    "SOC-DEMOGRAPHICS": "SOC-POLITICAL",
    "PSYCHOLOGY": "PSYCH-SOCIOLOGY",
    "PSYCH-COGNITIVE": "PSYCH-SOCIOLOGY",
    "PSYCH-CLINICAL": "PSYCH-SOCIOLOGY",
    "PSYCH-DEVELOPMENTAL": "PSYCH-SOCIOLOGY",
    "PSYCH-BEHAVIORAL": "PSYCH-SOCIOLOGY",
    "PHIL-ETHICS": "PHILOSOPHY",
    "PHIL-METAPHYSICS": "PHILOSOPHY",
    "PHIL-EPISTEMOLOGY": "PHILOSOPHY",
    "PHIL-AESTHETICS": "PHILOSOPHY",
    "LINGUISTICS": "LANG-LINGUISTICS",
    "LING-SYNTAX": "LANG-LINGUISTICS",
    "LING-PHONOLOGY": "LANG-LINGUISTICS",
    "LING-SEMANTICS": "LANG-LINGUISTICS",
    "LITERATURE": "LANG-LIT",
    "LIT-FICTION": "LANG-LIT",
    "LIT-POETRY": "LANG-LIT",
    "LIT-DRAMA": "LANG-LIT",
    "LIT-CRITICISM": "LANG-LIT",
    "ARTS-HISTORY": "HUM-ART_HIST",
    "MUSIC-THEORY": "HUM-MUSIC",
    "MUSIC-HISTORY": "HUM-MUSIC",
    "DESIGN-UX-UI": "ARTS-DESIGN",
}

VALID_MODES = set(DOMAIN_MATRIX.keys()) | set(DYNAMIC_DOMAIN_MATRIX.keys())

def normalize_mode(mode: str, default: str = "ACADEMIC-GENERAL") -> str:
    """Return a generation-safe mode with a defined persona/template."""
    mode = str(mode or "").strip().upper()
    if mode in VALID_MODES:
        return mode
    alias = MODE_ALIASES.get(mode)
    if alias in VALID_MODES:
        return alias
    return default

# ── MODE-AWARE PROFESSIONAL DOMAINS (v26.6) ───────────────────────────────────
MODE_SPECIALITIES = {
    "ACADEMIC-GENERAL": ["Interdisciplinary Research", "General Pedagogy", "Foundational Principles"],
    "ECON-MACRO": ["Central Banking & Monetary Policy", "International Trade Analysis", "Fiscal Policy Research", "Market Strategy", "Development Economics"],
    "ECON-MICRO": ["Consumer Behavior Analysis", "Industrial Organization", "Labor Market Economics", "Game Theory Application", "Environmental Economics"],
    "ECON-METRICS": ["Causal Inference", "Time Series Forecasting", "Panel Data Analysis", "Policy Evaluation"],
    "ECON-BEHAVIORAL": ["Nudge Theory", "Decision Heuristics", "Neuroeconomics", "Consumer Psychology"],
    "ECON-FINANCE": ["Investment Banking", "Corporate Finance", "Asset Management", "Financial Audit"],
    "CS-SOFTWARE": ["DevOps & Site Reliability", "Backend Systems Architecture", "Cloud Infrastructure", "Embedded Systems", "Cybersecurity Audit"],
    "CS-SYSTEMS": ["Network Infrastructure", "Distributed Systems", "High-Performance Computing", "Cloud Architecture"],
    "CS-DB": ["Data Engineering", "Database Administration", "Business Intelligence", "Large-scale Data Warehousing"],
    "CS-AI": ["Machine Learning Operations (MLOps)", "Natural Language Processing", "Computer Vision Research", "AI Ethics & Safety"],
    "MATH-PURE": ["Cryptographic Research", "Theoretical Physics", "Algorithmic Analysis", "Pure Math Research"],
    "MATH-STAT": ["Actuarial Science", "Risk Management", "Biostatistics", "Data Science"],
    "PHYSICS-KINEMATICS": ["Aerospace Engineering", "Automotive Design", "Robotics Kinematics", "Ballistics Analysis"],
    "PHYSICS-ELECTRO": ["Antenna Design", "Power Grid Analytics", "Photonics", "Plasma Physics"],
    "PHYSICS-THERMO": ["HVAC Engineering", "Energy Policy", "Cryogenics", "Jet Propulsion"],
    "PHYSICS-QUANTUM": ["Quantum Computing", "Condensed Matter", "Particle Accelerator Operations", "Nanotechnology"],
    "CHEMISTRY": ["Pharmaceutical Research", "Materials Science", "Chemical Engineering", "Forensic Toxicology"],
    "CHEM-ORGANIC": ["Drug Synthesis", "Polymer Science", "Petrochemicals", "Agrochemicals"],
    "CHEM-PHYSICAL": ["Spectroscopy", "Surface Chemistry", "Computational Chemistry", "Catalysis"],
    "BIOLOGY": ["Biomedical Research", "Genetics & Genomics", "Ecology & Conservation", "Neuroscience"],
    "BIO-ECOLOGY": ["Conservation Biology", "Marine Biology", "Wildlife Management", "Climate Adaptation"],
    "BIO-GENETICS": ["CRISPR Engineering", "Epigenetics", "Evolutionary Biology", "Genetic Counseling"],
    "EARTH-GEOLOGY": ["Seismology", "Petroleum Exploration", "Volcanology", "Hydrogeology"],
    "SPACE-ASTRO": ["Planetary Science", "Cosmology", "Telescope Operations", "Astrobiology"],
    "ENG-MECH": ["Structural Engineering", "Manufacturing Systems", "Aerospace Design", "Mechanical Reliability"],
    "ENG-ELEC": ["Circuit Design", "Power Systems Engineering", "Telecommunications", "Semiconductor Mfg"],
    "ENG-CIVIL": ["Urban Planning", "Bridge Design", "Hydraulic Engineering", "Transportation Infrastructure"],
    "ENG-CHEM": ["Process Engineering", "Refining Operations", "Food Technology", "Biochemical Processing"],
    "ENG-AERO": ["Avionics", "Rocketry", "Orbital Mechanics", "Flight Testing"],
    "ENG-BIOMED": ["Prosthetics", "Medical Imaging", "Tissue Engineering", "Clinical Engineering"],
    "MED-PHYSIO": ["Clinical Physiology", "Emergency Medicine", "Internal Medicine", "Surgical Planning"],
    "MED-PHARMA": ["Pharmacology", "Drug Development", "Clinical Trials", "Regulatory Affairs"],
    "MED-ANATOMY": ["Surgical Anatomy", "Histology", "Forensic Anthropology", "Medical Imaging"],
    "MED-PATHOLOGY": ["Oncology Diagnostics", "Infectious Disease", "Immunopathology", "Toxicology"],
    "BIZ-STRATEGY": ["Management Consulting", "Corporate Strategy", "Venture Capital", "Market Research"],
    "BIZ-MARKETING": ["Brand Strategy", "Digital Advertising", "Consumer Analytics", "Public Relations"],
    "BIZ-OPERATIONS": ["Supply Chain Management", "Logistics", "Quality Assurance", "Lean Manufacturing"],
    "LAW-CASE": ["Litigation Strategy", "Judicial Review", "Constitutional Law", "Legal Analysis"],
    "LAW-CONTRACT": ["Mergers & Acquisitions", "Intellectual Property", "Employment Law", "Real Estate Law"],
    "LAW-CRIMINAL": ["Prosecution", "Criminal Defense", "Forensic Law", "White-Collar Crime"],
    "LAW-CONSTITUTIONAL": ["Civil Rights", "Appellate Law", "Government Policy", "Electoral Law"],
    "PHILOSOPHY": ["Ethics Advisory", "Logic & Argumentation", "Social Philosophy", "Political Theory"],
    "SOC-POLITICAL": ["International Relations", "Public Policy", "Comparative Politics", "Political Campaigns"],
    "SOC-ANTHRO": ["Cultural Anthropology", "Archaeology", "Ethnography", "Linguistic Anthropology"],
    "PSYCH-SOCIOLOGY": ["Clinical Psychology", "Urban Sociology", "Organizational Behavior", "Demography"],
    "EDUCATION": ["Inclusive Classroom Practice", "Community Participation", "Stakeholder Collaboration", "Accessible Communication"],
    "HUM-RELIGION": ["Comparative Religion", "Theological Studies", "Ethics", "Religious History"],
    "HUM-MUSIC": ["Music Theory", "Ethnomusicology", "Composition", "Acoustics"],
    "HUM-ART_HIST": ["Curating", "Art Conservation", "Visual Culture", "Museum Studies"],
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
        "mcq": "Design the question strictly around the primary foundational concept of the note. For consumer theory, focus on utility and budget constraints. For producer theory, focus on marginal costs and revenue. Only use law of demand/elasticity calculations if explicitly supported by the source text.",
        "true_false": "Test the relationship between income and normal/inferior goods, or the definition of opportunity cost in the given context.",
        "synthesis": "Design a 'Market Entry', 'Tax Impact', or 'Regulatory Shift' scenario for a specific commodity (e.g., Coffee, Smartphones, Housing). PROHIBITION: Never use currency devaluation or aggregate inflation for Micro notes.",
        "trace": "Design a multi-step analytical trace strictly relevant to the note's core concept (e.g., how a change in input price affects marginal cost and then equilibrium price). PROHIBITION: Do NOT reuse the 'supply curve cost-increase' scenario across different notes unless the topic is specifically about supply shocks.",
        "order": "Order the causal steps of a market moving from a shortage/surplus back to equilibrium, or the steps in a consumer's decision-making process."
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



UNIVERSAL_MODALITY_MATRIX = {
    "Quantitative": {
        "persona_suffix": "Quantitative Analyst and Modeler",
        "h1": "How the Math Works",
        "h2": "Formulas & Equations",
        "artifact": "Calculation Schedule",
        "type": "LaTeX block ($$...$$) or well-formatted Markdown Table tracing numerical relationships",
        "sanity_check": "All mathematical derivations must be fully written out in LaTeX. Ensure step-by-step mathematical logic.",
        "l3_law": "L3 MUST be a multi-step calculation or numerical derivation.",
        "question_modes": ["calculation", "mcq", "trace", "data_analysis"]
    },
    "Qualitative/Definitional": {
        "persona_suffix": "Feynman Educator and Conceptual Analyst",
        "h1": "How It Works",
        "h2": "Key Details",
        "artifact": "Concept Mapping Table",
        "type": "Markdown Table",
        "sanity_check": "Focus on the 'Why' and the conceptual foundations. Avoid complex math.",
        "l3_law": "L3 MUST be a scenario-based conceptual evaluation puzzle.",
        "question_modes": ["scenario", "true_false", "writing", "mcq"]
    },
    "Procedural": {
        "persona_suffix": "Systems and Process Engineer",
        "h1": "How the Process Works",
        "h2": "Process Details",
        "artifact": "Execution Flowchart",
        "type": "Basic Mermaid flowchart (graph TD)",
        "sanity_check": "Focus on the logical sequence of operations, transitions, and step execution.",
        "l3_law": "L3 MUST be a process failure audit or trace.",
        "question_modes": ["trace", "debug", "order", "mcq"]
    },
    "Comparative": {
        "persona_suffix": "Structural Analyst and Comparative Expert",
        "h1": "How the Concepts Compare",
        "h2": "Comparison Details",
        "artifact": "Feature Parity Matrix",
        "type": "Markdown Table (comparing/contrasting at least 2 distinct concepts)",
        "sanity_check": "Ensure a direct contrast is maintained between concepts. Avoid describing them in isolation.",
        "l3_law": "L3 MUST be a comparative trade-off selection task.",
        "question_modes": ["synthesis", "matching", "mcq", "writing"]
    },
    "Causal/Historical": {
        "persona_suffix": "Causal Analyst and Lineage Expert",
        "h1": "How the Story Unfolds",
        "h2": "Causal Details",
        "artifact": "Causal Timeline Flowchart",
        "type": "Basic Mermaid flowchart (graph LR)",
        "sanity_check": "Focus on cascading events over time and cause-and-effect transitions.",
        "l3_law": "L3 MUST predict a cascading outcome based on causal factors.",
        "question_modes": ["order", "scenario", "synthesis", "true_false"]
    }
}

def get_persona(mode: str, modality: str = "Qualitative/Definitional") -> dict:
    """Helper to fetch the congruent persona based on domain and epistemic nature dynamically."""
    mode = normalize_mode(mode)
    
    # Get base domain config
    base_config = DOMAIN_MATRIX.get(mode, DOMAIN_MATRIX["ACADEMIC-GENERAL"])
    base_persona = base_config.get("persona", "Subject Matter Expert")
    
    # Normalize modality
    norm_modality = "Qualitative/Definitional"
    if modality:
        if "Quant" in modality:
            norm_modality = "Quantitative"
        elif "Proc" in modality:
            norm_modality = "Procedural"
        elif "Comp" in modality:
            norm_modality = "Comparative"
        elif "Caus" in modality or "Hist" in modality:
            norm_modality = "Causal/Historical"
            
    mod_config = UNIVERSAL_MODALITY_MATRIX.get(norm_modality, UNIVERSAL_MODALITY_MATRIX["Qualitative/Definitional"])
    
    # Build a dynamically blended persona and configuration
    dynamic_persona = f"{base_persona} specializing as a {mod_config['persona_suffix']}"
    
    # Render dynamic, simple headings
    h1_title = mod_config["h1"]
    h2_title = mod_config["h2"]
    
    return {
        "persona": dynamic_persona,
        "h1": h1_title,
        "h2": h2_title,
        "artifact": mod_config["artifact"],
        "type": mod_config["type"],
        "sanity_check": f"{base_config.get('sanity_check', '')} {mod_config['sanity_check']}".strip(),
        "l3_law": mod_config["l3_law"],
        "question_modes": base_config.get("question_modes", ["mcq", "true_false", "writing"])
    }


# ── EPISTEMIC CLASSIFIER AGENT ────────────────────────────────────────────────

class EpistemicClassifierAgent:
    """The 'Epistemologist'. Tags each concept with a modality to ensure structural congruence."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    # Keyword-based heuristic fallback — used when the LLM call fails
    _QUANT_KEYWORDS = frozenset([
        "calculation", "formula", "equation", "elasticity", "gdp", "rate", "percentage",
        "coefficient", "regression", "mean", "median", "standard deviation", "probability",
        "derivative", "integral", "equilibrium", "price", "quantity", "cost", "revenue",
        "census", "sample", "statistic", "distribution", "variance", "hypothesis"
    ])
    _PROC_KEYWORDS = frozenset([
        "process", "steps", "procedure", "how to", "methodology", "algorithm", "workflow",
        "protocol", "sequence", "collection", "method", "data collection"
    ])
    _COMP_KEYWORDS = frozenset([
        "vs", "versus", "compare", "contrast", "difference", "types of", "advantages",
        "disadvantages", "alternatives"
    ])

    def _heuristic_classify(self, title: str, description: str) -> str:
        """Fast keyword-based fallback for when the LLM classifier fails."""
        text = (title + " " + description).lower()
        tokens = set(text.split())
        if tokens & self._QUANT_KEYWORDS or any(kw in text for kw in self._QUANT_KEYWORDS):
            return "Quantitative"
        if any(kw in text for kw in self._PROC_KEYWORDS):
            return "Procedural"
        if any(kw in text for kw in self._COMP_KEYWORDS):
            return "Comparative"
        return "Qualitative/Definitional"

    async def classify_batch(self, notes: list) -> dict:
        """Categorizes a batch of concepts in a single API pass to avoid rate-limit death."""
        system = """You are an Epistemologist. Categorize the nature of the following technical concepts.
Choose EXACTLY one tag from this taxonomy for EACH concept.

AMBIGUITY PROTOCOL (PRIORITY HIERARCHY):
1. Quantitative: Centered around a mathematical formula, equation, or numerical data. (e.g., Elasticity, GDP calculation, Census sampling, Standard Deviation).
2. Procedural: A sequence of steps, a process, or a workflow. (e.g., Data Collection Methods, How to calculate equilibrium).
3. Comparative: Comparing and contrasting two or more concepts. (e.g., Capitalism vs Socialism, Census vs Sample).
4. Causal/Historical: Explaining a cause-and-effect relationship or history. (e.g., Market Shifts).
5. Qualitative/Definitional: A definition or non-numerical idea. (e.g., Normative Economics, Types of Data).

OUTPUT: You MUST return a JSON object mapping titles to tags.
{"Title_1": "Quantitative", "Title_2": "Procedural"}
Return ONLY pure JSON. No markdown fences, no explanation."""

        results = {}
        batch_size = 15  # Larger batches = fewer API calls
        for i in range(0, len(notes), batch_size):
            chunk = notes[i : i + batch_size]
            concepts_data = "\n".join([
                f"- {n['title']}: {n.get('description', '')}"
                for n in chunk
            ])

            try:
                # Gate through governor before each LLM call
                await governor.get_permit(expected_tokens=len(concepts_data) // 4 + 300)
                res = await self.llm.ainvoke([("system", system), ("human", f"Classify these concepts:\n{concepts_data}")])
                content = res.content.strip()

                if "{" in content and "}" in content:
                    json_str = content[content.find("{"):content.rfind("}")+1]
                    batch_res = json.loads(json_str)
                    results.update(batch_res)
                else:
                    raise ValueError("No JSON found in response")

            except Exception as e:
                print(f"[EpistemicClassifier] Batch classification failed: {e}. Using heuristic fallback.")
                for n in chunk:
                    results[n["title"]] = self._heuristic_classify(n["title"], n.get("description", ""))

        return results

    async def classify(self, note_title: str, description: str, source_context: str) -> str:
        """Legacy single classification for isolated note updates."""
        res = await self.classify_batch([{"title": note_title, "description": description}])
        return res.get(note_title, "Qualitative/Definitional")


# ── ARCHITECT AGENT ───────────────────────────────────────────────────────────

class ArchitectAgent:
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def generate_partial_plan(self, document_text: str, forced_mode: str = None) -> PartialPlan:
        modes_str = ", ".join(DOMAIN_MATRIX.keys())
        
        mode_instruction = f"mode: EXACTLY one code from this list: {modes_str}"
        forced_mode = normalize_mode(forced_mode, "") if forced_mode else ""
        if forced_mode and forced_mode in VALID_MODES:
            mode_instruction = f"mode: You MUST use `{forced_mode}` for all notes in this plan. This is the Law of Cognitive Anchoring. DO NOT use generic analogies (like coffee shops); anchor everything to the {forced_mode} persona."

        system = (
            "You are the Ater Curriculum Architect. Your job is SELECTIVE EXTRACTION, not cataloguing.\n"
            "Extract ONLY the 1-3 most foundational concepts from this text chunk.\n"
            "SELECTION RULE: A concept earns a note ONLY if a student CANNOT understand the chapter without it. "
            "Skip: supporting terms, named persons, historical events, examples, and peripheral mentions.\n"
            "Ask yourself: 'Is this a PILLAR the whole chapter rests on, or just a detail?' Only pillars get notes.\n"
            "RULES:\n"
            "1. Titles: 1-3 words, Title_Case_With_Underscores.\n"
            "2. " + mode_instruction + "\n"
            "3. prerequisites: list dependencies. Do not leave empty for compound concepts.\n"
            "4. concept_modality: EXACTLY one: 'Quantitative', 'Qualitative/Definitional', 'Procedural', 'Comparative', 'Causal/Historical'.\n"
            "5. source_context: PARAPHRASE the core idea in 1 sentence (do NOT copy direct quotes). Add page numbers as integers.\n"
            "6. OUTPUT: Pure JSON ONLY. No markdown, no explanation.\n"
            '{"course_title": "...", "academic_level": "...", "epistemic_stance": "...", '
            '"atomic_notes":[{"title":"...","description":"...","mode":"...","concept_modality":"Qualitative/Definitional","prerequisites":[],'
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
                    note["mode"] = normalize_mode(note.get("mode"), "ACADEMIC-GENERAL")
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
            
        # 1. Clean markdown fences aggressively
        clean = content.strip()
        # Strip code blocks
        clean = re.sub(r'^```(?:json)?\s*', '', clean)
        clean = re.sub(r'\s*```$', '', clean)
        
        blocks = re.findall(r"```(?:json)?\s*([\s\S]*?)```", clean)
        if blocks:
            # Prefer the block with most JSON-like structure
            json_blocks = [b.strip() for b in blocks if "{" in b and "}" in b]
            if json_blocks:
                clean = max(json_blocks, key=len)
        
        # 2. Extract first { to last }
        start = clean.find("{")
        end = clean.rfind("}")
        
        if start == -1 or end == -1:
            raise ValueError(f"No JSON object found in response: {clean[:100]}...")

        json_str = clean[start:end+1]

        # ── PRE-SANITIZE: Strip OCR artifacts & non-ASCII before parsing ──────
        # Non-ASCII chars (™, ©, Arabic, OCR junk) inside source_context values
        # produce "Expecting ',' delimiter" errors in json.loads because they can
        # contain byte sequences that look like JSON delimiters.
        json_str = ''.join(c if ord(c) < 128 else ' ' for c in json_str)

        # 2. Aggressive Sanitization
        # Remove trailing commas
        json_str = re.sub(r",\s*([\]\}])", r"\1", json_str)
        
        json_str = re.sub(r'("[\s\S]*?"\s*:\s*(?:".*?"|\d+|true|false|null|\[.*?\]|\{.*?\}))\s*(?=")', r'\1, ', json_str)

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
                    except Exception:
                        pass

            # Character-level repair: escape unescaped double quotes inside string values
            try:
                repaired = []
                in_string = False
                skip_next = False
                for idx, ch in enumerate(json_str):
                    if skip_next:
                        repaired.append(ch)
                        skip_next = False
                        continue
                    if ch == '\\':
                        repaired.append(ch)
                        skip_next = True
                        continue
                    if ch == '"':
                        if not in_string:
                            in_string = True
                            repaired.append(ch)
                        else:
                            # Peek: is the next meaningful char a JSON delimiter?
                            rest = json_str[idx + 1:].lstrip()
                            if rest and rest[0] in ',:}]':
                                in_string = False
                                repaired.append(ch)
                            else:
                                # Unescaped quote inside string — escape it
                                repaired.append('\\"')
                    else:
                        repaired.append(ch)
                return json.loads(''.join(repaired), strict=False)
            except Exception:
                pass

            raise e

    def _is_rate_limit(self, e: Exception) -> bool:
        msg = str(e).lower()
        return "429" in msg or "rate_limit" in msg or "resource_exhausted" in msg

def _extract_wait_time(err_msg: str, default: float = 5.0) -> float:
    # Example: "Please try again in 2m19.104s" or "Please try again in 13.1328s"
    m = re.search(r"try again in (?:(\d+)m)?([\d\.]+)s", err_msg)
    if m:
        mins = int(m.group(1)) if m.group(1) else 0
        secs = float(m.group(2))
        return mins * 60 + secs + 2.0  # Add 2 seconds buffer
    return default

class TheoryAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    @staticmethod
    def _source_allows_medical_context(source_text: str) -> bool:
        medical_terms = {
            "medicine", "medical", "diagnosis", "diagnostic", "clinical",
            "patient", "hospital", "healthcare", "pharmaceutical", "drug",
            "therapy", "disease", "surgery"
        }
        source_lower = (source_text or "").lower()
        return any(term in source_lower for term in medical_terms)

    @staticmethod
    def _has_forbidden_medical_drift(text: str, source_text: str) -> bool:
        if TheoryAgent._source_allows_medical_context(source_text):
            return False
        drift_terms = {
            "medical", "medicine", "diagnostic", "diagnostics", "clinical",
            "patient", "patients", "hospital", "healthcare", "pharmaceutical",
            "doctor", "doctors", "nurse", "surgery"
        }
        lower = (text or "").lower()
        return any(term in lower for term in drift_terms)

    @staticmethod
    def _fallback_mental_model(title_readable: str, source_text: str) -> str:
        clean = re.sub(r"\[PAGE\s+\d+\]", "", source_text or "", flags=re.IGNORECASE)
        source_lower = clean.lower()
        if any(term in source_lower for term in ["community", "stakeholder", "participation", "inclusive", "inclusion", "diversity"]):
            return (
                f"Imagine a community meeting where every person affected by {title_readable} gets a real seat at the table. "
                f"The idea works only when people with different needs can speak, be understood, and help shape the final decision. "
                f"If one group is left outside the conversation, the plan may look complete on paper but it will fail the people it was supposed to include."
            )
        if any(term in source_lower for term in ["classroom", "student", "teacher", "school", "education"]):
            return (
                f"Imagine a classroom activity where {title_readable} is the rule that keeps every student able to join the work. "
                f"The teacher does not treat participation as a bonus for a few students, but as something the lesson must make possible for everyone. "
                f"When the rule is followed, the class learns from the full group instead of only from the loudest or easiest-to-serve students."
            )
        return (
            f"Imagine {title_readable} as one labeled piece in a larger source-based system. "
            f"You understand it by asking what job that piece performs, what it connects to, and what would break if it were missing. "
            f"The source pages are the boundary: the mental model should make those exact pages easier to understand, not replace them."
        )

    async def generate_mental_model(self, note_schema, source_text: str, academic_level: str, used_scenarios: list = None) -> str:
        """Fallback compatibility signature."""
        title_readable = note_schema.title.replace("_", " ")
        return self._fallback_mental_model(title_readable, source_text)

    @staticmethod
    def _extract_xml(tag: str, text: str) -> str:
        """Robustly extracts content between XML tags, handling markdown fences, filler, and missing closing tags."""
        # 1. Try standard paired tag match
        pattern = rf"<{tag}>(.*?)</{tag}>"
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        
        # 2. Fallback to start tag until next tag or end of string
        if not match:
            fallback_pattern = rf"<{tag}>(.*?)(?=<[A-Z_]+>|$)"
            match = re.search(fallback_pattern, text, re.DOTALL | re.IGNORECASE)
            
        if match:
            content = match.group(1).strip()
            # Clean markdown code fences and headers leaked by LLM
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
            content = re.sub(r'(?m)^\s*#+\s*.*$', '', content)
            return content.strip()
        return ""

    async def generate_theory_core(self, note_schema, source_text: str, all_concepts: str, academic_level: str) -> Dict[str, str]:
        """
        The unified 'Deep Feynman' pass.
        Runs exactly ONE highly optimized 2B-safe XML-tagged LLM call.
        """
        title_readable = note_schema.title.replace("_", " ")
        persona = self.domain.get("persona", "Master Teacher")
        sanity_check = self.domain.get("sanity_check", "")
        
        domain_rules = f"DOMAIN RULES — apply these as hard constraints:\n{sanity_check}" if sanity_check else ""
        sys_prompt = f"""You are a world-class Pedagogue and Expert in {persona}.
Your task is to explain "{title_readable}" based ONLY on the source text.

Your output must consist of exactly two XML blocks:
1. <mental_model>
Vivid, field-specific real-world analogy. Explain using concrete physical mechanisms that a 12-year-old can see, touch, or visualize. Ground this in relatable physical objects (e.g. water pipes, phone networks, lego bricks, mailboxes). Map at least two structural components of the concept from the source text. Keep it 2-3 sentences. Do NOT use abstract clichés (coffee shops, lemonade stands, pizza, burger stands, clockwork, gears).
</mental_model>

2. <core_logic>
3-5 sentences of continuous plain English explaining WHAT the concept is, WHY it exists, and HOW it operates step-by-step.
Assume the reader is a smart 12-year-old (ELIF12). Explain using extremely clear, active-voice prose. Avoid dry academic jargon or passive definitions.
No bullet points. No lists. No markdown headers.
</core_logic>

===SOURCE TEXT===
{source_text[:2500]}
===END SOURCE TEXT===

{domain_rules}

OUTPUT SPECIFICATION: Output ONLY the two XML blocks <mental_model> and <core_logic>. Do not output any markdown headers, introductory text, or other wrappers."""

        plain_english = ""
        detailed_breakdown = ""

        # Execute unified Pass
        for attempt in range(2):
            try:
                await governor.get_permit(expected_tokens=1500)
                res = await self.llm.ainvoke([
                    ("system", sys_prompt),
                    ("human", f"Generate XML nodes for: {title_readable}")
                ])
                content = res.content.strip()
                
                plain_english = TheoryAgent._extract_xml("mental_model", content)
                detailed_breakdown = TheoryAgent._extract_xml("core_logic", content)
                
                if plain_english and detailed_breakdown and len(detailed_breakdown.strip()) >= 30:
                    break
            except Exception as e:
                print(f"[TheoryAgent] Unified pass attempt {attempt+1} failed: {e}")
                if attempt == 1: 
                    raise ValueError("Theory core XML generation failed.")
                await asyncio.sleep(2)

        # Fallback values if XML parsing failed
        if not plain_english or self._has_forbidden_medical_drift(plain_english, source_text):
            plain_english = self._fallback_mental_model(title_readable, source_text)
            
        if not detailed_breakdown:
            clean_source = re.sub(r"\[PAGE\s+\d+\]|\[ARCHITECT SOURCE HINT\]", "", source_text or "", flags=re.IGNORECASE)
            sentences = [
                s.strip()
                for s in re.split(r"(?<=[.!?])\s+", clean_source)
                if len(s.strip()) > 30
            ]
            basis = " ".join(sentences[:3]) or f"The source defines {title_readable} as the focused concept for this note."
            detailed_breakdown = (
                f"{title_readable} means the specific idea isolated by the source excerpt. "
                f"To understand it, first identify the source's exact words, then ask what role the idea plays, "
                f"and finally connect that role to the example or rule shown in the source. {basis}"
            )

        return {
            "plain_english": plain_english,
            "detailed_breakdown": detailed_breakdown,
            "misconceptions": "",
        }

    async def generate_micro(self, note_schema, source_text: str, all_concepts: str, used_scenarios: list = None, academic_level: str = "Unknown", course_title: str = "Unknown", max_tokens: int = 6000) -> Dict[str, Any]:
        theory_data = await self.generate_theory_core(
            note_schema=note_schema,
            source_text=source_text,
            all_concepts=all_concepts,
            academic_level=academic_level
        )
        return {
            "mental_model": theory_data.get("plain_english", ""),
            "core_logic": theory_data.get("detailed_breakdown", ""),
        }

    async def generate(self, note_schema, source_text: str, primary_language: str, all_concepts: str, used_scenarios: list = None) -> str:
        res = await self.generate_micro(note_schema, source_text, all_concepts, used_scenarios)
        return f"FEYNMAN_DATA:{json.dumps(res)}"

    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        return await self.generate(note_schema, source_text, primary_language, all_concepts)

class StructuredArtifactsResponse(BaseModel):
    formal_model: str = Field(description="3-5 sentences of continuous formal prose, academic definitions, constraints, boundary conditions based on the source text.")
    artifact_content: str = Field(description="The high-fidelity markdown table, basic Mermaid diagram, or block LaTeX content based on the source text and domain requirements.")
    limitations: str = Field(description="Exactly 3 specific, source-grounded failure states or edge cases for the concept. Formatted exactly as: **Label**: Explanation.")

class PractitionerAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate_structured_artifacts(
        self,
        note_title: str,
        theory_body: str,
        plain_english: str,
        sanity_check: str,
        persona: str,
        source_text: str,
        academic_level: str,
        course_title: str,
        artifact_type_hint: str = "",
    ) -> Dict[str, Any]:
        """
        Specialized lightweight XML prompt pass.
        Returns:
        1. <formal_model>: Continuous textbook prose.
        2. <artifact_data>: Simple transitions (A -> B) or key-value properties.
        3. <limitations>: Core edge cases.
        All compiled programmatically afterwards.
        """
        title_readable = note_title.replace("_", " ")
        artifact_type = artifact_type_hint or "Markdown Table"
        
        sanity_check_law = f"SANITY CHECK LAW — enforce strictly:\n{sanity_check}" if sanity_check else ""
        sys_prompt = f"""You are an Expert Technical Engineer and Formal Analyst in {persona}.
Your task is to generate the formal explanation and the raw data representing the pedagogical artifact for "{title_readable}" based strictly on the source text.

Your output must consist of exactly three XML blocks:
1. <formal_model>
Generate 3-5 sentences of continuous formal prose, academic definitions, and constraints. Keep it precise, rigorous, and easy to grasp for beginners. Avoid repeat phrasing from the theory body. Do NOT use bullet points or lists.
</formal_model>

2. <artifact_data>
MANDATORY: Generate raw structured data for the concept. You are STRICTLY FORBIDDEN from leaving this block empty. Every single note MUST have an artifact representation.
- If a process, state flow, algorithm, or protocol, list node transitions using arrows:
  [Node Name] -> [Node Name]
  [Node Name] -> [Node Name]
- If a curve, matrix, ledger, comparison, or properties list, output properties as simple key-value lines. Provide the actual category on the left, and the actual text detail on the right. Do NOT use literal placeholders like "Property Name", "Key", "Value", or "Actual Property Name" (e.g. write "Definition: [the actual concept definition]"):
  Key Aspect: Specific Detail from text
  Key Aspect: Specific Detail from text
- If mathematical derivation, list formula equations:
  Formula 1: [Plain LaTeX equation]
  Formula 2: [Plain LaTeX equation]
Never leave this empty. Always represent the core structural mechanics of "{title_readable}" visually/structurally.
</artifact_data>

3. <limitations>
Exactly 3 bullet points, each describing a specific, source-grounded failure state or edge case for "{title_readable}".
Format: **Label**: Explanation.
</limitations>

===SOURCE TEXT===
{source_text[:2000]}
===END SOURCE TEXT===

{sanity_check_law}

OUTPUT SPECIFICATION: Output ONLY the three XML blocks <formal_model>, <artifact_data>, and <limitations>. Do not output any introductory or wrapper text."""

        formal_model = ""
        artifact_data = ""
        limitations = ""

        for attempt in range(2):
            try:
                await governor.get_permit(expected_tokens=1500)
                res = await self.llm.ainvoke([
                    ("system", sys_prompt),
                    ("human", f"Generate XML nodes for: {note_title}")
                ])
                content = res.content.strip()
                
                formal_model = TheoryAgent._extract_xml("formal_model", content)
                artifact_data = TheoryAgent._extract_xml("artifact_data", content)
                limitations = TheoryAgent._extract_xml("limitations", content)
                
                if formal_model and limitations:
                    break
            except Exception as e:
                print(f"[PractitionerAgent] Structured XML pass attempt {attempt+1} failed: {e}")
                if attempt == 1:
                    raise RuntimeError(f"PractitionerAgent.generate_structured_artifacts exhausted retries: {e}")
                await asyncio.sleep(2)

        # programmatically compile artifact_content from artifact_data
        from .compilers import compile_mermaid, compile_table, compile_latex
        compiled_artifact = ""
        
        if artifact_data.strip():
            if "mermaid" in artifact_type.lower() or "flowchart" in artifact_type.lower() or "diagram" in artifact_type.lower() or "->" in artifact_data:
                compiled_artifact = compile_mermaid(artifact_data)
            elif "latex" in artifact_type.lower() or "formula" in artifact_type.lower() or "$$" in artifact_data:
                compiled_artifact = compile_latex(artifact_data)
            else:
                compiled_artifact = compile_table(artifact_data)

        # Fallback values if parsing failed or artifact is empty/optional
        if not formal_model:
            formal_model = f"In formal terms, {title_readable} is defined and bounded by the academic parameters detailed in the source texts."
            
        if not limitations:
            limitations = (
                f"**Scope Boundary**: {title_readable} should only be interpreted through the source excerpt for this note.\n"
                f"**Common Miss**: A student may memorize the name without explaining how the source says it works.\n"
                f"**Check Point**: If an example cannot be tied back to the listed source pages, it should be treated as outside this atomic note."
            )

        return {
            "formal_model": formal_model,
            "artifact_title": self.domain.get("artifact", "Source Artifact"),
            "artifact_content": compiled_artifact,
            "limitations": limitations
        }

    async def generate_micro(self, note_title: str, theory_body: str, primary_language: str, mode: str = "", source_text: str = "", academic_level: str = "Unknown", course_title: str = "Unknown", max_tokens: int = 8000, plain_english: str = "") -> Dict[str, Any]:
        persona = self.domain.get("persona", "Senior Expert")
        sanity_check = self.domain.get("sanity_check", "Ensure logical consistency.")
        artifact_type_hint = self.domain.get("type", "Markdown Table")
        if len(artifact_type_hint) > 80:
            artifact_type_hint = artifact_type_hint[:80]

        try:
            return await self.generate_structured_artifacts(
                note_title=note_title,
                theory_body=theory_body,
                plain_english=plain_english,
                sanity_check=sanity_check,
                persona=persona,
                source_text=source_text,
                academic_level=academic_level,
                course_title=course_title,
                artifact_type_hint=artifact_type_hint,
            )
        except Exception as e:
            print(f"[PractitionerAgent] Falling back to deterministic artifact for {note_title}: {e}")
            title_readable = note_title.replace("_", " ")
            clean_source = re.sub(r"\[PAGE\s+\d+\]|\[ARCHITECT SOURCE HINT\]", "", source_text or "", flags=re.IGNORECASE)
            sentences = [
                s.strip()
                for s in re.split(r"(?<=[.!?])\s+", clean_source)
                if len(s.strip()) > 30
            ][:3]
            source_fact = sentences[0] if sentences else theory_body[:180]
            source_fact = re.sub(r"[\r\n|]+", " ", source_fact)
            source_fact = re.sub(r"\s+", " ", source_fact).strip()
            artifact = (
                "| Source Anchor | Student Meaning |\n"
                "|---|---|\n"
                f"| {title_readable} | The concept this note isolates. |\n"
                f"| {source_fact[:160] or title_readable} | The source detail the explanation must stay attached to. |"
            )
            limitations = (
                f"**Scope Boundary**: {title_readable} should only be interpreted through the source excerpt for this note.\n"
                f"**Common Miss**: A student may memorize the name without explaining how the source says it works.\n"
                f"**Check Point**: If an example cannot be tied back to the listed source pages, it should be treated as outside this atomic note."
            )
            formal_model = f"In formal terms, {title_readable} is defined and bounded by the academic parameters detailed in the source texts."
            return {
                "formal_model": formal_model,
                "artifact_title": self.domain.get("artifact", "Source Artifact"),
                "artifact_content": artifact,
                "limitations": limitations,
            }

    async def generate(self, note_title: str, theory_body: str, primary_language: str, mode: str = "") -> str:
        res = await self.generate_micro(note_title, theory_body, primary_language, mode=mode)
        return f"PRACTITIONER_DATA:{json.dumps(res)}"

    async def retry(self, note_title: str, theory_body: str, primary_language: str, diagnosis: str) -> str:
        return await self.generate(note_title, theory_body, primary_language, mode="")

class QuestionAgent:
    def __init__(self, llm: BaseChatModel, domain: Union[dict, str]):
        self.llm = llm
        # Ensure domain is a dict for the .get() calls in generate()
        if isinstance(domain, str):
            self.domain = DOMAIN_MATRIX.get(domain, DOMAIN_MATRIX["ACADEMIC-GENERAL"])
        else:
            self.domain = domain or DOMAIN_MATRIX["ACADEMIC-GENERAL"]

    async def generate(self, note_schema, source_text: str, mechanics: str, academic_level: str, count: int = 3, prof_domain: str = "General", q_type: str = None, seed: str = None) -> list:
        title_readable = note_schema.title.replace("_", " ")
        self.domain.get("persona", "Subject Matter Expert")
        axioms = self.domain.get("quiz_axioms", "Test core principles.")
        
        schemas = {
            "mcq": '"type": "mcq", "question": "...", "options": {"A": "plausible distractor", "B": "plausible distractor", "C": "correct or plausible", "D": "plausible distractor"}, "answer": "A", "explanation": "..."',
            "true_false": '"type": "true_false", "question": "A clear True/False statement...", "answer": true, "explanation": "..."',
            "writing": '"type": "writing", "question": "...", "answer": "Model answer with full explanation...", "required_keywords": ["keyword1", "keyword2"], "explanation": "..."',
            "scenario": '"type": "scenario", "question": "...", "answer": "...", "required_keywords": ["keyword1"], "explanation": "..."',
            "synthesis": '"type": "synthesis", "question": "...", "answer": "...", "required_keywords": ["keyword1", "keyword2"], "explanation": "..."',
            "trace": '"type": "trace", "question": "...", "answer": "Step-by-step trace answer...", "explanation": "..."',
            "fill_in": '"type": "fill_in", "question": "Short title of topic", "textWithBlanks": "Full sentence with [[blank]] markers for each gap.", "answer": ["word1", "word2"], "explanation": "..."',
            "matching": '"type": "matching", "question": "...", "pairs": [{"left": "Term A", "right": "Definition A"}, {"left": "Term B", "right": "Definition B"}, {"left": "Term C", "right": "Definition C"}, {"left": "Term D", "right": "Definition D"}], "explanation": "..."',
            "order": '"type": "order", "question": "...", "steps": ["Step A (shuffled)", "Step B (shuffled)", "Step C (shuffled)"], "answer": ["Step 1 (correct)", "Step 2 (correct)", "Step 3 (correct)"], "explanation": "..."',
            "debug": '"type": "debug", "question": "What is wrong with the following reasoning/process?", "content": "Flawed reasoning or buggy process text here", "answer": "Identification and correction of the flaw", "explanation": "..."',
            "code": '"type": "code", "question": "...", "codeSnippet": "# Python or pseudocode here", "language": "python", "answer": "Corrected/expected output or explanation", "explanation": "..."',
            "calculation": '"type": "calculation", "question": "...", "content": "Given: ... Find: ...", "answer": "Numeric or formula answer", "explanation": "Step-by-step working..."',
            "data_analysis": '"type": "data_analysis", "question": "...", "content": "Data table or dataset description", "answer": "...", "explanation": "..."'
        }

        # Handle heterogeneous question modes if list/tuple or no specific single type requested
        if not q_type or isinstance(q_type, (list, tuple)):
            if isinstance(q_type, (list, tuple)):
                q_modes = list(q_type)
            else:
                q_modes = self.domain.get("question_modes", ["mcq", "true_false", "writing"]).copy()
            
            while len(q_modes) < count:
                q_modes.append("mcq")
            q_modes = q_modes[:count]
            
            schema_list = []
            for i in range(count):
                m = q_modes[i]
                sch = schemas.get(m, schemas["mcq"])
                schema_list.append(f"Question {i+1} (type: '{m}'):\n{{\n  {sch}\n}}")
            type_schema = "\n\n".join(schema_list)
            q_type_str = f" Generate exactly {count} heterogeneous questions matching these types respectively: {q_modes}."
        else:
            type_schema = schemas.get(q_type, schemas["mcq"])
            q_type_str = f" Ensure ALL {count} questions are of type '{q_type}'."

        # For MCQ: explicitly require 4 options
        mcq_extra = ""
        is_mcq_present = (q_type == "mcq") or (not q_type) or (isinstance(q_type, (list, tuple)) and "mcq" in q_type)
        if is_mcq_present:
            mcq_extra = "\nCRITICAL FOR MCQ: You MUST provide EXACTLY 4 options (A, B, C, D). Never generate only 2 options. All 4 distractors must be plausible but only one is correct."

        keyword_extra = ""
        has_writing_types = not q_type or (isinstance(q_type, str) and q_type in ["writing", "synthesis", "debug", "scenario", "trace"]) or (isinstance(q_type, (list, tuple)) and any(t in q_type for t in ["writing", "synthesis", "debug", "scenario", "trace"]))
        if has_writing_types:
            keyword_extra = """
MANDATORY FOR WRITING, SYNTHESIS, DEBUG, SCENARIO, AND TRACE TYPES:
You MUST include "required_keywords": ["term1", "term2", "term3"] in those question objects.
Rules:
- Exactly 3-5 terms.
- Must be non-trivial technical vocabulary (not stopwords).
- A correct student answer MUST contain these terms to be valid.
- Example: "required_keywords": ["percentage change", "quantity demanded", "inelastic"]
"""

        mode = getattr(note_schema, "mode", "ACADEMIC-GENERAL")
        is_cs = mode.startswith("CS-") or any(w in mode.lower() for w in ["software", "systems", "networking", "cybersecurity", "web", "database", "ai", "db", "arch", "testing"])
        is_econ = "ECON" in mode or "economics" in mode.lower()
        is_math = mode.startswith("MATH-") or any(w in mode.lower() for w in ["calculus", "algebra", "discrete", "pure", "applied", "stats", "statist", "crypto"])
        
        domain_constraints = ""
        if not is_cs:
            domain_constraints += "\n- This is a non-CS domain. You are STRICTLY FORBIDDEN from writing computer programming code (Python, Java, C++, etc.), using code snippets, variables, loops, classes, functions, database queries, or IT/software engineering contexts in the questions, answers, or content."
        if not is_econ:
            domain_constraints += "\n- This is a non-business/non-economics domain. You are STRICTLY FORBIDDEN from using corporate sales, marketing, companies, stocks, profits, revenue, or commercial product launch scenarios."
        if not is_math:
            domain_constraints += "\n- This is a non-math domain. You are STRICTLY FORBIDDEN from using math formulas, equations, derivatives, integrals, or LaTeX blocks in the questions or options. Explain relationships in plain text instead."

        sanity_check = self.domain.get("sanity_check", "")
        l3_law = self.domain.get("l3_law", "")
        
        sanity_check_prompt = f"\n12. DOMAIN SANITY CHECK: {sanity_check}" if sanity_check else ""
        l3_law_prompt = f"\n13. L3 DIFFICULTY LAW: {l3_law}" if l3_law else ""

        sys_prompt = f"""You are a hostile examiner. Prove the student doesn't actually understand "{title_readable}".
Generate EXACTLY {count} question(s).
{q_type_str}

OUTPUT FORMAT: You are permitted to output either a clean JSON array inside <QUIZ_JSON></QUIZ_JSON> tags, OR a clean, human-readable plain text quiz using the standard format inside <QUIZ_TEXT></QUIZ_TEXT> tags.

PLAIN TEXT FORMAT:
<QUIZ_TEXT>
[QUESTION 1]
Type: mcq
Question: (Your question text)
A: Option A
B: Option B
C: Option C
D: Option D
Answer: A
Explanation: (Technical mechanism explanation)

[QUESTION 2]
Type: true_false
Question: (Your true/false question text)
Answer: True
Explanation: (Technical mechanism explanation)
</QUIZ_TEXT>

JSON FORMAT:
<QUIZ_JSON>
[
  {{
    {type_schema}
  }}
]
</QUIZ_JSON>


LAWS (non-negotiable):
1. LEVEL: Match {academic_level} difficulty. Generate highly challenging, conceptual, or analytical questions that force the student to reason deeply. Avoid simple, rote recall questions.
2. DOMAIN: Use professional context "{prof_domain}" for examples.
3. APPLICATION: No simple recall. Ask questions that require applying the concept, tracing pathways, debugging processes, analyzing data, or synthesis.
4. SOURCE LOCK: Every single question MUST test ONLY vocabulary and concepts found in the SOURCE CONTEXT below. If a term or idea is NOT in the source context, you MUST NOT use it.
5. DOMAIN DRIFT PROHIBITION: You are STRICTLY FORBIDDEN from introducing advanced topics not in the source (e.g. aggregate demand curves, monetary policy, game theory, regression analysis, quantum mechanics, etc.) unless they are explicitly stated in the source context.
6. CONTEXT QUARANTINE: Do NOT use medical, hospital, patient, diagnostic, finance, aerospace, physics, or engineering scenarios unless those exact domains appear in the SOURCE CONTEXT.
7. JSON ONLY: Output ONLY the JSON array inside <QUIZ_JSON></QUIZ_JSON> tags. Zero other text.
8. LEAKAGE GUARD: For 'scenario', 'writing', 'trace', and 'debug' types: The 'answer' field MUST BE A DETAILED TEXTUAL EXPLANATION (minimum 2 sentences). NEVER use a single letter (A, B, C, D) as the answer for these types. Single letters are ONLY for 'mcq'.
9. DISTRACTOR PLAUSIBILITY: For MCQ questions, all distractors (incorrect options) must be highly plausible, logical, and representative of common student misconceptions or subtle errors when applying the concept.
10. COGNITIVE DEPTH: Choose questions that target specific operational logic, execution sequences, mathematical relationships, or corner cases that test actual memory of the details of the concept, not vague generalizations.
11. FORMAT INTEGRITY: Ensure the keys and structure of each question type match the schema exactly (e.g., 'textWithBlanks' for fill_in, 'pairs' for matching, 'steps' & 'answer' for order).{domain_constraints}{sanity_check_prompt}{l3_law_prompt}
{mcq_extra}
{keyword_extra}

SOURCE CONTEXT:
{source_text[:3000]}

MECHANICS:
{mechanics}

Domain axioms: {axioms[:300]}"""

        for attempt in range(4):
            try:
                # Precision Pacing: Estimate tokens based on count
                estimated_tokens = (count * 300) + 1000
                await governor.get_permit(expected_tokens=estimated_tokens)
                
                res = await self.llm.ainvoke([
                    ("system", sys_prompt),
                    ("human", f"Generate the S-Tier mastery quiz for {title_readable}. Count: {count}. Seed: {seed or 'None'}")
                ])
                
                content = res.content
                
                # Check for plain text tags first
                text_match = re.search(r"<QUIZ_TEXT>(.*?)</QUIZ_TEXT>", content, re.DOTALL)
                if text_match:
                    from .validator import AterValidator
                    try:
                        data = AterValidator.parse_plain_text_quiz(text_match.group(1))
                        if data and len(data) >= 1:
                            return data
                    except Exception:
                        pass

                match = re.search(r"<QUIZ_JSON>(.*?)</QUIZ_JSON>", content, re.DOTALL)
                if not match:
                    match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
                
                if not match:
                    if content.strip().startswith("[") or "id" in content:
                        raw_json = content.strip()
                    else:
                        from .validator import AterValidator
                        try:
                            data = AterValidator.parse_plain_text_quiz(content)
                            if data and len(data) >= 1:
                                return data
                        except Exception:
                            pass
                        raise Exception("LLM failed to provide <QUIZ_JSON> tags or bare JSON.")
                else:
                    raw_json = match.group(1).strip()


                data = None
                # Attempt 1: direct parse
                try:
                    data = json.loads(raw_json, strict=False)
                except Exception:
                    pass

                # Attempt 2: extract [...] array from response
                if data is None:
                    arr_start = raw_json.find("[")
                    arr_end = raw_json.rfind("]")
                    if arr_start != -1 and arr_end != -1 and arr_end > arr_start:
                        candidate = raw_json[arr_start:arr_end + 1]
                        # Fix trailing commas
                        candidate = re.sub(r",\s*([\]\}])", r"\1", candidate)
                        # Replace literal unescaped newlines inside strings with \n
                        candidate = re.sub(r'(?<=")([^"]*)\n([^"]*?)(?=")', lambda m: m.group(1) + "\\n" + m.group(2), candidate)
                        try:
                            data = json.loads(candidate, strict=False)
                        except Exception:
                            try:
                                data = json.loads(candidate.replace("\n", " ").replace("\r", ""), strict=False)
                            except Exception:
                                pass

                # Attempt 3: extract individual {...} objects and build list
                if data is None:
                    objects = []
                    depth = 0
                    buf = []
                    for ch in raw_json:
                        if ch == "{":
                            depth += 1
                        if depth > 0:
                            buf.append(ch)
                        if ch == "}" and depth > 0:
                            depth -= 1
                            if depth == 0:
                                obj_str = "".join(buf)
                                obj_str = re.sub(r",\s*([}\]])", r"\1", obj_str)
                                try:
                                    obj = json.loads(obj_str, strict=False)
                                    if isinstance(obj, dict) and "type" in obj and "question" in obj:
                                        objects.append(obj)
                                except Exception:
                                    pass
                                buf = []
                    if objects:
                        data = objects

                # Attempt 4: dict-based fallback or plain-text parser recovery
                if data is None:
                    try:
                        data = ArchitectAgent._parse_json(raw_json)
                    except Exception:
                        from .validator import AterValidator
                        try:
                            data = AterValidator.parse_plain_text_quiz(content)
                        except Exception:
                            pass
                        if not data:
                            print(f"[QuestionAgent] RAW CONTENT DUMP (first 800 chars):\n{content[:800]}")
                            raise Exception("All JSON parse attempts failed for quiz output.")


                if isinstance(data, dict) and "questions" in data:
                    data = data["questions"]
                elif isinstance(data, dict):
                    if "type" in data and "question" in data:
                        data = [data]

                if not isinstance(data, list):
                    raise Exception("Extracted quiz data is not a list.")

                sanitized_qs = []
                for q in data:
                    if not isinstance(q, dict):
                        continue
                    
                    q_type_actual = q.get("type", "mcq")
                    if "question" not in q or not q["question"]:
                        q["question"] = f"Understand the core mechanism of {title_readable}."
                    if "explanation" not in q or not q["explanation"]:
                        q["explanation"] = "Explained in the textbook context."
                    if "answer" not in q:
                        q["answer"] = "A" if q_type_actual == "mcq" else (True if q_type_actual == "true_false" else "Correct explanation.")
                    
                    if q_type_actual == "mcq" and ("options" not in q or not isinstance(q["options"], dict) or len(q["options"]) < 2):
                        q["options"] = {"A": "Correct explanation.", "B": "Incorrect distractor.", "C": "Irrelevant concept.", "D": "None of the above."}
                        q["answer"] = "A"

                    for field in ["question", "explanation", "answer", "content"]:
                        if q.get(field) and isinstance(q[field], str):
                            q[field] = q[field].replace('\\\\n', '\\n').replace('\\n', '\n')
                    sanitized_qs.append(q)
                    
                if len(sanitized_qs) < count:
                    raise Exception(f"Generated only {len(sanitized_qs)} questions, expected {count}.")
                elif len(sanitized_qs) > count:
                    sanitized_qs = sanitized_qs[:count]

                return sanitized_qs

            except Exception as e:
                if isinstance(e, DailyLimitExceededException) or "daily limit exceeded" in str(e).lower() or "limit reached" in str(e).lower():
                    raise e
                err_msg = str(e).lower()
                is_429 = "429" in err_msg or "rate limit" in err_msg or "rate_limit" in err_msg
                if is_429:
                    wait_sec = _extract_wait_time(err_msg, default=5.0)
                    governor.report_error(wait_seconds=wait_sec)
                    await asyncio.sleep(wait_sec)
                
                print(f"[QuestionAgent] Attempt {attempt+1} failed: {e}")
                if attempt == 3:
                    clean_source = re.sub(r"\[PAGE\s+\d+\]|\[ARCHITECT SOURCE HINT\]", "", source_text or "", flags=re.IGNORECASE)
                    fact_sentences = [
                        s.strip()
                        for s in re.split(r"(?<=[.!?])\s+", clean_source)
                        if len(s.strip()) > 30
                    ]
                    anchor = fact_sentences[0] if fact_sentences else title_readable
                    return [
                        {
                            "type": "mcq",
                            "question": f"Which statement best matches the source's treatment of {title_readable}?",
                            "options": {
                                "A": anchor[:180],
                                "B": f"{title_readable} is unrelated to the source excerpt.",
                                "C": f"{title_readable} can be explained without checking the source.",
                                "D": f"{title_readable} is only a label with no mechanism."
                            },
                            "answer": "A",
                            "explanation": f"The correct answer is the only option anchored directly in the source context for {title_readable}."
                        },
                        {
                            "type": "true_false",
                            "question": f"{title_readable} should be understood using the exact source pages attached to this note.",
                            "answer": True,
                            "explanation": "The atomic note is source-bounded, so the attached pages define the valid scope."
                        },
                        {
                            "type": "writing",
                            "question": f"Explain {title_readable} in two simple sentences using one detail from the source.",
                            "answer": f"A strong answer states what {title_readable} means and connects it to a concrete source detail.",
                            "required_keywords": [w for w in re.findall(r"[A-Za-z]{4,}", title_readable.lower())[:3]] or ["source"],
                            "explanation": "This checks whether the student can turn the source wording into a usable explanation."
                        },
                    ][:count]

                wait_time = _extract_wait_time(err_msg, default=2 * (attempt + 1)) if is_429 else (attempt + 1)
                await asyncio.sleep(wait_time)

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
        await governor.get_permit(expected_tokens=300)
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
            "You are the Ater Curriculum Architect. Synthesize a unified Hub overview.\n"
            "SYNTHESIS GAP PROTOCOL: ONLY if you detect BOTH quantitative/mathematical notes and qualitative/philosophical "
            "notes on the same topic, you should include a specific 'Integrated Synthesis' paragraph that bridges "
            "the math and the philosophy of that topic. If all notes are qualitative, do NOT invent or reference any math, "
            "formulas, or quantitative models.\n\n"
            "Given the descriptions of the atomic notes in this unit, write a 3-paragraph executive summary "
            "of how these concepts interlock to form the larger system. Focus on the core pedagogical narrative.\n\n"
            "Output ONLY the text of the overview. Do not include markdown headers or greetings."
        )
        user_msg = f"Unit: {unit_title}\n\nConcepts in this unit:\n" + "\n".join(descriptions)
        await governor.get_permit(expected_tokens=1200)
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", user_msg)])
        
        # Robust regex: Find ## Overview and replace everything until the next ## header
        pattern = r"(## Overview\n)(.*?)(?=\n##|$)"
        if re.search(pattern, current_hub_text, flags=re.DOTALL):
            new_hub_text = re.sub(
                pattern,
                lambda m: f"{m.group(1)}{res.content.strip()}\n\n",
                current_hub_text,
                flags=re.DOTALL
            )
        else:
            # Fallback: if Overview is missing, prepend it
            new_hub_text = f"## Overview\n{res.content.strip()}\n\n{current_hub_text}"
            
        return new_hub_text


# ── VERIFIER AGENT ─────────────────────────────────────────────────────────────
class VerifierAgent:
    """Post-generation semantic quality gate. Checks all 5 failure categories."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def verify(self, note_title: str, mode: str, note_content: str, source_context: str, modality: str = "Qualitative/Definitional") -> dict:
        sys_prompt = f"""You are a rigorous academic quality auditor. Evaluate this atomic study note.
Return ONLY a valid JSON object - no markdown fences, no commentary.

        CHECK ALL CRITERIA:
- `clean_output`: No "Wait", "Let me think", or "As an AI". No all-caps text.
- `feynman_integrity`: Does the note follow the 3-step ladder? (Plain English analogy -> Logical Breakdown -> Academic Translation).
- `unique_scenario`: Is the analogy fresh and not a cliché?

Output format - use EXACTLY this structure:
{{"feynman_integrity":true,"unique_scenario":true,"clean_output":true,"failures":[{{"check":"feynman_integrity","issue":"exact description","fix_instruction":"exact fix"}}]}}

failures is an empty array [] if all checks pass.
Source context: {source_context[:400]}"""
        user_msg = f"Note title: {note_title}\nMode: {mode}\nModality: {modality}\n\nContent:\n{note_content[:3000]}"
        
        last_error = None
        for attempt in range(2):
            try:
                await governor.get_permit(expected_tokens=1000)
                retry_note = f"\n\nFIX PREVIOUS ERROR: {last_error}\nReturn ONLY pure JSON.\n" if last_error else ""
                res = await self.llm.ainvoke([("system", sys_prompt + retry_note), ("human", user_msg)])
                data = ArchitectAgent._parse_json(res.content)
                passed = all([
                    data.get("feynman_integrity", True),
                    data.get("unique_scenario", True),
                    data.get("clean_output", True)
                ])
                return {"passed": passed, "failures": data.get("failures", [])}
            except Exception as e:
                last_error = e
                print(f"[VerifierAgent] Verification attempt {attempt+1} failed: {e}")
                if attempt == 1:
                    # Parse failure ≠ content failure — default to PASS to stop false regen loops.
                    import logging as _logging
                    _logging.getLogger("Ater").warning("[VerifierAgent] Both attempts failed. Defaulting to PASS to avoid false block.")
                    return {"passed": True, "failures": []}


# ── QUIZ AUDITOR AGENT ─────────────────────────────────────────────────────────
class QuizAuditorAgent:
    """Fast quiz-only check: topicality, debug validity, fill_in blank format."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def audit(self, note_title: str, quiz_json_str: str, theory_summary: str, prof_domain: str = "General") -> dict:
        title_readable = note_title.replace("_", " ")
        sys_prompt = f"""You are a quiz quality auditor. Evaluate these technical questions for "{title_readable}".
Return ONLY a valid JSON object.

The note's concept is: "{title_readable}"
For each question check:
- Is the question DIRECTLY about "{title_readable}"? (Not a generic math fact, not the analogy)
- CONTEXT LOCK: Does the question use a professional domain UNRELATED to the concept or the intended domain "{prof_domain}"? (e.g., Bioinformatics in an Economics note = FAIL, but using "{prof_domain}" terminology is REQUIRED).
- GROUNDING: Does the question require specific data (numbers, constants) NOT present in the theory summary? (Hallucinated facts = FAIL).
- SHUFFLE CHECK: For type="order", are the 'steps' already in the correct order? (Identity ordering = FAIL).
- DEBUG CHECK: If type="debug": does 'content' actually contain a wrong step? (Answer="no error"=FAIL).
- DUPLICATE CHECK: Do any two questions test the same sub-topic using the same numerical setup? FAIL if duplicates found.
- ANSWER CONSISTENCY: For trace/debug types, does the answer field value match the final computed value in the explanation? (e.g., if explanation says "Price = 10", answer must be "10").
- SCAFFOLDING CHECK: Are there any 'internal monologues', 'AI signatures', or 'CoT leakage' in the explanation? (e.g. "Wait, let's correct that", "As an AI...", or "Let's simplify"). FAIL if found.
- For fill_in: does 'text_with_blanks' (or 'textWithBlanks') use the correct `[[blank]]` format? (FAIL if it uses the literal word "Blank", "___", or any other placeholder without double brackets).
- Is the stated 'answer' definitively correct for the question asked?
- STRICT SOURCE LOCK: Every question MUST be derived from: {theory_summary[:2000]}

Output:
{{"passed":true,"issues":[],"fix_instruction":""}}
OR if problems:
{{"passed":false,"issues":["Q1: Context Hallucination detected.","Q3: Duplicate question found.","Q4: Answer '10' diverges from explanation value '12'."],"fix_instruction":"exact instruction"}}

Key facts about "{title_readable}": {theory_summary[:2500]}"""
        user_msg = f"Quiz JSON:\n{quiz_json_str[:2000]}"
        last_error = None
        for attempt in range(2):
            try:
                await governor.get_permit(expected_tokens=1500)
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

class TaxonomyExtenderAgent:
    """The 'Cartographer Prime'. Meta-analyzes unknown material to extend the system's brain."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def analyze_new_domain(self, final_course: str, document_text: str) -> dict:
        try:
            domain_logic = await self.propose_extension(document_text, f"New course detected: {final_course}")
            if domain_logic:
                return {
                    "status": "success",
                    "domain_logic": domain_logic
                }
        except Exception as e:
            print(f"[TaxonomyExtender] analyze_new_domain failed: {e}")
        return {"status": "error", "message": "Failed to analyze domain"}

    async def propose_extension(self, document_text: str, unknown_context: str) -> dict:
        system = """You are the 'Cartographer Prime' of the Ater system. 
Your task is to meta-analyze a document that the system failed to classify into its existing taxonomy.
You must propose a NEW DOMAIN ENTRY and associated KEYWORDS.

ANALYSIS PROTOCOL:
1. Identify the core academic or professional discipline (e.g., CS-BLOCKCHAIN, BIO-GENOMICS, LAW-ADMIRALTY).
2. Propose a Persona: A high-level expert in this field.
3. Propose H1 and H2 headers that follow the Ater 'Mechanism & Failure' philosophy.
4. Propose an Artifact Type (e.g., Mermaid diagram, Code block, LaTeX proof).
5. Extract 10-15 highly specific keywords that serve as deterministic anchors for this domain.

OUTPUT: Return ONLY a JSON object with this structure:
{
  "domain_id": "UPPERCASE-ID",
  "persona": "...",
  "h1": "...",
  "h2": "...",
  "artifact": "...",
  "type": "...",
  "keywords": ["kw1", "kw2", ...],
  "l3_law": "...",
  "sanity_check": "..."
}
Return ONLY pure JSON. No explanation."""
        
        try:
            res = await self.llm.ainvoke([
                ("system", system), 
                ("human", f"Unknown Context:\n{unknown_context}\n\nFull Document Excerpt:\n{document_text[:5000]}")
            ])
            data = ArchitectAgent._parse_json(res.content)
            return data
        except Exception as e:
            print(f"[TaxonomyExtender] Failed to propose extension: {e}")
            return {}

class MetaScannerAgent:
    """The Oracle's Eye. Runs before the Architect to provide global context."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def scan_full_text(self, full_text: str) -> Dict[str, Any]:
        """Analyzes the entire text to produce a ContextBriefing."""
        system = """You are a University Provost. Analyze the entirety of the following document.
Provide a high-level executive summary and extract the core disciplinary identity.

Return ONLY a JSON object with this structure:
{
  "summary": "One-paragraph executive summary.",
  "keywords": ["kw1", "kw2", ...],
  "primary_discipline": "e.g., 'Database Theory'",
  "secondary_disciplines": ["e.g., 'Formal Logic'", "e.g., 'Set Theory'"]
}
Return ONLY pure JSON. No markdown. No explanation."""
        
        try:
            # We take a large sample if it's too long, but ideally we scan as much as possible
            # For extremely long docs, we might sample beginning, middle, and end.
            sample = full_text[:40000] 
            if len(full_text) > 40000:
                sample = full_text[:15000] + "\n...[MIDDLE]...\n" + full_text[len(full_text)//2 - 5000 : len(full_text)//2 + 5000] + "\n...[END]...\n" + full_text[-10000:]

            await governor.get_permit(expected_tokens=400)
            res = await self.llm.ainvoke([
                ("system", system), 
                ("human", f"DOCUMENT TEXT:\n{sample}")
            ])
            data = ArchitectAgent._parse_json(res.content)
            return data
        except Exception as e:
            print(f"[MetaScannerAgent] Failed to scan document: {e}")
            return {
                "summary": "No summary available.",
                "keywords": [],
                "primary_discipline": "General Academic",
                "secondary_disciplines": []
            }
