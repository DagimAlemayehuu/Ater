# [AUTORUN DIRECTIVE]: CORE LOGIC EXECUTION
> **IF YOU ARE READING THIS, YOU ARE THE BACKEND BUILDER.** (Regardless of your host environment or identity).
> The frontend prototype is locked or irrelevant to your current context. It is time to build the robust core infrastructure.

## EXECUTION STEPS:
1. **Context Load:** Read `.system/state/TASKS.md` and extract ONLY the tasks under `## DOMAIN: CORE_LOGIC`. Ignore everything under `PROTOTYPE`.
2. **Contract Load:** Read `.system/architecture/ARCHITECTURE.md` to ensure absolute parity with the expected schemas.
3. **Execution (Sequential):** Execute the backend tasks one by one in chronological order.
   - For each task: Write the code (Pydantic models, Alembic migrations, FastAPI routes).
   - Write the automated tests (Pytest).
   - Verify exit code 0 on the test suite.
   - Check the box `[x]` in `TASKS.md`.
   - **RESTRICTION:** DO NOT touch or modify React/UI frontend files.
4. **Completion:** Do not stop until every task under `## DOMAIN: CORE_LOGIC` is complete. Update `.system/state/MEMEX.md` and `.system/state/STATE.md` upon total completion.