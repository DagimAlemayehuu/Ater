# System Overview

## Architecture

Life OS is a **polyglot monorepo** with three runtime layers communicating over localhost HTTP:

```
[User] <-> [React/Vite (apps/desktop)] <-> [Tauri IPC Bridge] <-> [Python FastAPI Sidecar (apps/api)]
                                                                        |
                                                   +-------------------+-------------------+
                                                   |                   |                   |
                                            [Notion API]      [Google Gemini API]  [Local Obsidian FS]
                                            (Cloud DB)         (AI Engine)          (Local .md files)
                                                                        |
                                                                 [Local SQLite]
                                                                 (OKA Job Queue)
```

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Shell | Tauri v2 (Rust) | Native OS access, filesystem, secure store, sidecar management |
| Frontend | React 19 + Vite 7 + TypeScript 5.9 | UI layer with shadcn-admin aesthetic |
| Styling | Tailwind CSS 3 + shadcn/ui (30 components) | Component library and design system |
| Routing | react-router-dom v7 | Client-side routing (BrowserRouter) |
| State | Zustand, React Context, Tauri Plugin Store | Local state, global config, persistent secrets |
| Backend Sidecar | Python 3.11+ FastAPI + Uvicorn | AI logic, Gemini/Notion/Obsidian integration |
| AI SDK | google-genai, google-generativeai | Gemini API (brainstorm, OKA synthesis) |
| Notion Client | httpx (async) | All Notion API operations |
| Local DB | SQLAlchemy + aiosqlite | OKA job queue + settings persistence |
| Knowledge Base | Local Obsidian `.md` files | Unstructured data for RAG |
| Monorepo | Turborepo v2 | Build pipelines, caching, dependency graph |
| Node PM | pnpm (Strict Mode) | **Forbidden:** npm, yarn |
| Python PM | uv (Astral) | **Forbidden:** pip |

## Security Model

### Secret Flow

1. User enters API keys in **Onboarding** or **Settings** UI
2. Keys saved to **Tauri Plugin Store** (`life-os-config.json`) — encrypted, local-only
3. React reads keys from store, injects as **HTTP headers** per-request:
   - `X-Notion-Key` — Notion integration token
   - `X-Gemini-Key` — Google Gemini API key
   - `X-Gemini-Model` — Model selection (default: `gemini-2.5-flash`)
   - `X-Vault-Path` — Absolute path to local Obsidian vault
4. Python sidecar extracts via `AppSecrets` FastAPI dependency (`apps/api/src/api/deps.py`)

### Iron Laws

1. **No hardcoded secrets.** Ever. Keys flow ONLY via HTTP headers.
2. **Local first.** Obsidian operations are purely filesystem-based; no cloud sync for notes.
3. **Pydantic discipline.** All API responses typed and validated via Pydantic.
4. **Clean exit.** Python sidecar terminates immediately on Tauri window close.
5. **No placeholders.** UI uses real data or clear loading states; never static mock text.
6. **Premium aesthetic.** All views follow the monochromatic shadcn-admin design language.

## Boot Sequence

```
App starts
  └─> SidecarGate: Poll GET /api/health (retry every 2s)
       └─> ConfigGate: Check Tauri Store for keys
            ├─> Keys missing → Redirect to /onboarding
            └─> Keys present → Redirect to /dashboard
```

Implemented in `apps/desktop/src/App.tsx` via `SidecarGate` and `ConfigGate` wrapper components.

## Monorepo Structure

```
LifeOs/
├── apps/
│   ├── desktop/          # Tauri v2 + React/Vite frontend (@life-os/desktop)
│   │   ├── src/          # React source code
│   │   │   ├── routes/       # Page components (10 routes)
│   │   │   ├── components/   # UI components (layout, shadcn/ui)
│   │   │   ├── lib/          # Core modules (sidecarApi, ConfigContext, OkaContext)
│   │   │   ├── context/      # Providers (theme, layout, search, font, direction)
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── config/       # Font configuration
│   │   │   └── templates/    # Default profile/prompt markdown files
│   │   └── src-tauri/    # Rust/Tauri configuration
│   └── api/              # Python FastAPI sidecar (life-os-api)
│       └── src/
│           ├── api/          # FastAPI app entry (main.py) + dependency injection (deps.py)
│           ├── core/         # (empty — reserved for shared utils)
│           └── domains/      # Business logic modules
│               ├── ai/           # Strategist agent (Gemini + tools)
│               ├── notion/       # Notion API client (httpx)
│               ├── obsidian/     # Local vault scanner (pathlib)
│               ├── oka/          # Knowledge Architect subsystem
│               └── academics/    # Academic dashboard service
├── docs/             # THIS FOLDER — comprehensive documentation
├── packages/
│   ├── config-eslint/    # Shared ESLint configuration
│   └── config-typescript/# Shared tsconfig base
├── resources/
│   ├── prompts/          # Custom prompt storage (user-generated)
│   ├── reference/        # Example profiles and prompts (filled data)
│   └── templates/        # Profile/prompt templates (blank + filled)
├── turbo.json            # Turborepo pipeline configuration
├── pnpm-workspace.yaml   # pnpm workspace (apps/*, packages/*)
└── package.json          # Root scripts: dev:all, sidecar:dev, build, etc.
```
