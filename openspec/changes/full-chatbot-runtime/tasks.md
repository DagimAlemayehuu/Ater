## 1. Backend Chat Storage

- [x] 1.1 Add a chat runtime module under the Ater sidecar domain with repositories for conversations, messages, branches, attachments, summaries, memories, tool calls, context snapshots, and stream runs.
- [x] 1.2 Add idempotent SQLite schema initialization/migrations for all chat runtime tables in the local sidecar database path.
- [x] 1.3 Implement conversation CRUD APIs for create, list, read, rename, archive/delete, and restore.
- [x] 1.4 Implement message persistence APIs for append user message, create assistant message, update streamed content, mark status, and read branch ancestry.
- [x] 1.5 Add backend tests using temporary SQLite databases for schema initialization, conversation CRUD, message persistence, and branch ancestry.

## 2. Context And Memory Runtime

- [x] 2.1 Implement context packing that composes system prompt, current request, rolling summary, recent messages, relevant prior messages, memories, vault RAG, attachments, active artifact context, user context, and recent tool state.
- [x] 2.2 Persist context snapshots with included source IDs, approximate token counts, included sections, and exclusion reasons.
- [x] 2.3 Implement rolling conversation summary creation/update with mocked model tests and deterministic fallback behavior.
- [x] 2.4 Implement durable memory CRUD with enabled/disabled state, confidence, source message ID, and deletion.
- [x] 2.5 Implement session memory CRUD scoped to a conversation and excluded from unrelated conversations.
- [x] 2.6 Implement conservative memory extraction after assistant turns with safe pending/accepted states.
- [x] 2.7 Add backend tests for context ordering, budget clipping, memory retrieval, memory deletion, and session-memory isolation.

## 3. Attachments And Source Context

- [x] 3.1 Implement chat attachment records for PDF, Markdown, text, Obsidian note, and active artifact attachment types.
- [x] 3.2 Implement attachment text extraction and chunk metadata for PDFs, Markdown, and text files using existing source/PDF utilities where possible.
- [x] 3.3 Implement selected Obsidian note attachments by storing vault-relative paths and readable content references.
- [x] 3.4 Add attachment context retrieval into the context packer with citation/source IDs.
- [x] 3.5 Add promotion path from chat attachment to source-driven curriculum planning.
- [x] 3.6 Add backend tests for attachment extraction, note attachment grounding, attachment citations, and source-driven promotion.

## 4. Streaming And Tool Audit

- [x] 4.1 Implement conversation-ID based assistant streaming endpoint that creates stream run records and durable assistant messages.
- [x] 4.2 Preserve the existing `/api/ater/assistant/chat` path as a compatibility wrapper during migration.
- [x] 4.3 Implement stream cancellation that marks runs cancelled and persists partial assistant messages as incomplete.
- [x] 4.4 Implement retry, regenerate, and branch-from-message operations.
- [x] 4.5 Wrap AterAssistant tool execution so every tool call records redacted arguments, status, timing, result summary, errors, and emitted frontend actions.
- [x] 4.6 Add backend tests for streaming completion, cancellation, retry, regenerate, branch, tool audit success, tool audit failure, and redaction.

## 5. Desktop Chat UX Migration

- [ ] 5.1 Add sidecar API client methods for durable conversations, messages, memory, attachments, stream runs, cancellation, regeneration, branching, and tool timeline retrieval.
- [ ] 5.2 Refactor the Oracle conversation sidebar to load conversations from sidecar instead of localStorage.
- [ ] 5.3 Refactor message rendering to read persisted message metadata, citations, tool calls, attachments, and incomplete/cancelled statuses.
- [ ] 5.4 Add send, stop generation, regenerate, edit/resend, and branch controls wired to sidecar APIs.
- [ ] 5.5 Add attachment tray UI for PDF, Markdown, text, Obsidian note, and active artifact attachments.
- [ ] 5.6 Add memory management UI for listing, disabling, deleting, and inspecting durable and session memories.
- [ ] 5.7 Add expandable tool timeline UI on assistant messages using persisted tool audit records.
- [ ] 5.8 Add one-time localStorage conversation import and keep localStorage only for UI preferences such as selected conversation ID, sidebar state, and split widths.
- [ ] 5.9 Add desktop tests for persistent loading, send flow, cancellation, regenerate, branch, attachment tray, memory UI, citations, tool timeline, and legacy import.

## 6. Learning Runtime Integrations

- [ ] 6.1 Store Teach Anything roadmap, planned curriculum metadata, Hub path, note path, lesson path, preview token, and tutor session ID in chat message metadata.
- [ ] 6.2 Replace the in-process-only Teach Anything curriculum cache as the sole Start Lesson dependency with durable chat or learning runtime state.
- [ ] 6.3 Link chatbot-initiated tutor sessions to conversations and restore LearningWorkspace from tutor runtime state on reload.
- [ ] 6.4 Route chat-attached source documents into source-driven learning when the user asks to learn from the source.
- [ ] 6.5 Surface source-driven coverage warnings and citations in assistant message metadata and desktop rendering.
- [ ] 6.6 Add integration tests for Teach Anything from chat, Start Lesson after simulated restart, source attachment to learning path, tutor progress restore, and existing Hub resume without duplication.

## 7. Verification And Documentation

- [ ] 7.1 Run backend tests for chatbot runtime, source-driven learning, Teach Anything, tutor runtime, and learning runtime E2E with mocked models.
- [ ] 7.2 Run desktop tests for Oracle chat UX, sidecar API client, artifact panel interactions, and LearningWorkspace restore behavior.
- [ ] 7.3 Add or update developer documentation describing chat runtime storage, context packing, memory policy, attachment handling, and frontend migration rules.
- [ ] 7.4 Run OpenSpec validation/status checks for `full-chatbot-runtime`.
- [ ] 7.5 Produce a manual desktop verification checklist covering persistent conversations, memory controls, attachments, regeneration, cancellation, Teach Anything, source learning, tutor restore, and offline reopening.
