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

### Core Reasoning Engine (The Workforce)
The system has been consolidated from multiple specialists into a **Dual-Agent Core**:
1.  **Orchestrator**: The master planning and executive interface. Manages high-level brainstorming, history, and oversees all system activities. Integrated as the primary interactive dashboard within the Agent Registry.
2.  **OKA (Obsidian Knowledge Architect)**: The autonomous data ingestion engine. Transforms raw inputs into structured pedagogical knowledge assets in Obsidian.

## 2. UI/UX Strategy
> The interface is designed for minimal friction and professional aesthetics.

*   **Streamlined Sidebar**: Focuses on core hubs: "Knowledge Base" (Obsidian Vault Access) and "Intelligence" (Agent Registry).
*   **Integrated Agent Registry**: Centralized control for all autonomous units. The Orchestrator view is embedded directly as the "Inspect" dashboard for the Orchestrator agent, providing full chat capabilities.
*   **Shadcn UI & Tailwind**: Consistent, professional styling across all views.

## 3. API-First Contracts
> The React Frontend (`apps/desktop`) communicates with the Python Backend (`apps/api`) via HTTP (localhost) and the Tauri Shell via IPC.

### Example Flow (Orchestrator Execution)
- **Frontend (React)**: Captures user input in the `OrchestratorPage`. Invokes `sidecarApi.brainstorm`.
- **Python API (FastAPI)**: Processes the request using the Reasoning Engine, updates the local status cache, and returns the response.
- **Polling**: Frontend components poll `/api/ai/orchestrator/status` to maintain real-time mission control data (plans, logs, active stages).

## 4. Data Storage Blueprint
> Life OS relies on a combination of local and cloud storage, bypassing a traditional relational database.

*   **Local State**: Tauri-plugin-store (API Keys, Vault Path, User Profiles).
*   **Knowledge Base**: Local Obsidian `.md` files (Unstructured data for RAG).
*   **Cloud Database**: Notion API (Structured data: Tasks, Projects, Goals).

## 5. Key Decisions & Trade-offs
1.  **Workforce Consolidation**: Reducing the agent count to two primary specialists (Orchestrator and OKA) minimizes token overhead and architectural complexity while maintaining full functional coverage.
2.  **Local-First & Offline**: Built to operate entirely without internet connectivity for core functions to maximize speed, privacy, and reliability.
3.  **No Hardcoded Secrets**: All keys exist entirely within the Tauri secure store and are passed strictly per-request in memory to the backend.
4.  **Thin Context Protocol**: To support weak models with small context windows, the backend isolates every note generation turn. It only sends the System Instruction, the Master Plan, and the current task, preventing the history from saturating the model's memory.
5.  **Absolute Atomicity**: The ingestion engine enforces a strict 1-note-per-batch deployment. This ensures maximum technical detail per note and prevents truncation errors common in high-volume AI generations.
6.  **Adaptive High-Fidelity**: The system uses an "Auto-Repair" parsing logic to intelligently fix formatting errors (like triple backticks) made by weaker models, ensuring deployment success across all model tiers.
