# Tutor Runtime Spec

## Purpose
This specification defines the requirements for the Tutor Runtime capability in Ater.

## Requirements

### Requirement: Tutor session lifecycle management
The system SHALL manage the initialization, state persistence, and completion of active tutoring sessions in the local SQLite database.

#### Scenario: Start tutor session
- **WHEN** the user starts a learning session for a specific Hub
- **THEN** the system SHALL create a new session entry in `tutor_sessions` with status `active`
- **THEN** it SHALL set the current note path to the first note in the curriculum

#### Scenario: Resume tutor session
- **WHEN** the system loads an existing incomplete session by ID
- **THEN** it SHALL restore the session state including completed notes and current score

#### Scenario: Complete tutor session
- **WHEN** all notes in the curriculum are finished
- **THEN** the system SHALL update the session status to `completed` in the database

### Requirement: Confidence wager scoring
The system SHALL calculate points for each submitted answer based on correctness and the user's confidence rating.

#### Scenario: Score correct high confidence
- **WHEN** the user submits a correct answer with a `high` confidence wager
- **THEN** the system SHALL award +10 points to the session score

#### Scenario: Score incorrect high confidence
- **WHEN** the user submits an incorrect answer with a `high` confidence wager
- **THEN** the system SHALL deduct 5 points from the session score
- **THEN** it SHALL trigger misconception diagnosis

### Requirement: Mistake diagnosis and misconception capture
The system SHALL analyze incorrect answers to generate helpful hints and log persistent misconceptions.

#### Scenario: Diagnose conceptual mistake
- **WHEN** the user submits an incorrect answer
- **THEN** the system SHALL return a helpful hint that guides the user to the correct answer without revealing it
- **THEN** it SHALL identify if a conceptual misconception is present

#### Scenario: Log user misconception
- **WHEN** a conceptual misconception is detected
- **THEN** the system SHALL log the misconception text and the source note title to the `user_misconceptions` table

### Requirement: Iframe event communication protocol
The system SHALL handle structured postMessage events dispatched from the HTML lesson iframe to coordinate state updates in the host client.

#### Scenario: Handle answer submission event
- **WHEN** the lesson iframe dispatches an `ANSWER_SUBMITTED` event
- **THEN** the host client SHALL forward the payload (question ID, user answer, and confidence wager) to the sidecar API
- **THEN** it SHALL update the session state and return the correctness feedback and hint

#### Scenario: Handle next note navigation event
- **WHEN** the lesson iframe dispatches a `NEXT_NOTE` event
- **THEN** the host client SHALL advance the session to the next note in the curriculum
- **THEN** it SHALL reload the iframe with the new note's HTML lesson

### Requirement: Headless tutor tests
The tutoring runtime implementation SHALL be verified using headless backend unit and integration tests.

#### Scenario: Run tutor tests headlessly without network or AI
- **WHEN** the tutor test suite runs
- **THEN** the tests SHALL NOT open a Tauri window or an OS browser window
- **THEN** all LLM diagnostic calls SHALL be mocked using deterministic test fixtures
- **THEN** all session progress and scoring SHALL be validated using temporary SQLite database sessions
