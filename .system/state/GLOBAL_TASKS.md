# Backlog

Prioritized list of planned features, improvements, and ideas.
Items are ordered by priority within each category.

**Last Updated:** 2026-03-11

---

## 🔴 High Priority

### 1. The Debugger — RAG-Based Problem Solver
- **Route:** `/debugger` (currently placeholder)
- **Scope:** Implement local vector-based search to query the entire Obsidian vault
- **Backend:** Add vector embedding + similarity search to the sidecar (consider FAISS or ChromaDB)
- **Frontend:** Chat interface where AI answers are grounded in vault content
- **Depends on:** Vault Search (below)

### 2. Vault Search — Local Vector Search
- **Scope:** Build a vector index of all `.md` files in the Obsidian vault
- **Backend:** Embedding generation (Gemini or local model), vector store, similarity search endpoint
- **Endpoint:** `GET /api/vault/search?q=...`
- **Used by:** Debugger, Strategist (context injection), Dashboard (search)

### 3. Error Handling Audit
- **Scope:** Review all API endpoints and frontend fetch calls for proper error handling
- **Backend:** Ensure all endpoints return consistent error shapes, proper HTTP status codes
- **Frontend:** Toast notifications for failures, retry logic for transient errors
- **Current gaps:** Many endpoints use bare `try/except Exception` with generic 500s

---

## 🟡 Medium Priority

### 4. Context Injection Tuning
- **Scope:** Improve how OKA uses `academic_profile.md` for note contextualization
- **Details:** Currently the profile is generated but may not be optimally injected into Gemini prompts
- **Impact:** Better quality generated notes, more relevant AI responses

### 5. Dashboard Interactive Charts
- **Scope:** Add visual charts for academic progress over time
- **Details:** Track CGPA, completion rates, study hours (if available)
- **Library:** Consider recharts or visx (already in React ecosystem)

### 6. Testing Infrastructure
- **Backend:** pytest + httpx for FastAPI endpoint tests
- **Frontend:** Vitest + React Testing Library for component tests
- **Coverage:** Start with critical paths: sidecar health, config flow, Notion CRUD

### 7. OKA Chat Improvements
- **Scope:** Better conversation history persistence, multi-document context
- **Details:** Currently each chat session is ephemeral — no history saved between sessions

---

## 🟢 Low Priority

### 8. Custom Persona Export/Import
- **Scope:** Allow users to export personas as JSON files and import from others
- **UI:** Buttons in Settings persona management section

### 9. Notion Database Creator
- **Scope:** Allow creating new Notion databases from the app (not just pages within existing DBs)
- **Useful for:** Users who want to set up their own tracking databases from scratch

### 10. Obsidian Note Editor
- **Scope:** Edit `.md` files directly from the app (currently read-only browser)
- **Consider:** CodeMirror or Monaco for markdown editing with preview

### 11. Multi-Vault Support
- **Scope:** Support switching between multiple Obsidian vaults
- **UI:** Vault selector in settings, per-vault config

### 12. Tauri Build & Distribution
- **Scope:** Production builds — macOS DMG, Windows NSIS installer
- **Details:** Phase 5.0 work, needs code signing, auto-update setup

---

## 💡 Ideas (Unscoped)

- **Mobile companion** — Progressive web app for quick goal check-ins
- **Calendar integration** — Google Calendar sync for time blocking
- **Pomodoro timer** — Built-in focus timer tied to goal tracking
- **Daily briefing** — Auto-generated morning summary from Notion + Obsidian
- **Spaced repetition** — Anki-style review system for OKA-generated notes
- **Plugin system** — Allow third-party extensions to the sidecar
