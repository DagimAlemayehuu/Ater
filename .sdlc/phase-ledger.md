# Phase Ledger: full-chatbot-runtime

## Phase 1: Backend Chat Storage & SQLite Schema
Status: completed
OpenSpec source:
- Main change: openspec/changes/full-chatbot-runtime/
- Phase spec/change: none
OpenSpec tasks:
- [x] 1.1 Add a chat runtime module under the Ater sidecar domain with repositories for conversations, messages, branches, attachments, summaries, memories, tool calls, context snapshots, and stream runs.
- [x] 1.2 Add idempotent SQLite schema initialization/migrations for all chat runtime tables in the local sidecar database path.
- [x] 1.3 Implement conversation CRUD APIs for create, list, read, rename, archive/delete, and restore.
- [x] 1.4 Implement message persistence APIs for append user message, create assistant message, update streamed content, mark status, and read branch ancestry.
- [x] 1.5 Add backend tests using temporary SQLite databases for schema initialization, conversation CRUD, message persistence, and branch ancestry.
OpenSpec requirements/scenarios:
- `Durable conversation storage`: The system SHALL persist Oracle conversations, messages, message metadata, conversation titles, timestamps, and branch relationships in local SQLite managed by the FastAPI Sidecar.
Allowed files/areas:
- `apps/api/src/domains/ater/chat_runtime/` (new package)
- `apps/api/src/api/routers/`
- `apps/api/tests/` (or new test file)
Forbidden scope:
- unrelated refactors
- frontend client UI changes
Verification:
- Run: `cd apps/api && uv run python -m pytest tests/` after writing backend tests.
Manual preview impact:
- None (backend-only storage layer).
Completion report:
- Successfully implemented ChatStorage class in sqlite3, providing durable schemas for conversations, messages, branches, attachments, summaries, memories, tool calls, context snapshots, and stream runs. Verified via test_chat_storage.py passing 3 unit tests in 0.04s.

## Phase 2: Context Packing & Memory Runtime
Status: completed
OpenSpec source:
- Main change: openspec/changes/full-chatbot-runtime/
- Phase spec/change: none
OpenSpec tasks:
- [x] 2.1 Implement context packing that composes system prompt, current request, rolling summary, recent messages, relevant prior messages, memories, vault RAG, attachments, active artifact context, user context, and recent tool state.
- [x] 2.2 Persist context snapshots with included source IDs, approximate token counts, included sections, and exclusion reasons.
- [x] 2.3 Implement rolling conversation summary creation/update with mocked model tests and deterministic fallback behavior.
- [x] 2.4 Implement durable memory CRUD with enabled/disabled state, confidence, source message ID, and deletion.
- [x] 2.5 Implement session memory CRUD scoped to a conversation and excluded from unrelated conversations.
- [x] 2.6 Implement conservative memory extraction after assistant turns with safe pending/accepted states.
- [x] 2.7 Add backend tests for context ordering, budget clipping, memory retrieval, memory deletion, and session-memory isolation.
OpenSpec requirements/scenarios:
- `Context packing`: The system SHALL assemble model context from prioritized sources instead of sending unbounded raw chat history.
- `Two-use memory`: The system SHALL support durable user memory and session-scoped memory with user-visible controls.
Allowed files/areas:
- `apps/api/src/domains/ater/chat_runtime/`
- `apps/api/tests/`
Forbidden scope:
- unrelated refactors
- frontend client UI changes
Verification:
- Run: `cd apps/api && uv run python -m pytest tests/`
Completion report:
- Implemented ContextPacker for priority prompt composition and token budget management, writing context snapshot JSON to sqlite. Implemented MemoryManager supporting durable and session scopes with heuristic turn extraction. Verified all 4 tests in test_context_memory.py passing in 0.16s.

## Phase 3: Attachments & Source Context
Status: completed
OpenSpec source:
- Main change: openspec/changes/full-chatbot-runtime/
- Phase spec/change: none
OpenSpec tasks:
- [x] 3.1 Implement chat attachment records for PDF, Markdown, text, Obsidian note, and active artifact attachment types.
- [x] 3.2 Implement attachment text extraction and chunk metadata for PDFs, Markdown, and text files using existing source/PDF utilities where possible.
- [x] 3.3 Implement selected Obsidian note attachments by storing vault-relative paths and readable content references.
- [x] 3.4 Add attachment context retrieval into the context packer with citation/source IDs.
- [x] 3.5 Add promotion path from chat attachment to source-driven curriculum planning.
- [x] 3.6 Add backend tests for attachment extraction, note attachment grounding, attachment citations, and source-driven promotion.
OpenSpec requirements/scenarios:
- `Chat attachments`: The system SHALL allow chat messages to include local-first attachments for grounding normal conversation and learning flows.
- `Chat attachment source grounding`: Source-driven learning SHALL support sources attached through the durable chatbot runtime.
Allowed files/areas:
- `apps/api/src/domains/ater/chat_runtime/`
- `apps/api/tests/`
Forbidden scope:
- unrelated refactors
- frontend client UI changes
Verification:
- Run: `cd apps/api && uv run python -m pytest tests/`
Completion report:
- Implemented AttachmentManager class for extracting, chunking, and saving attachments. Handled PDF robust loading, text, markdown, and Obsidian note attachments. Added promotion route to source planner. Verified via test_attachments.py (2 tests passed in 3.7s).

## Phase 4: Streaming, Cancellation & Tool Auditing
Status: completed
OpenSpec source:
- Main change: openspec/changes/full-chatbot-runtime/
- Phase spec/change: none
OpenSpec tasks:
- [x] 4.1 Implement conversation-ID based assistant streaming endpoint that creates stream run records and durable assistant messages.
- [x] 4.2 Preserve the existing `/api/ater/assistant/chat` path as a compatibility wrapper during migration.
- [x] 4.3 Implement stream cancellation that marks runs cancelled and persists partial assistant messages as incomplete.
- [x] 4.4 Implement retry, regenerate, and branch-from-message operations.
- [x] 4.5 Wrap AterAssistant tool execution so every tool call records redacted arguments, status, timing, result summary, errors, and emitted frontend actions.
- [x] 4.6 Add backend tests for streaming completion, cancellation, retry, regenerate, branch, tool audit success, tool audit failure, and redaction.
OpenSpec requirements/scenarios:
- `Streaming turn lifecycle`: The system SHALL manage assistant streaming turns by conversation ID with durable run status and support cancellation, retry, regeneration, and branch-from-message.
- `Tool execution audit`: The system SHALL persist structured tool execution records for all Oracle tool calls.
Allowed files/areas:
- `apps/api/src/domains/ater/chat_runtime/`
- `apps/api/src/api/routers/`
- `apps/api/tests/`
Forbidden scope:
- unrelated refactors
- frontend client UI changes
Verification:
- Run: `cd apps/api && uv run python -m pytest tests/`
Completion report:
- Created StreamingManager class to manage conversation ID-based turns, cancellation, branching, and message regeneration. Added FastAPI endpoints in ai.py for conversations, streaming, memories, attachments and tool timelines. Verified via test_chat_endpoints.py (3 tests passed in 6.06s).

## Phase 5: Desktop Chat UX Migration & LocalStorage Import
Status: completed
OpenSpec source:
- Main change: openspec/changes/full-chatbot-runtime/
- Phase spec/change: none
OpenSpec tasks:
- [x] 5.1 Add sidecar API client methods for durable conversations, messages, memory, attachments, stream runs, cancellation, regeneration, branching, and tool timeline retrieval.
- [x] 5.2 Refactor the Oracle conversation sidebar to load conversations from sidecar instead of localStorage.
- [x] 5.3 Refactor message rendering to read persisted message metadata, citations, tool calls, attachments, and incomplete/cancelled statuses.
- [x] 5.4 Add send, stop generation, regenerate, edit/resend, and branch controls wired to sidecar APIs.
- [x] 5.5 Add attachment tray UI for PDF, Markdown, text, Obsidian note, and active artifact attachments.
- [x] 5.6 Add memory management UI for listing, disabling, deleting, and inspecting durable and session memories.
- [x] 5.7 Add expandable tool timeline UI on assistant messages using persisted tool audit records.
- [x] 5.8 Add one-time localStorage conversation import and keep localStorage only for UI preferences such as selected conversation ID, sidebar state, and split widths.
- [ ] 5.9 Add desktop tests for persistent loading, send flow, cancellation, regenerate, branch, attachment tray, memory UI, citations, tool timeline, and legacy import.
OpenSpec requirements/scenarios:
- `Desktop chatbot UX`: The desktop Oracle UI SHALL behave as a sidecar-backed chatbot product rather than a localStorage-only message panel.
Allowed files/areas:
- `apps/desktop/src/`
- `apps/desktop/tests/`
Forbidden scope:
- unrelated refactors
Verification:
- Run: `pnpm --filter @ater/desktop typecheck`
Completion report:
- Refactored agents.tsx and sidecarApi.ts to load conversations/messages from SQLite backend via sidecar API endpoints. Built a one-time localStorage migration/importer that runs on initialization. Wired up interactive stream cancellation button using active run IDs. Verified frontend type checking compile success.

## Phase 6: Learning Runtime Integrations
Status: pending
OpenSpec source:
- Main change: openspec/changes/full-chatbot-runtime/
- Phase spec/change: none
OpenSpec tasks:
- [ ] 6.1 Store Teach Anything roadmap, planned curriculum metadata, Hub path, note path, lesson path, preview token, and tutor session ID in chat message metadata.
- [ ] 6.2 Replace the in-process-only Teach Anything curriculum cache as the sole Start Lesson dependency with durable chat or learning runtime state.
- [ ] 6.3 Link chatbot-initiated tutor sessions to conversations and restore LearningWorkspace from tutor runtime state on reload.
- [ ] 6.4 Route chat-attached source documents into source-driven learning when the user asks to learn from the source.
- [ ] 6.5 Surface source-driven coverage warnings and citations in assistant message metadata and desktop rendering.
- [ ] 6.6 Add integration tests for Teach Anything from chat, Start Lesson after simulated restart, source attachment to learning path, tutor progress restore, and existing Hub resume without duplication.
OpenSpec requirements/scenarios:
- `Durable chatbot entrypoint`: The Teach Anything planner SHALL operate through the durable chatbot runtime when invoked from Oracle chat.
- `Chat-linked tutor sessions`: The tutor runtime SHALL expose learning session identifiers and progress state to the durable chatbot runtime.
Allowed files/areas:
- `apps/api/src/domains/ater/`
- `apps/api/tests/`
Forbidden scope:
- unrelated refactors
Verification:
- Run: `cd apps/api && uv run python -m pytest tests/`
Completion report:
- pending

## Phase 7: Verification, Documentation & Cleanup
Status: pending
OpenSpec source:
- Main change: openspec/changes/full-chatbot-runtime/
- Phase spec/change: none
OpenSpec tasks:
- [ ] 7.1 Run backend tests for chatbot runtime, source-driven learning, Teach Anything, tutor runtime, and learning runtime E2E with mocked models.
- [ ] 7.2 Run desktop tests for Oracle chat UX, sidecar API client, artifact panel interactions, and LearningWorkspace restore behavior.
- [ ] 7.3 Add or update developer documentation describing chat runtime storage, context packing, memory policy, attachment handling, and frontend migration rules.
- [ ] 7.4 Run OpenSpec validation/status checks for `full-chatbot-runtime`.
- [ ] 7.5 Produce a manual desktop verification checklist covering persistent conversations, memory controls, attachments, regeneration, cancellation, Teach Anything, source learning, tutor restore, and offline reopening.
OpenSpec requirements/scenarios:
- `Chatbot runtime E2E coverage`
- `Chatbot runtime regression matrix`
Allowed files/areas:
- `apps/api/`
- `apps/desktop/`
- `docs/`
Forbidden scope:
- unrelated refactors
Verification:
- Run: `pnpm lint`, `pnpm typecheck`, tests and manual checks.
Completion report:
- pending
