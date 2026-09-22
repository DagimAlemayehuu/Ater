# Original User Request

## 2026-09-16T13:16:31Z

Execute Phase 6 of Ater: Literature Grounding, In-App NotebookLM Studio, In-Lesson Sources Tray, and Autonomous Research Station.

Working directory: /Users/dabodestroyer/code/Ater
Integrity mode: development

## Invariants & Guardrails
1. Zero Sycophancy & Zero Emojis: Strictly zero emojis across all code, notes, logs, and UI. Factual, dry reporting.
2. Minimalist UI Aesthetic: Zinc-900 / zinc-50 tokens, border-zinc-200 dark:border-zinc-800, rounded-xl borders, high whitespace, no visual clutter.
3. Plain, Everyday English: Clear, accessible vocabulary in UI and telemetry.
4. Silent Academic Grounding: Scholarxiv papers are strictly for factual enrichment and optional reading; no trivia questioning of authors, dates, or titles.
5. Async Non-Blocking Architecture: All NotebookLM studio artifact generations (audio, video, slides, guides) and deep research queries must be asynchronous with polling and resilient offline fallbacks.
6. Git safety: Do NOT run git commit or git push; leave all git operations to the supervisor.

## Requirements

### R1. Scholarxiv & NotebookLM Client / MCP Integration & API Endpoints
- Implement `lib/scholarxiv/client.ts` interfacing with Scholarxiv MCP / API:
  - Search preprints by topic.
  - Parse metadata: Title, Authors, Year, DOI/URL, Abstract, Key Insight.
  - Resilient offline fallback handling when external network/MCP is unreachable.
- Implement `lib/notebooklm/client.ts` interfacing with NotebookLM MCP:
  - Course notebook creation and listing (`notebook_create`, `notebook_list`).
  - Source attachment for lesson notes and preprints (`source_add`).
  - Studio artifact creation and status polling (`studio_create`, `studio_status`) for Audio Overview, Video Explainer, Presentation Slides, Study Guide, Flashcards / Mind Map.
  - Research queries (`research_start`, `research_status`) for fast (~30s) and deep (~5m) modes.
- Implement API routes:
  - `/api/research/query`: Unified search across Scholarxiv, Web, and NotebookLM sources.
  - `/api/studio/create`: Dispatch artifact creation with configuration payload.
  - `/api/studio/status`: Poll generation state and return artifact status/urls.

### R2. In-Lesson Sources Tray & Studio Modal Canvas Integration
- In-Lesson Sources Tray (`components/dashboard/SourcesTray.tsx`):
  - Collapsible right-column panel in the `/app` canvas.
  - Displays grounded Scholarxiv paper cards with expandable abstract and key insight.
  - In-context quick search bar: "Find related sources..." to query live literature.
- Studio Creator Modal (`components/dashboard/StudioModal.tsx`):
  - Accessible via `[Studio]` button in `NoteCanvas` header.
  - Allows selecting artifact type (Podcast Audio, Video Explainer, Presentation Slides, Study Guide, Flashcards) and options (format, depth, language).
  - Generation indicator with non-blocking progress polling.
  - Built-in media/slide viewer rendering generated media directly in the modal.
- User Settings:
  - Toggle for `Enable NotebookLM Studio` under settings to preserve distraction-free canvas when disabled.

### R3. Autonomous Research Station & Course Induction Bridge
- Dedicated Research Page (`app/research/page.tsx`):
  - Search bar with mode toggle: `Fast Research (~30s)` vs. `Deep Research (~5m)`.
  - Source filter toggles: `Scholarxiv Academic Literature`, `Web & General Insights`, `NotebookLM Deep Research`.
  - High-signal structured findings cards with takeaways and paper references.
- Course Generator Bridge:
  - Action button: `[Convert into Living Course]`.
  - Maps research output directly into Ater's curriculum generation payload (`/api/curriculum/generate`), inducting the learner into a new multi-section course.

### R4. Verification Suite & Production Build
- Author automated Vitest unit tests:
  - `tests/scholarxiv_client.test.ts`: Search, metadata parsing, and offline fallbacks.
  - `tests/studio_engine.test.ts`: Payload formatting and polling state transitions.
  - `tests/research_bridge.test.ts`: Transformation of research results to CourseCurriculum payload.
- All tests pass with exit code 0 (`npx vitest run`).
- Production build succeeds with exit code 0 (`npm run build`).

## Acceptance Criteria

### Automated Verification
- [ ] `npx vitest run` passes with 100% success rate across all new and existing test files.
- [ ] `npm run build` succeeds with 0 TypeScript or lint errors.
- [ ] Fallback fixtures return valid typed responses when external MCP servers are offline.

### Functional Verification
- [ ] `/api/research/query`, `/api/studio/create`, and `/api/studio/status` return valid JSON matching the OpenAPI contracts.
- [ ] Sources Tray expands, collapses, and renders Scholarxiv paper details without layout shifting.
- [ ] Studio Modal launches, accepts artifact parameters, and handles polling states without blocking note interaction.
- [ ] Research Station renders at `/research` and includes the `[Convert into Living Course]` bridge trigger.
