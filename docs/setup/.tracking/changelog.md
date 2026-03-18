# Changelog

## Phase 4.6 - OKA Restoration & Single-Batch Policy (Current)

- **Restored OKA (Obsidian Knowledge Architect)**: Re-implemented the academic ingestion engine with a focused single-session flow.
- **First-Batch-Only Limitation**: System now generates the Knowledge Asset Plan and the **first batch of notes only** (Unit Hub & Questions). Subsequent batches are explicitly disabled to ensure high-fidelity focus.
- **Modern SDK Migration**: Upgraded `OkaService` to use the latest `google-generativeai` SDK with `gemini-2.5-flash` exclusivity.
- **UI Integration**: Added a dedicated **Autonomous** tab in Obsidian Hub for OKA processing with plan preview and single-click deployment.
- **Protocol Restoration**: Recovered the missing `OKA_Visual_Protocol_V2.md` for mandatory visual/technical asset standards.

## Phase 4.5 - Workspace Consolidation & Intelligence Refactor

- **Completely removed OKA (Obsidian Knowledge Architect)** synthesis engine and background workers.
- **Refactored Obsidian Hub**:
    - Created a side-by-side **Intelligence View** with System Instructions on the left and Gemini Chat on the right.
    - Implemented a **Vault Explorer** with hierarchical folder tree navigation.
    - Built a high-fidelity, single-pane **Markdown Reader** with professional typography.
    - Enabled **Real-time File Uploads** (PDF, Code, Text) using Gemini Files API.
- **Refactored Notion Hub**:
    - Consolidated **Academics** and **Goals** into a single tabbed view.
    - Optimized dashboard links to point to the new unified hub.
- **Backend Refactor**:
    - Updated `Strategist.brainstorm` to support `file_uri` and dynamic MIME-type detection.
    - Added `/api/ai/upload` endpoint with file processing wait cycles.
    - Fixed SDK compatibility by mapping frontend roles to Gemini model roles.
- **Navigation Update**: Streamlined sidebar to: Dashboard, Notion, Obsidian, Settings.

## Phase 4.0 - OKA & Synthesis (Deprecated)

- Implemented the Obsidian Knowledge Architect (OKA) for large-scale synthesis.
- Built background job queue with SQLite persistence.
- (These features were removed in v4.5 in favor of real-time, instruction-driven reasoning).

## Phase 3.4 - Gemini Intelligence & Dashboard

- Implemented AI Strategist domain in Python using Gemini Flash SDK.
- Exposed /api/ai/brainstorm endpoint for high-speed reasoning.
- Created "Dashboard" live-stats overview UI.
- Finalized Settings UI for local storage management.

## Phase 3.3 - The Shadcn UI Shell & Connectors

- Installed Tailwind CSS and configured Shadcn design tokens (HSL variables).
- Implemented professional collapsible Sidebar/Shell in React.
- Built Notion/Obsidian connectors in Python sidecar with Header-based authentication.

## Phase 3.2 - Storage, State, and Onboarding

- Installed and registered tauri-plugin-store in Rust (lib.rs) and React.
- Implemented ConfigContext.tsx (Zustand-like persistent store via Tauri).
- Created onboarding gate UI (/onboarding) for system initialization.

## Phase 3.1 - Core Infrastructure & Sidecar Wiring

- Initialized @life-os/desktop (Vite + React + TypeScript).
- Initialized Tauri v2 shell in apps/desktop.
- Implemented Python FastAPI sidecar with /api/health endpoint.

## Phase 1 - Scaffolding

- Initialized git repository.
- Created full monorepo directory structure.
- Generated architecture documentation.
