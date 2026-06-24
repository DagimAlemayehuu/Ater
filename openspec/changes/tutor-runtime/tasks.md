## 1. Database Schema & Initialization

- [ ] 1.1 Create database initialization logic to set up `tutor_sessions` and `user_misconceptions` tables in `ater.db`.

## 2. Tutor Session Manager State Machine

- [ ] 2.1 Implement `TutorSessionManager` in `apps/api/src/domains/ater/tutor_service.py` to manage session start, load, and progression.
- [ ] 2.2 Implement the confidence-based scoring algorithm in the session manager.

## 3. Diagnosis & Misconception Capture

- [ ] 3.1 Implement the mistake diagnosis engine using structured LLM output (mockable) to return hints and identify misconceptions.
- [ ] 3.2 Implement the logging service to save detected misconceptions to the `user_misconceptions` table.

## 4. API Endpoints & Iframe Integration

- [ ] 4.1 Add FastAPI endpoints for the tutor loop: `/api/ater/tutor/start`, `/api/ater/tutor/submit`, and `/api/ater/tutor/status`.
- [ ] 4.2 Update `compiler_service.py` to inject `postMessage` event dispatchers (e.g. `ANSWER_SUBMITTED`, `NEXT_NOTE`) into compiled HTML files.
- [ ] 4.3 Add frontend client event listeners and handlers in `sidecarApi.ts` and React components.

## 5. Headless Backend Tests

- [ ] 5.1 Add unit tests verifying tutor session state transitions and scoring rules.
- [ ] 5.2 Add unit tests verifying mistake diagnosis hints and misconception database logging.
- [ ] 5.3 Add integration tests in a temporary vault simulating the end-to-end tutor loop.
- [ ] 5.4 Ensure all tests run headlessly, require zero network access or live AI calls, and pass successfully using `pytest`.

## 6. Verification & Validation

- [ ] 6.1 Run `openspec validate tutor-runtime` and resolve any validation issues.
- [ ] 6.2 Verify that no tests open a Tauri window or visible browser.
- [ ] 6.3 Verify the old Ater Architect pipeline remains intact.
