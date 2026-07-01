## ADDED Requirements

### Requirement: Learning object generation and unlock metadata
Learning objects SHALL distinguish generated content from unlocked content without relying only on file existence.

#### Scenario: Future note generated but locked
- **WHEN** an Atomic Note is generated ahead for offline readiness
- **THEN** the runtime metadata SHALL identify the note as generated
- **THEN** the runtime metadata SHALL keep the note locked until the tutor runtime unlocks it

#### Scenario: Existing file does not imply unlocked
- **WHEN** the vault contains an Atomic Note file for a future roadmap item
- **THEN** the learning object model SHALL allow the runtime to keep that note locked
- **THEN** roadmap rendering SHALL use runtime unlock metadata rather than file existence alone

### Requirement: Transfer task metadata
Atomic Note learning objects SHALL support durable transfer or application task metadata.

#### Scenario: Store transfer task in learning object
- **WHEN** the system prepares an Atomic Note for progressive learning
- **THEN** the note or associated artifact pack SHALL include a transfer task definition
- **THEN** the definition SHALL include task type, prompt, expected evidence or grading criteria, and domain classification

#### Scenario: Preserve Obsidian readability
- **WHEN** transfer metadata is stored for an Atomic Note
- **THEN** the note SHALL remain readable Markdown in Obsidian
- **THEN** YAML wikilinks and existing Ater frontmatter invariants SHALL remain valid

### Requirement: Offline readiness metadata
Learning objects SHALL expose enough local metadata for the runtime to know what can be used offline.

#### Scenario: Mark generated-ahead content ready offline
- **WHEN** a future Atomic Note, embedded quiz, transfer task, lesson variant, and required source metadata are all written locally
- **THEN** the runtime SHALL be able to mark that roadmap item as offline-ready
- **THEN** the UI MAY show a non-spoiling readiness indicator without exposing locked content

#### Scenario: Missing offline dependency
- **WHEN** a generated-ahead note is missing its quiz, transfer task, lesson variant, or source metadata required for offline use
- **THEN** the runtime SHALL treat the item as not fully offline-ready
- **THEN** the item SHALL remain locked until mastery gates and required content availability are satisfied

