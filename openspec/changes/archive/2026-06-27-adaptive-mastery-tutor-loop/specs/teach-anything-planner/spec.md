## MODIFIED Requirements

### Requirement: Progressive planning and file writing
The system SHALL support writing the planned curriculum files to the vault in either "Generate All" or "Progressive" modes.

#### Scenario: Generate All mode
- **WHEN** the user confirms the curriculum and the mode is "Generate All"
- **THEN** the system SHALL create the Hub file, all Chapter files, and all Atomic Note stubs (with proper frontmatter) in the vault
- **THEN** all Atomic Notes SHALL be linked to their respective Chapters and Hub

#### Scenario: Progressive mode
- **WHEN** the user confirms the curriculum and the mode is "Progressive"
- **THEN** the system SHALL create the Hub file and only the first Chapter's first Atomic Note file in the vault
- **THEN** all subsequent Atomic Notes and Chapter files in the curriculum SHALL remain locked and uncreated until unlocked sequentially by the tutor runtime

## ADDED Requirements

### Requirement: Sequential single-note unlocks
The system MUST support unlocking and writing the next scheduled Atomic Note in the roadmap sequentially upon receiving verification from the tutor runtime.

#### Scenario: Unlock next atomic note
- **WHEN** the tutor runtime completes the quiz session for the current active note and verifies mastery
- **THEN** the system SHALL create the next Atomic Note file in the curriculum in the vault
- **THEN** it SHALL update the Hub note links to reflect that the note is now created and active
