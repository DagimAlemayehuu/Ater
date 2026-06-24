## 1. Backend Learning Object Contracts

- [x] 1.1 Add a deterministic backend module for learning object route and metadata helpers under `apps/api/src/domains/ater/` without replacing or rewriting the existing Ater Architect pipeline.
- [x] 1.2 Implement canonical title normalization for Topics, Hubs, Chapters, Atomic Notes, lesson filenames, and artifact pack filenames using existing Ater naming conventions where possible.
- [x] 1.3 Implement self-study Hub path resolution so topic `Git` resolves to `database/learning paths/Git_Hub.md`.
- [x] 1.4 Implement self-study content path resolution so topic `Git`, chapter order `1`, chapter title `Foundations`, and note title `Git Three State Model` resolve to `database/General/Git/01_Foundations/Git_Three_State_Model.md`.
- [x] 1.5 Implement coursework content path resolution that preserves `database/<Semester>/<Course>/<Unit>/` and does not route coursework content through `database/General/`.
- [x] 1.6 Implement lesson variant path helpers for `simple`, `deep`, `cram`, and `exam` using `lessons/<Atomic_Note_Title>.<variant>.html`.
- [x] 1.7 Implement artifact pack path helpers using `artifacts/<Atomic_Note_Title>.artifacts.json`.

## 2. Metadata Builders

- [x] 2.1 Implement Learning Hub frontmatter/body builder with `type: Learning Hub`, `topic`, `learning_mode`, and ordered quoted wikilinks to Chapter files.
- [x] 2.2 Implement Chapter frontmatter/body builder with `type: Chapter`, `hub`, `order`, and ordered quoted wikilinks to Atomic Notes.
- [x] 2.3 Implement Atomic Note metadata merge helper that adds `chapter`, `lesson_variants`, and `artifact_pack` while preserving existing Ater frontmatter invariants.
- [x] 2.4 Ensure YAML wikilink metadata values are double-quoted and `course` / `semester` remain plain text when present.
- [x] 2.5 Ensure metadata builders produce Obsidian-readable Markdown and do not add non-ASCII characters unless already present in existing content.

## 3. Artifact Pack Contract

- [x] 3.1 Implement minimal artifact pack JSON builder with `schema_version`, `note_title`, `note_path`, `active_version`, `pinned_artifact_types`, and `versions`.
- [x] 3.2 Implement artifact pack validator that reports missing or malformed required fields.
- [x] 3.3 Implement artifact version append behavior that preserves prior versions and updates `active_version` only to the selected active version.
- [x] 3.4 Implement pinned artifact type read/write helpers without requiring HTML parsing.

## 4. Existing Hub Lookup

- [x] 4.1 Implement deterministic existing-Hub lookup across `database/learning paths/` and `database/study planner/`.
- [x] 4.2 Support exact canonical title matches such as `Git` -> `Git_Hub.md`.
- [x] 4.3 Support normalized topic and alias metadata matches with casing and spacing differences.
- [x] 4.4 Return whether a matched Hub is self-study or coursework so later phases can extend the correct content route.
- [x] 4.5 Keep lookup conservative; do not add broad fuzzy matching that can merge unrelated Hubs.

## 5. Learning Object Validation

- [x] 5.1 Implement a contract validator for complete learning object sets in a vault directory.
- [x] 5.2 Validate Hub -> Chapter links.
- [x] 5.3 Validate Chapter -> Atomic Note links.
- [x] 5.4 Validate Atomic Note `chapter`, `lesson_variants`, and `artifact_pack` metadata.
- [x] 5.5 Validate artifact pack required fields and active version consistency.
- [x] 5.6 Return actionable validation errors that identify the missing or malformed field/path.

## 6. Headless Backend Tests

- [x] 6.1 Add Python unit tests for canonical title normalization and all route helpers.
- [x] 6.2 Add Python unit tests for Learning Hub, Chapter, Atomic Note metadata builders, including quoted wikilinks and plain-text `course` / `semester` preservation.
- [x] 6.3 Add Python unit tests for lesson variant path helpers and artifact pack path helpers.
- [x] 6.4 Add Python unit tests for artifact pack builder, version append behavior, pinned artifact type behavior, and validator errors.
- [x] 6.5 Add Python integration tests using a temporary vault directory that create a full `Git` self-study learning object set and validate it without network access.
- [x] 6.6 Add Python integration tests using a temporary vault directory that verify missing `chapter`, missing `artifact_pack`, and malformed artifact pack JSON are reported as contract errors.
- [x] 6.7 Add Python integration tests proving coursework path resolution remains outside `database/General/`.
- [x] 6.8 Run the relevant Python tests with `python3 -m pytest` from `apps/api` and ensure they pass.

## 7. Optional Frontend Helper Tests

- [x] 7.1 If any frontend path or metadata helper is introduced, add Vitest tests under `apps/desktop/src/tests/` for those helpers.
- [x] 7.2 If no frontend helper is introduced, do not add frontend code for this phase.
- [x] 7.3 If frontend tests are added, run `pnpm --filter @ater/desktop test` and ensure the relevant tests pass headlessly under jsdom.

## 8. Verification and Guardrails

- [x] 8.1 Run `openspec validate learning-object-model` and fix any spec or implementation mismatch.
- [x] 8.2 Confirm no tests in this phase open a Tauri window, visible browser window, or require manual visual inspection.
- [x] 8.3 Confirm no test or implementation path calls live AI providers or requires network access.
- [x] 8.4 Confirm the existing Ater Architect pipeline behavior is not replaced or removed.
- [x] 8.5 Confirm all tasks in this file are checked only after corresponding tests pass.
