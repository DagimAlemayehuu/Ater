import re
plan_text = """
## Batching Strategy
- **Total Notes:** 2
- **Total Batches:** 1
- **Batch 1:** [[Hub]], [[Concept_A]], [[Concept_B]]
- **Batch 2:** [[Concept_C]], [[Concept_D]]

# Knowledge Asset Summary
"""
batch_sections = re.findall(
    r"(?:\- )?\*\*Batch\s+(\d+)\s*(?:\([^)]*\))?\s*\**\s*:?\s*\**:?\s*(.*?)(?=(?:\- )?\*\*Batch|\#\s|Knowledge Asset Summary|$)",
    plan_text,
    re.S | re.I,
)
print("My regex:", batch_sections)

batch_sections_orig = re.findall(
    r"\*\*Batch\s+(\d+)\s*(?:\([^)]*\))?\s*\**\s*:?\s*\**:?\s*(.*?)(?=\*\*Batch|\#\s|Knowledge Asset Summary|$)",
    plan_text,
    re.S | re.I,
)
print("Orig regex:", batch_sections_orig)
