## ADDED Requirements

### Requirement: Markdown parsing and 4-section extraction
The system SHALL parse the Markdown content of an Atomic Note and extract its four canonical sections: `Mental Model`, `H1` (primary domain concept), `H2` (secondary domain concept), and `The Proving Grounds` (practice/quiz).

#### Scenario: Parse valid 4-section note
- **WHEN** the compiler reads a note that contains all four sections
- **THEN** it SHALL extract the content of each section into separate structured blocks
- **THEN** it SHALL NOT fail if the headers have slight whitespace variations

#### Scenario: Handle malformed note sections
- **WHEN** a note is missing one or more required sections (e.g. missing `The Proving Grounds`)
- **THEN** the compiler SHALL fallback by using placeholder empty sections and SHALL NOT crash

### Requirement: Embedded source markdown
The compiled HTML lesson SHALL embed the complete, unmodified raw source markdown of the Atomic Note.

#### Scenario: Verify embedded markdown block
- **WHEN** the compiler generates an HTML lesson
- **THEN** the HTML output SHALL contain a `<script type="text/markdown" id="raw-markdown-source">` tag containing the exact raw markdown content of the note

### Requirement: Navigation resolution and link injection
The system SHALL resolve navigation links (Previous Note, Next Note, Parent Chapter, Parent Hub) by reading metadata from the parent Chapter and Hub files in the vault.

#### Scenario: Resolve navigation links
- **WHEN** a note belongs to a Chapter and Hub, and the Chapter defines an ordered list of notes
- **THEN** the compiler SHALL inspect the chapter file to find the previous and next note titles
- **THEN** the generated HTML lesson SHALL contain active navigation links or buttons pointing to those resolved files
- **THEN** the HTML SHALL contain a link back to the parent Hub

#### Scenario: Handle missing navigation files gracefully
- **WHEN** the parent Chapter or Hub file does not exist in the vault
- **THEN** the compiler SHALL omit the respective navigation links and SHALL NOT raise an error

### Requirement: Lesson variant rendering
The system SHALL support compiling four distinct lesson variants (`simple`, `deep`, `cram`, `exam`) with different layout and content densities.

#### Scenario: Compile simple variant
- **WHEN** the compiler is asked for a `simple` variant
- **THEN** the HTML SHALL render a concise, high-level summary focusing on the `Mental Model` and key definitions from `H1` and `H2`

#### Scenario: Compile deep variant
- **WHEN** the compiler is asked for a `deep` variant
- **THEN** the HTML SHALL render the complete detailed text of all four sections

#### Scenario: Compile cram variant
- **WHEN** the compiler is asked for a `cram` variant
- **THEN** the HTML SHALL prioritize the `Proving Grounds` section, showing high-yield bulleted summaries of the concepts

#### Scenario: Compile exam variant
- **WHEN** the compiler is asked for an `exam` variant
- **THEN** the HTML SHALL hide the main explanations and show only the quiz questions in the `Proving Grounds`, requiring the user to answer before showing the explanation

### Requirement: Output writing and frontmatter update
The system SHALL write the compiled HTML files to the correct vault directory and update the Atomic Note's frontmatter to link to the new lessons.

#### Scenario: Write lesson file and update note frontmatter
- **WHEN** the compiler finishes compiling a variant
- **THEN** it SHALL write the HTML file to the `lessons/` subdirectory relative to the note's folder
- **THEN** it SHALL update the `lesson_variants` field in the Atomic Note's frontmatter to contain the relative path to the new HTML file

### Requirement: Headless compiler tests
The compiler implementation SHALL be verified using headless backend unit and integration tests.

#### Scenario: Run compiler tests headlessly
- **WHEN** the compiler test suite runs
- **THEN** the tests SHALL NOT open a Tauri window or an OS browser window
- **THEN** the tests SHALL NOT require network access or live AI calls
- **THEN** the tests SHALL use temporary vault fixtures to test file reading, compilation, and writing
