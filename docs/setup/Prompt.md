# EXECUTIVE BLUEPRINT: LIFE OS (PERSONAL AGI DASHBOARD)
**Document Status:** Immutable Project Specification
**Target Architecture:** Tier 3 (Tauri v2 + React + FastAPI Sidecar)

## 1. SYSTEM OVERVIEW & CORE PHILOSOPHY
This application is a localized Personal Life Operating System disguised as a professional admin dashboard (inspired heavily by the `satnaing/shadcn-admin` template). It acts as a central mentor, manager, and assistant.
*   **Zero Hardcoded State:** The app must be 100% portable. All API keys and paths are user-configured at runtime.
*   **The Trinity Architecture:** 
    1.  **Notion API (The Database):** Source of truth for structured data (Goals, Projects, Tasks, Time Blocks, MV/MEV/MRV tracking).
    2.  **Obsidian Vault (The Memory):** Source of truth for unstructured data (Markdown daily journals, deep-dive notes). Local file system only.
    3.  **Google Gemini 1.5 API (The Brain):** The reasoning engine, executed strictly via the Python backend.

## 2. COMPONENT ARCHITECTURE & SECURE DATA FLOW
To maintain strict security and production-readiness, data flows exactly like this:
1.  **Storage:** `tauri-plugin-store` saves the user's `NOTION_API_KEY`, `GEMINI_API_KEY`, and `OBSIDIAN_VAULT_PATH` locally on their OS.
2.  **Transport:** The React frontend reads these keys from the local store. When calling the Python sidecar, the frontend injects these keys into the HTTP headers (e.g., `X-Notion-Key`, `X-Gemini-Key`, `X-Vault-Path`).
3.  **Execution:** The Python sidecar extracts the headers, executes the heavy business logic (fetching Notion data, reading local `.md` files, querying Gemini), and returns a structured Pydantic/JSON response.

## 3. FRONTEND DIRECTIVES (apps/desktop)
*   **Stack:** Vite, React, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query (React Query), Lucide Icons.
*   **Aesthetic:** Professional, data-dense, dark-mode optimized, identical in spirit to `shadcn-admin`.
*   **Layout Structure:**
    *   **Sidebar:** Permanent left navigation.
    *   **Topbar:** Breadcrumbs, Theme Toggle, User Avatar/Status.
    *   **Main Content Area:** Renders the active route.
*   **Required Routes & Views:**
    1.  `/onboarding`: A mandatory full-screen gate. If the Tauri store lacks API keys/paths, force the user here to input them.
    2.  `/dashboard`: The macro view. Shows "Consistency Score", "Burnout Risk", a bar chart of "Energy Allocation" (Time Blocks vs. Tasks), and "Today's Active Focus".
    3.  `/strategist`: The Morning Briefing view. Displays AI-generated analysis of yesterday's Obsidian journal vs today's Notion tasks.
    4.  `/debugger`: A chat/terminal interface. The user inputs a problem; the system uses RAG over the Obsidian vault to provide context-aware solutions.
    5.  `/profiles`: Forms/Textareas to edit "User Profiles" (e.g., "Personal Strengths/Weaknesses", "Financial Baselines"). Saved to Tauri store.
    6.  `/settings`: Manage API keys, Vault Path, and App Preferences.

## 4. BACKEND DIRECTIVES (apps/api - Python FastAPI Sidecar)
*   **Stack:** Python 3.12+, FastAPI, Uvicorn, `google-generativeai`, `httpx` (for Notion), `pydantic`.
*   **Sidecar Lifecycle:** The FastAPI server must be bundled and spawned automatically by Tauri. It should run on a dynamic or fixed port (e.g., 8000), and shut down cleanly when Tauri closes.
*   **API Contracts (Strict Requirements):**
    *   `GET /api/health`: Returns `{ status: "ok" }`. Frontend polls this before loading the main UI.
    *   `POST /api/strategist/briefing`:
        *   *Headers:* `X-Notion-Key`, `X-Gemini-Key`, `X-Vault-Path`
        *   *Body:* `{"user_profiles": "...", "current_date": "..."}`
        *   *Logic:* Read Obsidian journal for `current_date - 1`. Fetch incomplete tasks from Notion. Construct system prompt using "The Strategist" persona. Call Gemini.
        *   *Returns:* `{"briefing_text": "...", "suggested_task_updates": [...], "burnout_risk_score": 1-100}`
    *   `POST /api/debugger/query`:
        *   *Headers:* `X-Gemini-Key`, `X-Vault-Path`
        *   *Body:* `{"query": "...", "user_profiles": "..."}`
        *   *Logic:* Scan Obsidian directory for `.md` files relevant to the query. Construct prompt using "The Debugger" persona. Call Gemini.
        *   *Returns:* `{"diagnosis": "...", "root_causes": [...], "actionable_steps": [...]}`
    *   `POST /api/notion/sync`:
        *   *Headers:* `X-Notion-Key`
        *   *Body:* `{"action": "update_tasks", "payload": [...]}`
        *   *Logic:* Wrapper to safely execute CRUD against Notion databases.

## 5. SEQUENTIAL EXECUTION PLAN (PHASES 3.1 - 3.6)
**CRITICAL:** You must complete these phases sequentially. Do not move to the next phase until the current one compiles, typechecks (`pnpm typecheck`), and lints cleanly. Update `.tracking/project_state.md` after EVERY phase.

### Phase 3.1: The Core Infrastructure & Sidecar Wiring
1.  Initialize the Vite/React app in `apps/desktop`.
2.  Initialize the FastAPI app in `apps/api/src/api/main.py`.
3.  Configure `tauri.conf.json` to register the Python app as a `sidecar` or configure a robust concurrent startup script in `package.json` for development.
4.  Implement `GET /api/health`.
5.  **Verification:** React app must successfully fetch `/api/health` on load and log "Sidecar Connected".

### Phase 3.2: Storage, State, and Onboarding
1.  Install `@tauri-apps/plugin-store` and configure it in Rust and React.
2.  Build the `/onboarding` layout and `/settings` page.
3.  Implement React Context or Zustand to manage global state (API Keys, Vault Path).
4.  Implement a boot-check: If keys are missing, route to `/onboarding`.
5.  **Verification:** User can input keys, save them to local storage, and restart the app without losing them.

### Phase 3.3: The Shadcn UI Shell
1.  Initialize Tailwind and Shadcn CLI in `apps/desktop`.
2.  Install required components: `button, input, textarea, card, dialog, toast, scroll-area, avatar, separator, sidebar`.
3.  Build the persistent Layout (Sidebar, Topbar).
4.  Scaffold empty placeholder pages for `/dashboard`, `/strategist`, `/debugger`, and `/profiles`.
5.  **Verification:** The app looks like a professional admin dashboard and routes function correctly.

### Phase 3.4: Data Connectors (Python Layer)
1.  Create `apps/api/src/core/notion_client.py`: Implement wrapper using `httpx` to fetch and update databases.
2.  Create `apps/api/src/core/obsidian_parser.py`: Implement robust file system reading using `pathlib` to read `.md` files based on dynamic paths passed via headers.
3.  Create `apps/api/src/core/gemini_engine.py`: Wrap `google-generativeai`.
4.  **Verification:** Write lightweight Python tests or CLI scripts to ensure Python can read a local markdown file and ping Gemini.

### Phase 3.5: Persona Logic & API Endpoints
1.  Implement Pydantic DTOs for inputs/outputs in `apps/api/src/domains/ai/models.py`.
2.  Auto-generate Zod schemas using `openapi-zod-client` to `packages/schemas`.
3.  Implement the `/api/strategist/briefing` endpoint (integrating Notion, Obsidian, and Gemini logic).
4.  Implement the `/api/debugger/query` endpoint.
5.  **Verification:** Pydantic models must perfectly match generated Zod schemas.

### Phase 3.6: Frontend Integration & Polish
1.  Use TanStack Query in React to connect the UI to the FastAPI endpoints.
2.  Build the `/strategist` UI to beautifully render the Markdown response from Gemini.
3.  Build the `/debugger` UI to look like a chat/terminal.
4.  Build the `/dashboard` UI to fetch basic Notion stats and render them in Shadcn Cards/Charts.
5.  **Verification:** End-to-end functionality. User inputs profile, Strategist generates briefing based on local Obsidian files and remote Notion state.

## FINAL INSTRUCTION TO ANTIGRAVITY
Acknowledge receipt of this blueprint. Generate `.tracking/MASTER_ARCHITECTURE.md` reflecting this exact design. Await my 'APPROVED' command to execute Phase 3.1.