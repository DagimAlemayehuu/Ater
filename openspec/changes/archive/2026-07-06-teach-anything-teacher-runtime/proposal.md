## Why

Ater's prompt-first "Teach Me Anything" mode can currently generate a roadmap and first lesson, but it does not share the same verifiable teacher loop as the new source-grounded runtime. This makes vague-topic learning less reliable, harder to test, and more dependent on weak AI models inventing structure.

This change turns prompt-first teaching into a synthetic-source path that reuses the source-grounded teacher runtime: diagnostic intake, curriculum/source-pack creation, concept graph, dynamic teaching profiles, Atomic Note compiler, tutor session, mastery, remediation, practice, vault deployment, and coverage reporting.

## What Changes

- Add a prompt-first teacher job lifecycle for vague requests like "teach me X" or "teach me X for an exam".
- Convert prompt-first learning into a synthetic source pack before teaching. The source pack may be generated from model knowledge, vault notes, existing hubs, local search, or user-approved external augmentation, but it must be explicit and auditable.
- Reuse the source-grounded teacher runtime contracts from `source-grounded-teacher-runtime` wherever possible: concept graph, teaching profiles, coverage matrix, compiler, tutor session, mastery, remediation, practice scheduling, and vault deployment.
- Add deterministic diagnostic intake before curriculum generation: goal, level, timeframe, depth, constraints, prior knowledge, preferred rigor, and assessment target.
- Add clarification policy for vague prompts: ask only when ambiguity blocks correctness; otherwise use safe defaults and record assumptions.
- Add deterministic curriculum planning constraints: scope, prerequisites, concept graph, coverage targets, sequence, and stopping conditions.
- Add weak/free-model resilience: prompt-first mode must remain useful when AI fails, returns malformed plans, or produces generic content.
- Add UI/API support for creating, inspecting, starting, and resuming prompt-first teacher jobs.
- Add tests covering prompt classification, diagnostic intake, synthetic source pack creation, concept graph, teaching profiles, weak-model fallback, tutor launch, mastery loop, vault deployment, and desktop chat integration.

## Capabilities

### New Capabilities

- `teach-anything-teacher-runtime`: Prompt-first teacher lifecycle that converts vague learning requests into auditable synthetic source packs and then reuses the unified teacher runtime.

### Modified Capabilities

- `teach-anything-planner`: Existing Teach Anything planning must converge into the new prompt teacher job lifecycle instead of remaining a separate roadmap/first-note cache.
- `chatbot-runtime`: Chat learning intents must create/resume prompt teacher jobs and persist tutor/job metadata in durable conversation state.
- `source-grounded-teacher-runtime`: The source teacher runtime must accept synthetic source packs as first-class sources with explicit provenance and confidence.
- `learning-runtime-e2e`: End-to-end verification must cover prompt-first learning through the same runtime as source learning.

## Impact

- Backend domains:
  - `apps/api/src/domains/ater/assistant.py`
  - `apps/api/src/domains/ater/planner.py`
  - `apps/api/src/domains/ater/source_service.py`
  - `apps/api/src/domains/ater/tutor_service.py`
  - `apps/api/src/domains/ater/learner_model_service.py`
  - `apps/api/src/domains/ater/agents.py`
  - `apps/api/src/domains/ater/router.py`
  - `apps/api/src/domains/ater/templates.py`
  - source job/runtime modules added by `source-grounded-teacher-runtime`
- Backend routers:
  - `apps/api/src/api/routers/ater.py`
  - `apps/api/src/api/routers/ai.py`
- Desktop UI:
  - `apps/desktop/src/routes/agents.tsx`
  - `apps/desktop/src/lib/sidecarApi.ts`
  - learning workspace/source-job UI components reused for prompt jobs
- Tests:
  - backend prompt teacher job tests
  - chat runtime tests
  - source runtime synthetic source tests
  - tutor/learner model tests
  - desktop sidecar/UI regression tests
- Constraints:
  - offline-first
  - no live network required for tests
  - no paid/strong model required for tests
  - prompt-first teaching must not bypass coverage, mastery, or dynamic profile rules
