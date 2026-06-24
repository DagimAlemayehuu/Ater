## 1. Database Schema & Initialization

- [ ] 1.1 Implement database schema updates to initialize the `learner_profile_stats` table in `ater_queue.db`.

## 2. Learner Model Service

- [ ] 2.1 Implement Pydantic models `LearnerTopicProfile` and `LessonRecommendation` in `apps/api/src/domains/ater/learner_model_service.py`.
- [ ] 2.2 Implement profile aggregation in `LearnerModelManager` to calculate topic-level totals, completion rates, and average accuracies.

## 3. Confidence Calibration & Misconceptions

- [ ] 3.1 Implement the calibration index calculation algorithm tracking overconfidence and underconfidence.
- [ ] 3.2 Implement aggregate misconception query services grouping logged user errors by topic.

## 4. Next-Lesson Recommendation Engine

- [ ] 4.1 Implement the next-lesson sorting function using FSRS retrievability, note weakness score, and prerequisite completion constraints.

## 5. FastAPI Endpoints & Client Wrappers

- [ ] 5.1 Register endpoints in `apps/api/src/api/routers/ater.py`: `/api/ater/learner/profile` and `/api/ater/learner/recommendations`.
- [ ] 5.2 Expose client fetch wrappers in `apps/desktop/src/lib/sidecarApi.ts`.

## 6. Headless Verification Tests

- [ ] 6.1 Add unit tests verifying database schema setup and profile stats persistence in `apps/api/tests/test_learner_model.py`.
- [ ] 6.2 Add unit tests verifying calibration error calculations and overconfidence detections.
- [ ] 6.3 Add unit tests verifying next-lesson sorting priorities and prerequisite blocking rules.
- [ ] 6.4 Run `openspec validate adaptive-learner-model` and verify all tests pass headlessly using `pytest`.
