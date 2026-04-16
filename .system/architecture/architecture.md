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

### Core Reasoning Engine (The Sovereign Engine)
The system has been consolidated into a **Single-Agent Sovereign Core**:
1.  **OKA (Obsidian Knowledge Architect)**: The absolute autonomous ingestion engine. It is the core intelligence unit of Life OS, responsible for transforming unstructured inputs into structured, pedagogical knowledge assets in Obsidian.

## 2. UI/UX Strategy
> The interface follows a **Monochrome High-Fidelity** paradigm.

*   **Standardized Navigation**: Sidebar consists of "Knowledge Base" (Vault Access), "Vault Sync" (Database Clusters), "Intelligence" (OKA Hub), and "Settings".
*   **Aesthetic Purity**: Grayscale-only palette with deep shadows, high-fidelity typography, and blurred glassmorphism.
*   **Interactive Databases**: Native Board, Table, Gallery, and Calendar views for managing knowledge metadata.
*   **Neural Graph Visualization**: Global 2D force-directed graph with real-time centrality scaling and zoom-proximate label fading.
*   **WikiLink Orchestration**: Seamless inter-note navigation and on-demand file creation protocol.


## 3. API-First Contracts
> The React Frontend (`apps/desktop`) communicates with the Python Backend (`apps/api`) via HTTP (localhost) and the Tauri Shell via IPC.

### Example Flow (OKA Execution)
- **Frontend (React)**: User selects a file in the OKA Dashboard. Invokes `sidecarApi.okaGeneratePlan`.
- **Python API (FastAPI)**: Processes the file using the OKA reasoning engine, updates the local status cache, and returns the plan.
- **Polling**: Frontend components poll `/api/oka/queue/status` to maintain real-time mission control data (plans, logs, active batches).

## 4. Data Storage Blueprint
> Life OS relies on a combination of local and cloud storage, bypassing a traditional relational database.

*   **Local State**: Tauri-plugin-store (API Keys, Vault Path, User Profiles).
*   **Knowledge Base**: Local Obsidian `.md` files (Unstructured data for RAG).
*   **Graph State**: Dynamically computed node-link topology derived from raw markdown wikilink parsing.
*   **Cloud Database**: Notion API (Structured data: Tasks, Projects, Goals).

## 5. Key Decisions & Trade-offs
1.  **Workforce Consolidation**: Reducing the agent count to a single specialist (**OKA**) minimizes token overhead and architectural complexity while maintaining full functional coverage.

2.  **Local-First & Offline**: Built to operate entirely without internet connectivity for core functions to maximize speed, privacy, and reliability.
3.  **No Hardcoded Secrets**: All keys exist entirely within the Tauri secure store and are passed strictly per-request in memory to the backend.
4.  **Thin Context Protocol**: To support weak models with small context windows, the backend isolates every note generation turn. It only sends the System Instruction, the Master Plan, and the current task, preventing the history from saturating the model's memory.
5.  **Absolute Atomicity**: The ingestion engine enforces a strict 1-note-per-batch deployment. This ensures maximum technical detail per note and prevents truncation errors common in high-volume AI generations.
6.  **Adaptive High-Fidelity**: The system uses an "Auto-Repair" parsing logic to intelligently fix formatting errors (like triple backticks) made by weaker models, ensuring deployment success across all model tiers.
