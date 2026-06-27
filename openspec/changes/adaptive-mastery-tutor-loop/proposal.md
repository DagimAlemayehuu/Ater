## Why

The current learning systems in Ater generate all notes and lessons for a study roadmap at once, which causes cognitive load issues and lacks feedback loops during the initial knowledge acquisition phase. There is no gating mechanism to ensure the user understands prerequisite notes before proceeding to advanced concepts, nor does the system adaptively test the user with related questions when they commit repeated conceptual mistakes.

Implementing a paced, note-by-note and chapter-by-chapter adaptive tutoring loop utilizing focused canvases, inline AI explanations, and re-testing sequences enforces mastery learning, dramatically boosting comprehension and retention.

## What Changes

- **Paced Ingestion Generation**: The teacher agent will no longer generate the entire roadmap's note files at once. It will generate the roadmap structure (represented in the Hub) and generate/deploy only the first atomic note (Chapter 1, Note 1) for the user to read. Subsequent notes remain locked.
- **Focused Practice Canvas**: The practice canvas will support a focused mode displaying only one question at a time, hiding all lessons and sidebars to eliminate distractions.
- **Hint and Retry Loop**: An incorrect answer on the first attempt will display a hint and allow the user to try again.
- **Detailed AI Breakdown & Remediation Quiz**: If the user answers incorrectly twice in a row, the canvas will mark it wrong, fetch a detailed AI explanation of *why* their specific answer is wrong, and dynamically generate a new related question to re-test the concept.
- **Chapter Gating (Consolidation Quiz)**: Once all atomic notes in a chapter are mastered, the user must pass a consolidation review quiz covering questions from all notes in that chapter before the next chapter's first note is unlocked.
- **Progressive Unlocking**: Completing notes and chapters dynamically generates and unlocks subsequent notes in the roadmap workspace.

## Capabilities

### Modified Capabilities

- `teach-anything-planner`: Update roadmap planners to support sequential single-note generation and lock downstream note files.
- `tutor-runtime`: Modify the practice runtime to enforce the interactive grill loop, mistake feedback, dynamic re-testing, and chapter consolidation quizzes.

## Impact

- **Database (`ater.db`)**: Update `tutor_sessions` table to track note completion, quiz wagers, and unlock states.
- **Backend APIs (`apps/api`)**: Extend `TutorSessionManager` in `tutor_service.py` to handle hints, detailed error diagnoses, dynamic related-question generation, and chapter-quiz state validation.
- **Tauri Core / Commands (`apps/desktop/src-tauri`)**: Connect frontend commands for tutor answers and lesson advances.
- **React Frontend (`apps/desktop/src`)**: Update `teacher.tsx` to render the minimalist roadmap nodes. Update `PracticeSession.tsx` to support single-question canvas layouts, retry states, and remediation steps.
