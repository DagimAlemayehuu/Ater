<!--
[TEMPLATE: ARCHITECTURE BLUEPRINT]
Instructions for the Architect Agent (Delete this block before use):
You MUST fill out this file based on the user's `prompt.md`.
This file defines the absolute law for the Database and Backend Builders.
You must meticulously define the Schema, API Contracts, and System Map.
-->

# System Architecture (Life OS)

## 1. System Map & Technologies
> Life OS is a local-first desktop application built as a polyglot monorepo.

*   `apps/desktop`: Tauri v2 (Rust) Desktop Shell + React/Vite Frontend (TypeScript, Tailwind, shadcn/ui)
*   `apps/api`: Python FastAPI Backend Sidecar (compiled via PyInstaller, managed via uv)
*   `apps/e2e-tests`: Playwright E2E Tests (TypeScript)
*   `packages/schemas`: Shared Types/Zod/OpenAPI specs
*   `packages/config-eslint`: Shared ESLint config
*   `packages/config-typescript`: Shared TS config

## 2. API-First Contracts
> The React Frontend (`apps/desktop`) communicates with the Python Backend (`apps/api`) via HTTP (localhost) and the Tauri Shell via IPC.

### Example Flow (Obsidian Knowledge Architect - OKA)
- **Frontend (React)**: Reads local Tauri store (config, API keys). Invokes Python sidecar commands via HTTP.
- **Python API (FastAPI)**: Handles heavy processing, RAG logic via local Obsidian `.md` files, and Notion/Gemini API interactions.
- **Tauri Desktop**: Manages filesystem permissions, launches the Python sidecar process, bridges IPC.

## 3. Data Storage Blueprint
> Life OS relies on a combination of local and cloud storage, bypassing a traditional relational database.

*   **Local State**: Tauri-plugin-store (API Keys, Vault Path, User Profiles).
*   **Knowledge Base**: Local Obsidian `.md` files (Unstructured data for RAG).
*   **Cloud Database**: Notion API (Structured data: Tasks, Projects, Goals).

## 4. Key Decisions & Trade-offs
1.  **Local-First & Offline**: Built to operate entirely without internet connectivity for core functions to maximize speed, privacy, and reliability. Network access is strictly limited to explicitly invoked external APIs (Notion, Gemini).
2.  **Polyglot Approach**: Tauri/React/Rust provide a highly performant native desktop shell, while Python FastAPI provides access to the mature AI/Data Science ecosystem necessary for the reasoning engine.
3.  **No Hardcoded Secrets**: Strict enforcement of security; all keys exist entirely within the Tauri secure store and are passed strictly per-request in memory to the backend.
