# Life OS — Personal Intelligence Operating System

**Tier 1: Autonomous Factory Standard (Offline-First)**

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
[User] <-> [React/Vite (apps/desktop)] <-> [Tauri v2 IPC Bridge] <-> [Python FastAPI Sidecar (apps/api)]
                                                                           |
                                                      +--------------------+-------------------+
                                                      |                    |                   |
                                               [Notion API]       [Google Gemini API]  [Local Obsidian FS]
```

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Tauri v2 (Rust) — native OS, secure store, sidecar management |
| Frontend | React 19 + Vite 7 + TypeScript 5.9, Tailwind CSS + shadcn/ui |
| Backend Sidecar | Python 3.11+ FastAPI on `localhost:8765` |
| Package Managers | pnpm (Node), uv (Python) — **npm/yarn/pip forbidden** |
| Monorepo | Turborepo v2 |
| Command Center | **.system/** — Runbook-driven development protocols |

## Quick Start

```bash
pnpm install                  # Install Node dependencies
cd apps/api && uv sync        # Setup Python environment
pnpm dev:all                  # Start everything (sidecar + Tauri)
```

## Project Structure

```
LifeOs/
├── .system/              # 🧠 Command Center (Intelligence, Workflows, State)
│   ├── agents/               # AI Persona definitions
│   ├── architecture/         # System design and API contracts
│   ├── core/                 # Constitution and behavior laws
│   ├── design/               # UI/UX rules and app structure
│   ├── prompts/              # System prompts (OKA, etc.)
│   ├── scripts/              # Operational scripts (safe-commit, etc.)
│   ├── state/                # Project state and task tracking
│   └── workflows/            # Executable runbooks
├── apps/
│   ├── desktop/              # Tauri v2 + React/Vite frontend
│   └── api/                  # Python FastAPI sidecar
├── packages/
│   ├── schemas/              # Shared API contracts (Supreme Law)
│   ├── config-eslint/        # Shared linting
│   └── config-typescript/    # Shared types
├── resources/            # Templates, reference files, prompts
├── AGENTS.md             # Supreme Law: Agent protocols
└── GEMINI.md             # Gemini Parsing Protocol
```

## Security

- **No hardcoded API keys.** Ever.
- Keys stored in Tauri's encrypted local store → injected as HTTP headers per-request.
- App boots to `/onboarding` if configuration is missing.

## Documentation

**→ Start with [`AGENTS.md`](AGENTS.md)** — the master protocol for interacting with this repository.
**→ Read [`.system/workflows/INITIALIZATION.md`](.system/workflows/INITIALIZATION.md)** — to start your development session.
