## ADDED Requirements

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

