# Execution Plan: Ater Phase 6

## Objective
Implement Phase 6 of Ater:
- R1: Scholarxiv & NotebookLM Client / MCP Integration & API Endpoints (`lib/scholarxiv/client.ts`, `lib/notebooklm/client.ts`, `/api/research/query`, `/api/studio/create`, `/api/studio/status`).
- R2: In-Lesson Sources Tray & Studio Modal Canvas Integration (`components/dashboard/SourcesTray.tsx`, `components/dashboard/StudioModal.tsx`, NoteCanvas integration, user settings).
- R3: Autonomous Research Station & Course Induction Bridge (`app/research/page.tsx`, bridge to `/api/curriculum/generate`).
- R4: Verification Suite & Production Build (`tests/scholarxiv_client.test.ts`, `tests/studio_engine.test.ts`, `tests/research_bridge.test.ts`, Vitest passes 100%, Next.js build succeeds with 0 errors).

## Phased Approach
1. **Phase 0: Survey & Scope Mapping**
   - Dispatch 3 parallel Explorers:
     - Explorer 1: Map existing Ater architecture, package.json, Next.js app router structure, API routes, and curriculum generation contracts (`/api/curriculum/generate`).
     - Explorer 2: Map canvas layout, NoteCanvas header, dashboard components, settings store/context, and UI styling conventions (Zinc tokens, Tailwind, icons/no emojis).
     - Explorer 3: Investigate Scholarxiv and NotebookLM MCP tools, server schemas, fallback payloads, and client architectures.
   - Aggregate findings and author `PROJECT.md` with Feature Inventory and Interface Contracts.

2. **Phase 1: Dual Track Execution**
   - **Track A: E2E Testing Track**
     - Author `TEST_INFRA.md`.
     - Implement comprehensive tests covering Tiers 1-4.
     - Publish `TEST_READY.md`.
   - **Track B: Implementation Track**
     - **Milestone 1 (R1)**: Scholarxiv & NotebookLM clients and API routes (`/api/research/query`, `/api/studio/create`, `/api/studio/status`).
     - **Milestone 2 (R2)**: In-Lesson Sources Tray (`components/dashboard/SourcesTray.tsx`), Studio Modal (`components/dashboard/StudioModal.tsx`), NoteCanvas hookup, settings toggle.
     - **Milestone 3 (R3)**: Autonomous Research Station (`app/research/page.tsx`) & Course Induction Bridge to `/api/curriculum/generate`.
     - **Milestone 4 (R4)**: Vitest automated verification suite (`tests/scholarxiv_client.test.ts`, `tests/studio_engine.test.ts`, `tests/research_bridge.test.ts`) & Next.js production build (`npm run build`).

3. **Phase 2: Review, Empirical Challenge & Forensic Audit Gate**
   - Reviewer verification of completeness, responsiveness, and contract conformance.
   - Challenger verification of edge cases and offline resilience.
   - Forensic Auditor verification of integrity (zero mock cheating, authentic implementations).

4. **Phase 3: Final Synthesis & Human Reporting**
   - Validate full test pass (`npx vitest run`) and clean build (`npm run build`).
   - Deliver completion handoff and report to parent.
