## Why

Currently, Ater's ingestion pipeline (generating atomic notes) and the chat companion (Oracle Guide) exist as separate, disconnected workflows. This proposal integrates them into a unified, resizable split-pane interactive study console, enabling dynamic real-time note updates, on-demand web-sourced curriculum planning, and active diagnostic feedback on user mistakes.

## What Changes

- **Integrated Split Pane**: Replace the static chat interface with a resizable split-pane layout consisting of the Oracle Chat Companion (left) and the Note Canvas (right).
- **Draggable Divider & Focus Snapping**: A draggable vertical handle allows flexible resizing of the split. Snapping past 80% collapses a pane into a minimal edge tab with an ambient notification pulse.
- **Dynamic Curriculum Planner**: An interactive planning card in the chat that searches the web, proposes a multi-note curriculum, and requires explicit user confirmation before writing files.
- **Progressive Note Ingestion**: Deploys note files to the local Obsidian vault asynchronously and displays them immediately in the Note Canvas as they are written.
- **Mistake Diagnostic Loop**: Direct, step-by-step diagnostic feedback on incorrect quiz answers that appends a "My Common Misconceptions" section to the active note dynamically.

## Capabilities

### New Capabilities
- `interactive-study-console`: A unified workspace integrating chat dialog, web-sourced curriculum generation, resizable split layout, progressive note rendering, and dynamic active recall diagnostics.

### Modified Capabilities

## Impact

- **Frontend Client (`apps/desktop`)**: UI layouts, routing logic, drag-and-resize panels, and dynamic state styling.
- **FastAPI Sidecar (`apps/api`)**: Search and planning endpoints, asynchronous background atomic note generation pipelines, and diagnostic prompt wrappers.
- **Tauri IPC (`src-tauri`)**: IPC commands to manage and watch newly generated notes in real-time.
