## ADDED Requirements

### Requirement: End-to-End Integration Testing
The system SHALL support executing a unified end-to-end integration test verifying all 9 core learning runtime modules in sequence.

#### Scenario: Run planner to compiler integration
- **GIVEN** a temporary vault sandbox
- **WHEN** the planner writes the curriculum (Hub, Chapters, Atomic Note stubs)
- **THEN** the compiler SHALL compile these stubs into HTML lessons, resolving relative previous/next links and hub navigations

#### Scenario: Run compiler to artifact mapping integration
- **GIVEN** compiled lesson files on disk
- **WHEN** the artifact service is called to generate interactive packs
- **THEN** it SHALL create the versioned JSON pack inside the chapter's `artifacts/` subfolder
- **THEN** the validator SHALL report the learning object set as valid

#### Scenario: Run tutor session with persistence
- **GIVEN** a temporary SQLite database initialized with tutor schemas
- **WHEN** the user starts a tutor session and submits answers with confidence wagers
- **THEN** the session manager SHALL update the score in the database
- **THEN** incorrect high-confidence wagers SHALL log to the misconceptions table

#### Scenario: Run adaptive cram session
- **GIVEN** an active hub and notes in the temporary database
- **WHEN** a 15-minute cram session is initialized
- **THEN** the scheduler SHALL compress the phase allocations and skip orientation
- **THEN** the weakness priority helper SHALL rank notes based on FSRS and telemetry
- **THEN** rescue mode SHALL trigger when remaining time falls below 15%

#### Scenario: Run source-grounded planning with search
- **GIVEN** a mock PDF document text
- **WHEN** the source planner plans the curriculum and search augmentation is approved
- **THEN** the note stubs SHALL write with page citations and search URLs in their frontmatter

#### Scenario: Run SQL playground and case simulation
- **WHEN** a user submits a query to the SQL evaluate endpoint
- **THEN** the sidecar SHALL run the query against a transient SQLite database and verify columns and row values
- **WHEN** a user submits a branching choice to the Case Simulation endpoint
- **THEN** the sidecar SHALL update the metrics additively and clamp percentages between 0.0 and 1.0

#### Scenario: Recalibrate learner profile
- **WHEN** the tutor session completes
- **THEN** the learner model service SHALL compute accuracy rates, overconfidence counts, and next-lesson recommendations

### Requirement: Headless Execution
The E2E test suite SHALL run completely headlessly without GUI or network dependencies.

#### Scenario: Run E2E tests offline and headlessly
- **WHEN** the E2E test suite executes
- **THEN** it SHALL NOT require Gemini API, DuckDuckGo API, or Tauri browser windows
