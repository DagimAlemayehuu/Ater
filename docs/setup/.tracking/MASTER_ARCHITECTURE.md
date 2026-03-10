# MASTER ARCHITECTURE: LIFE OS

**Document Status:** Evolution Reference - Tracking System Maturity
**Last Updated:** Phase 4 Integration Complete
**Tier:** TIER 3 (The Agency Standard / Offline-First)
**Repo:** https://github.com/DagimAlemayehuu/LifeOs.git

---

## 1. THE PHILOSOPHY

Life OS is a localized Personal Life Operating System designed as a professional intelligence hub. It orchestrates structured data from Notion, unstructured knowledge from Obsidian, and high-level reasoning from Google Gemini into a unified, offline-first experience.

### The Core Quadrants

| Quadrant | Technology | Role |
|---|---|---|
| **The Synapse** | Notion API | Structured data: Goals, Academics, CRM, Semesters, Units. |
| **The Vault** | Obsidian (.md) | Local knowledge: Course notes, project docs, daily journals. |
| **The Architect** | OKA (Gemini) | Deep synthesis: Converts source docs into structured Obsidian notes. |
| **The Strategist** | AI Engine | Proactive advisor: Context-aware guidance based on synced profiles. |

---

## 2. SYSTEM DATA FLOW

```
[Tauri Key Store] -> [React Frontend]
                          |
             (Header Injection: X-Notion-Key, X-Gemini-Key, X-Vault-Path)
                          v
               [Python FastAPI Sidecar]
                          |
        +-----------------+-----------------+-----------------+
        |                 |                 |                 |
 [Notion API]      [Obsidian FS]    [Gemini 1.5 API]    [SQLite DB]
 (Sync Logic)      (Vault Hub)      (Cognitive Jobs)    (Job Queue)
```

- **Persistence**: API keys and environment paths are stored in the Tauri JSON store, never in Python.
- **Asynchronous Processing**: Heavy AI tasks (OKA Generation) run in a background worker queue with persistence via a local SQLite database in the sidecar.

---

## 3. UPDATED MONOREPO STRUCTURE

```
/
├── .tracking/                   <- System state, changelogs, architecture
├── md templates/                <- AI Context source-of-truth (academic_profile.md, etc.)
├── apps/
│   ├── desktop/                 <- Tauri v2 + React/Vite (Admin UI)
│   │   ├── src/
│   │   │   ├── routes/          <- /dashboard, /academics, /oka, /strategist, /settings
│   │   │   ├── lib/             <- sidecarApi.ts, OkaContext.tsx
│   │   │   └── components/      <- UI Primitives, Layout, Shell
│   ├── api/                     <- Python FastAPI Sidecar (Cognitive Engine)
│   │   ├── src/
│   │   │   ├── api/main.py      <- App entry & Notion endpoints
│   │   │   ├── domains/
│   │   │   │   ├── oka/         <- Synthesis logic, workers, gemini service
│   │   │   │   ├── academics/   <- Notion database sync orchestrators
│   │   │   │   └── notion/      <- Core Notion client and helpers
│   │   │   └── core/            <- Shared base logic (obsidian, gemini)
```

---

## 4. MODULE SPECIFICATIONS

### 4.1 Academics Module
- **Sync Engine**: Daily or manual trigger to pull all course-related Notion databases into the sidecar.
- **Context Generator**: Periodically updates `md templates/academic_profile.md` to ensure the AI has up-to-date knowledge of the user's workload.

### 4.2 OKA (Obsidian Knowledge Architect)
- **Ingestion**: Multi-format resource processor (PDF to Text, MD parsing).
- **Background Worker**: Python worker that polls the local SQLite `JobQueue` to handle long-running Gemini generation tasks safely.
- **Deployment logic**: Intelligent pathing that organizes notes by Course -> Unit within the user's Obsidian Vault.

### 4.3 Strategist
- **Multimodal Context**: Combines Notion goal status + Obsidian note content + Academic profile for personalized briefings.

---

## 5. IRON LAWS (IMMUTABLE)

1. **Header-Based Auth**: Keys flow ONLY via HTTP headers from Frontend to Backend.
2. **Local First**: Obsidian operations are purely filesystem-based; no cloud sync for notes.
3. **Pydantic Discipline**: All API responses must be typed and validated via Pydantic on the backend.
4. **Clean Exit**: The Python sidecar process must terminate immediately upon Tauri window closure.
5. **No Placeholders**: UI must use real data or clear loading states; never static mock text.
6. **Aesthetic Consistency**: All new views must follow the premium, monochromatic shadcn-admin aesthetic.
