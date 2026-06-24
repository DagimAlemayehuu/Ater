## Why

The initial set of 10 interactive artifact types (such as reveal card, matching pairs, and sortable steps) covers basic recall and simple structures. To support advanced computer science, database queries, mathematical proofs, and scenario-based decision making, the system requires more complex, specialized interactive layouts ("Advanced Artifacts") that enable deeper conceptual verification and interactive practice.

## What Changes

- **Pydantic Advanced Artifact Schemas**: Extend the Pydantic discriminated union schemas in `artifact_service.py` to support five advanced formats:
  - `sql_query_playground`: Interactive SQL terminal executing queries against a local SQLite database and verifying output datasets.
  - `simulation_predict`: Step-by-step state simulator requiring predictions before variables advance.
  - `proof_step`: Logical/mathematical proof builder requiring step sorting and reason matching.
  - `evidence_select`: Highlight-based text selection indicating lines containing bugs or evidence.
  - `case_simulation`: Multi-stage branching scenario where choices modify stability and performance metrics.
- **Concept Modality Mapper Integration**: Update the mapper logic to map topics such as databases, algorithm execution, logical proofs, and case studies to the appropriate advanced artifact.
- **Compiler Rendering Layouts**: Extend the compiler rendering logic to inject the HTML/JS templates needed to render these five advanced formats dynamically inside the lesson iframe.
- **FastAPI Playground Evaluator Route**: Add endpoints to execute and validate local SQL queries and evaluate branching case simulations.

## Capabilities

### New Capabilities
- `advanced-artifacts`: Implements schemas, rendering layouts, and runtime evaluation mechanics for five advanced interactive artifacts: SQL query playground, simulation predict, proof step, evidence select, and case simulation.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Updates `artifact_service.py` with new models and updates the compiler service to embed the new HTML layouts. Adds a playground execution router for SQL and case simulations.
- **Tauri / Desktop Client**: Supports rendering the new templates within the iframe container.
- **Obsidian Vault / Database**: Saved artifact JSON packs under `artifacts/` contain versioned instances of the new advanced schemas.
- **Tests**: Adds unit and integration tests under `apps/api/tests/test_advanced_artifacts.py` verifying correct parsing, validation, and execution evaluation.
