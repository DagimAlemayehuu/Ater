## ADDED Requirements

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

