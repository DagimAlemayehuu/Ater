## MODIFIED Requirements

### Requirement: Headless tutor tests
The tutoring runtime implementation SHALL be verified using headless backend unit and integration tests.

#### Scenario: Run tutor tests headlessly without network or AI
- **WHEN** the tutor test suite runs
- **THEN** the tests SHALL NOT open a Tauri window or an OS browser window
- **THEN** all LLM diagnostic calls SHALL be mocked using deterministic test fixtures
- **THEN** all session progress and scoring SHALL be validated using temporary SQLite database sessions and asynchronous test methods
