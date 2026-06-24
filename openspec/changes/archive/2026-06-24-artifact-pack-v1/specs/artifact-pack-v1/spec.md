## ADDED Requirements

### Requirement: Artifact JSON schema validation
The system SHALL validate generated interactive artifacts against strict JSON schemas for the 10 core types.

#### Scenario: Validate reveal_card schema
- **WHEN** the system validates a `reveal_card` artifact
- **THEN** it SHALL verify it contains `front` (question/cue) and `back` (answer/explanation) fields

#### Scenario: Validate cloze_multi schema
- **WHEN** the system validates a `cloze_multi` artifact
- **THEN** it SHALL verify it contains `text` (with blank placeholders like `{{cloze}}`) and `options` (distractors and correct answers)

#### Scenario: Validate matching_pairs schema
- **WHEN** the system validates a `matching_pairs` artifact
- **THEN** it SHALL verify it contains `pairs` (mapping left-side terms to right-side matches)

#### Scenario: Validate sortable_steps schema
- **WHEN** the system validates a `sortable_steps` artifact
- **THEN** it SHALL verify it contains `steps` (an ordered list of items to sort)

#### Scenario: Validate state_stepper schema
- **WHEN** the system validates a `state_stepper` artifact
- **THEN** it SHALL verify it contains `states` (an ordered list of state descriptions) and `transitions` (triggers that cause the state change)

#### Scenario: Validate concept_map schema
- **WHEN** the system validates a `concept_map` artifact
- **THEN** it SHALL verify it contains `nodes` (identifiers and labels) and `edges` (from, to, and connection labels)

#### Scenario: Validate table_lens schema
- **WHEN** the system validates a `table_lens` artifact
- **THEN** it SHALL verify it contains `headers` (column titles) and `rows` (cell data arrays matching the headers)

#### Scenario: Validate code_trace schema
- **WHEN** the system validates a `code_trace` artifact
- **THEN** it SHALL verify it contains `code` (programming snippet), `steps` (execution trace lines), and `variables` (tracked state per step)

#### Scenario: Validate formula_card schema
- **WHEN** the system validates a `formula_card` artifact
- **THEN** it SHALL verify it contains `expression` (LaTeX math formula), `variables` (descriptions of symbols), and `derivation` (step-by-step math explanation)

#### Scenario: Validate timeline schema
- **WHEN** the system validates a `timeline` artifact
- **THEN** it SHALL verify it contains `events` (an ordered list of date/description objects)

### Requirement: Modality-based artifact selection
The system SHALL inspect the note's topic, content, or metadata to select the most appropriate artifact types.

#### Scenario: Select artifact for programming concept
- **WHEN** the note is classified as a programming concept
- **THEN** the system SHALL prioritize generating `code_trace` and `sortable_steps` artifacts

#### Scenario: Select artifact for definitional concept
- **WHEN** the note is classified as a qualitative/definitional concept
- **THEN** the system SHALL prioritize generating `reveal_card`, `cloze_multi`, and `matching_pairs` artifacts

### Requirement: Version management and rollback
The system SHALL manage multiple versions of artifact packs and allow setting the active version.

#### Scenario: Append version on regeneration
- **WHEN** the system regenerates artifacts for a note
- **THEN** it SHALL append the new artifacts under a new version block in the `versions` array
- **THEN** it SHALL increment the `active_version` field in the root of the JSON file
- **THEN** it SHALL NOT delete existing versions in the array

#### Scenario: Rollback to previous version
- **WHEN** the system receives a rollback request for a note path and a target version number
- **THEN** it SHALL set `active_version` to the target version number if it exists in the `versions` list
- **THEN** it SHALL NOT modify the list of versions

### Requirement: Pinned artifact preservation
The system SHALL read and preserve user-pinned artifact types during regeneration.

#### Scenario: Preserve pinned type on regeneration
- **WHEN** a note's artifact pack has `pinned_artifact_types` populated
- **THEN** during regeneration, the system SHALL prompt the model to generate at least the pinned artifact types
- **THEN** it SHALL include those pinned types in the new active version

### Requirement: Max artifact count restriction
The system SHALL enforce a maximum limit of active artifacts per note to govern cognitive load.

#### Scenario: Enforce max 3 active artifacts limit
- **WHEN** the system generates artifacts for a note
- **THEN** the active version SHALL NOT contain more than 3 artifacts
- **THEN** if more than 3 are generated, the system SHALL select the top 3 and truncate the remainder

### Requirement: Headless artifact tests
The artifact pack generation and validation SHALL be verified using headless backend unit and integration tests.

#### Scenario: Run tests headlessly without network or AI
- **WHEN** the test suite runs
- **THEN** it SHALL NOT open a Tauri window or an OS browser window
- **THEN** it SHALL NOT call live AI providers or require network access
- **THEN** all LLM calls SHALL be mocked using deterministic test fixtures
