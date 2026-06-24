# Advanced Artifacts Spec

## Purpose
This specification defines the requirements for the Advanced Artifacts capability in Ater.

## Requirements

### Requirement: Advanced Artifact Schemas
The system SHALL define and validate schemas for five new interactive advanced artifact types: SQL Query Playground, Simulation Predict, Proof Step, Evidence Select, and Case Simulation.

#### Scenario: Parse valid SQL Query Playground JSON
- **WHEN** the system parses a SQL query playground artifact
- **THEN** it SHALL extract `schema_ddl`, `seed_sql`, and `target_query` fields successfully

#### Scenario: Parse valid Simulation Predict JSON
- **WHEN** the system parses a simulation predict artifact
- **THEN** it SHALL extract `states` and `checkpoints` fields successfully

### Requirement: Local SQL Query Evaluation
The system SHALL execute and validate submitted SQL queries against ephemeral, in-memory SQLite instances.

#### Scenario: Evaluate correct SQL query
- **WHEN** the user submits a query that returns the exact column names and row values as the target query
- **THEN** the system SHALL mark the query as correct and return the dataset rows

#### Scenario: Reject incorrect SQL query
- **WHEN** the user submits a query returning mismatched row counts or values
- **THEN** the system SHALL mark the query as incorrect and return the error or mismatch details

### Requirement: Concept Modality Routing
The system SHALL route SQL, proof, simulation, bug finding, and decision case studies to their corresponding advanced schemas based on keyphrases.

#### Scenario: Route database concept
- **WHEN** the note contains database or SQL keywords in the metadata
- **THEN** the mapper SHALL select the `sql_query_playground` artifact type

#### Scenario: Route proof concept
- **WHEN** the note contains mathematical proof keywords
- **THEN** the mapper SHALL select the `proof_step` artifact type

### Requirement: Case Simulation Branching Evaluation
The system SHALL evaluate user choices in branching case simulations, updating session metrics and returning the next stage.

#### Scenario: Evaluate stage transition
- **WHEN** the user submits a choice selection for the current stage
- **THEN** the system SHALL update the session metrics and return the next stage identifier

### Requirement: Headless Verification
The advanced artifact services SHALL be verified completely headlessly.

#### Scenario: Run advanced tests headlessly
- **WHEN** the test suite for advanced artifacts runs
- **THEN** it SHALL NOT require internet access or open Tauri/browser windows
