## Why

Currently, Ater tracks local lesson reviews and wagers on a single-session basis (stored in SQLite `tutor_sessions` and `user_misconceptions`). However, there is no unified profile representing the user's long-term learning history. To offer a truly optimized and adaptive learning experience, the system needs to persist and update an "Adaptive Learner Model" that aggregates historical telemetry (FSRS retention, weak spots, misconceptions, and confidence calibration) to recommend the best next lessons.

## What Changes

- **SQLite Learner Profile Tables**: Initialize a new SQLite table `learner_profile_stats` to track topic-level and overall aggregates for accuracy, retrievability, and calibration.
- **Learner Model Service**: A backend service that calculates aggregate metrics across notes, chapters, and hubs.
- **Confidence Calibration Engine**: An algorithm that tracks and calculates calibration coefficients (e.g. Brier Score or calibration error representing overconfidence vs. underconfidence).
- **Misconception Aggregator**: Summarizes and bubbles up persistent user misconceptions from `user_misconceptions` records to topic level.
- **Next-Lesson Recommendation Engine**: Suggests the optimal next Atomic Notes to study, utilizing FSRS retrievability values, dependency requirements, and priority weakness scores.
- **FastAPI Endpoints**: Register routes to retrieve the learner profile overview and get recommended next study topics.

## Capabilities

### New Capabilities
- `adaptive-learner-model`: Manages persistent topic-level profiles, confidence calibration calculations, aggregate misconception tracking, and next-lesson recommendation scheduling.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Adds `learner_model_service.py` to calculate profile statistics and handle SQLite transactions. Adds endpoints under `ater.py`.
- **Tauri / Desktop Client**: Exposes fetch wrappers in `sidecarApi.ts` to retrieve profile cards and next study lists.
- **Obsidian Vault / Database**: Saves profile records locally in `ater_queue.db`.
- **Tests**: Adds unit and integration tests in `apps/api/tests/test_learner_model.py` verifying metric calculation, calibration error scores, and recommendation sort ordering.
