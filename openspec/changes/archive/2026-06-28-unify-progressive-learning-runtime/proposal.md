## Why

Ater currently has overlapping learning flows: the Ater assistant lesson runtime, a stale Teacher route, the older Inbox PDF batch pipeline, source-driven planning, tutor sessions, and embedded Atomic Note quizzes. This creates product confusion and prevents Ater from becoming a single high-quality system for learning academics and arbitrary external topics through mastery rather than passive note generation.

The opportunity is to unify all learning entry points into one progressive, mastery-gated runtime where Ater plans the full path, generates ahead invisibly for offline readiness, shows only the current learning frontier, and forces read -> prove -> remediate -> transfer -> unlock loops.

## What Changes

- Add a unified progressive learning runtime that accepts topic prompts, uploaded PDFs, and existing Hubs as entry points into the same learner-facing flow.
- Make hidden background generation the default for learning sessions: Ater may generate upcoming Atomic Notes, quizzes, lesson variants, artifact packs, and source metadata in the background, but generated future content remains locked until mastery gates are passed.
- Preserve offline-first learning by keeping a configurable ahead-of-current buffer of generated content available locally while presenting only the current lesson and locked roadmap to the user.
- Extend the current learning loop from recall-only into mastery: each Atomic Note must support explanation, active recall, remediation, transfer/application, FSRS scheduling, and unlock decisions.
- Make PDF upload from chat behave like source-grounded progressive learning instead of visible full-pipeline deployment. The user sees a roadmap and current lesson while source-grounded notes continue preparing invisibly.
- Keep the old Inbox watcher / bulk PDF generation pipeline only as a power-user background ingestion mode, not as the primary learner experience.
- **BREAKING** Remove the stale Teacher route and Teacher sidecar surface as a separate user-facing learning flow. `/teacher` must no longer exist as an independent route or implementation path; any reusable ideas must be merged into the unified runtime before deletion.
- Introduce durable runtime state so progress, locks, offline generated buffers, misconceptions, transfer attempts, and FSRS scheduling survive app restart.
- Add verification coverage for the unified flow across topic prompt, PDF source, and existing Hub entry points.

## Capabilities

### New Capabilities
- `progressive-learning-runtime`: Defines the unified learner-facing runtime contract for entry-point normalization, hidden background generation, mastery gates, locked roadmap presentation, offline buffer behavior, and Teacher route removal.

### Modified Capabilities
- `teach-anything-planner`: Teach Anything planning must feed the unified runtime and support hidden generated-ahead buffers without exposing unlocked content prematurely.
- `source-driven-learning`: PDF/source workflows must become progressive, source-grounded learning sessions with page citations, hidden background generation, and Jump to PDF support.
- `tutor-runtime`: Tutor sessions must own durable mastery gates, transfer/application checks, remediation, unlock decisions, and session persistence for the unified runtime.
- `learning-object-model`: Learning objects must represent generated-vs-unlocked state, transfer tasks, mastery gates, offline readiness state, and source grounding without violating Atomic Note invariants.
- `adaptive-learner-model`: Learner profiles must incorporate mastery gate outcomes, transfer-task results, misconception recurrence, and next-note recommendations for arbitrary topics.
- `learning-runtime-e2e`: End-to-end coverage must verify topic, PDF, and existing Hub flows through the same runtime, including offline reopening and stale Teacher route removal.

## Impact

- Frontend routes and navigation:
  - `apps/desktop/src/App.tsx`
  - `apps/desktop/src/routes/agents.tsx`
  - `apps/desktop/src/routes/teacher.tsx`
  - `apps/desktop/src/components/intelligence/LearningWorkspace.tsx`
  - `apps/desktop/src/components/obsidian/MarkdownViewer.tsx`
  - `apps/desktop/src/components/MiniPracticeUI.tsx`
  - `apps/desktop/src/hooks/usePracticeSession.ts`
  - `apps/desktop/src/lib/sidecarApi.ts`
- Tauri IPC and sidecar proxy commands:
  - `apps/desktop/src-tauri/src/commands.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
- FastAPI sidecar services:
  - `apps/api/src/api/routers/ater.py`
  - `apps/api/src/domains/ater/assistant.py`
  - `apps/api/src/domains/ater/planner.py`
  - `apps/api/src/domains/ater/source_service.py`
  - `apps/api/src/domains/ater/tutor_service.py`
  - `apps/api/src/domains/ater/learner_model_service.py`
  - `apps/api/src/domains/ater/learning_object.py`
  - `apps/api/src/domains/ater/service.py`
  - `apps/api/src/domains/ater/watcher.py`
  - `apps/api/src/domains/teacher/*`
- Local storage and persistence:
  - local SQLite tutor/session tables
  - Atomic Note, Hub, Chapter, lesson variant, artifact pack, and source metadata frontmatter
  - existing Obsidian Vault files must remain readable and migratable
- Verification:
  - desktop Vitest coverage for routing, hidden generated-ahead UI, and LearningWorkspace behavior
  - backend pytest coverage for planning, source-grounded progressive sessions, tutor gates, and route removal
  - E2E/manual checklist for topic prompt, PDF upload, existing Hub continuation, offline reopen, and old Teacher route absence
