# [AUTORUN DIRECTIVE]: MEMORY COMPRESSION & OPTIMIZATION
> **IF YOU ARE READING THIS, THE SYSTEM'S CONTEXT WINDOW IS BLOATED.**
> Your task is to prune the AI's long-term memory to restore token efficiency and prevent agent confusion.

## EXECUTION STEPS:
1. **Archive Tasks:** Read `.system/state/TASKS.md`. Move all `[x]` completed tasks into `.system/state/TASKS_ARCHIVED.md`. Leave ONLY the unchecked `[ ]` tasks and the main Domain headers in `TASKS.md`.
2. **Distill Memex:** Read `.system/state/MEMEX.md`. Summarize all entries older than 3 days into a single, high-level "Historical Context" paragraph at the top of the file. Preserve the granular chronological logs ONLY for the last 72 hours.
3. **Completion:** Save all modified files. Output exactly: "Memory compressed. Token efficiency restored."