# TASKS: Granular Execution Backlog

This file tracks the step-by-step technical implementation path generated during Phase 3 of the Build Loop.

## Sprint: Template Perfection
- [x] Consolidate `.agents` and `.tracking` into `.system`.
- [x] Validate directory topology mapping in Core Constitution.
- [x] Configure Husky pre-commit typechecker for anti-hallucination verification.
- [x] Decouple `TASKS.md` from `STATE.md` to conserve token depth.
- [x] Scrub all emojis from system prompts and documentation (Professional standard).

*Next autonomous agent loop will append and check off dynamic tasks here...*

## Sprint: Ecosystem Expansion & Stability
- [x] **10 AI Agents Integration**
    - [x] Design and implement 10 unique agent personas and icons.
    - [x] Create dynamic routing for `/agents/:id`.
    - [x] Connect Librarian agent to RAG search backend.
- [x] **10 System Automations Integration**
    - [x] Design and implement 10 background automation tasks.
    - [x] Create dynamic routing for `/automations/:id` with telemetry logs.
- [x] **OKA Restoration**
    - [x] Recover 164KB OKA master prompt from git history.
    - [x] Implement secure storage and retrieval for OKA directives.
    - [x] Add OKA editor to Settings UI.
- [x] **Stability Patch**
    - [x] Fix unbalanced JSX in `strategist.tsx`.
    - [x] Fix TypeScript/Lint errors project-wide (30+ errors).

## Sprint: Final Polish & Packaging
- [x] **Error Handling Audit (Backend)**
    - [x] Standardize exception handling in `main.py` and domain routers.
    - [x] Implement a global error handler/middleware for consistent JSON responses.
    - [x] Remove bare `try/except Exception` blocks and use specific exceptions.
- [x] **Error Handling Audit (Frontend)**
    - [x] Add global Error Boundary for React components.
    - [x] Standardize `sidecarApi` error catching and toast notifications in routes.
- [x] **UI/UX Refinement**
    - [x] Review all routes for Shadcn consistency and Tailwind spacing.
    - [x] Optimize "The Debugger" and "Strategist" chat interfaces for mobile/desktop layouts.
- [x] **Packaging & Build**
    - [x] Finalize Tauri build configuration.
    - [x] Create PyInstaller sidecar build script and binary triple mapping.
    - [x] Implement production sidecar spawning in Tauri `lib.rs`.
- [x] Fix app startup hang by adding `/api/health` and improving `SidecarGate` polling.
