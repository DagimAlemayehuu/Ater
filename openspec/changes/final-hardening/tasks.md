## 1. Compiler Critical Fixes

- [x] 1.1 Escape curly braces in the Javascript event handlers inside the f-string block in `compiler_service.py` to fix module compilation.
- [x] 1.2 Replace `frontmatter.dumps` with `VaultManager.dump_obsidian_yaml` when compiling lesson variants to maintain consistent double-quoted wikilinks in frontmatter.

## 2. Path Unification

- [x] 2.1 Implement `get_artifact_pack_path` in `learning_object.py` to resolve paths relative to the vault root inside the parent chapter's `artifacts/` folder.
- [x] 2.2 Update `AterPlanner.write_curriculum` and `ArtifactService` to read and write artifact packs using this unified path builder.

## 3. Metadata Lookup & Title Sanitization

- [x] 3.1 Update `lookup_existing_hub` to verify candidate markdown files contain `type: Learning Hub` in their frontmatter.
- [x] 3.2 Update `normalize_title` to replace unsafe OS filename characters (`\`, `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) with underscores or empty characters.

## 4. Rigorous Validation Checks & Tests

- [x] 4.1 Extend validation checks in `learning_object.py` to verify that variant HTML files exist on disk.
- [x] 4.2 Add unit test coverage in `test_learning_object.py` for missing chapter/hub metadata, malformed JSON structures, and path resolution edge cases.
- [x] 4.3 Run the entire sidecar test suite (222+ tests) headlessly and verify all pass successfully.
- [x] 4.4 Run `openspec validate final-hardening` and ensure validation succeeds.
