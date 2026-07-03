## Current Flow Audit

### Desktop Source Attachment

Before this change, `apps/desktop/src/routes/agents.tsx` copied the selected file into Inbox, registered a durable chat attachment, then manually chained `aterProcess`, `aterGeneratePlan`, and later `aterConfirm` from the UI. That made the UI the orchestration authority for source learning.

The primary source PDF path now creates a backend source learning job through `sidecarApi.createSourceLearningJob()`. The roadmap and warnings shown in chat come from persisted source job state. The legacy confirm loop remains only for older pending sessions without a `sourceJobId`.

### Chat Attachment Promotion

Before this change, `AttachmentManager.promote_to_source_grounded_curriculum()` returned an ephemeral page-ingestion payload. It did not persist job status, objectives, concept graph nodes, or coverage.

Promotion now creates or reuses a `SourceLearningJobService` job in the same local SQLite database used by chat runtime storage. Ask-about-source remains lightweight; explicit promotion creates the durable job.

### Inbox Watcher

The existing `AterQueueManager` queue behavior is preserved. This implementation adds the source job service as an additive persistence layer and does not delete the queue tables or old worker path. Further watcher-specific routing can call `SourceLearningJobService.create_or_resume_from_path()` for PDFs without changing the old queue scan behavior.

## Golden Fixture Decision

`Chapter 3 2024-1.pdf` is present at the repository root in this worktree. Automated tests use it when available and also include deterministic text-equivalent PDF extraction mocks for CI or environments where the binary is absent. This avoids making all tests depend on a binary fixture while still validating the real 48-page PowerPoint-exported chapter locally.

Expected facts covered by tests:

- 48 pages.
- title `Chapter 3`.
- topic `Theory of Consumer Behavior`.
- page 2 objectives for consumer preferences/utility, cardinal vs ordinal utility, indifference curves/properties, budget line, and consumer equilibrium.
- domain route `ECON-MICRO`.

## Verification Report

Commands run on 2026-07-02:

- `apps/api/.venv/bin/pytest apps/api/tests/test_source_grounded_teacher_runtime.py -q` - passed, 7 tests.
- `apps/api/.venv/bin/pytest apps/api/tests/test_source_driven.py apps/api/tests/test_attachments.py -q` - passed, 7 tests.
- `pnpm --filter @ater/desktop test -- src/tests/sidecarApi.test.ts` - passed, 16 tests.
- `apps/api/.venv/bin/python -m py_compile apps/api/src/domains/ater/source_service.py apps/api/src/domains/ater/agents.py apps/api/src/api/routers/ater.py apps/api/src/domains/ater/chat_runtime/attachments.py apps/api/src/domains/ater/tutor_service.py apps/api/src/domains/ater/learner_model_service.py` - passed.
- `pnpm --filter @ater/desktop typecheck` - passed.
- `pnpm --filter @ater/desktop build` - passed with existing Vite dynamic-import/chunk-size warnings.
- `pnpm --filter @ater/desktop lint` - failed on existing repo-wide lint errors, notably `apps/desktop/scripts/benchmark_config_context.js` `no-undef` and `no-empty`; touched files have no lint errors.
- `cd apps/desktop && pnpm exec eslint src/lib/sidecarApi.ts src/routes/agents.tsx src/tests/sidecarApi.test.ts` - passed with warnings only.
- `openspec status --change source-grounded-teacher-runtime` - passed; 4/4 artifacts complete.

Continuation commands run on 2026-07-02:

- `apps/api/.venv/bin/pytest apps/api/tests/test_source_grounded_teacher_runtime.py -q` - passed, 13 tests. Added coverage for old compiler graph seam, schema migration compatibility, source tutor restart/coverage/remediation/transfer/FSRS gate, learner recommendations, API create/status/start/resume/deploy/attachment promotion, weak-model compiler fallback, malformed AI repair/replacement, and vault idempotency/collision protection.
- `apps/api/.venv/bin/pytest apps/api/tests/test_source_driven.py apps/api/tests/test_attachments.py apps/api/tests/test_tutor_runtime.py -q` - passed, 13 tests.
- `apps/api/.venv/bin/python -m py_compile apps/api/src/domains/ater/source_service.py apps/api/src/domains/ater/tutor_service.py apps/api/src/domains/ater/learner_model_service.py apps/api/src/api/routers/ater.py` - passed.
- `pnpm --filter @ater/desktop test -- src/tests/sidecarApi.test.ts src/tests/AterDashboard.test.tsx` - passed, 20 tests.
- `pnpm --filter @ater/desktop typecheck` - passed.
- `pnpm --filter @ater/desktop build` - passed with existing Vite dynamic-import/chunk-size warnings.
- `cd apps/desktop && pnpm exec eslint src/lib/sidecarApi.ts src/routes/agents.tsx src/tests/sidecarApi.test.ts src/tests/AterDashboard.test.tsx` - passed with warnings only.
- `pnpm --filter @ater/desktop lint` - failed on existing repo-wide lint errors, especially `apps/desktop/scripts/benchmark_config_context.js` `no-undef` for `setTimeout`/`console` and `no-empty`. Touched files have no lint errors.

Requirement coverage in this implementation pass:

- Covered: source job schema, idempotent source job creation, PDF audit, objective extraction, source map, deterministic concept graph fallback, dynamic profile precedence, fallback Atomic Note compilation, source job APIs, attachment promotion, source job start, coverage updates, source attach client path, and source job manual checklist.
- Covered in continuation: old compiler graph wrapper, AI-minimized compiler prompt/validation/repair/fallback, source vault deployment/idempotency/collision protection, source tutor restart restore, source-aware remediation, source learner recommendations, source transfer/practice scheduling gate, API integration lifecycle, weak-model backend E2E, and desktop source job regression tests.
- Remaining manual-only gap: live desktop walkthrough with the real desktop shell was not launched in this automated run. Headless backend and desktop tests cover the state transitions, but the human checklist below still needs to be executed before archive.

Archive recommendation: do not archive yet. Manual desktop verification and the remaining deeper runtime/vault tasks must be completed or explicitly waived first.

## Manual Checklist

- Attach repository-root `Chapter 3 2024-1.pdf` from the desktop source flow.
- Confirm source audit shows 48 pages.
- Confirm objectives mention consumer preferences and utility, cardinal vs ordinal utility, indifference curves, budget line, and consumer equilibrium.
- Inspect roadmap concepts and confirm microeconomics routing.
- Start the source tutor.
- Answer one recall question correctly.
- Answer one question incorrectly.
- Inspect source-grounded remediation.
- Verify generated vault notes/source metadata when deployment is enabled.
- Verify coverage state changes after correct and incorrect answers.
- Restart/offline restore: reopen an already-started source-grounded session and confirm backend source/tutor state restores. Gap for this run: not manually verified because no desktop session was launched during automated verification.
