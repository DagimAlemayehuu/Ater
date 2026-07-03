## Implementation Summary

Prompt-first Teach Anything now creates durable prompt teacher jobs through `PromptTeacherJobService`.

The prompt path:

- classifies full learning intents separately from quick one-off explanations
- records diagnostic intake, assumptions, and clarification questions
- builds an auditable synthetic source pack with provenance, snippets, confidence, and warnings
- prefers prior source jobs and local vault notes before deterministic generated material
- persists the prompt job into the existing `source_learning_jobs` runtime tables plus `prompt_teacher_jobs`
- routes synthetic pages through the source concept graph, dynamic teaching profiles, coverage matrix, compiler fallback, tutor runtime, learner model, practice scheduling, and vault deployment paths
- exposes `/api/ater/prompt/jobs` create/status/start/deploy endpoints
- updates assistant streaming and chat metadata persistence so roadmap and tutor state survive conversation restore
- adds desktop `sidecarApi` prompt job methods and chat Start Lesson handling from backend prompt/source job state

## Verification

Commands run on 2026-07-02:

- `apps/api/.venv/bin/pytest apps/api/tests/test_prompt_teacher_runtime.py -q` - passed, 4 tests.
- `apps/api/.venv/bin/pytest apps/api/tests/test_prompt_teacher_runtime.py apps/api/tests/test_assistant.py::test_teach_anything_stream_uses_durable_prompt_teacher_job apps/api/tests/test_streaming.py::test_prompt_teacher_job_metadata_persistence -q` - passed, 6 tests, with existing Pydantic deprecation warnings.
- `apps/api/.venv/bin/pytest apps/api/tests/test_source_grounded_teacher_runtime.py apps/api/tests/test_source_driven.py apps/api/tests/test_attachments.py apps/api/tests/test_tutor_runtime.py -q` - passed, 26 tests.
- `apps/api/.venv/bin/pytest apps/api/tests/test_prompt_teacher_runtime.py apps/api/tests/test_assistant.py::test_teach_anything_stream_uses_durable_prompt_teacher_job apps/api/tests/test_streaming.py::test_prompt_teacher_job_metadata_persistence apps/api/tests/test_source_grounded_teacher_runtime.py apps/api/tests/test_source_driven.py apps/api/tests/test_attachments.py apps/api/tests/test_tutor_runtime.py apps/api/tests/test_learner_model.py -q` - passed, 35 tests, with existing Pydantic deprecation warnings.
- `apps/api/.venv/bin/python -m py_compile apps/api/src/domains/ater/prompt_teacher_service.py apps/api/src/domains/ater/assistant.py apps/api/src/domains/ater/source_service.py apps/api/src/domains/ater/tutor_service.py apps/api/src/domains/ater/learner_model_service.py apps/api/src/domains/ater/chat_runtime/streaming.py apps/api/src/api/routers/ater.py` - passed.
- `pnpm --filter @ater/desktop test -- src/tests/sidecarApi.test.ts` - passed, 17 tests.
- `pnpm --filter @ater/desktop typecheck` - passed.
- `pnpm --filter @ater/desktop build` - passed with existing Vite dynamic-import and chunk-size warnings.
- `cd apps/desktop && pnpm exec eslint src/lib/sidecarApi.ts src/routes/agents.tsx src/tests/sidecarApi.test.ts` - passed with warnings only; no errors.
- `openspec status --change teach-anything-teacher-runtime` - passed; proposal/design/specs/tasks complete.

## Requirement Coverage

- Prompt teacher lifecycle: covered by `test_prompt_teacher_job_creation_resume_diagnostic_and_clarification` and API lifecycle tests.
- Diagnostic intake and clarification: covered for inferred defaults, exam target/timeframe, assumptions, and ambiguous prompt state.
- Synthetic source pack: covered for provenance, confidence, warnings, local vault preference, and source runtime acceptance.
- Runtime reuse: covered by prompt tutor launch, source job tutor session ID, coverage updates, dynamic profiles, remediation path, and practice scheduling.
- Chat persistence: covered by assistant stream test and streaming metadata persistence test.
- Desktop typed client: covered by `sidecarApi.test.ts`.
- Source-grounded prerequisite stability: covered by source/tutor/attachment/learner targeted tests.

## Residual Risks

- Manual desktop walkthrough was not performed in a live Tauri shell during this automated run.
- The UI route test coverage is primarily API/client-level plus typecheck/build; a future focused React test for prompt roadmap rendering would reduce regression risk.
- Synthetic source packs remain lower-confidence when no local evidence exists by design; warnings expose that state instead of pretending external source verification.

## Manual Checklist

- Ask Oracle: `Teach me consumer behavior`.
- Confirm the roadmap appears with assumptions and synthetic-source confidence warnings.
- Confirm no full prompt teacher job is created for a one-off question such as `what is consumer surplus?`.
- Click or type `Start Lesson`.
- Confirm LearningWorkspace opens from backend tutor state and shows a `promptjob_...`/source-job-linked session.
- Answer one prompt tutor question incorrectly and inspect source-grounded remediation.
- Answer one prompt tutor question correctly and pass transfer if available.
- Confirm coverage/mastery state updates.
- Restart the sidecar/desktop and reopen the conversation.
- Confirm prompt roadmap, tutor link, coverage, warnings, and current note restore from durable backend state.

## Archive

Do not archive automatically. This change is ready for user manual verification before archive.
