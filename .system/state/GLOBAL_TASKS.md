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
*   [ ] Implement pagination for large Notion database queries (>100 items).
*   [ ] Add image-to-text OCR for OKA ingestion.

### Completed Epics
*   [x] **Hierarchical Notion Mirror**: Rebuilt sync engine to mirror Notion structure into Obsidian folders.
*   [x] **Sync Progress Tracking**: Implemented real-time callback-based progress reporting for long-running sync tasks.
*   [x] **YAML Metadata Injection**: Automated extraction of Notion properties into Obsidian-compatible frontmatter.

---

## 3. Frontend Agent (apps/desktop)
### Pending Epics
*   [ ] Implement Goal editing directly from the Dashboard.
*   [ ] Add dark/light mode toggle persistence.

### Completed Epics
*   [x] **Notion Hub Overhaul**: Replicated Notion's macro-categorization UI.
*   [x] **Deep Page View**: Built native block-based renderer for viewing Notion pages without a browser.
*   [x] **Sync Progress UI**: Integrated real-time progress bars for RAG and Notion syncing in Settings.

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
*   [x] **Logo & Brand Refinement**: Finalized "Zap" branding and strict monochrome aesthetic.
*   [x] **Agent Workforce Registry**: Integrated all specialized units into a unified dashboard.

---
