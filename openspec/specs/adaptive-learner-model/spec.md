# Adaptive Learner Model Spec

## Purpose
This specification defines the requirements for the Adaptive Learner Model capability in Ater.
## Requirements
### Requirement: Learner Profile Persistence
The system SHALL initialize and maintain topic-level learner profiles in the local SQLite database.

#### Scenario: Initialize learner profile for new topic
- **WHEN** the system calculates stats for a topic with no prior entry in `learner_profile_stats`
- **THEN** it SHALL create a new row with default values (accuracy = 1.0, calibration = 0.0)

#### Scenario: Aggregate completed notes and accuracy
- **WHEN** a user completes tutor answers for a topic
- **THEN** the system SHALL update `notes_completed`, `accuracy_rate`, and `avg_retrievability` in the database

### Requirement: Confidence Calibration Calculation
The system SHALL compute a calibration error index based on historical correctness and confidence wagers.

#### Scenario: Identify overconfident profile
- **WHEN** the user has a high ratio of incorrect answers wagered with high confidence
- **THEN** the calculated calibration index SHALL be positive (> 0.2)
- **THEN** the calibration status SHALL report as `overconfident`

#### Scenario: Identify calibrated profile
- **WHEN** the user's wagers match actual correctness
- **THEN** the calculated calibration index SHALL remain near zero ([-0.2, 0.2])

### Requirement: Misconception Aggregation
The system SHALL bubble up and list persistent misconceptions grouped by topic.

#### Scenario: List frequent misconceptions
- **WHEN** the sidecar retrieves the topic learner profile
- **THEN** it SHALL compile a list of distinct misconception texts from the database logs matching the topic

### Requirement: Next-Lesson Recommendation Scheduling
The system SHALL recommend optimal next notes prioritizing low retrievability and satisfying prerequisite order.

#### Scenario: Rank notes satisfying prerequisites
- **WHEN** the system recommends next lessons for a topic
- **THEN** notes with missing prerequisites SHALL receive a score penalty, placing them below notes whose prerequisites are completed

#### Scenario: Rank notes by low FSRS retrievability
- **WHEN** all prerequisites are satisfied
- **THEN** the note with lower FSRS retrievability SHALL be ranked above notes with higher retrievability

### Requirement: Headless Verification
The learner model services SHALL be verified completely headlessly.

#### Scenario: Run learner model tests headlessly
- **WHEN** the test suite runs
- **THEN** it SHALL NOT require internet access or open Tauri/browser windows

### Requirement: Mastery gate telemetry aggregation
The adaptive learner model SHALL aggregate recall, remediation, transfer, and unlock outcomes into the learner profile.

#### Scenario: Update profile after mastery gate
- **WHEN** the user completes a mastery gate for an Atomic Note
- **THEN** the learner model SHALL update topic-level completion, accuracy, calibration, and transfer performance metrics
- **THEN** the updated profile SHALL be available for next-lesson recommendations

#### Scenario: Track transfer weakness
- **WHEN** the user passes recall but fails transfer tasks for a topic
- **THEN** the learner model SHALL record transfer weakness for that topic
- **THEN** future recommendations SHALL prioritize application-focused practice before advancing too far

### Requirement: Arbitrary-topic recommendation support
The adaptive learner model SHALL support recommendations for self-study, coursework, PDF-backed, and external-skill learning sessions.

#### Scenario: Recommend next self-study note
- **WHEN** the runtime requests recommendations for a self-study Learning Hub
- **THEN** the learner model SHALL rank next notes using prerequisite order, unlock state, FSRS retrievability, and recent gate outcomes

#### Scenario: Recommend external-skill practice
- **WHEN** the topic is an external or physical skill
- **THEN** the learner model SHALL be able to recommend checklist, drill, scenario, or reflection practice based on recorded transfer outcomes
- **THEN** it SHALL NOT require objective sensor or video evidence to produce a recommendation

### Requirement: Misconception recurrence handling
The adaptive learner model SHALL detect recurring misconceptions across notes and use them to adjust learning recommendations.

#### Scenario: Recurring misconception delays advancement
- **WHEN** the same misconception or closely related misconception appears across multiple gates in a topic
- **THEN** the learner model SHALL mark the topic as unstable
- **THEN** the runtime SHALL prefer remediation or synthesis practice before unlocking substantially harder content

### Requirement: Source-grounded mastery telemetry
The adaptive learner model SHALL aggregate source-grounded concept outcomes into learner profiles.

#### Scenario: Mastery updates learner model
- **WHEN** the user masters a source-grounded concept
- **THEN** the learner model SHALL update topic-level completion, recall accuracy, transfer performance, calibration, and practice scheduling signals

#### Scenario: Source objective weakness is visible
- **WHEN** the user repeatedly fails concepts mapped to the same source objective
- **THEN** the learner model SHALL record that source objective as weak
- **THEN** recommendations SHALL prioritize remediation or practice for that objective before substantially harder content

### Requirement: Source coverage informs recommendations
The adaptive learner model SHALL consider source job coverage and concept graph prerequisites when recommending the next learning action.

#### Scenario: Recommend uncovered prerequisite
- **WHEN** a source job has uncovered prerequisite concepts before a later concept
- **THEN** the learner model SHALL recommend the uncovered prerequisite before the later concept

#### Scenario: Recommend application practice after transfer weakness
- **WHEN** the user passes recall but fails transfer for a source-grounded concept
- **THEN** the learner model SHALL recommend application-focused practice for that concept
- **THEN** it SHALL not treat recall success alone as durable mastery

### Requirement: Source misconception recurrence
The adaptive learner model SHALL detect recurring misconceptions across source-grounded concepts and objectives.

#### Scenario: Recurring consumer theory misconception
- **WHEN** the user repeatedly confuses utility, preference ranking, budget line, or consumer equilibrium across the golden PDF concepts
- **THEN** the learner model SHALL group the related misconception under the source job topic
- **THEN** future recommendations SHALL prefer remediation, contrast practice, or synthesis before advancing

