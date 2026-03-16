# Life OS — Documentation Hub

> **For AI Agents:** Read this file FIRST. It is the master index for the entire project.
> After reading this, read `tracking/project-state.md` to understand where development left off.

## Quick Context

**Life OS** is a local-first Tauri v2 desktop application — a personal AI operating system. It combines Notion (structured data), Obsidian (local markdown knowledge), and Google Gemini (AI reasoning) into a unified productivity system.

**Tier:** 3 (The Agency Standard / Offline-First)
**Repo:** https://github.com/DagimAlemayehuu/LifeOs.git

---

## Documentation Map

### 1. Architecture — *What the system is*
- [system-overview.md](architecture/system-overview.md) — High-level architecture, tech stack, data flow
- [frontend.md](architecture/frontend.md) — React app: routes, components, state management
- [backend.md](architecture/backend.md) — Python API: domains, endpoints, background workers
- [data-model.md](architecture/data-model.md) — Config schema, Notion database IDs, SQLite tables

### 2. Tracking — *Where we are right now*
- [project-state.md](tracking/project-state.md) — Current phase, completed features, next objectives
- [changelog.md](tracking/changelog.md) — Chronological history of all changes
- [backlog.md](tracking/backlog.md) — Prioritized list of planned features and improvements
- [known-issues.md](tracking/known-issues.md) — Active bugs, tech debt, workarounds

### 3. Guides — *How to work on it*
- [development.md](guides/development.md) — Dev environment setup, commands, workflows
- [conventions.md](guides/conventions.md) — Code conventions, naming rules, forbidden patterns
- [adding-features.md](guides/adding-features.md) — Step-by-step guide for common development tasks

### 4. API Reference
- [endpoints.md](api/endpoints.md) — Every API endpoint documented

### 5. Personas — *AI persona definitions*
- [README.md](personas/README.md) — How the persona system works
- [strategist.md](personas/strategist.md) — The Strategist system prompt
- [creator.md](personas/creator.md) — The Creator system prompt

### 6. Prompts
- [oka.md](prompts/oka.md) — OKA (Obsidian Knowledge Architect) master system instruction (~164KB)

### 7. Setup — *Original initialization protocols*
- [Initialize.md](setup/Initialize.md) — Scaffolding protocol for new AI agents
- [Prompt.md](setup/Prompt.md) — Original feature blueprint

---

## For AI Agents: Reading Order

1. **This file** (you're here)
2. **`tracking/project-state.md`** — Know what's done and what's next
3. **`architecture/system-overview.md`** — Understand the system
4. **`tracking/backlog.md`** — See planned work
5. **`guides/conventions.md`** — Know the rules before writing code
6. Dive into specific docs as needed for your task

---

## Documentation Update Protocol

**Every time a feature or fix is completed, you MUST:**

1. Add a dated entry to `tracking/changelog.md`
2. Update `tracking/project-state.md` (check off items, add new objectives)
3. Update `tracking/backlog.md` (remove completed, reprioritize)
4. Update relevant architecture docs if routes/endpoints/schemas changed
5. Update `api/endpoints.md` if any API endpoints were added or modified

See `.agents/workflows/update-docs.md` for the automated workflow.
