import sys
import re

def patch_file(path, patches):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in patches:
        if old not in content:
            print(f"Error: Could not find snippet in {path}\nSnippet:\n{old[:100]}")
            sys.exit(1)
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {path}")

agents_patches = [
(
r'''class PractitionerResponse(BaseModel):
    primary_equation_or_logic: str = Field(..., description="GENERATE THIS FIRST. If computational, write the exact LaTeX equation. If theoretical/code, state the core logical rule or function signature.")
    artifact: str = Field(..., description="GENERATE THIS SECOND. MUST be valid Markdown. MUST contain a fully populated Markdown table with a header row AND at least 3 rows of numerical data. Generating a header row without data rows is STRICTLY FORBIDDEN. If a table, MUST have outer pipes (e.g., | X | Y |). If code, use a markdown code block. MUST strictly use the logic defined in primary_equation_or_logic.")
    walkthrough: List[str] = Field(..., min_length=3, description="An array of EXACTLY 3-7 numbered steps. MUST execute a step-by-step breakdown using the exact data from the artifact. You MUST explicitly write out the arithmetic sub-operations. DO NOT just say 'which results in 10'. You MUST write '130 - 120 = 10'. Make the math visible. You MUST use the EXACT SAME equation and numbers generated in the Artifact table. DO NOT generate Markdown tables inside this field; if you need to reference data, use text only. Introduction of new equations is FORBIDDEN.")''',
r'''class PractitionerResponse(BaseModel):
    python_sandbox_script: str = Field(..., description="""MANDATORY FOR ALL ARTIFACTS. Write a Python script to computationally generate the artifact. The script MUST define a function `generate()` that returns a dictionary with 3 keys:
- 'equation': A string of the LaTeX equation or core logical rule.
- 'artifact': A string of the final Markdown table, Mermaid diagram, or Code block.
- 'walkthrough': A list of strings (3-7 steps) explaining the logic mathematically.
Example for math:
def generate():
    budget = 10000; dev = 6000; mkt = 3000; rem = budget - dev - mkt
    return {
        "equation": "$Remaining = Budget - Dev - Mkt$",
        "artifact": f"| Item | Cost |\\n|---|---|\\n| Budget | {budget} |\\n| Dev | {dev} |\\n| Mkt | {mkt} |\\n| Rem | {rem} |",
        "walkthrough": [f"Budget is {budget}", f"Dev is {dev}", f"Mkt is {mkt}", f"Remaining is {budget} - {dev} - {mkt} = {rem}"]
    }
""")
    primary_equation_or_logic: str = Field(..., description="Leave empty. Python script will populate this.")
    artifact: str = Field(..., description="Leave empty. Python script will populate this.")
    walkthrough: List[str] = Field(..., description="Leave empty. Python script will populate this.")'''
),
(
r'''        prac_llm = self.llm.with_structured_output(PractitionerResponse)

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
                }''',
r'''        prac_llm = self.llm.with_structured_output(PractitionerResponse)

        for attempt in range(3):
            try:
                res: PractitionerResponse = await prac_llm.ainvoke([
                    ("system", sys_prompt),
                    ("human", f"Generate the v28.0 practitioner artifact for {title_readable}.")
                ])
                
                # Execute the python sandbox script locally
                from .sandbox import execute_sandboxed_code
                success, artifact_md, payload = execute_sandboxed_code(res.python_sandbox_script)
                
                if not success:
                    raise Exception(f"Python Sandbox Execution Failed:\n{artifact_md}")
                
                eq = payload.get("equation", "")
                art = payload.get("artifact", "")
                steps = payload.get("walkthrough", [])
                
                clean_artifact = art.replace('\\n', '\n')
                clean_steps = [str(s).replace('\\n', '\n') for s in steps]

                h1_title = self.domain.get("h1", "Technical Architecture")
                artifact_title = self.domain.get("artifact", "Artifact")
                return {
                    "h1_title": h1_title,
                    "artifact_title": artifact_title,
                    "artifact_content": f"{eq}\n\n{clean_artifact}",
                    "walkthrough": "\n".join([f"{step}" if step.strip()[0].isdigit() else f"{i+1}. {step}" for i, step in enumerate(clean_steps)])
                }'''
)
]
patch_file("apps/api/src/domains/oka/agents.py", agents_patches)

sandbox_patches = [
(
r'''            if "generate_artifact" not in local_env:
                return False, "Error: Code must define a function named `generate_artifact()`.", {}
            
            # Run the function
            result = local_env["generate_artifact"]()
            
            if not isinstance(result, dict) or "markdown" not in result or "state" not in result:
                return False, "Error: `generate_artifact()` must return a dict with 'markdown' and 'state' keys.", {}
                
            return True, result["markdown"], result["state"]''',
r'''            if "generate" not in local_env:
                return False, "Error: Code must define a function named `generate()`.", {}
            
            # Run the function
            result = local_env["generate"]()
            
            if not isinstance(result, dict) or "artifact" not in result or "walkthrough" not in result:
                return False, "Error: `generate()` must return a dict with 'equation', 'artifact', and 'walkthrough' keys.", {}
                
            return True, result["artifact"], result'''
)
]
patch_file("apps/api/src/domains/oka/sandbox.py", sandbox_patches)

healer_patches = [
(
r'''        # Aggressive patterns for LLM conversational sludge
        patterns = [
            r"(?i)(?:Sure|Certainly|Here is|Great choice|Okay|As an?|Absolutely|I understand),?.*?(?:explaining|overview|analysis|help|note|here is).*?[:\.]\s*",
            r"(?i)(?:In this section|This note|The following).*?[:\.]\s*",
            r"(?i)(?:Note|Tip|Hint|Important|Pro Tip):\s*",
            r"(?i)Hope this (?:helps|is useful|clarifies).*?\.?$",
            r"(?i)(?:If you have|Feel free to).*?\.?$",
            r"(?i)(?:Analysis|Explanation|Walkthrough|Summary):\s*",
            r"(?i)(?:Here's a|I have created).*?\.?$",
            r"(?i)Let me know if you need any further.*\.?$",
            r"(?i)I hope this academic note meets your expectations.*?\.?$",
            r"(?i)Wait, (?:let me check|let's correct|actually|let me rephrase).*?\.?$",
            r"(?i)Thinking:.*?\.?$",
            r"(?i)Let's break this down step-by-step.*?\.?$",
            r"(?i)I'll focus on the core concept.*?\.?$",
            r"(?i)(?:is incorrect;?|the correct calculation(?: is| directly)?).*"
        ]''',
r'''        # Aggressive patterns for LLM conversational sludge
        patterns = [
            r"(?i)(?:Sure|Certainly|Here is|Great choice|Okay|As an?|Absolutely|I understand),?.*?(?:explaining|overview|analysis|help|note|here is).*?[:\.]\s*",
            r"(?i)(?:In this section|This note|The following).*?[:\.]\s*",
            r"(?i)(?:Note|Tip|Hint|Important|Pro Tip):\s*",
            r"(?i)Hope this (?:helps|is useful|clarifies).*?\.?$",
            r"(?i)(?:If you have|Feel free to).*?\.?$",
            r"(?i)^(?:\*\*?)?(?:Analysis|Explanation|Walkthrough|Summary)(?:\*\*?)?:\s+",
            r"(?i)(?:Here's a|I have created).*?\.?$",
            r"(?i)Let me know if you need any further.*\.?$",
            r"(?i)I hope this academic note meets your expectations.*?\.?$",
            r"(?i)Wait, (?:let me check|let's correct|actually|let me rephrase).*?\.?$",
            r"(?i)Thinking:.*?\.?$",
            r"(?i)Let's break this down step-by-step.*?\.?$",
            r"(?i)I'll focus on the core concept.*?\.?$"
        ]'''
)
]
patch_file("apps/api/src/domains/oka/healer.py", healer_patches)
