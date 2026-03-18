# Changelog

## Phase 4.7 - Automated Multi-Batch OKA (Current)

- **Automated Multi-Batch Deployment**: Implemented an autonomous loop in the frontend that sequentially generates and deploys all planned OKA batches (Hub, Questions, and Atomic Notes) with a single click.
- **Rate-Limit Awareness**: Integrated a 5-second mandatory pause between batches to respect Gemini Free Tier rate limits (15 RPM).
- **Robust Batch Parsing**: Overhauled the OKA regex parser to be fully Markdown-aware, correctly identifying batches even with bold formatting (`**Batch X**`).
- **Standardized Model**: Solidified `gemini-2.5-flash` as the absolute system-wide default for all reasoning and ingestion tasks.
- **Detailed Error Reporting**: Added a dedicated OKA Pipeline Error UI that displays full Python tracebacks for instant debugging of API or parsing failures.
- **Refined Protocol Discovery**: Fixed pathing logic to ensure the `OKA_Visual_Protocol_V2.md` is always correctly appended to system instructions from any execution context.

## Phase 4.6 - OKA Restoration & Single-Batch Policy (Deprecated)

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
