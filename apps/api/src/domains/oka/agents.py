import json
import re
import asyncio
import hashlib
from typing import Any, Dict, List, Optional, Union
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import PartialPlan, TheoryResponse, PractitionerResponse, QuizResponse, Question, ContextBriefing
from .governor import governor

# ── DOMAIN MATRIX v26.1 (UPGRADED) ───────────────────────────────────────────
DOMAIN_MATRIX = {
    "DOMAIN-UNKNOWN": {"persona":"Universal Polymath","h1":"Universal Concept","h2":"General Context","artifact":"Interdisciplinary Analysis","type":"Markdown Table","question_modes":["mcq", "true_false", "writing"], "sanity_check": "Focus on first principles and logical foundations.", "l3_law": "L3 MUST be a first-principles application of the concept."},
    "ACADEMIC-GENERAL":   {"persona":"Subject Matter Expert","h1":"Core Concept","h2":"Context & Limitations","artifact":"Concept Map","type":"Markdown Table","question_modes":["mcq", "true_false", "writing", "fill_in"], "sanity_check": "Ensure logical consistency and source anchoring.", "l3_law": "L3 MUST be a multi-step analytical application of the core concept to a novel scenario."},
    "CS-SOFTWARE":        {"persona":"Software Engineer","h1":"How it Works","h2":"Common Pitfalls","artifact":"Code Example","type":"Executable code block (under 20 lines)","question_modes":["fill_in", "true_false", "debug", "trace"], "sanity_check": "Code artifacts must not contain infinite loops, syntax errors, or undeclared variables. Time/Space complexity must be accurate.", "l3_law": "L3 MUST be a 'Trace/Debug'. Provide a block of code and ask for the exact final output/state of a variable, OR provide broken code and ask to identify the specific line causing the logical failure."},
    "CS-SYSTEMS":         {"persona":"Systems Architect","h1":"System Flow","h2":"Where it Breaks","artifact":"Architecture Diagram","type":"Basic Mermaid flowchart (graph TD/LR)","question_modes":["mcq", "scenario", "debug", "order"]},
    "CS-DB":              {"persona":"Database Admin","h1":"Query Logic","h2":"Data Integrity","artifact":"Database Schema","type":"SQL code block or Markdown Table","question_modes":["true_false", "scenario", "debug", "matching"]},
    "CS-AI":              {"persona":"Machine Learning Eng.","h1":"Model Mechanics","h2":"Overfitting & Bias","artifact":"Data Pipeline","type":"Basic Mermaid flowchart or Python code","question_modes":["mcq", "fill_in", "scenario", "trace"]},
    "CS-TESTING":         {"persona":"QA Engineer","h1":"Test Strategy","h2":"Edge Cases","artifact":"Test Scenario","type":"Code block (assertions) or Markdown Table","question_modes":["true_false", "scenario", "debug", "synthesis"]},
    "CS-ARCH":            {"persona":"Software Architect","h1":"Design Pattern","h2":"Trade-offs","artifact":"Component Diagram","type":"Basic Mermaid flowchart or Markdown Table","question_modes":["mcq", "scenario", "writing", "order"]},
    "CS-REQUIREMENTS":    {"persona":"Product Manager","h1":"Goal Definition","h2":"Scope Creep","artifact":"Requirements Table","type":"Markdown Table (max 3 columns)","question_modes":["true_false", "scenario", "writing", "matching"]},
    "MATH-PURE":          {"persona":"Mathematician","h1":"Formal Definition","h2":"Proof Strategy","artifact":"Mathematical Proof","type":"Block LaTeX ($$)","question_modes":["mcq", "fill_in", "debug", "synthesis"], "sanity_check": "Proofs must not skip logical steps. Do not divide by zero. Ensure edge cases (like n=0 or negative numbers) are accounted for.", "l3_law": "L3 MUST be a rigorous formula derivation or a formal proof step verification."},
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
    "MED-PHYSIO":         {"persona":"Surgeon","h1":"Bodily Function","h2":"Disease & Failure","artifact":"System Map","type":"Markdown Adjacency Matrix Table","question_modes":["fill_in", "scenario", "writing", "matching"], "sanity_check": "Physiological cascades must follow strict biological directionality (e.g., Agonist vs Antagonist). Do not mix up pathways.", "l3_law": "L3 MUST be a 'System Perturbation Trace'. E.g., If Enzyme X is inhibited, what is the exact cascading effect on Molecule Y?"},
    "MED-PHARMA":         {"persona":"Toxicologist","h1":"Drug Mechanism","h2":"Side Effects","artifact":"Interaction Pathway","type":"Markdown Table or Basic Mermaid flowchart","question_modes":["mcq", "scenario", "debug", "matching"]},
    "MED-ANATOMY":        {"persona":"Anatomist","h1":"Structural Component","h2":"Anatomical Anomalies","artifact":"Morphological Map","type":"Markdown Table","question_modes":["mcq", "fill_in", "writing", "matching"]},
    "MED-PATHOLOGY":      {"persona":"Pathologist","h1":"Disease Mechanism","h2":"Diagnostic Pitfalls","artifact":"Pathogenesis Flow","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "writing", "matching"]},
    "ECON-MACRO":         {"persona":"Macroeconomist","h1":"Economic Theory","h2":"Market Failures","artifact":"Theoretical Model & Data","type":"Basic Mermaid flowchart (graph LR)","question_modes":["true_false", "scenario", "trace", "writing", "order"], "sanity_check": "Economic models must maintain consistency with Aggregate Demand/Supply behavior. Ensure coordinate shifts are explained logically.", "l3_law": "L3 MUST be a multi-step mathematical calculation or a complex policy impact derivation."},
    "ECON-MICRO":         {"persona":"Microeconomist","h1":"Micro Theory","h2":"Efficiency & Distortions","artifact":"Data Schedule & Visualization","type":"Markdown Table (Demand/Supply Schedule) OR ASCII Text Graph. Do NOT use Mermaid flowcharts for plotting economic curves. Use a well-formatted Markdown Table showing Price and Quantity, accompanied by a LaTeX block explaining the coordinate shift, or a clear ASCII representation of a Cartesian graph. Discipline Prohibition: DO NOT generate Python, R, or any programming code. Mathematical artifacts must be pure LaTeX or Markdown tables.","question_modes":["mcq", "fill_in", "trace", "true_false"], "sanity_check": "Microeconomic Axioms: \n1. ONLY Marginal/Variable costs shift the short-run supply curve. Fixed costs DO NOT shift supply.\n2. Do not conflate Macroeconomic Aggregate Demand with Microeconomic Market Clearing. If supply shifts, price falls until the market clears.\n3. Clearly distinguish between 'a shift in the curve' and 'a movement along the curve'. NEVER use a curve shifter (like Technology, Weather, or Income) to explain a price-induced movement ALONG the curve (like Law of Demand or Law of Supply).\n4. Never refer to the price BEFORE a shift as the 'equilibrium price' AFTER the shift.\n5. SUPPLY ELASTICITY AXIOM: To calculate Price Elasticity of Supply (Es), you MUST use a scenario where DEMAND shifts, causing movement along the supply curve. NEVER use a scenario where supply shifts (like a drought) to calculate Es, as this yields a negative number which violates the Law of Supply.\n6. SHIFTS vs. MOVEMENTS AXIOM: If the concept is a curve SHIFTER (e.g., Income, Technology, Number of Buyers), your Artifact and Walkthrough MUST feature TWO distinct equations (e.g., D1 and D2) to prove the curve shifted horizontally at a CONSTANT price. You are STRICTLY FORBIDDEN from demonstrating a shifter by plugging different prices into a single, stationary equation.\n7. AGGREGATION AXIOM: NEVER equate 'quantity demanded' with 'number of buyers'. They are distinct concepts. Always use standard 'Horizontal Summation' (Qd_market = Qd1 + Qd2) to demonstrate the addition of buyers. DO NOT invent or use obscure academic axioms (e.g., 'Aggregation Axiom') not present in the source text.\n8. INCOME COEFFICIENTS AXIOM: If a good is NORMAL, the income variable (I) in the demand function MUST be positive (e.g., + 0.5I). If a good is INFERIOR, the income variable (I) MUST be negative (e.g., - 0.5I).\n9. PEDAGOGICAL ALIGNMENT AXIOM: The Artifact, Walkthrough, and Q3 Trace MUST align with the epistemic type of the concept. If the topic is 'Determinants' or 'Factors', focus on the 'Why' (cascading logic). If the topic is 'Equilibrium' or 'Elasticity Calculation', focus on the 'How' (math). DO NOT use rote math to teach purely conceptual determinants.\n10. TERMINOLOGY FIDELITY AXIOM: Strictly adhere to the terminology in the SOURCE CONTEXT. Do not use high-level PhD-level terms if the text uses introductory language.", "l3_law": "L3 MUST be a multi-step analytical application. IF the topic is calculative (e.g., Equilibrium, Elasticity calculation), use a math derivation. IF the topic is conceptual (e.g., Determinants, Barriers to Entry), use a 'System Perturbation Trace' (cascading logic) where the user determines a qualitative outcome based on changing factors."},
    "ECON-METRICS":       {"persona":"Econometrician","h1":"Statistical Model","h2":"Endogeneity","artifact":"Regression Output","type":"Markdown Table or LaTeX","question_modes":["mcq", "fill_in", "debug", "trace"]},
    "ECON-BEHAVIORAL":    {"persona":"Behavioral Economist","h1":"Cognitive Bias","h2":"Market Anomalies","artifact":"Decision Matrix","type":"Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"]},
    "ECON-FINANCE":       {"persona":"Accountant","h1":"Financial Concept","h2":"Financial Risk","artifact":"Ledger Example","type":"Markdown T-Account/Ledger Table","question_modes":["true_false", "scenario", "debug", "matching"]},
    "BIZ-STRATEGY":       {"persona":"Business Strategist","h1":"Strategic Concept","h2":"Weaknesses","artifact":"Strategy Matrix","type":"Markdown Table (SWOT)","question_modes":["mcq", "scenario", "writing", "synthesis"]},
    "BIZ-MARKETING":      {"persona":"Marketing Executive","h1":"Market Principle","h2":"Consumer Churn","artifact":"Campaign Funnel","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "writing", "order"]},
    "BIZ-OPERATIONS":     {"persona":"Operations Manager","h1":"Process Optimization","h2":"Supply Chain Bottlenecks","artifact":"Process Map","type":"Basic Mermaid flowchart","question_modes":["mcq", "scenario", "debug", "trace"]},
    "LAW-CASE":           {"persona":"Lawyer","h1":"Legal Principle","h2":"Exceptions & Limits","artifact":"Case Application","type":"IRAC Framework Markdown Table","question_modes":["mcq", "scenario", "writing", "matching"], "sanity_check": "Do not conflate holding with dicta. Do not apply federal precedents to state-specific common law unless explicitly stated.", "l3_law": "L3 MUST be a 'Novel Fact Pattern Application'. Provide a highly complex, edge-case scenario and force the user to determine the exact outcome based strictly on the note's theory."},
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
    "CS-WEB-DEV":         {"persona":"Web Developer","h1":"Frontend/Backend Architecture","h2":"Web Standards & Optimization","artifact":"UI Component or API Spec","type":"HTML/JS code block or Markdown Table","question_modes":["mcq", "fill_in", "debug", "trace"]},
}

# ── DYNAMIC DOMAIN MATRIX v29.0 (HYDRA) ───────────────────────────────────────
# This matrix allows for modality-specific personas within a domain.
DYNAMIC_DOMAIN_MATRIX = {
    "ECON-MICRO": {
        "Quantitative": {
            "persona": "Microeconomist",
            "h1": "Quantitative Model",
            "h2": "Numerical Sensitivity",
            "artifact": "Demand/Supply Data Schedule",
            "walkthrough": "5-Step Calculation Trace",
            "type": "Markdown Table (Demand/Supply Schedule) OR ASCII Text Graph. Do NOT use Mermaid flowcharts for plotting economic curves. Use a well-formatted Markdown Table showing Price and Quantity, accompanied by a LaTeX block explaining the coordinate shift, or a clear ASCII representation of a Cartesian graph.",
            "sanity_check": "Focus on horizontal summation, elasticity coefficients, and equilibrium shifts. CALCULATIVE VERIFICATION LAW: All mathematical steps MUST be explicitly derived in LaTeX. No Mermaid graphs for curves.",
            "l3_law": "L3 MUST be a multi-step mathematical calculation (e.g. solving for P* and Q*).",
            "prohibited_anti_patterns": "Avoid vague philosophical broadness. Do not skip calculations. DO NOT generate Python, R, or any programming code. Mathematical artifacts must be pure LaTeX or Markdown tables."
        },
        "Qualitative/Definitional": {
            "persona": "Economic Historian",
            "h1": "Foundational Concept",
            "h2": "Historical & Social Context",
            "artifact": "Case Study Analysis Table",
            "walkthrough": "Application to Scenario",
            "type": "Markdown Table",
            "sanity_check": "Focus on the 'Why' and the social/philosophical foundations. Do not use math.",
            "l3_law": "L3 MUST be a 'System Perturbation Trace' - qualitative outcome based on changing factors.",
            "prohibited_anti_patterns": "You are FORBIDDEN from generating numerical demand/supply schedules or mathematical equations."
        },
        "Procedural": {
            "persona": "Market Analyst",
            "h1": "Process Architecture",
            "h2": "Execution Risks",
            "artifact": "Market Process Flow",
            "walkthrough": "Step-by-Step Execution",
            "type": "Basic Mermaid flowchart (graph TD)",
            "sanity_check": "Focus on the logical sequence of actions in a market or firm.",
            "l3_law": "L3 MUST be a 'Process Failure Audit'.",
            "prohibited_anti_patterns": "Do not treat this as a static definition. Focus on the 'How'."
        },
        "Comparative": {
            "persona": "Policy Advisor",
            "h1": "Comparative Framework",
            "h2": "Trade-offs & Efficiency",
            "artifact": "Pros/Cons Matrix Table",
            "walkthrough": "Point-by-Point Contrast",
            "type": "Markdown Table",
            "sanity_check": "Focus on efficiency losses, welfare trade-offs, and structural differences.",
            "l3_law": "L3 MUST be a 'Comparative Evaluation'.",
            "prohibited_anti_patterns": "Do not describe concepts in isolation. Maintain contrast."
        },
        "Causal/Historical": {
            "persona": "Research Economist",
            "h1": "Causal Mechanism",
            "h2": "Long-term Equilibrium",
            "artifact": "Causal Chain Timeline",
            "walkthrough": "Causal Chain Analysis",
            "type": "Basic Mermaid flowchart (graph LR)",
            "sanity_check": "Focus on cascading effects over time.",
            "l3_law": "L3 MUST be a 'Cascading Logic Trace'.",
            "prohibited_anti_patterns": "Do not ignore the timeline of events. Effect follows cause."
        }
    },
    "CS-SOFTWARE": {
        "Quantitative": {
            "persona": "Algorithm Engineer",
            "h1": "Big-O Analysis",
            "h2": "Complexity Bounds",
            "artifact": "Time/Space Complexity Table",
            "walkthrough": "Complexity Derivation Trace",
            "type": "Markdown Table",
            "sanity_check": "Focus on worst-case and average-case analysis using LaTeX.",
            "l3_law": "L3 MUST be a Big-O derivation.",
            "prohibited_anti_patterns": "Vague 'it is fast' statements. Use formal bounds."
        },
        "Qualitative/Definitional": {
            "persona": "Software Architect",
            "h1": "Architectural Design",
            "h2": "Design Trade-offs",
            "artifact": "Component Relationship Table",
            "walkthrough": "System Design Rationale",
            "type": "Markdown Table",
            "sanity_check": "Focus on SOLID principles and design patterns.",
            "l3_law": "L3 MUST be a design pattern selection task.",
            "prohibited_anti_patterns": "STRICTLY FORBIDDEN from using code or math. Focus on high-level architecture."
        },
        "Procedural": {
            "persona": "DevOps / SRE",
            "h1": "Execution Pipeline",
            "h2": "Operational Logic",
            "artifact": "Deployment/CI Flow",
            "walkthrough": "Operational Step Trace",
            "type": "Basic Mermaid flowchart (graph TD)",
            "sanity_check": "Focus on failure modes and recovery steps.",
            "l3_law": "L3 MUST be a failure-mode analysis of the process.",
            "prohibited_anti_patterns": "Focus on the 'how' of execution, not the 'why' of the theory."
        },
        "Comparative": {
            "persona": "Systems Analyst",
            "h1": "Framework Comparison",
            "h2": "Benchmark Contrasts",
            "artifact": "Feature Parity Matrix",
            "walkthrough": "Benchmarking Analysis",
            "type": "Markdown Table",
            "sanity_check": "Focus on latency, throughput, and developer experience trade-offs.",
            "l3_law": "L3 MUST be a framework selection given constraints.",
            "prohibited_anti_patterns": "Describing one framework without direct contrast."
        },
        "Causal/Historical": {
            "persona": "CS Historian",
            "h1": "Technological Evolution",
            "h2": "Legacy Dependencies",
            "artifact": "Stack Evolution Timeline",
            "walkthrough": "Evolutionary Logic Trace",
            "type": "Basic Mermaid flowchart (graph LR)",
            "sanity_check": "Focus on why a specific technology was superseded.",
            "l3_law": "L3 MUST predict the next evolutionary step.",
            "prohibited_anti_patterns": "Non-chronological history."
        }
    },
    "CHEM-ORGANIC": {
        "Quantitative": {
            "persona": "Computational Chemist",
            "h1": "Reaction Kinetics",
            "h2": "Thermodynamic Yield",
            "artifact": "Arrhenius/Yield Data Table",
            "walkthrough": "Yield Calculation Trace",
            "type": "LaTeX Equation",
            "sanity_check": "Focus on reaction orders and activation energies.",
            "l3_law": "L3 MUST be a multi-step yield calculation.",
            "prohibited_anti_patterns": "Vague, non-mathematical descriptions."
        },
        "Qualitative/Definitional": {
            "persona": "Nomenclature Specialist",
            "h1": "Foundational Structure",
            "h2": "Functional Group Context",
            "artifact": "IUPAC Naming Convention Table",
            "walkthrough": "Nomenclature Application",
            "type": "Markdown Table",
            "sanity_check": "Focus on naming rules and structural definitions. No math.",
            "l3_law": "L3 MUST be a naming logic task.",
            "prohibited_anti_patterns": "STRICTLY FORBIDDEN from using reaction yields or formulas."
        },
        "Procedural": {
            "persona": "Synthetic Chemist",
            "h1": "Synthesis Pathway",
            "h2": "Reagent Logic",
            "artifact": "Synthesis Flowchart",
            "walkthrough": "Laboratory Procedure Trace",
            "type": "Basic Mermaid flowchart (graph TD)",
            "sanity_check": "Focus on the sequence of reagents and catalysts.",
            "l3_law": "L3 MUST identify a critical reagent failure.",
            "prohibited_anti_patterns": "Abstract theory. Focus on the 'how'."
        },
        "Comparative": {
            "persona": "Reaction Analyst",
            "h1": "Mechanism Comparison",
            "h2": "Stereochemical Contrasts",
            "artifact": "SN1 vs SN2 Matrix",
            "walkthrough": "Point-by-Point Mechanism Contrast",
            "type": "Markdown Table",
            "sanity_check": "Focus on substrate requirements and inversion vs racemization.",
            "l3_law": "L3 MUST select the optimal mechanism for a substrate.",
            "prohibited_anti_patterns": "Describing one mechanism in isolation."
        },
        "Causal/Historical": {
            "persona": "Chemical Historian",
            "h1": "Breakthrough Lineage",
            "h2": "Discovery Sequence",
            "artifact": "Discovery Timeline",
            "walkthrough": "Experimental Logic Narrative",
            "type": "Basic Mermaid flowchart (graph LR)",
            "sanity_check": "Focus on the sequence of experiments (e.g. Kekule's benzene dream).",
            "l3_law": "L3 MUST predict a structural outcome based on early evidence.",
            "prohibited_anti_patterns": "Presenting final results without chronological context."
        }
    },
    "CS-WEB-DEV": {
        "Quantitative": {
            "persona": "Performance Engineer",
            "h1": "Performance Benchmarks",
            "h2": "Resource Consumption",
            "artifact": "Lighthouse/Core Web Vitals Data",
            "walkthrough": "Optimization Calculation",
            "type": "Markdown Table",
            "sanity_check": "Focus on LCP, FID, CLS, and bundle size.",
            "l3_law": "L3 MUST be a bundle size or latency optimization calculation.",
            "prohibited_anti_patterns": "Vague 'make it faster' statements."
        },
        "Qualitative/Definitional": {
            "persona": "UI/UX Architect",
            "h1": "Semantic Structure",
            "h2": "Accessibility & SEO",
            "artifact": "DOM Structure Table",
            "walkthrough": "Semantic Mapping",
            "type": "Markdown Table",
            "sanity_check": "Focus on semantic HTML5 tags and ARIA labels.",
            "l3_law": "L3 MUST be a semantic mapping or accessibility audit.",
            "prohibited_anti_patterns": "STRICTLY FORBIDDEN from using CSS or JS logic. Focus on HTML semantics."
        },
        "Procedural": {
            "persona": "Fullstack Engineer",
            "h1": "Execution Lifecycle",
            "h2": "Asynchronous Flow",
            "artifact": "Event Loop / Fetch Flow",
            "walkthrough": "Request/Response Trace",
            "type": "Basic Mermaid flowchart (graph TD)",
            "sanity_check": "Focus on the sequence of browser events or API calls.",
            "l3_law": "L3 MUST identify a race condition or async failure.",
            "prohibited_anti_patterns": "Static code snippets without flow logic."
        },
        "Comparative": {
            "persona": "Solution Architect",
            "h1": "Technology Comparison",
            "h2": "Stack Trade-offs",
            "artifact": "Framework Comparison Matrix",
            "walkthrough": "Selection Rationale",
            "type": "Markdown Table",
            "sanity_check": "Focus on SSR vs CSR vs SSG trade-offs.",
            "l3_law": "L3 MUST choose the optimal stack given project constraints.",
            "prohibited_anti_patterns": "Describing one tool in isolation."
        },
        "Causal/Historical": {
            "persona": "Web Historian",
            "h1": "Web Evolution",
            "h2": "Standardization History",
            "artifact": "Browser War Timeline",
            "walkthrough": "Evolutionary Logic Trace",
            "type": "Basic Mermaid flowchart (graph LR)",
            "sanity_check": "Focus on why certain standards (like Flexbox or Grid) emerged.",
            "l3_law": "L3 MUST predict the obsolescence of a current standard.",
            "prohibited_anti_patterns": "Non-chronological history."
        }
    },
    "LAW-CASE": {
        "Quantitative": {
            "persona": "Statutory Auditor",
            "h1": "Damages Assessment",
            "h2": "Numerical Penalties",
            "artifact": "Liability Calculation Table",
            "walkthrough": "Penalty Computation Trace",
            "type": "Markdown Table",
            "sanity_check": "Focus on statutory maximums and compensatory damages.",
            "l3_law": "L3 MUST be a complex damage calculation.",
            "prohibited_anti_patterns": "Vague legal moralizing. Focus on the numbers."
        },
        "Qualitative/Definitional": {
            "persona": "Constitutional Scholar",
            "h1": "Legal Principle",
            "h2": "Jurisprudential Context",
            "artifact": "Principle Application Table",
            "walkthrough": "Socratic Application",
            "type": "Markdown Table",
            "sanity_check": "Focus on the 'Ratio Decidendi'. No math.",
            "l3_law": "L3 MUST be a Socratic logic puzzle.",
            "prohibited_anti_patterns": "STRICTLY FORBIDDEN from using penalty numbers or math."
        },
        "Procedural": {
            "persona": "Litigation Manager",
            "h1": "Procedural Pathway",
            "h2": "Filing Constraints",
            "artifact": "Trial Procedure Flow",
            "walkthrough": "Step-by-Step Filing Trace",
            "type": "Basic Mermaid flowchart (graph TD)",
            "sanity_check": "Focus on statutes of limitations and filing order.",
            "l3_law": "L3 MUST identify a procedural default.",
            "prohibited_anti_patterns": "Focus on the 'how' of the case filing, not the 'why' of the law."
        },
        "Comparative": {
            "persona": "Comparative Jurist",
            "h1": "Jurisdictional Contrast",
            "h2": "Structural Divergence",
            "artifact": "Common Law vs Civil Law Matrix",
            "walkthrough": "Point-by-Point Legal Contrast",
            "type": "Markdown Table",
            "sanity_check": "Focus on the difference in precedent application.",
            "l3_law": "L3 MUST choose the optimal jurisdiction for a case.",
            "prohibited_anti_patterns": "Describing one jurisdiction in isolation."
        },
        "Causal/Historical": {
            "persona": "Legal Historian",
            "h1": "Precedent Evolution",
            "h2": "Judicial Lineage",
            "artifact": "Case Law Evolution Timeline",
            "walkthrough": "Precedent Logic Narrative",
            "type": "Basic Mermaid flowchart (graph LR)",
            "sanity_check": "Focus on how one case overturned or expanded another.",
            "l3_law": "L3 MUST predict a judicial outcome based on current trends.",
            "prohibited_anti_patterns": "Ignoring the chronological evolution of law."
        }
    },
    "BIOLOGY": {
        "Quantitative": {
            "persona": "Biostatistician",
            "h1": "Population Dynamics",
            "h2": "Statistical Significance",
            "artifact": "Growth Curve Data Table",
            "walkthrough": "Population Growth Calculation",
            "type": "Markdown Table",
            "sanity_check": "Focus on carrying capacity and growth rates.",
            "l3_law": "L3 MUST be a population projection calculation.",
            "prohibited_anti_patterns": "Vague descriptions of 'nature'."
        },
        "Qualitative/Definitional": {
            "persona": "Cell Biologist",
            "h1": "Biological Mechanism",
            "h2": "Structural Components",
            "artifact": "Organelle Function Table",
            "walkthrough": "Pathway Narrative",
            "type": "Markdown Table",
            "sanity_check": "Focus on cellular structure and function. No math.",
            "l3_law": "L3 MUST be a pathway logic task.",
            "prohibited_anti_patterns": "Using numbers or statistical data."
        },
        "Procedural": {
            "persona": "Lab Technician",
            "h1": "Experimental Protocol",
            "h2": "Contamination Risks",
            "artifact": "Lab Procedure Flowchart",
            "walkthrough": "Step-by-Step Bench Trace",
            "type": "Basic Mermaid flowchart (graph TD)",
            "sanity_check": "Focus on the sequence of lab steps.",
            "l3_law": "L3 MUST identify a procedural error in the lab.",
            "prohibited_anti_patterns": "Abstract biological theory."
        },
        "Comparative": {
            "persona": "Evolutionary Biologist",
            "h1": "Phylogenetic Comparison",
            "h2": "Homologous Traits",
            "artifact": "Species Contrast Matrix",
            "walkthrough": "Evolutionary Trade-off Analysis",
            "type": "Markdown Table",
            "sanity_check": "Focus on selective pressures and adaptive differences.",
            "l3_law": "L3 MUST predict an evolutionary outcome.",
            "prohibited_anti_patterns": "Describing one species in isolation."
        },
        "Causal/Historical": {
            "persona": "Paleobiologist",
            "h1": "Evolutionary Lineage",
            "h2": "Extinction Events",
            "artifact": "Lineage Timeline",
            "walkthrough": "Evolutionary Transition Narrative",
            "type": "Basic Mermaid flowchart (graph LR)",
            "sanity_check": "Focus on the causal chain of environmental change and adaptation.",
            "l3_law": "L3 MUST predict a survival outcome based on fossil evidence.",
            "prohibited_anti_patterns": "Non-chronological history."
        }
    },
    "PHILOSOPHY": {
        "Quantitative": {
            "persona": "Formal Logician",
            "h1": "Logical Proof",
            "h2": "Truth Functional Calculus",
            "artifact": "Truth Table / Deduction",
            "walkthrough": "Step-by-Step Proof Trace",
            "type": "Block LaTeX ($$)",
            "sanity_check": "Focus on validity and soundness using symbolic logic.",
            "l3_law": "L3 MUST be a symbolic logic proof.",
            "prohibited_anti_patterns": "Vague ethical debates. Focus on the symbols."
        },
        "Qualitative/Definitional": {
            "persona": "Ethicist",
            "h1": "Normative Principle",
            "h2": "Deontological Context",
            "artifact": "Moral Framework Table",
            "walkthrough": "Socratic Analysis",
            "type": "Markdown Table",
            "sanity_check": "Focus on the core definitions and ethical axioms. No symbols.",
            "l3_law": "L3 MUST be a Socratic moral dilemma.",
            "prohibited_anti_patterns": "Using formal logic symbols or math."
        },
        "Procedural": {
            "persona": "Argumentation Coach",
            "h1": "Dialectical Process",
            "h2": "Fallacy Detection",
            "artifact": "Argument Flow Diagram",
            "walkthrough": "Step-by-Step Critique",
            "type": "Basic Mermaid flowchart (graph TD)",
            "sanity_check": "Focus on the flow of an argument from premise to conclusion.",
            "l3_law": "L3 MUST identify a logical fallacy in a sequence.",
            "prohibited_anti_patterns": "Abstract metaphysical theory."
        },
        "Comparative": {
            "persona": "Comparative Philosopher",
            "h1": "Tradition Contrast",
            "h2": "Axiomatic Divergence",
            "artifact": "East vs West Matrix",
            "walkthrough": "Cross-Cultural Critique",
            "type": "Markdown Table",
            "sanity_check": "Focus on the difference in underlying metaphysical assumptions.",
            "l3_law": "L3 MUST resolve a conflict between two schools of thought.",
            "prohibited_anti_patterns": "Describing one tradition in isolation."
        },
        "Causal/Historical": {
            "persona": "Historian of Ideas",
            "h1": "Ideological Evolution",
            "h2": "Intellectual Lineage",
            "artifact": "Evolution of Thought Timeline",
            "walkthrough": "Conceptual Shift Narrative",
            "type": "Basic Mermaid flowchart (graph LR)",
            "sanity_check": "Focus on how one philosopher influenced or reacted to another.",
            "l3_law": "L3 MUST predict a philosophical shift based on societal changes.",
            "prohibited_anti_patterns": "Ignoring the chronological evolution of ideas."
        }
    }
}

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

VALID_MODES = set(DOMAIN_MATRIX.keys()) | set(DYNAMIC_DOMAIN_MATRIX.keys())

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



def get_persona(mode: str, modality: str = "Qualitative/Definitional") -> dict:
    """Helper to fetch the congruent persona based on domain and epistemic nature."""
    
    # 1. Unknown Domain Fallback (v30.0 Pantheon Protocol)
    if mode == "DOMAIN-UNKNOWN":
        return UNIVERSAL_MODALITY_PERSONAS.get(modality, UNIVERSAL_MODALITY_PERSONAS["Qualitative/Definitional"])

    # 2. Check Dynamic Matrix
    if mode in DYNAMIC_DOMAIN_MATRIX:
        if modality in DYNAMIC_DOMAIN_MATRIX[mode]:
            return DYNAMIC_DOMAIN_MATRIX[mode][modality]
        # Option A: Stay within domain, fall back to Qualitative default
        if "Qualitative/Definitional" in DYNAMIC_DOMAIN_MATRIX[mode]:
            return DYNAMIC_DOMAIN_MATRIX[mode]["Qualitative/Definitional"]
    
    # 3. Domain Matrix Fallback (Preserve technical context over modality flavor)
    return DOMAIN_MATRIX.get(mode, DOMAIN_MATRIX["ACADEMIC-GENERAL"])


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
            "OUTPUT: pure JSON only - no markdown fences.\n"
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
                    except Exception:
                        pass
            
            raise e

    def _is_rate_limit(self, e: Exception) -> bool:
        msg = str(e).lower()
        return "429" in msg or "rate_limit" in msg or "resource_exhausted" in msg

class TheoryAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate_micro(self, note_schema, source_text: str, all_concepts: str, used_scenarios: list = None, academic_level: str = "Unknown", course_title: str = "Unknown", max_tokens: int = 1500) -> Dict[str, str]:
        persona = self.domain.get("persona", "Subject Matter Expert")
        title_readable = note_schema.title.replace("_", " ")

        axioms = self.domain.get("sanity_check", "Ensure logical consistency.")
        sys_prompt = f"""You are a Hostile Senior Expert in {persona}. Your tone is brutal, authoritative, and technically rigorous. 

CONCEPT TO TEACH: {title_readable}
ACADEMIC LEVEL: {academic_level}
SOURCE CONTEXT: {source_text[:5000]}

CORE LAWS:
1. Confidence Law: DO NOT self-correct or apologize. State facts with absolute authority.
2. Source Anchoring Law: If the SOURCE CONTEXT provides specific data/scenarios, YOU MUST use them.
3. Jargon Law: Use terminology appropriate for {academic_level}. Keep analogies physically grounded.
4. Wikilink Law: YOU MUST INCLUDE EXACTLY 3 TO 5 [[Wikilinks]] in your prose. YOU MUST INTEGRATE THESE NATURALLY into your sentences; DO NOT append them at the end of sentences like citations (e.g., 'The law of demand [[Law_Of_Demand]]' is FORBIDDEN; 'Following the [[Law_Of_Demand]], we see...' is CORRECT). Wrap critical domain terms in double brackets.
5. LaTeX Enforcement Law: YOU MUST wrap ALL mathematical expressions, variables (e.g., $P$, $Q$, $x$), and equations in LaTeX delimiters. Use single `$` for inline math and double `$$` for standalone equations. NEVER write raw math like 'Qd = 100 - 2P'; ALWAYS write '$$Qd = 100 - 2P$$'.
6. Closed Knowledge Graph Law: YOU ARE STRICTLY FORBIDDEN from linking to concepts that are not in the provided concept list: {all_concepts}. Hallucinating links to external ideas is a hard failure.
7. PDF Quarantine Law: You are strictly quarantined to the concepts present in the SOURCE CONTEXT. Teach ONLY what is provided. Furthermore, DO NOT list core determinants or factors mentioned in the text as "limitations" (e.g., if Expectations or Taxes are determinants of supply, they are part of the model, NOT a limitation of it).
8. Value-Additive Limitations Law: A limitation must be specific and value-additive. Do not just say a model 'might be inaccurate.' Instead, identify the specific underlying assumption (e.g., independence of buyers, perfect information) and explain a real-world edge case (e.g., network effects, bandwagon effects, irrationality) where that assumption fails.
9. Terminology Fidelity Law: Strictly adhere to the language in the SOURCE CONTEXT. Do not invent or use obscure academic jargon (e.g., 'Aggregation Axiom') if it is not in the text. Use standard introductory terminology.
10. Anti-Pattern Law: {self.domain.get("prohibited_anti_patterns", "None.")}
11. Factual Primacy Law: The theory explanation MUST explicitly state and enumerate the core facts, rules, or lists found in the SOURCE CONTEXT. Do not rely entirely on the mental model; state the raw academic facts.
12. Analogy Diversity Law: DO NOT use 'village', 'farm', or 'bakery' analogies unless they are explicitly in the source text. If no specific analogy is provided, invent a modern, sophisticated, or technically relevant professional scenario (e.g., cloud computing scaling, semiconductor yield, SaaS subscription tiers).
13. Formatting: Return strict JSON matching the schema.

DOMAIN AXIOMS (CRITICAL):
{axioms}"""

        theory_llm = self.llm.with_structured_output(TheoryResponse)
        
        for attempt in range(3):
            try:
                res: TheoryResponse = await theory_llm.ainvoke([
                    ("system", sys_prompt),
                    ("human", f"Generate the v28.0 theory core for {title_readable} based on the source.")
                ])
                
                assembled_tech = f"{res.theory_prose.strip()}\n\n### Key Takeaways:\n"
                for tk in res.key_takeaways:
                    assembled_tech += f"- {tk.strip()}\n"

                return {
                    "h1_title": self.domain.get("h1", "Technical Architecture"),
                    "mental_model": res.mental_model.strip().replace('\\\\n', '\\n'),
                    "technical_definition": assembled_tech.strip().replace('\\\\n', '\\n'),
                    "limitations": res.limitations.strip().replace('\\\\n', '\\n')
                }
            except Exception as e:
                err_msg = str(e).lower()
                is_429 = "429" in err_msg or "rate limit" in err_msg or "rate_limit" in err_msg
                if is_429:
                    governor.report_error(wait_seconds=5.0)
                
                print(f"[TheoryAgent] Attempt {attempt+1} failed: {e}")
                if attempt == 2:
                    raise e
                
                wait_time = 2 * (attempt + 1) if is_429 else 1
                await asyncio.sleep(wait_time)

    async def generate(self, note_schema, source_text: str, primary_language: str, all_concepts: str, used_scenarios: list = None) -> str:
        title_readable = note_schema.title.replace("_", " ")
        res = await self.generate_micro(note_schema, source_text, all_concepts, used_scenarios)
        return f"## 1. Mental Model\n{res['mental_model']}\n\n## 2. {res['h1_title']}\n{res['technical_definition']}\n\n## 3. Limitations & Future Context\n{res['limitations']}"

    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        return await self.generate(note_schema, source_text, primary_language, all_concepts)

class PractitionerAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate_micro(self, note_title: str, theory_body: str, primary_language: str, mode: str = "", source_text: str = "", academic_level: str = "Unknown", course_title: str = "Unknown", max_tokens: int = 2500, mental_model: str = "") -> Dict[str, str]:
        persona = self.domain.get("persona", "Senior Expert")
        artifact_format = self.domain.get("type", "Markdown Table")
        sanity_check = self.domain.get("sanity_check", "Ensure logical consistency.")
        title_readable = note_title.replace("_", " ")

        sys_prompt = f"""You are a Hostile Senior Expert in {persona}. 

CONCEPT: {title_readable}
PREVIOUS CONTEXT (MENTAL MODEL): {mental_model}

CORE LAWS:
1. Narrative Consistency: YOU MUST strictly use the characters, industry, and specific scenario defined in the MENTAL MODEL above (e.g., if the model mentions a coffee shop manager, your artifact and walkthrough MUST involve coffee prices and latte quantities). DO NOT revert to abstract variables (P, Q) or generic scenarios. Anchor the data to the story.
2. Artifact Format: Your artifact MUST be: {artifact_format}.
3. LaTeX Enforcement Law: YOU MUST wrap ALL mathematical expressions, variables, and equations in LaTeX delimiters ($...$ or $$...$$). NEVER output raw equations like 'Qd = 100 - 2P'.
4. Mermaid Enforcement Law: If your artifact is a Mermaid diagram, it MUST be a valid Mermaid code block starting with ```mermaid and ending with ```. DO NOT wrap the diagram in a "CODE" label or use leading/trailing pipe symbols `|`.
5. K.I.S.S. Math Law: Keep formulas incredibly simple. DO NOT use 3-term equations (like Qd = 100 - 2P - 0.5I). Use 2-term equations (like Qd = 100 - 2P) to prevent arithmetic failure. Keep constants small.
6. Sub-Operation Math Law: You MUST break arithmetic into strict sub-steps on SEPARATE LINES or explicit sentences. NEVER chain multiple equals signs in a single line (e.g., NEVER write 100 - 2*1 = 98). Instead, write "Step 1: 2 * 1 = 2. Step 2: 100 - 2 = 98." Evaluate only two numbers per line.
7. Visual Honesty: Do not say "as seen on graph". Use "If plotted, the curve would...".
8. Table Integrity: Markdown tables MUST have start/end pipes `|`.
9. Algorithmic Fidelity Law: You MUST explicitly demonstrate the UNIQUE mathematical mechanism of the concept based on the source text. For example, if the concept is "Market Demand," you CANNOT just show a generic demand equation; you MUST demonstrate the horizontal summation of multiple buyers. Do not use generic, default math if the concept requires a specific formula.
10. Walkthrough Content Law: The `walkthrough` steps MUST NOT contain markdown headings (e.g. no `## Step 1`). They should be plain text descriptions of the calculation or logic.
11. Walkthrough Table Ban: DO NOT generate Markdown tables inside the `walkthrough` field. Reference the table from Section 4 using text only.
12. Epistemic Alignment Law: You MUST match your application to the nature of the concept. If the concept is a "Determinant", "Factor", or "Qualitative Principle", your walkthrough MUST explain the "Why" and the logical cascade of those factors. Rote math calculation is FORBIDDEN for purely conceptual topics.
13. Anti-Pattern Law: {self.domain.get("prohibited_anti_patterns", "None.")}
14. Formatting: Return ONLY the structured output. You MUST provide EXACTLY 5 to 7 steps in the walkthrough array. If you provide fewer than 5 steps, the system will CRASH.
15. String Integrity Law: You MUST return raw strings for the `artifact` and `primary_equation_or_logic` fields. DO NOT wrap them in objects like {{"type": "string", "value": "..."}}. Return only the text.

DOMAIN AXIOMS (CRITICAL):
{sanity_check}"""

        prac_llm = self.llm.with_structured_output(PractitionerResponse)

        for attempt in range(3):
            try:
                res: PractitionerResponse = await prac_llm.ainvoke([
                    ("system", sys_prompt),
                    ("human", f"Generate the v28.0 practitioner artifact for {title_readable}.")
                ])
                
                clean_artifact = res.artifact.replace('\\n', '\n')
                clean_steps = [s.replace('\\n', '\n') for s in res.walkthrough]

                h1_title = self.domain.get("h1", "Technical Architecture")
                artifact_title = self.domain.get("artifact", "Artifact")
                return {
                    "h1_title": h1_title,
                    "artifact_title": artifact_title,
                    "artifact_content": f"{res.primary_equation_or_logic}\n\n{clean_artifact}",
                    "walkthrough": "\n".join([f"{step}" if step.strip()[0].isdigit() else f"{i+1}. {step}" for i, step in enumerate(clean_steps)])
                }
            except Exception as e:
                err_msg = str(e).lower()
                is_429 = "429" in err_msg or "rate limit" in err_msg or "rate_limit" in err_msg
                if is_429:
                    governor.report_error(wait_seconds=5.0)
                
                print(f"[PractitionerAgent] Attempt {attempt+1} failed: {e}")
                if attempt == 2:
                    raise e
                
                wait_time = 2 * (attempt + 1) if is_429 else 1
                await asyncio.sleep(wait_time)

    async def generate(self, note_title: str, theory_body: str, primary_language: str, mode: str = "") -> str:
        title_readable = note_title.replace("_", " ")
        res = await self.generate_micro(note_title, theory_body, primary_language, mode=mode)
        return f"## 4. {res['artifact_title']}\n{res['artifact_content']}\n\n## 5. Walkthrough\n{res['walkthrough']}"

    async def retry(self, note_title: str, theory_body: str, primary_language: str, diagnosis: str) -> str:
        return await self.generate(note_title, theory_body, primary_language)

class QuestionAgent:
    def __init__(self, llm, q_type: Optional[str] = None):
        self.llm = llm
        self.q_type = q_type

    async def generate(self, note_title: str, context: str, difficulty: str = "L1", mode: str = "ECON-MACRO", academic_level: str = "Undergraduate", course_title: str = "Unknown", modality: str = "Qualitative/Definitional", max_tokens: int = 2000, num_questions: int = 3, q_type: Optional[str] = None, topic_hint: Optional[str] = None, index: int = 1, prof_domain: Optional[str] = None, **kwargs) -> List[Dict]:
        target_type = q_type or self.q_type
        domain = get_persona(mode, modality)
        persona = prof_domain or domain.get("persona", "Senior Assessment Engineer")
        l3_law = domain.get("l3_law", "L3 must test critical analysis.")
        title_readable = note_title.replace("_", " ")

        axioms = domain.get("sanity_check", "Ensure logical consistency.")
        hint_str = f"FOCUS AREA: {topic_hint}" if topic_hint else ""
        type_constraint = f"ALL questions MUST be of type: '{target_type}'." if target_type else "Difficulty: Q1=L1 (fill_in), Q2=L2 (mcq), Q3=L3 (trace)."
        
        sys_prompt = f"""You are a Hostile Senior Assessment Engineer in {persona}. Create a {num_questions}-question quiz for the following note.
{hint_str}

NOTE TEXT:
{context[:6000]}

CORE LAWS:
1. Scope Constraint: DO NOT test formulas or concepts not in the NOTE TEXT.
2. Type Requirement: {type_constraint}
3. Difficulty Target: {difficulty}.
4. L3 Rule: {l3_law}.
5. UI Syntax: 'fill_in' MUST use `[[blank]]` placeholders. Answer is 1-2 words. DO NOT use the word "Blank", "___", or any other text as a placeholder.
6. Answer Formatting: For L3 Trace, the `answer` field MUST contain ONLY the final output (e.g., "80"). Scratchpad math goes ONLY in `explanation`.
7. Math Sovereignty: Verify every arithmetic step. evaluating `2 * 10` MUST result in `20`. Once you calculate the final mathematical answer using your formula, YOU MUST STOP. DO NOT verify it with alternative methods. DO NOT add adjustments, interpolations, or corrections. The raw mathematical output of your equation is absolute law.
8. Algorithmic Scope: MATCH the math format of the NOTE TEXT (Table vs. Function).
9. Trace Diversity Law: The L3 Trace question is a test of logical progression. It is NOT limited to arithmetic. For conceptual notes (Determinants, Factors), present a complex scenario and force the user to 'trace' the outcome through 2-3 logical steps based on the theory. The answer must be a single specific word or scalar value. YOU MUST NOT ask open-ended "Compare" or "Describe" questions that require a paragraph-style answer. If the question starts with "Compare" or "Describe", it is INVALID.
10. Unique Answer Law: For 'fill_in' questions, YOU MUST ensure there is exactly ONE logically correct 1-2 word answer based on the NOTE TEXT. DO NOT create "mind-reading" lists (e.g., 'Determinants include A, B, and [[blank]]') where any synonym would fit. If a unique answer is not possible, YOU MUST use 'mcq' instead.
11. LaTeX Enforcement Law: YOU MUST wrap ALL mathematical expressions, variables, and equations in LaTeX delimiters ($...$ or $$...$$).
12. Calculative Verification Law (L3 Trace): You MUST perform a two-pass calculation for any trace question involving math. Pass 1: Derive the formula. Pass 2: Plug in the numbers and verify. If there is a contradiction, you MUST restart the generation. Your explanation MUST show the step-by-step math in LaTeX.
13. Formatting: Return strict JSON matching the schema.
14. Syntax Enforcement Law: YOU MUST use `[[blank]]` for 'fill_in' questions. DO NOT use the word "Blank", "___", or any other placeholder. If you fail this, the interface will break.

DOMAIN AXIOMS (CRITICAL):
{axioms}"""

        quiz_llm = self.llm.with_structured_output(QuizResponse)
        
        for attempt in range(3):
            try:
                res: QuizResponse = await quiz_llm.ainvoke([
                    ("system", sys_prompt),
                    ("human", f"Generate the v28.0 mastery quiz for {title_readable}.")
                ])
                
                # Convert Pydantic models to dicts and sanitize
                sanitized_qs = []
                for q in res.questions:
                    q_dict = q.model_dump()
                    # Ensure escaped newlines render correctly
                    for field in ["question", "explanation", "answer", "content"]:
                        if q_dict.get(field) and isinstance(q_dict[field], str):
                            q_dict[field] = q_dict[field].replace('\\\\n', '\\n').replace('\\n', '\n')
                    sanitized_qs.append(q_dict)
                return sanitized_qs

            except Exception as e:
                err_msg = str(e).lower()
                is_429 = "429" in err_msg or "rate limit" in err_msg or "rate_limit" in err_msg
                if is_429:
                    governor.report_error(wait_seconds=5.0)
                
                print(f"[QuestionAgent] Attempt {attempt+1} failed: {e}")
                if attempt == 2:
                    raise e
                
                wait_time = 2 * (attempt + 1) if is_429 else 1
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
            "SYNTHESIS GAP PROTOCOL: If you detect multiple notes on the same core topic but with different modalities "
            "(e.g., a 'Quantitative' note and a 'Qualitative' note on the same law), you MUST include a specific "
            "'Integrated Synthesis' paragraph that bridges the math and the philosophy of that topic.\n\n"
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

    async def verify(self, note_title: str, mode: str, note_content: str, source_context: str, modality: str = "Qualitative/Definitional") -> dict:
        sys_prompt = f"""You are a rigorous academic quality auditor. Evaluate this atomic study note.
Return ONLY a valid JSON object - no markdown fences, no commentary.

CHECK ALL CRITERIA:
- `clean_output`: No "Wait", "Let me think", or "As an AI". No all-caps text unless technically necessary.
- `economic_laws`: STRICT for ECON: Demand curves MUST slope DOWNWARD.
- `unique_scenario`: Is the scenario/analogy fresh? (FAIL if it uses 'Azura' or currency devaluation for Microeconomics).
- `epistemic_congruence`: Does the content match the MODALITY "{modality}"? 
  - FAIL if a 'Qualitative' note contains rote math formulas.
  - FAIL if a 'Quantitative' note lacks a numerical schedule/table.
  - FAIL if a 'Procedural' note lacks a step-by-step logic.

Output format - use EXACTLY this structure:
{{"domain_lock":true,"epistemic_congruence":true,"quiz_topicality":true,"debug_validity":true,"arithmetic_correct":true,"mental_model_maps":true,"clean_output":true,"economic_laws":true,"unique_scenario":true,"failures":[{{"check":"domain_lock","issue":"exact description","fix_instruction":"exact fix"}}]}}

failures is an empty array [] if all checks pass.
Source context: {source_context[:400]}"""
        user_msg = f"Note title: {note_title}\nMode: {mode}\nModality: {modality}\n\nContent:\n{note_content[:3000]}"
        
        last_error = None
        for attempt in range(2):
            try:
                retry_note = f"\n\nFIX PREVIOUS ERROR: {last_error}\nReturn ONLY pure JSON.\n" if last_error else ""
                res = await self.llm.ainvoke([("system", sys_prompt + retry_note), ("human", user_msg)])
                data = ArchitectAgent._parse_json(res.content)
                passed = all([
                    data.get("domain_lock", True), data.get("epistemic_congruence", True),
                    data.get("quiz_topicality", True), data.get("debug_validity", True), 
                    data.get("arithmetic_correct", True), data.get("mental_model_maps", True), 
                    data.get("clean_output", True), data.get("economic_laws", True), 
                    data.get("unique_scenario", True)
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

Output:
{{"passed":true,"issues":[],"fix_instruction":""}}
OR if problems:
{{"passed":false,"issues":["Q1: Context Hallucination detected.","Q3: Duplicate question found.","Q4: Answer '10' diverges from explanation value '12'."],"fix_instruction":"exact instruction"}}

Key facts about "{title_readable}": {theory_summary[:2500]}"""
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

class TaxonomyExtenderAgent:
    """The 'Cartographer Prime'. Meta-analyzes unknown material to extend the system's brain."""
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    async def propose_extension(self, document_text: str, unknown_context: str) -> dict:
        system = """You are the 'Cartographer Prime' of the OKA system. 
Your task is to meta-analyze a document that the system failed to classify into its existing taxonomy.
You must propose a NEW DOMAIN ENTRY and associated KEYWORDS.

ANALYSIS PROTOCOL:
1. Identify the core academic or professional discipline (e.g., CS-BLOCKCHAIN, BIO-GENOMICS, LAW-ADMIRALTY).
2. Propose a Persona: A high-level expert in this field.
3. Propose H1 and H2 headers that follow the OKA 'Mechanism & Failure' philosophy.
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
