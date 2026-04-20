import json
import re
import asyncio
from typing import Optional, Any, Dict, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, AIMessage
from .schemas import SovereignPlan, AtomicNoteSchema, NoteContent, NoteSchema, PartialPlan, ProbeEnrichment, NoteComponents

# --- THE 12 SOVEREIGN PERSONA MANDATES (v18.0) ---

PERSONA_PROMPTS = {
    "CS-CODE": """You are THE SYNTAX ENGINEER. Mandate: Memory Trace Table. Focus: Pointers, Heap/Stack, Scope. Requirement: High-fidelity code snippets.""",
    "CS-SYS": """You are THE SYSTEMS ARCHITECT. Mandate: Component Interaction Map. Focus: Latency, Scaling, Throughput. Requirement: Mermaid Sequence Diagram.""",
    "MED-STRUCT": """You are THE ANATOMIST. Mandate: Spatial Adjacency Table. Focus: Innervation, Blood Supply, Physical Hierarchy.""",
    "MED-DYN": """You are THE PHYSIOLOGIST. Mandate: Cascade Logic Map. Focus: Feedback loops, Hormones, Mechanism of Action.""",
    "LAW-RULE": """You are THE LEGISLATOR. Mandate: Element-Condition Matrix. Focus: Statutes, Literal Wording, Thresholds.""",
    "LAW-PREC": """You are THE LITIGATOR. Mandate: IRAC (Issue, Rule, Application, Conclusion) Table. Focus: Ratio Decidendi, Case Precedent.""",
    "ENG-PHYS": """You are THE MECHANICAL LEAD. Mandate: Stress-Strain/Material Spec Sheet. Focus: Vectors, Failure Modes, Yield Limits.""",
    "ENG-ELEC": """You are THE SIGNAL ENGINEER. Mandate: Truth Table / Logic Gate Trace. Focus: Voltage, Noise, Impedance.""",
    "SCI-MATH": """You are THE FORMALIST. Mandate: LaTeX Proof Step-by-Step. Focus: Axioms, Derivation, Rigor.""",
    "SCI-DATA": """You are THE EMPIRICIST. Mandate: Variable Control Table. Focus: P-values, Sampling Bias, Methodology.""",
    "HIST-TIME": """You are THE CHRONICLER. Mandate: Causality Chain (Dominoes). Focus: Triggers, Preconditions, Immediate Fallout.""",
    "HIST-TREND": """You are THE SOCIAL ANALYST. Mandate: Stakeholder Power Matrix. Focus: Ideologies, Systemic Shifts, Pivot Points."""
}

UNIVERSAL_HEADERS = """
CRITICAL SOVEREIGN DIRECTIVE (v18.8):
1. "explanation": (Entry-point analogy. NO jargon. NO raw keywords like 'cpp' or 'python' as plain text.)
2. "deep_dive": (500+ words. Maximize technical density. MUST USE ACADEMIC TERMINOLOGY. Extract every keyword. 
   - CRITICAL: DO NOT write 'cpp' or similar language tags as plain text. ALL code must be inside ```cpp blocks.)
3. "artifact": (MANDATORY: Practical Code Block or Complex Table. Detect and include unique syntax like '::', 'const', 'static'.)
4. "walkthrough": (Detailed line-by-line trace of the logic. DO NOT wrap code in JSON-unfriendly quotes.)
5. "the_trap": (Exam-grade failure mode. Describe the subtle error and provide the 'Silver Bullet' solution.)
6. "search_keywords": (5-7 relevant keywords)

MANDATORY SOURCE-ANCHOR PROTOCOL:
- DO NOT include external concepts not present in the Source Text.
- Identify every unique C++ operator or keyword in the text (e.g., ::, &, *, static) and dedicate the 'Deep-Dive' to their mechanics.
- RETURN ONLY PURE JSON. NO WRAPPER TEXT.
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
            "MANDATORY FORMAT: RETURN ONLY JSON following this schema:\n"
            "{\n"
            "  \"atomic_notes\": [\n"
            "    {\n"
            "      \"title\": \"Sanitized_Title\",\n"
            "      \"description\": \"One sentence summary.\",\n"
            "      \"mode\": \"One of: CS-CODE, CS-SYS, MED-STRUCT, LAW-RULE, ENG-PHYS, SCI-MATH, HIST-TIME\",\n"
            "      \"source_pages\": [1, 2]\n"
            "    }\n"
            "  ],\n"
            "  \"possible_questions\": [\n"
            "    { \"title\": \"Topic_Name\", \"description\": \"One sentence summary.\", \"source_pages\": [1] }\n"
            "  ]\n"
            "}\n"
            "Include every technical detail: Scope Resolution Operators (::), Storage Classes (static, extern), Inline vs Macro, Parameter Passing, etc.\n"
            "Assign the optimal specialist persona (mode) for each concept.\n"
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

    async def generate_content(self, note_schema: AtomicNoteSchema, source_text: str, primary_language: str, all_concepts: str) -> NoteContent:
        persona_info = PERSONA_PROMPTS.get(note_schema.mode, PERSONA_PROMPTS["CS-CODE"])
        headers = UNIVERSAL_HEADERS.replace("{all_concepts}", all_concepts)
        
        sys = f"{persona_info}\n\n{headers}\n\nLanguage: {primary_language}\n\nRETURN ONLY PURE JSON."
        msg = [("system", sys), ("human", f"Concept: {note_schema.title}\nSource:\n{source_text}")]
        
        try:
            comp = await self.llm_with_components.ainvoke(msg)
            return self._assemble_markdown(comp, primary_language)
        except Exception as e:
            print(f"[WriterAgent] Fallback: {e}")
            res = await self.llm.ainvoke(msg)
            data = self._defensive_parse_components(res.content)
            return self._assemble_markdown(data, primary_language)

    def _strip_lang_prefix(self, text: str, lang: str) -> str:
        """Removes leaked naked language tags like 'cpp' or 'c++' from the start of content."""
        if not text: return text
        p = text.strip()
        # Common hallucinations: 'cpp', 'c++', 'C++', 'Python', 'text'
        regex = rf"^(?:{lang}|{lang.lower()}|{lang.upper()}|c\+\+|C\+\+|text|python|javascript|java)\s*\n+"
        return re.sub(regex, "", p, flags=re.IGNORECASE).strip()

    def _balance_code_blocks(self, text: str) -> str:
        """Physical Backtick Balancer: Ensures every block starts and ends on its own line with a gutter."""
        lines = text.split('\n')
        balanced_lines = []
        in_code_block = False
        
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("```"):
                if not in_code_block:
                    # Starting a block: Ensure gutter before
                    if balanced_lines and balanced_lines[-1].strip() != "":
                        balanced_lines.append("")
                    in_code_block = True
                    balanced_lines.append(stripped)
                else:
                    # Closing a block: Ensure gutter after
                    balanced_lines.append(stripped)
                    balanced_lines.append("")
                    in_code_block = False
                continue
            
            # HEURISTIC: If we are in_code_block but find a line that is clearly markdown, force-close.
            if in_code_block:
                if stripped.startswith("##") or stripped.startswith("- ") or stripped.startswith("> "):
                    balanced_lines.append("```") 
                    balanced_lines.append("")
                    balanced_lines.append(line)
                    in_code_block = False
                    continue

            balanced_lines.append(line)

        if in_code_block:
            balanced_lines.append("```")
            
        return "\n".join(balanced_lines).replace("\n\n\n", "\n\n")

    def _assemble_markdown(self, c: NoteComponents, lang: str = "cpp") -> NoteContent:
        """Ironshield Assembler v18.9: Balanced Backticks & Strict Gutters."""
        lang_tag = lang.lower() if lang != "General" else "text"
        
        def flatten(v: Any, is_artifact: bool = False) -> str:
            if isinstance(v, dict): 
                return "\n".join([f"- **{k}**: {flatten(val)}" for k, val in v.items()])
            if isinstance(v, list): 
                if is_artifact and all(isinstance(i, str) for i in v):
                    return "\n".join(v)
                return "\n".join([f"- {flatten(i)}" for i in v])
            return str(v)

        # 1. Process and Balance each section
        eli5 = self._balance_code_blocks(self._strip_lang_prefix(flatten(c.explanation), lang))
        deep_dive = self._balance_code_blocks(self._strip_lang_prefix(flatten(c.deep_dive), lang))
        walkthrough = self._balance_code_blocks(self._strip_lang_prefix(flatten(c.walkthrough), lang))
        trap = self._balance_code_blocks(self._strip_lang_prefix(flatten(c.the_trap), lang))
        
        # 2. Artifact Processing (High-Gutter Priority)
        art = self._strip_lang_prefix(flatten(c.artifact, is_artifact=True), lang).strip()
        if "```" not in art:
            if "|" in art and "--" in art:
                pass 
            else:
                art = f"```{lang_tag}\n{art}\n```"
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
