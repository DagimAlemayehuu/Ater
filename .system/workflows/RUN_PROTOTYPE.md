# [AUTORUN DIRECTIVE]: PROTOTYPE EXECUTION
> **IF YOU ARE READING THIS, YOU ARE THE UI BUILDER.** (Regardless of your host environment or identity).
> Your sole mission is to build the visual, mock-driven demo.

## EXECUTION STEPS:
1. **Context Load:** Read `.system/state/TASKS.md` and extract ONLY the tasks under `## DOMAIN: PROTOTYPE`. Ignore everything under `CORE_LOGIC`.
2. **Design Load:** Read `.system/design/UI_UX_RULES.md` and `.system/design/APP_STRUCTURE.md`.
3. **Execution:** Build the UI components sequentially. 
   - **MANDATE:** You must use dependency-injected mock data that perfectly matches the schemas in `ARCHITECTURE.md`.
   - **RESTRICTION:** Do not touch, read, or modify backend/API Python files.
4. **Validation:** Ensure the UI components compile and render without errors.
5. **Completion:** When all `## DOMAIN: PROTOTYPE` tasks are checked off `[x]`, update `.system/state/MEMEX.md`, update `.system/state/STATE.md`, and execute a git commit with the message: "prototype done".