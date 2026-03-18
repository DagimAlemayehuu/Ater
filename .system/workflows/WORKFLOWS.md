# AUTONOMOUS AGENT WORKFLOWS: RUNBOOK-DRIVEN ARCHITECTURE

This document defines the Master Operational Manual for the Autonomous Software Factory.
This system operates on **Runbook-Driven Development**. You do not prompt the AI with paragraphs of text. You simply instruct the AI to **read** the appropriate markdown file. The files contain `[AUTORUN DIRECTIVES]` that instantly hijack the agent's intent, load the correct context, and force execution.

---

## 1. THE LIFECYCLE (End-to-End Execution)

The process of taking an idea from abstract thought to a deployed, secure application.

### Phase 1: Ideation (Human + Gem)
*   **Action:** You speak to your external Architect Gem.
*   **Goal:** Answer the 5-Dimension Drill.
*   **Output:** Paste the generated specification into `.system/prompts/prompt.md`.

### Phase 2: Initialization & Scaffolding
*   **Prompt:** *"Read `.system/workflows/INITIALIZATION.md`."*
*   **What Happens:** The agent reads the directive, automatically prunes unnecessary directories based on the Tier, builds the base file structure, and generates the master `.system/architecture/ARCHITECTURE.md`.

### Phase 3: Visual Design Synthesis (Human + Gem)
*   **Action:** You paste `prompt.md`, `ARCHITECTURE.md`, and `CONSTITUTION.md` into your UI/UX Gem.
*   **Output:** Save the outputs to `.system/design/UI_UX_RULES.md`, `.system/design/APP_STRUCTURE.md`, and put any generated screenshots into the `references/` folder.

### Phase 4: Tactical Planning
*   **Prompt:** *"Read `.system/workflows/PLANNING.md`."*
*   **What Happens:** The agent overwrites `.system/state/TASKS.md`, explicitly separating the project into two domains: `## DOMAIN: CORE_LOGIC` (Backend) and `## DOMAIN: PROTOTYPE` (Mock-driven UI).

### Phase 5: The UI Prototype
*   **Prompt:** *"Read `.system/workflows/RUN_PROTOTYPE.md`."*
*   **What Happens:** The agent builds a fully functional, visually complete UI app using mocked data. It ignores backend files.

### Phase 6: The Heavy Lift (Backend)
*   **Prompt:** *"Read `.system/workflows/RUN_CORE_LOGIC.md`."*
*   **What Happens:** The agent builds the Pydantic models, Alembic migrations, FastAPI endpoints, and Pytest suites based strictly on the Architecture contract.

### Phase 7: The Integration
*   **Prompt:** *"Read `.system/workflows/RUN_INTEGRATION.md`."*
*   **What Happens:** The agent syncs the backend OpenAPI schemas to the frontend, deletes the mock data, and wires the UI components directly to the real API endpoints.

### Phase 8: Security & Handover
*   **Prompt:** *"Read `.system/workflows/HANDOVER.md`."*
*   **What Happens:** The agent scans for exposed `.env` secrets, verifies type-safety, checks database security, and generates an `ADMIN_MANUAL.md`.

---

## 2. SYSTEM MAINTENANCE & RESUMPTION

How to context-load an agent instantly or optimize the system's brain.

### The Resumption Protocol (Waking Up)
If you switch tools (e.g., moving from CLI to Jules) or return to an unfinished project after a few days:
*   **Your Prompt:** *"Read `.system/workflows/RESUME.md`."*
*   **What Happens:** The agent reads the boot sequence, checks `MEMEX.md` and `TASKS.md`, and outputs the exact next pending task. You then point it to the relevant execution runbook.

### The Compression Protocol (Token Optimization)
If the project has been running for weeks and the agents are slowing down due to massive context windows:
*   **Your Prompt:** *"Read `.system/workflows/COMPRESS_MEMORY.md`."*
*   **What Happens:** The agent archives completed tasks into `TASKS_ARCHIVED.md` and distills older `MEMEX.md` entries into a single paragraph, restoring speed and efficiency.

---

## 3. THE RUNBOOKS (Core Directives)

The `.system/workflows/` directory contains the executable runbooks. **Do not modify the `[AUTORUN DIRECTIVE]` headers within them, as they are the keys to the zero-prompt system.**

*   `INITIALIZATION.md`: Sets up the repo and Architecture.
*   `PLANNING.md`: Generates the Domain-split `TASKS.md`.
*   `RUN_PROTOTYPE.md`: Executes the UI domain using mocks.
*   `RUN_CORE_LOGIC.md`: Executes the backend API/Database domain.
*   `RUN_INTEGRATION.md`: Replaces mock data with real API calls.
*   `HANDOVER.md`: Security audit and final documentation.
*   `RESUME.md`: The universal boot-sequence for loading project state.
*   `COMPRESS_MEMORY.md`: Prunes logs and tasks to save tokens.