## Why

To transition Ater from a static document viewer into an active learning environment, the system requires a dynamic tutoring runtime. Currently, there is no structured state machine to manage the active tutor loop: presenting material, prompting for a confidence wager, evaluating user answers, diagnosing specific mistakes, logging misconceptions, and coordinating navigation between the HTML lesson iframe and the desktop client.

## What Changes

- **Tutor Session Manager**: A backend state machine that tracks the progress of an active learning session (current note, current page, response history, score, and accumulated misconceptions).
- **Confidence Wager System**: Integrates a confidence rating (e.g. scale of 1-5 or low/medium/high) before answer submission, enabling calibration tracking.
- **Mistake Diagnosis & Hint Generator**: Evaluates incorrect answers to determine the type of error (e.g. recall failure, calculation error, conceptual misconception) and generates targeted hints or remediation.
- **Misconception Capture Logger**: Automatically records identified misconceptions to a session log, allowing future study plans to address these specific gaps.
- **Tutor Event System**: Standardizes event communication between the HTML lesson (injected scripts) and the Tauri host using `postMessage` protocol:
  - `ANSWER_SUBMITTED`
  - `ARTIFACT_UPDATED`
  - `MISCONCEPTION_FOUND`
  - `NEXT_NOTE`
  - `SESSION_COMPLETED`

## Capabilities

### New Capabilities
- `tutor-runtime`: Manages active tutor sessions, confidence wagering, mistake diagnosis, misconception tracking, and runtime event communication.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Adds `tutor_service.py` and router endpoints to handle session initialization, answer evaluation, mistake diagnosis, and logging.
- **Tauri / Desktop Client**: New frontend container components and event listeners to host the compiled HTML lessons, handle postMessage events, render the wager prompt, and manage the overall active session state.
- **Obsidian Vault / Database**: Saves session state history and telemetry in the local `ater.db` SQLite database.
- **Tests**: Headless backend unit and integration tests verifying session state transitions, diagnostic logic, and event structure.
