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

# SERVICE.PY PATCHES
service_patches = [
(
r'''                                prac_parts = await practitioner_agent.generate_micro(
                                    note_schema.title,
                                    note_data["technical_definition"],
                                    primary_language,
                                    note_schema.mode,
                                    note_schema.source_context or "No context",
                                    academic_level=plan_obj.academic_level,
                                    course_title=plan_obj.course_title,
                                    max_tokens=8000,
                                    mental_model=note_data.get("mental_model", "")
                                )''',
r'''                                prac_parts = await practitioner_agent.generate_micro(
                                    note_schema.title,
                                    note_data["technical_definition"],
                                    primary_language,
                                    note_schema.mode,
                                    "",
                                    academic_level=plan_obj.academic_level,
                                    course_title=plan_obj.course_title,
                                    max_tokens=8000,
                                    mental_model=note_data.get("mental_model", "")
                                )'''
),
(
r'''                                valid_qs = await q_agent.generate(
                                    note_schema.title,
                                    note_data["technical_definition"],
                                    mode=note_schema.mode,
                                    academic_level=plan_obj.academic_level,
                                    course_title=plan_obj.course_title,
                                    modality=modality
                                )''',
r'''                                q_context = f"THEORY:\n{note_data.get('technical_definition', '')}\n\nARTIFACT:\n{prac_parts.get('artifact_content', '')}\n\nWALKTHROUGH:\n{prac_parts.get('walkthrough', '')}"
                                valid_qs = await q_agent.generate(
                                    note_schema.title,
                                    q_context,
                                    mode=note_schema.mode,
                                    academic_level=plan_obj.academic_level,
                                    course_title=plan_obj.course_title,
                                    modality=modality
                                )'''
)
]
patch_file("apps/api/src/domains/oka/service.py", service_patches)

# AGENTS.PY PATCHES
agents_patches = [
(
r'''CONCEPT: {title_readable}
PREVIOUS CONTEXT (MENTAL MODEL): {mental_model}

CORE LAWS:''',
r'''CONCEPT: {title_readable}
PREVIOUS CONTEXT (MENTAL MODEL): {mental_model}
TECHNICAL THEORY: {theory_body}

CORE LAWS:'''
),
(
r'''10. Walkthrough Content Law: The `walkthrough` steps MUST NOT contain markdown headings (e.g. no `## Step 1`). They should be plain text descriptions of the calculation or logic.''',
r'''10. Walkthrough Content Law: The `walkthrough` steps MUST NOT contain markdown headings (e.g. no `## Step 1`). They MUST be analytical and explicitly explain the "Why" and "How" of the calculation or logic (e.g. explain why opportunity cost is increasing). DO NOT just blindly narrate table rows.'''
),
(
r'''14. Syntax Enforcement Law: YOU MUST use `[[blank]]` for 'fill_in' questions. DO NOT use the word "Blank", "___", or any other placeholder. If you fail this, the interface will break.''',
r'''14. Syntax Enforcement Law: YOU MUST use exactly `[[blank]]` for 'fill_in' questions. DO NOT use the word "Blank", "___", or any other placeholder.
15. No Chain of Thought: The 'explanation' field MUST contain only the final, polished pedagogical explanation. You MUST NOT include internal scratchpad thoughts, self-corrections (e.g. "Wait, the correct calculation is..."), or conversational sludge.'''
)
]
patch_file("apps/api/src/domains/oka/agents.py", agents_patches)
