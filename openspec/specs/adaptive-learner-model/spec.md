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
