import json
import re
import asyncio
import hashlib
from typing import Any, Dict, List
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import PartialPlan

# ── DOMAIN MATRIX v26.1 (UPGRADED) ───────────────────────────────────────────
DOMAIN_MATRIX = {
    "ACADEMIC-GENERAL":   {"persona":"Subject Matter Expert","h1":"Core Concept","h2":"Context & Limitations","artifact":"Concept Map","type":"Markdown Table","question_modes":["mcq", "true_false", "writing", "fill_in"]},
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
    "PHYSICS-ELECTRO":    {"persona":"Physicist","h1":"Electromagnetic Law","h2":"Boundary Conditions","artifact":"Field Diagram","type":"ASCII Diagram or block LaTeX","question_modes":["mcq", "fill_in", "scenario", "trace"]},
    "PHYSICS-THERMO":     {"persona":"Thermodynamicist","h1":"Thermodynamic Principle","h2":"Entropy & Irreversibility","artifact":"Energy Flow","type":"Basic Mermaid flowchart","question_modes":["mcq", "fill_in", "scenario", "trace"]},
    "PHYSICS-QUANTUM":    {"persona":"Quantum Physicist","h1":"Quantum State","h2":"Decoherence","artifact":"Probability Distribution","type":"Block LaTeX ($$)","question_modes":["mcq", "fill_in", "writing", "trace"]},
    "CHEMISTRY":          {"persona":"Chemist","h1":"Reaction Mechanism","h2":"Equilibrium","artifact":"Reaction Pathway","type":"Basic Mermaid flowchart or Block LaTeX","question_modes":["mcq", "scenario", "debug", "order"]},
    "CHEM-ORGANIC":       {"persona":"Organic Chemist","h1":"Reaction Mechanism","h2":"Steric Hindrance","artifact":"Synthesis Pathway","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "debug", "order"]},
    "CHEM-PHYSICAL":      {"persona":"Physical Chemist","h1":"Chemical Kinetics","h2":"Thermodynamic Limits","artifact":"Rate Equation","type":"Block LaTeX ($$)","question_modes":["mcq", "fill_in", "debug", "trace"]},
    "BIOLOGY":            {"persona":"Biologist","h1":"Biological Process","h2":"System Failures","artifact":"Pathway Diagram","type":"Basic Mermaid flowchart (graph TD)","question_modes":["true_false", "scenario", "writing", "matching"]},
    "BIO-ECOLOGY":        {"persona":"Ecologist","h1":"Ecological Interaction","h2":"System Disruption","artifact":"Food Web","type":"Basic Mermaid flowchart","question_modes":["true_false", "scenario", "writing", "matching"]},
    "BIO-GENETICS":       {"persona":"Geneticist","h1":"Genetic Pathway","h2":"Mutations","artifact":"Inheritance Tree","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "trace", "matching"]},
    "EARTH-GEOLOGY":      {"persona":"Geologist","h1":"Geological Process","h2":"Erosional Limits","artifact":"Stratigraphic Column","type":"Markdown Table","question_modes":["mcq", "fill_in", "writing", "order"]},
    "SPACE-ASTRO":        {"persona":"Astrophysicist","h1":"Cosmic Phenomenon","h2":"Observational Limits","artifact":"Stellar Evolution","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "writing", "trace"]},
    "ENG-MECH":           {"persona":"Mechanical Engineer","h1":"Mechanical Principle","h2":"Load & Fatigue","artifact":"Force Diagram","type":"ASCII Diagram or Markdown Table","question_modes":["fill_in", "scenario", "debug", "order"]},
    "ENG-ELEC":           {"persona":"Circuit Designer","h1":"Circuit Logic","h2":"Resistance & Heat","artifact":"Circuit Schematic","type":"Truth Table (Markdown) or block LaTeX","question_modes":["true_false", "scenario", "debug", "trace"]},
    "ENG-CIVIL":          {"persona":"Civil Engineer","h1":"Structural Principle","h2":"Failure Modes","artifact":"Load Distribution","type":"Markdown Table or ASCII Diagram","question_modes":["mcq", "scenario", "debug", "trace"]},
    "ENG-CHEM":           {"persona":"Chemical Engineer","h1":"Process Flow","h2":"Yield Losses","artifact":"Process Flow Diagram","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "debug", "order"]},
    "ENG-AERO":           {"persona":"Aerospace Engineer","h1":"Aerodynamic Principle","h2":"Drag & Turbulence","artifact":"Flight Dynamics","type":"Block LaTeX or Table","question_modes":["mcq", "scenario", "debug", "trace"]},
    "ENG-BIOMED":         {"persona":"Biomedical Engineer","h1":"Biomechanical System","h2":"Biocompatibility Issues","artifact":"Device Interface","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "MED-PHYSIO":         {"persona":"Surgeon","h1":"Bodily Function","h2":"Disease & Failure","artifact":"System Map","type":"Markdown Adjacency Matrix Table","question_modes":["fill_in", "scenario", "writing", "matching"]},
    "MED-PHARMA":         {"persona":"Toxicologist","h1":"Drug Mechanism","h2":"Side Effects","artifact":"Interaction Pathway","type":"Markdown Table or Basic Mermaid flowchart","question_modes":["mcq", "scenario", "debug", "matching"]},
    "MED-ANATOMY":        {"persona":"Anatomist","h1":"Structural Component","h2":"Anatomical Anomalies","artifact":"Morphological Map","type":"Markdown Table","question_modes":["mcq", "fill_in", "writing", "matching"]},
    "MED-PATHOLOGY":      {"persona":"Pathologist","h1":"Disease Mechanism","h2":"Diagnostic Pitfalls","artifact":"Pathogenesis Flow","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "writing", "matching"]},
    "ECON-MACRO":         {"persona":"Macroeconomist","h1":"Economic Theory","h2":"Market Failures","artifact":"Economic Model","type":"Basic Mermaid flowchart (graph LR)","question_modes":["true_false", "scenario", "writing", "order", "trace"]},
    "ECON-MICRO":         {"persona":"Microeconomist","h1":"Micro Theory","h2":"Efficiency & Distortions","artifact":"Market Graph","type":"Basic Mermaid flowchart (graph TD/LR) or LaTeX","question_modes":["mcq", "fill_in", "true_false", "trace"]},
    "ECON-METRICS":       {"persona":"Econometrician","h1":"Statistical Model","h2":"Endogeneity","artifact":"Regression Output","type":"Markdown Table or LaTeX","question_modes":["mcq", "fill_in", "debug", "trace"]},
    "ECON-BEHAVIORAL":    {"persona":"Behavioral Economist","h1":"Cognitive Bias","h2":"Market Anomalies","artifact":"Decision Matrix","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "ECON-FINANCE":       {"persona":"Accountant","h1":"Financial Concept","h2":"Financial Risk","artifact":"Ledger Example","type":"Markdown T-Account/Ledger Table","question_modes":["true_false", "scenario", "debug", "matching"]},
    "BIZ-STRATEGY":       {"persona":"Business Strategist","h1":"Strategic Concept","h2":"Weaknesses","artifact":"Strategy Matrix","type":"Markdown Table (SWOT)","question_modes":["mcq", "scenario", "writing", "synthesis"]},
    "BIZ-MARKETING":      {"persona":"Marketing Executive","h1":"Market Principle","h2":"Consumer Churn","artifact":"Campaign Funnel","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "writing", "order"]},
    "BIZ-OPERATIONS":     {"persona":"Operations Manager","h1":"Process Optimization","h2":"Supply Chain Bottlenecks","artifact":"Process Map","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "debug", "trace"]},
    "LAW-CASE":           {"persona":"Lawyer","h1":"Legal Principle","h2":"Exceptions & Limits","artifact":"Case Application","type":"IRAC Framework Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "LAW-CONTRACT":       {"persona":"Corporate Lawyer","h1":"Contract Rule","h2":"Breach Conditions","artifact":"Liability Map","type":"Markdown Dependency Table","question_modes":["fill_in", "scenario", "writing", "matching"]},
    "LAW-CRIMINAL":       {"persona":"Criminal Defense Attorney","h1":"Criminal Statute","h2":"Defenses & Exceptions","artifact":"Burden of Proof","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "LAW-CONSTITUTIONAL": {"persona":"Constitutional Scholar","h1":"Constitutional Principle","h2":"Rights Limitations","artifact":"Precedent Map","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "writing", "matching"]},
    "HIST-CATALYST":      {"persona":"Historian","h1":"Historical Event","h2":"Long-term Impact","artifact":"Timeline","type":"Basic Mermaid flowchart (graph TD) or Table","question_modes":["fill_in", "scenario", "writing", "order"]},
    "PHILOSOPHY":         {"persona":"Philosopher","h1":"Core Argument","h2":"Counter-Arguments","artifact":"Logical Flow","type":"ASCII Logic Tree or Block quote","question_modes":["mcq", "scenario", "writing", "synthesis"]},
    "SOC-POLITICAL":      {"persona":"Political Scientist","h1":"Political Theory","h2":"Institutional Failure","artifact":"Power Dynamics","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "SOC-ANTHRO":         {"persona":"Anthropologist","h1":"Cultural Phenomenon","h2":"Ethnocentrism","artifact":"Cultural Framework","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "PSYCH-SOCIOLOGY":    {"persona":"Psychologist","h1":"Behavioral Concept","h2":"Cognitive Bias","artifact":"Behavior Map","type":"Markdown Matrix Table","question_modes":["true_false", "scenario", "writing", "matching"]},
    "HUM-RELIGION":       {"persona":"Theologian","h1":"Theological Concept","h2":"Sectarian Differences","artifact":"Doctrinal Map","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "HUM-MUSIC":          {"persona":"Musicologist","h1":"Musical Theory","h2":"Stylistic Deviations","artifact":"Harmonic Structure","type":"Markdown Table or ASCII","question_modes":["mcq", "fill_in", "writing", "order"]},
    "HUM-ART_HIST":       {"persona":"Art Historian","h1":"Artistic Movement","h2":"Critical Reception","artifact":"Visual Analysis","type":"Markdown Table","question_modes":["mcq", "fill_in", "writing", "matching"]},
    "LANG-LINGUISTICS":   {"persona":"Grammarian","h1":"Grammar Rule","h2":"Exceptions","artifact":"Syntax Tree","type":"ASCII Syntax Tree","question_modes":["mcq", "fill_in", "writing", "order"]},
    "LANG-LIT":           {"persona":"Literary Critic","h1":"Literary Device","h2":"Thematic Impact","artifact":"Textual Analysis","type":"Markdown Quote/Motif Table","question_modes":["mcq", "fill_in", "writing", "synthesis"]},
    "ARTS-DESIGN":        {"persona":"Designer","h1":"Design Principle","h2":"Breaking the Rule","artifact":"Composition Matrix","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "SKILLS-HARD":        {"persona":"Master Craftsman","h1":"Core Technique","h2":"Troubleshooting","artifact":"Execution Steps","type":"Basic Mermaid flowchart or Numbered list","question_modes":["fill_in", "scenario", "writing", "order"]},
    "SKILLS-FITNESS":     {"persona":"Kinesiologist","h1":"Biomechanics","h2":"Injury Prevention","artifact":"Movement Trace","type":"Markdown Kinematic Table","question_modes":["fill_in", "scenario", "writing", "trace"]},
    "EDUCATION":          {"persona":"Teacher","h1":"Learning Theory","h2":"Knowledge Gaps","artifact":"Curriculum Flow","type":"Markdown Table","question_modes":["fill_in", "scenario", "writing", "matching"]},
    "RESEARCH-METHODS":   {"persona":"Researcher","h1":"Research Method","h2":"Validity Threats","artifact":"Methodology Setup","type":"Markdown Research Matrix","question_modes":["mcq", "scenario", "writing", "matching"]},
    "MATH-CALCULUS":      {"persona":"Mathematician","h1":"Limit & Rate","h2":"Boundary Conditions","artifact":"Function Trace","type":"Block LaTeX ($$)","question_modes":["mcq", "fill_in", "debug", "trace"]},
    "MATH-ALGEBRA":       {"persona":"Algebraist","h1":"Algebraic Structure","h2":"Edge Cases","artifact":"Matrix / Function","type":"Block LaTeX ($$)","question_modes":["mcq", "fill_in", "debug", "synthesis"]},
    "CS-CYBERSECURITY":   {"persona":"Security Researcher","h1":"Attack Vector","h2":"Vulnerabilities","artifact":"Threat Model","type":"Basic Mermaid flowchart","question_modes":["true_false", "scenario", "debug", "trace"]},
    "CS-NETWORKING":      {"persona":"Network Engineer","h1":"Protocol Logic","h2":"Packet Loss & Failure","artifact":"Network Topology","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "debug", "trace"]},
    "MED-NEUROLOGY":      {"persona":"Neuroscientist","h1":"Neural Pathway","h2":"Neurological Deficits","artifact":"Synaptic Diagram","type":"Basic Mermaid flowchart","question_modes":["mcq", "fill_in", "writing", "matching"]},
    "MED-IMMUNOLOGY":     {"persona":"Immunologist","h1":"Immune Response","h2":"Autoimmune Failure","artifact":"Cellular Interaction","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "order"]},
    "LANG-FOREIGN":       {"persona":"Linguist","h1":"Syntactic Structure","h2":"False Friends & Idioms","artifact":"Conjugation/Declension","type":"Markdown Table","question_modes":["mcq", "fill_in", "matching", "writing"]},
    "ARTS-FILM":          {"persona":"Film Theorist","h1":"Cinematic Technique","h2":"Narrative Impact","artifact":"Scene Breakdown","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "synthesis"]},
    "BIZ-ENTREPRENEURSHIP":{"persona":"Startup Founder","h1":"Value Proposition","h2":"Market Risks","artifact":"Business Canvas","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "synthesis"]},
    "SOC-CRIMINOLOGY":    {"persona":"Criminologist","h1":"Criminological Theory","h2":"Systemic Bias","artifact":"Behavioral Matrix","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
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
    "ECON-MICRO": "NEVER use 'Central Banking', 'Exchange Rates', or 'Currency Devaluation'. Focus on individual markets, consumers, and firms. The Demand Curve for a normal good is ALWAYS downward-sloping. ANALOGY PROHIBITION: NEVER use lemonade stands, bake sales, ice cream shops, or toy stores. Use real-world scenarios: housing markets, smartphone pricing, gasoline demand, coffee shop competition.",
    "ECON-MACRO": "NEVER use 'Lemonade Stands' or child-centric analogies. Focus on national aggregates. Use real-world scenarios: National budgets, unemployment cycles, international trade agreements, central bank interest rate decisions.",
}

def get_domain_instruction(mode: str) -> str:
    instr = DOMAIN_SPECIFIC_INSTRUCTIONS.get(mode, "Explain the concept with high technical density and professional rigor.")
    prohibition = DOMAIN_PROHIBITIONS.get(mode, "")
    if prohibition:
        instr = f"{instr}\n\nSTRICT PROHIBITION: {prohibition}"
    return instr

VALID_MODES = set(DOMAIN_MATRIX.keys())

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


# ── DOMAIN PROHIBITIONS & WALKTHROUGH STYLE ───────────────────────────────────
# NOTE: The primary DOMAIN_PROHIBITIONS dict is defined above at line ~171 and
# merged into DOMAIN_SPECIFIC_INSTRUCTIONS by get_domain_instruction().
# Additional mode-level prohibitions injected into ALL agent prompts:
DOMAIN_EXTRA_PROHIBITIONS: Dict[str, str] = {
    "MATH-PURE":          "NEVER use ODEs, dy/dx, d²y, integrals (∫), ẋ(t), or any continuous calculus. ALL worked examples MUST use integer-indexed sequences (aₙ, f(n)). Verify every arithmetic step before writing it.",
    "MATH-DISCRETE":      "NEVER use differential equations, integrals, or continuous functions. Use ONLY discrete structures: integer sequences, recurrences, combinatorics, graphs, propositional logic. Verify every arithmetic step.",
    "MATH-STAT":          "NEVER drift into ODEs or deterministic mechanics. Keep all examples probabilistic with proper random variable notation.",
    "MATH-CRYPTO":        "Focus exclusively on discrete cryptographic operations. NEVER drift into continuous probability or calculus.",
    "CS-SOFTWARE":        "NEVER generate OAuth/JWT/UUID/distributed-system content unless the note title explicitly names those topics. Code MUST use the primary_language. Every code block must be syntactically correct and runnable.",
    "CS-DB":              "NEVER confuse relational schema with NoSQL document structure unless both are the note's topic. Avoid application-layer auth topics.",
    "CS-AI":              "NEVER confuse model training with inference, or supervised with unsupervised, unless that distinction IS the concept.",
    "MED-PHYSIO":         "NEVER confuse physiology with pharmacology. Stay in the specific organ system or physiological mechanism relevant to the concept title.",
    "MED-PHARMA":         "NEVER confuse pharmacokinetics (what the body does to the drug) with pharmacodynamics (what the drug does to the body) unless the concept explicitly covers both.",
    "PHYSICS-KINEMATICS": "Use SI units throughout. NEVER confuse kinematics (motion) with dynamics (forces) unless the concept explicitly covers both.",
    "ENG-ELEC":           "NEVER confuse AC and DC analysis unless the concept explicitly covers both. All circuit values must be physically plausible.",
    "PHILOSOPHY":         "Ground every claim in a named philosophical tradition or argument. NEVER use vague 'some philosophers say' attributions.",
    "LAW-CASE":           "NEVER generalize across jurisdictions. Specify the jurisdiction (common law / civil law / specific country) for every legal claim.",
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

    async def generate_partial_plan(self, document_text: str, forced_mode: str = None) -> PartialPlan:
        modes_str = ", ".join(DOMAIN_MATRIX.keys())
        
        mode_instruction = f"mode: EXACTLY one code from this list: {modes_str}"
        if forced_mode and forced_mode in DOMAIN_MATRIX:
            mode_instruction = f"mode: You MUST use `{forced_mode}` for all notes in this plan. This has been pre-verified by a domain specialist."

        system = (
            "You are the OKA Curriculum Architect. Extract 15-25 atomic concepts from the text.\n"
            "First, evaluate the Domain and Academic Level of the entire document.\n"
            "RULES:\n"
            "1. Titles: 1-3 words, Title_Case_With_Underscores, never a question.\n"
            "2. " + mode_instruction + "\n"
            "   **CRITICAL MODE RULES**:\n"
            "   - If confident in a discipline, pick the specific code (e.g. `ECON-MICRO`, `PHYSICS-QUANTUM`, `LAW-CRIMINAL`).\n"
            "   - If confidence is <90% or the topic spans many fields, you MUST fall back to `ACADEMIC-GENERAL`.\n"
            "3. **PREREQUISITE DEPENDENCIES**: If a concept is 'compound' or 'derived' (e.g., 'GDP Deflator' depends on 'Nominal GDP'), you MUST list the prerequisites in the `prerequisites` array. NEVER leave it empty for non-atomic starting concepts.\n"
            "4. source_context: copy 1-2 most relevant sentences.\n"
            "5. source_pages: list page numbers mentioned (integers only).\n"
            "OUTPUT: pure JSON only — no markdown fences.\n"
            '{"course_title": "...", "academic_level": "...", "epistemic_stance": "...", '
            '"atomic_notes":[{"title":"...","description":"...","mode":"...","prerequisites":[],'
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
                        note["mode"] = "ACADEMIC-GENERAL"
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

    async def generate_micro(self, note_schema, source_text: str, all_concepts: str, used_scenarios: list = None, academic_level: str = "Unknown", course_title: str = "Unknown") -> Dict[str, str]:
        title_readable = note_schema.title.replace("_", " ")
        
        if academic_level in ["High School", "Undergraduate 101"]:
            scope_constraint = "Match the academic level of the source text. If the text is a 101-level introduction, DO NOT introduce advanced graduate-level concepts, external theories, or outside jargon (like Bounded Rationality or Industrial Organization) to sound smart. Strictly use the boundaries provided by the PDF. Use the exact terminology found in the text for limitations (e.g., use 'monopolies' or 'inefficiency' instead of translating them into advanced terms like 'imperfect competition' or 'information asymmetry')."
        elif academic_level in ["Undergraduate 300/400", "Master's"]:
            scope_constraint = "When writing the 'Limitations' section, critically evaluate the model. Introduce real-world friction, exceptions, and bridging concepts to higher-level theories."
        elif academic_level in ["Doctoral / Post-Doc", "Research Paper"]:
            scope_constraint = "When writing the 'Limitations' section, focus on epistemological boundaries, current gaps in the academic literature, and theoretical failures at the frontier of research. Assume the reader is a peer."
        else:
            scope_constraint = "Match the academic level of the source text. DO NOT introduce advanced graduate-level concepts to sound smart. Strictly use the boundaries provided by the PDF."

        context_wrapper = f"You are generating material for a course titled exactly: **{course_title}**. When framing examples, writing graph captions, or designing quizzes, you MUST use this exact course title as your context. DO NOT hallucinate advanced sub-fields, unrelated academic disciplines, or outside context wrappers."
        
        source_examples_instruction = "Whenever the source text provides specific real-world examples (e.g., Japan's aging population, hand looms), you MUST prioritize using those exact examples in your walkthroughs before inventing your own (like Apple or Ford)."
        
        scope_constraint = f"{context_wrapper}\n\n{scope_constraint}\n\n{source_examples_instruction}"
        
        # Scenario exclusion: prevent the same everyday analogy from being reused
        scenario_ban = ""
        if used_scenarios:
            banned = ", ".join(f"'{s}'" for s in used_scenarios[-8:])
            scenario_ban = (
                f"\nANALOGY PROHIBITION: The following everyday scenarios have ALREADY been used in "
                f"this batch and MUST NOT be reused: {banned}. "
                f"Pick a completely different, vivid real-world scenario instead."
            )

        prof_domain = get_professional_domain(note_schema.title, note_schema.mode)
        # 1. Analogy Call
        analogy_prompt = f"As a {self.domain['persona']}, explain '{title_readable}' using a professional real-world scenario (NOT a toy store or candy shop). Use a scenario from: {prof_domain}. Map TWO specific components explicitly. When creating the Mental Model, you MUST explicitly integrate the exact subtypes or definitions found in the text. (e.g., If the text defines a concept as A, B, and C, your real-world analogy must feature A, B, and C). ONE paragraph only.{scenario_ban}\n\n{scope_constraint}"
        analogy_res = await self.llm.ainvoke(
            [("system", analogy_prompt), ("human", f"Analogy for {title_readable} based on: {source_text[:1000]}")],
            max_tokens=512
        )
        
        # 2. Technical Call
        tech_prompt = f"""You are a strict data-extraction parser operating as a {self.domain['persona']}.
Your task is to provide a technical definition for '{title_readable}'.

{scope_constraint}

You are FORBIDDEN from outputting conversational text or markdown. You must output EXACTLY and ONLY valid JSON matching this schema:
```json
{{
  "core_paragraph": "Write exactly ONE concise paragraph defining the concept and mechanism. Max 4 sentences. Embed 2-3 wikilinks from this list ONLY: {all_concepts}",
  "key_takeaways": [
    "First key takeaway based strictly on the text",
    "Second key takeaway",
    "Third key takeaway"
  ]
}}
```

VERBATIM SOURCE ANCHOR: The following sentences from the textbook MUST be the foundation of your technical definition. Do not contradict them:
"{source_text[:400]}\""""
        tech_res = await self.llm.ainvoke([("system", tech_prompt), ("human", f"Technical analysis for {title_readable}")])
        
        # Assemble Markdown from JSON
        import json
        raw_tech = tech_res.content.strip()
        # Fix string stitching typo sometimes generated by local models
        raw_tech = raw_tech.replace("enFor", "ensure. For")
        clean_json = raw_tech.replace("```json", "").replace("```", "").strip()
        try:
            tech_data = json.loads(clean_json)
            assembled_tech = f"{tech_data.get('core_paragraph', '')}\n\n### Key Takeaways:\n"
            for tk in tech_data.get('key_takeaways', []):
                assembled_tech += f"- {tk}\n"
        except Exception:
            assembled_tech = raw_tech # Fallback if model failed JSON formatting
        
        # 3. Limitations Call
        limit_prompt = f"As a {self.domain['persona']}, analyze the specific limitations and edge cases of '{title_readable}'. ONE paragraph only. No bullets.\n\n{scope_constraint}"
        limit_res = await self.llm.ainvoke([("system", limit_prompt), ("human", f"Limitations of {title_readable} based on: {source_text[:1000]}")])
        
        return {
            "mental_model": analogy_res.content.strip(),
            "technical_definition": assembled_tech.strip(),
            "limitations": limit_res.content.strip()
        }

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

        sys_prompt = f"""You are a strict data-extraction parser operating as a world-class {self.domain['persona']}.
Your goal is to extract theoretical knowledge about '{title_readable}' from the source text.

{domain_fix}
{scenario_ban}

You are FORBIDDEN from outputting conversational text or markdown. You must output EXACTLY and ONLY valid JSON matching this schema:

```json
{{
  "mental_model": "Explain the ENTIRE concept using a vivid, professional real-world scenario from: {prof_domain}. Map at least 2 mechanical components of the analogy to the concept. 2-3 sentences. No technical jargon.",
  "core_paragraph": "Write exactly ONE concise paragraph defining the concept. Max 4 sentences. Embed 3-5 wikilinks from this list ONLY: {all_concepts}",
  "key_takeaways": [
    "First key takeaway based strictly on the text",
    "Second key takeaway",
    "Third key takeaway"
  ],
  "limitations": "Analyze the specific limitations, model assumptions that break down, and known edge cases of '{title_readable}' in 2-3 sentences. Embed 3-5 wikilinks from this list ONLY: {all_concepts}"
}}
```

Concept: {title_readable}
Source context: {source_text[:2000]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", f"Theoretical Architecture for {title_readable}")])
        return res.content.strip()

    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = f"""You are a helpful {self.domain['persona']} tutor.

PREVIOUS ATTEMPT FAILED. FIX INSTRUCTION: {diagnosis}

Write EXACTLY 3 sections.

## 1. Mental Model
Explain to a 10-year-old using a vivid everyday analogy.

## 2. {self.domain['h1']}
Provide the rigorous technical definition and mechanism. 
MANDATORY: Embed 3-5 wikilinks from this list ONLY: {all_concepts}

## 3. Limitations & Edge Cases
Analyze the specific limitations and edge cases of '{title_readable}'. Do NOT use the heading 'Market Failures' unless this note is specifically about externalities or market imperfections.

Concept: {title_readable}
Source context: {source_text[:1500]}"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected theory sections.")])
        return res.content.strip()

class PractitionerAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate_micro(self, note_title: str, theory_body: str, primary_language: str, mode: str = "", source_text: str = "", academic_level: str = "Unknown", course_title: str = "Unknown") -> Dict[str, str]:
        title_readable = note_title.replace("_", " ")
        prof_domain = get_professional_domain(note_title, mode=mode)
        
        if academic_level in ["High School", "Undergraduate 101"]:
            artifact_req = "Generate a 5-step logical walkthrough or simple arithmetic calculation."
        elif academic_level in ["Doctoral / Post-Doc", "Research Paper"]:
            artifact_req = "Generate a rigorous LaTeX block ($$) proving the theorem or deriving the equation step-by-step."
        else:
            artifact_req = "Generate a Python/C++ code block implementing this concept, or a complex Mermaid architecture diagram."

        context_wrapper = f"You are generating material for a course titled exactly: **{course_title}**. When framing examples, writing graph captions, or designing quizzes, you MUST use this exact course title as your context. DO NOT hallucinate advanced sub-fields, unrelated academic disciplines, or outside context wrappers."
        
        source_examples_instruction = "Whenever the source text provides specific real-world examples (e.g., Japan's aging population, hand looms), you MUST prioritize using those exact examples in your walkthroughs before inventing your own (like Apple or Ford)."

        # 1. Artifact Call
        art_prompt = f"As a {self.domain['persona']}, provide EXACTLY ONE high-fidelity artifact (type: {self.domain['type']}) for '{title_readable}' in {prof_domain}. If code, use {primary_language}. If math, use LaTeX ($$). Follow with 2 sentences of explanation.\n\n{context_wrapper}\n\nARTIFACT REQUIREMENT: {artifact_req}\n\n{source_examples_instruction}"
        art_res = await self.llm.ainvoke([("system", art_prompt), ("human", f"Artifact for {title_readable} based on: {theory_body[:1000]}\n\nSource constraint: {source_text[:1000]}")])
        
        import re
        has_math = bool(re.search(r'[\d%=$+*/-]', source_text))
        
        if has_math:
            math_instruction = "Extract the exact equation from the text and solve it in 5 steps."
        else:
            math_instruction = "The text is purely theoretical. Write a 5-step logical breakdown. YOU ARE STRICTLY FORBIDDEN FROM USING NUMBERS OR INVENTING STATISTICS."

        # 2. Walkthrough Call
        walk_prompt = f"""As a {self.domain['persona']}, provide a strict technical walkthrough of how '{title_readable}' operates.
GROUNDING RULE: Every scenario MUST come directly from the provided source text.
{math_instruction}
- PROHIBITION: NEVER invent names like 'Azura', 'Luminaria', or 'Company X'. Use real companies (e.g., Apple, Ford) or real commodities (e.g., WTI Crude Oil, Wheat).
{context_wrapper}
No intro."""
        walk_res = await self.llm.ainvoke([("system", walk_prompt), ("human", f"Walkthrough for {title_readable} based on: {theory_body[:1000]}\n\nSource text: {source_text[:1000]}")])
        
        return {
            "artifact_content": art_res.content.strip(),
            "walkthrough": walk_res.content.strip()
        }

    async def generate(self, note_title: str, theory_body: str, primary_language: str, mode: str = "") -> str:
        title_readable = note_title.replace("_", " ")
        prof_domain = get_professional_domain(note_title, mode=mode)
        domain_fix = get_domain_instruction(mode)
        
        import re
        has_math = bool(re.search(r'[\d%=$+*/-]', theory_body))
        
        if has_math:
            math_instruction = "Extract the exact equation from the text and solve it in 5 steps."
        else:
            math_instruction = "The text is purely theoretical. Write a 5-step logical breakdown. YOU ARE STRICTLY FORBIDDEN FROM USING NUMBERS OR INVENTING STATISTICS."

        sys_prompt = f"""You are a helpful {self.domain['persona']} and technical writer.
Complete the sovereign note for '{title_readable}' by adding the high-fidelity artifact and execution walkthrough.

{domain_fix}

STRICT INSTRUCTION: Output ONLY the requested sections. NO introductory text like "Here's the rest of the note". Start directly with '## 4. {self.domain['artifact']}'.

## 4. {self.domain['artifact']}
Provide EXACTLY ONE high-fidelity artifact of type: **{self.domain['type']}** for the domain **{prof_domain}**.
GROUNDING: If the source text contains specific data, equations, or code, you MUST use it. If not, use real-world industry benchmarks (e.g., 'S&P 500 average return of 10%').
PROHIBITION: No placeholders or generic 'Variable_A'.
If code, use ```primary_language. If math, use block LaTeX ($$).
Followed by 2-3 sentences of prose explaining HOW to read this artifact.

## 5. Walkthrough
Provide a strict, 5-step technical walkthrough of how the concept/artifact operates in **{prof_domain}**.
Show intermediate state changes or data transformations. 
You are a Practitioner. You must create a 5-step walkthrough based ONLY on the source text. 
{math_instruction}

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

## 4. {self.domain['artifact']}
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
        
        # --- PHASE 1: Extract Core Fact ---
        topic_prompt = f"From this note about '{title_readable}', extract ONE specific testable fact or mechanism.\nReturn ONLY a single sentence. Do NOT invent anything. Use ONLY text from the context.\nContext: {context[:1500]}"
        topic_res = await self.llm.ainvoke([("system", topic_prompt), ("human", "Extract the testable fact.")])
        core_fact = topic_res.content.strip()

        # Load Specialized Sub-Agent Protocol
        protocol_map = DOMAIN_QUESTION_PROTOCOLS.get(mode, {})
        specialized_instruction = protocol_map.get(self.canonical_type, "Focus on high-fidelity technical application and deep causal understanding.")

        prompts = {
            "mcq": f"Find a technical nuance about '{title_readable}' within {prof_domain}. {specialized_instruction} Generate 1 correct answer and 3 distractors. Distractors must be technically plausible, not 'None of the above' or 'All of the above'.",
            "true_false": f"Generate a high-stakes T/F statement regarding a critical failure point of '{title_readable}' within {prof_domain}. {specialized_instruction}",
            "fill_in": f"Extract a VERBATIM or near-verbatim sentence directly from the 'Context' section below that contains the single most important technical term for '{title_readable}'. Replace that term with [[blank]]. The sentence MUST come from the Context, not be invented. REMOVE all other [[wikilinks]] from the sentence.",
            "writing": f"Challenge the user to analyze '{title_readable}' in a {prof_domain} scenario. {specialized_instruction} Provide a 3-5 sentence 'Perfect Response' demonstrating mastery. NO RUBRICS.",
            "matching": f"Extract 4 distinct technical components of '{title_readable}' and their specific roles in {prof_domain}. {specialized_instruction} Shuffle them.",
            "order": f"Identify a 4-5 step technical process or causal chain for '{title_readable}'. {specialized_instruction} Use REAL steps from the text. SHUFFLE the 'steps' array so they are NOT in order. PROHIBITION: Never use 'step1', 'step2', or generic markers. The steps must be logically sequential (A -> B -> C), not just a list of definitions.",
            "debug": f"Act as a Principal Specialist in {prof_domain}. {specialized_instruction} Provide a code/formula/scenario snippet for '{title_readable}' with ONE subtle, realistic technical error. If mode is ECON-MICRO, use a supply/demand schedule or a utility function error. If mode is LAW, use a misapplied precedent.",
            "trace": f"Provide a valid, complex technical execution trace for '{title_readable}' in {prof_domain}. {specialized_instruction} Ask for the exact final state/output. If mode is ECON, trace a variable change through the model steps.",
            "synthesis": f"Create an emergency scenario in {prof_domain} where '{title_readable}' must be applied to prevent system failure. {specialized_instruction} Provide a definitive 'Mastery Solution'."
        }
        
        schemas = {
            "mcq": '{"type":"mcq","difficulty":"' + difficulty + '","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"B","explanation":"..."}',
            "true_false": '{"type":"true_false","difficulty":"' + difficulty + '","question":"...","answer":false,"explanation":"..."}',
            "fill_in": '{"type":"fill_in","difficulty":"' + difficulty + '","question":"Fill in the blank.","textWithBlanks":"The [[blank]] is...","answer":["exactword"],"explanation":"..."}',
            "writing": '{"type":"writing","difficulty":"' + difficulty + '","question":"Explain...","answer":"...","required_keywords":["keyword1", "keyword2"],"explanation":"..."}',
            "matching": '{"type":"matching","difficulty":"' + difficulty + '","question":"Match terms.","pairs":[{"left":"...","right":"..."}]}',
            "order": '{"type":"order","difficulty":"' + difficulty + '","question":"Order steps.","steps":["step2","step3","step1"],"answer":["step1","step2","step3"]}',
            "debug": '{"type":"debug","difficulty":"' + difficulty + '","question":"Find the bug.","content":"...","answer":"...","required_keywords":["fix_this_keyword"],"explanation":"..."}',
            "trace": '{"type":"trace","difficulty":"' + difficulty + '","question":"What is the exact output?","content":"...","answer":"...","required_keywords":["keyword1"],"explanation":"..."}',
            "synthesis": '{"type":"synthesis","difficulty":"' + difficulty + '","question":"Complex scenario...","answer":"...","required_keywords":["concept1"],"explanation":"..."}'
        }
        
        prompt_logic = prompts.get(self.canonical_type, prompts["writing"])
        json_schema = schemas.get(self.canonical_type, schemas["writing"])
        
        domain_fix = get_domain_instruction(mode)

        sys_prompt = f"""You are the Dedicated '{self.canonical_type.upper()}' Question Agent, operating as a **{persona}**.
{prompt_logic}

{domain_fix}

### [STRICT CONCEPT SCOPE LOCK]
Generate a 3-question quiz based strictly on the text provided. 
**GOOD EXAMPLE:** If the text is about 'Scarcity', ask 'What happens when resources are limited?'
**BAD EXAMPLE:** If the text is about 'Scarcity', do not ask about 'Game Theory' or 'Labor Markets' because they were not mentioned.
Only test facts explicitly written in the text above.

1. **NO EXTERNAL CONCEPTS**: Do NOT use concepts, scenarios, or professional domains outside of the provided context or the intended '{prof_domain}' domain.
2. **GROUND TRUTH**: The question MUST test this specific fact: "{core_fact}"
3. **NO ANALOGY DEPENDENCY**: If the theory uses an analogy (e.g., 'A factory is like a cell'), the question must be about the CELL, not the factory.
4. **MODE ADHERENCE**:
   - If mode='ECON-MACRO': scenarios MUST involve GDP, inflation, or central banks. No bioinformatics.
   - If mode='ECON-MICRO': scenarios MUST involve firms, consumers, or price elasticity. No generic software engineering.
4. **FILL_IN PROTOCOL**:
   - You MUST replace the target technical term with the exact string `[[blank]]` in the `textWithBlanks` field.
   - Blanks must be CRITICAL TECHNICAL terms found in the text.
   - **STRICT PROHIBITION**: You MUST NOT leave any [[wikilinks]] or bracketed terms in the `textWithBlanks` string except for the `[[blank]]` marker.

ENTROPY ENFORCEMENT:
- You are generating question **{index} of {total}** for this concept.
- FOCUS HINT: {topic_hint}

MANDATORY SCHEMA:
{json_schema}

STRICT RULES:
1. Output ONLY a valid JSON object. No markdown fences.
2. The 'answer' field MUST be a definitive correct response. 
3. Professional Context: You are currently operating in the **{prof_domain}** domain.
4. ANTI-LAZINESS: If the question or answer is generic or uses placeholders, it will be REJECTED.
5. OPEN-ENDED RUBRICS: For writing, synthesis, debug, and trace questions, you MUST include a 'required_keywords' array containing 2-4 mandatory technical keywords/phrases that MUST be present in a correct answer.

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
            "of how these concepts interlock to form the larger system. Focus on the core pedagogical narrative.\n\n"
            "Output ONLY the text of the overview. Do not include markdown headers or greetings."
        )
        user_msg = f"Unit: {unit_title}\n\nConcepts in this unit:\n" + "\n".join(descriptions)
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
                    return {"passed": False, "failures": [{"check": "verifier_parse_error", "issue": "Verifier could not assess note quality", "fix_instruction": "Regenerate the theory section."}]}


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
- DUPLICATE CHECK: Do any two questions test the same sub-topic using the same numerical setup? FAIL if duplicates found.
- ANSWER CONSISTENCY: For trace/debug types, does the answer field value match the final computed value in the explanation? (e.g., if explanation says 'Price = 10', answer must be '10').
- SCAFFOLDING CHECK: Are there any 'internal monologues', 'AI signatures', or 'CoT leakage' in the explanation? (e.g. "Wait, let's correct that", "As an AI...", or "Let's simplify"). FAIL if found.
- For fill_in: does 'textWithBlanks' use [[Blank1]] format (NOT wikilink names as blanks)?
- Is the stated 'answer' definitively correct for the question asked?

Output:
{"passed":true,"issues":[],"fix_instruction":""}
OR if problems:
{"passed":false,"issues":["Q1: Context Hallucination detected.","Q3: Duplicate question found.","Q4: Answer '10' diverges from explanation value '12'."],"fix_instruction":"exact instruction"}

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
