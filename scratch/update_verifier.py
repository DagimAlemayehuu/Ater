import re

FILE_PATH = "apps/api/src/domains/oka/agents.py"

with open(FILE_PATH, "r") as f:
    content = f.read()

OLD_VERIFIER_SYS_PROMPT = """        sys_prompt = (
            "You are a rigorous academic quality auditor. Evaluate this atomic study note.\\n"
            "Return ONLY a valid JSON object — no markdown fences, no commentary.\\n\\n"
            "Check ALL 5 criteria and report true/false for each:\\n"
            f"1. domain_lock: Does section 4 (artifact) use the correct technical framework for mode='{mode}'? "
            "(MATH-PURE/MATH-DISCRETE must use discrete integer sequences, NEVER ODEs/integrals/dy/dx. CS must use code. ENG must use engineering notation.)\\n"
            "2. quiz_topicality: Do ALL 3 quiz questions specifically test the concept named in the note title? "
            "(Must not test the mental model analogy, must not be generic algebra unrelated to the concept.)\\n"
            "3. debug_validity: If a debug or flawed-step question exists, does 'content' ACTUALLY contain an error? "
            "('No error is present' as the answer = FAIL. Content must be demonstrably wrong.)\\n"
            "4. arithmetic_correct: Are ALL equations and computations in sections 4 and 5 arithmetically correct? "
            "(Check every = sign. A single wrong calculation = FAIL.)\\n"
            "5. mental_model_maps: Does the mental model in section 1 map at least 2 structural components "
            "of the concept to 2 components of the analogy (not just assert 'X is like Y')?\\n\\n"
            "Output format — use EXACTLY this structure:\\n"
            "{\\"domain_lock\\":true,\\"quiz_topicality\\":true,\\"debug_validity\\":true,"
            "\\"arithmetic_correct\\":true,\\"mental_model_maps\\":true,"
            "\\"failures\\":[{\\"check\\":\\"domain_lock\\",\\"issue\\":\\"exact description\\",\\"fix_instruction\\":\\"exact fix\\"}]}\\n\\n"
            "failures is an empty array [] if all checks pass.\\n"
            f"Source context (what the note should teach): {source_context[:400]}"
        )"""

NEW_VERIFIER_SYS_PROMPT = """        sys_prompt = (
            "You are a rigorous academic quality auditor. Evaluate this atomic study note.\\n"
            "Return ONLY a valid JSON object — no markdown fences, no commentary.\\n\\n"
            "Check ALL 5 criteria and report true/false for each:\\n"
            f"1. domain_lock: Does section 3 (artifact) use the correct technical framework for mode='{mode}'? "
            "(MATH-PURE/MATH-DISCRETE must use discrete integer sequences, NEVER ODEs/integrals/dy/dx. CS must use code. ENG must use engineering notation.)\\n"
            "2. quiz_topicality: Do ALL 3 quiz questions specifically test the concept named in the note title? "
            "(Must not test the mental model analogy, must not be generic algebra unrelated to the concept.)\\n"
            "3. debug_validity: If a debug or flawed-step question exists, does 'content' ACTUALLY contain an error? "
            "('No error is present' as the answer = FAIL. Content must be demonstrably wrong.)\\n"
            "4. arithmetic_correct: Are ALL equations and computations in sections 3 and 4 arithmetically correct? "
            "(Check every = sign. A single wrong calculation = FAIL.)\\n"
            "5. mental_model_maps: Is the mental model in section 1 simple enough for a 12-year-old, avoiding dense technical jargon?\\n\\n"
            "Output format — use EXACTLY this structure:\\n"
            "{\\"domain_lock\\":true,\\"quiz_topicality\\":true,\\"debug_validity\\":true,"
            "\\"arithmetic_correct\\":true,\\"mental_model_maps\\":true,"
            "\\"failures\\":[{\\"check\\":\\"domain_lock\\",\\"issue\\":\\"exact description\\",\\"fix_instruction\\":\\"exact fix\\"}]}\\n\\n"
            "failures is an empty array [] if all checks pass.\\n"
            f"Source context (what the note should teach): {source_context[:400]}"
        )"""

content = content.replace(OLD_VERIFIER_SYS_PROMPT, NEW_VERIFIER_SYS_PROMPT)

with open(FILE_PATH, "w") as f:
    f.write(content)
print("Verifier updated!")
