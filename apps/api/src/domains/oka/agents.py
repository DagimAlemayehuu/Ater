import json
import re
import asyncio
from typing import Any, Dict
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import NoteContent, PartialPlan, ProbeEnrichment

# --- THE DOMAIN MATRIX ARCHITECTURE (v25.0) ---

DOMAIN_MATRIX = {
    "CS-SOFTWARE": {
        "persona": "Principal Software Engineer",
        "h1": "Execution Logic & Data Flow",
        "h2": "Edge Cases & Big-O Constraints",
        "h3": "Implementation Mechanics",
        "artifact": "Abstract Syntax Tree or Execution Block",
        "l1_type": "fill_in", "l2_type": "true_false", "l3_type": "debug"
    },
    "CS-SYSTEMS": {
        "persona": "Systems Architect",
        "h1": "Protocol & Signal Topology",
        "h2": "Bottlenecks & Network Partitions",
        "h3": "Architecture Topology",
        "artifact": "Mermaid Sequence Diagram",
        "l1_type": "mcq", "l2_type": "scenario", "l3_type": "debug"
    },
    "CS-DB": {
        "persona": "Database Administrator (DBA)",
        "h1": "Schema & Query Mechanics",
        "h2": "ACID Violations & Scaling Limits",
        "h3": "Entity-Relationship Model",
        "artifact": "ER Diagram or JSON Schema",
        "l1_type": "true_false", "l2_type": "scenario", "l3_type": "debug"
    },
    "CS-AI": {
        "persona": "Machine Learning Engineer",
        "h1": "Forward Pass & Backpropagation",
        "h2": "Overfitting & Dimensionality Curses",
        "h3": "Model Architecture",
        "artifact": "Neural Network Architecture Diagram",
        "l1_type": "mcq", "l2_type": "fill_in", "l3_type": "scenario"
    },
    "MATH-PURE": {
        "persona": "Formal Logician",
        "h1": "Derivation & Logical Trace",
        "h2": "Theorem Constraints & Incompleteness",
        "h3": "Formal Proof Trace",
        "artifact": "LaTeX Step-by-Step Proof",
        "l1_type": "mcq", "l2_type": "fill_in", "l3_type": "debug"
    },
    "MATH-STAT": {
        "persona": "Data Scientist",
        "h1": "Statistical Modeling & Inference",
        "h2": "Confounding Variables & Bias",
        "h3": "Probability Distribution",
        "artifact": "Confusion Matrix or Probability Table",
        "l1_type": "true_false", "l2_type": "scenario", "l3_type": "writing"
    },
    "MATH-CRYPTO": {
        "persona": "Cryptographer",
        "h1": "Cryptographic Operations",
        "h2": "Collision Vulnerabilities & Brute Force",
        "h3": "Hash Sequence Trace",
        "artifact": "Cryptographic Hash Sequence Table",
        "l1_type": "mcq", "l2_type": "fill_in", "l3_type": "scenario"
    },
    "PHYSICS-KINEMATICS": {
        "persona": "Theoretical Physicist",
        "h1": "Kinematic & Quantum Dynamics",
        "h2": "Entropy & Boundary Limits",
        "h3": "Physical Force Model",
        "artifact": "Free-body Diagram or Feynman Diagram",
        "l1_type": "fill_in", "l2_type": "scenario", "l3_type": "writing"
    },
    "CHEMISTRY": {
        "persona": "Chemist",
        "h1": "Reaction Mechanisms & Stoichiometry",
        "h2": "Equilibrium Shifts & Catalytic Decay",
        "h3": "Molecular Pathway",
        "artifact": "Molecular Structure or Reaction Pathway Flowchart",
        "l1_type": "mcq", "l2_type": "scenario", "l3_type": "debug"
    },
    "BIOLOGY": {
        "persona": "Biologist",
        "h1": "Biochemical Pathways",
        "h2": "Genetic Drift & Environmental Collapse",
        "h3": "Metabolic Map",
        "artifact": "Metabolic Pathway Flowchart",
        "l1_type": "true_false", "l2_type": "scenario", "l3_type": "writing"
    },
    "ENG-MECH": {
        "persona": "Mechanical/Civil Engineer",
        "h1": "Kinematic Linkages & Load Transfer",
        "h2": "Yield Strengths & Fatigue Limits",
        "h3": "Load Tolerance Specs",
        "artifact": "Load-bearing Tolerance Table",
        "l1_type": "fill_in", "l2_type": "scenario", "l3_type": "debug"
    },
    "ENG-ELEC": {
        "persona": "Circuit Designer",
        "h1": "Circuit Analysis & Signal Flow",
        "h2": "Thermal Throttling & Impedance Mismatch",
        "h3": "Logic Gate Trace",
        "artifact": "Truth Table or Logic Gate Sequence",
        "l1_type": "true_false", "l2_type": "scenario", "l3_type": "debug"
    },
    "MED-PHYSIO": {
        "persona": "Attending Surgeon",
        "h1": "Systemic Function & Homeostasis",
        "h2": "Pathological Failure & Necrosis",
        "h3": "Spatial Adjacency Model",
        "artifact": "Spatial Adjacency Matrix",
        "l1_type": "fill_in", "l2_type": "scenario", "l3_type": "writing"
    },
    "MED-PHARMA": {
        "persona": "Toxicologist",
        "h1": "Pharmacokinetics & Mechanism of Action",
        "h2": "Toxicity Thresholds & Contraindications",
        "h3": "Pharmacokinetic Pathway",
        "artifact": "Pharmacokinetic Pathway Flowchart",
        "l1_type": "mcq", "l2_type": "scenario", "l3_type": "debug"
    },
    "ECON-MACRO": {
        "persona": "Macroeconomist",
        "h1": "Market Dynamics & Capital Flow",
        "h2": "Market Failures & Externalities",
        "h3": "Macro Flowchart",
        "artifact": "Supply-Demand Graph or Macro Flowchart",
        "l1_type": "true_false", "l2_type": "scenario", "l3_type": "writing"
    },
    "ECON-FINANCE": {
        "persona": "Comptroller",
        "h1": "Cash Flow Mechanics & Valuation",
        "h2": "Liquidity Crunches & Solvency Risk",
        "h3": "Financial Ledger",
        "artifact": "T-Account Ledger or Cash Flow Block",
        "l1_type": "true_false", "l2_type": "scenario", "l3_type": "debug"
    },
    "BIZ-STRATEGY": {
        "persona": "Corporate Strategist",
        "h1": "Go-to-Market Execution & Supply Chain",
        "h2": "Strategic Moat Vulnerabilities",
        "h3": "Value Chain Framework",
        "artifact": "Value Chain Diagram or SWOT Matrix",
        "l1_type": "mcq", "l2_type": "scenario", "l3_type": "writing"
    },
    "LAW-CASE": {
        "persona": "Appellate Litigator",
        "h1": "Ratio Decidendi (Legal Trace)",
        "h2": "Appellate Reversals & Jurisdictional Limits",
        "h3": "Precedent Analysis",
        "artifact": "IRAC Mapping Table",
        "l1_type": "mcq", "l2_type": "scenario", "l3_type": "writing"
    },
    "LAW-CONTRACT": {
        "persona": "Corporate Lawyer",
        "h1": "Obligation Mechanics & Fulfillment",
        "h2": "Breach Conditions & Liability Triggers",
        "h3": "Condition-Result Model",
        "artifact": "Condition-Result Matrix",
        "l1_type": "fill_in", "l2_type": "scenario", "l3_type": "writing"
    },
    "HIST-CATALYST": {
        "persona": "Historical Archivist",
        "h1": "Chronological Catalysts & Execution",
        "h2": "Multi-Generational Fallout",
        "h3": "Causality Timeline",
        "artifact": "Annotated Timeline",
        "l1_type": "fill_in", "l2_type": "scenario", "l3_type": "writing"
    },
    "PHILOSOPHY": {
        "persona": "Philosopher",
        "h1": "Dialectical Progression",
        "h2": "Logical Fallacies & Existential Paradoxes",
        "h3": "Dialectical Map",
        "artifact": "Dialectical Map",
        "l1_type": "mcq", "l2_type": "scenario", "l3_type": "writing"
    },
    "PSYCH-SOCIOLOGY": {
        "persona": "Behavioral Researcher",
        "h1": "Behavioral Triggers & Societal Shift",
        "h2": "Cognitive Bias & Systemic Erosion",
        "h3": "Cognitive Map",
        "artifact": "Cognitive Bias Map",
        "l1_type": "true_false", "l2_type": "scenario", "l3_type": "writing"
    },
    "LANG-LINGUISTICS": {
        "persona": "Grammarian",
        "h1": "Morphological Transformation",
        "h2": "Semantic Ambiguity & Exceptions",
        "h3": "Syntactical Tree",
        "artifact": "Syntactical Parsing Tree",
        "l1_type": "mcq", "l2_type": "fill_in", "l3_type": "writing"
    },
    "LANG-LIT": {
        "persona": "Literary Critic",
        "h1": "Narrative Arc & Rhetorical Execution",
        "h2": "Thematic Subversion & Unreliable Narrators",
        "h3": "Motif Matrix",
        "artifact": "Motif Matrix",
        "l1_type": "mcq", "l2_type": "fill_in", "l3_type": "writing"
    },
    "ARTS-DESIGN": {
        "persona": "Creative Director",
        "h1": "Medium Mechanics & Composition",
        "h2": "Perceptual Dissonance & Rule Breaking",
        "h3": "Design Primitives",
        "artifact": "Color Palette or Design System Matrix",
        "l1_type": "mcq", "l2_type": "scenario", "l3_type": "writing"
    },
    "SKILLS-HARD": {
        "persona": "Master Craftsman",
        "h1": "Step-by-Step Execution Sequence",
        "h2": "Troubleshooting & Critical Failure Points",
        "h3": "Process Blueprint",
        "artifact": "Process Flowchart",
        "l1_type": "fill_in", "l2_type": "scenario", "l3_type": "writing"
    },
    "SKILLS-FITNESS": {
        "persona": "Kinesiologist",
        "h1": "Biomechanical Execution & Metabolism",
        "h2": "Overtraining Vectors & Injury",
        "h3": "Kinematic Trace",
        "artifact": "Kinematic Sequence Table",
        "l1_type": "fill_in", "l2_type": "scenario", "l3_type": "writing"
    },
    "EDUCATION": {
        "persona": "Pedagogical Expert",
        "h1": "Learning Theory & Instructional Design",
        "h2": "Cognitive Load & Knowledge Gaps",
        "h3": "Curriculum Framework",
        "artifact": "Learning Objective Hierarchy",
        "l1_type": "fill_in", "l2_type": "scenario", "l3_type": "writing"
    }
}

# --- AGENTS ---

class ArchitectAgent:
    def __init__(self, llm: BaseChatModel):
        self.llm = llm
        self.llm_with_plan = llm.with_structured_output(PartialPlan)

    async def generate_partial_plan(self, document_text: str) -> PartialPlan:
        modes_str = "\n".join([f"- {k}" for k in DOMAIN_MATRIX.keys()])
        prompt = (
            "You are the OKA Master Architect. Your mission is TOTAL CURRICULUM SATURATION.\n"
            "MANDATE: Extract 20-30 atomic concepts from this text. NO CONCEPT LEFT BEHIND.\n"
            "MANDATORY FORMAT: RETURN ONLY THE JSON OBJECT. DO NOT INCLUDE MARKDOWN CODE BLOCKS.\n"
            "STRICT NAMING RULES:\n"
            "- Titles MUST be ABSOLUTELY ONE CONCEPT ONLY (1-3 words max, e.g. 'Multiplicity', 'Recursion').\n"
            "- NEVER use questions as titles.\n"
            "- You MUST populate the `prerequisites` list with the EXACT titles of other concepts in this plan.\n"
            f"MODES (PERSONA ASSIGNMENT - SELECT EXACTLY ONE PER NOTE):\n{modes_str}\n"
            "CRITICAL: You MUST select the `mode` ONLY from the exact codes listed above.\n"
            "JSON STRUCTURE:\n"
            "{\n"
            "  \"atomic_notes\": [\n"
            "    {\"title\": \"...\", \"description\": \"...\", \"mode\": \"...\", \"prerequisites\": [], \"source_context\": \"...\"}\n"
            "  ],\n"
            "  \"possible_questions\": []\n"
            "}"
        )
        
        last_error = None
        for attempt in range(3):
            try:
                if attempt == 0:
                    try:
                        return await self.llm_with_plan.ainvoke([("system", prompt), ("human", document_text)])
                    except Exception as e:
                        print(f"[ArchitectAgent] Structured output failed: {e}. Falling back to manual parse.")
                        # If tool_use_failed, we fall through to manual parse in next attempt
                        last_error = e
                
                # Manual Parse Retry
                retry_prompt = (
                    f"{prompt}\n\n"
                    f"PREVIOUS ERROR: {last_error}\n"
                    "ACTUALLY RETURN PURE JSON. DO NOT FORGET FIELDS.\n"
                    "STRICT MODES: You MUST use one of the modes listed above. If unsure, use 'CS-SOFTWARE'.\n"
                )
                res = await self.llm.ainvoke([("system", retry_prompt), ("human", f"Document Fragment:\n{document_text[:8000]}")])
                data = self._clean_and_parse_json(res.content)
                
                # Validation & Correction
                if "atomic_notes" not in data: data["atomic_notes"] = []
                if "possible_questions" not in data: data["possible_questions"] = []
                
                # Force valid modes
                valid_modes = set(DOMAIN_MATRIX.keys())
                for note in data.get("atomic_notes", []):
                    if note.get("mode") not in valid_modes:
                        print(f"[ArchitectAgent] Correcting invalid mode: {note.get('mode')} -> CS-SOFTWARE")
                        note["mode"] = "CS-SOFTWARE"
                
                return PartialPlan(**data)
            except Exception as e:
                last_error = e
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    wait_time = (attempt + 1) * 30
                    print(f"[ArchitectAgent] Rate limit hit. Throttling for {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"[ArchitectAgent] Attempt {attempt+1} failed: {e}")
                continue
        raise last_error

    def _clean_and_parse_json(self, content: str) -> Dict[str, Any]:
        if not content or not content.strip(): raise ValueError("Empty response.")
        # Try to find JSON block
        start, end = content.find('{'), content.rfind('}')
        if start != -1 and end != -1 and end > start:
            clean = content[start:end+1].strip()
            # Remove possible markdown wrappers if they leaked inside
            clean = clean.replace("```json", "").replace("```", "").strip()
            return json.loads(clean, strict=False)
        raise ValueError("No JSON object found in response.")

class WriterAgent:
    def __init__(self, llm):
        self.llm = llm.with_config(temperature=0.0)
        from .validator import OkaValidator
        self.validator = OkaValidator()

    async def generate_content(self, note_schema, source_text: str, primary_language: str, all_concepts: str):
        persona_id = note_schema.mode
        domain = DOMAIN_MATRIX.get(persona_id, DOMAIN_MATRIX["CS-SOFTWARE"])
        
        sys_prompt = f"""You are a Hostile, Unforgiving Senior {domain['persona']}.
MANDATE: Write deep, continuous, highly technical prose to extract the core theory. You are conducting a brutal masterclass.
DO NOT output JSON. Output EXACTLY this Markdown format:

# 1. Mental Model
(Explain the main ideas so that a 10-year-old can easily understand them. Use highly relatable analogies, real-world examples, and simple language. Build the conceptual foundation before introducing any jargon.)

# 2. {domain['h1']}
(Deep, continuous explanatory prose detailing *how* this concept operates sequentially or structurally. Explain the mechanism, cause-and-effect, and systemic flow. NO BULLET POINTS ALLOWED. Read like a masterclass lecture.)

# 3. {domain['h2']}
(Deep, continuous explanatory prose detailing *where* this concept breaks down, its limits, constraints, or systemic vulnerabilities. Explain boundary conditions and failure states. NO BULLET POINTS ALLOWED.)

RULES:
1. NO intro/outro filler. Get straight to the point.
2. BAN bullet points in sections 2 and 3. Default to deep analytical paragraphs.
3. Use `inline_code` for all terminology.
4. TECHNICAL ACCURACY IS PARAMOUNT. Do NOT invent runtime constraints for compile-time features. Do NOT hallucinate Big-O complexities. Respect actual language/system specific limits (e.g., 32-bit vs 8-bit overflow). Ground your claims in reality.
5. INTERNAL GRAPH LINKS: You MUST wrap other related technical concepts in Obsidian wikilinks (e.g., [[Concept Name]]). Aim for at least 3-5 internal links per section to build a dense knowledge graph.
"""
        msg = [("system", sys_prompt), ("human", f"Concept: {note_schema.title}\n\nSource Excerpt:\n{source_text[:10000]}")]
        
        try:
            res = await self.llm.ainvoke(msg)
            theory_content = res.content.strip()
            if theory_content.startswith("```markdown"): theory_content = theory_content[11:].strip()
            if theory_content.endswith("```"): theory_content = theory_content[:-3].strip()
            return NoteContent(markdown_body=theory_content, search_keywords=[])
        except Exception as e:
            print(f"[WriterAgent] Pass 1 failed: {e}")
            raise e # Re-raise to trigger queue retry logic

    async def generate_probes(self, note_title: str, note_body: str, source_text: str, primary_language: str, all_concepts: str):
        detected_domain = DOMAIN_MATRIX["CS-SOFTWARE"] # fallback
        for key, vals in DOMAIN_MATRIX.items():
            if vals["h1"] in note_body:
                detected_domain = vals
                break
                
        sys_prompt = f"""You are a Hostile, Unforgiving Senior {detected_domain['persona']} acting as an Inquisitor. Read the technical theory above. Your goal is to ruthlessly test the student.

1. Generate a {detected_domain['artifact']} illustrating the concept. Wrap it in standard markdown backticks. IMMEDIATELY BENEATH IT, add 2-3 sentences of prose explaining how to read the artifact.
2. Write a rigorous, step-by-step WALKTHROUGH example or scenario applying the concept from start to finish. Make it an exam-grade complexity scenario.
3. Generate an Active Recall Quiz based on the note. You MUST output this as a raw JSON ARRAY wrapped inside a custom markdown block named `interactive-quiz`.

The quiz MUST contain exactly 3 questions of increasing difficulty.
You MUST use these specific question types:
- L1 (Theory Recall): Use type `{detected_domain['l1_type']}`
- L2 (Theory Application): Use type `{detected_domain['l2_type']}`
- L3 (In-Action / Execution): Use type `{detected_domain['l3_type']}`

CRITICAL RULE FOR L3 DEBUG QUESTIONS: If your L3 question is 'debug', the code/scenario MUST contain a genuine, syntactically valid but logically flawed bug. NEVER provide correct code and say "there is no bug". The bug must be subtle and require deep domain knowledge to spot.

JSON FORMAT REFERENCE FOR TYPES:
- `mcq`: {{"id": "q1", "type": "mcq", "difficulty": "L1", "question": "...", "options": {{"A": "..", "B": ".."}}, "answer": "A", "explanation": "..."}}
- `true_false`: {{"id": "q2", "type": "true_false", "difficulty": "L1", "question": "...", "answer": "True", "explanation": "..."}}
- `fill_in`: {{"id": "q3", "type": "fill_in", "difficulty": "L1", "question": "Fill in the blanks", "textWithBlanks": "The [[blank1]] is the [[blank2]].", "answer": ["first", "second"], "explanation": "..."}}
- `writing`: {{"id": "q4", "type": "writing", "difficulty": "L2", "question": "Explain X...", "answer": "...", "explanation": "..."}}
- `scenario`: {{"id": "q5", "type": "scenario", "difficulty": "L2", "question": "A user tries to...", "answer": "...", "explanation": "..."}}
- `code`: {{"id": "q6", "type": "code", "difficulty": "L3", "question": "What is the output?", "codeSnippet": "...", "answer": "...", "explanation": "..."}}
- `debug`: {{"id": "q7", "type": "debug", "difficulty": "L3", "question": "Find the bug.", "content": "...", "answer": "...", "explanation": "..."}}

EXPECTED FORMAT:
# 4. {detected_domain['h3']}
(Your {detected_domain['artifact']} here)
(Your 2-3 sentence explanation here IMMEDIATELY under the block)

---

## 5. Walkthrough
(Your rigorous, step-by-step example here)

---

## 6. The Proving Grounds
```interactive-quiz
[
  {{
    "id": "q1",
    "type": "{detected_domain['l1_type']}",
    "difficulty": "L1 (Theory Recall)",
    ...
  }},
  {{
    "id": "q2",
    "type": "{detected_domain['l2_type']}",
    "difficulty": "L2 (Theory Application)",
    ...
  }},
  {{
    "id": "q3",
    "type": "{detected_domain['l3_type']}",
    "difficulty": "L3 (In-Action / Execution)",
    ...
  }}
]
```

FINAL INSTRUCTION: You are a Senior {detected_domain['persona']}. Do not use conversational filler. Maintain a highly technical, authoritative, and demanding tone.
CRITICAL JSON RULE: You MUST output perfectly valid JSON. Ensure it is an ARRAY `[ ... ]` of exactly 3 objects. If you include code in your JSON, escape ALL quotes (\\") and backslashes (\\\\) and newlines (\\n)."""
        msg = [("system", sys_prompt), ("human", f"Theory:\n{note_body}\n\nLanguage: {primary_language}")]
        
        last_error = None
        for attempt in range(3):
            try:
                if attempt > 0:
                    retry_msg = msg + [("assistant", res.content if 'res' in locals() else ""), 
                                       ("human", f"Your previous JSON was invalid. Error: {last_error}. Please output the full response again, ensuring STRICT JSON validity inside the `interactive-quiz` block. It MUST be an ARRAY `[ ... ]`. Escape all backslashes and quotes!")]
                    res = await self.llm.ainvoke(retry_msg)
                else:
                    res = await self.llm.ainvoke(msg)
                    
                out = res.content.strip()
                
                # Extract artifact + walkthrough part
                artifact_match = re.search(r"(# 4\.\s.*?)(?=## 6\. The Proving Grounds|```interactive-quiz|$)", out, re.DOTALL)
                artifact_text = artifact_match.group(1).strip() if artifact_match else "Error extracting artifact and walkthrough."
                
                # Extract JSON quiz
                quiz_match = re.search(r"```interactive-quiz\s*(.*?)\s*```", out, re.DOTALL)
                if quiz_match:
                    quiz_json_str = quiz_match.group(1).strip()
                    
                    # 1. Clean trailing commas
                    quiz_json_str = re.sub(r',\s*}', '}', quiz_json_str)
                    quiz_json_str = re.sub(r',\s*\]', ']', quiz_json_str)
                    
                    # 2. Aggressive Escape Handling
                    try:
                        json_data = json.loads(quiz_json_str, strict=False)
                    except json.JSONDecodeError as err:
                        import ast
                        # Fallback 1: Fix unescaped newlines in strings
                        fixed_str = re.sub(r'(?<!\\)\n(?=(?:[^"]*"[^"]*")*[^"]*"[^"]*$)', '\\\\n', quiz_json_str)
                        try:
                            json_data = json.loads(fixed_str, strict=False)
                            quiz_json_str = fixed_str
                        except json.JSONDecodeError:
                            # Fallback 2: evaluate it as a python list
                            try:
                                # Convert JS-like true/false to Python
                                py_str = quiz_json_str.replace("true", "True").replace("false", "False")
                                json_data = ast.literal_eval(py_str)
                                quiz_json_str = json.dumps(json_data, indent=2)
                            except Exception as eval_err:
                                raise ValueError(f"JSON Parsing failed: {err} (Healing failed: {eval_err})")

                    if not isinstance(json_data, list) or len(json_data) != 3:
                        raise ValueError("JSON must be an array of exactly 3 objects")
                    
                    interactive_quiz = f"```interactive-quiz\n{quiz_json_str}\n```"
                else:
                    raise ValueError("Could not find ```interactive-quiz block")
                
                return ProbeEnrichment(worked_example=artifact_text, interactive_quiz=interactive_quiz)
            except Exception as e:
                last_error = e
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    wait_time = (attempt + 1) * 30
                    print(f"[WriterAgent] Rate limit hit in Pass 2. Throttling for {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"[WriterAgent] Pass 2 failed attempt {attempt+1}: {e}")
                continue
                
        print(f"[WriterAgent] Pass 2 failed completely: {last_error}")
        raise last_error # Re-raise to trigger queue retry logic
