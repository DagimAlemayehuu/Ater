# MASTER ARCHITECTURE: ATER

**Document Status:** Evolution Reference - v1.1 Refactored
**Last Updated:** Phase 4 Refactor Complete
**Tier:** TIER 3 (The Agency Standard / Offline-First)
**Repo:** https://github.com/DagimAlemayehuu/Ater.git

---

## 1. THE PHILOSOPHY

Ater is a localized Personal Life Operating System designed as a professional intelligence hub. It orchestrates structured data from Notion, unstructured knowledge from Obsidian, and high-level reasoning from Google Gemini into a unified, offline-first experience.

### The Core Quadrants

| Quadrant | Technology | Role |
|---|---|---|
| **The Synapse** | Notion API | Structured data: Consolidated Academics & Goals. |
| **The Vault** | Obsidian (.md) | Local knowledge: Course notes, project docs, daily journals. |
| **The Intelligence** | Gemini 2.5 Flash | Real-time reasoning: Instruction-driven chat with document analysis. |
| **The Explorer** | React / Prose | Knowledge visualization: High-fidelity, hierarchical vault reader. |

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
 [Notion API]      [Obsidian FS]    [Gemini 2.5 API]    [Files API]
 (Sync Logic)      (Vault Hub)      (Cognitive Chat)    (File Context)
```

- **Persistence**: API keys and environment paths are stored in the Tauri JSON store, never in Python.
- **Asynchronous Processing**: File uploads to Gemini are handled with polling cycles to ensure document availability before reasoning begins.

---

## 3. MONOREPO STRUCTURE

```
/
├── apps/
│   ├── desktop/                 <- Tauri v2 + React/Vite (UI)
│   │   ├── src/
│   │   │   ├── routes/          <- /dashboard, /notion, /obsidian, /settings
│   │   │   └── components/      <- UI Primitives, Layout, Shell
│   ├── api/                     <- Python FastAPI Sidecar (API)
│   │   ├── src/
│   │   │   ├── api/main.py      <- App entry & Notion/AI endpoints
│   │   │   ├── domains/
│   │   │   │   ├── academics/   <- Notion sync orchestrators
│   │   │   │   ├── ai/          <- Strategist agent & Gemini logic
│   │   │   │   └── notion/      <- Core Notion client and helpers
│   │   │   └── core/            <- Shared base logic
```

---

## 4. MODULE SPECIFICATIONS

### 4.1 Notion Hub (The Synapse)
- **Unified Sync**: Pulls courses, study plans, and goals into a single tabbed view.
- **Context Generator**: Periodically updates grounding context for AI reasoning.

### 4.2 Obsidian Hub (The Vault & Intelligence)
- **Vault Explorer**: Recursive file tree builder that visualizes local directory structures.
- **Markdown Reader**: Single-pane reader with `prose` typography and independent scroll zones.
- **Intelligence View**: Persistent system instructions paired with a multimodal chat interface.

### 4.3 Strategist (AI Engine)
- **Dynamic Reasoning**: Uses custom system instructions passed per-session.
- **Multimodal Context**: Integrates uploaded files (PDF, Code, Text) directly into the reasoning chain.

---

## 5. IRON LAWS (IMMUTABLE)

1. **Header-Based Auth**: Keys flow ONLY via HTTP headers from Frontend to Backend.
2. **Local First**: Obsidian operations are purely filesystem-based.
3. **Pydantic Discipline**: All API responses must be typed and validated.
4. **Clean Exit**: The Python sidecar process must terminate with the UI.
5. **Instruction Supremacy**: AI responses must strictly adhere to the user-defined System Instruction.
