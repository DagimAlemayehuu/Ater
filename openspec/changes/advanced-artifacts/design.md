## Context

Ater's adaptive learning runtime requires specialized interactive elements to support complex subjects like databases, algorithms, proofs, and scenario-based decisions. The initial 10 artifact types are insufficient for evaluating dynamic execution state or queries. This design extends the `ArtifactService` in `apps/api/src/domains/ater/artifact_service.py` to support five new advanced interactive schemas, integrates them into the modality mapper, adds rendering layout templates inside compiled HTML lessons, and establishes an in-memory SQLite evaluation route for SQL playgrounds.

All execution runs locally, offline, and is validated headlessly.

## Goals / Non-Goals

**Goals:**
- Extend the `ArtifactType` union in `artifact_service.py` with `sql_query_playground`, `simulation_predict`, `proof_step`, `evidence_select`, and `case_simulation` models.
- Update `ConceptModalityMapper` to route database, algorithm trace, proof, bug finding, and decision case study concepts to the appropriate new advanced schemas.
- Implement HTML/JS rendering templates inside the compiler service for the five advanced types.
- Implement an offline, local SQL evaluator using in-memory SQLite (`:memory:`) database connections to validate query outputs.
- Add FastAPI sidecar endpoints to evaluate SQL queries and case scenario step choices.
- Run all tests headlessly via pytest without Tauri, active AI, or internet access.

**Non-Goals:**
- Do not build a React code editor UI on the desktop client in this phase; use standard textareas/HTML widgets inside the compiled lesson iframe.
- Do not support persistent, write-enabled disk databases for the SQL playground; use transient in-memory databases only.
- Do not use cloud database services or live search.

## Decisions

### 1. Advanced Artifact Data Schemas
We will implement the following Pydantic schemas in `apps/api/src/domains/ater/artifact_service.py`:
- `SQLQueryPlayground`:
  - `schema_ddl`: str  # DDL statement (e.g. `CREATE TABLE users...`)
  - `seed_sql`: str    # Insert statements to populate table
  - `target_query`: str  # The expected correct SQL query
  - `initial_query`: str  # Pre-filled SQL in editor
  - `table_headers`: list[str]  # Expected columns
- `SimulationPredict`:
  - `states`: list[dict]  # Array of state snapshots (e.g., `{"vars": {"x": 5}, "step": 1}`)
  - `checkpoints`: list[dict]  # Checkpoints asking: `{"step_index": 2, "target_var": "x", "expected_value": "10", "question": "What is x?"}`
- `ProofStep`:
  - `steps`: list[str]  # The logical proof statements (shuffled)
  - `reasons`: list[str]  # The justifications/axioms (shuffled)
  - `correct_order`: list[int]  # Indices showing correct step order
  - `reason_mappings`: list[int]  # Maps step index to correct reason index
- `EvidenceSelect`:
  - `raw_text`: str  # Code block or text paragraph
  - `selectable_spans`: list[dict]  # `{"id": 0, "start": 10, "end": 25, "text": "def sort(arr):"}`
  - `target_spans`: list[int]  # ID list of spans matching target criteria
- `CaseSimulation`:
  - `stages`: dict[str, dict]  # e.g., `{"start": {"text": "A leak detected", "choices": [{"text": "Isolate", "next": "stage_2"}]}}`
  - `metrics`: dict[str, float]  # Initial state metrics (e.g., `{"integrity": 1.0, "time": 0.0}`)
  - `success_conditions`: dict  # e.g., `{"integrity": {"min": 0.70}}`

### 2. local In-Memory SQL Evaluation
To evaluate user submissions for the `sql_query_playground` safely and efficiently:
1. The client sends the user query to the FastAPI sidecar (`POST /api/ater/playground/sql/evaluate`).
2. The sidecar initializes an ephemeral SQLite connection to `:memory:`.
3. It executes the `schema_ddl` followed by the `seed_sql` to create and populate the local table context.
4. It executes the correct `target_query` to retrieve the reference dataset.
5. It executes the user's submitted query to retrieve the candidate dataset.
6. It compares the column structure, row counts, and data values. If they match (with optional order checks), the query is marked correct.
7. The SQLite connection is closed immediately, ensuring zero state pollution or file disk writes.

### 3. Concept Modality Mapper Extension
The `ConceptModalityMapper` is updated to support keyphrase mapping:
- If notes match keyword "SQL", "query", "database", or "select" -> Map to `sql_query_playground`.
- If notes match keyword "theorem", "induction", "proof", or "logic" -> Map to `proof_step`.
- If notes match keyword "trace", "simulate", "array state", or "iteration" -> Map to `simulation_predict`.
- If notes match keyword "bug", "find error", "locate line", or "identify evidence" -> Map to `evidence_select`.
- If notes match keyword "branching case", "decision study", or "scenario simulation" -> Map to `case_simulation`.

## Risks / Trade-offs

- **[Risk]**: Users write malicious SQLite statements (e.g. infinite loops, excessive recursion, or memory exhaustion).  
  **Mitigation**: The sidecar sets limits on SQL execution time (soft timeout of 1 second) and enforces read-only query execution checks (rejecting administrative commands like `PRAGMA` or commands modifying schema post-initialization).

- **[Risk]**: Branching case simulations contain loops that freeze client state.  
  **Mitigation**: The schema parser validates that the stages form a Directed Acyclic Graph (DAG) or enforces a max step transition depth (e.g., max 10 choices) before terminating the simulation.
