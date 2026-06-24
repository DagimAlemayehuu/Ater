## ADDED Requirements

### Requirement: Ingestion intent classification
The system SHALL classify incoming user prompts to determine if they represent a request to learn/study a topic.

#### Scenario: Classify learning request
- **WHEN** the system receives a prompt like "Teach me advanced Git branching" or "I want to learn Python async"
- **THEN** it SHALL classify the intent as a learning request and proceed to the planner flow

#### Scenario: Classify non-learning request
- **WHEN** the system receives a prompt like "Add a task to my list" or "Check my FSRS stats"
- **THEN** it SHALL NOT classify the intent as a learning request and SHALL return a routing error

### Requirement: Clarification policy execution
The system SHALL evaluate prompt specificity and decide whether to ask 1 to 3 targeted clarification questions or proceed directly.

#### Scenario: Prompt is specific
- **WHEN** the user prompt contains specific sub-topics, goals, or source references
- **THEN** the clarification policy SHALL allow proceeding directly to curriculum planning without asking questions

#### Scenario: Prompt is vague
- **WHEN** the user prompt is short or lacks context (e.g. "Teach me Chemistry" or "Learn about math")
- **THEN** the clarification policy SHALL generate and return between 1 and 3 high-impact questions to clarify the user's goals
- **THEN** it SHALL NOT proceed to curriculum planning until the questions are answered

### Requirement: Existing Hub integration
The system SHALL check for existing Hubs before planning a new curriculum and structure the plan to extend the match if found.

#### Scenario: Extend existing Hub
- **WHEN** a Hub matching the topic exists in `database/learning paths/` or `database/study planner/`
- **THEN** the planner SHALL load the existing Hub
- **THEN** the proposed curriculum SHALL be structured to extend that Hub (appending new chapters or adding to existing ones)
- **THEN** it SHALL NOT plan a duplicate Hub file

#### Scenario: Create new Hub
- **WHEN** no matching Hub exists in the vault
- **THEN** the planner SHALL plan to create a new Learning Hub under the canonical path

### Requirement: Curriculum planning
The system SHALL generate a structured curriculum consisting of chapters and Atomic Note stubs aligned with the user's topic and learning mode.

#### Scenario: Plan curriculum structure
- **WHEN** the planner runs for a topic and learning mode
- **THEN** it SHALL generate a curriculum JSON containing the topic name, the selected learning mode, a list of chapters (each with title and order), and a list of Atomic Note titles per chapter
- **THEN** the generated curriculum SHALL be returned to the user for preview and confirmation

### Requirement: Progressive planning and file writing
The system SHALL support writing the planned curriculum files to the vault in either "Generate All" or "Progressive" modes.

#### Scenario: Generate All mode
- **WHEN** the user confirms the curriculum and the mode is "Generate All"
- **THEN** the system SHALL create the Hub file, all Chapter files, and all Atomic Note stubs (with proper frontmatter) in the vault
- **THEN** all Atomic Notes SHALL be linked to their respective Chapters and Hub

#### Scenario: Progressive mode
- **WHEN** the user confirms the curriculum and the mode is "Progressive"
- **THEN** the system SHALL create the Hub file and only the first Chapter's file and Atomic Note stubs in the vault
- **THEN** the Hub frontmatter and body SHALL list all chapters, but only the first chapter's link will point to a created file; other chapters will remain listed but not yet created

### Requirement: Headless planner tests
The planner implementation SHALL be verified using headless backend unit and integration tests with mocked LLM generation.

#### Scenario: Run planner tests headlessly
- **WHEN** the planner test suite runs
- **THEN** the tests SHALL NOT open a Tauri window or an OS browser window
- **THEN** the tests SHALL NOT call live AI providers or require network access
- **THEN** all LLM calls (intent, clarification, planning) SHALL be mocked using deterministic test fixtures
