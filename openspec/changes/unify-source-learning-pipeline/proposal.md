## Why

Ater currently has two competing PDF-to-learning pipelines: the legacy Inbox watcher/detect-plan-confirm batch deploy flow and the newer source learning job/tutor runtime flow. This splits roadmap quality, UI entrypoints, queue state, and user expectations; the product should have one canonical course-first upload path where a learner opens a course/chapter, uploads a PDF, reviews a roadmap, and starts learning.

## What Changes

- **BREAKING**: Remove the legacy Ater background Inbox watcher learning pipeline as a user-facing product path.
- **BREAKING**: Remove the Agents page `pipeline`/Bulk tab, queue progress UI, auto-ingest toggle, and file-drop copy that tells the user to place PDFs in an Inbox folder.
- **BREAKING**: Retire the legacy `/api/ater/process`, `/api/ater/plan`, `/api/ater/confirm`, `/api/ater/watcher/toggle`, and queue-status learning endpoints from desktop usage. Backend code may be deleted or quarantined if no remaining tests or runtime paths need it.
- Preserve the new source learning job lifecycle as the only PDF-to-Atomic-Note learning path.
- Move the useful roadmap-generation strengths from the legacy planner into source learning jobs, including academic metadata snapping, domain routing, chunked extraction, coverage-gap auditing, prerequisite mapping, modality classification, topological ordering, chapter grouping, and rate-limit-aware progress reporting.
- Keep the user workflow course-first: in the academic dashboard, the learner goes to a course/chapter hub, uploads a PDF, receives an editable source-grounded roadmap, confirms it, and starts the teacher workspace.
- Keep Oracle conversations as conversations only; source uploads through chat may still create source jobs, but the removed Bulk tab must not remain as a separate file-processing surface.
- Preserve vault safety guarantees from both systems: idempotent deployment, collision protection for user-authored notes, processed PDF movement to `Inbox/generated/<scope>/`, source citations, coverage warnings, and resume behavior.
- Preserve downstream learning behavior: current Atomic Note opens quickly, future notes may generate ahead, recall practice and transfer gates update source-job coverage, remediation remains tied to the tutor runtime, and FSRS scheduling continues.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `source-driven-learning`: Tighten source-driven learning so every user-facing PDF learning entrypoint creates or resumes a source learning job and no longer exposes the legacy Inbox watcher path.
- `source-grounded-teacher-runtime`: Strengthen source job roadmap generation by absorbing useful legacy planner capabilities while keeping the source job/tutor session lifecycle canonical.

## Impact

- **Desktop UI**:
  - `apps/desktop/src/routes/agents.tsx`: remove the `pipeline`/Bulk tab and legacy queue UI paths; keep Oracle conversation history and chat only.
  - `apps/desktop/src/routes/academic-tabs/CoursesTab.tsx`: make course/chapter PDF upload the primary source job entrypoint and preserve roadmap editing/start lesson behavior.
  - `apps/desktop/src/routes/academic-tabs/ProgramTab.tsx` and related academic navigation may need adjustment so hub/PDF panels do not imply the old Inbox workflow.
  - `apps/desktop/src/lib/sidecarApi.ts`: remove or stop exporting legacy watcher/process/plan/confirm calls once no caller remains.
- **FastAPI sidecar**:
  - `apps/api/src/api/routers/ater.py`: remove or quarantine legacy process/plan/confirm/watcher routes from desktop-visible learning flows; keep source job, tutor, practice, SRS, and RAG watcher routes.
  - `apps/api/src/domains/ater/source_service.py`: incorporate the useful legacy planning steps into source job roadmap creation.
  - `apps/api/src/domains/ater/service.py`, `watcher.py`, `deployer.py`, and related legacy tests may be simplified or deleted where they only support the retired watcher pipeline.
- **State/data**:
  - Keep `ater_queue.db` only for remaining telemetry, FSRS, tutor sessions, source learning jobs, coverage, and study history. Remove assumptions that `queue` rows drive learning generation.
  - Existing generated notes and source jobs must remain readable; removal must not delete user vault files.
- **Tests and verification**:
  - Backend tests should compare improved source job roadmap output against legacy strengths using mocked AI where possible.
  - Frontend tests should verify the Agents page no longer shows Bulk/pipeline navigation and that course PDF upload creates a source job.
  - Manual verification must use the desktop dev environment with a course/chapter PDF upload, roadmap review, lesson start, wrong answer remediation, transfer gate, and next-note advance.
