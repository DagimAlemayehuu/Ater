## ADDED Requirements

### Requirement: Chat-linked tutor sessions
The tutor runtime SHALL expose learning session identifiers and progress state to the durable chatbot runtime.

#### Scenario: Persist tutor link in chat
- **WHEN** a chatbot-initiated lesson starts a tutor session
- **THEN** the chatbot runtime SHALL store the tutor session ID, Hub path, current Atomic Note path, and lesson preview metadata on the assistant message or conversation state

#### Scenario: Resume tutor session from chat history
- **WHEN** the user opens a past conversation containing a linked tutor session
- **THEN** the desktop client SHALL request current tutor status from the sidecar
- **THEN** it SHALL render the LearningWorkspace from tutor runtime state rather than localStorage-only lesson pointers

#### Scenario: Tutor progress updates chat metadata
- **WHEN** the user advances, completes, or fails gates in a tutor session launched from chat
- **THEN** the tutor runtime SHALL make the updated progress available to the chatbot runtime
- **THEN** the chat conversation SHALL show accurate current/locked/completed learning state on reload
