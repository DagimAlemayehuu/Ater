# Context Brief

Updated: 2026-07-06T00:00:00+03:00

## Current Objective
- Status: `planned`
- Active change: `unify-source-learning-pipeline`
- Active change path: `openspec/changes/unify-source-learning-pipeline/`
- Git branch: `main`
- Base branch: `main`
- GitHub issue: `#94`

## Agreed Outcome
- Retire the legacy PDF learning pipeline where a user drops PDFs into an Inbox folder and the watcher runs detect -> plan -> confirm batch deployment.
- Keep the new source learning job pipeline as the only user-facing PDF-to-Atomic-Note learning path.
- Make the course/chapter upload workflow primary: open course/chapter hub, upload PDF, generate editable source-grounded roadmap, confirm, start lesson.
- Remove the Agents page Bulk/pipeline tab and leave Oracle as conversations only.
- Preserve useful legacy roadmap-generation behavior by porting it into source job roadmap generation rather than keeping the watcher or old batch deployment.

## Final Decisions
- Source learning jobs are canonical for desktop source learning.
- Legacy process/plan/confirm/watcher endpoints should stop being desktop contracts.
- The RAG watcher is not part of the removal and must remain available for vault indexing/search.
- `ater_queue.db` remains for telemetry, FSRS, tutor sessions, source jobs, coverage, and study history. No destructive database cleanup is planned.
- Existing generated notes and source jobs must remain readable.

## Rejected Options
- Keeping the legacy watcher hidden behind the scenes: rejected because it preserves duplicate state and support confusion.
- Rebranding the Bulk tab as a source-job dashboard: rejected because the desired product workflow is course-first upload, not a second file-processing surface.
- Calling the old `AterService.generate_plan` directly as the new source job planner: rejected as a durable architecture, though orchestration may extract/port useful logic.

## Open Questions
- Whether retired backend routes should be deleted entirely or return an unsupported/410 response after desktop callers are removed.
- Whether the legacy `queue` table should continue to be initialized for compatibility or only left untouched in existing databases.

## Expected Verification
- `pnpm --filter @ater/desktop test`
- `cd apps/api && uv run python -m pytest tests/ -v`
- `pnpm typecheck`
- `pnpm build`
- Manual desktop preview with `pnpm run dev:all`: upload PDF from a course/chapter, inspect/edit roadmap, start lesson, complete recall/remediation/transfer/next-note flow, and verify Agents has no Bulk/pipeline UI.

## Notes For Next Agent
- There are pre-existing uncommitted user changes in desktop academic/layout/settings files and `Vault_Test/Inbox/ater_queue.db`; preserve them.
- No implementation was started during planning.
- Exact next command in a fresh chat: `sdlc-orchestrate unify-source-learning-pipeline`
