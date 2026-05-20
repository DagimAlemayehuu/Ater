# [GEMINI PARSING PROTOCOL]: MONOREPO OVERVIEW
> **ATTENTION GEMINI CLI:** This file defines the scope and boundary rules for ingesting context from this Autonomous Factory Monorepo.

## 1. THE IGNORE DIRECTIVE
You must strictly ignore the following directories and files to preserve token efficiency:
* `node_modules/`
* `dist/`
* `.next/`
* `.git/`
* `*.lock` (unless specifically analyzing dependency trees)

## 2. THE CONTEXT PRIORITY LOAD
When asked to summarize the architecture or status of this monorepo, you must prioritize loading the following files in this exact order:
1. `.system/state/STATE.md` (The macro-status of the project).
2. `.system/architecture/architecture.md` (The fundamental system design, API contracts, and schema).
3. `Ater.md` (The definitive protocol for the Obsidian Knowledge Architect).
4. `.system/design/design_rules.md` (If the query is related to the UI).
5. `pnpm-workspace.yaml` (To understand the physical boundary within `apps/`).

## 3. THE ARCHITECTURE SUMMARY
This is a Turborepo-managed Monorepo.
*   **The Bounded Contexts:** The `apps/` directory contains deployable user-facing applications: `desktop` (Tauri v2 client), `api` (FastAPI sidecar), `admin` (Next.js Supabase management panel), and `landing-page` (Next.js waitlist portal).
*   **The Orchestration Layer:** The `.system/` directory is the Command Center. It holds all AI-agent prompts, workflows, and state-tracking files. No application code lives here.
*   **The Human-in-the-Loop Protocol:** The `references/` and `.system/design/` folders hold user-provided specifications that dictate the exact output of the Frontend Agents.
