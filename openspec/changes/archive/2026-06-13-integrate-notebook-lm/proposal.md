## Why

Ater v33.0 is a premium learning instrument, but currently lacks integration with Google NotebookLM—an industry-standard platform for synthesizing source material, generating audio/video overviews, and executing deep topic research. Integrating NotebookLM directly into Ater enables users to ingest web/Drive sources, perform deep research, generate slides, quizzes, and podcasts, and query them seamlessly using a unified native interface.

## What Changes

- **Embedded MCP Sidecar**: Add and configure the `notebooklm-mcp` server as a Tauri external binary/sidecar launched on startup.
- **Tauri Auth Command**: Add `start_notebooklm_auth` Tauri IPC command to spawn `nlm login` via browser redirect, writing Google credentials locally.
- **Agent Integration**: Extend the Ater Oracle Chat Agent with Structured Tools to query, research, and trigger studio generation in NotebookLM on behalf of the user.
- **Interactive NotebookLM Workspace**: A new page/tab in the desktop React application to visualize, search, and manage notebooks, sources, and generated studio media (audio, video, PDF decks, infographics).
- **Active Recall Sync**: Auto-ingest generated quizzes and flashcards into Ater's local SQLite database and FSRS scheduler for daily reviews.

## Capabilities

### New Capabilities

- `notebook-lm`: Implements the direct connection to Google NotebookLM, exposing notebook management, source ingestion, deep research, monochrome studio asset generation, and direct Ater Oracle integration.

### Modified Capabilities

None.

## Impact

- **Desktop App (Tauri/React)**: New `/notebook-lm` route, new `Settings -> Integrations` configuration panel, and Tauri Rust IPC additions.
- **API Backend (Python)**: LangChain agent tools additions in `apps/api/src/domains/ater/assistant.py` to bridge to the MCP server.
- **Database (SQLite)**: Schema mapping to import quiz and flashcard data into local spaced-repetition tables.
