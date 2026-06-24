# Learning Runtime E2E Spec

## Purpose
This specification defines the requirements for the Learning Runtime E2E capability in Ater.

## Requirements

### Requirement: End-to-End Integration Testing
The system SHALL support executing a unified end-to-end integration test verifying all 9 core learning runtime modules in sequence.

#### Scenario: Run planner to compiler integration
- **GIVEN** a temporary vault sandbox
- **WHEN** the planner writes the curriculum (Hub, Chapters, Atomic Note stubs)
- **THEN** the Learning Hub SHALL be written under the self-study Hub route
- **THEN** Chapter files and Atomic Notes SHALL be written under the expected content route
- **THEN** the compiler SHALL compile these stubs into HTML lessons, resolving relative previous/next links and hub navigations
- **THEN** the compiled HTML SHALL include the full Markdown source for the Atomic Note

#### Scenario: Run compiler to artifact mapping integration
- **GIVEN** compiled lesson files on disk
- **WHEN** the artifact service is called to generate interactive packs
- **THEN** it SHALL create the versioned JSON pack inside the chapter's `artifacts/` subfolder
- **THEN** the pack SHALL preserve prior versions when a new version is appended
- **THEN** pinned artifact types SHALL be readable without parsing HTML
- **THEN** the validator SHALL report the learning object set as valid

#### Scenario: Run tutor session with persistence
- **GIVEN** a temporary SQLite database initialized with tutor schemas
- **WHEN** the user starts a tutor session and submits answers with confidence wagers
- **THEN** the session manager SHALL update the score in the database
- **THEN** incorrect high-confidence wagers SHALL log to the misconceptions table
- **THEN** the tutor response SHALL include actionable mistake repair feedback

#### Scenario: Run adaptive cram session
- **GIVEN** an active hub and notes in the temporary database
- **WHEN** a 15-minute cram session is initialized
- **THEN** the scheduler SHALL compress the phase allocations and skip orientation
- **THEN** the weakness priority helper SHALL rank notes based on FSRS and telemetry
- **THEN** rescue mode SHALL trigger when remaining time falls below 15%
- **THEN** the selected question mix SHALL include more than one question type and SHALL NOT collapse to only multiple-choice or true/false

#### Scenario: Run source-grounded planning with search
- **GIVEN** a mock PDF document text
- **WHEN** the source planner plans the curriculum and search augmentation is approved
- **THEN** the note stubs SHALL write with page citations and search URLs in their frontmatter
- **THEN** source grounding SHALL remain deterministic under mocked search results

#### Scenario: Run SQL playground and case simulation
- **WHEN** a user submits a query to the SQL evaluate endpoint
- **THEN** the sidecar SHALL run the query against a transient SQLite database and verify columns and row values
- **WHEN** a user submits a branching choice to the Case Simulation endpoint
- **THEN** the sidecar SHALL update the metrics additively and clamp percentages between 0.0 and 1.0

#### Scenario: Recalibrate learner profile
- **WHEN** the tutor session completes
- **THEN** the learner model service SHALL compute accuracy rates, overconfidence counts, and next-lesson recommendations
- **THEN** prerequisite-blocked recommendations SHALL not be selected ahead of currently available next lessons

### Requirement: Phase Regression Matrix
The system SHALL run a targeted regression matrix covering the learning runtime phase tests before the changes are archived.

#### Scenario: Run phase-specific regression tests
- **WHEN** the final verification suite runs
- **THEN** it SHALL run or account for tests covering learning object model, Teach Anything planner, lesson compiler, artifact packs, tutor runtime, cram mode, source-driven learning, advanced artifacts, and adaptive learner model
- **THEN** missing expected test files SHALL be reported as either covered by another named test file or as a real test gap

#### Scenario: Map failures to responsible phase
- **WHEN** a regression or E2E assertion fails
- **THEN** the final verification report SHALL identify the likely responsible phase/change
- **THEN** the report SHALL include a copy-paste fix prompt for the phase implementation agent

### Requirement: Headless Execution
The E2E test suite SHALL run completely headlessly without GUI or network dependencies.

#### Scenario: Run E2E tests offline and headlessly
- **WHEN** the E2E test suite executes
- **THEN** it SHALL NOT require Gemini API, DuckDuckGo API, or Tauri browser windows
- **THEN** it SHALL NOT open an operating-system browser window
- **THEN** it SHALL NOT require manual visual inspection to pass automated tests

### Requirement: Final Verification Artifacts
The system SHALL produce durable verification artifacts for the user before archive.

#### Scenario: Write final verification report
- **WHEN** the final automated verification completes
- **THEN** the tester SHALL write a Markdown report containing exact commands run, pass/fail results, phase coverage, failures, residual risks, and archive recommendation
- **THEN** the archive recommendation SHALL be `no` if any automated test or OpenSpec validation fails

#### Scenario: Write manual desktop verification checklist
- **WHEN** the final automated verification completes
- **THEN** the tester SHALL write a step-by-step manual desktop verification checklist
- **THEN** every manual step SHALL include an expected result
- **THEN** the checklist SHALL cover Teach Anything planning, Explorer navigation, HTML lesson opening, artifacts, tutor loop, cram mode, source-driven learning if exposed, artifact versioning, and offline reopening

### Requirement: Archive Gate
The system SHALL prevent premature archiving of learning runtime changes.

#### Scenario: Do not archive on automated-only success
- **WHEN** automated E2E tests pass
- **THEN** the tester SHALL NOT archive changes automatically
- **THEN** the tester SHALL wait for the user to complete manual verification and explicitly approve archiving

#### Scenario: Route failures instead of archiving
- **WHEN** any automated or manual verification fails
- **THEN** the tester SHALL produce the targeted fix prompt for the responsible phase
- **THEN** the archive recommendation SHALL remain `no`
