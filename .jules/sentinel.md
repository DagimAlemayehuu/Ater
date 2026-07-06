## 2026-07-06 - [ast.literal_eval DoS vector]
**Vulnerability:** Evaluated untrusted LLM-generated JSON fallback using `ast.literal_eval` in `apps/api/src/domains/ater/validator.py`.
**Learning:** Even though `ast.literal_eval` is safer than `eval()`, it is still highly dangerous for parsing external/LLM input. Deeply nested structures can exceed the CPython compiler's stack depth and crash the entire application process, leading to a Denial of Service (DoS) condition.
**Prevention:** Never use `ast.literal_eval` to parse untrusted JSON. Always rely on standard `json.loads()` combined with custom, safe plain-text parsing fallbacks when dealing with LLM outputs.
