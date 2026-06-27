## Context

The Ater desktop application has two existing pathways for learning:
1. Note Generation from PDF (`AterService`): Extracts text from a PDF, detects curriculum, builds a multi-batch note generation plan, and writes all notes to the Obsidian Vault.
2. Teach Anything Planner (`TeacherService`): Spawns a multi-chapter lesson plan from a single prompt, generates all companion HTML/MD note files in batch, and presents them in an iframe.

While the backend has a `TutorSessionManager` in `tutor_service.py` to manage session state and calculate wagers, the front-end has no concept of progressive lock pacing. Currently, all notes are written in one go, allowing the user to study concepts out of order. Furthermore, the quiz system is statically served from the generated notes' quiz blocks, lacking an interactive re-testing grill loop when a user commits repeated errors.

## Goals / Non-Goals

**Goals:**
- Implement a sequential note-by-note and chapter-by-chapter lock/unlock mechanism in the `tutor_sessions` database and frontend UI.
- Redesign the quiz canvas to show a minimalist, single-question interface focused purely on retrieval.
- Add an interactive mistake handling loop: Hint on 1st error, detailed breakdown on 2nd consecutive error, and a dynamic related-question generation/re-testing cycle on 3rd or subsequent consecutive errors.
- Enforce chapter consolidation quizzes testing all atomic notes in the chapter before unlocking the next chapter.
- Keep UI aesthetics minimal, de-warmed gray HSL 240, Outfit font only.

**Non-Goals:**
- Offline LLM execution (all adaptive LLM generations will utilize the existing configured Gemini API keys).
- Rewriting the core FSRS scheduling algorithms in `srs.py` (which run on reviews, not initial acquisition tutoring).

## Decisions

### 1. Database Schema Extension
- **Decision:** Extend the `tutor_sessions` SQLite table or schema to store:
  - `active_note_unlocks` (TEXT, JSON array of note relative paths currently unlocked).
  - `consecutive_failures` (INTEGER, count of wrong attempts for the current question).
  - `active_question_overrides` (TEXT, JSON mapping of question IDs to dynamically generated related questions).
- **Alternative:** Storing state inside frontmatter of Markdown files. Rejected because Markdown files are user-editable in Obsidian, which risks state corruption or tampering. Local SQLite is secure and ephemeral.

### 2. The Dynamic Re-Testing Generation Flow
- **Decision:** When the user commits a 2nd consecutive failure on a question, the backend sidecar `/api/ater/tutor/submit` will invoke the LLM to generate a new, related question targeting the exact same concept.
- This dynamically generated question is merged into the session's active quiz state in memory and cached in `active_question_overrides`. The UI displays this new question as a remediation check.
- **Alternative:** Fall back to a static pre-generated list of backup questions. Rejected because it increases note file sizes, whereas dynamic generation is highly targeted to the student's exact misconception.

### 3. Step-by-Step UI Navigation Architecture
- **Decision:** The parent React route `teacher.tsx` will display a minimal visual node tree (Skill Tree layout).
- Double clicking or selecting an unlocked note node transitions to the Lesson View. Clicking "Go to Practice" transitions the router view to a focused practice screen with a single-question card layout.
- Passing the quiz fires `POST /api/ater/tutor/advance`, which updates SQLite, triggers sidecar generation of the next atomic note in the curriculum, updates the Hub wikilink state, and redirects the user back to the Lesson view.

## Risks / Trade-offs

- **[Risk]** PDF note generation fails or timeouts on progressive unlocks.
  - *Mitigation:* Cache the source text chunks in the session state directory (`.ater/sessions/`) at initial planning time, allowing instant single-note compilation without re-reading or re-extracting PDF pages.
- **[Risk]** Internet connection drops during active practice, preventing dynamic question generation.
  - *Mitigation:* Fall back to pre-defined MCQ/writing templates inside the note's interactive-quiz block if the LLM call fails.
