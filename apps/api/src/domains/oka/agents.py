import json
import re
import asyncio
from typing import Optional, Any, Dict, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, AIMessage
from .schemas import SovereignPlan, AtomicNoteSchema, NoteContent, NoteSchema, PartialPlan, ProbeEnrichment, NoteComponents

# --- THE 12 SOVEREIGN PERSONA MANDATES (v24.0 - Archetype Perfection) ---

PERSONA_PROMPTS = {
    "CS-CODE": """You are THE SYNTAX ENGINEER. 
Mandate: Memory-mapped precision. 
Focus: Low-level implementation, Pointer arithmetic, RAII, Big-O efficiency, and Stack/Heap allocation. 
Artifact: High-fidelity, compilable code blocks (e.g. C++, Rust) with inline comments explaining memory lifecycle and time complexity.""",

    "CS-SYS": """You are THE SYSTEMS ARCHITECT. 
Mandate: Topological clarity. 
Focus: Distributed systems, API contracts, CAP theorem, throughput bottlenecks, and network protocols. 
Artifact: Mermaid Sequence Diagrams or Component Architecture maps showing data flow and latency points.""",

    "MED-STRUCT": """You are THE ANATOMIST. 
Mandate: Spatial Adjacency. 
Focus: Gross anatomy, Neurovasculature, Physical hierarchies, and Clinical landmarks. 
Artifact: Detailed tables mapping Origin, Insertion, Innervation, and Blood Supply (OIIA) with absolute terminology precision.""",

    "MED-DYN": """You are THE PHYSIOLOGIST. 
Mandate: Homeostatic Cascades. 
Focus: Biochemical pathways, Endocrine feedback loops, Mechanism of Action (MoA), and pathology progression. 
Artifact: Step-by-step Trigger-Response logic chains or Flowcharts showing regulatory pathways.""",

    "LAW-RULE": """You are THE LEGISLATOR. 
Mandate: Black-Letter Law. 
Focus: Statutory interpretation, Element-based testing, Jurisdictional thresholds, and Literal wording. 
Artifact: Condition-Result Matrices (If-Then-Else tables) that break down legal tests into binary elements.""",

    "LAW-PREC": """You are THE LITIGATOR. 
Mandate: Judicial Precedent. 
Focus: Ratio Decidendi, Obiter Dicta, Stare Decisis, and Case Comparison. 
Artifact: IRAC (Issue, Rule, Application, Conclusion) tables comparing the current concept against landmark case law.""",

    "ENG-PHYS": """You are THE MECHANICAL LEAD. 
Mandate: Failure Analysis. 
Focus: Statics/Dynamics, Material Science, Stress-Strain curves, and Yield limits. 
Artifact: Force-balance tables or Material Spec Sheets with specific unit conversions (SI/Imperial) and Safety Factors.""",

    "ENG-ELEC": """You are THE SIGNAL ENGINEER. 
Mandate: Waveform Integrity. 
Focus: Circuit analysis, Impedance matching, Logic gate propagation, and PCB signal paths. 
Artifact: Truth Tables, Timing Diagrams, or Logic Gate traces in Mermaid or Table format.""",

    "SCI-MATH": """You are THE FORMALIST. 
Mandate: Axiomatic Derivation. 
Focus: Mathematical proofs, Set theory, Calculus rigor, and Theorem derivation. 
Artifact: Step-by-step LaTeX proof sequences where every logical leap is cited (e.g., 'by L'Hopital's Rule').""",

    "SCI-DATA": """You are THE EMPIRICIST. 
Mandate: Statistical Rigor. 
Focus: Methodology, Sampling bias, Null-hypothesis testing, and P-value significance. 
Artifact: Variable Control Tables or Methodology Flowcharts showing the path from Data Collection to Inference.""",

    "HIST-TIME": """You are THE CHRONICLER. 
Mandate: Diachronic Causality. 
Focus: Historical catalysts, Preconditions, Immediate triggers, and Multi-generational fallout. 
Artifact: Annotated Timelines with 'Primary Catalyst' tagging and Causality domino-chains.""",

    "HIST-TREND": """You are THE SOCIAL ANALYST. 
Mandate: Structural Dialectics. 
Focus: Power dynamics, Ideological shifts, Economic pivot points, and Stakeholder interests. 
Artifact: Power/Interest Matrix or Ideology Comparison Tables showing the collision of competing social forces."""
}

UNIVERSAL_HEADERS = """
CRITICAL SOVEREIGN DIRECTIVE (v24.1 - MANDATE ALIGNMENT):
1. "explanation": (Entry-point analogy. NO jargon. NO raw keywords.)
2. "deep_dive": (500+ words. Maximize technical density. MUST USE ACADEMIC TERMINOLOGY.
   - MANDATORY: Use `inline_code` for all technical terms (e.g. `int`, `static`, `void`).
   - MANDATORY: All blocks MUST be fenced with language tags.
3. "artifact": (MANDATORY: MUST BE COMPLETE. NO TRUNCATION.
   - MANDATE ALIGNMENT: Your artifact MUST match your Persona's expertise (e.g., Code for CS-CODE, IRAC for LAW-PREC, Proofs for SCI-MATH).
   - TABLES: Clean structure. No side-pipes. Proper |---| separator.
   - CODE: High-fidelity, self-contained, working syntax.
4. "walkthrough": (MANDATORY: 3+ numbered steps trace.
   - Explain the logic of your artifact step-by-step.)
5. "the_trap": (Subtle failure mode + solution. High-grade exam edge case.)
6. "search_keywords": (5-7 keywords)

STRICT RENDERING LAWS:
- GUTTERS: ONE empty line BEFORE and AFTER every: Heading, Table, Code Block, and Mermaid Diagram.
- PERSONA LAW: You MUST strictly adopt the tone and technical depth of your assigned Persona.
- ABSOLUTE INTEGRITY: NEVER emit empty sections. Use internal knowledge if context is thin.
"""

# --- AGENTS ---

class ArchitectAgent:
    def __init__(self, llm: BaseChatModel):
        self.llm = llm
        self.llm_with_plan = llm.with_structured_output(PartialPlan)

    async def generate_partial_plan(self, document_text: str) -> PartialPlan:
        prompt = (
            "You are the OKA Master Architect. Your mission is TOTAL CURRICULUM SATURATION.\n"
            "MANDATE: Extract 20-30 atomic concepts from this text. NO CONCEPT LEFT BEHIND.\n"
            "MANDATORY FORMAT: RETURN ONLY JSON following the schema.\n"
            "STRICT NAMING RULES:\n"
            "- Titles MUST be ABSOLUTELY ONE CONCEPT ONLY (1-3 words max, e.g. 'Multiplicity', 'Recursion').\n"
            "- NEVER use questions as titles (e.g. 'What is a Database?').\n"
            "- You MUST populate the `prerequisites` list with the EXACT titles of other concepts in this plan that should be learned first. This builds the dependency tree.\n"
            "MODES (PERSONA ASSIGNMENT):\n"
            "- CS-CODE: Programming, Syntax, Logic, Algorithms.\n"
            "- CS-SYS: Architecture, Networking, Distributed Systems.\n"
            "- CS-DB: Database Design, SQL, Relational Algebra.\n"
            "- MED-STRUCT: Anatomy, Physical Structure, Organs.\n"
            "- MED-DYN: Physiology, Pathways, Feedback loops.\n"
            "- LAW-RULE: Statutes, Rules, Legal Tests.\n"
            "- LAW-PREC: Case Law, Precedent, Legal reasoning.\n"
            "- ENG-PHYS: Mechanics, Statics, Materials, Physical forces.\n"
            "- ENG-ELEC: Circuits, Signals, Electrical engineering.\n"
            "- SCI-MATH: Proofs, Derivations, Formal mathematics.\n"
            "- SCI-DATA: Statistics, Research, Data methodology.\n"
            "- HIST-TIME: Timelines, Causality, Historical events.\n"
            "- HIST-TREND: Power dynamics, Social shifts, Ideologies.\n"
            "- LANG-VOCAB: Vocabulary, Grammar Rules, Syntax.\n"
            "- LANG-CULT: Cultural Context, Idioms, Literature.\n"
            "- BIZ-STRAT: Business Strategy, Management.\n"
            "- BIZ-FIN: Finance, Accounting, Economics.\n"
            "- ART-TECH: Art Techniques, Mediums, Execution.\n"
            "- ART-HIST: Art History, Movements, Critiques.\n"
            "CRITICAL: You MUST select the `mode` ONLY from the 19 exact codes listed above. DO NOT hallucinate new modes.\n"
            "RETURN ONLY PURE JSON."
        )
        
        last_error = None
        for attempt in range(3):
            try:
                if attempt == 0:
                    return await self.llm_with_plan.ainvoke([("system", prompt), ("human", document_text)])
                else:
                    # Fallback with explicit schema reinforcement
                    retry_prompt = (
                        f"{prompt}\n\n"
                        "ACTUALLY RETURN PURE JSON. DO NOT FORGET FIELDS.\n"
                        "STRICT NAMING RULES (DO NOT VIOLATE):\n"
                        "- 1-3 WORD CONCEPTS ONLY.\n"
                        "- NO QUESTIONS.\n"
                        "CRITICAL: `mode` MUST BE ONE OF THE 19 EXACT STRINGS LISTED ABOVE.\n"
                        "MANDATORY KEYS: 'atomic_notes', 'possible_questions'.\n"
                        "Each note MUST have 'title' and 'description'."
                    )
                    res = await self.llm.ainvoke([("system", retry_prompt), ("human", document_text)])
                    data = self._clean_and_parse_json(res.content)
                    
                    # Ensure minimal valid lists
                    if "atomic_notes" not in data: data["atomic_notes"] = []
                    if "possible_questions" not in data: data["possible_questions"] = []
                    
                    return PartialPlan(**data)
            except Exception as e:
                last_error = e
                # Check for Groq/OpenAI Rate Limits (429)
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    wait_time = (attempt + 1) * 30
                    print(f"[ArchitectAgent] Rate limit hit. Throttling for {wait_time}s...")
                    await asyncio.sleep(wait_time)
                
                print(f"[ArchitectAgent] Attempt {attempt+1} failed: {e}")
                continue
        raise last_error

    def _clean_and_parse_json(self, content: str) -> Dict[str, Any]:
        if not content or not content.strip(): raise ValueError("Empty response.")
        start, end = content.find('{'), content.rfind('}')
        if start != -1 and end != -1 and end > start:
            clean = re.sub(r"```json|```", "", content[start:end+1]).strip()
            return json.loads(clean, strict=False)
        raise ValueError("No JSON block found.")

class WriterAgent:
    def __init__(self, llm):
        # Force temperature to 0.0 to prevent 17B model hallucinations and lazyness
        self.llm = llm.with_config(temperature=0.0)
        from .validator import OkaValidator
        self.validator = OkaValidator()

    async def generate_content(self, note_schema, source_text: str, primary_language: str, all_concepts: str):
        persona_id = note_schema.mode
        
        dynamic_map = {
            "CS-CODE": ("Syntax Mechanics", "Memory Lifecycle"),
            "CS-SYS": ("Architecture Topology", "Bottlenecks & Limits"),
            "CS-DB": ("Schema Design", "Query Optimization"),
            "MED-STRUCT": ("Spatial Adjacency", "Clinical Landmarks"),
            "MED-DYN": ("Biochemical Pathway", "Feedback Mechanisms"),
            "LAW-RULE": ("Statutory Elements", "Jurisdictional Limits"),
            "LAW-PREC": ("Ratio Decidendi", "Historical Precedent"),
            "ENG-PHYS": ("Physical Forces", "Failure Thresholds"),
            "ENG-ELEC": ("Signal Propagation", "Circuit Analysis"),
            "SCI-MATH": ("Axiomatic Foundation", "Theorem Constraints"),
            "SCI-DATA": ("Statistical Rigor", "Sampling Bias"),
            "HIST-TIME": ("Primary Catalysts", "Multi-Gen Fallout"),
            "HIST-TREND": ("Competing Ideologies", "Economic Pivots"),
            "LANG-VOCAB": ("Syntactical Structure", "Etymological Roots"),
            "LANG-CULT": ("Cultural Context", "Idiomatic Usage"),
            "BIZ-STRAT": ("Value Proposition", "Market Positioning"),
            "BIZ-FIN": ("Valuation Metrics", "Risk Factors"),
            "ART-TECH": ("Medium Mechanics", "Execution Strategy"),
            "ART-HIST": ("Aesthetic Philosophy", "Movement Catalysts")
        }
        
        h1, h2 = dynamic_map.get(persona_id, ("Core Mechanics", "Constraints & Limitations"))
        
        sys_prompt = f"""You are the {persona_id} persona.
MANDATE: Extract the core theory. 
DO NOT output JSON. Output EXACTLY this Markdown format:

# 1. Technical Definition
(Provide a highly specific, 2-sentence formal definition directly from the source. No analogies. Use `inline_code` for technical terms.)

# 2. Mental Model
(Provide an analogy and explanation that a 10-year-old can easily understand. Break down the core logic simply.)

# 3. {h1}
(Max 4 bullet points detailing the core mechanics based on your Persona focus.)

# 4. {h2}
(Max 4 bullet points detailing the limitations, thresholds, or constraints based on your Persona focus.)
"""
        msg = [("system", sys_prompt), ("human", f"Concept: {note_schema.title}\n\nSource Excerpt:\n{source_text[:10000]}")]
        
        try:
            res = await self.llm.ainvoke(msg)
            theory_content = res.content.strip()
            if theory_content.startswith("```markdown"): theory_content = theory_content[11:].strip()
            if theory_content.endswith("```"): theory_content = theory_content[:-3].strip()
        except Exception as e:
            print(f"[WriterAgent] Pass 1 failed: {e}")
            theory_content = "# 1. Technical Definition\nError generating content."

        from .schemas import NoteContent
        return NoteContent(markdown_body=theory_content, search_keywords=[])

    async def generate_probes(self, note_title: str, note_body: str, source_text: str, primary_language: str, all_concepts: str):
        # We try to infer persona from the headings in note_body to pick the right artifact/question
        persona_map = {
            "Syntax Mechanics": ("C++/Rust Code Block", "Find the memory leak/bug."),
            "Architecture Topology": ("Mermaid Sequence Diagram", "What breaks under 10x load?"),
            "Schema Design": ("ER Diagram Block", "Write an optimized SQL JOIN for this schema."),
            "Spatial Adjacency": ("Origin-Insertion Table", "What fails if this nerve is severed?"),
            "Biochemical Pathway": ("Trigger-Response Flowchart", "How does this pathology progress?"),
            "Statutory Elements": ("If-Then-Else Legal Matrix", "Does this specific edge-case violate the rule?"),
            "Ratio Decidendi": ("IRAC Table", "How does this compare to a landmark case?"),
            "Physical Forces": ("Force-Balance / Spec Table", "What happens if yield limit is exceeded?"),
            "Signal Propagation": ("Truth Table / Timing Diagram", "Calculate the impedance mismatch."),
            "Axiomatic Foundation": ("LaTeX Step-by-Step Proof", "Prove this edge case is invalid."),
            "Statistical Rigor": ("Methodology Flowchart", "Identify the confounding variable."),
            "Primary Catalysts": ("Annotated Timeline", "What was the immediate trigger?"),
            "Competing Ideologies": ("Power/Interest Matrix", "Which stakeholder benefits most?"),
            "Syntactical Structure": ("Sentence Parsing Tree", "Identify the grammatical error."),
            "Cultural Context": ("Idiom Translation Matrix", "When would using this idiom be inappropriate?"),
            "Value Proposition": ("SWOT Analysis Table", "How does this combat a specific competitor?"),
            "Valuation Metrics": ("DCF Calculation Block", "What happens if the discount rate increases?"),
            "Medium Mechanics": ("Layering Technique List", "Why did the artist use this specific medium here?"),
            "Aesthetic Philosophy": ("Critique Comparison", "How does this piece rebel against its predecessor?")
        }
        
        artifact_type = "Markdown Artifact"
        question_type = "Application Challenge"
        for key, vals in persona_map.items():
            if key in note_body:
                artifact_type, question_type = vals
                break
                
        sys_prompt = f"""You are generating the pedagogical artifacts and probes.
Based on the theory provided, generate a specific {artifact_type} and a Socratic challenge.
DO NOT output JSON. Output EXACTLY this Markdown format:

### The Artifact
(Generate the {artifact_type}. MUST use triple backticks.)

### Execution Walkthrough
1. (Step 1)
2. (Step 2)
3. (Step 3)

### L1_SCENARIO: (Write a 1-sentence basic recall scenario)
### L2_IMPLEMENTATION: (Write a realistic scenario applying the concept)
### L3_DEBUG: ({question_type})
### ANSWER_KEY: (Provide the definitive answers to the L1, L2, and L3 questions)
"""
        msg = [("system", sys_prompt), ("human", f"Theory:\n{note_body}\n\nLanguage: {primary_language}")]
        
        from .schemas import ProbeEnrichment
        try:
            res = await self.llm.ainvoke(msg)
            out = res.content.strip()
            
            import re
            
            l1_match = re.search(r"### L1_SCENARIO:\s*(.*?)(?=### L2_IMPLEMENTATION:|$)", out, re.DOTALL)
            l2_match = re.search(r"### L2_IMPLEMENTATION:\s*(.*?)(?=### L3_DEBUG:|$)", out, re.DOTALL)
            l3_match = re.search(r"### L3_DEBUG:\s*(.*?)(?=### ANSWER_KEY:|$)", out, re.DOTALL)
            ans_match = re.search(r"### ANSWER_KEY:\s*(.*)", out, re.DOTALL)
            
            artifact_match = re.split(r"### L1_SCENARIO:", out)
            artifact_text = artifact_match[0].replace("### The Artifact", "").strip() if len(artifact_match) > 0 else ""
            
            l1_val = l1_match.group(1).strip() if l1_match else "Recall scenario."
            l2_val = l2_match.group(1).strip() if l2_match else "Application scenario."
            l3_val = l3_match.group(1).strip() if l3_match else "Debug challenge."
            ans_val = ans_match.group(1).strip() if ans_match else "No answers provided."
            
            return ProbeEnrichment(worked_example=artifact_text, l1_scenario=l1_val, l2_implementation=l2_val, l3_debug=l3_val, answer_key=ans_val)
        except Exception as e:
            print(f"[WriterAgent] Pass 2 failed: {e}")
            return ProbeEnrichment(worked_example="Error", l1_scenario="Error", l2_implementation="Error", l3_debug="Error generating artifact.", answer_key="Error")
