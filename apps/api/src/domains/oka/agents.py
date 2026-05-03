import json
import re
import asyncio
from typing import Any, Dict, List
from langchain_core.language_models.chat_models import BaseChatModel
from .schemas import NoteContent, PartialPlan, ProbeEnrichment

# ── DOMAIN MATRIX v25.5 ──────────────────────────────────────────────────────
DOMAIN_MATRIX = {
    "CS-SOFTWARE":        {"persona":"Principal Software Engineer","h1":"Execution Logic & Data Flow","h2":"Edge Cases & Failure States","h3":"Implementation Mechanics","artifact":"Code block (use primary_language) + ASCII memory/stack diagram if relevant","l1":"fill_in","l2":"true_false","l3":"debug"},
    "CS-SYSTEMS":         {"persona":"Systems Architect","h1":"Protocol & Signal Topology","h2":"Bottlenecks & Partition Failures","h3":"Architecture Topology","artifact":"Mermaid sequence diagram","l1":"mcq","l2":"scenario","l3":"debug"},
    "CS-DB":              {"persona":"Database Administrator","h1":"Schema & Query Mechanics","h2":"ACID Violations & Scaling Limits","h3":"Entity-Relationship Model","artifact":"Mermaid erDiagram showing entity relationships","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-AI":              {"persona":"Machine Learning Engineer","h1":"Forward Pass & Backpropagation","h2":"Overfitting & Dimensionality","h3":"Model Architecture","artifact":"Mermaid flowchart or markdown table of hyperparameters","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "CS-TESTING":         {"persona":"QA Lead Engineer","h1":"Test Strategy & Coverage Analysis","h2":"Defect Taxonomy & Regression Risk","h3":"Test Case Matrix","artifact":"Test case table with inputs/expected/actual","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-ARCH":            {"persona":"Principal Architect","h1":"Architectural Pattern & Component Interaction","h2":"Coupling Failures & Scalability Walls","h3":"Component Diagram","artifact":"Mermaid classDiagram or flowchart","l1":"mcq","l2":"scenario","l3":"writing"},
    "CS-REQUIREMENTS":    {"persona":"Requirements Engineer","h1":"Requirement Elicitation & Specification","h2":"Ambiguity Failures & Scope Creep","h3":"Requirements Traceability Matrix","artifact":"Requirements traceability table","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-PURE":          {"persona":"Formal Logician","h1":"Derivation & Logical Trace","h2":"Theorem Constraints & Incompleteness","h3":"Formal Proof Trace","artifact":"LaTeX step-by-step proof","l1":"mcq","l2":"fill_in","l3":"debug"},
    "MATH-STAT":          {"persona":"Data Scientist","h1":"Statistical Modeling & Inference","h2":"Confounding Variables & Bias","h3":"Probability Distribution","artifact":"Markdown probability table AND LaTeX formula","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-CRYPTO":        {"persona":"Cryptographer","h1":"Cryptographic Operations","h2":"Collision Vulnerabilities & Brute Force","h3":"Hash Sequence Trace","artifact":"Hash sequence table","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "PHYSICS-KINEMATICS": {"persona":"Theoretical Physicist","h1":"Kinematic & Quantum Dynamics","h2":"Entropy & Boundary Limits","h3":"Physical Force Model","artifact":"LaTeX equations + ASCII free-body diagram","l1":"fill_in","l2":"scenario","l3":"writing"},
    "CHEMISTRY":          {"persona":"Chemist","h1":"Reaction Mechanisms & Stoichiometry","h2":"Equilibrium Shifts & Catalytic Decay","h3":"Molecular Pathway","artifact":"Molecular structure or reaction pathway","l1":"mcq","l2":"scenario","l3":"debug"},
    "BIOLOGY":            {"persona":"Biologist","h1":"Biochemical Pathways","h2":"Genetic Drift & Environmental Collapse","h3":"Metabolic Map","artifact":"Metabolic pathway flowchart","l1":"true_false","l2":"scenario","l3":"writing"},
    "ENG-MECH":           {"persona":"Mechanical Engineer","h1":"Kinematic Linkages & Load Transfer","h2":"Yield Strengths & Fatigue Limits","h3":"Load Tolerance Specs","artifact":"Load-bearing tolerance table","l1":"fill_in","l2":"scenario","l3":"debug"},
    "ENG-ELEC":           {"persona":"Circuit Designer","h1":"Circuit Analysis & Signal Flow","h2":"Thermal Throttling & Impedance Mismatch","h3":"Logic Gate Trace","artifact":"Truth table or logic gate sequence","l1":"true_false","l2":"scenario","l3":"debug"},
    "MED-PHYSIO":         {"persona":"Attending Surgeon","h1":"Systemic Function & Homeostasis","h2":"Pathological Failure & Necrosis","h3":"Spatial Adjacency Model","artifact":"Spatial adjacency matrix","l1":"fill_in","l2":"scenario","l3":"writing"},
    "MED-PHARMA":         {"persona":"Toxicologist","h1":"Pharmacokinetics & Mechanism of Action","h2":"Toxicity Thresholds & Contraindications","h3":"Pharmacokinetic Pathway","artifact":"Pharmacokinetic pathway flowchart","l1":"mcq","l2":"scenario","l3":"debug"},
    "ECON-MACRO":         {"persona":"Macroeconomist","h1":"Market Dynamics & Capital Flow","h2":"Market Failures & Externalities","h3":"Macro Flowchart","artifact":"Supply-demand graph or macro flowchart","l1":"true_false","l2":"scenario","l3":"writing"},
    "ECON-FINANCE":       {"persona":"Comptroller","h1":"Cash Flow Mechanics & Valuation","h2":"Liquidity Crunches & Solvency Risk","h3":"Financial Ledger","artifact":"T-account ledger or cash flow block","l1":"true_false","l2":"scenario","l3":"debug"},
    "BIZ-STRATEGY":       {"persona":"Corporate Strategist","h1":"Go-to-Market Execution & Supply Chain","h2":"Strategic Moat Vulnerabilities","h3":"Value Chain Framework","artifact":"Value chain diagram or SWOT matrix","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CASE":           {"persona":"Appellate Litigator","h1":"Ratio Decidendi (Legal Trace)","h2":"Appellate Reversals & Jurisdictional Limits","h3":"Precedent Analysis","artifact":"IRAC mapping table","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CONTRACT":       {"persona":"Corporate Lawyer","h1":"Obligation Mechanics & Fulfillment","h2":"Breach Conditions & Liability Triggers","h3":"Condition-Result Model","artifact":"Condition-result matrix","l1":"fill_in","l2":"scenario","l3":"writing"},
    "HIST-CATALYST":      {"persona":"Historical Archivist","h1":"Chronological Catalysts & Execution","h2":"Multi-Generational Fallout","h3":"Causality Timeline","artifact":"Mermaid gantt chart as annotated timeline","l1":"fill_in","l2":"scenario","l3":"writing"},
    "PHILOSOPHY":         {"persona":"Philosopher","h1":"Dialectical Progression","h2":"Logical Fallacies & Existential Paradoxes","h3":"Dialectical Map","artifact":"Dialectical map","l1":"mcq","l2":"scenario","l3":"writing"},
    "PSYCH-SOCIOLOGY":    {"persona":"Behavioral Researcher","h1":"Behavioral Triggers & Societal Shift","h2":"Cognitive Bias & Systemic Erosion","h3":"Cognitive Map","artifact":"Cognitive bias map","l1":"true_false","l2":"scenario","l3":"writing"},
    "LANG-LINGUISTICS":   {"persona":"Grammarian","h1":"Morphological Transformation","h2":"Semantic Ambiguity & Exceptions","h3":"Syntactical Tree","artifact":"Syntactical parsing tree","l1":"mcq","l2":"fill_in","l3":"writing"},
    "LANG-LIT":           {"persona":"Literary Critic","h1":"Narrative Arc & Rhetorical Execution","h2":"Thematic Subversion & Unreliable Narrators","h3":"Motif Matrix","artifact":"Motif matrix","l1":"mcq","l2":"fill_in","l3":"writing"},
    "ARTS-DESIGN":        {"persona":"Creative Director","h1":"Medium Mechanics & Composition","h2":"Perceptual Dissonance & Rule Breaking","h3":"Design Primitives","artifact":"Color palette or design system matrix","l1":"mcq","l2":"scenario","l3":"writing"},
    "SKILLS-HARD":        {"persona":"Master Craftsman","h1":"Step-by-Step Execution Sequence","h2":"Troubleshooting & Critical Failure Points","h3":"Process Blueprint","artifact":"Process flowchart","l1":"fill_in","l2":"scenario","l3":"writing"},
    "SKILLS-FITNESS":     {"persona":"Kinesiologist","h1":"Biomechanical Execution & Metabolism","h2":"Overtraining Vectors & Injury","h3":"Kinematic Trace","artifact":"Kinematic sequence table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "EDUCATION":          {"persona":"Pedagogical Expert","h1":"Learning Theory & Instructional Design","h2":"Cognitive Load & Knowledge Gaps","h3":"Curriculum Framework","artifact":"Learning objective hierarchy","l1":"fill_in","l2":"scenario","l3":"writing"},
    "RESEARCH-METHODS":   {"persona":"Research Methodologist","h1":"Research Design & Data Collection","h2":"Validity Threats & Confounds","h3":"Research Framework","artifact":"Research design matrix","l1":"mcq","l2":"scenario","l3":"writing"},
}

VALID_MODES = set(DOMAIN_MATRIX.keys())

# Concept drift guard — keywords that signal the LLM wandered to the wrong domain
# (e.g. writing about OAuth when the topic is C++ tokens)
_DRIFT_SIGNALS = {
    "access_token", "refresh_token", "oauth", "jwt", "authorization_code",
    "token_blacklist", "uuid", "guid", "distributed system",
}


def _has_domain_drift(title: str, body: str) -> bool:
    """Returns True if the body talks about things clearly unrelated to the title."""
    title_words = set(re.sub(r"[_\-]", " ", title.lower()).split())
    body_lower = body.lower()
    # If several drift signals appear AND none of the title words appear prominently
    drift_hits = sum(1 for s in _DRIFT_SIGNALS if s in body_lower)
    title_hits = sum(1 for w in title_words if len(w) > 3 and w in body_lower)
    return drift_hits >= 2 and title_hits == 0


def _count_wikilinks(text: str) -> int:
    return len(re.findall(r"\[\[[^\]]+\]\]", text))


# ── ARCHITECT AGENT ───────────────────────────────────────────────────────────

class ArchitectAgent:
    """
    Plans the curriculum.  Token-efficient: uses a compact prompt and
    falls back to manual JSON parse on structured-output failure.
    """

    def __init__(self, llm: BaseChatModel):
        self.llm = llm
        try:
            self.llm_structured = llm.with_structured_output(PartialPlan)
        except Exception:
            self.llm_structured = None

    async def generate_partial_plan(self, document_text: str) -> PartialPlan:
        modes_str = ", ".join(DOMAIN_MATRIX.keys())
        # Compact prompt — every token saved matters on weak models
        system = (
            "You are the OKA Curriculum Architect. Extract 15-25 atomic concepts from the text.\n"
            "RULES:\n"
            "1. Titles: 1-3 words, Title_Case_With_Underscores, never a question.\n"
            "2. mode: EXACTLY one code from this list: " + modes_str + "\n"
            "3. prerequisites: list the EXACT titles of other concepts in this plan that must be known first.\n"
            "4. source_context: copy the 1-2 most relevant sentences from the text for this concept.\n"
            "5. source_pages: list page numbers mentioned near that concept (integers only).\n"
            "OUTPUT: pure JSON only — no markdown fences.\n"
            '{"atomic_notes":[{"title":"...","description":"...","mode":"...","prerequisites":[],'
            '"source_context":"...","source_pages":[]}],"possible_questions":[]}'
        )

        last_error = None
        for attempt in range(4):
            try:
                if attempt == 0 and self.llm_structured:
                    try:
                        return await self.llm_structured.ainvoke([
                            ("system", system), ("human", document_text[:12000])
                        ])
                    except Exception as e:
                        last_error = e
                        print(f"[ArchitectAgent] Structured output failed: {e}. Falling back.")

                # Manual parse
                retry_note = f"\nPREVIOUS ERROR: {last_error}\nReturn ONLY pure JSON, no markdown.\n" if last_error else ""
                res = await self.llm.ainvoke([
                    ("system", system + retry_note),
                    ("human", f"Document:\n{document_text[:10000]}")
                ])
                data = self._parse_json(res.content)

                # Sanitise
                data.setdefault("atomic_notes", [])
                data.setdefault("possible_questions", [])
                for note in data["atomic_notes"]:
                    if note.get("mode") not in VALID_MODES:
                        note["mode"] = "CS-SOFTWARE"
                    # Normalise title to underscores
                    note["title"] = re.sub(r"\s+", "_", note.get("title", "Unknown").strip())
                    # Ensure source_pages is a list of ints
                    pages = note.get("source_pages", [])
                    note["source_pages"] = [int(p) for p in pages if str(p).strip().isdigit()]

                return PartialPlan(**data)

            except Exception as e:
                last_error = e
                if self._is_rate_limit(e):
                    wait = 30 * (attempt + 1)
                    print(f"[ArchitectAgent] Rate limited. Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    print(f"[ArchitectAgent] Attempt {attempt+1} failed: {e}")
        raise last_error

    # ── helpers ──
    @staticmethod
    def _parse_json(content: str) -> Dict[str, Any]:
        if not content or not content.strip():
            raise ValueError("Empty response from LLM")
        # Strip markdown fences if present
        clean = re.sub(r"^```[a-z]*\n?", "", content.strip())
        clean = re.sub(r"\n?```$", "", clean).strip()
        start, end = clean.find("{"), clean.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("No JSON object in response")
        return json.loads(clean[start:end+1], strict=False)

    @staticmethod
    def _is_rate_limit(e: Exception) -> bool:
        s = str(e).lower()
        return "429" in s or "rate_limit" in s or "rate limit" in s


# ── NEW SPLIT AGENTS (Theory, Practitioner, Examiner, Critic) ──

class TheoryAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate(self, note_schema, source_text: str, primary_language: str, all_concepts: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            "Write EXACTLY 3 sections. Nothing else.\n\n"
            "# 1. Mental Model\n"
            "Write 2-3 sentences. Use a SPECIFIC, UNCOMMON real-world analogy that maps precisely to how this works. "
            "Do NOT use: boxes, containers, or blueprints.\n\n"
            f"# 2. {self.domain['h1']}\n"
            "Write EXACTLY 5 sentences of continuous technical prose. No bullets.\n"
            "You MUST embed 4-6 wikilinks from this list: {all_concepts}\n"
            "Format: [[Underscore_Title_Case]] — zero spaces inside brackets.\n\n"
            f"# 3. {self.domain['h2']}\n"
            "Write EXACTLY 4 sentences of continuous technical prose. No bullets.\n"
            "Cover boundary conditions, failure states, what breaks and why.\n"
            "You MUST embed 3-5 wikilinks from the list above.\n\n"
            f"Concept: {title_readable}\n"
            f"Source context: {source_text[:1500]}"
        )
        sys_prompt = sys_prompt.replace("{all_concepts}", all_concepts)
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the theory sections.")])
        return res.content.strip()

    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            f"PREVIOUS ATTEMPT FAILED. FIX INSTRUCTION: {diagnosis}\n\n"
            "Write EXACTLY 3 sections. Nothing else.\n\n"
            "# 1. Mental Model\n"
            "Write 2-3 sentences. Vivid, specific analogy.\n\n"
            f"# 2. {self.domain['h1']}\n"
            "Write EXACTLY 5 sentences of continuous technical prose.\n"
            f"MANDATORY: embed 4-6 [[Wikilinks]] from this list: {all_concepts}\n"
            "Format: [[Underscore_Title_Case]]\n\n"
            f"# 3. {self.domain['h2']}\n"
            "Write EXACTLY 4 sentences. Cover boundary conditions.\n"
            "MANDATORY: embed 3-5 [[Wikilinks]]\n\n"
            f"Concept: {title_readable}\n"
            f"Source context: {source_text[:1500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected theory sections.")])
        return res.content.strip()

class PractitionerAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate(self, note_title: str, theory_body: str, primary_language: str) -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            "Write EXACTLY 2 sections. Nothing else.\n\n"
            f"# 4. {self.domain['h3']}\n"
            f"Create a {self.domain['artifact']}. Use correct markdown fences with language tag {primary_language}.\n"
            "After the artifact, write 2 sentences ONLY explaining what each part represents and how to read it.\n\n"
            "## 5. Walkthrough\n"
            "Write EXACTLY 6 numbered steps. No more. No fewer.\n"
            f"Use realistic data. Professional domain: {self.domain.get('walkthrough_domain', 'realistic scenario')}.\n"
            "Each step must show a concrete state change.\n\n"
            f"Concept: {title_readable}\n"
            f"Theory context: {theory_body[:600]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the artifact and walkthrough.")])
        return res.content.strip()

    async def retry(self, note_title: str, theory_body: str, primary_language: str, diagnosis: str) -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = (
            f"You are {self.domain['persona']}.\n"
            f"PREVIOUS ATTEMPT FAILED. FIX: {diagnosis}\n\n"
            "Write EXACTLY 2 sections.\n\n"
            f"# 4. {self.domain['h3']}\n"
            f"Create a {self.domain['artifact']}. Use correct markdown fences.\n"
            "Below the artifact, write 2 sentences explaining it.\n\n"
            "## 5. Walkthrough\n"
            "Write EXACTLY 6 numbered steps showing concrete state changes.\n\n"
            f"Concept: {title_readable}\n"
            f"Theory context: {theory_body[:600]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected artifact and walkthrough.")])
        return res.content.strip()

class ExaminerAgent:
    def __init__(self, llm: BaseChatModel, domain: dict):
        self.llm = llm
        self.domain = domain

    async def generate(self, note_title: str, theory_summary: str, primary_language: str) -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = (
            "Output a valid JSON array of exactly 3 quiz questions. No markdown fences. Just the array.\n\n"
            f"Q1: type=\"{self.domain['l1']}\", difficulty=\"L1\"\n"
            f"Q2: type=\"{self.domain['l2']}\", difficulty=\"L2\"\n"
            f"Q3: type=\"{self.domain['l3']}\", difficulty=\"L3\"\n\n"
            "RULES:\n"
            f"- Q1 type=\"{self.domain['l1']}\" difficulty=\"L1\": Tests recall/definition. Be precise.\n"
            f"- Q2 type=\"{self.domain['l2']}\" difficulty=\"L2\": Tests application to an edge case. Non-obvious.\n"
            f"- Q3 type=\"{self.domain['l3']}\" difficulty=\"L3\": Tests execution/debugging. A realistic scenario.\n"
            "- For debug type: content field = ONLY the buggy code, no hints. Bug must be a RUNTIME logic error, not a compile error.\n"
            "- For fill_in type: textWithBlanks uses [[blank1]] markers, answer is a list of strings.\n"
            f"- All code MUST use language: {primary_language}\n"
            "- JSON ESCAPING: double-escape all LaTeX (e.g. \\\\frac, \\\\rightarrow). CRITICAL: Do NOT use unescaped double quotes inside string values! Use single quotes ('like this') or properly escape double quotes (\\\\\"like this\\\\\").\n"
            "- answer field for true_false MUST be boolean: true or false (no quotes).\n"
            "EXAMPLE PERFECT OUTPUT:\n"
            "[\n"
            "  {\"id\":\"q1\",\"type\":\"fill_in\",\"difficulty\":\"L1\",\"question\":\"The [[Blank1]] operator...\",\"textWithBlanks\":\"The [[Blank1]] operator...\",\"answer\":[\"precedence\"],\"explanation\":\"...\"},\n"
            "  {\"id\":\"q2\",\"type\":\"true_false\",\"difficulty\":\"L2\",\"question\":\"In C++, prefix ++ returns value before increment.\",\"answer\":false,\"explanation\":\"...\"},\n"
            "  {\"id\":\"q3\",\"type\":\"debug\",\"difficulty\":\"L3\",\"question\":\"Find bug.\",\"content\":\"int x=1;\",\"answer\":\"...\",\"explanation\":\"...\"}\n"
            "]\n\n"
            f"Concept: {title_readable}\n"
            f"Key facts: {theory_summary[:500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Output the JSON quiz.")])
        return res.content.strip()

    async def retry(self, note_title: str, theory_summary: str, primary_language: str, diagnosis: str) -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = (
            "PREVIOUS JSON FAILED. Output a VALID JSON array of exactly 3 quiz questions. No fences. Just the array.\n"
            f"FIX INSTRUCTION: {diagnosis}\n\n"
            f"Q1: type=\"{self.domain['l1']}\", difficulty=\"L1\"\n"
            f"Q2: type=\"{self.domain['l2']}\", difficulty=\"L2\"\n"
            f"Q3: type=\"{self.domain['l3']}\", difficulty=\"L3\"\n"
            "Escape all LaTeX with double backslashes.\n"
            "answer for true_false MUST be boolean (true/false, no quotes).\n\n"
            f"Concept: {title_readable}\n"
            f"Key facts: {theory_summary[:500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Output the corrected JSON quiz.")])
        return res.content.strip()

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
        except:
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
        
        # Inject the generated overview into the static hub structure
        new_hub_text = re.sub(
            r"(## Overview\n)(.*?)(?=\n## Unit Objectives)",
            f"\\1{res.content.strip()}\n",
            current_hub_text,
            flags=re.DOTALL
        )
        return new_hub_text

