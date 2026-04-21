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
            "MODES (PERSONA ASSIGNMENT):\n"
            "- CS-CODE: Programming, Syntax, Logic, Algorithms.\n"
            "- CS-SYS: Architecture, Networking, Distributed Systems.\n"
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
            "Assign the optimal specialist mode for each concept.\n"
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
    def __init__(self, llm: BaseChatModel):
        self.llm = llm
        self.llm_with_components = llm.with_structured_output(NoteComponents)
        self.llm_with_probes = llm.with_structured_output(ProbeEnrichment)
        from .validator import OkaValidator
        self.validator = OkaValidator()

    async def generate_content(self, note_schema: AtomicNoteSchema, source_text: str, primary_language: str, all_concepts: str) -> NoteContent:
        persona_info = PERSONA_PROMPTS.get(note_schema.mode, PERSONA_PROMPTS["CS-CODE"])
        headers = UNIVERSAL_HEADERS.replace("{all_concepts}", all_concepts)
        
        sys = f"{persona_info}\n\n{headers}\n\nLanguage: {primary_language}\n\nMETADATA MANDATE: Look for [PAGE X] markers in the source text and extract the exact page numbers for 'source_pages'.\n\nRETURN ONLY PURE JSON."
        msg = [("system", sys), ("human", f"Concept: {note_schema.title}\nSource:\n{source_text}")]
        
        try:
            comp = await self.llm_with_components.ainvoke(msg)
            return self._assemble_markdown(comp, primary_language)
        except Exception as e:
            print(f"[WriterAgent] Fallback to robust parsing: {e}")
            res = await self.llm.ainvoke(msg)
            success, data, err = self.validator.validate_json_robust(res.content)
            if success:
                data_obj = self._defensive_parse_components(json.dumps(data))
                return self._assemble_markdown(data_obj, primary_language)
            return self._assemble_markdown(self._defensive_parse_components(res.content), primary_language)

    def _strip_lang_prefix(self, text: str, lang: str) -> str:
        """Removes leaked naked language tags like 'cpp' or 'c++' from the start of content."""
        if not text: return text
        p = text.strip()
        # Common hallucinations: 'cpp', 'c++', 'C++', 'Python', 'text'
        regex = rf"^(?:{lang}|{lang.lower()}|{lang.upper()}|c\+\+|C\+\+|text|python|javascript|java)\s*\n+"
        return re.sub(regex, "", p, flags=re.IGNORECASE).strip()

    def _normalize_tables(self, text: str) -> str:
        """Ensures markdown tables have valid separators, alignment, and proper gutters."""
        lines = text.split('\n')
        final_output = []
        in_table = False
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            if "|" in stripped:
                # We are in a table row
                if not in_table:
                    # Starting a new table: Ensure gutter before
                    if final_output and final_output[-1].strip() != "":
                        final_output.append("")
                    in_table = True
                
                # Normalize the row: strip outer pipes, split, clean parts, re-wrap
                row_content = stripped.strip("|")
                parts = [p.strip() for p in row_content.split("|")]
                # Force clean row
                clean_row = "| " + " | ".join(parts) + " |"
                final_output.append(clean_row)
                
                # Auto-inject separator if this is the first row and next isn't a separator
                is_separator = all(c in "-:| " for c in stripped) and "-" in stripped
                if not is_separator:
                    # Check if next line is a separator
                    next_is_sep = False
                    if i < len(lines) - 1:
                        next_line = lines[i+1].strip()
                        next_is_sep = "|" in next_line and all(c in "-:| " for c in next_line.strip("|")) and "-" in next_line
                    
                    if not next_is_sep and (i == 0 or "|" not in lines[i-1]):
                        # This is likely the header row and missing a separator
                        sep = "| " + " | ".join(["---"] * len(parts)) + " |"
                        final_output.append(sep)
            else:
                if in_table:
                    # Ending a table: Ensure gutter after
                    final_output.append("")
                    in_table = False
                final_output.append(line)
        
        if in_table:
            final_output.append("")
            
        return "\n".join(final_output).replace("\n\n\n", "\n\n")

    def _balance_code_blocks(self, text: str) -> str:
        """Physical Backtick Balancer: Ensures every block starts and ends on its own line with a gutter."""
        lines = text.split('\n')
        balanced_lines = []
        in_code_block = False
        
        FORBIDDEN_LANGS = ["python", "mermaid", "sql", "c++", "cpp", "javascript", "json", "yaml", "java", "c#"]

        for line in lines:
            stripped = line.strip()
            lower_stripped = stripped.lower()
            
            # 1. Handle Naked Language Tags (Auto-Start)
            if not in_code_block and lower_stripped in FORBIDDEN_LANGS:
                if balanced_lines and balanced_lines[-1].strip() != "":
                    balanced_lines.append("")
                balanced_lines.append(f"```{lower_stripped}")
                in_code_block = True
                continue

            # 2. Handle Backtick Blocks
            if stripped.startswith("```"):
                if not in_code_block:
                    # Starting a block: Ensure gutter before
                    if balanced_lines and balanced_lines[-1].strip() != "":
                        balanced_lines.append("")
                    in_code_block = True
                    # Normalize c++ to cpp for consistency if needed, but keeping user's preferred cpp
                    tag = stripped[3:].strip().lower()
                    if tag == "c++": tag = "cpp"
                    balanced_lines.append(f"```{tag}" if tag else "```")
                else:
                    # Closing a block: 
                    balanced_lines.append("```")
                    balanced_lines.append("")
                    in_code_block = False
                continue
            
            # 3. HEURISTIC: Force-close if we hit a header or horizontal rule while in a block
            if in_code_block:
                if stripped.startswith("##") or stripped.startswith("###") or (stripped.startswith("---") and len(stripped) < 10):
                    balanced_lines.append("```") 
                    balanced_lines.append("")
                    in_code_block = False
                    # Fall through to append the header line normally

            balanced_lines.append(line)

        if in_code_block:
            balanced_lines.append("```")
            
        return "\n".join(balanced_lines).replace("\n\n\n", "\n\n")

    def _assemble_markdown(self, c: NoteComponents, lang: str = "cpp") -> NoteContent:
        """Ironshield Assembler v20.1: Balanced Backticks, Normalized Tables & Strict Gutters."""
        lang_tag = lang.lower() if lang != "General" else "text"
        
        def flatten(v: Any, is_artifact: bool = False) -> str:
            if isinstance(v, dict): 
                return "\n".join([f"- **{k}**: {flatten(val)}" for k, val in v.items()])
            if isinstance(v, list): 
                if is_artifact and all(isinstance(i, str) for i in v):
                    return "\n".join(v)
                return "\n".join([f"- {flatten(i)}" for i in v])
            return str(v)

        # 1. Process each section with table normalization and code balancing
        def process_section(v):
            text = flatten(v)
            text = self._strip_lang_prefix(text, lang)
            text = self._normalize_tables(text)
            text = self._balance_code_blocks(text)
            return text

        eli5 = process_section(c.explanation)
        deep_dive = process_section(c.deep_dive)
        walkthrough = process_section(c.walkthrough)
        trap = process_section(c.the_trap)
        
        # 2. Artifact Processing (High-Gutter Priority)
        art = self._strip_lang_prefix(flatten(c.artifact, is_artifact=True), lang).strip()
        if "```" not in art and "|" not in art:
            art = f"```{lang_tag}\n{art}\n```"
        
        if "|" in art:
            art = self._normalize_tables(art)
        
        art_final = self._balance_code_blocks(art)

        body = (
            f"## 1. Simple Explanation\n{eli5}\n\n"
            f"## 2. Technical Deep-Dive\n{deep_dive}\n\n"
            f"## 3. Step-by-Step Visualization\n### The Artifact\n\n{art_final}\n\n"
            f"### Logic Walkthrough / Execution Trace\n{walkthrough}\n\n"
            f"## 4. The Trap (Edge Case Analysis)\n{trap}\n\n"
        )
        return NoteContent(markdown_body=body, search_keywords=c.search_keywords)

    def _defensive_parse_components(self, content: str) -> NoteComponents:
        try:
            data = self._clean_and_parse_json(content)
        except:
            return NoteComponents(explanation=content, deep_dive="Check raw content.", artifact="", walkthrough="", the_trap="", search_keywords=[])

        mapping = {
            "explanation": ["explanation", "1"], "deep_dive": ["deep_dive", "2"],
            "artifact": ["artifact", "3"], "walkthrough": ["walkthrough", "4"],
            "the_trap": ["the_trap", "5"],
            "search_keywords": ["search_keywords", "6", "7"]
        }
        res = {}
        for target, aliases in mapping.items():
            val = next((data[a] for a in aliases if a in data), "")
            if not val: # look deeper
                for k, v in data.items():
                    if isinstance(v, dict):
                        val = next((v[a] for a in aliases if a in v), "")
                        if val: break
            res[target] = val if target != "search_keywords" else (val if isinstance(val, list) else [])
        return NoteComponents(**res)

    async def generate_probes(self, note_title: str, note_body: str, source_text: str, primary_language: str, all_concepts: str) -> ProbeEnrichment:
        sys = (
            f"You are the SOCRATIC INQUISITOR for [[{note_title}]].\n"
            f"PRIMARY LANGUAGE: {primary_language}\n"
            "MISSION: (v20.8 Fortified) Generate 3 retrieval probes of increasing difficulty (L1-L3).\n"
            "- L1 (Scenario): A 'What happens if...' question grounded in basic syntax.\n"
            "- L2 (Implementation): An active recall challenge. Ask the user to mentally solve a specific, high-fidelity code constraint.\n"
            "- L3 (Debug/Fix): Provide a BROKEN CODE BLOCK (using backticks) containing a subtle conceptual trap from this note. Ask how to fix it.\n"
            "STRICT GROUNDING: Use ONLY concepts from this specific note. DO NOT pull external library info.\n"
            "FORMATTING: Use clear spacing. ALWAYS include a small code snippet in L3 using standard ``` fenced blocks.\n"
            "RETURN ONLY PURE JSON matching the ProbeEnrichment schema."
        )
        msg = [("system", sys), ("human", f"Note Content:\n{note_body}\n\nSource Excerpt:\n{source_text[:2000]}\n\nAll Unit Concepts: {all_concepts}")]
        try:
            return await self.llm_with_probes.ainvoke(msg)
        except Exception:
            res = await self.llm.ainvoke(msg)
            data = self._clean_and_parse_json(res.content)
            return ProbeEnrichment(**data)

    def _clean_and_parse_json(self, content: str) -> Dict[str, Any]:
        """Nuclear Hardened JSON Parser v18.7."""
        if not content: return {"explanation": "Error: Empty content."}
        
        # 1. Strip wrapping text outside first { and last }
        start, end = content.find('{'), content.rfind('}')
        if start != -1 and end != -1:
            raw_json = content[start:end+1]
            try:
                # Remove common markdown artifacts
                clean = re.sub(r"```json|```", "", raw_json).strip()
                # Remove trailing commas that break standard json.loads
                clean = re.sub(r",\s*([\]\}])", r"\1", clean)
                # Handle double-escaped newlines
                clean = clean.replace('\\\\n', '\n').replace('\\n', '\n')
                data = json.loads(clean, strict=False)
                
                # RECURSIVE CHECK: If the model nested the JSON under a key named after the concept
                if isinstance(data, dict) and len(data) == 1 and isinstance(list(data.values())[0], dict):
                    inner = list(data.values())[0]
                    if any(k in inner for k in ["explanation", "deep_dive", "artifact"]):
                        return inner
                
                return data
            except Exception as e:
                print(f"[WriterAgent] JSON Parse error: {e}")
                # Fallback: manual regex extraction
                extracted = {}
                for field in ["explanation", "deep_dive", "artifact", "walkthrough", "the_trap"]:
                    match = re.search(f'"{field}"\s*:\s*"(.*?)"', clean, re.DOTALL)
                    if match:
                        extracted[field] = match.group(1).replace("\\n", "\n")
                if "explanation" in extracted: return extracted

        return {"explanation": content, "deep_dive": "FALLBACK: Check raw JSON block in explanation field.", "artifact": "", "walkthrough": "", "the_trap": "", "search_keywords": []}
