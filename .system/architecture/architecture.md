# Architecture Overview

Life OS is a **polyglot monorepo** using the **Autonomous Factory Standard (ASF)**. It consists of three runtime layers communicating over localhost HTTP, with centralized project intelligence in the `.system/` directory.

## System Architecture

```
[User] <-> [React/Vite (apps/desktop)] <-> [Tauri IPC Bridge] <-> [Python FastAPI Sidecar (apps/api)]
                                                                           |
                                                      +--------------------+-------------------+
                                                      |                    |                   |
                                               [Notion API]       [Google Gemini API]  [Local Obsidian FS]
                                               (Cloud DB)          (AI Engine)          (Local .md files)
                                                                           |
                                                                    [Local SQLite]
                                                                    (OKA Job Queue)
```

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Shell | Tauri v2 (Rust) | Native OS access, filesystem, secure store, sidecar management |
| Frontend | React 19 + Vite 7 + TypeScript 5.9 | UI layer with shadcn-admin aesthetic |
| Backend Sidecar | Python 3.11+ FastAPI + Uvicorn | AI logic, Gemini/Notion/Obsidian integration |
| Shared Logic | **packages/schemas/** | Supreme Law: Shared API contracts and types |
| AI Engine | Google Gemini 2.0/2.5 | Brainstorming, OKA synthesis, and RAG |
| Persistence | SQLite + Obsidian (.md) | Structured job queues and unstructured knowledge |
| Monorepo | Turborepo v2 + pnpm | Build pipelines, dependency management |

## Command Center (.system/)

The `.system/` directory is the repository's brain, containing all intelligence, workflows, and state-tracking files. No application code lives here.

- **agents/**: Personas and role-specific protocols.
- **architecture/**: System design, API contracts, and schema.
- **core/**: The Constitution and behavior laws.
- **design/**: UI/UX rules and design system.
- **prompts/**: System prompts (OKA, etc.).
- **scripts/**: Operational automation (safe-commit, etc.).
- **state/**: Macro-status (STATE.md) and task tracking (GLOBAL_TASKS.md).
- **workflows/**: Executable runbooks (INITIALIZATION, WORKFLOWS, etc.).

## Monorepo Structure

```
LifeOs/
├── .system/              # 🧠 Command Center
├── apps/
│   ├── desktop/          # Tauri v2 + React Frontend
│   ├── api/              # Python FastAPI Sidecar
│   ├── web-client/       # (Placeholder) Browser-based client
│   └── e2e-tests/        # (Placeholder) Playwright tests
├── packages/
│   ├── schemas/          # Shared API contracts (Supreme Law)
│   ├── database-orm/     # (Placeholder) Shared DB logic
│   ├── config-eslint/    # Shared linting
│   └── config-typescript/    # Shared types
└── resources/            # Templates, reference files, prompts
```
