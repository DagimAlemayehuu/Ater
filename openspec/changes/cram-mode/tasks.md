## 1. Cram Session Data Models

- [ ] 1.1 Implement Pydantic models for `CramPriorityItem` and `CramSessionPlan` in `apps/api/src/domains/ater/cram_service.py`.
- [ ] 1.2 Implement the `CramPhase` Enum (`orientation`, `high_yield`, `active_recall`, `mistake_repair`, `final_review`).

## 2. Weakness Prioritization Scoring

- [ ] 2.1 Implement the deterministic `calculate_weakness_score` helper in `cram_service.py` using diagnostic results, incorrect counts, confidence wagers, FSRS, yield weights, and recency decay.
- [ ] 2.2 Implement fallback logic when telemetry or FSRS is missing, including routing to a 3-question diagnostic quiz or relying on planner high-yield weights.

## 3. Adaptive Time Scheduler & Rescue Mode

- [ ] 3.1 Implement phase duration calculations supporting budgets of 15, 30, 45, 60, 90 minutes.
- [ ] 3.2 Implement compression rules for short budgets and performance adaptivity to reduce explanation breadth if diagnostic score is low.
- [ ] 3.3 Implement the `rescue_mode_active` state trigger that activates when remaining time falls below 15% of the total budget or under 5 minutes.

## 4. Compiler Cram Variant & Question Mix

- [ ] 4.1 Extend `compiler_service.py` to support compilation of the `cram` variant to `lessons/<Atomic_Note>.cram.html` omitting historical context and utilizing a high-yield layout (payoff, facts, traps, recall, checklists).
- [ ] 4.2 Implement question mix filtering in `cram_service.py` prioritizing rapid recall (short answer, trace, find error) and minimizing writing questions.

## 5. FastAPI Routers

- [ ] 5.1 Register cram session endpoints under `apps/api/src/api/routers/ater.py`: `/api/ater/cram/start`, `/api/ater/cram/status`, `/api/ater/cram/submit`.
- [ ] 5.2 Expose client API wrappers in `sidecarApi.ts` for desktop client integration.

## 6. Headless Verification Tests

- [ ] 6.1 Add unit tests verifying phase budget allocations for 60-minute, 30-minute, and 15-minute cram sessions.
- [ ] 6.2 Add unit tests verifying weakness prioritization ranking and confidence mismatch weightings.
- [ ] 6.3 Add unit tests verifying fallback scoring behavior when telemetry or FSRS state is missing.
- [ ] 6.4 Add unit tests verifying rescue mode triggers and adaptive question mix selection.
- [ ] 6.5 Run `openspec validate cram-mode` and verify all tests pass headlessly using `pytest`.
