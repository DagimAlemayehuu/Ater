## Why

The Ater application currently has several monolithic modules and components (e.g., `service.py` is over 4,200 lines, `assets_data.py` embeds 1.9 MB of base64 JS/CSS assets, and React route files like `practice.tsx` are over 90 KB). This monolithic structure causes high CPU/memory consumption, slow startup/file-loading, and a React Hooks rule violation in `UnifiedSandboxViewer.tsx` that crashes the app when opening it.

## What Changes

- **Fix Sandbox Viewer Crash:** Relocate React hooks in `UnifiedSandboxViewer.tsx` above the early return statement to comply with React's Rules of Hooks.
- **Deconstruct backend service.py:** Extract sub-responsibilities (PDF loading, Spaced Repetition (SRS), Quiz/Practice Generation, Session Persistence) from the 4,200-line `service.py` into dedicated modules.
- **Move inline prompt matrices:** Extract the large static `DOMAIN_MATRIX` and `DYNAMIC_DOMAIN_MATRIX` dictionaries out of `agents.py` into a static config file (`domain_matrix.yaml`).
- **Optimize static asset loading:** Replace the 1.9 MB inline base64 asset file (`assets_data.py`) with static file serving, utilizing browser and disk caching.
- **Modularize React route views:** Break down large route monoliths like `practice.tsx` into smaller, reusable React components and hooks.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Impact

- **Affected Code:** `apps/desktop/src/components/obsidian/UnifiedSandboxViewer.tsx`, `apps/desktop/src/routes/practice.tsx`, `apps/api/src/domains/obsidian/assets_data.py` (to be removed), `apps/api/src/domains/ater/service.py`, `apps/api/src/domains/ater/agents.py`, `apps/api/src/api/main.py`.
- **APIs:** PDF.js static endpoints in FastAPI sidecar.
- **Dependencies:** None.
