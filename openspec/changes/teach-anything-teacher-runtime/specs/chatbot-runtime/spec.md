## ADDED Requirements

### Requirement: Chat learning intents create prompt teacher jobs
The chatbot runtime SHALL route prompt-first teaching intents into durable prompt teacher jobs.

#### Scenario: Teaching intent creates job metadata
- **WHEN** the user asks Oracle to teach a topic without a source
- **THEN** the assistant response metadata SHALL include prompt teacher job ID, roadmap state, warnings, and tutor link when started

#### Scenario: Resume from conversation history
- **WHEN** the user opens a conversation with a prompt teacher job
- **THEN** the chat runtime SHALL restore current job and tutor state from durable backend storage

### Requirement: Chat keeps ask-about separate from learn-mode
The chatbot runtime SHALL distinguish quick explanations from full prompt teacher jobs.

#### Scenario: Quick explanation does not create full job
- **WHEN** the user asks a one-off question such as "what is consumer surplus?"
- **THEN** the assistant MAY answer without creating a prompt teacher job
- **THEN** a full job SHALL be created when the user asks to learn, study, master, practice, or start a lesson

