## ADDED Requirements

### Requirement: Durable conversation storage
The system SHALL persist Oracle conversations, messages, message metadata, conversation titles, timestamps, and branch relationships in local SQLite managed by the FastAPI Sidecar.

#### Scenario: Create conversation
- **WHEN** the desktop client requests a new Oracle conversation
- **THEN** the sidecar SHALL create a durable conversation record with a stable ID
- **THEN** the conversation SHALL be available after desktop reload or sidecar restart

#### Scenario: List conversations
- **WHEN** the desktop client opens the Oracle conversation sidebar
- **THEN** the sidecar SHALL return durable conversations ordered by most recent activity
- **THEN** the response SHALL include title, last message preview, timestamps, and archived/deleted state

#### Scenario: Persist messages
- **WHEN** the user sends a message or the assistant streams a reply
- **THEN** the sidecar SHALL persist each message with role, content, status, parent message ID, metadata, and timestamps

### Requirement: Streaming turn lifecycle
The system SHALL manage assistant streaming turns by conversation ID with durable run status and support cancellation, retry, regeneration, and branch-from-message.

#### Scenario: Stream assistant turn
- **WHEN** the user sends a message in a conversation
- **THEN** the sidecar SHALL create a stream run linked to the conversation and user message
- **THEN** streamed chunks SHALL update a durable assistant message until the run completes, fails, or is cancelled

#### Scenario: Cancel streaming turn
- **WHEN** the user stops generation before the assistant turn completes
- **THEN** the sidecar SHALL mark the stream run as cancelled
- **THEN** the partial assistant message SHALL remain persisted with incomplete status

#### Scenario: Regenerate assistant message
- **WHEN** the user regenerates an assistant response
- **THEN** the sidecar SHALL create a sibling assistant message from the same parent user message
- **THEN** the previous assistant message SHALL remain available in branch history

#### Scenario: Branch from message
- **WHEN** the user edits or branches from an earlier message
- **THEN** the sidecar SHALL create a new conversation branch preserving ancestry
- **THEN** subsequent messages SHALL not overwrite the original branch

### Requirement: Context packing
The system SHALL assemble model context from prioritized sources instead of sending unbounded raw chat history.

#### Scenario: Pack normal chat context
- **WHEN** an assistant turn starts
- **THEN** the runtime SHALL include system prompt, current request, recent messages, conversation summary, relevant prior messages, retrieved memories, local vault RAG, attachments, active artifact context, user context, and recent tool state within the configured budget

#### Scenario: Store context snapshot
- **WHEN** context packing completes
- **THEN** the runtime SHALL persist a context snapshot containing source IDs, approximate token counts, included sections, and exclusion reasons

#### Scenario: Summarize long conversation
- **WHEN** a conversation exceeds the configured raw-history budget
- **THEN** the runtime SHALL create or update a rolling summary
- **THEN** later turns SHALL use the summary plus recent messages instead of the entire transcript

### Requirement: Two-use memory
The system SHALL support durable user memory and session-scoped memory with user-visible controls.

#### Scenario: Save durable memory
- **WHEN** the runtime identifies a stable user preference, goal, or fact suitable for future conversations
- **THEN** it SHALL store the memory with scope `durable`, confidence, source message ID, created timestamp, and enabled state

#### Scenario: Save session memory
- **WHEN** the runtime identifies context that applies only to the active conversation
- **THEN** it SHALL store the memory with scope `session` linked to the conversation ID
- **THEN** it SHALL NOT retrieve that memory for unrelated conversations

#### Scenario: Retrieve memories
- **WHEN** an assistant turn starts
- **THEN** the runtime SHALL retrieve relevant enabled durable memories and session memories for context packing

#### Scenario: Delete memory
- **WHEN** the user deletes or disables a memory
- **THEN** the runtime SHALL stop retrieving that memory for future turns
- **THEN** the desktop memory UI SHALL reflect the updated state

### Requirement: Chat attachments
The system SHALL allow chat messages to include local-first attachments for grounding normal conversation and learning flows.

#### Scenario: Attach document
- **WHEN** the user attaches a PDF, Markdown, or text file to a chat message
- **THEN** the sidecar SHALL persist attachment metadata and extracted text chunks
- **THEN** the attachment SHALL be available as context for subsequent assistant turns in that conversation

#### Scenario: Attach Obsidian note
- **WHEN** the user attaches an Obsidian Vault note to a chat message
- **THEN** the sidecar SHALL store the note path and current readable content reference
- **THEN** the assistant SHALL be able to answer grounded questions about that note

#### Scenario: Promote attachment to source-driven learning
- **WHEN** the user asks to learn from an attached source
- **THEN** the runtime SHALL route the attachment into the source-driven learning planner
- **THEN** the resulting roadmap or Hub metadata SHALL be linked back to the chat message

### Requirement: Tool execution audit
The system SHALL persist structured tool execution records for all Oracle tool calls.

#### Scenario: Record successful tool call
- **WHEN** the assistant invokes a tool
- **THEN** the runtime SHALL persist tool name, redacted arguments, status, timing, result summary, emitted frontend actions, and linked message/run IDs

#### Scenario: Record failed tool call
- **WHEN** a tool call fails
- **THEN** the runtime SHALL persist the error type and redacted error message
- **THEN** the assistant response SHALL be able to recover or explain the failure without losing the run record

#### Scenario: Show tool timeline
- **WHEN** the user expands an assistant message tool timeline
- **THEN** the desktop UI SHALL show ordered tool events with status, duration, and safe summaries

### Requirement: Desktop chatbot UX
The desktop Oracle UI SHALL behave as a sidecar-backed chatbot product rather than a localStorage-only message panel.

#### Scenario: Load persistent chat
- **WHEN** the user opens `/agents?tab=ater`
- **THEN** the desktop client SHALL load conversations and messages from the sidecar
- **THEN** localStorage SHALL only store UI preferences and selected IDs

#### Scenario: Edit and resend
- **WHEN** the user edits a prior user message and resends it
- **THEN** the desktop client SHALL request a branch or retry operation from the sidecar
- **THEN** the original message branch SHALL remain recoverable

#### Scenario: Show citations
- **WHEN** the assistant answer uses vault RAG, attachments, or source-grounded snippets
- **THEN** the message metadata SHALL expose citation/source references
- **THEN** the desktop UI SHALL render those references in a user-inspectable form

#### Scenario: Import existing localStorage conversations
- **WHEN** the user has legacy localStorage Oracle conversations
- **THEN** the desktop client SHALL offer or perform a one-time import into sidecar-backed conversations
- **THEN** imported conversations SHALL not be duplicated on subsequent launches

### Requirement: Model routing hooks
The system SHALL route chatbot subtasks through configured model profiles without changing local embedding invariants.

#### Scenario: Route assistant chat
- **WHEN** a normal assistant turn starts
- **THEN** the runtime SHALL use the configured chat model/provider settings and billing/feature gates

#### Scenario: Route planner or utility task
- **WHEN** a turn needs curriculum planning, summarization, memory extraction, or attachment summarization
- **THEN** the runtime MAY use configured planner or utility model settings
- **THEN** it SHALL preserve local ONNX embeddings for semantic retrieval

### Requirement: Chatbot runtime tests
The chatbot runtime SHALL be verified with headless backend and desktop tests.

#### Scenario: Backend runtime tests
- **WHEN** backend tests run
- **THEN** they SHALL verify conversation persistence, streaming status transitions, context packing, memory CRUD, attachment extraction, and tool audit records using temporary SQLite databases and mocked models

#### Scenario: Desktop chat tests
- **WHEN** desktop tests run
- **THEN** they SHALL verify conversation loading, send flow, stop generation, regenerate, branch, attachment tray, memory panel, and tool timeline without opening a Tauri window
