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

