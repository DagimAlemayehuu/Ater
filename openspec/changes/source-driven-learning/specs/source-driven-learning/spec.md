## ADDED Requirements

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
