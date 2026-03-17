# Life OS - Personal Intelligence Operating System

**Tier 3: The Agency Standard (Offline-First)**

## Architecture Overview

Life OS is a local-first desktop application built as a polyglot monorepo. It operates fully without internet connectivity for all core functions, using the network only when explicitly invoking external APIs (Notion, Google Gemini).

## New Features (Refactored)

- **Notion Hub**: Consolidated workspace for managing **Academics** and **Goals**.
- **Obsidian Intelligence**: A high-fidelity reasoning engine and vault explorer.
    - **System Instructions**: Custom-tuned AI behavior permanently docked for precise reasoning.
    - **Vault Explorer**: Hierarchical folder navigation with a professional single-pane Markdown reader.
    - **AI File Uploads**: Real-time document analysis (PDF, Code, Text) powered by Gemini Files API.

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Shell | Tauri v2 (Rust) | Native OS access, filesystem, secure store, sidecar management |
| Frontend | React + Vite + TypeScript | UI layer. Shadcn-admin aesthetic. |
| Styling | Tailwind CSS + shadcn/ui | Component library and design system |
| Backend Sidecar | Python FastAPI (compiled binary via PyInstaller) | AI logic, Gemini API calls, Notion API calls |
| Local State | Tauri-plugin-store | API Keys, Vault Path, User Profiles |
| Knowledge Base | Local Obsidian `.md` files | Unstructured data for RAG |
| Cloud Database | Notion API | Structured data: Tasks, Projects, Goals |
| Monorepo Orchestration | Turborepo v2 | Build pipelines, caching, dependency graph |
| Node Package Manager | pnpm (Strict Mode) | Forbidden: npm, yarn |
| Python Package Manager | uv (Astral) | Forbidden: pip |

## Data Flow

```
[User] <-> [React/Vite (apps/desktop)] <-> [Tauri IPC Bridge] <-> [Python FastAPI Sidecar (apps/api)]
                                                                            |
                                                         +------------------+------------------+
                                                         |                  |                  |
                                                  [Notion API]     [Google Gemini API]  [Local Obsidian FS]
```

## Reads & Writes

- **Frontend (React):** Reads local Tauri store (config). Invokes Python sidecar commands via HTTP (localhost). Renders data from Python responses.
- **Python API (FastAPI Sidecar):** Reads/Writes Notion API. Reads local Obsidian `.md` files. Reads/Writes Google Gemini API. Handles secure file uploads.
- **Tauri Desktop (Rust):** Manages filesystem permissions. Launches Python sidecar process. Bridges IPC between React and system.

## Monorepo Structure

```
/
├── apps/
│   ├── desktop/        # Tauri v2 + React/Vite frontend application
│   └── api/            # Python FastAPI sidecar (uv-managed)
├── docs/
│   ├── architecture/   # System design, ADRs, and structural diagrams
│   ├── prompts/        # System and AI persona prompt masterplans
│   └── setup/          # Initialization protocols and project tracking
├── packages/
│   ├── config-eslint/  # Shared ESLint configuration
│   └── config-typescript/ # Shared tsconfig base
├── resources/
│   ├── reference/      # Markdown archival reference files
│   └── templates/      # Academic/Personal profile templates
├── turbo.json          # Turborepo pipeline configuration
├── pnpm-workspace.yaml # pnpm workspace definition
├── package.json        # Root package.json
└── .env.example        # Environment variable template
```

## Security Mandate

- No API keys are hardcoded. Ever.
- Application boots to Onboarding/Settings screen if configuration is absent.
- All secrets are stored in Tauri's secure local store, fetched by the frontend and passed per-request to the Python sidecar.
