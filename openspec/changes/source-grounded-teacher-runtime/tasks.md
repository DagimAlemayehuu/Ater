## 1. Preflight And Current-State Audit

- [x] 1.1 Read `AGENTS.md`, `docs/CONTEXT.md`, `docs/SOP.md`, `docs/BACKEND.md`, `docs/FRONTEND.md`, `docs/ARCHITECTURE.md`, and this change's `proposal.md`, `design.md`, and all `specs/**/spec.md` files before editing runtime code.
- [x] 1.2 Inspect the current implementations of `apps/desktop/src/routes/agents.tsx`, `apps/desktop/src/lib/sidecarApi.ts`, `apps/api/src/api/routers/ater.py`, `apps/api/src/api/routers/ai.py`, `apps/api/src/domains/ater/source_service.py`, `service.py`, `watcher.py`, `tutor_service.py`, `agents.py`, `router.py`, `templates.py`, `validator.py`, `deployer.py`, and `chat_runtime/attachments.py`.
- [x] 1.3 Record the current source attachment, chat attachment promotion, and Inbox watcher flows in implementation notes so later edits preserve unrelated behavior.
- [x] 1.4 Confirm whether `Chapter 3 2024-1.pdf` will be committed as a binary fixture or represented by a deterministic extracted-text fixture; document the decision in the implementation notes and tests.

## 2. Test Fixtures And Baseline Failing Tests

- [x] 2.1 Add or identify a golden source fixture for `Chapter 3 2024-1.pdf` with expected facts: 48 pages, title `Chapter 3`, topic `Theory of Consumer Behavior`, page 2 objectives, and `ECON-MICRO` domain routing.
- [x] 2.2 Add backend tests for PDF extraction audit covering page count, per-page text lengths, empty/low-text warnings, and page 2 objective visibility.
- [x] 2.3 Add backend tests for objective extraction and source map coverage targets for consumer preferences/utility, cardinal vs ordinal utility, indifference curves/properties, budget line, and consumer equilibrium.
- [x] 2.4 Add backend tests for concept graph invariants: required concepts present, objective-to-concept mapping, source-page evidence, acyclic prerequisite ordering, and domain drift rejection.
- [x] 2.5 Add backend tests for teaching profile resolution across `ECON-MICRO` quantitative/comparative/qualitative concepts plus at least one biology and one CS regression case.
- [x] 2.6 Add backend compiler tests for source graph node input, deterministic note structure, invalid citation rejection, malformed AI repair/replacement, and AI failure fallback.
- [x] 2.7 Add tutor runtime tests for source-job-linked sessions, coverage updates on correct/incorrect answers, remediation state, transfer pass, practice scheduling, and restart restore.
- [x] 2.8 Add adaptive learner model tests for source-grounded mastery telemetry, source objective weakness, transfer weakness, and recurring misconception grouping.
- [x] 2.9 Add API integration tests for source job create/status/start/resume and chat attachment promotion into a source job.
- [x] 2.10 Add desktop client tests verifying source attachment calls the unified source job API and no longer requires the UI to manually chain `aterProcess`, `aterGeneratePlan`, and `aterConfirm` as the primary source learning path.

## 3. Source Job Data Model And Persistence

- [x] 3.1 Add additive local SQLite schema initialization for source learning jobs, source pages, source audit warnings, source map sections, source objectives, concept graph nodes, concept graph edges, teaching profiles, coverage matrix rows, source job errors, and source job tutor links.
- [x] 3.2 Implement idempotent job identity/versioning for source files using stable file path/content metadata without duplicating jobs on rerun.
- [x] 3.3 Implement persistence helpers for creating, loading, updating, resuming, failing, and completing source learning jobs.
- [x] 3.4 Implement persistence helpers for coverage matrix updates by objective, concept, note, tutor answer, transfer gate, remediation, practice scheduling, and vault deployment.
- [x] 3.5 Add migration/backward-compatibility tests proving existing queue/runtime database initialization still works.

## 4. Source Intake, Audit, And Source Map

- [x] 4.1 Implement a deterministic source intake service that wraps `load_pdf_robust` and records source metadata, page count, per-page content, text lengths, and weak extraction warnings.
- [x] 4.2 Implement slide/PPT-exported PDF classification heuristics and low-text/diagram-heavy warnings without requiring AI.
- [x] 4.3 Implement objective extraction for explicit objective pages using deterministic heading/bullet detection with optional AI fallback only when deterministic extraction fails.
- [x] 4.4 Implement source map sectioning that keeps source file and page citations attached to every section.
- [x] 4.5 Ensure high-severity extraction/source warnings block false source completion and are exposed through job status.

## 5. Concept Graph And Coverage Targets

- [x] 5.1 Wrap or extract the old compiler's chunking, partial concept extraction, concept reduction, source-page anchoring, and prerequisite mapping into a reusable concept graph service.
- [x] 5.2 Add deterministic fallback concept extraction for weak-model/no-AI conditions using source objectives, headings, keyword anchors, and source page spans.
- [x] 5.3 Enforce graph invariants in code: every accepted node has source evidence or unresolved-source warning, objective coverage is explicit, graph is acyclic, and teaching order respects prerequisites/page order.
- [x] 5.4 Add domain drift checks for the golden PDF so macroeconomics, central banking, exchange rates, programming, and unrelated biology concepts are rejected or flagged.
- [x] 5.5 Persist concept graph nodes/edges and initial coverage rows on the source job.

## 6. Dynamic Teaching Profiles

- [x] 6.1 Update persona/profile resolution so `DYNAMIC_DOMAIN_MATRIX[mode][modality]` is used before falling back to `DOMAIN_MATRIX + UNIVERSAL_MODALITY_MATRIX`.
- [x] 6.2 Return a structured teaching profile containing persona, headings, artifact type, walkthrough, question modes, sanity checks, L3 law, prohibitions, and source-compatible artifact constraints.
- [x] 6.3 Implement deterministic modality classification fallback for source concepts, including economics-specific signals for utility, budget line, equilibrium, comparison, and procedure concepts.
- [x] 6.4 Persist selected teaching profiles per concept graph node.
- [x] 6.5 Verify `ECON-MICRO` quantitative profiles forbid programming artifacts and prefer LaTeX, Markdown tables, or ASCII graphs.

## 7. AI-Minimized Atomic Note Compiler Service

- [x] 7.1 Create or extract a source-grounded Atomic Note compilation service that accepts concept graph node, teaching profile, source excerpts, prerequisites, and source job metadata.
- [x] 7.2 Ensure deterministic code owns frontmatter, headings, section plan, source citations, artifact constraints, quiz schema, retry policy, fallback metadata, and deployment path.
- [x] 7.3 Restrict AI prompts to source-aligned prose, examples, artifacts within constraints, questions, and remediation payloads.
- [x] 7.4 Validate generated content for required Atomic Note sections, valid source citations, parseable quiz block, profile-compatible artifacts, forbidden domain drift, and no internal prompt leakage.
- [x] 7.5 Implement deterministic repair or replacement for malformed sections, invalid quiz JSON, invalid citations, forbidden artifacts, and AI timeouts/rate limits.
- [x] 7.6 Preserve existing Atomic Note compiler behavior and old generated notes where possible through compatibility tests.

## 8. Vault Deployment And Idempotency

- [x] 8.1 Route source job deployment through existing vault conventions for Hub, Chapter files, Atomic Notes, lessons, artifacts, source metadata, and source page citations.
- [x] 8.2 Implement idempotency rules for reruns: reuse, update, skip, or flag collisions deterministically.
- [x] 8.3 Protect user-authored existing notes by detecting collisions and recording a review-required state instead of overwriting.
- [x] 8.4 Update coverage rows when notes, lessons, artifacts, and hub/chapter files are deployed.
- [x] 8.5 Add tests for rerun behavior, generated note frontmatter, valid links, and user-authored note collision handling.

## 9. Source Job APIs And Compatibility Shims

- [x] 9.1 Add API endpoints to create/resume a source job from file path, Inbox file, or chat attachment ID.
- [x] 9.2 Add API endpoints to inspect source job status, audit, source map, roadmap, concept graph summary, coverage matrix summary, warnings, errors, and current tutor link.
- [x] 9.3 Add API endpoint to start/resume learning from a source job and return tutor session/workspace payload.
- [x] 9.4 Update chat attachment promotion so `learn from attached source` creates or reuses a source job.
- [x] 9.5 Keep old `aterProcess`, `aterGeneratePlan`, and `aterConfirm` behavior available as compatibility shims where required, but stop making the desktop source learning UI depend on chaining them.
- [x] 9.6 Add API tests for successful job creation, warning responses, weak-model degraded responses, start learning, resume, and attachment promotion.

## 10. Tutor Runtime And Adaptive Learner Integration

- [x] 10.1 Extend tutor session persistence to link sessions to source job IDs and concept graph nodes.
- [x] 10.2 Ensure source-job tutor sessions restore current concept, current note path, completed concepts, active unlocks, generated-ahead notes, warnings, score, and coverage state after restart.
- [x] 10.3 Update tutor answer submission to update source coverage rows for recall, failure, remediation, transfer, mastery, unlock, and practice scheduling events.
- [x] 10.4 Implement source-aware remediation using concept source excerpts, teaching profile, learner answer, and deterministic fallback when AI fails.
- [x] 10.5 Update learner model aggregation to include source objectives, transfer weakness, recurring misconceptions, and source coverage state in recommendations.
- [x] 10.6 Verify FSRS/practice scheduling happens only after required source-grounded mastery gates pass.

## 11. Desktop UI Integration

- [x] 11.1 Update `sidecarApi.ts` with typed source job client methods for create/resume, status, start learning, and attachment promotion.
- [x] 11.2 Replace the primary source attachment path in `agents.tsx` with unified source job calls.
- [x] 11.3 Render source audit, warnings, roadmap, coverage/mastery summary, and `Start Learning` from source job state.
- [x] 11.4 Open `LearningWorkspace` from backend tutor/source job state rather than localStorage-only source lesson pointers.
- [x] 11.5 Ensure raw queue logs, batch internals, and future note bodies are not shown as the primary source learning experience.
- [x] 11.6 Preserve or relabel the old pipeline tab as bulk ingest/background import if it remains visible.

## 12. End-To-End Verification

- [x] 12.1 Add or update E2E/backend integration tests for the golden source lifecycle: source job, 48-page audit, objectives, `ECON-MICRO`, concept graph, teaching profiles, coverage matrix, first note compilation, tutor launch, and status.
- [x] 12.2 Add weak-model E2E tests with mocked AI failure and malformed AI output.
- [x] 12.3 Add desktop regression tests for source attach, roadmap rendering, start learning, backend-state restore, and coverage panel behavior.
- [x] 12.4 Run targeted backend tests for source intake, concept graph, profiles, compiler, source job APIs, tutor runtime, learner model, and chat attachment promotion.
- [x] 12.5 Run targeted desktop tests for sidecar API and source learning UI behavior.
- [x] 12.6 Run applicable lint/typecheck/build commands for touched packages.
- [x] 12.7 Run `openspec status --change source-grounded-teacher-runtime` and resolve any artifact or requirement formatting issues.

## 13. Manual Verification And Reporting

- [x] 13.1 Create a final verification report listing exact commands run, pass/fail results, coverage of every requirement area, failures, residual risks, and archive recommendation.
- [x] 13.2 Create a manual desktop checklist using `Chapter 3 2024-1.pdf`: attach source, confirm 48 pages, confirm consumer behavior objectives, inspect roadmap, start tutor, answer one question correctly, answer one incorrectly, inspect remediation, verify vault notes, and verify coverage state.
- [x] 13.3 Manually verify offline/restart restore for an already-started source-grounded tutor session or document the gap if desktop manual verification cannot be run.
- [x] 13.4 Do not archive the change until the user completes manual verification and explicitly approves archive.
