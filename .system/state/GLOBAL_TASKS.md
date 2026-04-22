# Global Task Tracker

## 1. Intelligence & RAG Agent
### Pending Epics
*   [ ] Implement hybrid search (BM25 + Vector) for better keyword retrieval.
*   [ ] Add support for local LLM (Ollama) fallback.

### Completed Epics
*   [x] **Local RAG Core**: Integrated ChromaDB with `all-MiniLM-L6-v2` for low-RAM indexing.
*   [x] **Vault Watcher**: Real-time filesystem observer for Obsidian vault updates.
*   [x] **Strategist Memory**: Upgraded AI Strategist to inject local vault context into every query.

---

## 2. Backend Agent (apps/api)
### Pending Epics
*   [x] **Pagination Support**: Implemented pagination for Notion database queries and block extraction (>100 items).
*   [ ] **Hybrid Search**: Implement hybrid search (BM25 + Vector) for better keyword retrieval.
*   [ ] **Custom Templates**: Allow users to define custom YAML mapping for Notion properties.
*   [ ] **Conflict Resolution**: Logic for handling simultaneous edits in Notion and Obsidian.
*   [ ] **Offline Mode**: Local caching of Notion data to allow limited offline access.
*   [ ] **Attachment Sync**: Syncing images and PDFs from Notion pages to Obsidian attachment folder.
*   [ ] Add image-to-text OCR for OKA ingestion.

### Completed Epics
*   [x] **Hierarchical Notion Mirror**: Rebuilt sync engine to mirror Notion structure into Obsidian folders.
*   [x] **Sync Progress Tracking**: Implemented real-time callback-based progress reporting for long-running sync tasks.
*   [x] **YAML Metadata Injection**: Automated extraction of Notion properties into Obsidian-compatible frontmatter.
*   [x] **OKA v9.0 Sovereign Logic**: Implemented strict structural validation, 1-note-per-turn generation (Sniper Mode), and permissive yet robust delimiter extraction.
*   [x] **FastAPI Parity Parser**: Integrated real-time parity checking between the Generation Plan and the deployment queue.

---

## 3. Frontend Agent (apps/desktop)
### Pending Epics
*   [ ] Implement Goal editing directly from the Dashboard.
*   [ ] Add dark/light mode toggle persistence.

### Completed Epics
*   [x] **Notion Hub Overhaul**: Replicated Notion's macro-categorization UI.
*   [x] **Deep Page View**: Built native block-based renderer for viewing Notion pages without a browser.
*   [x] **Sync Progress UI**: Integrated real-time progress bars for RAG and Notion syncing in Settings.
*   [x] **OKA Queue Manager**: High-fidelity dashboard for real-time plan visualization, status tracking, and batch confirmation.

---

## 4. DevOps Agent (Infrastructure)
### Pending Epics
*   [ ] Configure GitHub Actions CI/CD pipeline.
*   [ ] Build cross-platform installers (macOS/Windows).

### Completed Epics
*   *(Empty)*

---

## 5. System Intelligence & OKA Pipeline
### Pending Epics
*   [ ] Finalize high-fidelity board views for OKA plan visualization.
*   [ ] Implement advanced metadata auto-detection for PDF ingestion.

### Completed Epics
*   [x] **OKA Autonomous Engine**: Pruned all legacy agent domains (Wealth, Gym, Chronos) to lock into a single high-fidelity pipeline.
*   [x] **Monochrome Design System**: Implemented a strict grayscale aesthetic for minimal visual distraction and premium feel.
*   [x] **Single-Agent Registry**: Refactored the `/agents` page to exclusively feature the OKA dashboard.
*   [x] **Absolute Atomicity**: Enforced 1-note-per-batch generation for maximum parsing reliability.
*   [x] **OKA Hardening (v23.0)**: Fixed critical Hub deployment failure caused by signature mismatch and schema drift. Implemented `anchored_hub_id` persistence in `SovereignPlan` and eliminated destructive stub-overwriting logic in the service layer.
*   [x] **Project Hygiene**: Performed comprehensive monorepo cleanup, removing 50+ junk files, build artifacts, and legacy macOS metadata. Centralized development scratch scripts.


---

## 6. Obsidian Database Engine (Notion Clone)
### Pending Epics
*   **[PHASE 1] The Core Database Engine (Structure & Views)**
    *   [x] **Multi-View System**: Implementation of `.base` configuration for Table, Board, and Gallery layouts.
    *   [x] **Dynamic View State**: Save/Load custom filters, sorts, and column ordering in the database config.
    *   [x] **Tabbed Navigation**: UI transition to a multi-tab layout for switching views effortlessly.
    *   [x] **Calendar View**: High-fidelity date-based visualization for database entries.
*   **[PHASE 2] Property Intelligence & Interaction**
    *   [x] **Rich Property Rendering**: Pill-style Select/Multi-Select badges, Date pickers, and Type-specific icons.
    *   [x] **Relation Logic (WikiLinks)**: Native `[[Link]]` parsing with alias support and automatic file creation on-the-fly.
    *   [x] **Database Templates**: Folder-level `_template.md` support for auto-populating new rows.
*   **[PHASE 3] Neural Architecture (Vault Graph)**
    *   [x] **Force-Directed Simulation**: Fluid 60FPS 2D graph engine for vault structure visualization.
    *   [x] **Centrality Scaling**: Automatic node sizing based on inter-note link density.
    *   [x] **Canvas Text Fading**: Intelligent label rendering that responds to zoom-proximity.
    *   [x] **Ghost Node Detection**: Visualizing unresolved links to notes that haven't been created yet.
*   **[PHASE 3] Premium Experience & Aesthetics**
    *   [ ] **Page Chrome (Cover/Icons)**: Aesthetic headers on individual pages with YAML-driven backgrounds/icons.
    *   [ ] **Side-Peek Editor**: Notion-style side panel for editing page content without leaving the database view.
    *   [ ] **Global Sidebar Org**: Refactoring the vault sidebar to group by "Areas" and "Database" types dynamically.

### Completed Epics
*   [x] **Interactive Card-View & Database Gallery UI**
*   [x] **Force-Directed Vault Graph (Visual Knowledge Map)**
*   [x] **Dynamic WikiLink Engine (Auto-Creation & Nav)**
*   [x] **Backend Hardening**: Safe YAML parsing and reordered routing to fix API collisions.
*   [x] **Architect Panel**: Reactive UI for adding rows/columns without browser prompts.
*   [x] **Dynamic Area Support**: Automated database categorization based on the `Areas` database.

---

## 7. Mobile Client (apps/mobile-client)
### Pending Epics
*   [ ] **PWA & Offline Mode**: Local caching of manuscripts for airplane-mode studying.
*   [ ] **Mobile Ingestion**: Native PDF upload pipeline integration.

### Completed Epics
*   [x] **Manuscript Design System**: 100% visual parity with desktop editorial aesthetics.
*   [x] **Academic Database Explorer**: High-fidelity mobile view for OKA databases with mastery metrics and unit navigation.
*   [x] **Binary Data Pipeline**: Hardened PDF and image rendering via native Scriptable bridge.
*   [x] **Socratic Lab Stabilization**: Resolved UI crashes and implemented robust metric reduction logic.
*   [x] **Global Sync Parity**: Real-time connection to sidecar for Vault, Registry, and Mastery data.
*   [x] **Neural Registry**: Mobile status dashboard for AI Agents and system logs.
*   [x] **Mobile Obsidian Parity**: Implemented desktop-grade navigation history, compact properties (YAML) UI, and vault graph visualization.
*   [x] **Bridge Resilience**: Hardened native bridge communication to gracefully handle and repair malformed AI-generated JSON responses.
*   [x] **Infrastructure Hardening**: Migrated to React 19 with robust Error Boundary safeguards.
