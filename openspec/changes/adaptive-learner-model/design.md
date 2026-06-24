## Context

Ater requires a persistent Adaptive Learner Model to track the user's historical performance, misconceptions, and confidence calibration over time. Currently, learning telemetry is stored on a per-session basis, preventing cross-session adaptive planning. This design introduces the `learner_profile_stats` SQLite schema, a confidence calibration coefficient engine, an aggregate misconception tracker, and an optimal next-lesson recommendation engine that schedules notes based on FSRS retrievability and prerequisite constraints.

All state transitions are saved locally to `ater_queue.db` and verified headlessly.

## Goals / Non-Goals

**Goals:**
- Initialize the `learner_profile_stats` table in `ater_queue.db` to persist topic aggregates.
- Implement a `LearnerModelManager` service in `apps/api/src/domains/ater/learner_model_service.py` to calculate topic profiles and statistics.
- Implement a deterministic confidence calibration score tracking overconfidence (confidently incorrect) vs. underconfidence (unsure but correct).
- Implement an aggregate misconception analyzer to identify and bubble up frequent misconceptions by topic.
- Implement a next-lesson recommendation sorting function utilizing FSRS retrievability metrics, weakness telemetry, and prerequisite completion constraints.
- Register FastAPI routes to fetch learner profiles and next-lesson recommendations under `ater.py`.
- Run all verification tests headlessly via pytest.

**Non-Goals:**
- Do not build complex user dashboard graphs or React chart components in this phase; focus on the data model and recommendation API.
- Do not sync learner profiles to Supabase in this phase; state remains strictly local to `ater_queue.db`.
- Do not require live network or external AI.

## Decisions

### 1. Database Schema
We will initialize the following table in `ater_queue.db` via `apps/api/src/domains/ater/srs.py` or a dedicated migration helper:
- `learner_profile_stats`:
  - `topic`: TEXT PRIMARY KEY
  - `notes_total`: INTEGER
  - `notes_completed`: INTEGER
  - `accuracy_rate`: REAL
  - `avg_retrievability`: REAL
  - `overconfidence_count`: INTEGER  # Incorrect answers wagered with "high" confidence
  - `calibration_index`: REAL       # Calculated confidence-correctness offset
  - `last_studied_at`: TIMESTAMP

### 2. Confidence Calibration Scoring
To evaluate how well the user's confidence wagers align with actual performance, we calculate a Calibration Index:
$$\text{Calibration Index} = \frac{1}{N} \sum_{i=1}^N (w_i - c_i)$$
Where:
- $w_i \in [0, 1]$: Normalized wager confidence (e.g. "high" = 1.0, "low" = 0.2).
- $c_i \in \{0, 1\}$: Correctness result (1 for correct, 0 for incorrect).
- **Positive Index (> 0.2)**: Overconfident (wagers high confidence on incorrect answers).
- **Negative Index (< -0.2)**: Underconfident (wagers low confidence but consistently gets answers correct).
- **Calibrated Index ([-0.2, 0.2])**: Well-calibrated wagers.

### 3. optimal Next-Lesson Recommendation Engine
The system will recommend the next optimal notes to study by sorting notes using the following scoring heuristic:
$$\text{Recommend Score} = W_R \cdot (1.0 - R) + W_W \cdot S_W - W_P \cdot P$$
Where:
- $R \in [0, 1]$: FSRS retrievability of the note (lower retrievability increases priority).
- $S_W \ge 0$: Note weakness score based on recent session telemetry.
- $P \in \{0, 1\}$: Prerequisite penalty (1 if note's prerequisites are not completed, 0 if they are).
- Weights: $W_R = 50.0$, $W_W = 10.0$, $W_P = 100.0$ (ensures prerequisite compliance).

Uncompleted or review-due notes are sorted descending by this score.

### 4. Pydantic API Models
- `LearnerTopicProfile`:
  - `topic`: str
  - `notes_completed_fraction`: float  # notes_completed / notes_total
  - `accuracy_rate`: float
  - `calibration_status`: str  # "overconfident", "underconfident", "calibrated"
  - `common_misconceptions`: list[str]
- `LessonRecommendation`:
  - `note_path`: str
  - `title`: str
  - `recommendation_score`: float
  - `reason`: str  # e.g., "Low FSRS retrievability" or "Unresolved misconception"

## Risks / Trade-offs

- **[Risk]**: The user has zero history, resulting in division-by-zero errors in statistics.  
  **Mitigation**: The stats calculations default to `accuracy_rate = 1.0` and `calibration_index = 0.0` when total answer count is zero.

- **[Risk]**: Notes have circular prerequisite dependencies, blocking progression.  
  **Mitigation**: The planner validation blocks circular dependencies, and the scheduler falls back to ignoring prerequisite penalties if all remaining notes in the curriculum are blocked.
