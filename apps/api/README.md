# Ater Sidecar (Python API)

This is the high-performance reasoning and data orchestration layer for Ater. It is a FastAPI application that handles heavy-duty API integrations and local knowledge processing.

## Core Responsibilities

- **AI Orchestration**: Unified interface for Google Gemini 2.5 Flash.
    - **Instruction Injection**: Dynamic system prompt management.
    - **Multimodal Context**: Real-time file processing via Gemini Files API.
    - **Role Mapping**: Automatic conversion between frontend and SDK messaging schemas.
- **Ater Engine**: Refined academic knowledge synthesis. The system is designed to generate a complete Knowledge Asset Cluster (Unit Hub, Questions, and all Atomic Notes) across multiple batches for seamless integration into Obsidian.
- **Notion Synapse**: High-speed connectors for Goals, Academics, and Task databases.
- **Obsidian Vault Hub**: Filesystem-based reader and hierarchical structure parser for local Markdown vaults.

## Stack

- **Framework**: FastAPI
- **LLM SDK**: Google Generative AI (Stable SDK)
- **Data Clients**: Notion Client (Async), Obsidian Filesystem Client
- **Validation**: Pydantic v2
- **Runtime**: Python 3.11+ managed by `uv`

## Key Endpoints

- `POST /api/ai/upload`: Uploads and waits for processing of documents for Gemini context.
- `POST /api/ai/brainstorm`: Main reasoning loop with instruction and multimodal support.
- `GET /api/academics/dashboard`: Consolidated view of all Notion academic data.
- `GET /api/obsidian/files`: Recursive vault structure parsing.

## Developer Setup

1. Ensure `uv` is installed.
2. Run `uv sync` to install dependencies.
3. Run `python main.py` or use the root `pnpm dev` command to start the sidecar.
