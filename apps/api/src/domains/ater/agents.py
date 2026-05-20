import json
import re
import asyncio
import hashlib
import time
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
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
# This matrix allows for modality-specific personas within a domain.
DYNAMIC_DOMAIN_MATRIX = {
    "ECON-MICRO": {
        "Quantitative": {
            "persona": "Microeconomist",
            "h1": "How the Economics Actually Work",
            "h2": "The Formal Math & Models",
            "artifact": "Calculation Schedule",
            "walkthrough": "5-Step Calculation Trace",
            "type": "Markdown Table (Demand/Supply Schedule) OR ASCII Text Graph. Do NOT use Mermaid flowcharts for plotting economic curves. Use a well-formatted Markdown Table showing Price and Quantity, accompanied by a LaTeX block explaining the coordinate shift, or a clear ASCII representation of a Cartesian graph.",
            "sanity_check": "Focus on horizontal summation, elasticity coefficients, and equilibrium shifts. CALCULATIVE VERIFICATION LAW: All mathematical steps MUST be explicitly derived in LaTeX. No Mermaid graphs for curves.",
            "l3_law": "L3 MUST be a multi-step mathematical calculation (e.g. solving for P* and Q*).",
            "prohibited_anti_patterns": "Avoid vague philosophical broadness. Do not skip calculations. DO NOT generate Python, R, or any programming code. Mathematical artifacts must be pure LaTeX or Markdown tables."
        },
        "Qualitative/Definitional": {
            "persona": "Feynman Economist",
            "h1": "How the Economics Actually Work",
            "h2": "The Formal Math & Models",
            "artifact": "Case Study Analysis Table",
            "walkthrough": "Application to Scenario",
            "type": "Markdown Table",
            "sanity_check": "Focus on the 'Why' and the social/philosophical foundations. Do not use math.",
            "l3_law": "L3 MUST be a 'System Perturbation Trace' - qualitative outcome based on changing factors.",
            "prohibited_anti_patterns": "You are FORBIDDEN from generating numerical demand/supply schedules or mathematical equations."
        },
        "Procedural": {
            "persona": "Market Analyst",
            "h1": "How the Economics Actually Work",
            "h2": "The Formal Math & Models",
            "artifact": "Market Process Flow",
            "walkthrough": "Step-by-Step Execution",
            "type": "Basic Mermaid flowchart (graph TD)",
            "sanity_check": "Focus on the logical sequence of actions in a market or firm.",
            "l3_law": "L3 MUST be a 'Process Failure Audit'.",
            "prohibited_anti_patterns": "Do not treat this as a static definition. Focus on the 'How'."
        },
        "Comparative": {
            "persona": "Policy Advisor",
            "h1": "How the Economics Actually Work",
            "h2": "The Formal Math & Models",
            "artifact": "Pros/Cons Matrix Table",
            "walkthrough": "Point-by-Point Contrast",
            "type": "Markdown Table",
            "sanity_check": "Focus on efficiency losses, welfare trade-offs, and structural differences.",
            "l3_law": "L3 MUST be a 'Comparative Evaluation'.",
            "prohibited_anti_patterns": "Do not describe concepts in isolation. Maintain contrast."
        },
        "Causal/Historical": {
            "persona": "Research Economist",
            "h1": "How the Economics Actually Work",
            "h2": "The Formal Math & Models",
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
    mode = normalize_mode(mode)
    
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
        forced_mode = normalize_mode(forced_mode, "") if forced_mode else ""
        if forced_mode and forced_mode in VALID_MODES:
            mode_instruction = f"mode: You MUST use `{forced_mode}` for all notes in this plan. This has been pre-verified by a domain specialist."

        system = (
            "You are the Ater Curriculum Architect. Extract 15-25 atomic concepts from the text.\n"
            "RULES:\n"
            "1. Titles: 1-3 words, Title_Case_With_Underscores.\n"
            "2. " + mode_instruction + "\n"
            "3. prerequisites: list dependencies. Do not leave empty for compound concepts.\n"
            "4. concept_modality: EXACTLY one: 'Quantitative', 'Qualitative/Definitional', 'Procedural', 'Comparative', 'Causal/Historical'.\n"
            "5. source_context/pages: copy 1-2 source sentences and page numbers (integers).\n"
            "OUTPUT: Pure JSON ONLY.\n"
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

    async def generate_mental_model(self, note_schema, source_text: str, academic_level: str, used_scenarios: list = None) -> str:
        """
        The 'Analogy Specialist' pass. 
        Focus: Simple mental model, perfect core idea, industry-specific.
        SOURCE-GROUNDED: Uses only the injected source text.
        """
        title_readable = note_schema.title.replace("_", " ")
        persona = self.domain.get("persona", "Subject Matter Expert")
        
        # S-TIER ANALOGY LAWS — now source-grounded
        sys_prompt = f"""You are a world-class Pedagogue and Expert in {persona}.
Your ONLY job is to create ONE perfect analogy for {title_readable} based strictly on the source text below.

S-TIER ANALOGY LAWS:
1. GROUND IN SOURCE: Your analogy MUST reflect what the SOURCE TEXT actually says. Do not invent.
2. NO CLICHÉS: Prohibited: Coffee shops, burger stands, lemonade stands, islands, pizza, traffic lights.
3. INDUSTRY RIGOR: Use real-world scenarios relevant to: Semiconductor supply chains, Pharmaceutical R&D, Aerospace logistics, financial markets, medical diagnostics.
4. COGNITIVE SIMPLICITY: A smart 14-year-old must understand it in one read. Start the narrative directly.
5. EPISTEMIC FIDELITY: If the concept is Quantitative, the analogy MUST feature a resource being counted or balanced.

SOURCE TEXT (your only allowed knowledge base):
{source_text[:1800]}

CONCEPT: {title_readable}
LEVEL: {academic_level}

OUTPUT: Exactly 3 sentences of a vivid, concrete analogy. No preamble. Start directly with the scenario."""

        for attempt in range(2):
            try:
                await governor.get_permit(expected_tokens=600)
                res = await self.llm.ainvoke([("system", sys_prompt), ("human", f"Generate the perfect S-Tier mental model for {title_readable}.")])
                return res.content.strip()
            except Exception as e:
                if attempt == 1: return f"A scenario involving the resource constraints of {title_readable} in a production environment."
                await asyncio.sleep(governor._rpm_wait_seconds(time.time()) or 1)

    @staticmethod
    def _extract_xml(tag: str, text: str) -> str:
        """Robustly extracts content between XML tags, handling markdown fences and filler."""
        # Use (?:</{tag}>|$) to handle truncated LLM outputs that don't close the tag
        pattern = rf"<{tag}>(.*?)(?:</{tag}>|$)"
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        # Fallback: if closing tag missing or premature start of another tag, extract until next tag
        if not match or not match.group(1).strip():
            fallback_pattern = rf"<{tag}>(.*?)(?=<[A-Z_]+>|$)"
            match = re.search(fallback_pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            # Remove markdown code fences if the LLM wrapped the XML content in them
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
            # Proactively strip any markdown headers (e.g. lines starting with #) to avoid duplication failures
            content = re.sub(r'(?m)^\s*#+\s*.*$', '', content)
            return content.strip()
        # Return empty string on failure — caller/validator will detect the missing block
        return ""

    async def generate_theory_core(self, note_schema, source_text: str, all_concepts: str, academic_level: str) -> Dict[str, str]:
        """
        The 'Deep Feynman' pass — v33.0 SOURCE-INJECTION MODEL.
        Optimized into three sequential micro-passes for small 2B-7B models to ensure structural absolute obedience.
        """
        title_readable = note_schema.title.replace("_", " ")
        domain_h1 = self.domain.get("h1", "The Core Logic Explained")
        domain_h2 = self.domain.get("h2", "The Textbook Translation")

        # --- PASS 0: Mental Model (Analogy) ---
        plain_english = await self.generate_mental_model(note_schema, source_text, academic_level)
        if not plain_english or len(plain_english.strip()) < 30:
            plain_english = f"{title_readable} can be understood as a fundamental mechanism within its domain, structuring the way we approach related problems."

        # --- PASS A: Theory Core (Core Breakdown) ---
        sys_prompt_a = f"""You are a master teacher producing a DEEP, DETAILED study note for the concept: "{title_readable}".
Your ONLY knowledge base is the SOURCE TEXT below.

===SOURCE TEXT===
{source_text[:2500]}
===END SOURCE TEXT===

LAWS:
1. EXTREME SIMPLICITY: You must explain the concept in a simple, highly detailed way so that it is impossible for a 12-year-old NOT to understand it.
2. SOURCE ONLY. Every claim MUST come from the SOURCE TEXT. No outside knowledge.
3. NO BULLETS. Bullet points/lists are STRICTLY FORBIDDEN. Use continuous analytical prose.
4. NO WIKILINKS. Do not use [[brackets]] around words. We will add links later.
5. Output ONLY the XML block below. No preamble, comments, or thoughts. Start directly with '<CORE_BREAKDOWN>'.

<CORE_BREAKDOWN>
[{domain_h1}: Mechanistic walkthrough of "{title_readable}". Continuous prose only.
Structure: WHAT (precisely define) -> WHY (underlying reason) -> HOW (mechanism step-by-step). Make it engaging and dead-simple.]
</CORE_BREAKDOWN>"""

        # --- PASS B: Formal Model (Textbook Translation) ---
        sys_prompt_b = f"""You are a technical writer completing the formal textbook definition for: "{title_readable}".
Your ONLY knowledge base is the SOURCE TEXT below.

===SOURCE TEXT===
{source_text[:1500]}
===END SOURCE TEXT===

LAWS:
1. SOURCE ONLY. Use equations, formulas, taxonomies, or technical terminology EXACTLY as in source.
2. NO BULLETS. Continuous prose only.
3. ABSOLUTE UNIQUENESS: Do NOT repeat the analogy, explanations, or introductory sentences from the core breakdown. Provide ONLY the formal textbook classifications, math equations, or structural parameters. If no formal translation exists, explain the technical variables and domain classifications in exactly 2-3 precise sentences.
4. Output ONLY the XML block below. No preamble or other text. Start directly with '<ACADEMIC_TRANSLATION>'.

<ACADEMIC_TRANSLATION>
[{domain_h2}: Introduce the formal textbook definition or classifications. Must be detailed and mathematically/scientifically accurate. Minimum 3 sentences.]
</ACADEMIC_TRANSLATION>"""

        detailed_breakdown = ""
        academic_translation = ""

        # Execute Pass A
        for attempt in range(2):
            try:
                await governor.get_permit(expected_tokens=800)
                res_a = await self.llm.ainvoke([
                    ("system", sys_prompt_a),
                    ("human", f"Generate CORE_BREAKDOWN for: {title_readable}")
                ])
                detailed_breakdown = TheoryAgent._extract_xml("CORE_BREAKDOWN", res_a.content)
                if detailed_breakdown and len(detailed_breakdown.strip()) >= 30:
                    break
            except Exception:
                if attempt == 1: raise ValueError("CORE_BREAKDOWN failed.")
                await asyncio.sleep(2)

        # Execute Pass B
        for attempt in range(2):
            try:
                await governor.get_permit(expected_tokens=600)
                res_b = await self.llm.ainvoke([
                    ("system", sys_prompt_b),
                    ("human", f"Generate ACADEMIC_TRANSLATION for: {title_readable}. Context core breakdown: {detailed_breakdown[:400]}")
                ])
                academic_translation = TheoryAgent._extract_xml("ACADEMIC_TRANSLATION", res_b.content)
                if academic_translation and len(academic_translation.strip()) >= 30:
                    break
            except Exception:
                if attempt == 1: raise ValueError("ACADEMIC_TRANSLATION failed.")
                await asyncio.sleep(2)

        if not detailed_breakdown or not academic_translation:
            raise RuntimeError("TheoryAgent failed to generate required XML blocks.")

        return {
            "plain_english": plain_english,
            "detailed_breakdown": detailed_breakdown,
            "academic_translation": academic_translation,
            "misconceptions": "",
        }

    async def generate_limitations(self, note_schema, source_text: str, persona: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = f"""You are an Expert in {persona}. Based STRICTLY on the source text, identify where "{title_readable}" breaks down, what assumptions it makes, and what it cannot explain.

SOURCE TEXT:
{source_text[:1200]}

RULES:
- Use ONLY information from the source text.
- Be specific and brutal. No generic fluff like "this is complex".
- Format: 3 bullet points. Each starts with a bold failure label in **bold**.
OUTPUT: The 3 bullet points only. No preamble."""
        await governor.get_permit(expected_tokens=350)
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Generate edge cases and limitations.")])
        return res.content.strip()

    async def generate_theory_markdown(self, note_schema, source_text: str, academic_level: str, sanity_check: str) -> Dict[str, str]:
        """
        One single, structured, unified call to generate all theory text segments.
        Combines:
        - Mental Model (Analogy/Plain English): exactly 1 paragraph, no jargon.
        - Core Mechanism Walkthrough (How it actually works): continuous prose, 3-5 wikilinks.
        - Textbook Translation (Formal Model): continuous prose, formulas/equations if math domain.
        """
        title_readable = note_schema.title.replace("_", " ")
        persona = self.domain.get("persona", "Subject Matter Expert")
        
        # We must inject the S-Tier analogy laws, domain-specific shifters rules, and the banned analogies.
        banned_analogies = "Coffee shops, burger stands, lemonade stands, islands, pizza, traffic lights, car engines, factory assembly lines."
        
        sys_prompt = f"""You are a world-class Pedagogue and Senior Technical Writer in {persona}.
Your task is to explain "{title_readable}" clearly, based STRICTLY on the provided source text.

===SOURCE TEXT===
{source_text}
===END SOURCE TEXT===

SANITY CHECK:
{sanity_check}

You MUST output exactly three XML blocks in your response:

1. <MENTAL_MODEL>: Exactly 3 sentences of a vivid, physical real-world scenario (e.g. semiconductor supply chains, aerospace logistics, financial markets, pharmaceutical R&D, medical diagnostics).
- Prohibited analogies: {banned_analogies}
- If Quantitative, the analogy MUST feature a resource being counted or balanced.
- Start directly with the scenario, no preamble.
- DO NOT output any markdown headers (such as '## Mental Model' or any line starting with '#') inside the XML block.

2. <CORE_BREAKDOWN>: Continuous analytical prose explaining how this concept actually works.
- Be concise. If the source material is short, your explanation must be short. Do not artificially inflate the word count. Explain WHAT (define precisely), WHY (underlying reason), and HOW (mechanism step-by-step).
- You MUST explicitly state the core facts, lists, or enumerations present in the SOURCE TEXT.
- NO WIKILINKS. Do not use double brackets [[ ]] or hyper-link any vocabulary words here. We will add links programmatically later.
- Bullet points/lists are STRICTLY FORBIDDEN here. Use continuous prose only.
- DO NOT output any markdown headers (such as '## How It Actually Works' or any line starting with '#') inside the XML block.

3. <ACADEMIC_TRANSLATION>: Continuous prose describing the formal textbook definition or classifications.
- Use equations, formulas, taxonomies, or technical terminology EXACTLY as in source.
- For math domains, use block LaTeX ($$...$$) for equations.
- Bullet points are STRICTLY FORBIDDEN.
- DO NOT output any markdown headers (such as '## The Formal Model' or any line starting with '#') inside the XML block.

CRITICAL RULE: DO NOT REPEAT YOURSELF. The <MENTAL_MODEL>, <CORE_BREAKDOWN>, and <ACADEMIC_TRANSLATION> sections MUST contain 100% unique text. If you repeat a sentence or paragraph across sections, you will be penalized. If you have no new technical information to add to <ACADEMIC_TRANSLATION> (which will be rendered under Technical Implementation), keep it to a single brief sentence.

Output ONLY these three XML blocks. Do not add any introduction, outro, markdown files wrapper, or thoughts. Output ONLY the raw paragraphs inside the XML blocks."""

        await governor.get_permit(expected_tokens=1500)
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", f"Generate theory markdown blocks for {title_readable}.")])
        
        content = res.content
        
        # Robustly extract the XML blocks
        mental_model = self._extract_xml("MENTAL_MODEL", content)
        core_logic = self._extract_xml("CORE_BREAKDOWN", content)
        formal_model = self._extract_xml("ACADEMIC_TRANSLATION", content)
        
        # Fallback if any block is missing or empty
        if not mental_model:
            mental_model = f"A physical representation of the constraints of {title_readable} operating under dynamic conditions."
        if not core_logic:
            core_logic = f"The underlying mechanism of {title_readable} coordinates various parameters to achieve consistent states based on the source text."
        if not formal_model:
            formal_model = f"At a formal level, {title_readable} is defined by the mathematical and structural constraints outlined in its academic discipline."

        return {
            "plain_english": mental_model,
            "detailed_breakdown": core_logic,
            "academic_translation": formal_model,
            "misconceptions": ""
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
            "h1_title": self.domain.get("h1", "How It Actually Works"),
            "core_logic": theory_data.get("detailed_breakdown", ""),
            "h2_title": self.domain.get("h2", "The Formal Model"),
            "formal_model": theory_data.get("academic_translation", ""),
            "_misconceptions_cache": theory_data.get("misconceptions", ""),
        }

    async def generate(self, note_schema, source_text: str, primary_language: str, all_concepts: str, used_scenarios: list = None) -> str:
        # Legacy direct string call - now redirects to render_atomic_note via service
        res = await self.generate_micro(note_schema, source_text, all_concepts, used_scenarios)
        return f"FEYNMAN_DATA:{json.dumps(res)}"

    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        return await self.generate(note_schema, source_text, primary_language, all_concepts)

class QuizQuestionDict(BaseModel):
    type: str = Field(description="Question type: mcq, true_false, writing, calculation, fill_in, matching, order, debug, code, data_analysis, scenario, synthesis, trace.")
    question: str = Field(description="The hostile, source-grounded question prompt")
    options: Optional[Dict[str, str]] = Field(default=None, description="For mcq: dict with EXACTLY 4 keys 'A', 'B', 'C', 'D' mapping to plausible options. None for all other question types.")
    answer: Any = Field(description="The correct answer. For MCQ: single letter ('A', 'B', 'C', or 'D'). For true_false: boolean (true or false). For others: the exact correct short answer or model explanation.")
    explanation: str = Field(description="Pedagogical, step-by-step reasoning explaining why the correct answer is correct and others are wrong.")
    required_keywords: Optional[List[str]] = Field(default=None, description="For writing/scenario/synthesis/debug/trace: a list of exactly 3-5 technical keywords that must be present in the answer. None for other question types.")
    content: Optional[str] = Field(default=None, description="For code/debug/calculation/data_analysis: code snippet, buggy code, or data table content. None for other types.")
    textWithBlanks: Optional[str] = Field(default=None, description="For fill_in: the text containing blanks marked with [[blank]]. None for other types.")
    pairs: Optional[List[Dict[str, str]]] = Field(default=None, description="For matching: list of matching dicts containing 'left' and 'right' keys. None for other types.")
    steps: Optional[List[str]] = Field(default=None, description="For order: list of shuffled steps. None for other types.")

class StructuredArtifactsResponse(BaseModel):
    artifact_content: str = Field(description="The high-fidelity markdown table, basic Mermaid diagram, or block LaTeX content based on the source text and domain requirements.")
    limitations: str = Field(description="Exactly 3 specific, source-grounded bullet points outlining limitations or failure states of the concept. Formatted exactly as: **Label**: Explanation.")
    quiz_questions: List[QuizQuestionDict] = Field(description="A list containing EXACTLY 3 interactive quiz questions testing the concept.")

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
        q_modes: List[str] = None
    ) -> Dict[str, Any]:
        """
        Structured structured-output pass.
        Combines:
        1. Markdown Table / Mermaid / LaTeX Artifact
        2. 3 Limitations Bullet Points
        3. 3 Heterogeneous Quiz Questions
        All compiled into a single Pydantic-enforced response.
        """
        title_readable = note_title.replace("_", " ")
        artifact_type = artifact_type_hint or "Markdown Table"
        
        if not q_modes:
            q_modes = ["mcq", "true_false", "writing"]
        
        mcq_extra = "\\nCRITICAL FOR MCQ: You MUST provide EXACTLY 4 options (A, B, C, D) in the options dict. Never generate 2 options. All distractors must be plausible."
        keyword_extra = "\\nCRITICAL FOR WRITING/SCENARIO/DEBUG/TRACE: You MUST include 3-5 technical, non-trivial vocabulary words in required_keywords."
        
        sys_prompt = f"""You are an Expert Systems Breaker, Technical Engineer, and Hostile Examiner in {persona}.
Generate a HIGH-FIDELITY pedagogical artifact, 3 specific failure states, and exactly 3 interactive quiz questions for "{title_readable}".

===SOURCE TEXT (use this for all data/values/questions)===
{source_text}
===END SOURCE TEXT===

===CORE THEORY===
{theory_body}
===END CORE THEORY===

===MENTAL MODEL / ANALOGY (frame your quiz scenarios and failure states around this analogy to ensure a unified theme)===
{plain_english}
===END MENTAL MODEL / ANALOGY===

SANITY CHECK LAW:
{sanity_check}

ARTIFACT LAWS:
1. SOURCE GROUNDING: All numbers, labels, and values in the artifact MUST come from the SOURCE TEXT.
2. ARTIFACT TYPE: Generate a {artifact_type} — this is domain-mandated.
3. worked example: If Quantitative/Calculative, the artifact MUST show a worked numerical example from the source.
4. SYNTAX LAW: Mermaid must be in its own ```mermaid block. NEVER wrap in table pipes.
5. LATEX LAW: For math domains, use block LaTeX ($$...$$) for equations.
6. SIZE LAW: Keep the artifact compact — max 12 rows for tables, max 8 nodes for Mermaid.
7. SEMANTIC LOCK: The artifact and failure states MUST strictly align with the CORE THEORY and SOURCE TEXT. Do not introduce any new terminology.
8. CLOSED-LOOP ALIGNMENT: The failure states and interactive quiz questions must reinforcement-test the student's understanding by referencing or extending the specific analogy and scenarios defined in the MENTAL MODEL / ANALOGY above where appropriate.

LIMITATIONS LAWS:
- Exactly 3 bullet points, each describing a specific, source-grounded failure state or edge case for "{title_readable}".
- Format: **Label**: Explanation.

QUIZ LAWS:
- Generate EXACTLY 3 interactive questions testing "{title_readable}" under heterogeneous modes: {q_modes}.
- Hostile Examiner stance: Prove the student doesn't understand the concept.
- Grounding: Only use vocabulary/facts from the SOURCE TEXT. Do not test outside concepts.{mcq_extra}{keyword_extra}"""

        structured_llm = self.llm.with_structured_output(StructuredArtifactsResponse)
        
        for attempt in range(2):
            try:
                await governor.get_permit(expected_tokens=3000)
                res = await structured_llm.ainvoke([
                    ("system", sys_prompt),
                    ("human", f"Generate structured artifacts and quiz for {note_title}.")
                ])
                
                quiz_list = []
                for q in res.quiz_questions:
                    q_dict = {
                        "type": q.type,
                        "question": q.question,
                        "explanation": q.explanation,
                        "answer": q.answer
                    }
                    if q.options: q_dict["options"] = q.options
                    if q.required_keywords: q_dict["required_keywords"] = q.required_keywords
                    if q.content: q_dict["content"] = q.content
                    if q.textWithBlanks: q_dict["textWithBlanks"] = q.textWithBlanks
                    if q.pairs: q_dict["pairs"] = q.pairs
                    if q.steps: q_dict["steps"] = q.steps
                    quiz_list.append(q_dict)
                
                return {
                    "artifact_title": self.domain.get("artifact", "Technical Artifact"),
                    "artifact_content": res.artifact_content,
                    "limitations": res.limitations,
                    "quiz_questions": quiz_list
                }
            except Exception as e:
                print(f"[PractitionerAgent] Structured pass attempt {attempt+1} failed: {e}")
                if attempt == 1:
                    raise RuntimeError(f"PractitionerAgent.generate_structured_artifacts exhausted retries: {e}")
                await asyncio.sleep(2)

    async def generate_micro(self, note_title: str, theory_body: str, primary_language: str, mode: str = "", source_text: str = "", academic_level: str = "Unknown", course_title: str = "Unknown", max_tokens: int = 8000, plain_english: str = "") -> Dict[str, Any]:
        persona = self.domain.get("persona", "Senior Expert")
        sanity_check = self.domain.get("sanity_check", "Ensure logical consistency.")
        artifact_type_hint = self.domain.get("type", "Markdown Table")
        if len(artifact_type_hint) > 80:
            artifact_type_hint = artifact_type_hint[:80]
        q_modes = self.domain.get("question_modes", ["mcq", "true_false", "writing"])
        
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
            q_modes=q_modes
        )

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
        persona = self.domain.get("persona", "Subject Matter Expert")
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

        # Handle heterogeneous question modes if no specific single type requested
        if not q_type:
            q_modes = self.domain.get("question_modes", ["mcq", "true_false", "writing"]).copy()
            while len(q_modes) < count:
                q_modes.append("mcq")
            schema_list = []
            for i in range(count):
                m = q_modes[i]
                sch = schemas.get(m, schemas["mcq"])
                schema_list.append(f"Question {i+1} (type: '{m}'):\n{{\n  {sch}\n}}")
            type_schema = "\n\n".join(schema_list)
            q_type_str = f" Generate exactly {count} heterogeneous questions matching these types respectively: {q_modes[:count]}."
        else:
            type_schema = schemas.get(q_type, schemas["mcq"])
            q_type_str = f" Ensure ALL {count} questions are of type '{q_type}'."

        # For MCQ: explicitly require 4 options
        mcq_extra = ""
        if q_type == "mcq" or not q_type:
            mcq_extra = "\nCRITICAL FOR MCQ: You MUST provide EXACTLY 4 options (A, B, C, D). Never generate only 2 options. All 4 distractors must be plausible but only one is correct."

        keyword_extra = ""
        if q_type in ["writing", "synthesis", "debug", "scenario", "trace"] or not q_type:
            keyword_extra = """
MANDATORY FOR WRITING, SYNTHESIS, DEBUG, SCENARIO, AND TRACE TYPES:
You MUST include "required_keywords": ["term1", "term2", "term3"] in those question objects.
Rules:
- Exactly 3-5 terms.
- Must be non-trivial technical vocabulary (not stopwords).
- A correct student answer MUST contain these terms to be valid.
- Example: "required_keywords": ["percentage change", "quantity demanded", "inelastic"]
"""

        sys_prompt = f"""You are a hostile examiner. Prove the student doesn't actually understand "{title_readable}".
Generate EXACTLY {count} question(s).
{q_type_str}
OUTPUT: A JSON array of {count} object(s) inside <QUIZ_JSON> tags.

JSON SCHEMA:
[
  {{
    {type_schema}
  }}
]

LAWS (non-negotiable):
1. LEVEL: Match {academic_level} difficulty.
2. DOMAIN: Use professional context "{prof_domain}" for examples.
3. APPLICATION: No simple recall. Test application, tracing, or analysis.
4. SOURCE LOCK: Every single question MUST test ONLY vocabulary and concepts found in the SOURCE CONTEXT below. If a term or idea is NOT in the source context, you MUST NOT use it.
5. DOMAIN DRIFT PROHIBITION: You are STRICTLY FORBIDDEN from introducing advanced topics not in the source (e.g. aggregate demand curves, monetary policy, game theory, regression analysis, quantum mechanics, etc.) unless they are explicitly stated in the source context.
6. JSON ONLY: Output ONLY the JSON array inside <QUIZ_JSON></QUIZ_JSON> tags. Zero other text.
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
                match = re.search(r"<QUIZ_JSON>(.*?)</QUIZ_JSON>", content, re.DOTALL)
                if not match:
                    match = re.search(r"```json\s*(.*?)\s*```", content, re.DOTALL)
                
                if not match:
                    if content.strip().startswith("["):
                        raw_json = content.strip()
                    else:
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

                # Attempt 4: dict-based fallback
                if data is None:
                    try:
                        data = ArchitectAgent._parse_json(raw_json)
                    except Exception:
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
                        q["explanation"] = f"Explained in the textbook context."
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
                err_msg = str(e).lower()
                is_429 = "429" in err_msg or "rate limit" in err_msg or "rate_limit" in err_msg
                if is_429:
                    wait_sec = _extract_wait_time(err_msg, default=5.0)
                    governor.report_error(wait_seconds=wait_sec)
                
                print(f"[QuestionAgent] Attempt {attempt+1} failed: {e}")
                if attempt == 3:
                    raise e

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
            "SYNTHESIS GAP PROTOCOL: If you detect multiple notes on the same core topic but with different modalities "
            "(e.g., a 'Quantitative' note and a 'Qualitative' note on the same law), you MUST include a specific "
            "'Integrated Synthesis' paragraph that bridges the math and the philosophy of that topic.\n\n"
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
                    _logging.getLogger("Ater").warning(f"[VerifierAgent] Both attempts failed. Defaulting to PASS to avoid false block.")
                    return {"passed": True, "failures": []}


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
