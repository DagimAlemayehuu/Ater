## Why

Ater Oracle is currently a powerful app-control agent, but it is not yet a full chatbot runtime comparable to ChatGPT, Claude, or Gemini because durable conversations, cross-session memory, context packing, attachment handling, regeneration, and tool auditability are fragmented across localStorage, transient request payloads, and specialized learning/session stores. This change turns Oracle into a first-class conversational runtime while preserving Ater's local-first architecture and existing academic learning powers.

## What Changes

- Introduce a durable local chat runtime in the FastAPI Sidecar backed by SQLite tables for conversations, messages, attachments, summaries, memories, tool calls, and context snapshots.
- Add a backend conversation API that supports create/list/read/update/delete, message append, streaming assistant turns by conversation ID, cancellation, retry, regeneration, and branch-from-message.
- Add long-context management: deterministic context packing, rolling summaries, relevant-message retrieval, local vault RAG, memory retrieval, active artifact context, and user context composition.
- Add two-use memory: stable user memory for durable preferences/facts/goals and session memory for thread-scoped working context, both inspectable and deletable by the user.
- Add a chat attachment model for PDFs, Markdown, text, selected Obsidian notes, active lesson artifacts, and source-grounded learning material without forcing all attachments through the Ater Architect bulk ingestion flow.
- Add tool execution audit logs and typed tool result envelopes so app-control actions are replayable, debuggable, and recoverable after reload.
- Upgrade the Oracle desktop UI from localStorage-only chat to a persistent chat product: conversation sidebar backed by sidecar data, message edit/resend, regenerate, branch, stop generation, attachment tray, memory controls, tool timeline, and citation display.
- Add model routing hooks for chat, planner, utility, and artifact/edit tasks using existing provider settings and limits without violating local ONNX embedding constraints.
- Preserve the existing Teach Anything, source-driven learning, tutor runtime, NotebookLM, practice, SRS, Pomodoro, and navigation tools as capabilities available to the chatbot runtime.
- Add regression and E2E tests for chat persistence, memory extraction/retrieval, context packing, tool audit records, streaming cancellation, attachment-grounded answers, Teach Anything entrypoints, and offline reopening.

## Capabilities

### New Capabilities

- `chatbot-runtime`: Durable Oracle chat conversations, memory, context packing, attachment handling, tool audit logs, streaming turn control, and desktop chat UX.

### Modified Capabilities

- `teach-anything-planner`: Teach Anything prompts SHALL enter through the durable chatbot runtime while still handing learning sessions to the unified progressive learning runtime.
- `source-driven-learning`: Source uploads from chat SHALL be attachable conversation context and MAY be promoted into source-grounded learning paths without duplicating the bulk ingestion pipeline.
- `tutor-runtime`: Tutor/session state SHALL be linkable from chatbot conversations and resumable from durable chat context without relying on localStorage-only lesson pointers.
- `learning-runtime-e2e`: End-to-end verification SHALL cover the durable chatbot runtime as an entrypoint for topic prompts, source prompts, and existing Hub resumes.

## Impact

- Backend: `apps/api/src/domains/ater/assistant.py`, new chat runtime service modules, `apps/api/src/api/routers/ai.py`, possibly `apps/api/src/api/routers/ater.py`, local SQLite migrations/schema initialization, tests under `apps/api/tests/`.
- Frontend: `apps/desktop/src/routes/agents.tsx`, `apps/desktop/src/lib/sidecarApi.ts`, artifact/message stores, Oracle UI blocks, conversation sidebar, attachment UI, memory UI, and related tests.
- Storage: New local SQLite tables under the existing local sidecar/inbox database area; no Supabase source-of-truth change for chat content unless explicitly added later.
- AI/RAG: Continue using local ONNX embeddings for semantic retrieval; cloud model calls remain limited to configured generation providers and existing billing controls.
- Security/privacy: User memory and chat transcripts are local-first and user-deletable; destructive app-control tools require visible confirmation or existing safe form flows.
