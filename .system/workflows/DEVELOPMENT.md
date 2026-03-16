# Development Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm install -g pnpm` |
| Python | 3.11+ | [python.org](https://python.org) |
| uv | Latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Rust | Latest | [rustup.rs](https://rustup.rs) |
| Tauri CLI | v2 | Installed via project `devDependencies` |

## First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/DagimAlemayehuu/LifeOs.git
cd LifeOs

# 2. Install Node dependencies
pnpm install

# 3. Set up Python backend
cd apps/api
uv venv
uv pip install -e .
cd ../..
```

## Running the App

### Full Stack (Recommended)

```bash
# Starts both Python sidecar + Tauri/React concurrently
pnpm dev:all
```

### Individual Services

```bash
# Python sidecar only (hot-reload on port 8765)
pnpm sidecar:dev

# Tauri + React frontend only (requires sidecar running)
cd apps/desktop
pnpm tauri dev
```

### React-only (no Tauri shell — for rapid UI development)

```bash
cd apps/desktop
pnpm dev
# Opens at http://localhost:1420
# Note: Tauri APIs (store, dialog, shell) won't work in browser mode
```

## Common Commands

| Command | Location | Purpose |
|---|---|---|
| `pnpm dev:all` | Root | Start everything |
| `pnpm sidecar:dev` | Root | Start Python sidecar only |
| `pnpm build` | Root | Turborepo build all packages |
| `pnpm lint` | Root | ESLint across all packages |
| `pnpm typecheck` | Root | TypeScript type checking |
| `cd apps/desktop && pnpm tauri build` | Desktop | Production build (DMG/exe) |

## Project Structure Quick Reference

```
LifeOs/
├── apps/desktop/src/         # Frontend React code
│   ├── routes/               # Page components (one per route)
│   ├── components/           # UI components
│   ├── lib/                  # Core modules (API client, contexts)
│   └── templates/            # Default profile/prompt markdown
├── apps/api/src/             # Backend Python code
│   ├── api/main.py           # FastAPI entry point
│   └── domains/              # Business logic modules
├── docs/                     # You are here
├── resources/                # Templates and reference files
└── packages/                 # Shared configs (ESLint, TypeScript)
```

## Environment

No `.env` files are used. All configuration is managed through the Tauri Plugin Store at runtime. The onboarding flow handles initial setup (API keys, vault path).

## Debugging

### Check sidecar health
```bash
curl http://127.0.0.1:8765/api/health
# Expected: {"status":"ok","version":"0.1.0"}
```

### View sidecar logs
The Python sidecar logs to stdout with `[Life OS Sidecar]` and `[Strategist]` prefixes. Check the terminal running `pnpm sidecar:dev`.

### React DevTools
When running via `pnpm dev` (browser mode), standard React DevTools work. When running via Tauri, use the built-in WebView DevTools (right-click → Inspect).
