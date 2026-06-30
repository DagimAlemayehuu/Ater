## ADDED Requirements

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
