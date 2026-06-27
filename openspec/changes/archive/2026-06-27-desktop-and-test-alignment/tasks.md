## 1. Backend Test Refactoring

- [x] 1.1 Update `apps/api/tests/test_tutor_runtime.py` to make test functions async and await `TutorSessionManager.submit_answer` calls.
- [x] 1.2 Update `apps/api/tests/test_learning_runtime_e2e.py` to make `test_wager_scoring_correct_high_confidence`, `test_wager_scoring_incorrect_high_confidence`, `test_misconception_logged_for_high_confidence_error`, and `test_score_clamped_at_zero` async and await `submit_answer`.

## 2. Desktop Code Warning Cleanup

- [x] 2.1 Fix React Hook dependency issues in `apps/desktop/src/routes/settings.tsx`.
- [x] 2.2 Cleanup unused variables and typing warnings in `apps/desktop/src/routes/teacher.tsx`.
- [x] 2.3 Cleanup typing warnings in `apps/desktop/src/routes/welcome.tsx` and test files.

## 3. Desktop Styling & Token Audit

- [x] 3.1 Audit desktop layouts (AuthenticatedLayout, AppHeader, AppSidebar) for Outfit font usage and consistent HSL/Bento token bindings.
- [x] 3.2 Verify outer padding and panel gaps conform to `docs/DESIGN.md` guidelines.
