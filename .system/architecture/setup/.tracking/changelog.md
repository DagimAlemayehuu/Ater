# Changelog

## Phase 5.1 - OKA Hardening & Fail-Safe Recovery (Current)

- **Pedagogical Hardening (v25.6)**: Implemented nuclear-grade structural validation gates in `validator.py`.
    - **Error Block**: Permanently blocked "Error generating" strings from ever reaching the vault.
    - **Wikilink Density**: Enforced ≥3 wikilinks per note body to ensure knowledge graph connectivity.
    - **Answer Leak Guard**: Automated detection of answer leaks in `debug` questions, triggering mandatory regeneration.
- **Fail-Safe Pipeline**: Engineered a robust rate-limit recovery engine in `service.py`.
    - **Pause & Persist**: Generation now pauses on 429 errors, saves session state to disk, and returns a `rate_limited` status.
    - **Hot Key Swap**: Exposed `/api/oka/swap-key` to allow switching AI providers or keys during a live ingestion session without server restarts.
    - **State Resumption**: Implemented `/api/oka/resume` to pick up generation from the exact note where a failure occurred.
- **Domain Integrity**: Added domain drift detection in `agents.py` to prevent cross-concept hallucination (e.g., C++ vs Security tokens).
- **Format Normalization**: Standardized all prerequisite and hub links to strictly use `Underscore_Title_Case` across the entire generator.

## Phase 5.0 - Monochrome Sovereign Engine

- **Total Workforce Simplification**: Purged all legacy agent domains (Wealth, Gym, Chronos, Academics) and the Orchestrator. The system is now a high-fidelity Single-Agent Sovereign powered exclusively by OKA v11.0.
- **Monochrome High-Fidelity UI**: Transitioned to a strictly grayscale design system with deep shadows and glassmorphism, eliminating all legacy color tokens (Amber, Slate, Blue).
- **Consolidated Navigation**: Sidebar finalized to: Knowledge Base (`/obsidian`), Vault Sync (`/vault-sync`), Intelligence (`/agents`), and System Settings at the bottom.
- **Sovereign OKA Pipeline**: Finalized high-fidelity control center for autonomous document ingestion.
- **Database Engine Refinement**: Enhanced vault synchronization logic to support complex Notion database mirroring into interactive Board and Gallery views.
- **API Lockdown**: Pruned all legacy/unused endpoints from `main.py`, leaving a lean, secure sidecar interface.

## Phase 4.7 - Automated Multi-Batch OKA (Deprecated)

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
