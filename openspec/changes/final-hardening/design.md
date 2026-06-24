## Context

The Ater Learning Runtime has been implemented in 9 sequential phases. Before we can archive the changes and consider the integration complete, we must resolve the outstanding bugs, path mismatches, and serialization flaws documented in `KNOWN_PHASE_GAPS.md`. This design outlines how the sidecar codebase will be hardened, unblocking the entire headless test suite.

## Goals / Non-Goals

**Goals:**
- Fix the unescaped curly brace Python SyntaxError in `compiler_service.py` to allow compilation of the sidecar module.
- Unify the artifact pack location so that it is always resolved as a subfolder `artifacts/` inside the note's parent chapter directory, correcting path discrepancies across the planner and artifact services.
- Replace fragile `frontmatter.dumps(post)` serialization in the compiler with the custom double-quoted wikilink formatting in `VaultManager.dump_obsidian_yaml`.
- Secure `lookup_existing_hub` by checking for the `type: Learning Hub` frontmatter property.
- Add filename sanitization inside `normalize_title` to prevent OS path traversal or invalid character writes.
- Verify all 222+ tests pass cleanly and headlessly.

**Non-Goals:**
- Do not implement new active recall modalities or features.
- Do not write the final end-to-end (E2E) integration test suite in this phase (belongs to the next step).
- Do not require cloud API access.

## Decisions

### 1. Escape Braces in f-string
In `compiler_service.py:L795-L838`, the injected Javascript methods contain unescaped braces. We will escape these as double braces `{{` and `}}` to make the f-string template compile successfully.

### 2. Artifact Pack Path Unification
To resolve the path discrepancy where the planner, artifact service, and roadmap use different paths:
- We will define `get_artifact_pack_path(note_path: Path) -> Path` to resolve relative to the vault root:
  - If a note is at `<chapter_dir>/<note_name>.md`, its artifact pack SHALL reside at `<chapter_dir>/artifacts/<note_name>.artifacts.json`.
  - For example, `database/General/Git/01_Foundations/Git_Three_State_Model.md` gets its pack at `database/General/Git/01_Foundations/artifacts/Git_Three_State_Model.artifacts.json`.
- The `ArtifactService` and `AterPlanner.write_curriculum` will both invoke this unified path builder to read/write files.

### 3. Frontmatter Serialization Consistency
In `compiler_service.py`, when updating the compiled lesson variants list in note metadata:
- We will read the markdown file.
- We will use `VaultManager.dump_obsidian_yaml` (or a helper that wraps it) to serialize the updated metadata block back to the note, ensuring YAML wikilinks (e.g. `hub: "[[Git_Hub]]"`) retain their double-quotes.

### 4. Hub Lookup Rigor
We will modify `lookup_existing_hub` (in `planner.py` or `learning_object.py` helpers) to load the frontmatter of any candidate markdown file and verify that `type` matches `"Learning Hub"`. Filenames alone will not trigger a match.

### 5. Title Normalization Sanitization
In `normalize_title` (in `learning_object.py`):
- We will sanitize the input by replacing unsafe filesystem characters (`\`, `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) with underscores or removing them, avoiding illegal path generation.

## Risks / Trade-offs

- **[Risk]**: Moving existing artifact packs breaks old references in notes.  
  **Mitigation**: The validator helper will automatically check if the artifact pack is located at the old `database/artifacts/` folder and migrate it to the new unified chapter-specific `artifacts/` folder on first validation.
