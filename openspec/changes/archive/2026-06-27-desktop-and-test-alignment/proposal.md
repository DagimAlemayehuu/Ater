## Why

To fix critical backend unit and integration test failures caused by async/sync mismatch of the `TutorSessionManager.submit_answer` function, and clean up compiler type warnings, unused variables, and styling/alignment inconsistencies in the Ater desktop app to align with `docs/DESIGN.md` visual tokens.

## What Changes

- Refactor failing pytest tests in `apps/api/tests/test_tutor_runtime.py` and `apps/api/tests/test_learning_runtime_e2e.py` to be asynchronous (`async def`) and await `submit_answer`.
- Cleanup unused variables and missing React Hook dependencies warnings in `apps/desktop/src/routes/settings.tsx`, `apps/desktop/src/routes/teacher.tsx`, `apps/desktop/src/routes/welcome.tsx` and test files.
- Walk through all routes and components in the Ater desktop app to ensure they align perfectly with CSS and layout guidelines (Outfit font applied globally, de-warmed neutrals HSL variables used, grid bento gaps aligned at 12px / `gap-3`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tutor-runtime`: Adjust the Headless tutor tests scenario to support asynchronous test execution.

## Impact

- Python pytest test suite in `apps/api` (all tests passing).
- Type checking and linting diagnostics in `apps/desktop` (reduced warnings, zero errors).
