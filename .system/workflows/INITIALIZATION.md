# [WORKFLOW]: INITIALIZATION & ARCHITECTURE
> **ATTENTION ARCHITECT AGENT:** This runbook dictates how to initialize a new project from user requirements. You are the CEO. You must define every single thing and how everything works so the builders construct the software flawlessly.

## PHASE 1: SCOPING & ARCHITECTURE
1.  Read `.system/prompts/prompt.md` (The user's initial idea).
2.  Analyze the prompt for critical ambiguities that would completely break the system design. **DO NOT ask redundant questions.** Only ask questions that are absolute "show-stoppers" for architecture.
3.  Say exactly: *"I have analyzed your requirements. I am now writing the Architecture Blueprint."*
4.  Remove unnecessary features and consolidate the requirements into the technical blueprint at `.system/architecture/architecture.md`.

## PHASE 2: THE "API-FIRST" SCHEMA GENERATION (CRITICAL)
> **The multi-agent system will crash if you do not define strict compiler-enforced API contracts here.**
1.  **Generate Database Schema:** Create a strict schema file inside `packages/database-orm` (e.g., `schema.prisma` or `models.py`). This must contain all tables, columns, and relations.
2.  **Generate API Contracts:** Create a strict shared type definition file in `packages/schemas` (e.g., `packages/schemas/api_contracts.ts` containing Zod schemas or TypeScript Interfaces). These interfaces define the *exact* JSON request and response payloads for every single API endpoint in the system.
3.  **Ensure Pre-Commit Hooks are Wired:** Check the root `package.json`. It MUST have `"prepare": "husky"` inside the `"scripts"` block. If it doesn't, add it.
4.  Say exactly: *"I have generated the strict Database Schemas and API Contracts in `packages/schemas` to enforce compatibility across the frontend and backend."*

## PHASE 3: DESIGN SYNCHRONIZATION
1.  Say exactly: *"Architecture complete. Please use your Gemini Gem to generate `.system/design/design_rules.md` and `.system/design/app_structure.md`, and drop any UI reference images into `references/`. Tell me when you are ready to proceed."*
2.  Wait for the user's confirmation.

## PHASE 4: TASK DELEGATION
1.  Read the completed `.system/architecture/architecture.md` and the newly added `.system/design/` files.
2.  Generate `.system/state/GLOBAL_TASKS.md`. You must break the project down into Epics and place them under the specific Agent Persona's "Pending Epics" section (e.g., `[Backend Agent]`, `[Database Agent]`).
3.  Say exactly: *"Initialization is complete. All global tasks are assigned. Do you want me to execute the Solo Builder approach or the Multi-Agent Team approach? Please provide your choice and your GitHub repository link."*
