# Changelog

All notable changes to Life OS, in reverse chronological order.

---

## 2026-03-11 — OKA Pipeline Bug Fixes

- Fixed plan generation JSON truncation by increasing `max_output_tokens` to 65536.
- Added strict JSON repair logic to recover truncated or unclosed JSON from Gemini.
- Relaxed the note generation audit rules to allow markdown code fences and focus solely on the presence of note blocks.
- Modified vault deployment to inject fallback YAML frontmatter from note metadata when Gemini omits it instead of skipping the note.
- Fixed the API `NoteItem` model to accept the `selected` boolean sent by the frontend.
- Simplified batch generation prompt, removing the strict `START_INTERNAL_AUDIT` requirement.

## 2026-03-11 — Documentation Hub Restructure

- Created comprehensive `docs/` structure with architecture, tracking, guides, API, and personas sections
- Added `docs/README.md` as master index for AI agent onboarding
- Migrated tracking from `docs/setup/.tracking/` to `docs/tracking/`
- Moved persona definitions from `docs/architecture/` to `docs/personas/`
- Created documentation update workflow (`.agents/workflows/update-docs.md`)

## 2026-03-11 — OKA Defaults Refactoring

- Refactored `oka.md` system prompt into TypeScript constants
- Split into `OKA_PART_A` and `OKA_PART_B` in `apps/desktop/src/lib/oka_defaults.ts`
- Content properly escaped for TypeScript string literals

## 2026-03-11 — Git Push

- Committed and pushed all changes to GitHub

## 2026-03-10 — Codebase Cleanup & Organization

- Major file/directory reorganization
- Removed unnecessary or outdated files
- Improved project structure for maintainability

## 2026-03-10 — Build Error Fixes

- Fixed module resolution issues with `@tanstack/react-router`
- Resolved missing components (`auth-store`, `ConfirmDialog`)
- Fixed app opening issues

## 2026-03-10 — UI Refinement (shadcn-admin Alignment)

- Refactored `settings.tsx`, `oka.tsx`, `academics.tsx` to match shadcn-admin patterns
- Applied side-by-side layouts
- Simplified card styling
- Implemented search functionality across views

---

## Phase 4.3 — Dashboard & Contextual Syncing

- Live metrics: real-time Notion page count and Obsidian file count
- Active missions: high-priority goals from Notion with deep-link navigation
- Academic alerts: upcoming exams and assignment deadlines
- System health: dynamic monitoring of sidecar, Gemini, and workspace connectivity

## Phase 4.2 — OKA Synthesis Engine

- Multi-format resource ingestion (PDF, DOCX, TXT, MD, PPTX) via Gemini File API
- AI-driven plan generation: structured JSON output (units, batches, note titles)
- Background worker queue with SQLite persistence (`JobQueue` table)
- Job polling and status tracking (pending → processing → completed/failed)
- Vault deployment: directory creation, YAML frontmatter, file linking
- Bi-directional Obsidian ↔ Notion linking via `obsidian://` URIs
- Integrated chat: interact with Gemini about uploaded source documents

## Phase 4.1 — Academics Database Integration

- Direct two-way sync with Notion databases (Courses, Semesters, Study Planner, CRM, Exams, Assignments)
- Unit command: visual tracking with confidence levels and Obsidian link verification
- Knowledge deficit tracking: identifies units needing study or AI synthesis
- Automated `academic_profile.md` generation for AI context

## Phase 3.4 — Gemini Intelligence & Dashboard

- Implemented `Strategist` class with Gemini + automatic function calling
- Strategist tools: list/create/update/delete Notion goals + list/read Obsidian notes
- `/api/ai/brainstorm` endpoint for AI reasoning
- Dashboard overview UI with live stats
- Settings UI for local storage management

## Phase 3.3 — Shadcn UI Shell & Connectors

- Tailwind CSS with shadcn design tokens (HSL variables)
- Professional collapsible sidebar/shell layout
- Notion/Obsidian Python connectors with header-based auth
- Expanded `sidecarApi.ts` with typed data fetching

## Phase 3.2 — Storage, State, and Onboarding

- Tauri Plugin Store integration (Rust + React)
- `ConfigContext.tsx` for persistent config management
- `/onboarding` gate UI for system initialization
- Boot sequence: HealthGate → ConfigGate → Routes

## Phase 3.1 — Core Infrastructure & Sidecar Wiring

- Initialized `@life-os/desktop` (Vite + React + TypeScript)
- Tauri v2 shell with `tauri.conf.json` (CSP, sidecar permissions)
- Python FastAPI sidecar with `/api/health` endpoint
- Concurrent dev scripts for sidecar + Tauri

## Phase 1 & 2 — Scaffolding

- Initialized git repository
- Created monorepo directory structure
- Generated tracking files, `.gitignore`, `.env.example`
- Initialized Python `uv` project in `apps/api`
- Root `README.md`, `pnpm-workspace.yaml`, `turbo.json`
- Tier detection: TIER 3 (The Agency Standard / Offline-First)
