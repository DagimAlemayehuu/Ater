## Why

To support active learning and retrieval practice, Ater needs to generate interactive learning objects (such as matching pairs, sortable steps, code tracing, timelines) called "artifacts". These artifacts must be generated reliably by weak models, validated against strict JSON schemas, and stored in the versioned artifact pack companion files defined in Phase 1. Currently, there is no engine to select, generate, and manage these artifacts based on the domain and modality of the note.

## What Changes

- **Artifact Generator Service**: A new backend service that uses structured LLM outputs to generate specific types of interactive learning objects based on the content of an Atomic Note.
- **Concept Modality Mapper**: Logic that maps the note's concept modality (e.g. code, mathematics, history, definitions) to the most appropriate artifact types:
  - `reveal_card` (definitions)
  - `cloze_multi` (fill-in-the-blank)
  - `matching_pairs` (terms and descriptions)
  - `sortable_steps` (process flow)
  - `state_stepper` (state changes)
  - `concept_map` (relationships)
  - `table_lens` (structured comparisons)
  - `code_trace` (programming code tracing)
  - `formula_card` (math equations/derivations)
  - `timeline` (chronological events)
- **Artifact Versioning and Rollback API**: Endpoints in the FastAPI sidecar to regenerate specific artifacts, append a new version to the JSON, and select/rollback the active version.
- **User Pinning & Customization**: Support saving user-pinned preferred artifact types in the JSON pack, ensuring future regenerations respect those preferences.
- **Cognitive Load Governor**: Enforce a maximum limit of active artifacts per note (default max 3) to prevent overwhelming the learner.

## Capabilities

### New Capabilities
- `artifact-pack-v1`: Generates, validates, and manages versioned interactive learning artifacts based on note content and concept modalities.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: New generation logic in `apps/api/src/domains/ater/artifact_service.py` (or similar) using Pydantic structured output, and routers in `apps/api/src/api/routers/ater.py`.
- **Tauri / Desktop Client**: Desktop client UI will display active artifacts inside the lesson viewer and allow users to request regenerations, view version history, and pin types.
- **Obsidian Vault**: Updates the companion JSON files under the `artifacts/` folder of each chapter.
- **Tests**: Headless unit and integration tests verifying JSON schemas for all 10 artifact types, correct mapper selection, version append/rollback logic, and governor limits.
