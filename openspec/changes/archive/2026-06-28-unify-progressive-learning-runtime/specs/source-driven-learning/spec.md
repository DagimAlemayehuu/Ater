## ADDED Requirements

### Requirement: Source-driven progressive session
Source-driven learning SHALL create progressive learning sessions that begin quickly and continue generation in the background.

#### Scenario: Plan PDF into progressive runtime
- **WHEN** the user uploads a PDF for learning
- **THEN** the source planner SHALL generate a source-grounded roadmap
- **THEN** the unified runtime SHALL open the first Atomic Note when it is ready
- **THEN** future source-grounded notes MAY continue generating in the background

#### Scenario: Avoid visible full batch deployment
- **WHEN** source-driven learning starts from the main Ater chat surface
- **THEN** the UI SHALL NOT require the learner to watch the full detect-plan-confirm batch pipeline before reading the first note
- **THEN** the learner SHALL see the current lesson and locked roadmap instead

### Requirement: Source citations in progressive learning
The source-driven runtime SHALL preserve page-level grounding and source navigation for generated current and future notes.

#### Scenario: Current note has source metadata
- **WHEN** the runtime opens a source-generated Atomic Note
- **THEN** the note frontmatter SHALL include source file and page metadata
- **THEN** the LearningWorkspace SHALL allow jumping to the cited PDF page when source metadata is present

#### Scenario: Generated-ahead note preserves citations
- **WHEN** a future source-generated Atomic Note is generated ahead in the background
- **THEN** the note SHALL persist its source citations before it is unlocked
- **THEN** those citations SHALL remain available when the note is later unlocked offline

### Requirement: Source coverage warnings before hidden generation
The source-driven runtime SHALL handle weak source coverage before silently generating ahead.

#### Scenario: Warning blocks automatic generation for weak topic
- **WHEN** source coverage analysis detects high-severity gaps for planned content
- **THEN** the runtime SHALL record the warning on the roadmap or session state
- **THEN** the runtime SHALL NOT use web augmentation for that content without user consent

#### Scenario: Offline mode uses source-only generation
- **WHEN** the app is offline during source-driven learning
- **THEN** the runtime SHALL continue with already-extracted source text and already-generated content
- **THEN** it SHALL defer web augmentation until the user is online and consents

