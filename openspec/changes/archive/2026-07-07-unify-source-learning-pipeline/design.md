## Context

Ater has two PDF learning paths that overlap but do not share the same product contract.

The legacy path is the Inbox watcher and batch deploy system. It watches an Inbox folder, records files in `ater_queue.db.queue`, calls `AterService.detect_curriculum`, `AterService.generate_plan`, then repeatedly calls `AterService.confirm_plan` to deploy Atomic Notes and a hub in batches. Its strengths are academic metadata detection, course/hub snapping, chunked concept extraction, domain routing, coverage verifier pass, prerequisite mapping, modality classification, topological sorting, chapter grouping, retries, batching, and detailed status updates. Its weaknesses are that it is file-system driven, exposes raw batch mechanics to the user, competes with the new source job runtime, and does not naturally map to mastery-gated learning.

The newer path is the source learning job system. It creates durable source jobs, audits extraction, builds source map/objective rows, builds a source-grounded concept graph, writes coverage rows, starts a tutor session, deploys the current note, supports roadmap editing, and drives recall, remediation, transfer gates, FSRS scheduling, and next-note unlocking. Its weakness is roadmap quality in some cases compared with the legacy planner.

The target system keeps the source job lifecycle and ports useful legacy planning behavior into that lifecycle. The learner-facing entrypoint becomes course-first: course/chapter hub, upload PDF, review roadmap, start learning.

## Goals / Non-Goals

**Goals:**

- Make source learning jobs the only user-facing PDF-to-learning pipeline.
- Remove the Agents page Bulk/pipeline tab and all visible Inbox watcher learning controls.
- Preserve Oracle conversations as conversations, including source attachment promotion into source jobs.
- Retire desktop usage of legacy process/plan/confirm/watcher endpoints.
- Improve source job roadmap generation by porting legacy planner strengths that are still valuable.
- Preserve source job coverage, tutor, remediation, transfer, FSRS, deployment idempotency, and PDF archival behavior.
- Preserve existing user vault files and existing source jobs.

**Non-Goals:**

- Do not remove the RAG vault watcher used for search/index sync.
- Do not delete study telemetry, FSRS, tutor session, source job, or coverage tables from `ater_queue.db`.
- Do not redesign the entire academic dashboard visual system.
- Do not introduce cloud embeddings or a new database.
- Do not require the user to manually place PDFs into an Inbox folder.

## Decisions

### Decision 1: Source jobs become the canonical learning lifecycle

All PDF learning actions will create or resume a source learning job. The desktop must not call legacy `/ater/process`, `/ater/plan`, or `/ater/confirm` to create learning roadmaps or notes.

Alternatives considered:

- Keep both systems and hide the old one. Rejected because hidden code paths still create divergent bugs, queue state, and user support confusion.
- Rewire the watcher to create source jobs. Rejected for the product surface because the desired workflow is course-first upload, not folder automation. Internal helper code can be reused, but the watcher should not be a user-facing learning path.

### Decision 2: Port planner strengths, not the batch pipeline

Legacy planning logic worth preserving should move into source job creation or reusable planner helpers: academic metadata snapping, domain routing, chunking, coverage gap detection, concept reduction, prerequisite mapping, modality classification, topological ordering, chapter grouping, and structured progress.

Alternatives considered:

- Call `AterService.generate_plan` inside `SourceLearningJobService`. Rejected unless used only as a temporary migration helper, because it would keep the old session model and batch metadata alive.
- Keep the current source graph unchanged. Rejected because the user is already seeing roadmap quality issues.

### Decision 3: Remove Bulk/pipeline UI from Agents

The Agents page should default to conversations only. Source upload in chat remains allowed only when it creates a source job and returns a roadmap/start-learning action in the conversation.

Alternatives considered:

- Rename Bulk to Source Jobs. Rejected because the academic course-first flow should be the primary PDF learning surface, and the Agents page should not become a second dashboard.

### Decision 4: Keep data, remove generation ownership

`ater_queue.db` remains for telemetry, FSRS, tutor sessions, source learning jobs, coverage, and study history. The legacy `queue` table should no longer own learning generation state. Existing databases must not be destructively migrated just to remove a UI path.

Alternatives considered:

- Drop the queue table immediately. Rejected because local databases in user vaults may still contain history or older clients may have written rows. Cleanup can be non-destructive.

## Risks / Trade-offs

- Legacy planner code is entangled with `AterService` sessions and deployer assumptions -> Mitigate by extracting reusable planner functions or porting behavior into `source_service.py` with backend tests instead of calling old endpoints from the UI.
- Removing endpoints too aggressively can break tests or hidden chat paths -> Mitigate by first removing desktop callers, then delete/quarantine backend routes once `rg` proves no runtime caller remains.
- Existing uncommitted academic UI changes may conflict with implementation -> Mitigate by reading current files carefully during orchestration and preserving user edits.
- Roadmap quality can regress if mocked tests only validate shape -> Mitigate with a golden fixture expectation around economics concepts and a weak-model/fallback test.
- Source job creation may become slower if too much legacy planning is ported at once -> Mitigate by keeping current fast deterministic graph path and using expensive AI refinement as bounded/optional with progress state.
- Removing Auto-Ingest may surprise users who used folder drops -> Mitigate with a clear course upload path and no destructive deletion of files already in Inbox.

## Migration Plan

1. Audit all desktop callers of legacy Ater process/plan/confirm/watcher APIs.
2. Remove Agents `pipeline`/Bulk navigation and queue UI, leaving conversation history and chat as the only Agents page surface.
3. Ensure course/chapter upload uses `createAcademicChapterHub`, `aterInboxUpload`, `createSourceLearningJob`, roadmap editing, and `startSourceLearningJob`.
4. Port legacy roadmap strengths into source job planning behind source job APIs.
5. Remove or quarantine legacy watcher and process/plan/confirm routes after callers and tests are updated.
6. Preserve existing source job, tutor, SRS, telemetry, and study history database behavior.
7. Verify with backend unit tests, frontend tests, desktop manual flow, and build/typecheck gates.

Rollback strategy: keep the change in one branch and revert the branch if source job creation or course upload breaks. Do not ship destructive DB migrations as part of this change.

## Open Questions

- Whether backend legacy routes should return `410 Gone` or be deleted entirely once desktop callers are gone. Default implementation should prefer deletion/quarantine if tests confirm no external contract depends on them.
- Whether the old `queue` table should remain initialized for compatibility or be created lazily only when telemetry/SRS tables are initialized. Default implementation should avoid destructive schema changes.
