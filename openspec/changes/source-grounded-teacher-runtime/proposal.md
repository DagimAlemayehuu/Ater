## Why

Ater's PDF/source learning path is currently split across the new chat runtime, the old Ater PDF note compiler, the source-grounded planner, the tutor runtime, and vault deployment. That makes source learning hard to verify: a PDF can become a roadmap or notes, but the system cannot prove that the chapter was fully taught, tested, remediated, and scheduled for practice.

This change creates a unified source-grounded teacher runtime using `Chapter 3 2024-1.pdf` as the golden acceptance fixture. The goal is to turn a bounded academic source into a complete, verifiable learning loop while preserving weak/free-model resilience by moving structure, routing, validation, coverage, and fallback behavior into deterministic code.

## What Changes

- Introduce a canonical source learning job model that unifies PDF upload, Inbox watcher ingestion, source analysis, concept graph generation, Atomic Note compilation, tutor session launch, mastery tracking, practice scheduling, and vault deployment.
- Replace the accidental dual path where the desktop chat source button registers a chat attachment and separately drives the old process/plan/confirm pipeline.
- Reuse the mature old Ater compiler as a source-grounded Atomic Note compilation service rather than leaving it as a separate legacy workflow.
- Make source intake deterministic and auditable: page count, per-page text quality, low-text/empty-page warnings, source type classification, extraction metadata, and objective extraction must be persisted and testable.
- Build a source map and coverage matrix for each source learning job, including required chapter objectives, concept coverage, source page citations, teaching status, quiz status, transfer status, mastery status, practice scheduling status, and vault deployment status.
- Build a concept graph from source content with deterministic invariants: objective coverage, source-page grounding, prerequisite ordering, deduplication, cycle rejection, and domain drift checks.
- Promote dynamic teaching personas into an executable teaching profile layer selected per Atomic Note from domain + modality + source context.
- Fix persona selection so domain-specific modality profiles from `DYNAMIC_DOMAIN_MATRIX` are used before falling back to universal modality blending.
- Minimize AI responsibility. AI may generate source-aligned prose, examples, Socratic questions, remediation, and ambiguous concept extraction, but deterministic code owns structure, routing, section plans, schema validation, citations, retries, fallbacks, coverage, mastery state, and vault paths.
- Launch a real tutor session from a compiled source job, not just a note preview. The runtime must teach, ask, grade, remediate, require transfer, mark mastery, unlock the next concept, and schedule practice.
- Preserve the Inbox folder workflow. Dropping a PDF into the configured Inbox must route into the same source learning job lifecycle as attaching a PDF in the desktop UI.
- Add automated tests and a manual verification checklist around `Chapter 3 2024-1.pdf`.

## Capabilities

### New Capabilities

- `source-grounded-teacher-runtime`: Canonical source-to-teacher lifecycle covering source jobs, extraction audit, source map, concept graph, teaching profiles, coverage matrix, tutor launch, mastery updates, practice scheduling, and vault deployment.

### Modified Capabilities

- `source-driven-learning`: Source upload/planning must converge into the unified source learning job model instead of remaining a thin planner separate from the old compiler and tutor runtime.
- `atomic-note-lesson-compiler`: The old Ater PDF note compiler must become a reusable, AI-minimized compilation service driven by concept graph and teaching profile inputs.
- `tutor-runtime`: Tutor sessions must start from source jobs and update source coverage/mastery state concept by concept.
- `adaptive-learner-model`: Mastery state must support source-grounded concept progress, remediation history, transfer gate outcomes, and practice scheduling hooks.
- `learning-runtime-e2e`: End-to-end learning must verify the complete source-grounded path from PDF intake through tutor session, vault deployment, and coverage reporting.

## Impact

- Backend domains:
  - `apps/api/src/domains/ater/source_service.py`
  - `apps/api/src/domains/ater/service.py`
  - `apps/api/src/domains/ater/watcher.py`
  - `apps/api/src/domains/ater/router.py`
  - `apps/api/src/domains/ater/agents.py`
  - `apps/api/src/domains/ater/domain_matrix.yaml`
  - `apps/api/src/domains/ater/templates.py`
  - `apps/api/src/domains/ater/tutor_service.py`
  - `apps/api/src/domains/ater/learner_model_service.py`
  - `apps/api/src/domains/ater/srs.py`
  - `apps/api/src/domains/ater/pdf_extractor.py`
  - `apps/api/src/domains/ater/validator.py`
  - `apps/api/src/domains/ater/deployer.py`
  - `apps/api/src/domains/ater/chat_runtime/attachments.py`
- Backend routers and API clients:
  - `apps/api/src/api/routers/ater.py`
  - `apps/api/src/api/routers/ai.py`
  - `apps/desktop/src/lib/sidecarApi.ts`
- Desktop UI:
  - `apps/desktop/src/routes/agents.tsx`
  - related learning workspace, source attachment, roadmap, coverage, and tutor panels
- Tests:
  - API unit/integration tests under `apps/api/tests/`
  - Ater domain tests under `apps/api/src/domains/ater/test_*.py`
  - desktop API/client/UI tests under `apps/desktop/src/tests/`
  - fixture coverage for repository-root `Chapter 3 2024-1.pdf`
- Data/storage:
  - May add SQLite tables or migrations in the local Ater queue/runtime database for source jobs, source pages, concept graph nodes/edges, teaching profiles, coverage matrix rows, and source-job tutor linkage.
  - Must remain offline-first and must not introduce cloud-only dependencies.
- Operational constraints:
  - Must tolerate missing/weak AI responses, malformed JSON, rate limits, and no network.
  - Must be idempotent for reruns and must not duplicate existing vault notes.
  - Must not regress existing chat runtime, old Inbox watcher behavior, or existing tutor/practice flows.
