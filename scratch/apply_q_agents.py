import re

FILE_PATH_SCHEMAS = "apps/api/src/domains/oka/schemas.py"

with open(FILE_PATH_SCHEMAS, "r") as f:
    content = f.read()

# Add required_keywords to DebugQuestion
if "required_keywords" not in content:
    content = content.replace(
        "    answer: str",
        "    answer: str\n    required_keywords: List[str] = Field(default_factory=list)"
    )

with open(FILE_PATH_SCHEMAS, "w") as f:
    f.write(content)

FILE_PATH_AGENTS = "apps/api/src/domains/oka/agents.py"
with open(FILE_PATH_AGENTS, "r") as f:
    agents_content = f.read()

# Replace ExaminerAgent with QuestionAgent
pattern = r"class ExaminerAgent:.*?(?=class CriticAgent:)"
NEW_AGENT = '''class QuestionAgent:
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

    async def generate(self, note_title: str, context: str, difficulty: str = "L1") -> dict:
        title_readable = note_title.replace("_", " ")
        
        prompts = {
            "mcq": "Find a highly technical fact. Generate 1 correct answer and 3 highly plausible distractors. The explanation must define *why* the distractors are wrong and *why* the answer is correct.",
            "true_false": "Generate a definitive True/False statement about a core mechanism. The explanation must prove why.",
            "fill_in": "Take a core definitional sentence. Remove the absolute most critical technical term and replace it with `[[blank]]`. Every [[blank]] must represent EXACTLY ONE WORD. Do not blank out common English words.",
            "writing": "Ask the user to explain a concept or mechanism deeply. The answer must be a model 3-5 sentence response.",
            "matching": "Extract exactly 4 technical terms and their definitions. Shuffle them. Output the correct pairs.",
            "order": "Identify a chronological process, algorithm step, or lifecycle. Break it into 4-5 distinct steps. Output the randomized steps and the correct order.",
            "debug": "Act as a Senior Code Reviewer. Provide a short, buggy code snippet, SQL query, or math formula with ONE common beginner mistake. Ask the user to find it. The 'required_keywords' MUST contain exactly the string syntax needed to fix it (e.g., ['=='] or ['GROUP BY']).",
            "trace": "Provide a perfectly valid code snippet or math formula. Ask the user 'What is the exact output of this execution?'.",
            "synthesis": "Invent a complex real-world edge-case scenario combining multiple concepts to solve a problem. The answer should be a grading rubric."
        }
        
        schemas = {
            "mcq": '{"id":"q1","type":"mcq","difficulty":"' + difficulty + '","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"B","explanation":"..."}',
            "true_false": '{"id":"q1","type":"true_false","difficulty":"' + difficulty + '","question":"...","answer":false,"explanation":"..."}',
            "fill_in": '{"id":"q1","type":"fill_in","difficulty":"' + difficulty + '","question":"Fill in the blank.","textWithBlanks":"The [[blank]] is...","answer":["exactword"],"explanation":"..."}',
            "writing": '{"id":"q1","type":"writing","difficulty":"' + difficulty + '","question":"Explain...","answer":"...","explanation":"..."}',
            "matching": '{"id":"q1","type":"matching","difficulty":"' + difficulty + '","question":"Match terms.","pairs":[{"left":"...","right":"..."}]}',
            "order": '{"id":"q1","type":"order","difficulty":"' + difficulty + '","question":"Order steps.","steps":["step2","step3","step1"],"answer":["step1","step2","step3"]}',
            "debug": '{"id":"q1","type":"debug","difficulty":"' + difficulty + '","question":"Find the bug.","content":"...","answer":"...","required_keywords":["fix_syntax"],"explanation":"..."}',
            "trace": '{"id":"q1","type":"trace","difficulty":"' + difficulty + '","question":"What is the exact output?","content":"...","answer":"...","explanation":"..."}',
            "synthesis": '{"id":"q1","type":"synthesis","difficulty":"' + difficulty + '","question":"Complex scenario...","answer":"...","explanation":"..."}'
        }
        
        prompt_logic = prompts.get(self.canonical_type, prompts["writing"])
        json_schema = schemas.get(self.canonical_type, schemas["writing"])
        
        sys_prompt = f"""You are the Dedicated '{self.canonical_type.upper()}' Question Agent.
{prompt_logic}

MANDATORY SCHEMA:
{json_schema}

STRICT RULES:
1. Output ONLY a valid JSON object matching the schema exactly. No markdown fences. No preamble.
2. The 'answer' field is MANDATORY. Do not omit it.
3. For 'explanation', explain the underlying mechanism deeply.
4. EXCLUSIVELY use the provided Context. Do not hallucinate outside features.

Concept: {title_readable}
Context: {context[:3000]}
"""
        res = await self.llm.ainvoke([("system", sys_prompt), ("human", "Output the JSON object.")])
        content = res.content.strip()
        import json
        content = re.sub(r"^```[a-z]*\\n?", "", content)
        content = re.sub(r"\\n?```$", "", content).strip()
        try:
            q_data = json.loads(content)
            q_data["type"] = self.canonical_type
            q_data["difficulty"] = difficulty
            return q_data
        except Exception as e:
            print(f"[QuestionAgent] Parse failed for {self.canonical_type}: {e} -> Raw: {content[:100]}")
            return {"id": "q1", "type": self.canonical_type, "difficulty": difficulty, "question": "Error generating question.", "answer": "N/A"}

'''

agents_content = re.sub(pattern, NEW_AGENT, agents_content, flags=re.DOTALL)

with open(FILE_PATH_AGENTS, "w") as f:
    f.write(agents_content)

print("Updated schemas and agents.")
