# AGENTS.md — Ater System Router & Directory Map

Welcome, Agent. You are working on **Ater**, an offline-first Personal Intelligence OS. 
To minimize token usage and prevent context drift, do NOT read all documentation files. Follow this guide and load ONLY the files relevant to your active task.

---

## 1. Documentation Directory Index

| Target Document | Purpose | Load Trigger |
| :--- | :--- | :--- |
| **[docs/CONTEXT.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/CONTEXT.md)** | Core domain glossary and immutable system invariants. | **Mandatory** at start of all feature work. |
| **[docs/SOP.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/SOP.md)** | SDLC workflow operations, change tiers, and PR/merge/archive gates. | **Mandatory** when planning, executing changes, or running checks. |
| **[docs/DESIGN.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/DESIGN.md)** | Design system, HSL color tokens, typography scales, and visual layout. | Load when modifying styles or integrating external design layouts. |
| **[docs/FRONTEND.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/FRONTEND.md)** | React, Tauri, Vite frameworks, routes, and client-side Zustand store. | Load when modifying React screens, Monaco editor, or UI files. |
| **[docs/BACKEND.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/BACKEND.md)** | FastAPI sidecar services, ONNX local embeddings, and LangChain chat tools. | Load when editing Python API routes, background watches, or agents. |
| **[docs/DATABASE.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/DATABASE.md)** | Local SQLite FSRS schemas and remote Supabase DRM/RLS systems. | Load when modifying database tables, migrations, or security leases. |
| **[docs/GITHUB.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/GITHUB.md)** | Git branch naming rules, PR templates, and CI/CD self-healing gates. | Load when preparing to push, open pull requests, or sync changes. |
| **[docs/ROADMAP.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/ROADMAP.md)** | Future adaptive learning runtime phases and outstanding phase gaps. | Load when scoping new features or checking specifications. |

---

## 2. In-Root Invariants (External Dependencies)

This file resides in the root directory because it is actively queried by the system compiler backend. Do **NOT** read or parse this file unless your task directly targets it:
* **[Ater.md](file:///Users/dabodestroyer/code/Antigravity/Ater/Ater.md):** NOTE COMPILER PROMPT DIRECTIVE. Read/edit only if you are modifying `apps/api/src/domains/ater/compilers.py` or the note generation parsing pipelines.

---

## 3. Core Developer Workflow Checklists
* **Plan:** Call the master skill `sdlc-plan` in Codex to create the spec and GitHub issue.
* **Orchestrate:** Run the master skill `sdlc-orchestrate` in Antigravity to scaffold the isolated worktree and run sequential Flash agents.
* **Verify:** Run the master skill `sdlc-verify` to check compliance, run the manual verification checklist, merge the PR, and archive.
