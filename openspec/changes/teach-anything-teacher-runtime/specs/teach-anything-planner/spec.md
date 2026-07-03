## ADDED Requirements

### Requirement: Planner output becomes durable prompt job state
The Teach Anything planner SHALL persist roadmap, curriculum, assumptions, and generated source-pack state instead of relying on volatile in-process cache.

#### Scenario: Roadmap survives restart
- **WHEN** a prompt-first roadmap has been generated
- **THEN** Ater SHALL be able to restore it after backend restart from durable job state

#### Scenario: Start lesson after restart
- **WHEN** the user clicks Start Learning after a restart
- **THEN** the system SHALL start from persisted prompt job state
- **THEN** it SHALL not require an in-memory curriculum cache entry

### Requirement: Planner validates scope
The Teach Anything planner SHALL validate generated scope before exposing a roadmap.

#### Scenario: Scope too broad warning
- **WHEN** the user asks to learn an extremely broad topic like "teach me biology"
- **THEN** the planner SHALL either ask a clarification or create a staged overview with explicit assumptions and warnings

