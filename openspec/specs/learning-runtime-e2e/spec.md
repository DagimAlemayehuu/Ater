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

### Requirement: Unified runtime end-to-end coverage
The E2E test suite SHALL verify that topic prompts, PDF sources, and existing Hubs all enter the same progressive learning runtime.

#### Scenario: Topic prompt E2E
- **WHEN** a test user asks to learn a topic from scratch
- **THEN** the test SHALL verify roadmap preview, first note generation, Proving Grounds rendering, mastery unlock, and session persistence through the unified runtime

#### Scenario: PDF source E2E
- **WHEN** a test user uploads a mock PDF source
- **THEN** the test SHALL verify source-grounded roadmap creation, first note opening, page citation metadata, hidden generated-ahead content, and Jump to PDF availability

#### Scenario: Existing Hub E2E
- **WHEN** a test vault contains an existing Learning Hub or coursework Hub
- **THEN** the test SHALL verify session resume or creation without duplicate Hub creation
- **THEN** the test SHALL verify locked roadmap rendering from runtime state

### Requirement: Offline progressive learning verification
The E2E test suite SHALL verify that already-generated and unlocked content remains usable after simulated offline restart.

#### Scenario: Reopen offline after background generation
- **WHEN** the runtime has generated the current note and at least one generated-ahead item locally
- **THEN** a simulated offline app restart SHALL restore the current session
- **THEN** the current unlocked note and embedded practice SHALL remain usable without network access

#### Scenario: Locked generated-ahead content remains hidden offline
- **WHEN** generated-ahead content exists locally but is not unlocked
- **THEN** the offline UI SHALL keep that content locked
- **THEN** the test SHALL verify the user cannot open future content solely because its file exists

### Requirement: Teacher route removal verification
The E2E and regression test suite SHALL verify that the stale Teacher route and sidecar API are no longer independent learning paths.

#### Scenario: Desktop route removed
- **WHEN** route tests inspect the desktop router
- **THEN** `/teacher` SHALL not render `routes/teacher.tsx` as an independent Teacher interface
- **THEN** supported learning entry points SHALL resolve through the unified Ater learning runtime

#### Scenario: Sidecar Teacher API removed
- **WHEN** API route tests inspect mounted FastAPI routes
- **THEN** `/api/teacher/chat` SHALL not be mounted as an independent endpoint
- **THEN** teaching behavior SHALL be covered by unified Ater runtime endpoint tests

### Requirement: Hidden generation UI verification
The desktop test suite SHALL verify that generated-ahead background work does not expose pipeline complexity or locked note content.

#### Scenario: Background generation does not show batch logs
- **WHEN** background generation is active during a learning session
- **THEN** the LearningWorkspace SHALL continue to show current lesson and locked roadmap
- **THEN** it SHALL not show raw queue status, batch feed logs, or future note bodies

#### Scenario: Bulk ingest remains explicit
- **WHEN** the user opens the old pipeline or Inbox watcher surface
- **THEN** the UI SHALL label it as bulk ingest or background import
- **THEN** the UI SHALL not present it as the default way to learn from an uploaded PDF

### Requirement: Chatbot runtime E2E coverage
The E2E verification suite SHALL cover durable chatbot runtime entrypoints for learning workflows.

#### Scenario: Topic prompt persists across restart
- **WHEN** a test user asks Oracle to teach a topic from scratch
- **THEN** the test SHALL verify persisted conversation records, roadmap metadata, first lesson generation, tutor session link, and reopen after simulated restart

#### Scenario: Source prompt persists across restart
- **WHEN** a test user attaches a mock PDF source and asks to learn from it
- **THEN** the test SHALL verify attachment extraction, source-grounded roadmap creation, citation metadata, chat warning rendering metadata, and reopen after simulated restart

#### Scenario: Existing Hub resumes from chat
- **WHEN** a test conversation links to an existing Hub and tutor session
- **THEN** the test SHALL verify no duplicate Hub creation
- **THEN** it SHALL verify current, completed, generated-ahead, and locked roadmap state is restored from durable sidecar state

### Requirement: Chatbot runtime regression matrix
The final verification suite SHALL include targeted regression tests for the durable chat runtime.

#### Scenario: Run chat runtime regression tests
- **WHEN** final verification runs
- **THEN** it SHALL run or account for backend tests covering conversation storage, message branching, context packing, memory retrieval, attachment context, streaming cancellation, and tool audit logs
- **THEN** it SHALL run or account for desktop tests covering persistent chat loading, send/stop/regenerate/branch controls, memory UI, attachment UI, citations, and tool timeline

