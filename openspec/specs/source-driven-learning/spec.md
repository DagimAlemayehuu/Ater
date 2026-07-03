# Source Driven Learning Spec

## Purpose
This specification defines the requirements for the Source Driven Learning capability in Ater.
## Requirements
### Requirement: Source PDF Ingestion & Chunking
The system SHALL parse reference PDFs page-by-page using the local `load_pdf_robust` helper to retrieve content chunks for context.

#### Scenario: Load text page-by-page
- **WHEN** the user uploads a PDF document
- **THEN** the system SHALL extract the text and metadata for each page

#### Scenario: Handle empty or scanned PDF
- **WHEN** the PDF contains no extractable text (e.g. scanned images)
- **THEN** the system SHALL return a warning advising the user to run OCR or enable search augmentation

### Requirement: Source-Grounded Planning & Citation
The system SHALL map generated Chapters and Atomic Notes back to specific pages or sections in the reference sources.

#### Scenario: Generate grounded note curriculum
- **WHEN** the system generates a curriculum using reference documents
- **THEN** it SHALL output a plan containing notes with page-level citations (e.g. `pages: [5, 6]`)

#### Scenario: Write source metadata to note frontmatter
- **WHEN** the system writes the Atomic Note stub to the vault
- **THEN** the note frontmatter SHALL include the `sources` field listing files and pages used

### Requirement: Source Coverage Check & Weakness Warnings
The system SHALL evaluate the source text to detect explanatory gaps in key conceptual dimensions (Definition, Mechanism, Failure Modes).

#### Scenario: Flag missing failure modes
- **WHEN** the source text covers the definition of a topic but lacks mechanism or failure mode explanations
- **THEN** the system SHALL generate a high-severity `CoverageWarning`

#### Scenario: Return warnings to client before note generation
- **WHEN** coverage warnings exist in the curriculum plan
- **THEN** the system SHALL return the warning list to the user and await approval before generating note content

### Requirement: User-Consented Web Search Augmentation
The system SHALL support querying verified web search engines to augment thin source materials, contingent on user consent.

#### Scenario: Query web search on user consent
- **WHEN** the user approves search augmentation for a specific weak topic
- **THEN** the system SHALL execute a search query, fetch the top results, and append them to the generation context

#### Scenario: Update note frontmatter with search sources
- **WHEN** a note is generated using search-augmented content
- **THEN** the note frontmatter SHALL list the search URLs and page titles under the `sources` list

### Requirement: Headless Verification
The system SHALL support verifying PDF parsing, grounding planning, warning generation, and mock search augmentation entirely headlessly.

#### Scenario: Run tests without GUI or live network
- **WHEN** the test suite for source-driven learning runs
- **THEN** the tests SHALL NOT open a Tauri window or a browser window
- **THEN** the tests SHALL NOT require live web search or external AI connections, utilizing mock stubs instead

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

### Requirement: Chat attachment source grounding
Source-driven learning SHALL support sources attached through the durable chatbot runtime.

#### Scenario: Ask about attached source
- **WHEN** the user attaches a source document to an Oracle conversation and asks a question about it
- **THEN** the chatbot runtime SHALL use extracted attachment chunks as context
- **THEN** it SHALL answer without requiring the source to be ingested into Atomic Notes first

#### Scenario: Learn from attached source
- **WHEN** the user asks to be taught from an attached source
- **THEN** the chatbot runtime SHALL promote the attachment into the source-driven learning planner
- **THEN** the generated curriculum SHALL preserve source file and page citation metadata

#### Scenario: Source warnings appear in chat
- **WHEN** source-driven planning detects definition, mechanism, or failure-mode coverage warnings
- **THEN** the assistant message metadata SHALL include those warnings
- **THEN** the desktop chat SHALL render them in a user-inspectable form

