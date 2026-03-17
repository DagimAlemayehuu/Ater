# Changelog

## Phase 4.5 - Workspace Consolidation & Intelligence Refactor (Current)

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
