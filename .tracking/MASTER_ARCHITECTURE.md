# MASTER ARCHITECTURE: LIFE OS

**Document Status:** Immutable Reference - Generated from Prompt.md
**Last Updated:** Phase 1 Complete
**Tier:** TIER 3 (The Agency Standard / Offline-First)
**Repo:** https://github.com/DagimAlemayehuu/LifeOs.git

---

## 1. THE PHILOSOPHY

Life OS is a localized Personal Life Operating System disguised as a professional admin dashboard (aesthetic reference: `satnaing/shadcn-admin`). It acts as a central mentor, manager, and assistant with zero hardcoded state - 100% portable and user-configured at runtime.

### The Trinity

| Pillar | Technology | Role |
|---|---|---|
| The Database | Notion API | Structured data: Goals, Projects, Tasks, Time Blocks, MV/MEV/MRV tracking |
| The Memory | Obsidian Vault (local .md files) | Unstructured data: Daily journals, deep-dive notes. Local filesystem only. |
| The Brain | Google Gemini 1.5 API | Reasoning engine. Executed strictly via the Python backend. Never from the frontend. |

---

## 2. SECURE DATA FLOW (IMMUTABLE CONTRACT)

```
[Tauri-plugin-store] --> [React Frontend]
        (reads keys)             |
                                 | Injects into HTTP Headers:
                                 | X-Notion-Key, X-Gemini-Key, X-Vault-Path
                                 v
                     [Python FastAPI Sidecar]
                                 |
              +------------------+------------------+
              |                  |                  |
       [Notion API]      [Obsidian .md FS]  [Google Gemini 1.5]
```

- API Keys are NEVER stored in Python or sent in request bodies.
- Python extracts keys from HTTP headers per-request, executes logic, returns Pydantic/JSON response.

---

## 3. MONOREPO STRUCTURE

```
/
├── .tracking/
│   ├── MASTER_ARCHITECTURE.md   <- This file
│   ├── project_state.md
│   ├── changelog.md
│   ├── error_registry.md
│   └── adrs/                    <- Architecture Decision Records
├── apps/
│   ├── desktop/                 <- Tauri v2 + React/Vite frontend
│   │   ├── src/
│   │   │   ├── routes/          <- /onboarding, /dashboard, /strategist, /debugger, /profiles, /settings
│   │   │   ├── components/      <- Shadcn UI components, Layout, Sidebar, Topbar
│   │   │   ├── lib/             <- Tauri store bridge, API client, Zustand store
│   │   │   └── main.tsx
│   │   ├── src-tauri/
│   │   │   ├── src/             <- Rust Tauri commands
│   │   │   ├── binaries/        <- Python sidecar binary
│   │   │   └── tauri.conf.json  <- Sidecar registration, FS permissions
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── api/                     <- Python FastAPI Sidecar (uv-managed)
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── main.py      <- FastAPI app entry point
│   │   │   ├── core/
│   │   │   │   ├── notion_client.py     <- httpx wrapper for Notion API
│   │   │   │   ├── obsidian_parser.py   <- pathlib-based .md reader
│   │   │   │   └── gemini_engine.py     <- google-generativeai wrapper
│   │   │   └── domains/
│   │   │       └── ai/
│   │   │           └── models.py        <- Pydantic DTOs (source of truth)
│   │   ├── scripts/             <- CLI test scripts for connectors
│   │   ├── pyproject.toml       <- uv-managed dependencies
│   │   └── .venv/
│   └── web/                     <- Reserved (inactive)
├── packages/
│   ├── ui/                      <- Shared React components
│   ├── schemas/src/             <- Auto-generated Zod schemas (from Pydantic -> OpenAPI -> openapi-zod-client)
│   ├── config-eslint/           <- Shared ESLint config
│   └── config-typescript/       <- Shared tsconfig base
├── ops/
│   ├── docker/
│   └── supabase/                <- Reserved (inactive)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. FRONTEND SPECIFICATION

**Stack:** Vite + React + TypeScript + Tailwind CSS + Shadcn UI + TanStack Query + Lucide Icons

**Required Shadcn Components:** button, input, textarea, card, dialog, toast, scroll-area, avatar, separator, sidebar

**Layout:**
- Persistent left Sidebar navigation
- Topbar with breadcrumbs, theme toggle, user avatar/status
- Main content area renders active route

**Routes:**

| Route | Purpose | Gate Condition |
|---|---|---|
| `/onboarding` | Full-screen mandatory setup gate | Shown if Tauri store lacks keys/path |
| `/dashboard` | Macro view: Consistency Score, Burnout Risk, Energy Allocation chart, Today's Active Focus | Requires configured keys |
| `/strategist` | Morning Briefing: AI analysis of journal vs tasks | Requires configured keys |
| `/debugger` | Chat/terminal UI: RAG-based problem solving over Obsidian vault | Requires configured keys |
| `/profiles` | Textareas to edit User Profiles (Personal, Academic, Fitness baselines) | Requires configured keys |
| `/settings` | Manage API keys, Vault Path, App Preferences | Always accessible |

---

## 5. BACKEND SPECIFICATION

**Stack:** Python 3.12+, FastAPI, Uvicorn, `google-generativeai`, `httpx`, `pydantic`

**Sidecar Lifecycle:** Python FastAPI server bundled and spawned automatically by Tauri. Runs on fixed port 8765. Shuts down cleanly when Tauri closes.

**API Contracts:**

### `GET /api/health`
- Returns: `{ "status": "ok" }`
- Purpose: Frontend polls before loading main UI

### `POST /api/config/verify`
- Headers: `X-Notion-Key`, `X-Gemini-Key`, `X-Vault-Path`
- Logic: Pings Notion API, pings Gemini API, checks if vault path exists on disk
- Returns: `{ "notion": true/false, "gemini": true/false, "vault": true/false }`

### `POST /api/strategist/briefing`
- Headers: `X-Notion-Key`, `X-Gemini-Key`, `X-Vault-Path`
- Body: `{ "user_profiles": "...", "current_date": "YYYY-MM-DD" }`
- Logic: Read Obsidian journal for `current_date - 1`. Fetch incomplete Notion tasks. Build "The Strategist" system prompt. Call Gemini 1.5.
- Returns: `{ "briefing_text": "...", "suggested_task_updates": [...], "burnout_risk_score": 1-100 }`

### `POST /api/debugger/query`
- Headers: `X-Gemini-Key`, `X-Vault-Path`
- Body: `{ "query": "...", "user_profiles": "..." }`
- Logic: Scan Obsidian vault for relevant `.md` files. Build "The Debugger" system prompt with context. Call Gemini 1.5.
- Returns: `{ "diagnosis": "...", "root_causes": [...], "actionable_steps": [...] }`

### `POST /api/notion/sync`
- Headers: `X-Notion-Key`
- Body: `{ "action": "update_tasks", "payload": [...] }`
- Logic: Safe CRUD wrapper against Notion databases

---

## 6. SCHEMA GENERATION PIPELINE

```
apps/api/src/domains/ai/models.py (Pydantic)
    |
    v (openapi.json auto-export)
    |
    v (openapi-zod-client)
    |
packages/schemas/src/ (TypeScript Zod Schemas)
    |
    v (imported by)
apps/desktop/src/ (React frontend)
```

**Rule:** Pydantic models are the single source of truth. TypeScript types are ALWAYS derived, never hand-written.

---

## 7. PHASE EXECUTION PLAN

| Phase | Name | Key Deliverable | Verification Gate |
|---|---|---|---|
| 3.1 | Core Infrastructure | Tauri + Vite/React + FastAPI sidecar wired | React fetches `/api/health`, logs "Sidecar Connected" |
| 3.2 | Storage & Onboarding | `tauri-plugin-store` + `/onboarding` + `/settings` | Keys persist across app restarts |
| 3.3 | Shadcn UI Shell | Full layout: Sidebar, Topbar, all placeholder routes | App resembles professional admin dashboard |
| 3.4 | Data Connectors | `notion_client.py`, `obsidian_parser.py`, `gemini_engine.py` | CLI scripts can read .md files and ping Gemini |
| 3.5 | Persona Logic & Endpoints | All FastAPI endpoints implemented, Zod schemas generated | Pydantic DTOs match generated Zod schemas exactly |
| 3.6 | Frontend Integration | All routes wired to FastAPI via TanStack Query | End-to-end: Strategist generates briefing from Obsidian + Notion |

---

## 8. IRON LAWS (MUST NOT VIOLATE)

1. No API keys hardcoded anywhere in the codebase. All secrets flow from Tauri store -> React -> HTTP headers -> Python.
2. App must boot to `/onboarding` if any required configuration is absent.
3. All heavy computation (Gemini, Notion) happens in Python. Never in React.
4. pnpm only for Node packages. uv only for Python packages.
5. Read-Before-Write on all file modifications.
6. No phase is "Complete" until `pnpm build`, `pnpm lint`, and `pnpm typecheck` pass with Exit Code 0.
7. No assumptions about installed libraries. Always check `package.json` or `pyproject.toml` first.
8. No emojis in any output, log file, or commit message.
