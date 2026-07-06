## MODIFIED Requirements

### Requirement: Canonical source learning job lifecycle
The system SHALL create and persist a canonical source learning job for every user-facing source-to-learning entrypoint.

#### Scenario: Desktop PDF attachment creates source job
- **WHEN** the user attaches `Chapter 3 2024-1.pdf` from the Ater desktop chat source flow
- **THEN** the backend SHALL create one source learning job with a stable job ID
- **THEN** the job SHALL reference the copied Inbox file path and the originating conversation when available
- **THEN** the desktop client SHALL NOT independently orchestrate the legacy detect-plan-confirm pipeline as a second source of truth

#### Scenario: Chat attachment promotion creates source job
- **WHEN** the user promotes an existing PDF chat attachment into a learning source
- **THEN** the backend SHALL create or reuse a source learning job for that attachment
- **THEN** the job SHALL preserve the attachment ID, conversation ID, source file path, and extracted attachment metadata

#### Scenario: Course chapter upload creates source job
- **WHEN** the user uploads a PDF from an academic course or chapter hub
- **THEN** the backend SHALL create or reuse a source learning job for the uploaded file
- **THEN** the job SHALL preserve academic placement metadata for scope, semester, course, unit, chapter title, and parent hub path
- **THEN** the job SHALL return an editable roadmap before the tutor session starts

#### Scenario: Rerun resumes existing job
- **WHEN** the same source file is submitted again without source content changes
- **THEN** the system SHALL resume the existing job or create an explicit new version
- **THEN** it SHALL NOT duplicate vault notes, tutor sessions, or coverage rows silently

## ADDED Requirements

### Requirement: Source job roadmap quality absorbs legacy planner strengths
The source-grounded teacher runtime SHALL produce source job roadmaps with the useful planning safeguards formerly found in the legacy batch planner while keeping source jobs as the durable state owner.

#### Scenario: Planner handles large PDFs by chunks
- **WHEN** a source PDF is too large for one planning context
- **THEN** source job roadmap generation SHALL use chunk-aware extraction or refinement
- **THEN** merged roadmap concepts SHALL be deduplicated and grounded to page evidence

#### Scenario: Planner orders concepts for teaching
- **WHEN** roadmap concepts are finalized
- **THEN** the roadmap SHALL map prerequisites where possible
- **THEN** the roadmap SHALL order foundational concepts before dependent concepts
- **THEN** the roadmap SHALL group concepts into readable chapter sections for the hub roadmap

#### Scenario: Planner classifies modality
- **WHEN** roadmap concepts are accepted
- **THEN** each concept SHALL receive a domain and modality suitable for its source context
- **THEN** note compiler teaching profiles, artifact choices, and practice question families SHALL use that domain/modality information

### Requirement: Legacy batch deployment does not drive teacher sessions
The source-grounded teacher runtime SHALL not use the legacy batch deployment session as the mechanism for starting or advancing teacher sessions.

#### Scenario: Start lesson uses source tutor session
- **WHEN** the learner starts from a source job roadmap
- **THEN** the backend SHALL create or resume a source tutor session linked to the source job
- **THEN** the learner SHALL see current note, roadmap, coverage, and mastery state from the source job/tutor runtime
- **THEN** the learner SHALL NOT see legacy batch step controls such as `Deploy Step 1`, `Next Step`, or `Finish All`

#### Scenario: Background generation is source-job-owned
- **WHEN** future Atomic Notes generate ahead
- **THEN** generation SHALL be associated with the source job and tutor session state
- **THEN** coverage rows SHALL reflect compilation, deployment, warnings, and unlock state
- **THEN** legacy queue batch rows SHALL NOT be required to determine learning progress
