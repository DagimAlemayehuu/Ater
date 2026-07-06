## ADDED Requirements

### Requirement: Source-job-linked tutor sessions
The tutor runtime SHALL support sessions linked to a source learning job and concept graph.

#### Scenario: Start tutor from source job
- **WHEN** the user starts learning from a source learning job roadmap
- **THEN** the tutor runtime SHALL create or resume a tutor session linked to the source job ID
- **THEN** it SHALL set the current note to the first unlocked concept in the source graph

#### Scenario: Restore source tutor state
- **WHEN** an active source-grounded tutor session is loaded after restart
- **THEN** the tutor runtime SHALL restore source job ID, current concept, current note path, completed concepts, active unlocks, generated-ahead notes, warnings, and coverage state

### Requirement: Tutor updates source coverage
The tutor runtime SHALL update source coverage state whenever the learner interacts with a source-grounded concept.

#### Scenario: Correct recall updates coverage
- **WHEN** the user passes recall questions for a source-grounded concept
- **THEN** the tutor runtime SHALL mark recall passed on the matching source coverage row
- **THEN** it SHALL keep the concept incomplete until transfer gates pass when transfer is required

#### Scenario: Failed answer records remediation
- **WHEN** the user fails a source-grounded question
- **THEN** the tutor runtime SHALL record the failure and remediation state on the source coverage row
- **THEN** it SHALL keep the current concept active until the remediation path is satisfied

#### Scenario: Transfer pass schedules practice
- **WHEN** the user passes required transfer gates for a source-grounded concept
- **THEN** the tutor runtime SHALL mark the concept mastered
- **THEN** it SHALL schedule the concept for spaced practice
- **THEN** it SHALL update the source coverage row and unlock the next eligible concept

### Requirement: Source-aware remediation
The tutor runtime SHALL generate or select remediation using the source concept, source pages, teaching profile, and learner answer.

#### Scenario: Remediation stays source-grounded
- **WHEN** remediation is created for a failed concept from `Chapter 3 2024-1.pdf`
- **THEN** the remediation SHALL use that concept's source excerpts and teaching profile
- **THEN** it SHALL not introduce unrelated macroeconomics, programming, or biology examples

#### Scenario: Weak model remediation fallback
- **WHEN** AI remediation generation fails
- **THEN** the tutor runtime SHALL return a deterministic hint, source excerpt, and retry prompt
- **THEN** the failed coverage state SHALL remain visible

