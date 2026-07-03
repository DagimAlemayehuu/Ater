## 1. Preflight And Runtime Alignment

- [x] 1.1 Read `AGENTS.md`, `docs/CONTEXT.md`, `docs/SOP.md`, `docs/BACKEND.md`, `docs/FRONTEND.md`, and this change's proposal/design/specs before editing.
- [x] 1.2 Inspect the completed `source-grounded-teacher-runtime` implementation and identify the actual services/APIs to reuse.
- [x] 1.3 Audit current prompt-first learning flow in `assistant.py`, `planner.py`, `agents.tsx`, and `sidecarApi.ts`.

## 2. Tests First

- [x] 2.1 Add backend tests for prompt teacher job creation/resume, diagnostic intake, assumptions, and clarification state.
- [x] 2.2 Add backend tests for synthetic source pack creation, provenance, confidence warnings, and local vault/source preference.
- [x] 2.3 Add backend tests for prompt concept graph validation, dynamic teaching profiles, weak-model planning fallback, and malformed AI handling.
- [x] 2.4 Add tutor/learner tests for prompt job tutor launch, answer handling, remediation, mastery, practice scheduling, and restart restore.
- [x] 2.5 Add API tests for create/status/start/resume prompt teacher jobs.
- [x] 2.6 Add desktop tests for prompt roadmap, Start Learning, backend restore, and no dependency on in-process curriculum cache.

## 3. Prompt Teacher Job Model

- [x] 3.1 Add durable prompt teacher job persistence, reusing source job tables where practical and adding prompt-specific fields where needed.
- [x] 3.2 Persist diagnostic intake, assumptions, clarification questions, synthetic source pack metadata, roadmap, coverage, tutor link, and status.
- [x] 3.3 Implement create/resume/status/start helpers for prompt jobs.

## 4. Diagnostic Intake And Clarification

- [x] 4.1 Implement deterministic prompt classification for learn/study/master/practice intents versus quick explanations.
- [x] 4.2 Implement diagnostic intake schema for goal, level, depth, timeframe, target, prerequisites, rigor, and constraints.
- [x] 4.3 Implement clarification policy: ask one concise question only when ambiguity blocks correctness.
- [x] 4.4 Record assumptions when proceeding without clarification.

## 5. Synthetic Source Pack

- [x] 5.1 Implement synthetic source pack generation with topic, scope, assumptions, outline, snippets, provenance, confidence, and warnings.
- [x] 5.2 Prefer local vault notes, hubs, source jobs, and existing learning objects before model-generated material.
- [x] 5.3 Add deterministic weak-model fallback source packs from domain keywords and roadmap templates.
- [x] 5.4 Ensure synthetic source packs are accepted by the source teacher concept graph/coverage runtime.

## 6. Runtime Reuse

- [x] 6.1 Route prompt source packs into the existing concept graph service.
- [x] 6.2 Reuse dynamic teaching profile selection for every prompt concept.
- [x] 6.3 Reuse AI-minimized Atomic Note compiler and fallback behavior.
- [x] 6.4 Reuse tutor runtime, coverage matrix, learner model, FSRS/practice scheduling, and vault deployment.
- [x] 6.5 Preserve existing Teach Anything outputs through compatibility shims until tests cover the new path.

## 7. APIs And Chat Runtime

- [x] 7.1 Add prompt teacher job create/status/start/resume APIs.
- [x] 7.2 Update chat teaching intent handling to create/resume prompt teacher jobs.
- [x] 7.3 Persist prompt job/tutor metadata on assistant message or conversation state.
- [x] 7.4 Keep quick one-off explanations lightweight and separate from full teacher jobs.

## 8. Desktop Integration

- [x] 8.1 Add typed `sidecarApi` methods for prompt teacher jobs.
- [x] 8.2 Update chat roadmap rendering to use durable prompt job state.
- [x] 8.3 Update Start Learning to open LearningWorkspace from backend prompt job/tutor state.
- [x] 8.4 Show assumptions, warnings, coverage summary, and clarification state in the prompt learning flow.

## 9. Verification

- [x] 9.1 Run targeted backend prompt teacher tests.
- [x] 9.2 Run targeted tutor/learner/source runtime tests affected by prompt synthetic sources.
- [x] 9.3 Run targeted desktop tests.
- [x] 9.4 Run py_compile for touched backend modules.
- [x] 9.5 Run desktop typecheck/build and touched-file ESLint.
- [x] 9.6 Run `openspec status --change teach-anything-teacher-runtime`.
- [x] 9.7 Update implementation notes with commands, results, residual risks, and manual checklist.
