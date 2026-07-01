## ADDED Requirements

### Requirement: Unified learning entry-point normalization
The system SHALL normalize topic prompts, uploaded source documents, and existing Hubs into a single progressive learning session contract.

#### Scenario: Start from topic prompt
- **WHEN** the user asks Ater to learn a topic such as "teach me grip from scratch"
- **THEN** the system SHALL create a progressive learning session using the unified runtime
- **THEN** the system SHALL return a roadmap preview before opening the first lesson

#### Scenario: Start from uploaded PDF
- **WHEN** the user uploads a PDF from the Ater chat learning surface
- **THEN** the system SHALL create a source-grounded progressive learning session using the unified runtime
- **THEN** the system SHALL NOT expose the old batch deployment log as the primary learning experience

#### Scenario: Start from existing Hub
- **WHEN** the user continues learning from an existing Learning Hub or coursework Hub
- **THEN** the system SHALL resume or create a progressive learning session for that Hub
- **THEN** the system SHALL preserve the existing Hub and Atomic Note files without destructive rewrite

### Requirement: Hidden generated-ahead buffer
The system SHALL support generating upcoming learning content in the background while keeping future content locked until mastery gates are passed.

#### Scenario: Generate future notes without unlocking them
- **WHEN** the runtime generates future Atomic Notes, quizzes, lesson variants, or artifact packs ahead of the current lesson
- **THEN** the runtime SHALL mark those items as generated
- **THEN** the runtime SHALL NOT mark those items as unlocked until the tutor runtime records mastery of prerequisite content

#### Scenario: Hide background generation from primary learner UI
- **WHEN** background generation is running during a learning session
- **THEN** the learner-facing UI SHALL continue to show the current lesson, progress map, and locked future items
- **THEN** the UI SHALL NOT show batch logs, raw queue state, or generated future note content in the main learning flow

#### Scenario: Preserve offline readiness
- **WHEN** generated-ahead content exists locally before the app goes offline
- **THEN** the user SHALL be able to continue reading and practicing currently unlocked generated content while offline
- **THEN** the runtime SHALL not require network access to display already-generated Atomic Notes or embedded quizzes

### Requirement: Mastery-gated unlock loop
The system SHALL enforce a read -> prove -> remediate -> transfer -> unlock loop for progressive learning sessions.

#### Scenario: Unlock after mastery
- **WHEN** the user completes the current Atomic Note's required recall and transfer gates
- **THEN** the runtime SHALL persist the current note as completed
- **THEN** the runtime SHALL unlock the next scheduled Atomic Note if one exists

#### Scenario: Remediate before unlock
- **WHEN** the user fails a required mastery gate
- **THEN** the runtime SHALL provide targeted remediation or a follow-up question
- **THEN** the runtime SHALL keep the next Atomic Note locked until the remediation path is passed or the current gate is otherwise satisfied

#### Scenario: Complete learning session
- **WHEN** the user completes all required notes and chapter gates in the curriculum
- **THEN** the runtime SHALL mark the learning session as completed
- **THEN** the runtime SHALL preserve the completed roadmap for future review

### Requirement: Transfer task support for arbitrary topics
The system SHALL include transfer or application tasks in the mastery path so Ater can support learning beyond rote recall.

#### Scenario: Generate domain-aware transfer task
- **WHEN** an Atomic Note is prepared for learning
- **THEN** the runtime SHALL provide at least one transfer or application task appropriate to the note's domain
- **THEN** the task SHALL require applying the concept in a new situation rather than merely restating the definition

#### Scenario: Support physical or external skills
- **WHEN** the learning topic is a physical or external skill that cannot be objectively verified by text alone
- **THEN** the runtime SHALL use a self-assessment, drill checklist, scenario judgment, or reflection task as the transfer gate
- **THEN** the runtime SHALL avoid claiming objective performance verification unless evidence capture is available

### Requirement: Teacher route retirement
The system SHALL remove the stale Teacher route and Teacher sidecar API as independent learning paths.

#### Scenario: Teacher route unavailable
- **WHEN** the user navigates to `/teacher`
- **THEN** the desktop client SHALL NOT render a standalone Teacher interface
- **THEN** the supported learning path SHALL be the unified Ater learning runtime

#### Scenario: Teacher API removed from mounted routers
- **WHEN** the FastAPI sidecar starts
- **THEN** it SHALL NOT mount `/api/teacher/chat` as an independent learning endpoint
- **THEN** all supported teaching behavior SHALL be available through the unified Ater learning runtime

### Requirement: Explicit bulk ingest mode
The system SHALL preserve the old Inbox watcher as an explicit bulk ingest mode and separate it from the default progressive learning experience.

#### Scenario: User chooses bulk ingest
- **WHEN** the user explicitly enables or opens bulk Inbox ingestion
- **THEN** the system MAY run the detect-plan-confirm batch workflow for files in Inbox
- **THEN** the UI SHALL label the workflow as bulk ingest or background import rather than the main lesson flow

#### Scenario: Default PDF learning avoids bulk ingest UI
- **WHEN** the user uploads a PDF from the main Ater chat learning flow
- **THEN** the system SHALL use the progressive learning runtime
- **THEN** the system SHALL NOT require the user to monitor Inbox queue status to begin learning

