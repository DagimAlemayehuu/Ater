## Context

The current Ater application has several highly-coupled and monolithic code modules. 
- In the React frontend, `UnifiedSandboxViewer.tsx` violates the React Rules of Hooks by placing hook declarations (`useMemo`, `useEffect`) after an early return conditional block. This results in a runtime crash (`Rendered more hooks than during the previous render`) when the active simulator state changes. React routes like `practice.tsx` are monolithic (94 KB), blending state, logic, charts, sub-views, and backend requests.
- In the Python API, `service.py` is a 4,200-line God class handling PDF loading, SRS logic, planning, quiz generation, and state caching. Inline base64 JS/CSS data (1.9 MB) in `assets_data.py` is dynamically decoded and served on every request, consuming CPU and memory. Static subject-specific routing prompts (`DOMAIN_MATRIX`) are hardcoded directly into the Python source code.

## Goals / Non-Goals

**Goals:**
- Fix the React hooks crash in `UnifiedSandboxViewer.tsx` by moving all hooks above early returns.
- Modularize the 4,200-line `service.py` backend class into smaller, single-responsibility modules.
- Remove base64 assets (`assets_data.py`) and replace them with standard static file serving in FastAPI.
- Export hardcoded prompt matrices into a static YAML file.
- Modularize the React `practice.tsx` route file into components and custom hooks.

**Non-Goals:**
- Modifying the core business logic or algorithms (e.g. changing the SRS scoring math or AI prompt contents).
- Changing database schemas or SQLite migrations.
- Adding new user-facing features or capabilities.

## Decisions

### Decision 1: React Hook Relocation in UnifiedSandboxViewer
* **Rationale:** Relocating `useMemo` and `useEffect` above the early return statement ensures the exact same hooks run in the same order on every render. Optional chaining (`activeArtifact?.id`) will be used to protect against undefined errors when no simulator is active.
* **Alternatives Considered:** Removing `useMemo` entirely (creates unnecessary recalculations and rebuilds the iframe on every render).

### Decision 2: Split service.py into Dedicated Domain Modules
* **Rationale:** Divide the 225 KB `service.py` monolith into:
  - `pdf_extractor.py`: Handles PDF parsing fallbacks.
  - `srs_engine.py`: Handles spaced repetition database syncing.
  - `quiz_builder.py`: Handles practice/quiz compilation.
  - `session_store.py`: Handles session caching and serialization.
* **Alternatives Considered:** Keeping it as a single class but using class inheritance/mixins (still creates a single massive file that is hard to lint/import).

### Decision 3: Move DOMAIN_MATRIX configuration to domain_matrix.yaml
* **Rationale:** Exporting the massive dicts from `agents.py` into a static YAML config file decouples metadata from runtime agent code, speeding up file import times.
* **Alternatives Considered:** Keeping the matrices in a separate python file (still loads large Python dict structures into memory on import, rather than lazily/safely).

### Decision 4: Serve PDF.js Assets from Disk
* **Rationale:** Write the PDF.js scripts directly as files inside a static folder and serve them using FastAPI's standard file streaming or `StaticFiles` middleware.
* **Alternatives Considered:** Caching the decoded base64 strings in memory (still consumes memory and pollutes the source code base).

## Risks / Trade-offs

- **Risk:** Import errors or circular dependencies when split files are imported.
  - *Mitigation:* Keep imports clean, use relative imports within the domain package, and run the test suite after each modularization step.
- **Risk:** Broken routes in React when splitting `practice.tsx`.
  - *Mitigation:* Isolate UI visual changes from functional state changes and verify with React DevTools.
