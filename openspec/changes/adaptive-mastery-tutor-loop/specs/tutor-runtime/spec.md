## MODIFIED Requirements

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

## ADDED Requirements

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
