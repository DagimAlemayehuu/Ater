# Project Profile: Ater

## Repository
- **Path**: `/Users/dabodestroyer/code/Antigravity/Ater`
- **Type**: Monorepo managed via `pnpm` workspaces and `turbo`

## Stack and Technologies

### 1. Desktop Client (`apps/desktop`)
- **Framework**: Tauri v2 (Rust backend)
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS v3, Zustand
- **Monaco Editor / CodeMirror**: CodeMirror 6 (Markdown), Monaco Editor (Practice mode)
- **Graph View**: D3 / React Force Graph 2D

### 2. Sidecar API (`apps/api`)
- **Framework**: FastAPI (Python 3.11)
- **Package Manager**: `uv`
- **ML / NLP**: ONNX Runtime (CPU-bound, local embeddings), LangChain
- **SRS Algorithm**: Free Spaced Repetition Scheduler (FSRS)

### 3. Admin Dashboard (`apps/admin`)
- **Framework**: Next.js 16 (React 19), Tailwind CSS v4

### 4. Landing Page (`apps/landing-page`)
- **Framework**: Next.js 16 (React 19), Tailwind CSS v4

### 5. Database Layer
- **Local**: SQLite (`ater.db`)
- **Remote**: Supabase (PostgreSQL with RLS, Auth, DRM Lockout, Hardware Blacklist)

## Project Layout
- `apps/admin/`: Admin Next.js app
- `apps/api/`: Python FastAPI sidecar
- `apps/desktop/`: Desktop client (Tauri + React/Vite)
- `apps/landing-page/`: Marketing Landing Page
- `docs/`: System documentation and ADRs
- `openspec/`: OpenSpec design, specs, and changes
- `Vault_Test/`: Mock Obsidian Vault for developer testing
