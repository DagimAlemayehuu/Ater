## ADDED Requirements

### Requirement: Source planning converges on source learning jobs
Source-driven learning SHALL use the canonical source learning job lifecycle for source upload, attachment promotion, and PDF learning roadmaps.

#### Scenario: Source upload returns job state
- **WHEN** a PDF is uploaded through the source-driven learning API
- **THEN** the API SHALL create or resume a source learning job
- **THEN** the response SHALL include job ID, extraction audit summary, warnings, and next action

#### Scenario: Existing planner output attaches to job
- **WHEN** source-grounded curriculum planning produces chapters or Atomic Note candidates
- **THEN** the output SHALL be persisted as source job source map, concept graph, or roadmap state
- **THEN** it SHALL NOT remain only an ephemeral response payload

### Requirement: Source warning approval belongs to the job
Source-driven learning SHALL persist warning state and user decisions on the source learning job.

#### Scenario: High-severity warning blocks hidden generation
- **WHEN** high-severity source extraction or coverage warnings exist
- **THEN** hidden background note generation SHALL pause for the affected concepts
- **THEN** the job SHALL record whether the user approved, waived, or deferred the warning

#### Scenario: Web augmentation remains consented
- **WHEN** source coverage is weak and web augmentation could help
- **THEN** the system SHALL require explicit user consent before using search augmentation
- **THEN** the source job SHALL record augmented sources separately from the original PDF source

### Requirement: Source-driven chat attachment promotion uses unified runtime
Source-driven learning SHALL promote durable chat attachments into source learning jobs when the user asks to learn from an attached source.

#### Scenario: Learn from attached source creates job
- **WHEN** the user asks the chat runtime to teach them an attached PDF source
- **THEN** the attachment manager SHALL create or reuse a source learning job
- **THEN** the assistant response metadata SHALL include the source job ID and any warnings

#### Scenario: Ask-about-source remains lightweight
- **WHEN** the user only asks a question about an attached PDF
- **THEN** the chat runtime MAY answer from attachment chunks without creating a full source learning job
- **THEN** it SHALL create the job only when the user requests learning, roadmap, note generation, or tutor mode

