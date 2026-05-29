# Ater Sidecar (Python API)

This is the high-performance reasoning orchestration and Notion synchronization layer for Ater. It operates as a local FastAPI python sidecar service, bridging the Tauri React desktop client with external APIs and Notion database assets.

## Core Responsibilities

- **AI Orchestration**: Direct integration interface for Google Gemini models (Gemini 1.5 Pro/Flash, Gemini 2.0, Gemini 3.5).
    - **Instruction Injection**: Dynamic prompt injection for structural Ater note generation.
    - **Multimodal Context**: Processing and validation of files using Gemini Generative SDKs.
- **Ater Ingestion Engine (v33.0)**: Manages structured study-note generation.
    - **Oracle Pre-Analysis**: MetaScannerAgent briefing for global document context.
    - **Singularity Parallelism**: Massively parallel generation governed by the `TokenGovernor`.
    - **Cognitive Anchoring**: Strict domain-persona stability via anchoring laws.
- **Notion Synapse**: High-speed, async connectors for Notion goals, academic schedules, and task lists.
- **Obsidian Vault Syncer**: Local filesystem parser that processes Obsidian vault indices and structures to display in the desktop file tree.

## Stack

- **Web Framework**: FastAPI + Uvicorn
- **AI Integration**: Google Generative AI (Python SDK)
- **Data Clients**: Notion Client (Async), SQLite (local caching)
- **Validation**: Pydantic v2
- **Runtime Environment**: Python 3.11+ managed by `uv`

## Key Endpoints

- `POST /api/ai/upload`: Uploads and pre-processes files for context-rich AI conversation.
- `POST /api/ai/brainstorm`: Performs instruction-anchored thinking loops.
- `GET /api/academics/dashboard`: Retrieves consolidated data from Notion academic databases.
- `GET /api/obsidian/files`: Parses recursive folders and file lists from the target local Obsidian vault path.

## Setup & Running

The sidecar is managed automatically by the monorepo workspace toolchain:
* Start it individually using: `pnpm --filter @ater/api dev` or `pnpm sidecar:dev` from the root.
* Standard monorepo start uses `pnpm dev` from the root to run Tauri and the sidecar concurrently.
