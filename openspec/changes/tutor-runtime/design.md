## Context

Ater requires an active tutoring runtime to make compiled HTML lessons interactive and adaptive. Currently, compiled lessons operate as static documents with independent, client-side quizzes. This design introduces the `TutorSessionManager` on the backend and an iframe-event communication system on the frontend to manage active study sessions.

It tracks progress, handles confidence wagers, evaluates and diagnoses answers, records misconceptions to the database, and drives progression via structured events.

## Goals / Non-Goals

**Goals:**
- Implement `TutorSessionManager` in `apps/api/src/domains/ater/tutor_service.py` with SQLite backing (`ater.db`) to persist active sessions.
- Define a confidence wager scoring algorithm.
- Implement mistake diagnosis in the sidecar to categorize user errors and return helpful hints.
- Record identified misconceptions to a database table `user_misconceptions` in `ater.db`.
- Establish the `postMessage` event protocol to communicate between the lesson iframe and the desktop client.
- Add FastAPI routes for session management (start, submit answer, get status, finish).
- Verify the entire state machine headlessly using pytest.

**Non-Goals:**
- Do not build complex data visualization dashboards in this phase.
- Do not alter the core FSRS interval calculation logic, only log the review attempts to it.
- Do not use cloud database sync for active session state; keep state local to `ater.db`.

## Decisions

### 1. SQLite Session and Misconception Tables
We will initialize two new SQLite tables in `ater.db` via `apps/api/src/domains/ater/srs.py` or a dedicated database migration helper:
- `tutor_sessions`: Tracks `session_id`, `hub_path`, `current_note_path`, `completed_notes` (JSON list), `wagers` (JSON map), and `status` (active/completed).
- `user_misconceptions`: Tracks `id`, `topic`, `note_title`, `misconception_text`, and `created_at`.

### 2. Iframe postMessage Communication
The compiled HTML lessons will include injected Javascript event dispatchers. When a student interacts with a quiz or navigates, the iframe sends a postMessage:
```javascript
window.parent.postMessage({
  type: 'ANSWER_SUBMITTED',
  payload: {
    question_id: 'q1',
    user_answer: 'A',
    wager: 'high'
  }
}, '*');
```
The desktop client will capture these events and make API requests to the FastAPI sidecar.

### 3. Metacognitive Confidence Wager Scoring
The system will score answers using a combination of correctness and confidence wager:
- **Correct + High Confidence**: +10 points (Calibrated & Correct)
- **Correct + Low Confidence**: +5 points (Correct but unsure)
- **Incorrect + Low Confidence**: 0 points (Unsure & Incorrect)
- **Incorrect + High Confidence**: -5 points (Overconfident & Incorrect - triggers immediate misconception diagnosis)

### 4. Mistake Diagnosis Engine
When a user submits an incorrect answer (specifically for open-ended or complex questions):
- The sidecar invokes a lightweight LLM schema to return:
  - `is_misconception`: boolean
  - `misconception_text`: explanation of the mistake's root cause
  - `hint`: a constructive clue to help the user self-correct without giving away the answer

## Risks / Trade-offs

- **[Risk]**: The user might close the desktop application mid-session, losing progress.  
  **Mitigation**: Persist session updates to SQLite on every submitted answer, allowing the application to restore the session upon restart.

- **[Risk]**: Iframe communication might block or experience race conditions.  
  **Mitigation**: Keep event handling asynchronous and decoupled; the UI should show loading spinners while waiting for sidecar API responses.
