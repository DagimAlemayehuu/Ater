# Teach Anything Planner Spec

## Purpose
This specification defines the requirements for the Teach Anything Planner capability in Ater.
## Requirements
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
- **THEN** the system SHALL create the Hub file and only the first Chapter's first Atomic Note file in the vault
- **THEN** all subsequent Atomic Notes and Chapter files in the curriculum SHALL remain locked and uncreated until unlocked sequentially by the tutor runtime

### Requirement: Sequential single-note unlocks
The system MUST support unlocking and writing the next scheduled Atomic Note in the roadmap sequentially upon receiving verification from the tutor runtime.

#### Scenario: Unlock next atomic note
- **WHEN** the tutor runtime completes the quiz session for the current active note and verifies mastery
- **THEN** the system SHALL create the next Atomic Note file in the curriculum in the vault
- **THEN** it SHALL update the Hub note links to reflect that the note is now created and active

### Requirement: Headless planner tests
The planner implementation SHALL be verified using headless backend unit and integration tests with mocked LLM generation.

#### Scenario: Run planner tests headlessly
- **WHEN** the planner test suite runs
- **THEN** the tests SHALL NOT open a Tauri window or an OS browser window
- **THEN** the tests SHALL NOT call live AI providers or require network access
- **THEN** all LLM calls (intent, clarification, planning) SHALL be mocked using deterministic test fixtures

### Requirement: Teach Anything planner
The system SHALL generate Teach Anything learning paths for arbitrary user prompts and SHALL produce vault-ready Markdown notes through deterministic quality gates before writing content.

#### Scenario: Reject weak-model prompt leakage before writing
- **WHEN** a model-generated Teach Anything Atomic Note contains internal prompt text, placeholder source language, placeholder quiz answers, or obviously truncated prose
- **THEN** the runtime SHALL reject that body before writing it to the vault
- **AND** the runtime SHALL retry or replace it with a deterministic fallback note

#### Scenario: Produce a usable note without source material
- **WHEN** the user asks to learn a topic from a simple prompt without attaching sources
- **THEN** the runtime SHALL build neutral grounding context from the topic, chapter, note title, and prompt
- **AND** it SHALL NOT inject prompt-shaped fallback text such as requests for a comprehensive explanation into the generated note
- **AND** it SHALL write a structurally valid Atomic Note with an interactive quiz

#### Scenario: Preserve source-backed grounding without fake citations
- **WHEN** source snippets are available for a Teach Anything concept
- **THEN** the runtime MAY use those snippets as grounding context
- **BUT** it SHALL NOT emit fake page anchors, generic "source treatment" placeholders, or claims that the source says something when no specific source snippet supports it

#### Scenario: Headless quality tests
- **WHEN** the Teach Anything Markdown quality tests run
- **THEN** they SHALL run without a desktop window
- **AND** they SHALL run without live AI providers
- **AND** they SHALL run without network access

### Requirement: Teach Anything runtime handoff
The Teach Anything planner SHALL hand off planned curricula to the unified progressive learning runtime instead of owning a separate learner-facing flow.

#### Scenario: Planned topic creates runtime session
- **WHEN** the planner generates a curriculum for an arbitrary topic prompt
- **THEN** the system SHALL create or update a progressive learning runtime session for the planned Hub
- **THEN** the runtime session SHALL become the source of truth for current note, unlocks, and generated-ahead state

#### Scenario: Roadmap preview remains available
- **WHEN** the planner finishes curriculum planning
- **THEN** the user SHALL receive a roadmap preview with chapters and Atomic Notes
- **THEN** the roadmap SHALL indicate future lessons as locked unless already mastered in the runtime session

### Requirement: Generated-ahead planning compatibility
The Teach Anything planner SHALL support hidden generated-ahead buffers without exposing future content as unlocked.

#### Scenario: Progressive mode writes ahead invisibly
- **WHEN** the runtime asks the planner to prepare upcoming content for offline readiness
- **THEN** the planner MAY write future Atomic Note files, lesson variants, and artifact packs to the vault
- **THEN** the planner SHALL report those items as generated but not unlocked

#### Scenario: Existing generated notes do not bypass mastery
- **WHEN** a future Atomic Note file already exists in the vault
- **THEN** the runtime SHALL keep that note locked unless tutor progression state marks it unlocked
- **THEN** the UI SHALL not open that note from the learning map until it is unlocked

### Requirement: Transfer task planning
The Teach Anything planner SHALL include transfer or application tasks in planned learning objects for arbitrary topics.

#### Scenario: Planned note includes transfer gate
- **WHEN** the planner creates or prepares an Atomic Note learning object
- **THEN** the object SHALL include at least one transfer or application task
- **THEN** the task SHALL be selected according to the topic domain and learning mode

#### Scenario: Prompt-only topic avoids fake source grounding
- **WHEN** a Teach Anything topic has no uploaded source material
- **THEN** the planner SHALL generate transfer tasks from the topic, chapter, note title, and prompt context
- **THEN** it SHALL NOT invent page citations or source-specific claims

### Requirement: Durable chatbot entrypoint
The Teach Anything planner SHALL operate through the durable chatbot runtime when invoked from Oracle chat.

#### Scenario: Topic prompt creates chat-linked roadmap
- **WHEN** the user sends a Teach Anything prompt in an Oracle conversation
- **THEN** the chatbot runtime SHALL persist the user message, assistant roadmap message, planned curriculum metadata, and runtime handoff identifiers
- **THEN** the roadmap SHALL remain available after desktop reload or sidecar restart

#### Scenario: Start Lesson resumes from durable state
- **WHEN** the user clicks Start Lesson after a roadmap was generated
- **THEN** the runtime SHALL resolve the planned curriculum from durable chat state or linked learning runtime state
- **THEN** it SHALL NOT depend on an in-process-only curriculum cache as the sole source of truth

#### Scenario: Learning result links back to conversation
- **WHEN** the first lesson is generated from a Teach Anything prompt
- **THEN** the resulting Hub path, Atomic Note path, lesson path, preview token, and tutor session ID SHALL be stored in assistant message metadata
- **THEN** the desktop chat SHALL be able to reopen the learning workspace from the conversation history

### Requirement: Planner output becomes durable prompt job state
The Teach Anything planner SHALL persist roadmap, curriculum, assumptions, and generated source-pack state instead of relying on volatile in-process cache.

#### Scenario: Roadmap survives restart
- **WHEN** a prompt-first roadmap has been generated
- **THEN** Ater SHALL be able to restore it after backend restart from durable job state

#### Scenario: Start lesson after restart
- **WHEN** the user clicks Start Learning after a restart
- **THEN** the system SHALL start from persisted prompt job state
- **THEN** it SHALL not require an in-memory curriculum cache entry

### Requirement: Planner validates scope
The Teach Anything planner SHALL validate generated scope before exposing a roadmap.

#### Scenario: Scope too broad warning
- **WHEN** the user asks to learn an extremely broad topic like "teach me biology"
- **THEN** the planner SHALL either ask a clarification or create a staged overview with explicit assumptions and warnings

