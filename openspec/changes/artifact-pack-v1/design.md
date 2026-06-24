## Context

Ater requires a system to generate and manage interactive learning objects (artifacts) associated with Atomic Notes. These artifacts (e.g., flashcards, step ordering, code tracing) are stored in the companion JSON file at `artifacts/<Atomic_Note_Title>.artifacts.json`.

This design outlines the backend service that selects, generates, and manages versioned artifact packs. It defines the Pydantic schemas for the 10 core artifact types, maps the note's domain/modality to the best artifact types, handles regeneration/rollback API requests, and governs the maximum count of active artifacts.

## Goals / Non-Goals

**Goals:**
- Implement `ArtifactGenerator` in `apps/api/src/domains/ater/artifact_service.py`.
- Define strict Pydantic schemas for the 10 core artifact types:
  - `reveal_card`
  - `cloze_multi`
  - `matching_pairs`
  - `sortable_steps`
  - `state_stepper`
  - `concept_map`
  - `table_lens`
  - `code_trace`
  - `formula_card`
  - `timeline`
- Map note content modalities (cues in text or frontmatter) to appropriate artifact types.
- Expose APIs to generate, regenerate, pin, and roll back artifact pack versions.
- Limit the number of active artifacts per note to a maximum of 3.
- Run all logic headlessly with 100% test coverage using mocked LLM responses.

**Non-Goals:**
- Do not implement the React components for rendering these artifacts in the UI (that is for the lesson player/tutor runtime in later phases).
- Do not build a new LLM provider library; reuse the existing sidecar model client.

## Decisions

### 1. Pydantic Models for the 10 Artifact Types
We will define a unified Pydantic schema using a discriminated union or a generic wrapper to support the 10 distinct types. This ensures that the generated JSON conforms strictly to the expected type-specific schemas.
- **Alternatives considered**: Use generic free-form JSON. Rejected because weak models require strict validation schemas to prevent generating corrupted or missing properties.

### 2. Modality Mapping Rules
The generator will inspect the note's content and frontmatter (`concept_modality` / `mode`) to determine the candidate artifact types:
- `code` / `programming` -> `code_trace`, `sortable_steps`
- `mathematics` / `physics` -> `formula_card`, `reveal_card`
- `history` / `chronology` -> `timeline`, `reveal_card`
- `process` / `workflows` -> `sortable_steps`, `state_stepper`
- `definitional` / `qualitative` -> `reveal_card`, `cloze_multi`, `matching_pairs`
- `conceptual` / `relational` -> `concept_map`, `table_lens`

### 3. Version Append and Rollback API
When a user requests regeneration:
- A new version block is generated and appended to the `versions` array.
- The `active_version` field in the root of the JSON file is updated.
- A rollback API endpoint `POST /api/ater/artifact/rollback` is exposed to allow setting `active_version` back to a previous number.

### 4. Max Artifact Limit (Governor)
The generator will enforce a maximum of 3 active artifacts in any generated version. If the LLM generates more, the service will truncate the list to the top 3 to prevent cognitive overload.

## Risks / Trade-offs

- **[Risk]**: Weak models might fail to populate complex schemas like `code_trace` or `concept_map` correctly.  
  **Mitigation**: Implement fallback generation to simpler types (like `reveal_card`) when validation fails, ensuring a lesson always has usable artifacts.

- **[Risk]**: Regenerating a pack might overwrite user pins.  
  **Mitigation**: The regeneration service must read `pinned_artifact_types` first and force-include those types in the prompt/generation constraints.
