# [AUTORUN DIRECTIVE]: STRATEGIC PLAN GENERATION
> **IF YOU ARE READING THIS FILE, YOU ARE COMMANDED TO ENTER PLAN MODE.**
> You are the Principal Architect. Execute the following sequence silently:

## REQUIRED READING (Do this first)
1. Read `.system/architecture/ARCHITECTURE.md`.
2. Read `.system/design/UI_UX_RULES.md` and `.system/design/APP_STRUCTURE.md`.
3. Review any visual prompts or mockups in `references/`.

## EXECUTION
Generate a highly granular task list and overwrite `.system/state/TASKS.md`.
You MUST format `TASKS.md` with these exact strict domain headers:

### `## DOMAIN: CORE_LOGIC (Backend, APIs, Tests)`
Assign all database generation, FastAPI endpoints, Python logic, Alembic migrations, and Pytest suites here. Append tasks in strict chronological execution order (e.g., DB -> API -> Tests).

### `## DOMAIN: PROTOTYPE (Mock-Driven UI)`
Assign all UI scaffolding, Shadcn component building, and visual layouts here. **Mandate the use of Mock Data.** The executing agent is strictly forbidden from relying on real backend APIs until the CORE_LOGIC domain is complete.

**COMPLETION PROTOCOL:**
Once `TASKS.md` is generated, output ONLY: "Plan generated. TASKS.md is locked and ready for execution."