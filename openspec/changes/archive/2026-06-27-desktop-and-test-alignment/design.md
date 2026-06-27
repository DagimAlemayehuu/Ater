## Context

- `TutorSessionManager.submit_answer` was refactored to be an asynchronous function (`async def`), but the test suite in `apps/api/tests/test_tutor_runtime.py` and `apps/api/tests/test_learning_runtime_e2e.py` still calls it synchronously. This causes `TypeError: 'coroutine' object is not subscriptable` errors.
- There are several ESLint compiler warnings (missing React Hook dependencies, unused variables, unexpected `any` types) in `apps/desktop/src` routes and test files that should be cleaned up.
- The Ater desktop frontend routes and components must be verified against `docs/DESIGN.md` guidelines to make sure alignment, spacing, and styling tokens are applied consistently.

## Goals / Non-Goals

**Goals:**
- Refactor the 5 failing backend tests to correctly await the async `submit_answer` method.
- Resolve key compiler warnings (unused variables, missing Hook dependencies) in the desktop workspace.
- Audit desktop route components to ensure alignment with de-warmed gray tokens and Bento grid layout specifications.
- Ensure the full pytest and vitest test suites compile and pass successfully.

**Non-Goals:**
- Rewriting core algorithms or adding new database tables.
- Introducing new UI colors (such as purple/violet) or secondary font families (other than Outfit).

## Decisions

### 1. Make backend tests asynchronous and await `submit_answer`
- *Rationale*: Since the runtime code changed `submit_answer` to be async, the tests must conform to it. Pytest-asyncio is already configured in the backend repository and many other tests are async, so changing the test methods to `async def` and using `await` is the standard and correct approach.
- *Alternatives considered*: Converting the async function back to synchronous was rejected because the sidecar utilizes async networking and LLM stream handlers which require `async` execution.

### 2. Clean up compiler warnings in desktop routes
- *Rationale*: Unused variables and incorrect hook dependencies lead to subtle runtime bugs or memory leaks. Fixing these ensures code quality and correctness.
- *Alternatives considered*: Leaving warnings unresolved was rejected because the user requested to make the codebase perfect.

## Risks / Trade-offs

- *Risk*: Modifying tests might introduce issues if the mock setup is wrong.
- *Mitigation*: We will only change the `def` signature to `async def` and prefix `submit_answer` calls with `await`. The underlying assertions and mocks will remain unchanged.
