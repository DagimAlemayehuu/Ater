## Why

Evolving Ater into a robust, offline-first adaptive learning runtime requires fixing the outstanding bugs, path discrepancies, and metadata inconsistencies identified during the phased implementation. Currently, compilation syntax errors in `compiler_service.py` block the test suite, and path resolution for artifact packs is mismatched across planner and service layers.

## What Changes

- **Critical Compile Fix**: Escape curly braces in the Javascript event handlers inside `compiler_service.py` f-string block to fix the syntax error.
- **Path Unification**: Align the path resolution for artifact packs so that both `planner.py` and `artifact_service.py` read/write from the same unified path under the chapter directory, matching the roadmap structure.
- **YAML Frontmatter Serialization**: Update `compiler_service.py` to serialize note metadata updates using `VaultManager.dump_obsidian_yaml` to maintain consistent double-quoted wikilinks.
- **Rigor Hub Detection**: Fix `lookup_existing_hub` to verify `type: Learning Hub` in the frontmatter instead of matching any filename.
- **Filename Sanitization**: Update `normalize_title` to sanitize unsafe OS filename characters (e.g. `\`, `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`).
- **Comprehensive Validation**: Improve `learning_object.py` validation to verify lesson variants exist and artifact JSONs match their schemas.

## Capabilities

### New Capabilities
- `final-hardening`: Resolves the outstanding compile errors, path mismatches, YAML serialization bugs, and fragile metadata lookup issues across the entire learning runtime.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Edits `compiler_service.py`, `planner.py`, `artifact_service.py`, `learning_object.py`, and `vault_manager.py` to resolve errors.
- **Tests**: Unblocks the entire backend test suite and ensures all 222+ tests compile and pass successfully headlessly.
