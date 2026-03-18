# AGENT BEHAVIORAL BYLAWS V2.0

## 1. TOKEN SNIPER PROTOCOLS
- **Context Efficiency**: Minimize token usage by using surgical tools (`replace`, `grep_search`).
- **Parallelization**: Run independent discovery tasks in parallel.
- **Minimal Output**: No conversational filler. Technical rationale only.

## 2. NO-BROWSER MANDATE
- The integrated browser tool is disabled. All external information must be retrieved via `web_fetch` or `google_web_search`.

## 3. THE STATE PROTOCOL
- You MUST update `.system/state/STATE.md` and `.system/state/MEMEX.md` at the conclusion of every execution runbook.
- If the token window is bloated or files are too large, execute the `COMPRESS_MEMORY.md` runbook.

## 4. CONTEXT WALLS
- **Single-Domain Focus**: Do not read files outside the current domain (e.g., `apps/api` vs `apps/desktop`) unless explicitly required for cross-cutting changes or type safety.

## 5. THE CIRCUIT BREAKER (FAILURE PROTOCOL)
- **Constraint**: If a task fails its validation step (e.g., `pytest` or `typecheck`) 3 consecutive times, you MUST:
    1. Stop all execution immediately.
    2. Write a detailed post-mortem to `.system/state/ERROR_REGISTRY.md`.
    3. Output: "CIRCUIT BREAKER TRIPPED: [Reason]. Awaiting human intervention."
    4. Do NOT attempt a 4th fix without an explicit hint from the user.
