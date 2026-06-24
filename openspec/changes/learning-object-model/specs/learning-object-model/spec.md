## ADDED Requirements

### Requirement: Self-study Learning Hub route
The system SHALL support self-study Learning Hubs under `database/learning paths/` without using the coursework-only `database/study planner/` route.

#### Scenario: Build self-study Hub path
- **WHEN** the system receives the self-study topic `Git`
- **THEN** it SHALL resolve the Learning Hub path to `database/learning paths/Git_Hub.md`
- **THEN** it SHALL NOT resolve the self-study Hub path to `database/study planner/Git_Hub.md`

#### Scenario: Preserve coursework Hub path
- **WHEN** the system receives a coursework learning object with a semester, course, and unit
- **THEN** it SHALL continue to resolve the coursework Hub path under `database/study planner/`
- **THEN** it SHALL NOT move existing coursework Hubs into `database/learning paths/`

### Requirement: Canonical self-study content route
The system SHALL place Teach Anything and self-study content under `database/General/<Topic>/<Chapter>/`.

#### Scenario: Build self-study chapter route
- **WHEN** the system receives topic `Git` and chapter title `Foundations`
- **THEN** it SHALL resolve the Chapter folder to `database/General/Git/01_Foundations/`
- **THEN** it SHALL resolve the Chapter file to `database/General/Git/01_Foundations/Chapter_01_Foundations.md`

#### Scenario: Build self-study Atomic Note route
- **WHEN** the system receives topic `Git`, chapter title `Foundations`, and Atomic Note title `Git Three State Model`
- **THEN** it SHALL resolve the Atomic Note path to `database/General/Git/01_Foundations/Git_Three_State_Model.md`

### Requirement: Coursework content route compatibility
The system SHALL preserve the existing coursework content route pattern under `database/<Semester>/<Course>/<Unit>/`.

#### Scenario: Build coursework Atomic Note route
- **WHEN** the system receives semester `Spring 2026`, course `Data Structures`, unit `03 Trees`, chapter title `Binary Trees`, and Atomic Note title `Binary Tree Traversal`
- **THEN** it SHALL resolve the Atomic Note path under `database/Spring_2026/Data_Structures/03_Trees/`
- **THEN** it SHALL NOT place coursework Atomic Notes under `database/General/`

### Requirement: Learning Hub metadata contract
The system SHALL create Learning Hub Markdown frontmatter that identifies the file as a self-study Hub and links to Chapter files.

#### Scenario: Create Learning Hub metadata
- **WHEN** the system creates `database/learning paths/Git_Hub.md`
- **THEN** the Hub frontmatter SHALL include `type: Learning Hub`
- **THEN** the Hub frontmatter SHALL include `topic: Git`
- **THEN** the Hub frontmatter SHALL include a `learning_mode` value such as `learn_from_scratch`, `cram`, `project_skill`, or `review`
- **THEN** the Hub frontmatter SHALL include a `chapters` list that stores quoted wikilinks to Chapter files

#### Scenario: Learning Hub body includes chapter links
- **WHEN** the Learning Hub has Chapter files
- **THEN** the Hub body SHALL include wikilinks to those Chapter files in chapter order

### Requirement: Chapter file metadata contract
The system SHALL create Chapter Markdown files that link back to their Hub and list their Atomic Notes.

#### Scenario: Create Chapter metadata
- **WHEN** the system creates `Chapter_01_Foundations.md`
- **THEN** the Chapter frontmatter SHALL include `type: Chapter`
- **THEN** the Chapter frontmatter SHALL include `hub: "[[Git_Hub]]"`
- **THEN** the Chapter frontmatter SHALL include `order: 1`
- **THEN** the Chapter frontmatter SHALL include an `atomic_notes` list that stores quoted wikilinks to Atomic Notes

#### Scenario: Chapter body includes Atomic Note links
- **WHEN** the Chapter has Atomic Notes
- **THEN** the Chapter body SHALL include wikilinks to those Atomic Notes in learning order

### Requirement: Atomic Note learning object metadata
The system SHALL extend Atomic Note frontmatter with links to its Hub, Chapter, lesson variants, and artifact pack while preserving existing Ater metadata rules.

#### Scenario: Create Atomic Note learning links
- **WHEN** the system creates `Git_Three_State_Model.md`
- **THEN** the Atomic Note frontmatter SHALL include `type: Atomic Note`
- **THEN** the Atomic Note frontmatter SHALL include `hub: "[[Git_Hub]]"`
- **THEN** the Atomic Note frontmatter SHALL include `chapter: "[[Chapter_01_Foundations]]"`
- **THEN** the Atomic Note frontmatter SHALL include `artifact_pack: "artifacts/Git_Three_State_Model.artifacts.json"`

#### Scenario: Preserve Ater frontmatter invariants
- **WHEN** the system writes Atomic Note learning-object metadata
- **THEN** YAML wikilink values SHALL remain double-quoted
- **THEN** `course` and `semester` SHALL remain plain-text values when present
- **THEN** the Atomic Note SHALL remain valid Markdown readable by Obsidian

### Requirement: Durable lesson variant path contract
The system SHALL define deterministic HTML lesson variant paths for each Atomic Note.

#### Scenario: Build lesson variant paths
- **WHEN** the system receives Atomic Note title `Git Three State Model`
- **THEN** it SHALL resolve the `simple` lesson variant to `lessons/Git_Three_State_Model.simple.html`
- **THEN** it SHALL resolve the `deep` lesson variant to `lessons/Git_Three_State_Model.deep.html`
- **THEN** it SHALL resolve the `cram` lesson variant to `lessons/Git_Three_State_Model.cram.html`
- **THEN** it SHALL resolve the `exam` lesson variant to `lessons/Git_Three_State_Model.exam.html`

#### Scenario: Store lesson variant metadata
- **WHEN** an Atomic Note has lesson variants
- **THEN** its frontmatter SHALL include a `lesson_variants` mapping
- **THEN** the mapping SHALL use variant names as keys and relative HTML paths as values

### Requirement: Artifact pack path and version contract
The system SHALL define deterministic artifact pack paths and a minimal versioned JSON structure for each Atomic Note.

#### Scenario: Build artifact pack path
- **WHEN** the system receives Atomic Note title `Git Three State Model`
- **THEN** it SHALL resolve the artifact pack path to `artifacts/Git_Three_State_Model.artifacts.json`

#### Scenario: Create minimal artifact pack JSON
- **WHEN** the system creates an artifact pack for `Git_Three_State_Model.md`
- **THEN** the JSON SHALL include `schema_version`
- **THEN** the JSON SHALL include `note_title`
- **THEN** the JSON SHALL include `note_path`
- **THEN** the JSON SHALL include `active_version`
- **THEN** the JSON SHALL include `pinned_artifact_types`
- **THEN** the JSON SHALL include a `versions` array

#### Scenario: Preserve artifact pack versions
- **WHEN** a new artifact pack version is added
- **THEN** the system SHALL append a new version entry instead of overwriting prior versions
- **THEN** `active_version` SHALL identify the version currently used by the lesson runtime

#### Scenario: Store pinned artifact types
- **WHEN** a user or future planner pins an artifact type
- **THEN** the artifact pack SHALL preserve that artifact type in `pinned_artifact_types`
- **THEN** later artifact selection SHALL be able to read the pinned type without parsing HTML

### Requirement: Existing Hub detection contract
The system SHALL provide deterministic lookup behavior for finding relevant existing Learning Hubs before creating new Hubs.

#### Scenario: Detect exact existing Learning Hub
- **WHEN** `database/learning paths/Git_Hub.md` already exists
- **THEN** a lookup for topic `Git` SHALL return that existing Hub
- **THEN** the system SHALL NOT propose creating a duplicate `Git_Hub.md`

#### Scenario: Detect normalized existing Learning Hub
- **WHEN** `database/learning paths/Git_Basics_Hub.md` contains topic or alias metadata matching `Git Basics`
- **THEN** a lookup for `git basics` SHALL return the existing Hub despite casing and spacing differences

#### Scenario: Search both self-study and coursework Hubs
- **WHEN** the system looks up an existing Hub for a topic
- **THEN** it SHALL search `database/learning paths/`
- **THEN** it SHALL also search `database/study planner/`
- **THEN** it SHALL identify whether the match is self-study or coursework so later phases can extend the correct route

### Requirement: Learning object contract validation
The system SHALL validate Hub, Chapter, Atomic Note, lesson path, and artifact pack contracts without calling live AI providers or requiring network access.

#### Scenario: Validate a complete learning object set
- **WHEN** a temporary vault contains a Learning Hub, Chapter file, Atomic Note, lesson variant metadata, and artifact pack JSON that follow this specification
- **THEN** the validator SHALL report the learning object set as valid

#### Scenario: Reject missing required links
- **WHEN** an Atomic Note is missing its `chapter` link or `artifact_pack` value
- **THEN** the validator SHALL report a contract error identifying the missing field

#### Scenario: Reject malformed artifact pack
- **WHEN** an artifact pack is missing `versions` or `active_version`
- **THEN** the validator SHALL report a contract error identifying the malformed artifact pack

### Requirement: Headless implementation tests
The implementation SHALL include tests that verify the learning object model entirely through code-level unit and integration checks.

#### Scenario: Run tests without desktop window
- **WHEN** the implementation test suite runs for this change
- **THEN** the tests SHALL NOT open a Tauri window
- **THEN** the tests SHALL NOT open an operating-system browser window
- **THEN** the tests SHALL NOT require manual visual inspection

#### Scenario: Run tests without network or live AI
- **WHEN** the implementation test suite runs for this change
- **THEN** the tests SHALL NOT call live AI providers
- **THEN** the tests SHALL NOT require network access
- **THEN** the tests SHALL use temporary vault fixtures for file-write and validation behavior
