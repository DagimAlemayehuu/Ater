## MODIFIED Requirements

### Requirement: Source planning converges on source learning jobs
Source-driven learning SHALL use the canonical source learning job lifecycle for source upload, attachment promotion, course/chapter PDF upload, and PDF learning roadmaps. The system MUST NOT expose the legacy detect-plan-confirm batch pipeline as a user-facing learning path.

#### Scenario: Source upload returns job state
- **WHEN** a PDF is uploaded through the source-driven learning API
- **THEN** the API SHALL create or resume a source learning job
- **THEN** the response SHALL include job ID, extraction audit summary, warnings, and next action

#### Scenario: Existing planner output attaches to job
- **WHEN** source-grounded curriculum planning produces chapters or Atomic Note candidates
- **THEN** the output SHALL be persisted as source job source map, concept graph, or roadmap state
- **THEN** it SHALL NOT remain only an ephemeral response payload

#### Scenario: Legacy batch planner is not a user-facing path
- **WHEN** the desktop client starts PDF learning from chat, course, chapter hub, or source attachment promotion
- **THEN** the desktop client SHALL create or resume a source learning job
- **THEN** it SHALL NOT call legacy `/api/ater/process`, `/api/ater/plan`, or `/api/ater/confirm` endpoints

## ADDED Requirements

### Requirement: Course-first PDF learning entrypoint
Source-driven learning SHALL let the learner begin PDF learning from the academic course/chapter context without manually placing files in an Inbox folder.

#### Scenario: Course chapter upload creates roadmap
- **WHEN** the learner opens a course or chapter hub and uploads a PDF
- **THEN** Ater SHALL copy the PDF into the managed Inbox location
- **THEN** Ater SHALL create or resume a source learning job with academic placement metadata including learning scope, semester, course, unit, chapter title, and parent hub path
- **THEN** Ater SHALL show an editable source-grounded roadmap before starting the lesson

#### Scenario: Roadmap confirmation starts lesson
- **WHEN** the learner confirms the generated roadmap
- **THEN** Ater SHALL persist any roadmap edits on the source learning job
- **THEN** Ater SHALL start or resume the source tutor session
- **THEN** Ater SHALL open the current Atomic Note and teacher workspace

### Requirement: Legacy Inbox watcher learning path is retired
Source-driven learning SHALL NOT require or encourage dropping PDFs into an Inbox folder for automatic Atomic Note generation.

#### Scenario: Bulk tab is unavailable
- **WHEN** the learner opens the Agents/Oracle page
- **THEN** the page SHALL show conversations and chat controls
- **THEN** it SHALL NOT show a Bulk, pipeline, queue, auto-ingest, planned batches, or drop-PDF-in-Inbox learning tab

#### Scenario: Auto-ingest toggle is unavailable for learning
- **WHEN** the learner configures source learning from the desktop UI
- **THEN** no user-facing control SHALL enable the legacy `AterQueueManager` to auto-process Inbox files into Atomic Notes
- **THEN** source learning SHALL begin from explicit upload, attachment promotion, or course/chapter action

### Requirement: Legacy PDF learning endpoints are not desktop contracts
The desktop client SHALL no longer treat legacy Ater process, plan, confirm, watcher, or queue endpoints as supported learning contracts.

#### Scenario: No desktop caller remains
- **WHEN** frontend and Tauri command code is searched for legacy learning calls
- **THEN** no course, chat, academic, or Agents learning flow SHALL call `aterProcess`, `aterGeneratePlan`, `aterConfirm`, `aterWatcherToggle`, or queue status for learning generation

#### Scenario: Existing source jobs remain readable
- **WHEN** legacy learning endpoints are removed, quarantined, or return an unsupported response
- **THEN** existing source learning jobs, tutor sessions, generated notes, study history, SRS state, and coverage rows SHALL remain readable and usable

### Requirement: Roadmap generation preserves useful legacy planner behavior
Source-driven learning SHALL improve source learning job roadmap quality by preserving useful legacy planner behavior without keeping the old batch deployment pipeline.

#### Scenario: Academic metadata snaps to vault context
- **WHEN** a course/chapter PDF upload creates a source learning job
- **THEN** roadmap planning SHALL use the supplied academic placement metadata as the primary context
- **THEN** it SHALL snap course, semester, unit, and hub identity to existing vault records when available

#### Scenario: Roadmap uses robust concept planning
- **WHEN** a source learning job builds a roadmap
- **THEN** planning SHALL use source extraction, domain routing, chunk-aware concept extraction or refinement, coverage gap detection, prerequisite mapping, modality classification, source-page grounding, topological ordering, and chapter grouping where applicable
- **THEN** every accepted roadmap item SHALL be grounded to source pages or carry an unresolved warning

#### Scenario: Weak planner fallback is honest
- **WHEN** AI roadmap refinement fails, times out, or returns malformed output
- **THEN** Ater SHALL keep a deterministic source-grounded roadmap when possible
- **THEN** Ater SHALL record warnings for degraded planning rather than silently claiming full quality
