# Life OS — Personal Intelligence Operating System

**Tier 3: The Agency Standard (Offline-First)**

## What Is Life OS?

Life OS is a local-first desktop application — a personal AI operating system that combines:

| Pillar | Technology | Role |
|---|---|---|
| **The Synapse** | Notion API | Structured data: Goals, Academics, Projects, Tasks |
| **The Vault** | Obsidian (`.md`) | Local knowledge: Course notes, journals, docs |
| **The Architect** | OKA (Gemini) | AI synthesis: Converts source docs into structured notes |
| **The Strategist** | AI Engine | Context-aware guidance based on synced profiles |

## Architecture

```
[User] <-> [React/Vite (apps/desktop)] <-> [Tauri v2 IPC] <-> [Python FastAPI Sidecar (apps/api)]
                                                                        |
                                                   +-------------------+-------------------+
                                                   |                   |                   |
                                            [Notion API]      [Google Gemini API]  [Local Obsidian FS]
```

| Layer | Technology |
|---|---|
| Desktop Shell | Tauri v2 (Rust) — native OS, secure store, sidecar management |
| Frontend | React 19 + Vite 7 + TypeScript 5.9, Tailwind CSS + shadcn/ui |
| Backend Sidecar | Python 3.11+ FastAPI on `localhost:8765` |
| Package Managers | pnpm (Node), uv (Python) — **npm/yarn/pip forbidden** |
| Monorepo | Turborepo v2 |

## Quick Start

```bash
pnpm install                  # Install Node dependencies
cd apps/api && uv venv && uv pip install -e . && cd ../..  # Setup Python
pnpm dev:all                  # Start everything (sidecar + Tauri)
```

## Project Structure

```
LifeOs/
├── apps/
│   ├── desktop/          # Tauri v2 + React/Vite frontend
│   └── api/              # Python FastAPI sidecar
├── docs/                 # 📚 Complete documentation hub (start here)
│   ├── README.md             # Master index — read this first
│   ├── architecture/         # System design, frontend, backend, data model
│   ├── tracking/             # Project state, changelog, backlog, issues
│   ├── guides/               # Development setup, conventions, how-to guides
│   ├── api/                  # API endpoint reference
│   ├── personas/             # AI persona definitions (Strategist, Creator)
│   ├── prompts/              # OKA system instruction (~164KB)
│   └── setup/                # Original initialization protocols
├── packages/             # Shared configs (ESLint, TypeScript)
├── resources/            # Templates, reference files, prompts
└── .agents/workflows/    # Agent workflows (update-docs, etc.)
```

## Security

- **No hardcoded API keys.** Ever.
- Keys stored in Tauri's encrypted local store → injected as HTTP headers per-request.
- App boots to `/onboarding` if configuration is missing.

## Documentation

**→ Start with [`docs/README.md`](docs/README.md)** — the master index for all project documentation, including architecture, tracking, guides, and API reference.

For AI agents: the docs folder is self-contained. Read `docs/README.md` first, then `docs/tracking/project-state.md` to understand current status.