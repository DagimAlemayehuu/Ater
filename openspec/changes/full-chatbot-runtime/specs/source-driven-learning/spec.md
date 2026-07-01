## ADDED Requirements

### Requirement: Chat attachment source grounding
Source-driven learning SHALL support sources attached through the durable chatbot runtime.

#### Scenario: Ask about attached source
- **WHEN** the user attaches a source document to an Oracle conversation and asks a question about it
- **THEN** the chatbot runtime SHALL use extracted attachment chunks as context
- **THEN** it SHALL answer without requiring the source to be ingested into Atomic Notes first

#### Scenario: Learn from attached source
- **WHEN** the user asks to be taught from an attached source
- **THEN** the chatbot runtime SHALL promote the attachment into the source-driven learning planner
- **THEN** the generated curriculum SHALL preserve source file and page citation metadata

#### Scenario: Source warnings appear in chat
- **WHEN** source-driven planning detects definition, mechanism, or failure-mode coverage warnings
- **THEN** the assistant message metadata SHALL include those warnings
- **THEN** the desktop chat SHALL render them in a user-inspectable form
