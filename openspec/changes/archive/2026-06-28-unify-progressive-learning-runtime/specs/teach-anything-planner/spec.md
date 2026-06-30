## ADDED Requirements

### Requirement: Teach Anything runtime handoff
The Teach Anything planner SHALL hand off planned curricula to the unified progressive learning runtime instead of owning a separate learner-facing flow.

#### Scenario: Planned topic creates runtime session
- **WHEN** the planner generates a curriculum for an arbitrary topic prompt
- **THEN** the system SHALL create or update a progressive learning runtime session for the planned Hub
- **THEN** the runtime session SHALL become the source of truth for current note, unlocks, and generated-ahead state

#### Scenario: Roadmap preview remains available
- **WHEN** the planner finishes curriculum planning
- **THEN** the user SHALL receive a roadmap preview with chapters and Atomic Notes
- **THEN** the roadmap SHALL indicate future lessons as locked unless already mastered in the runtime session

### Requirement: Generated-ahead planning compatibility
The Teach Anything planner SHALL support hidden generated-ahead buffers without exposing future content as unlocked.

#### Scenario: Progressive mode writes ahead invisibly
- **WHEN** the runtime asks the planner to prepare upcoming content for offline readiness
- **THEN** the planner MAY write future Atomic Note files, lesson variants, and artifact packs to the vault
- **THEN** the planner SHALL report those items as generated but not unlocked

#### Scenario: Existing generated notes do not bypass mastery
- **WHEN** a future Atomic Note file already exists in the vault
- **THEN** the runtime SHALL keep that note locked unless tutor progression state marks it unlocked
- **THEN** the UI SHALL not open that note from the learning map until it is unlocked

### Requirement: Transfer task planning
The Teach Anything planner SHALL include transfer or application tasks in planned learning objects for arbitrary topics.

#### Scenario: Planned note includes transfer gate
- **WHEN** the planner creates or prepares an Atomic Note learning object
- **THEN** the object SHALL include at least one transfer or application task
- **THEN** the task SHALL be selected according to the topic domain and learning mode

#### Scenario: Prompt-only topic avoids fake source grounding
- **WHEN** a Teach Anything topic has no uploaded source material
- **THEN** the planner SHALL generate transfer tasks from the topic, chapter, note title, and prompt context
- **THEN** it SHALL NOT invent page citations or source-specific claims

