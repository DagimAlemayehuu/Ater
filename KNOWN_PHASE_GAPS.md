# Known Phase Gaps & Hardening Checklist

This file tracks the outstanding gaps, missing test coverages, and design issues identified during the phased implementation of the Ater Learning Runtime. These will be addressed during the final hardening and integration pass before archiving the changes.

## Phase 1: learning-object-model Gaps

- [ ] **Validation of Lesson Variants**: The `validate_learning_objects` function in `learning_object.py` does not validate that `lesson_variants` paths exist or are properly formatted.
- [ ] **Shallow Backend Tests**: The test suite `test_learning_object.py` lacks coverage for:
  - Missing `chapter` metadata in notes.
  - Missing `artifact_pack` metadata in notes.
  - Malformed `artifact_pack` JSON structure (e.g. missing `versions` or `active_version`).
  - Coursework route resolution edge cases.
  - `lesson_variants` path resolution and validation.
- [ ] **Fragile Hub Lookup**: `lookup_existing_hub` matches arbitrary markdown files if their names or metadata match the normalized topic, instead of strictly verifying that `type: Learning Hub` is present in the frontmatter.
- [ ] **Fragile Title Normalization**: `normalize_title` does not sanitize or escape unsafe filename characters (e.g. `\`, `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`).
- [ ] **Coursework Route Shape**: Need final confirmation of the coursework route directory structure and mapping invariants.
- [ ] **Task Status Integrity**: Tasks were checked off too aggressively in the implementation phase before ensuring full edge case coverage and deep test suite validation.

## Phase 3: atomic-note-lesson-compiler Gaps

- [ ] **YAML Serialization Inconsistency**: In `compiler_service.py:L860`, the compiler updates the note's frontmatter using `frontmatter.dumps(post)` instead of `VaultManager.dump_obsidian_yaml`. This bypasses custom formatting rules (such as double-quoting wikilinks) and may corrupt note metadata.
- [ ] **Hardcoded Theme Styling**: The compiled HTML lesson uses a static CSS block with `@media (prefers-color-scheme)` to determine dark/light mode. It does not integrate with Ater's active theme selection state if the user manually overrides their system preferences.
- [ ] **Relative Path Resolution in Tauri**: Navigation links in compiled lessons use relative paths (e.g. `./Prev_Note.simple.html`). We need to verify if these paths resolve correctly inside the Tauri webview and file protocol context.

## Phase 4: artifact-pack-v1 Gaps

- [ ] **Mismatched Artifact Pack Paths**: The path resolution for artifact packs is inconsistent across modules and doesn't match the roadmap:
  - `planner.write_curriculum` writes to `self.vault_path / "database" / lo.get_artifact_pack_path(note_title)` -> `database/artifacts/`.
  - `ArtifactService` reads/writes from `self.vault_path / "artifacts/"`.
  - `LEARNING_RUNTIME_ROADMAP.md` specifies that `artifacts/` should be a chapter-specific folder nested inside the chapter directory.
  This path discrepancy must be unified so that the generator reads the correct files initialized by the planner.
- [ ] **Pydantic Validation Coercion Limits**: Structuring code execution steps or concept maps requires highly specific JSON formats. Weak models might return types (e.g., integers instead of strings in variables) that fail strict Pydantic validation, causing the generator to fallback to a generic `reveal_card` too frequently.

## Phase 5: tutor-runtime Gaps

- [ ] **SyntaxError in compiler_service.py**: In `compiler_service.py:L795-L838`, the added Javascript event dispatchers `selectOption` and `showWritingExplanation` contain unescaped curly braces `{` and `}`. Since they are within a Python f-string template, these must be escaped as `{{` and `}}` to avoid SyntaxErrors during module compilation.

## Phase 6: cram-mode Assumptions

- [ ] **Telemetry Invariance**: Cram mode calculations assume that tutor session telemetry (`tutor_sessions` and `user_misconceptions` tables in `ater_queue.db`) are queryable via standard SQLite methods and that fields like `wagers` and `completed_notes` are valid JSON.
- [ ] **Lesson Variant Compilation Integration**: Cram mode assumes that the compiler is capable of generating `lessons/<Atomic_Note>.cram.html` correctly once the SyntaxError in compiler_service is resolved.
- [ ] **Offline Execution**: Cram mode's phase scheduler and weakness ranker must run locally without relying on remote or active AI services, utilizing mock providers or local heuristics when telemetry or LLMs are unavailable.

## Phase 7: source-driven-learning Assumptions

- [ ] **PDF Extraction Robustness**: The ingestion service assumes the robust PyPDF/pypdf loader defined in `pdf_extractor.py` is stable and returns structured pages with valid metadata.
- [ ] **Web Search Mocking**: Web search augmentation assumes that in a headless test environment, search API calls can be mocked to return predictable markdown mock pages, preventing live network calls.

## Phase 8: advanced-artifacts Assumptions

- [ ] **SQLite Local Engine Compatibility**: The local SQL Query Playground evaluator assumes the sidecar python runtime has `sqlite3` built-in and configured for `:memory:` operations.
- [ ] **DAG Parsing Safety**: The Case Simulation branching checker assumes choice structures can be represented as acyclic models and validated without infinite loops or deep recursion.
