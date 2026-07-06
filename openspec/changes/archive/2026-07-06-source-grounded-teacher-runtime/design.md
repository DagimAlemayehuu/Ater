## Context

Ater has enough pieces to become a strong source-grounded teacher, but the pieces currently sit behind different contracts:

- The desktop source attachment flow in `apps/desktop/src/routes/agents.tsx` copies a file to Inbox, registers it as a durable chat attachment, then separately runs the old `aterProcess` / `aterGeneratePlan` / `aterConfirm` pipeline.
- The newer source-grounded planner in `apps/api/src/domains/ater/source_service.py` can ingest PDFs and produce source-grounded curriculum structures, but it is thin compared with the old Ater compiler and does not own the tutor loop.
- The old Ater compiler in `apps/api/src/domains/ater/service.py` has stronger machinery: curriculum detection, source chunking, concept extraction, source-page anchoring, prerequisite mapping, dynamic domain/modality routing, note generation, validation, fallback skeletons, and vault deployment.
- The tutor runtime in `apps/api/src/domains/ater/tutor_service.py` owns session progress, confidence scoring, remediation, transfer gates, FSRS scheduling, and progressive unlock state, but it is not yet the source job's durable authority.
- Dynamic personas exist in `apps/api/src/domains/ater/domain_matrix.yaml`, `agents.py`, `router.py`, `keywords.py`, and `templates.py`, but `DYNAMIC_DOMAIN_MATRIX` is not currently the primary source for domain-specific modality profiles.

The first target fixture is repository-root `Chapter 3 2024-1.pdf`. It is a 48-page PowerPoint-exported PDF titled `Chapter 3` whose visible topic is `Theory of Consumer Behavior`. Early extracted pages show objectives covering consumer preferences and utility, cardinal vs ordinal utility, indifference curves and their properties, budget line, and consumer equilibrium. Because the PDF is slide-based and economics-heavy, it is a good test for extraction audit, graph/curve warnings, microeconomics routing, modality-specific notes, coverage tracking, and tutor behavior.

This change is brownfield, cross-cutting, and must preserve Ater's local-first constraints. Supabase/cloud services are not part of this flow. Network/search augmentation must remain opt-in. Weak/free-model operation is a first-class design constraint.

## Goals / Non-Goals

**Goals:**

- Create one canonical source learning job lifecycle for desktop source attach, chat attachment promotion, and Inbox watcher ingestion.
- Make `Chapter 3 2024-1.pdf` a golden acceptance fixture for the source-grounded teacher runtime.
- Convert source learning from "generate some notes" into a verifiable loop: source audit, source map, concept graph, dynamic teaching profile, Atomic Note compilation, tutor session, coverage matrix, mastery gates, remediation, practice scheduling, vault deployment, and resume.
- Reuse and cleanly extract the strongest parts of the old Ater compiler rather than replacing them with a weaker new planner.
- Move routing, section shape, validation, citations, coverage, fallback behavior, and mastery state into deterministic code.
- Limit AI calls to quality-sensitive language tasks: source-aligned explanations, examples, questions, remediation, ambiguous concept extraction, and answer diagnosis.
- Make every critical behavior testable headlessly with fixture PDFs, temporary vaults, temporary SQLite databases, mocked LLMs, and no GUI/network requirements.

**Non-Goals:**

- Do not build the full generic "Teach Me Anything" prompt-only runtime in this change.
- Do not require paid/strong models, live Gemini, web search, or cloud services to pass automated verification.
- Do not remove the Inbox watcher workflow. Preserve it, but route it into the same job lifecycle.
- Do not change the Atomic Note contract in `Ater.md` except through existing compiler-compatible output behavior.
- Do not redesign the full desktop app navigation or unrelated chat runtime features.
- Do not make the AI responsible for determining completion, correctness of structure, or vault deployment paths.

## Decisions

### Decision 1: Introduce a Source Learning Job as the canonical backend contract

Create a durable source job model that all source entrypoints use:

- desktop attach source
- chat attachment "learn from this"
- Inbox watcher PDF import
- existing API source upload/plan flows

The job should include source metadata, extraction audit, source pages, source map, coverage targets, concept graph, teaching profiles, compiler outputs, tutor linkage, coverage matrix, warnings, status, and errors.

Rationale: the current source path is accidental orchestration in the desktop UI. A job model makes source learning resumable, inspectable, testable, and independent of one UI flow.

Alternative considered: keep the desktop orchestration and add more calls around it. Rejected because it would preserve duplicate state and make coverage/mastery impossible to trust.

### Decision 2: Extract old compiler behavior into services instead of deleting it

The old `AterService` should be split only where useful:

- source/curriculum detection
- source text extraction and source-page anchoring
- concept extraction and dedupe
- prerequisite graph construction
- teaching profile selection
- Atomic Note compilation
- deployment/idempotency

The implementation should avoid broad rewrites. It can wrap existing methods first, then extract seams where tests need pure functions.

Rationale: the old compiler has production value that the newer source planner lacks. The problem is not that it exists; the problem is that it is not a reusable runtime service.

Alternative considered: build a new source teacher from `source_service.py` only. Rejected because it would discard mature note-generation, validation, and deployment behavior.

### Decision 3: Use `DYNAMIC_DOMAIN_MATRIX` as the highest-priority teaching profile source

Teaching profile resolution should follow this order:

1. `DYNAMIC_DOMAIN_MATRIX[mode][modality]`
2. `DOMAIN_MATRIX[mode]` merged with `UNIVERSAL_MODALITY_MATRIX[modality]`
3. `ACADEMIC-GENERAL` merged with the modality fallback

The profile must include persona, headings, artifact type, question modes, sanity checks, L3 law, prohibitions, and source-compatible artifact constraints.

Rationale: economics, biology, law, CS, math, and history require different artifacts and questions. A single generic "expert + modality" blend is not enough.

Alternative considered: let the AI choose the teaching persona per note. Rejected because weak models will drift and because persona selection must be unit-testable.

### Decision 4: Treat source coverage as a first-class state machine

Each source job should track coverage at multiple levels:

- source page extracted/audited
- chapter objective detected
- objective mapped to concept
- concept source-grounded
- concept note compiled
- concept taught
- recall passed
- transfer passed
- remediation required/completed
- practice scheduled
- vault deployed

Rationale: the user wants a teacher that can prove it taught the chapter. Coverage is the proof surface.

Alternative considered: infer completion from generated notes. Rejected because generated notes do not prove teaching, mastery, or source completeness.

### Decision 5: Use deterministic fallbacks as product behavior, not test hacks

When an AI call fails, times out, returns malformed JSON, hallucinates a domain, or hits rate limits, the system must still:

- preserve the job
- preserve extracted source pages
- preserve warnings
- produce deterministic concept/source skeletons where possible
- write valid fallback notes where compilation is requested
- keep coverage state honest
- expose the degraded state to the user

Rationale: the user has free/weak API keys. The runtime must be useful under weak-model conditions.

Alternative considered: fail the job when AI is unavailable. Rejected because this would make the primary source learning experience brittle.

### Decision 6: Make `Chapter 3 2024-1.pdf` the golden source fixture

Automated tests should use the real PDF when available in the repository root. Tests that cannot rely on local binary fixtures should use a text-equivalent fixture derived from the chapter's extracted early pages and objective list.

Expected fixture facts:

- file name: `Chapter 3 2024-1.pdf`
- page count: 48
- title metadata: `Chapter 3`
- topic: `Theory of Consumer Behavior`
- objective page includes consumer preferences and utility, cardinal vs ordinal utility, indifference curve/properties, budget line, and consumer equilibrium
- routed domain: `ECON-MICRO`

Rationale: one concrete fixture prevents vague acceptance criteria and gives the next implementation agent a stable target.

Alternative considered: use only synthetic mock PDFs. Rejected because synthetic fixtures do not expose PowerPoint PDF extraction and graph/curve issues.

### Decision 7: Keep UI simple and backend-owned

The desktop UI should call a small source job API rather than orchestrating process/plan/confirm itself. The UI should show:

- source audit
- warnings
- roadmap
- coverage/mastery state
- current lesson/tutor workspace
- recoverable errors

It should not expose raw batch logs, future note bodies, or internal compiler steps as the default learning flow.

Rationale: the teacher experience should feel like learning, not watching a deployment pipeline.

Alternative considered: preserve pipeline tab as the main source path. Rejected because bulk ingest and active teaching are different user experiences.

## Risks / Trade-offs

- [Risk] The current dirty worktree contains ongoing chat runtime and OpenSpec archive changes. → Mitigation: implementation must read current files before editing, preserve unrelated changes, and keep changes scoped to this OpenSpec.
- [Risk] Refactoring `AterService` too aggressively could regress old Inbox deployment. → Mitigation: add compatibility tests first and introduce wrapper services before deeper extraction.
- [Risk] PDF slide extraction may miss diagrams that matter for economics graphs. → Mitigation: extraction audit must flag low-text/graph-heavy pages and coverage warnings must prevent false "complete" states.
- [Risk] Weak models may return bad JSON or generic explanations. → Mitigation: deterministic schemas, repair, validation, bounded retries, skeleton fallback, and honest coverage warnings are required.
- [Risk] Coverage matrix could become stale relative to tutor progress. → Mitigation: tutor runtime updates coverage through a single service/API, not client-local state.
- [Risk] Frontend tests may be brittle if they require a running Tauri window. → Mitigation: use headless API/client tests for most behavior and keep manual desktop checks explicit.
- [Risk] Domain routing may overfit economics fixture. → Mitigation: include regression tests for biology, CS, law, and generic academic profiles.
- [Risk] New SQLite tables/migrations could break existing queue DBs. → Mitigation: additive migrations only, idempotent table creation, and rollback by ignoring new tables if disabled.

## Migration Plan

1. Add additive local database tables or schema initialization for source jobs, source pages, concept graph nodes/edges, teaching profiles, coverage matrix rows, and tutor session linkage.
2. Add pure service seams around existing PDF extraction, curriculum detection, routing, persona selection, graph construction, note compilation, and deployment.
3. Route new source job endpoints through those services while keeping old endpoints available.
4. Update desktop source attachment flow to create/start/resume source jobs instead of manually chaining old pipeline calls.
5. Update Inbox watcher processing to create the same source jobs for PDFs marked as learning sources or bulk ingest items.
6. Add coverage/tutor linkage and make tutor progress update source job coverage.
7. Preserve old APIs as compatibility shims where needed until tests prove the new flow covers the use cases.

Rollback strategy:

- Because the data model is additive, rollback can leave new tables unused.
- Desktop can temporarily return to old source attachment calls if the unified job endpoint fails, but tests should ensure this fallback is not the default after implementation.
- Existing vault notes and source files must not be deleted by rollback.

## Open Questions

- Should the Inbox watcher automatically start tutor-ready jobs for all PDFs, or should some imports remain bulk note generation only? The spec assumes all PDF learning entrypoints can create source jobs, while the UI may still label bulk import separately.
- Should web/search augmentation be implemented in this change beyond preserving existing user-consented behavior? The spec treats live search as optional and not required for passing verification.
- Should `Chapter 3 2024-1.pdf` be committed as a permanent test fixture if it is currently untracked? The implementation agent should decide with the user if repository policy permits committing the binary; otherwise create a deterministic text fixture and use the local PDF for manual verification.
