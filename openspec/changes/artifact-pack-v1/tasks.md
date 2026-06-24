## 1. Artifact Schemas & Pydantic Definitions

- [ ] 1.1 Create the artifact service file in `apps/api/src/domains/ater/artifact_service.py`.
- [ ] 1.2 Define Pydantic models for all 10 artifact types (`reveal_card`, `cloze_multi`, `matching_pairs`, `sortable_steps`, `state_stepper`, `concept_map`, `table_lens`, `code_trace`, `formula_card`, `timeline`).
- [ ] 1.3 Implement validation helpers to verify that generated artifacts strictly match their respective Pydantic schemas.

## 2. Modality Mapping & Generation

- [ ] 2.1 Implement the concept modality mapper to select appropriate artifact types based on note content and frontmatter fields.
- [ ] 2.2 Implement the structured artifact generator utilizing LLM client calls (with mockable interfaces).
- [ ] 2.3 Implement the cognitive load governor to truncate the active artifact list to a maximum of 3.

## 3. Versioning & Pinning

- [ ] 3.1 Implement the version append logic during regeneration (keeping old versions intact).
- [ ] 3.2 Implement the rollback helper to set the `active_version` field in the JSON file to a previous version number.
- [ ] 3.3 Implement pinned artifact type support: ensure pinned types are read first and prioritized during generation.

## 4. API Endpoints

- [ ] 4.1 Add FastAPI endpoints for artifact operations: `/api/ater/artifact/generate`, `/api/ater/artifact/rollback`, and `/api/ater/artifact/pin`.
- [ ] 4.2 Add client-side sidecar wrappers in `apps/desktop/src/lib/sidecarApi.ts`.

## 5. Headless Backend Tests

- [ ] 5.1 Add unit tests verifying Pydantic schema validation for all 10 artifact types.
- [ ] 5.2 Add unit tests verifying modality mapping and the max-3 governor limit.
- [ ] 5.3 Add integration tests in a temporary vault verifying end-to-end generation, versioning, rollback, and pinning.
- [ ] 5.4 Ensure all tests run headlessly, require zero network access or live AI calls, and pass successfully using `pytest`.

## 6. Verification & Validation

- [ ] 6.1 Run `openspec validate artifact-pack-v1` and resolve any validation issues.
- [ ] 6.2 Verify that no tests open a Tauri window or visible browser.
- [ ] 6.3 Verify the old Ater Architect pipeline remains intact.
