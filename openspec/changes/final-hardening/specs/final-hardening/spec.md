## ADDED Requirements

### Requirement: Compiler Code Syntax Integrity
The compiler service SHALL compile successfully without Python SyntaxErrors, correctly escaping braces in inline JS scripts.

#### Scenario: Compile HTML lessons without syntax errors
- **WHEN** the HTML compiler compiles a markdown note into an HTML lesson
- **THEN** it SHALL generate valid HTML and JS containing event postMessage dispatchers

### Requirement: Unified Artifact Pack Path Mapping
The system SHALL read and write artifact packs from a subfolder named `artifacts` nested inside the parent chapter directory of the Atomic Note.

#### Scenario: Resolve artifact pack path for self-study
- **WHEN** the note is at `database/General/Git/01_Foundations/Git_Three_State_Model.md`
- **THEN** the system SHALL resolve the artifact pack path to `database/General/Git/01_Foundations/artifacts/Git_Three_State_Model.artifacts.json`

#### Scenario: Resolve artifact pack path for coursework
- **WHEN** the note is at `database/Spring_2026/Data_Structures/03_Trees/Binary_Tree_Traversal.md`
- **THEN** the system SHALL resolve the artifact pack path to `database/Spring_2026/Data_Structures/03_Trees/artifacts/Binary_Tree_Traversal.artifacts.json`

### Requirement: YAML Frontmatter Format Invariance
The system SHALL format note frontmatter updates using `VaultManager.dump_obsidian_yaml` to preserve double-quoted wikilinks.

#### Scenario: Preserve double-quoted wikilinks on variant write
- **WHEN** the compiler updates a note's frontmatter with compiled lesson variants
- **THEN** all wikilink metadata values (such as `hub: "[[Git_Hub]]"`) SHALL remain double-quoted

### Requirement: Robust Hub Verification
The system SHALL verify that candidate markdown files have `type: Learning Hub` in their frontmatter before returning them as topic hubs.

#### Scenario: Match valid hub by metadata
- **WHEN** searching for an existing hub matching a normalized topic
- **THEN** the system SHALL ignore markdown files that do not contain `type: Learning Hub` in their frontmatter

### Requirement: Title Sanitization
The system SHALL sanitize unsafe OS filename characters during normalization.

#### Scenario: Normalize title with unsafe characters
- **WHEN** normalizing the title "Git: Branching & Merging?"
- **THEN** the system SHALL replace unsafe characters (`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) with underscores or empty characters to prevent illegal paths

### Requirement: Unified Validation Checks
The validator SHALL verify lesson variants and artifact pack structures.

#### Scenario: Reject missing variant files
- **WHEN** the frontmatter lists a variant HTML file that does not exist on disk
- **THEN** the validator SHALL report a verification error
