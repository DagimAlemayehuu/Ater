## Why

Students need a time-limited, highly optimized study flow to prepare for exams efficiently when under severe time constraints. Standard tutor sessions have static progress and detailed explanations, which are unsuitable for rapid retrieval practice and last-minute "mistake repair" and "rescue modes" where every minute counts.

## What Changes

- **Cram Session Manager**: A backend service that plans and manages the state of a time-limited cram session (tracking time remaining, active phase, and completed items).
- **Weak Spot Prioritization Engine**: A deterministic scoring algorithm to rank notes and concepts by weakness, combining diagnostic results, review history, error recency, confidence mismatches, and high-yield weights.
- **Adaptive Time Budgeter**: A scheduler that dynamically structures the session phases (Orientation, High-Yield, Active Recall, Mistake Repair, Final Review) and scales them when the budget is compressed or when time runs thin ("rescue mode").
- **High-Yield Cram Lesson Variant**: The HTML compiler contract for `lessons/<Atomic_Note>.cram.html` focusing on rapid recall, traps, misconceptions, worked examples, and checklists, while avoiding passive reading.
- **FastAPI Cram Endpoints**: Endpoints in `ater.py` to start, status, and progress a cram session.

## Capabilities

### New Capabilities
- `cram-mode`: Manages time-limited cram plans, phase budgeting, weakness-based note prioritization, rescue mode activation, and rapid active recall practice.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Adds `cram_service.py` to calculate weakness scores, plan phase allocations, track remaining time, and route questions. Adds FastAPI endpoints under `ater.py`.
- **Tauri / Desktop Client**: Exposes client wrappers in `sidecarApi.ts` to coordinate cram sessions.
- **Obsidian Vault / Database**: Compiled cram variants are saved to `lessons/` subdirectories. Session telemetry is queried from the local `ater_queue.db`.
- **Tests**: Adds `apps/api/tests/test_cram_mode.py` verifying prioritization scores, adaptive phase calculations, rescue mode triggers, and question mixes.
