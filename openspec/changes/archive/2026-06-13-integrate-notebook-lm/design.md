## Context

Ater v33.0 is a Tauri-powered desktop application built with React, Supabase, and Monaco Editor. The Python API sidecar (`ater-api`) coordinates reasoning tasks and tool-calling via LangChain. Integrating Google NotebookLM will be achieved by wrapping the `nlm` CLI (provided by the `notebooklm-mcp-cli` python package) directly inside the `ater-api` Python FastAPI backend, avoiding the complexity of implementing custom JSON-RPC stdio transport in Rust/Tauri.

## Goals / Non-Goals

**Goals:**
- Package `notebooklm-mcp-cli` inside the `ater-api` Python environment.
- Create a Python execution helper class to run `nlm` CLI commands asynchronously and parse their output.
- Expose a set of FastAPI REST and SSE endpoints for notebook management, source ingestion, studio generation, and auth polling.
- Register new LangChain Structured Tools in `apps/api/src/domains/ater/assistant.py` that call the `nlm` CLI helper.
- Build a user interface inside Ater (`apps/desktop/src/routes/notebooks.tsx`) that interacts with these new FastAPI endpoints.
- Auto-sync generated quizzes and flashcards into Ater's local SQLite database and FSRS scheduler.

**Non-Goals:**
- Implementing custom JSON-RPC stdio client transport in Rust/Tauri.
- Bundling `notebooklm-mcp` as a separate Tauri-level sidecar binary.

## Decisions

### 1. Execute `nlm` commands via Python subprocess
- **Option A**: Run `notebooklm-mcp` as a stdio MCP server inside python using an MCP client library.
- **Option B (Chosen)**: Run `nlm` CLI commands (e.g. `nlm notebook list --json`) via Python's `asyncio.create_subprocess_exec` and parse the standard output.
- **Rationale**: The `nlm` CLI provides clean JSON outputs for all commands, built-in retry mechanics, and fully automated profile/auth management. Directly running the CLI commands is simpler and less error-prone than managing a long-running JSON-RPC stdio process inside FastAPI.

### 2. Frontend Communication via REST API
- **Option A**: Tunnel MCP messages through Tauri IPC.
- **Option B (Chosen)**: Expose clean REST endpoints from FastAPI (e.g. `GET /api/notebooks`, `POST /api/notebooks/{id}/sources`).
- **Rationale**: React frontend already communicates with FastAPI for chat and practice generation. Reusing the HTTP proxy pattern keeps the frontend simple and consistent.

## Risks / Trade-offs

- **[Risk] Subprocess Overhead**: Spawning python subprocesses for every command.
  - **Mitigation**: Cache list operations (like notebooks list) for 5-10 seconds to avoid rapid back-to-back command spawns.
- **[Risk] Shell Pathing**: Ensuring the compiled `ater-api` sidecar has the `nlm` command available in its executable path.
  - **Mitigation**: In pyproject.toml, package `notebooklm-mcp-cli` as a direct dependency. PyInstaller will package the command script directly inside the sidecar package environment.
