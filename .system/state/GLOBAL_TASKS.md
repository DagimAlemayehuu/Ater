# Backlog

Prioritized list of planned features, improvements, and ideas.
Items are ordered by priority within each category.

**Last Updated:** 2026-03-11

---

## 🔴 High Priority

### 1. Agent Logic Implementation — Phase 6.1
- **Scope:** Build out the specialized Python modules for the idling agents.
- **Targets:** 
    - [x] **Coach:** Habit tracking, motivation, and goal calibration.
    - [x] **Financer:** Expense analysis and budgeting (Notion-backed).
    - [x] **Scout:** Web-search enabled research and link discovery.
    - [x] **Scribe:** Voice/log transcription and formatting.
    - [x] **Architect:** Technical documentation and system meta-analysis.
    - [x] **Auditor:** Productivity audit and goal compliance.
- **Backend:** Create `src/domains/[agent]` modules with specific toolsets.

### 2. Automation Worker Implementation — Phase 6.1
- **Scope:** Build the background job orchestration for the idle system tasks.
- **Targets:**
    - [x] **Daily Briefing:** Aggregate Notion/Obsidian data into a morning summary.
    - [x] **Notion Cleanup:** Archive old tasks and consolidate tags.
    - [x] **Habit Streak:** Daily validation of habit completion.
    - [x] **Expense Categorizer:** Auto-tagging transactions via AI.
    - [x] **Academic Fetcher:** Sync external course data/grades.
- **Backend:** Implement the `src/domains/automations/workers` system.

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
