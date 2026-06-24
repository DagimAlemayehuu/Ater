## 1. Pydantic Schemas

- [ ] 1.1 Implement Pydantic models for `SQLQueryPlayground`, `SimulationPredict`, `ProofStep`, `EvidenceSelect`, and `CaseSimulation` in `apps/api/src/domains/ater/artifact_service.py` and update the `ArtifactType` union.

## 2. Concept Modality Mapper

- [ ] 2.1 Update `ConceptModalityMapper` in `artifact_service.py` to route database, logic proof, variable trace, bug finding, and scenario topics to the new advanced formats.

## 3. Compiler Layouts

- [ ] 3.1 Extend `compiler_service.py` compilation templates to support injecting rendering scripts and HTML placeholders for the five new advanced types.

## 4. SQL & Branching Case Evaluator

- [ ] 4.1 Implement local query evaluation in `artifact_service.py` using transient, in-memory SQLite (`:memory:`) connections to compare column headers and row data.
- [ ] 4.2 Implement stage transition and metric modification logic for branching case simulations.

## 5. FastAPI Endpoints

- [ ] 5.1 Add sidecar evaluation routes under `apps/api/src/api/routers/ater.py`: `/api/ater/playground/sql/evaluate` and `/api/ater/playground/case/evaluate`.

## 6. Headless Verification Tests

- [ ] 6.1 Add unit tests verifying advanced schema parsing and modality mapping.
- [ ] 6.2 Add unit tests verifying local in-memory SQL execution correctness and error feedback.
- [ ] 6.3 Add unit tests verifying branching state evaluation and metrics updates.
- [ ] 6.4 Run `openspec validate advanced-artifacts` and verify all tests pass headlessly using `pytest`.
