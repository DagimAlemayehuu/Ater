## Why

The Ater learning runtime has a `LearnerModelManager`, `AnalyticsEngine`, `TutorService`, and `SRSEngine` that each collect rich signals about the learner's performance — but these signals are siloed: the profile endpoint creates a new DB connection on every request rather than reading the same `srs_cards`, `tutor_sessions`, and `user_misconceptions` tables that the tutor and SRS already write to. The Socratic Tutor Oracle (`assistant.py`) has no tool to inject calibration state or recommendations into its context, and the desktop has no surface that shows the user their misconception history, confidence calibration, or what to study next.

This change closes those gaps by unifying the DB connection, exposing the three remaining API surfaces (misconception recording, Oracle tutor tool, desktop profile/recommendation UI), and hardening the scoring formula with a wager-confidence signal not yet consumed by the recommendation ranker.

## What Changes

- **DB unification:** `LearnerModelManager` opens a connection to the shared `ater_queue.db` (same file used by `TutorService` and `SRSEngine`) via the `AppSecrets`-resolved path, removing the per-request instantiation and the schema drift between `srs_cards` schema in `srs.py` vs. `learner_model_service.py`.
- **New API endpoint:** `POST /api/ater/learner/misconception` — records a misconception to `user_misconceptions` after a wager mismatch, callable from the practice flow without going through the tutor session.
- **Oracle tool:** New `get_learner_context` LangChain structured tool on `AterAssistant` that calls `update_profile` + `recommend_next_lessons` and injects the result as tutor context before generating a Socratic question.
- **Recommendation scoring fix:** The `recommend_next_lessons` heuristic currently ignores the `calibration_index` and `overconfidence_count` from `learner_profile_stats`; these should boost the priority score of notes where the learner wagered high but got wrong (overconfidence penalty).
- **Desktop UI surface:** A new `LearnerInsightPanel` component on the `practice.tsx` route (or as a collapsible sidebar on the Ater agent tab) that renders: calibration badge (overconfident / calibrated / underconfident), top 3 misconceptions, and up-to-5 recommended next notes with reason chips.
- **Schema migration guard:** Add `ALTER TABLE … ADD COLUMN IF NOT EXISTS` guards on `srs_cards` for any new columns; add missing `hub_path` column guard on `tutor_sessions` that the `LearnerModelManager` queries but `SRSEngine._init_db` does not create.

## Capabilities

### New Capabilities
- `learner-profile-api`: GET endpoint returning calibration status, accuracy, misconceptions, and completion fraction for a topic.
- `learner-recommendations-api`: GET endpoint returning ranked next-lesson list for a topic with scored reasons.
- `learner-misconception-api`: POST endpoint to record a misconception event from any code path.
- `oracle-learner-tool`: LangChain structured tool in `AterAssistant` that retrieves learner context and injects it into Socratic Tutor turns.
- `learner-insight-panel`: Desktop React component surfacing calibration, misconceptions, and next-lesson recommendations.

### Modified Capabilities
- `fsrs-srs-engine`: Add `hub_path` column migration guard to `tutor_sessions` in `SRSEngine._init_db` so it matches the schema queried by `LearnerModelManager.update_profile`.
- `learner-model-scoring`: Extend `recommend_next_lessons` score formula to include calibration penalty (`overconfidence_count` weight) alongside existing R, Sw, P components.

## Impact

- **Backend:** `apps/api/src/domains/ater/learner_model_service.py`, `srs.py`, `assistant.py`, `apps/api/src/api/routers/ater.py`
- **Frontend:** `apps/desktop/src/routes/practice.tsx` or `apps/desktop/src/routes/agents.tsx`, new `LearnerInsightPanel.tsx` component, `apps/desktop/src/lib/sidecarApi.ts`
- **DB:** No new tables; column migration guards added to `srs_cards` and `tutor_sessions`
- **Tests:** `apps/api/tests/test_assistant.py` for Oracle tool; new `test_learner_model.py` for profile/recommendation/misconception endpoints
