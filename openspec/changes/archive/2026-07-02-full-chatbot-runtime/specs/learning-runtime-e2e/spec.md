## ADDED Requirements

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
