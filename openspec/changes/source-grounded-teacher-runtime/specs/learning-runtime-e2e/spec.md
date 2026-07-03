## ADDED Requirements

### Requirement: Golden source teacher E2E
The E2E verification suite SHALL cover the complete source-grounded teacher path using `Chapter 3 2024-1.pdf`.

#### Scenario: Golden source lifecycle
- **WHEN** the E2E test runs with `Chapter 3 2024-1.pdf`
- **THEN** it SHALL create a source learning job
- **THEN** it SHALL verify 48-page extraction, objective detection, `ECON-MICRO` routing, concept graph creation, teaching profile assignment, coverage matrix creation, first note compilation, tutor session launch, and source job status reporting

#### Scenario: Golden tutor interaction
- **WHEN** the E2E test submits one correct and one incorrect answer in the source-grounded tutor session
- **THEN** it SHALL verify recall or failure state updates the coverage matrix
- **THEN** it SHALL verify remediation is returned for the incorrect answer
- **THEN** it SHALL verify mastered concepts are scheduled for practice only after required gates pass

### Requirement: Weak-model source E2E
The E2E verification suite SHALL cover source learning when AI calls are unavailable, weak, or malformed.

#### Scenario: AI failure preserves useful job
- **WHEN** source graph or note generation AI calls are mocked to fail
- **THEN** the system SHALL preserve source audit, warnings, source map, partial graph or fallback graph state, and honest incomplete coverage
- **THEN** it SHALL not crash the source job or falsely report completion

#### Scenario: Malformed AI output is contained
- **WHEN** mocked AI returns malformed JSON, missing note sections, invalid citations, or forbidden artifacts
- **THEN** deterministic validation SHALL repair, replace, or reject the invalid output
- **THEN** the E2E result SHALL include the degraded/fallback state

### Requirement: Desktop source flow regression
The desktop regression suite SHALL verify that source attachment uses the unified source job flow.

#### Scenario: Source attach does not call legacy sequence from UI
- **WHEN** desktop tests exercise source attachment
- **THEN** the client SHALL call the source job API
- **THEN** it SHALL not require the UI to manually call `aterProcess`, `aterGeneratePlan`, and `aterConfirm` as the primary source learning path

#### Scenario: Learning workspace restores from backend
- **WHEN** a source-grounded tutor session is reopened after simulated restart
- **THEN** the desktop client SHALL render from backend source job and tutor state
- **THEN** it SHALL not require localStorage-only state to restore the current lesson

### Requirement: Verification report includes source teacher gates
The final verification report SHALL explicitly account for source-grounded teacher runtime gates.

#### Scenario: Report maps requirements to tests
- **WHEN** final verification completes
- **THEN** the report SHALL list each source-grounded teacher requirement area and the automated or manual test that covers it
- **THEN** uncovered requirement areas SHALL be reported as test gaps, not silently ignored

#### Scenario: Manual checklist uses golden PDF
- **WHEN** the manual desktop checklist is generated
- **THEN** it SHALL include the exact `Chapter 3 2024-1.pdf` flow with expected results for audit, roadmap, tutor start, correct answer, incorrect answer, remediation, vault deployment, and coverage state

