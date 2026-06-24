## Why

Ater needs a durable learning object model before the new tutor runtime can be built safely. The current Teacher and artifact experiments can generate lessons, but they do not share a stable Hub -> Chapter -> Atomic Note -> Lesson -> Artifact Pack contract, which makes weak-model implementation brittle and risks scattering generated knowledge across the vault.

## What Changes

- Introduce a first-class `Learning Hub` structure for Teach Anything and self-study paths.
- Introduce real Chapter files that group Atomic Notes and provide stable navigation.
- Define canonical vault routes for self-study content under `database/learning paths/` and `database/General/<Topic>/`.
- Define metadata links between Learning Hubs, Chapter files, Atomic Notes, durable HTML lessons, and artifact packs.
- Define lesson variant naming for `simple`, `deep`, `cram`, and `exam`.
- Define artifact pack file naming and version storage contracts without implementing advanced artifact generation yet.
- Define existing Hub detection and extension behavior so future planners update relevant paths instead of creating duplicate learning paths.
- Require code-level tests for path building, metadata contracts, file creation, and vault graph linkage. Tests must run headlessly in unit/integration test environments and must not require opening an application window.

## Capabilities

### New Capabilities

- `learning-object-model`: Defines the durable vault file model, metadata contracts, route resolution, lesson variant naming, artifact pack versioning, and Hub extension rules used by future learning-runtime phases.

### Modified Capabilities

None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Add deterministic helpers or services for learning object routes, metadata construction, Hub lookup, and file contract validation.
- **Desktop Client (`apps/desktop`)**: Future consumers may display Learning Hubs, Chapters, lessons, and artifact packs, but this phase should avoid broad UI work unless needed for existing Explorer compatibility.
- **Obsidian Vault Layout**: Adds `database/learning paths/` for self-study Hubs and uses `database/General/<Topic>/<Chapter>/` for generated Teach Anything content.
- **Tests**: Add headless unit and integration tests validating contracts. Do not add tests that require launching a desktop window.
- **Existing Pipeline**: Must remain untouched except for shared helpers that are explicitly backward-compatible. This change establishes new contracts alongside the old pipeline.
