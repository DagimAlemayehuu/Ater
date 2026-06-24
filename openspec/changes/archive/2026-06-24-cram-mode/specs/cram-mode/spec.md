## ADDED Requirements

### Requirement: Cram Session Lifecycle Management
The system SHALL manage the initialization, phase progression, and dynamic compression of time-limited Cram Sessions.

#### Scenario: Start cram session with default time budget
- **WHEN** the user starts a cram session without specifying a duration
- **THEN** the system SHALL initialize a 60-minute Cram Session Plan
- **THEN** it SHALL set the current phase to `orientation`

#### Scenario: Start cram session with custom time budget
- **WHEN** the user starts a cram session specifying a 30-minute duration
- **THEN** the system SHALL initialize a 30-minute Cram Session Plan

#### Scenario: Adapt phase allocations for 15-minute budget
- **WHEN** the user starts a 15-minute cram session
- **THEN** the system SHALL set the orientation phase time to 0 minutes
- **THEN** it SHALL allocate 20% to `high_yield` (3 mins), 60% to `active_recall` (9 mins), and 20% to `mistake_repair` (3 mins)

### Requirement: Weakness Prioritization Scoring
The system SHALL calculate a deterministic, explainable weakness score for each note to determine cram priority.

#### Scenario: Score note with overconfident mistakes
- **WHEN** the note has recent incorrect tutor answers marked with high confidence wagers
- **THEN** the weakness prioritization score SHALL be higher than a note with incorrect answers marked with low confidence wagers

#### Scenario: Score note with FSRS retrievability
- **WHEN** the note has low FSRS retrievability
- **THEN** the weakness prioritization score SHALL increase proportionally to `1 - retrievability`

#### Scenario: Fallback scoring when no telemetry or FSRS exists
- **WHEN** a note has no FSRS review state and no tutor telemetry
- **THEN** the weakness prioritization score SHALL fallback to using planner high-yield weights and prerequisites

#### Scenario: Run short diagnostic quiz
- **WHEN** no telemetry exists but the user does not know nothing
- **THEN** the system SHALL run a 3-question diagnostic quiz and use the correctness results in the weakness score

### Requirement: Rescue Mode Triggering
The system SHALL dynamically activate rescue mode when the remaining time drops below a threshold.

#### Scenario: Trigger rescue mode below 15 percent time
- **WHEN** the remaining cram session time is less than 15% of the total budget (or under 5 minutes)
- **THEN** the system SHALL set `rescue_mode_active` to true
- **THEN** it SHALL filter the active study items to show only highest-yield facts, cheatsheet checklists, and formula cards

### Requirement: Cram Question Mix selection
The system SHALL choose a diverse question mix of active recall questions, avoiding writing-heavy tasks.

#### Scenario: Select short-answer and trace question mix
- **WHEN** compiling the question mix for cram mode
- **THEN** the system SHALL prioritize short-answer, trace code, and find error question types
- **THEN** it SHALL minimize open-ended writing questions unless essential to the topic

### Requirement: High-Yield Cram Variant Metadata Contract
The system SHALL define and verify the presence of compiled `lessons/<Atomic_Note>.cram.html` lesson files.

#### Scenario: Verify cram lesson variant path
- **WHEN** compiling the lesson variants for a note in cram mode
- **THEN** the system SHALL compile the lesson to `lessons/<Atomic_Note>.cram.html`
- **THEN** it SHALL add the `.cram.html` path under the `lesson_variants` frontmatter field

### Requirement: Headless verification of cram session
The system SHALL support testing the cram session scheduler, ranking, and rescue triggers without GUI or network access.

#### Scenario: Run cram tests headlessly
- **WHEN** the cram test suite runs
- **THEN** the tests SHALL NOT open a Tauri window or a browser window
- **THEN** the tests SHALL NOT require live AI or network access
