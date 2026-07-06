## 1. Legacy Surface Audit

- [ ] 1.1 Search desktop, Tauri, and sidecar code for legacy learning calls: `aterProcess`, `aterGeneratePlan`, `aterConfirm`, `aterWatcherToggle`, `aterQueueStatus`, `/api/ater/process`, `/api/ater/plan`, `/api/ater/confirm`, `/api/ater/watcher/toggle`, and queue status usage.
- [ ] 1.2 Identify remaining legitimate non-learning uses of `ater_queue.db` for telemetry, FSRS, tutor sessions, source jobs, coverage, and study history so they are preserved.
- [ ] 1.3 Record any active uncommitted user changes in touched desktop academic/Agents files and preserve them during edits.

## 2. Desktop UI Consolidation

- [ ] 2.1 Remove the Agents page `pipeline`/Bulk tab selection and route-param behavior from `apps/desktop/src/routes/agents.tsx`.
- [ ] 2.2 Remove queue, auto-ingest, planned batches, Inbox folder drop, and legacy process/plan/confirm controls from the Agents page while leaving Oracle conversations, attachments, runtime panels, and source job chat promotion intact.
- [ ] 2.3 Update Agents sidebar/header behavior so only conversation history and chat controls remain.
- [ ] 2.4 Ensure academic course/chapter PDF upload remains the primary path: `createAcademicChapterHub` -> `aterInboxUpload` -> `createSourceLearningJob` -> editable roadmap -> `startSourceLearningJob`.
- [ ] 2.5 Remove or update Program/Hubs/PDF panels that imply PDFs should be dropped into an Inbox folder or processed by the legacy watcher.

## 3. API Client and Tauri Cleanup

- [ ] 3.1 Remove desktop API exports or mark internal-only any functions that no longer have callers: `aterProcess`, `aterGeneratePlan`, `aterConfirm`, `aterWatcherToggle`, `aterQueueStatus`, and legacy generated/inbox queue helpers if unused.
- [ ] 3.2 Remove Tauri command registrations and command functions for retired desktop-visible learning paths once no frontend caller remains.
- [ ] 3.3 Keep source job, tutor, practice, SRS, study history, RAG watcher, and vault file commands working.

## 4. Source Job Roadmap Upgrade

- [ ] 4.1 Compare legacy `AterService.generate_plan` roadmap behavior with `SourceLearningJobService.create_or_resume_from_path` and list reusable steps to port.
- [ ] 4.2 Add source job academic metadata snapping from supplied placement and existing vault records where missing or inconsistent.
- [ ] 4.3 Improve source job concept generation/refinement with chunk-aware extraction or bounded AI refinement for large PDFs.
- [ ] 4.4 Add or strengthen coverage-gap restoration so required source objectives are represented in the roadmap or reported as unresolved warnings.
- [ ] 4.5 Add prerequisite mapping, topological ordering, modality classification, and chapter grouping to source job roadmap finalization where not already equivalent.
- [ ] 4.6 Preserve deterministic fallback behavior and honest warnings when AI refinement fails.

## 5. Backend Legacy Retirement

- [ ] 5.1 Remove or quarantine `/api/ater/process`, `/api/ater/plan`, `/api/ater/confirm`, `/api/ater/watcher/toggle`, and queue-status learning routes after all callers are removed.
- [ ] 5.2 Delete or isolate `AterQueueManager` watcher startup for learning generation without affecting RAG watcher behavior.
- [ ] 5.3 Remove legacy batch deployment tests that only assert retired behavior, and replace them with source job roadmap/deployment tests where needed.
- [ ] 5.4 Ensure processed PDFs still move to `Inbox/generated/<scope>/` through source job deployment, not watcher completion.

## 6. Tests

- [ ] 6.1 Add/update backend tests for course/chapter source job creation with placement metadata and parent hub path.
- [ ] 6.2 Add/update backend tests proving source job roadmap generation includes legacy-strength concepts for representative academic PDFs using mocked AI where possible.
- [ ] 6.3 Add/update backend tests for weak/malformed AI fallback preserving deterministic source-grounded roadmap and warnings.
- [ ] 6.4 Add/update frontend tests proving Agents no longer exposes Bulk/pipeline UI or auto-ingest controls.
- [ ] 6.5 Add/update frontend tests proving course/chapter upload creates a source job and shows editable roadmap/start lesson flow.
- [ ] 6.6 Update sidecar API tests to remove expected calls to retired legacy learning endpoints and keep source job API tests.

## 7. Verification

- [ ] 7.1 Run `pnpm --filter @ater/desktop test`.
- [ ] 7.2 Run `cd apps/api && uv run python -m pytest tests/ -v` or the narrowed backend pytest target first, then the full backend suite.
- [ ] 7.3 Run `pnpm typecheck`.
- [ ] 7.4 Run `pnpm build`.
- [ ] 7.5 Manually preview with `pnpm run dev:all` and verify: open a course, create/select chapter hub, upload a PDF, inspect roadmap, edit a roadmap title, start lesson, answer one Proving Grounds question correctly, answer one incorrectly, complete remediation, pass/fail transfer gate, and advance to next note.
- [ ] 7.6 Manually verify Agents/Oracle page has conversations only and no Bulk/pipeline/auto-ingest queue surface.

## 8. Documentation and State

- [ ] 8.1 Update relevant docs/spec references that still describe the legacy watcher as a learning pipeline.
- [ ] 8.2 Record any intentional backend compatibility leftovers, such as non-destructive retention of `queue` table schema.
- [ ] 8.3 Sync OpenSpec specs after implementation and archive only after verification and integration decisions are complete.
