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
| **[docs/ARCHITECTURE.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/ARCHITECTURE.md)** | System boundaries, component map, data flows, and dependency map. | Load when changing cross-app architecture or data flow. |
| **[docs/DECISIONS.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/DECISIONS.md)** | Consolidated accepted architecture decisions. | Load when a change may contradict or add a durable technical decision. |
| **[docs/GITHUB.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/GITHUB.md)** | Git branch naming rules, PR templates, and CI/CD self-healing gates. | Load when preparing to push, open pull requests, or sync changes. |
| **[docs/ROADMAP.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/ROADMAP.md)** | Durable adaptive learning runtime product direction. | Load when scoping new capabilities. |

---

## 2. In-Root Invariants (External Dependencies)

This file resides in the root directory because it is actively queried by the system compiler backend. Do **NOT** read or parse this file unless your task directly targets it:
* **[Ater.md](file:///Users/dabodestroyer/code/Antigravity/Ater/Ater.md):** NOTE COMPILER PROMPT DIRECTIVE. Read/edit only if you are modifying `apps/api/src/domains/ater/compilers.py` or the note generation parsing pipelines.

---

## 3. Core Developer Workflow Checklists
* **Plan:** Call the master skill `sdlc-plan` to explore conversationally with the user and create one main OpenSpec implementation brief. Planning never writes implementation code or phase specs.
* **Orchestrate:** Call the master skill `sdlc-orchestrate` to read the main spec, decompose into phase specs/child changes when needed, implement autonomously, and verify every phase independently.
* **Verify:** Call the master skill `sdlc-verify` to audit, preview locally, generate and walk the manual checklist, fix failures through the SDLC loop, integrate, sync specs/docs, archive, and clean up.

---

## 4. Parallel Agent Dispatch Rules

When multiple Jules or Codex agents work at the same time:

* Give each agent one bounded scope and one isolated branch or worktree.
* Agents must not push directly to `main`.
* Agents must not edit `Vault_Test/` unless the task explicitly targets local fixture data.
* Agents must keep changes small enough that review and CI failures can be traced to one feature.
* Agents may open a PR only after relevant local checks pass.
* Agents may merge only after GitHub reports the required `Gatekeeper Required` check as green on the latest `main` base.
* `Gatekeeper Required` is intentionally the fast PR gate for Jules/Codex branches. It does not run full macOS/Windows/Linux release-mode packaging.
* After merge, `Platform Validation Required` runs on `main` to validate macOS, Windows, and Linux with slower platform checks.
* Actual release packaging runs only from version tags through the `Release` workflow.
* If another PR merges first, the agent must update its branch from `main` and wait for CI to rerun.

The CI gate is a merge contract, not a proof of correctness. Passing CI means the required automated checks passed; user-facing behavior still needs manual verification when the change touches product workflows.
