## 1. Database and Backend Sidecar Extensions

- [ ] 1.1 Extend the SQLite schema or columns to support tracking `active_note_unlocks`, `consecutive_failures`, and `active_question_overrides` in `tutor_sessions` table
- [ ] 1.2 Modify `TutorSessionManager` in `tutor_service.py` to record consecutive failures per question and active note statuses
- [ ] 1.3 Implement `get_remediation_question` in `tutor_service.py` to query the LLM for a related question targeting the same concept on a 2nd consecutive failure
- [ ] 1.4 Update `/api/ater/tutor/submit` route in `ater.py` to return the mistake hint, detailed misconception explanation, or remediation question dynamically based on user attempt counts
- [ ] 1.5 Add backend routes for initializing and verifying chapter-level consolidation quizzes

## 2. Paced Note Generation and Unlock Gateway

- [ ] 2.1 Update `teach-anything-planner` note generators to support progressive mode by writing *only* the first note file in the chapter, leaving subsequent note stubs locked and uncreated
- [ ] 2.2 Implement backend trigger in `tutor_service.py` (`advance_note`) to dynamically write and unlock the next note file in the curriculum upon note mastery
- [ ] 2.3 Ensure Hub note file wikilink statuses update from locked to active upon file generation

## 3. Focused Practice Canvas and Retry UI

- [ ] 3.1 Modify `PracticeSession.tsx` to support a focused layout showing only one question card at a time and hiding all sidebars
- [ ] 3.2 Add UI state handlers for attempt-level feedback: render hints on Attempt 1, and show detailed misconception block on Attempt 2
- [ ] 3.3 Connect remediation question rendering in the practice canvas when a user gets a question wrong twice

## 4. Minimalist Roadmap Visuals and Progression

- [ ] 4.1 Create a minimalist visual Skill Tree component in `routes/teacher.tsx` rendering active, completed, and locked nodes
- [ ] 4.2 Restrict routing and loading of note html previews inside the iframe if the note path is not unlocked
- [ ] 4.3 Implement Chapter Consolidation Quiz trigger in the UI once all chapter notes are mastered
