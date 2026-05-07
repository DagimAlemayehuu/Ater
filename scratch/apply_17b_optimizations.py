import re

FILE_PATH = "apps/api/src/domains/oka/agents.py"

with open(FILE_PATH, "r") as f:
    content = f.read()

# 1. Replace DOMAIN_MATRIX
NEW_DOMAIN_MATRIX = '''DOMAIN_MATRIX = {
    "CS-SOFTWARE":        {"persona":"Software Engineer","h1":"How it Works","h2":"Common Pitfalls","artifact":"Code Example","type":"Executable code block (under 20 lines)","l1":"fill_in","l2":"true_false","l3":"debug"},
    "CS-SYSTEMS":         {"persona":"Systems Architect","h1":"System Flow","h2":"Where it Breaks","artifact":"Architecture Diagram","type":"Basic Mermaid flowchart (graph TD/LR)","l1":"mcq","l2":"scenario","l3":"debug"},
    "CS-DB":              {"persona":"Database Admin","h1":"Query Logic","h2":"Data Integrity","artifact":"Database Schema","type":"SQL code block or Markdown Table","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-AI":              {"persona":"Machine Learning Eng.","h1":"Model Mechanics","h2":"Overfitting & Bias","artifact":"Data Pipeline","type":"Basic Mermaid flowchart or Python code","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "CS-TESTING":         {"persona":"QA Engineer","h1":"Test Strategy","h2":"Edge Cases","artifact":"Test Scenario","type":"Code block (assertions) or Markdown Table","l1":"true_false","l2":"scenario","l3":"debug"},
    "CS-ARCH":            {"persona":"Software Architect","h1":"Design Pattern","h2":"Trade-offs","artifact":"Component Diagram","type":"Basic Mermaid flowchart or Markdown Table","l1":"mcq","l2":"scenario","l3":"writing"},
    "CS-REQUIREMENTS":    {"persona":"Product Manager","h1":"Goal Definition","h2":"Scope Creep","artifact":"Requirements Table","type":"Markdown Table (max 3 columns)","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-PURE":          {"persona":"Mathematician","h1":"Formal Definition","h2":"Proof Strategy","artifact":"Mathematical Proof","type":"Block LaTeX ($$)","l1":"mcq","l2":"fill_in","l3":"debug"},
    "MATH-STAT":          {"persona":"Statistician","h1":"Statistical Concept","h2":"Common Biases","artifact":"Data Distribution","type":"Block LaTeX ($$) or Markdown Table","l1":"true_false","l2":"scenario","l3":"writing"},
    "MATH-CRYPTO":        {"persona":"Cryptographer","h1":"Encryption Logic","h2":"Vulnerabilities","artifact":"Cryptographic Flow","type":"Markdown Table or Code snippet","l1":"mcq","l2":"fill_in","l3":"scenario"},
    "MATH-DISCRETE":      {"persona":"Logic Professor","h1":"Discrete Definition","h2":"Base Cases","artifact":"Logical Trace","type":"Truth Table (Markdown) or block LaTeX","l1":"fill_in","l2":"true_false","l3":"debug"},
    "PHYSICS-KINEMATICS": {"persona":"Physicist","h1":"Physical Law","h2":"Boundaries & Limits","artifact":"Formula & Diagram","type":"Block LaTeX ($$) and ASCII Diagram","l1":"fill_in","l2":"scenario","l3":"writing"},
    "CHEMISTRY":          {"persona":"Chemist","h1":"Reaction Mechanism","h2":"Equilibrium","artifact":"Reaction Pathway","type":"Basic Mermaid flowchart or Block LaTeX","l1":"mcq","l2":"scenario","l3":"debug"},
    "BIOLOGY":            {"persona":"Biologist","h1":"Biological Process","h2":"System Failures","artifact":"Pathway Diagram","type":"Basic Mermaid flowchart (graph TD)","l1":"true_false","l2":"scenario","l3":"writing"},
    "ENG-MECH":           {"persona":"Mechanical Engineer","h1":"Mechanical Principle","h2":"Load & Fatigue","artifact":"Force Diagram","type":"ASCII Diagram or Markdown Table","l1":"fill_in","l2":"scenario","l3":"debug"},
    "ENG-ELEC":           {"persona":"Circuit Designer","h1":"Circuit Logic","h2":"Resistance & Heat","artifact":"Circuit Schematic","type":"Truth Table (Markdown) or block LaTeX","l1":"true_false","l2":"scenario","l3":"debug"},
    "MED-PHYSIO":         {"persona":"Surgeon","h1":"Bodily Function","h2":"Disease & Failure","artifact":"System Map","type":"Markdown Adjacency Matrix Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "MED-PHARMA":         {"persona":"Toxicologist","h1":"Drug Mechanism","h2":"Side Effects","artifact":"Interaction Pathway","type":"Markdown Table or Basic Mermaid flowchart","l1":"mcq","l2":"scenario","l3":"debug"},
    "ECON-MACRO":         {"persona":"Macroeconomist","h1":"Economic Theory","h2":"Market Failures","artifact":"Economic Model","type":"Basic Mermaid flowchart (graph LR)","l1":"true_false","l2":"scenario","l3":"writing"},
    "ECON-FINANCE":       {"persona":"Accountant","h1":"Financial Concept","h2":"Financial Risk","artifact":"Ledger Example","type":"Markdown T-Account/Ledger Table","l1":"true_false","l2":"scenario","l3":"debug"},
    "BIZ-STRATEGY":       {"persona":"Business Strategist","h1":"Strategic Concept","h2":"Weaknesses","artifact":"Strategy Matrix","type":"Markdown Table (SWOT)","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CASE":           {"persona":"Lawyer","h1":"Legal Principle","h2":"Exceptions & Limits","artifact":"Case Application","type":"IRAC Framework Markdown Table","l1":"mcq","l2":"scenario","l3":"writing"},
    "LAW-CONTRACT":       {"persona":"Corporate Lawyer","h1":"Contract Rule","h2":"Breach Conditions","artifact":"Liability Map","type":"Markdown Dependency Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "HIST-CATALYST":      {"persona":"Historian","h1":"Historical Event","h2":"Long-term Impact","artifact":"Timeline","type":"Basic Mermaid flowchart (graph TD) or Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "PHILOSOPHY":         {"persona":"Philosopher","h1":"Core Argument","h2":"Counter-Arguments","artifact":"Logical Flow","type":"ASCII Logic Tree or Block quote","l1":"mcq","l2":"scenario","l3":"writing"},
    "PSYCH-SOCIOLOGY":    {"persona":"Psychologist","h1":"Behavioral Concept","h2":"Cognitive Bias","artifact":"Behavior Map","type":"Markdown Matrix Table","l1":"true_false","l2":"scenario","l3":"writing"},
    "LANG-LINGUISTICS":   {"persona":"Grammarian","h1":"Grammar Rule","h2":"Exceptions","artifact":"Syntax Tree","type":"ASCII Syntax Tree","l1":"mcq","l2":"fill_in","l3":"writing"},
    "LANG-LIT":           {"persona":"Literary Critic","h1":"Literary Device","h2":"Thematic Impact","artifact":"Textual Analysis","type":"Markdown Quote/Motif Table","l1":"mcq","l2":"fill_in","l3":"writing"},
    "ARTS-DESIGN":        {"persona":"Designer","h1":"Design Principle","h2":"Breaking the Rule","artifact":"Composition Matrix","type":"Markdown Table","l1":"mcq","l2":"scenario","l3":"writing"},
    "SKILLS-HARD":        {"persona":"Master Craftsman","h1":"Core Technique","h2":"Troubleshooting","artifact":"Execution Steps","type":"Basic Mermaid flowchart or Numbered list","l1":"fill_in","l2":"scenario","l3":"writing"},
    "SKILLS-FITNESS":     {"persona":"Kinesiologist","h1":"Biomechanics","h2":"Injury Prevention","artifact":"Movement Trace","type":"Markdown Kinematic Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "EDUCATION":          {"persona":"Teacher","h1":"Learning Theory","h2":"Knowledge Gaps","artifact":"Curriculum Flow","type":"Markdown Table","l1":"fill_in","l2":"scenario","l3":"writing"},
    "RESEARCH-METHODS":   {"persona":"Researcher","h1":"Research Method","h2":"Validity Threats","artifact":"Methodology Setup","type":"Markdown Research Matrix","l1":"mcq","l2":"scenario","l3":"writing"},
}'''
content = re.sub(r'DOMAIN_MATRIX = \{.*?\n\}', NEW_DOMAIN_MATRIX, content, flags=re.DOTALL)

# 2. Replace TheoryAgent generate & retry
NEW_THEORY_GENERATE = '''    async def generate(self, note_schema, source_text: str, primary_language: str, all_concepts: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = (
            f"You are a helpful {self.domain['persona']} tutor.\\n"
            "Write EXACTLY 2 sections. Keep language simple, direct, and conversational.\\n\\n"
            "# 1. Mental Model\\n"
            "Explain this concept to a 12-year-old using a simple, everyday situation. Do not use technical jargon. Just make it intuitively click (2-3 sentences max).\\n\\n"
            f"# 2. {self.domain['h1']}\\n"
            "Provide the formal definition of this concept in exactly 2-3 sentences. No fluff. Get straight to the point.\\n"
            f"MANDATORY: Embed 3-5 wikilinks from this list ONLY, and no other concepts: {all_concepts}\\n"
            "Format: [[Exact_Match_From_List]] (zero spaces inside brackets).\\n\\n"
            f"Concept: {title_readable}\\n"
            f"Source context: {source_text[:1500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the theory sections.")])
        return res.content.strip()'''
content = re.sub(r'    async def generate\(self, note_schema, source_text: str, primary_language: str, all_concepts: str\) -> str:.*?(?=    async def retry)', NEW_THEORY_GENERATE + "\n\n", content, flags=re.DOTALL)

NEW_THEORY_RETRY = '''    async def retry(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str) -> str:
        title_readable = note_schema.title.replace("_", " ")
        sys_prompt = (
            f"You are a helpful {self.domain['persona']} tutor.\\n"
            f"PREVIOUS ATTEMPT FAILED. FIX INSTRUCTION: {diagnosis}\\n\\n"
            "Write EXACTLY 2 sections. Keep it simple and direct.\\n\\n"
            "# 1. Mental Model\\n"
            "Explain to a 12-year-old using a simple everyday analogy.\\n\\n"
            f"# 2. {self.domain['h1']}\\n"
            "Provide the formal definition in 2-3 sentences.\\n"
            f"MANDATORY: Embed 3-5 wikilinks from this list ONLY: {all_concepts}\\n\\n"
            f"Concept: {title_readable}\\n"
            f"Source context: {source_text[:1500]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected theory sections.")])
        return res.content.strip()'''
content = re.sub(r'    async def retry\(self, note_schema, source_text: str, primary_language: str, all_concepts: str, diagnosis: str\) -> str:.*?(?=class PractitionerAgent:)', NEW_THEORY_RETRY + "\n\n", content, flags=re.DOTALL)

# 3. Replace PractitionerAgent generate & retry
NEW_PRACTICE_GENERATE = '''    async def generate(self, note_title: str, theory_body: str, primary_language: str, mode: str = "") -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = (
            f"You are a helpful {self.domain['persona']} tutor.\\n"
            "Write EXACTLY 3 sections. Keep it minimal and highly focused.\\n\\n"
            f"# 3. {self.domain['artifact']}\\n"
            f"Provide EXACTLY ONE clean, correct artifact of type: **{self.domain['type']}**.\\n"
            "If code, keep it under 20 lines. If a diagram, use standard formats or basic Mermaid (graph TD/LR). Do not invent complex syntax. Do NOT write any explanatory text below it.\\n\\n"
            "## 4. Walkthrough\\n"
            "Write 3-4 bullet points explaining exactly how the artifact works step-by-step. Use standard, recognizable examples. Do not invent complex business scenarios.\\n\\n"
            f"## 5. {self.domain['h2']}\\n"
            "Write 2-3 sentences explaining where this concept fails, common pitfalls, or edge cases to watch out for.\\n\\n"
            f"Concept: {title_readable}\\n"
            f"Theory context: {theory_body[:600]}"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the artifact, walkthrough, and pitfalls.")])
        return res.content.strip()'''
content = re.sub(r'    async def generate\(self, note_title: str, theory_body: str, primary_language: str, mode: str = ""\) -> str:.*?(?=    async def retry)', NEW_PRACTICE_GENERATE + "\n\n", content, flags=re.DOTALL)

NEW_PRACTICE_RETRY = '''    async def retry(self, note_title: str, theory_body: str, primary_language: str, diagnosis: str) -> str:
        title_readable = note_title.replace("_", " ")
        sys_prompt = (
            f"You are a helpful {self.domain['persona']} tutor.\\n"
            f"PREVIOUS ATTEMPT FAILED. FIX: {diagnosis}\\n\\n"
            "Write EXACTLY 3 sections.\\n\\n"
            f"# 3. {self.domain['artifact']}\\n"
            f"Create ONE artifact of type: **{self.domain['type']}**.\\n\\n"
            "## 4. Walkthrough\\n"
            "Write 3-4 bullet points explaining it.\\n\\n"
            f"## 5. {self.domain['h2']}\\n"
            "Write 2-3 sentences explaining pitfalls or edge cases.\\n\\n"
            f"Concept: {title_readable}\\n"
        )
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Write the corrected artifact, walkthrough, and pitfalls.")])
        return res.content.strip()'''
content = re.sub(r'    async def retry\(self, note_title: str, theory_body: str, primary_language: str, diagnosis: str\) -> str:.*?(?=class ExaminerAgent:)', NEW_PRACTICE_RETRY + "\n\n", content, flags=re.DOTALL)

# 4. Modify ExaminerAgent L3 rule logic
# We replace the complex ExaminerAgent l3 rules with simpler ones.
content = re.sub(
    r'        is_code_mode = mode_h1 in \(.*?        \)',
    r'''        is_code_mode = mode_h1 in (
            "How it Works", "System Flow", "Query Logic", "Model Mechanics", 
            "Test Strategy", "Design Pattern"
        )
        is_math_mode = mode_h1 in (
            "Formal Definition", "Discrete Definition", "Statistical Concept", 
            "Encryption Logic", "Physical Law", "Reaction Mechanism", "Circuit Logic"
        )''',
    content,
    flags=re.DOTALL
)

NEW_EXAMINER_RULES = '''        if is_math_mode:
            l3_rule = (
                "- Q3 debug: 'content' field = a FLAWED MATHEMATICAL STEP using block LaTeX — e.g., common beginner mistake. "
                "The 'answer' field names the exact error and corrects it. NEVER write 'no error is present'."
            )
        elif is_code_mode:
            db_rule = " For Database concepts, the buggy code MUST be SQL or schema logic." if mode_h1 == "Query Logic" else ""
            l3_rule = (
                "- Q3 debug: 'content' field = ONLY a very common beginner mistake/buggy code snippet. "
                "The 'answer' names the exact bug and fix. NEVER write 'no error is present'. "
                "Keep it simple and educational."
                f"{db_rule}"
            )
        elif is_writing_mode:
            l3_rule = (
                "- Q3 writing: 'question' asks the student to construct an explanation, compare two concepts, or apply the concept to a novel scenario. "
                "The 'answer' field contains a model answer (3-5 sentences)."
            )
        else:
            l3_rule = (
                "- Q3: Present a challenging scenario where the student must apply this concept to an edge case or failure condition. "
                "The 'answer' must be definitive and correct."
            )'''

content = re.sub(r'        if is_math_mode:.*?            \)', NEW_EXAMINER_RULES, content, flags=re.DOTALL)

# Write back
with open(FILE_PATH, "w") as f:
    f.write(content)
print("Updated agents.py successfully.")
