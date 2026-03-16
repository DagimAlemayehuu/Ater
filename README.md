# Life OS — Personal Intelligence Operating System

**Tier 3: Agency Standard**

## What Is Life OS?

Life OS is a local-first desktop application — a personal AI operating system that combines:

| Pillar | Technology | Role |
|---|---|---|
| **The Synapse** | Notion API | Structured data: Goals, Academics, Projects, Tasks |
| **The Vault** | Obsidian (`.md`) | Local knowledge: Course notes, journals, docs |
| **The Architect** | OKA (Gemini) | AI synthesis: Converts source docs into structured notes |
| **The Strategist** | AI Engine | Context-aware guidance based on synced profiles |

## New Features
- **10 Core AI Agents:** Orchestrator, Architect, Strategist, Librarian, Academic, Taskmaster, Scribe, Synthesizer, Reviewer, Auditor.
- **10 Core Automations:** Auto-PDF Ingestor, Morning Briefing, Auto-Linker, Habit Streak tracking, Flashcard generation, and more running silently via a Python background scheduler.
- **shadcn-admin UI:** A minimalist, sleek dashboard layout featuring Dark Mode out-of-the-box.

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
| Frontend | React 19 + Vite 7 + TypeScript 5.9, Tailwind CSS + shadcn/ui (shadcn-admin) |
| Backend Sidecar | Python 3.11+ FastAPI on `localhost:8765` + Asyncio Scheduler |
| Package Managers | pnpm (Node), uv (Python) — **npm/yarn/pip forbidden** |
| Monorepo | Turborepo v2 |
| Command Center | **.system/** — Runbook-driven development protocols |

## Quick Start

```bash
pnpm install                  # Install Node dependencies
cd apps/api && uv sync        # Setup Python environment
pnpm dev:all                  # Start everything (sidecar + Tauri)
```
