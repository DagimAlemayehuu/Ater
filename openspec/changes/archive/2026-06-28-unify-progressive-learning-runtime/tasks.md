## 1. Runtime Contract And Persistence

- [x] 1.1 Add a progressive learning runtime service/facade in the Ater sidecar that normalizes topic prompts, uploaded sources, and existing Hubs into one session contract.
- [x] 1.2 Define typed runtime response shapes for roadmap preview, current note, locked roadmap items, generated-ahead items, offline readiness, and mastery gate status.
- [x] 1.3 Extend tutor/runtime SQLite persistence to store generated-ahead paths separately from unlocked paths.
- [x] 1.4 Persist current note, completed notes, active unlocks, generated-ahead items, transfer gate outcomes, misconception state, score, session status, and offline readiness.
- [x] 1.5 Add resume/reconciliation logic that restores runtime state after restart and treats existing note files as generated but not automatically unlocked.
- [x] 1.6 Add backend unit tests for generated-vs-unlocked state, session resume, and file-existence-not-unlock behavior using temporary vaults and SQLite databases.

## 2. Teach Anything Integration

- [x] 2.1 Route Ater assistant lesson detection through the unified progressive runtime instead of a separate lesson-flow state machine.
- [x] 2.2 Preserve roadmap preview behavior for "teach me X" prompts while creating a durable runtime session behind the preview.
- [x] 2.3 Update Teach Anything planning so Progressive mode can generate ahead invisibly for offline readiness without unlocking future notes.
- [x] 2.4 Add transfer/application task generation for prompt-only topics without fake source citations.
- [x] 2.5 Ensure "Start Lesson" opens the current runtime note and does not depend on in-memory curriculum cache alone.
- [x] 2.6 Add backend tests for arbitrary topic learning from prompt through roadmap, first note, generated-ahead buffer, and locked future content.

## 3. Source And PDF Progressive Learning

- [x] 3.1 Replace chat PDF upload's full visible batch deployment path with source-grounded progressive runtime session creation.
- [x] 3.2 Keep file copy/import into Inbox or source storage, but make source-driven runtime state the learner-facing path after upload.
- [x] 3.3 Use source-driven planning to create page-grounded roadmap items with source file and page metadata.
- [x] 3.4 Generate the first PDF-backed Atomic Note quickly, then generate future PDF-backed notes in the background subject to TokenGovernor limits.
- [x] 3.5 Preserve source coverage warnings and require user consent before web search augmentation for weak source coverage.
- [x] 3.6 Ensure generated-ahead PDF-backed notes persist citations and remain usable offline once unlocked.
- [x] 3.7 Add backend tests for mock PDF upload, page citations, coverage warnings, generated-ahead source metadata, and offline source-only behavior.

## 4. Tutor Gates, Transfer, And FSRS

- [x] 4.1 Make tutor runtime the authoritative unlock decision point for LearningWorkspace progression.
- [x] 4.2 Add transfer/application gates to Atomic Note mastery evaluation.
- [x] 4.3 Implement domain-aware transfer task types for academic concepts, programming, math, writing/strategy, and physical/external skills.
- [x] 4.4 Keep next note locked when recall passes but transfer remains incomplete.
- [x] 4.5 Generate remediation for failed recall or transfer gates and persist recurring misconceptions.
- [x] 4.6 Create or update local FSRS cards when an Atomic Note is mastered.
- [x] 4.7 Update adaptive learner profile aggregation to include recall, transfer, remediation, misconception recurrence, and unlock outcomes.
- [x] 4.8 Add tutor runtime tests for transfer-gated unlock, failed-transfer remediation, FSRS scheduling, and recurring misconception persistence.

## 5. Learning Object Metadata

- [x] 5.1 Extend learning object metadata to represent generated, unlocked, offline-ready, and locked states without violating Obsidian readability.
- [x] 5.2 Store transfer task definitions in Atomic Note metadata or artifact packs with task type, prompt, grading/evidence criteria, and domain classification.
- [x] 5.3 Add offline readiness checks for note content, embedded quiz, transfer task, lesson variant, artifact pack, and source metadata.
- [x] 5.4 Update validators to reject incomplete offline-ready claims and malformed transfer metadata.
- [x] 5.5 Add tests for learning object generated-vs-unlocked metadata, transfer task metadata, and offline readiness validation.

## 6. Desktop Runtime UI

- [x] 6.1 Update `LearningWorkspace` to load roadmap, current note, unlock state, generated-ahead state, and offline readiness from the unified runtime.
- [x] 6.2 Replace local-only `ater:practice-continue` progression with runtime API calls while preserving responsive UI feedback.
- [x] 6.3 Render roadmap states as current, completed, locked, generated/prepared, and offline-ready without exposing future note bodies.
- [x] 6.4 Hide raw batch logs, queue status, and generated future note content from the main learning flow.
- [x] 6.5 Add a simple non-spoiling background readiness indicator only if it does not reveal locked lesson content.
- [x] 6.6 Ensure Jump to PDF remains available for source-backed current notes with source metadata.
- [x] 6.7 Update desktop tests for LearningWorkspace locked roadmap rendering, generated-ahead invisibility, offline-ready display, and runtime-backed progression.

## 7. Bulk Ingest Separation

- [x] 7.1 Keep the Inbox watcher and pipeline tab available only as explicit bulk ingest or background import.
- [x] 7.2 Rename or relabel relevant UI copy so users understand bulk ingest is not the default learning path.
- [x] 7.3 Ensure main Ater chat PDF upload never requires monitoring the bulk ingest queue to start learning.
- [x] 7.4 Add tests verifying PDF upload uses progressive runtime while Pipeline/Inbox watcher remains available as explicit bulk ingest.

## 8. Teacher Route Removal

- [x] 8.1 Remove `apps/desktop/src/routes/teacher.tsx` and all direct imports or tests that expect a standalone Teacher UI.
- [x] 8.2 Remove `/teacher` as an independent desktop route and ensure supported learning starts from Ater chat or existing learning entry points.
- [x] 8.3 Remove `/api/teacher` router mounting and the independent Teacher sidecar endpoint surface after any reusable behavior is migrated.
- [x] 8.4 Delete or migrate `apps/api/src/domains/teacher/*` tests so teaching behavior is verified through unified Ater runtime tests.
- [x] 8.5 Add regression tests proving `/api/teacher/chat` is not mounted and `/teacher` does not render a separate Teacher interface.

## 9. Existing Hub Continuation

- [x] 9.1 Add runtime entry point for continuing an existing Learning Hub or coursework Hub.
- [x] 9.2 Detect existing Hub curriculum without creating duplicate Hubs.
- [x] 9.3 Reconcile existing generated notes into generated state while requiring runtime/tutor unlock state for access.
- [x] 9.4 Add tests for self-study Hub continuation, coursework Hub continuation, duplicate prevention, and locked roadmap rendering.

## 10. Offline And E2E Verification

- [x] 10.1 Add headless E2E coverage for topic prompt -> roadmap -> first note -> practice -> unlock through unified runtime.
- [x] 10.2 Add headless E2E coverage for mock PDF -> source-grounded roadmap -> first note -> citations -> hidden generated-ahead content.
- [x] 10.3 Add headless E2E coverage for existing Hub -> resume/create runtime session -> locked roadmap.
- [x] 10.4 Add offline restart test proving already-generated unlocked content and embedded practice work without network.
- [x] 10.5 Add offline restart test proving generated-but-locked future content cannot be opened solely because the file exists.
- [x] 10.6 Run targeted backend tests for Ater planner, source service, tutor service, learner model, learning object validation, and route removal.
- [x] 10.7 Run targeted desktop tests for agents route, LearningWorkspace, MarkdownViewer/MiniPracticeUI integration, sidecarApi routing, and absence of Teacher route.
- [x] 10.8 Run `openspec status --change unify-progressive-learning-runtime` and resolve any incomplete artifact or validation failures.
- [x] 10.9 Produce a manual verification checklist covering topic learning, PDF learning, existing Hub continuation, offline reopen, bulk ingest separation, and Teacher route absence.
