## Why

The academic source-learning workflow is visibly broken in `Vault_Test`: the Chapter 3 economics hub exists under the academic study planner, but the standalone Practice page cannot find it; generated Atomic Notes are marked `fallback_generation: true` and contain generic boilerplate, truncated source excerpts, and weak questions; the tutor session records answers without reliably advancing; and academic learning leaks `SourceJobs` vault files that the user explicitly does not want.

This change repairs the existing source-grounded teacher runtime so the academic dashboard -> course -> chapter hub -> roadmap -> first lesson -> in-note practice -> standalone practice -> continue lesson workflow is reliable and source-grounded.

## What Changes

- Use one canonical academic vault path model for academic source jobs: hubs under `database/study planner/<semester>/<course>/<unit>/...` and Atomic Notes under `Notes/academic/<semester>/<course>/<unit>/01_Source_Roadmap/...`.
- Stop creating visible `SourceJobs` vault hubs/notes for academic source jobs; keep transient job/session state in SQLite.
- Make backend Practice hub discovery recurse into nested study planner hubs and resolve the same hub IDs/paths the desktop can select.
- Replace generic fallback Atomic Note deployment for source jobs with deterministic, source-grounded note and quiz construction from concept graph excerpts.
- Ensure fallback notes are acceptable degraded source notes, not generic boilerplate: they must cite source pages, explain the concept from excerpts, avoid unrelated analogies, and generate meaningful questions.
- Fix tutor answer/progression bookkeeping so mastered notes advance, failed gates remain blocked with a useful reason, and session restore uses the canonical current note path.
- Add regression tests for the exact Chapter 3 failure class.

## Non-Goals

- No UI redesign.
- No cloud-only source augmentation.
- No changes to `Ater.md`.
- No destructive cleanup of the user's existing `Vault_Test` generated files in this implementation pass.

## Impact

- Backend source learning and practice services:
  - `apps/api/src/domains/ater/source_service.py`
  - `apps/api/src/domains/ater/service.py`
  - `apps/api/src/domains/ater/quiz_builder.py`
  - `apps/api/src/domains/ater/tutor_service.py`
- Backend tests under `apps/api/tests/` or `apps/api/src/domains/ater/test_*.py`.
- Frontend tests only if the backend fixes reveal a UI state bug that must be corrected.
