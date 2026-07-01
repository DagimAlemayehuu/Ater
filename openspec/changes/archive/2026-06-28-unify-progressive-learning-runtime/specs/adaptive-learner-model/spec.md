## ADDED Requirements

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

