## ADDED Requirements

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
