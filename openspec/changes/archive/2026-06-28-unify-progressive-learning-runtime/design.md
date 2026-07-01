## Context

Ater currently has several learning paths that overlap without sharing one learner-facing contract:

- Ater assistant lesson runtime: `apps/api/src/domains/ater/assistant.py` detects "teach me" prompts and streams a roadmap, then writes a progressive first lesson on "Start Lesson".
- PDF chat upload: `apps/desktop/src/routes/agents.tsx` copies a PDF into Inbox, calls `aterProcess`, calls `aterGeneratePlan`, shows a roadmap, then currently runs `aterConfirm` until all batches are done before opening a learning workspace.
- Pipeline tab / Inbox watcher: `apps/api/src/domains/ater/watcher.py` detects, plans, and deploys all Atomic Notes in batches as a bulk generation workflow.
- LearningWorkspace: `apps/desktop/src/components/intelligence/LearningWorkspace.tsx` displays the current Atomic Note and a locked roadmap, but note unlock is largely client-driven by `ater:practice-continue`.
- Practice/remediation: `MiniPracticeUI` and `usePracticeSession` render embedded `interactive-quiz` blocks, generate remediation when wrong, and record performance.
- Tutor runtime APIs exist for persistence, adaptive questions, consolidation, and advancement, but they are not yet the single authority for the primary LearningWorkspace loop.
- A stale Teacher route still exists in `apps/desktop/src/routes/teacher.tsx` and `/api/teacher/chat`, while `App.tsx` redirects `/teacher` to `/agents?tab=oracle`.

The desired product shape is one mastery-gated runtime for all learning: topic prompts, PDFs, and existing Hubs all become a roadmap, one current lesson, hidden background generation, Proving Grounds, remediation, transfer/application, durable unlocks, and FSRS scheduling.

Constraints:

- Offline-first remains non-negotiable. Core reading, practice, review, and already-generated content must work without internet.
- ONNX local embeddings remain the only embedding path.
- Atomic Notes must preserve the 4-section note contract and Obsidian-compatible frontmatter invariants.
- The desktop UI must stay within the Ater design system and not expose internal pipeline complexity.
- Existing vaults, Hubs, generated notes, and old Inbox workflows must not be destructively migrated.

## Goals / Non-Goals

**Goals:**

- Route all learner-facing learning flows through one unified progressive runtime.
- Preserve hidden generated-ahead content for offline readiness while exposing only the current unlocked frontier.
- Make tutor runtime the durable authority for mastery state, unlock decisions, remediation outcomes, transfer gates, and session resumption.
- Convert PDF upload into source-grounded progressive learning with page citations and Jump to PDF support.
- Keep the old Inbox watcher as a power-user bulk ingest mode, but remove it from the default learner experience.
- Remove the stale Teacher route and sidecar Teacher API as an independent learning path.
- Add testable contracts for arbitrary-topic learning, academic/PDF learning, existing Hub continuation, offline reopening, route removal, and background generation invisibility.

**Non-Goals:**

- This change does not replace the Atomic Note compiler contract in `Ater.md`.
- This change does not add cloud embeddings or new remote persistence requirements.
- This change does not remove the old Inbox watcher entirely; it demotes it to an explicit bulk-ingest mode.
- This change does not require computer vision or external-device verification for physical skills. Physical-skill mastery can use self-report, checklists, drills, and reflection unless a later change adds richer evidence capture.
- This change does not redesign the entire desktop shell or visual identity.

## Decisions

### Decision 1: Introduce a single Progressive Learning Runtime facade

Create one sidecar-level runtime facade, implemented near existing Ater learning services, that normalizes entry points into the same session model:

- topic prompt
- uploaded PDF/text/source bundle
- existing Learning Hub or coursework Hub

The facade should expose typed endpoints through `/api/ater/learning/...` or equivalent typed Tauri IPC wrappers. It should own:

- session creation
- roadmap preview
- current note selection
- generated-ahead work scheduling
- mastery-gate evaluation
- unlock decisions
- offline readiness status
- resume state

Rationale: the current system has the right parts but no single contract. A facade reduces product fragmentation and gives UI one path to render.

Alternatives considered:

- Keep separate flows and harmonize UI only. Rejected because learning state would remain split between chat localStorage, tutor DB, watcher DB, and generated files.
- Replace all old services at once. Rejected because AterService, source planning, tutor runtime, and compiler already contain useful behavior and should be orchestrated, not rewritten.

### Decision 2: Generated-ahead content is hidden until unlocked

The runtime should maintain two separate concepts:

- `generated`: content exists locally and may be used for offline readiness
- `unlocked`: learner is allowed to view and practice this content

The LearningWorkspace and roadmap UI must never treat generated future notes as available merely because files exist. Locked future content can appear as a roadmap item without opening the full note.

Rationale: background generation solves waiting and offline readiness, but exposing all generated content recreates the old "huge vault pile" learning problem.

Alternatives considered:

- Generate only on unlock. Rejected because offline readiness and perceived responsiveness suffer.
- Generate everything and expose everything. Rejected because it weakens mastery-gated progression and increases cognitive load.

### Decision 3: Use tutor runtime as the durable progression authority

Move unlock state out of transient React/localStorage event-only behavior into durable sidecar-backed tutor session state. The client may optimistically update after a pass, but the sidecar must persist:

- current note path
- completed notes
- active unlocked notes
- generated-ahead notes
- transfer gate outcomes
- misconception state
- score/calibration state
- offline readiness state

Rationale: a learning system must survive app restarts and must not depend on browser event state for core progression.

Alternatives considered:

- Keep `LearningWorkspace` as the progression authority. Rejected because it cannot reliably coordinate offline generation, existing Hub continuation, and long-running tutor state across sessions.

### Decision 4: Make transfer/application a required mastery dimension

Each Atomic Note learning object must include at least one transfer/application task appropriate to the domain. Examples:

- academic concept: exam-style application or case diagnosis
- programming concept: trace/debug/implement task
- math concept: worked problem with variation
- physical skill: drill checklist, self-assessment, or scenario analysis
- writing/strategy: compare, decide, justify, or create

Passing ordinary recall is insufficient to unlock next content unless a low-risk configuration explicitly disables transfer gates.

Rationale: real learning requires applying the idea in a new context. Recall-only systems plateau.

Alternatives considered:

- Use multiple-choice plus writing only. Rejected because it is not enough for broad "learn anything" outcomes.

### Decision 5: PDF learning uses source-grounded progressive sessions

PDF upload should no longer show bulk generation as the main flow. It should:

1. copy source into Inbox or a source area,
2. parse and plan a source-grounded curriculum,
3. show a roadmap,
4. open the first note quickly,
5. generate ahead in the background,
6. keep citations and Jump to PDF controls available,
7. unlock content through mastery gates.

Rationale: PDFs are learning sources, not just note-generation inputs. The user wants to start learning before the full source is converted.

Alternatives considered:

- Keep chat PDF upload as a wrapper around `aterConfirm` until all batches complete. Rejected because this blocks the progressive learning experience and exposes the old workflow model.

### Decision 6: Remove Teacher as a separate route and API

Delete or fully retire the standalone Teacher route and sidecar Teacher API from the learner-facing surface. Any reusable code or ideas must be merged into the unified runtime before removal. `/teacher` should not remain a user-accessible route.

Rationale: two teaching agents create product confusion and implementation drift. The current App already redirects `/teacher`, which signals the route is stale.

Alternatives considered:

- Keep Teacher hidden. Rejected because hidden route/API code continues to attract drift and duplicate behavior.

### Decision 7: Preserve Inbox watcher as explicit bulk ingest

The old Inbox watcher remains available for power users who explicitly want background bulk note generation, but it must be labeled and treated as bulk ingest, not the default learning path.

Rationale: bulk generation can still be useful for vault import, but it is not the best default learning workflow.

Alternatives considered:

- Remove watcher completely. Rejected because it is useful for offline vault preparation and may be depended on by existing workflows.

## Risks / Trade-offs

- Hidden background generation may consume tokens unexpectedly -> Mitigation: enforce feature locks, credit deduction, clear settings, rate-limit through TokenGovernor, and expose non-intrusive background status without lesson spoilers.
- Generated/unlocked state may drift from files on disk -> Mitigation: persist state in tutor/runtime DB and reconcile file existence on resume without auto-unlocking.
- PDF source planning may produce weak or incorrect coverage -> Mitigation: preserve source coverage warnings, page citations, and user consent for web augmentation.
- Removing Teacher route could break tests or links -> Mitigation: add explicit route removal tests and migrate any reusable behavior before deletion.
- Transfer gates can make learning feel slower -> Mitigation: keep tasks short, domain-aware, and clearly tied to unlock; allow configured review/cram modes to relax the gate.
- Physical skills cannot be objectively verified from text alone -> Mitigation: use checklists, drills, self-report, reflection, and scenario tasks now; leave video/sensor evidence for future work.
- Offline readiness and hidden generation complicate UI state -> Mitigation: show only simple states: current, locked, completed, preparing offline; never expose batch logs in the main learning flow.

## Migration Plan

1. Add unified runtime contracts and tests around existing services before changing the UI.
2. Introduce durable generated-vs-unlocked state in tutor/runtime persistence.
3. Route Teach Anything and PDF upload through the unified runtime facade while keeping existing endpoints available internally during transition.
4. Update LearningWorkspace to load state from the runtime and delegate unlock decisions to sidecar APIs.
5. Demote Pipeline/Inbox watcher UI to explicit bulk ingest language.
6. Remove `/teacher` route and `/api/teacher` API after parity behavior is covered by unified runtime tests.
7. Add migration/reconciliation logic for existing generated Hubs and notes so they can resume as existing Hub learning sessions without rewriting vault content.
8. Verify offline reopen: start learning online, allow background generation, quit sidecar/app, reopen offline, continue already-generated unlocked/current content.

Rollback strategy:

- Keep old AterService detect/plan/confirm and watcher paths intact until the unified runtime passes topic/PDF/existing-Hub E2E tests.
- If runtime routing fails, temporarily route chat PDF upload back to old detect-plan-confirm flow while keeping Teacher route removed only after tests prove no user-facing dependency remains.

## Open Questions

- What is the default generated-ahead buffer: next 3 notes, next chapter, or token-budget-dependent?
- Should transfer gates be mandatory for every note, or mandatory at least once per chapter with lighter checks per note?
- Should the UI expose a tiny "Ready offline" indicator, or keep offline preparation entirely invisible?
- How should bulk Inbox ingestion results be offered as a future progressive session without implying that all generated notes are unlocked?
