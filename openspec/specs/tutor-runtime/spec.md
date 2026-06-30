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

#### Scenario: Diagnose first conceptual mistake
- **WHEN** the user submits an incorrect answer for the first time on a question
- **THEN** the system SHALL return a helpful hint that guides the user to the correct answer without revealing it
- **THEN** it SHALL allow the user to retry the same question

#### Scenario: Diagnose second consecutive conceptual mistake
- **WHEN** the user submits a second consecutive incorrect answer for the same question
- **THEN** the system SHALL return a detailed explanation explaining why their specific answer is wrong
- **THEN** it SHALL generate and present a new related question targeting the same concept for remediation

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

### Requirement: Single-question focused practice
The practice interface SHALL support a focused canvas layout displaying only one active question at a time.

#### Scenario: Show single question focused canvas
- **WHEN** the practice session is initialized for an active note
- **THEN** the UI SHALL hide all sidebars and lesson texts
- **THEN** it SHALL display only the active question card and submission controls

### Requirement: Chapter consolidation quiz gating
The system SHALL enforce a consolidation review quiz covering all atomic notes in a chapter before unlocking the next chapter in the curriculum.

#### Scenario: Locked next chapter
- **WHEN** the user completes the individual quizzes for all notes in Chapter X
- **THEN** the system SHALL lock the first note of Chapter X+1 until the Chapter X consolidation quiz is passed

#### Scenario: Unlock next chapter via consolidation quiz
- **WHEN** the user takes and passes the Chapter X consolidation quiz
- **THEN** the system SHALL unlock Chapter X+1 and generate its first atomic note file in the vault

### Requirement: Headless tutor tests
The tutoring runtime implementation SHALL be verified using headless backend unit and integration tests.

#### Scenario: Run tutor tests headlessly without network or AI
- **WHEN** the tutor test suite runs
- **THEN** the tests SHALL NOT open a Tauri window or an OS browser window
- **THEN** all LLM diagnostic calls SHALL be mocked using deterministic test fixtures
- **THEN** all session progress and scoring SHALL be validated using temporary SQLite database sessions and asynchronous test methods

### Requirement: Durable progression authority
The tutor runtime SHALL be the durable authority for current note, completed notes, unlocked notes, generated-ahead notes, and session status in progressive learning sessions.

#### Scenario: Persist generated and unlocked states separately
- **WHEN** the runtime generates future content ahead of the learner
- **THEN** the tutor session state SHALL persist the content path in a generated-ahead collection
- **THEN** it SHALL NOT add the path to active unlocks until mastery gates are satisfied

#### Scenario: Resume after restart
- **WHEN** Ater restarts during an active learning session
- **THEN** the tutor runtime SHALL restore current note, completed notes, active unlocks, generated-ahead items, score, and status from durable storage
- **THEN** the LearningWorkspace SHALL render from restored tutor state rather than localStorage-only progress

### Requirement: Transfer-gated mastery
The tutor runtime SHALL include transfer or application results when deciding whether a note is mastered.

#### Scenario: Recall pass without transfer does not unlock
- **WHEN** the user passes recall questions but has not completed the required transfer task
- **THEN** the tutor runtime SHALL keep the next Atomic Note locked
- **THEN** it SHALL return the remaining transfer gate requirement to the client

#### Scenario: Transfer pass unlocks next note
- **WHEN** the user passes required recall and transfer gates for the current Atomic Note
- **THEN** the tutor runtime SHALL mark the current Atomic Note completed
- **THEN** it SHALL unlock the next scheduled Atomic Note when one exists

### Requirement: FSRS scheduling on mastery
The tutor runtime SHALL schedule completed Atomic Notes for spaced repetition when mastery is recorded.

#### Scenario: Completed note enters FSRS
- **WHEN** a user completes all required gates for an Atomic Note
- **THEN** the runtime SHALL create or update the local FSRS card for that note
- **THEN** future practice and review views SHALL be able to retrieve the note as scheduled review content

### Requirement: Runtime-controlled remediation
The tutor runtime SHALL coordinate remediation and retry state for failed gates.

#### Scenario: Failed transfer task produces remediation
- **WHEN** the user fails a transfer or application task
- **THEN** the runtime SHALL return a remediation lesson, hint, follow-up question, or drill appropriate to the task type
- **THEN** it SHALL keep the current note active until the remediation path is satisfied

#### Scenario: Recurrent misconception persists
- **WHEN** the user repeatedly fails related gates for a topic
- **THEN** the runtime SHALL persist the misconception in the local misconception store
- **THEN** the adaptive learner model SHALL be able to include it in future recommendations

