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

## 5. Orchestrator & Specialist Workforce
### Pending Epics
*   [ ] **Chronos Integration**: Connect Google Calendar and Apple Calendar for unified scheduling.
*   [ ] **Cross-Agent Collaboration**: Allow agents to hand off sub-tasks (e.g., Scholar sends notes to Scribe).

### Completed Epics
*   [x] **Orchestrator Backend State**: Real-time status tracking (prompt, plan, active agents, logs).
*   [x] **Specialist Agent Logic**: 8 functional agents (Scholar, Wealth, Gym, etc.) with mapped vault paths.
*   [x] **Specialist Autonomy**: Agents given full CRUD power across local Obsidian vault and Notion APIs.
*   [x] **Data-Driven Dashboards**: All agent UI pages (Chronos, Wealth, Scholar, etc.) fetch live status from FastAPI.
*   [x] **Dynamic Specialist Services**: Integrated `WealthService`, `GymService`, and `ChronosService` for live data tracking.
*   [x] **Logo & Brand Refinement**: Finalized "Zap" branding and strict monochrome aesthetic.
*   [x] **Agent Workforce Registry**: Integrated all specialized units into a unified dashboard.

---

## 6. Obsidian Database Engine (Notion Clone)
### Pending Epics
*   **[PHASE 1] The Core Database Engine (Structure & Views)**
    *   [ ] **Multi-View System**: Implementation of `.base` configuration for Table, Board, and Gallery layouts.
    *   [ ] **Dynamic View State**: Save/Load custom filters, sorts, and column ordering in the database config.
    *   [ ] **Tabbed Navigation**: UI transition to a multi-tab layout for switching views effortlessly.
*   **[PHASE 2] Property Intelligence & Interaction**
    *   [ ] **Rich Property Rendering**: Pill-style Select/Multi-Select badges, Date pickers, and Type-specific icons.
    *   [ ] **Relation Logic**: Linking notes across database folders using wikilinks and auto-discovery.
    *   [ ] **Database Templates**: Folder-level `_template.md` support for auto-populating new rows.
*   **[PHASE 3] Premium Experience & Aesthetics**
    *   [ ] **Page Chrome (Cover/Icons)**: Aesthetic headers on individual pages with YAML-driven backgrounds/icons.
    *   [ ] **Side-Peek Editor**: Notion-style side panel for editing page content without leaving the database view.
    *   [ ] **Global Sidebar Org**: Refactoring the vault sidebar to group by "Areas" and "Database" types dynamically.

### Completed Epics
*   [x] **Backend Hardening**: Safe YAML parsing and reordered routing to fix API collisions.
*   [x] **Architect Panel**: Reactive UI for adding rows/columns without browser prompts.
*   [x] **Dynamic Area Support**: Automated database categorization based on the `Areas` database.
