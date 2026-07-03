## Context

Ater Oracle currently streams through `/api/ater/assistant/chat`, formats the entire visible message history in the desktop client, stores conversations in `localStorage`, injects ad hoc `rag_context` and `user_context`, and runs tool calls through `AterAssistant`. This gives Oracle strong app-control capabilities, but it does not provide durable conversation state, cross-chat memory, context window management, audited tool execution, or robust attachment handling.

The target architecture keeps Ater local-first. Chat transcripts, memories, summaries, attachments, and tool logs live in local SQLite managed by the FastAPI Sidecar. Supabase remains out of scope for chat transcript storage. ONNX Runtime remains the only embedding path for local semantic retrieval.

## Goals / Non-Goals

**Goals:**

- Make Oracle a durable chatbot runtime with server-side conversations, messages, thread state, summaries, memories, attachments, and tool audit logs.
- Preserve existing Ater powers: Teach Anything, source-driven learning, tutor runtime, NotebookLM, practice, SRS, Pomodoro, navigation, and vault operations.
- Replace localStorage as the source of truth for chat conversations while keeping a migration/import path for existing localStorage history.
- Add explicit context packing so every model call receives a controlled blend of system prompt, relevant history, conversation summary, memory, RAG, attachments, user context, active artifact context, and tool state.
- Add user-visible controls for memory, attachments, regeneration, branching, stop generation, and tool timelines.
- Verify the runtime headlessly with mocked models and temporary SQLite databases.

**Non-Goals:**

- Do not store chat transcripts in Supabase.
- Do not replace ONNX Runtime with cloud embeddings.
- Do not rewrite the Teach Anything, tutor, or source-driven learning runtimes from scratch.
- Do not add voice, camera, screen recording, or image generation in this change.
- Do not change DRM, billing, or account profile source-of-truth behavior except for respecting existing feature locks.

## Decisions

### Decision: Add a dedicated chat runtime domain in the FastAPI Sidecar

Implement a new backend service layer under `apps/api/src/domains/ater/chat_runtime/` or equivalent modules with explicit responsibilities:

- `store.py`: SQLite schema, migrations, repositories.
- `memory.py`: durable and session memory CRUD, extraction, retrieval, deletion.
- `context.py`: context packing and budget accounting.
- `attachments.py`: upload/import/read/chunk metadata for chat attachments.
- `streaming.py`: assistant turn lifecycle, cancellation, retry, regeneration, branch.
- `tool_audit.py`: tool call records, arguments, result summaries, user-visible status.

Rationale: extending the monolithic `assistant.py` would deepen the current coupling. A separate runtime isolates chatbot concerns while continuing to call the existing `AterAssistant` tool layer.

Alternative considered: keep localStorage as the source of truth and add better frontend persistence. Rejected because it cannot support reliable cross-session memory, backend context packing, tool audit records, or app restart recovery.

### Decision: Use local SQLite for chat state

Add tables in the local sidecar database area, preferably the existing `ater_queue.db` path when `inbox_path` is configured:

- `chat_conversations`
- `chat_messages`
- `chat_message_branches`
- `chat_attachments`
- `chat_summaries`
- `chat_memories`
- `chat_tool_calls`
- `chat_context_snapshots`
- `chat_stream_runs`

Rationale: this matches Ater's local-first model and existing tutor/SRS local persistence. The records are user-deletable and available offline.

Alternative considered: write chat state as Markdown in the Obsidian Vault. Rejected for the primary runtime because chat needs fast indexed state, branch IDs, cancellation state, and structured tool audit records. Export to Markdown can be added later.

### Decision: Build an explicit context assembler

The assistant turn should not receive raw full history by default. The runtime SHALL compose context in this order:

1. system prompt and current environment time
2. current user request
3. active conversation summary
4. recent messages
5. retrieved relevant prior messages from the same conversation
6. retrieved durable memories
7. session memories
8. local vault RAG snippets from ONNX search
9. attachment excerpts
10. active artifact context
11. user context and Pomodoro/current Hub state
12. compact tool state from recent tool calls

Each assembled request stores a `chat_context_snapshots` row containing source IDs and approximate token budgets, not necessarily full prompt text.

Rationale: this makes long chats reliable and testable. It also prevents accidental prompt bloat from sending full conversations forever.

### Decision: Two-use memory means durable memory plus session memory

Implement two memory scopes:

- Durable memory: stable facts, preferences, recurring goals, and user instructions that can apply across conversations.
- Session memory: temporary facts and working assumptions that apply only to one conversation/thread.

Both scopes require user-visible list/delete controls. Memory extraction can run after assistant turns, but the first implementation should mark candidate memories as `pending` unless confidence and policy allow auto-save.

Rationale: the user explicitly wants a real chatbot with memory, but Ater must avoid silently preserving noisy or sensitive facts.

### Decision: Keep Teach Anything routing, but make chat runtime the entrypoint

Learning-trigger detection may remain in `assistant.py` initially, but the durable runtime owns the conversation, message storage, stream run, and context. When a prompt triggers Teach Anything, the resulting roadmap, lesson preview, Hub path, note path, and tutor session ID are stored as structured message metadata and linked runtime state.

Rationale: this avoids duplicating the learning runtime while making topic prompts behave like normal chatbot conversations.

### Decision: Attachments are chat context first, learning sources second

PDF, Markdown, text, selected notes, and active artifacts can be attached to a chat message. The runtime stores metadata and extracted text chunks. The user can ask questions over attachments without committing to Atomic Note generation. If the user asks to learn from a source, the attachment can be promoted into the existing source-driven planning flow.

Rationale: ChatGPT/Claude-style chat needs lightweight attached context. Ater Architect remains the bulk ingestion path.

### Decision: Tool calls become auditable runtime events

Every tool call gets a durable record with run ID, message ID, tool name, arguments, status, started/finished timestamps, result summary, error text, and any frontend action emitted. Sensitive fields such as API keys must be redacted before persistence.

Rationale: this supports a visible tool timeline, debugging, replay-safe summaries, and restart recovery.

### Decision: Frontend migrates to sidecar-backed conversations

`agents.tsx` should load conversations, messages, previews, attachments, and memory state from sidecar APIs. `localStorage` remains only for UI affordances such as selected conversation ID, sidebar open state, split widths, and migration cache. Existing localStorage conversations should be importable into the new store once.

Rationale: the desktop UI should behave like a real chat product across reloads and sidecar restarts.

## Risks / Trade-offs

- Chat schema sprawl -> Mitigate with a small migration module and repository tests before wiring UI.
- Memory pollution -> Mitigate with confidence scoring, user-visible controls, deletion, and conservative extraction rules.
- Context packing bugs can hide important information -> Mitigate with snapshot records and tests for priority ordering.
- Tool audit logs may persist sensitive arguments -> Mitigate with redaction before insert and tests for API keys/path traversal.
- Streaming cancellation can leave partial turns -> Mitigate with run status values: `running`, `cancelled`, `failed`, `completed`; partial assistant messages remain marked incomplete.
- Frontend migration may break existing chats -> Mitigate with read-only localStorage import and rollback to old localStorage rendering if sidecar chat API is unavailable.
- Scope is large -> Mitigate by implementing in phases: storage/API, context/memory, streaming/tool audit, frontend UX, learning integration, verification.

## Migration Plan

1. Add backend chat runtime tables and repository tests using temporary SQLite databases.
2. Add conversation/message/memory/attachment APIs without changing the existing streaming endpoint.
3. Add runtime-backed streaming by conversation ID and preserve the existing `/api/ater/assistant/chat` endpoint as a compatibility wrapper.
4. Add context packing, summaries, memory retrieval, and tool audit records.
5. Migrate the Oracle frontend to sidecar-backed conversation APIs.
6. Add localStorage import for existing conversations and keep localStorage only for UI preferences.
7. Wire Teach Anything, source attachment promotion, tutor session links, and artifact links into message metadata.
8. Run backend and desktop tests, then perform manual desktop verification.

Rollback strategy: keep the old `oracleChatStream` compatibility path during implementation. If the new runtime fails, the frontend can temporarily fall back to the current localStorage-backed chat call while preserving the new tables for later retry.
