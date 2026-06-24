## Why

To ensure the complete integration and correctness of all 9 learning runtime phases, Ater requires a comprehensive, end-to-end (E2E) integration test suite. This suite will execute a complete learning loop inside a temporary vault fixture, validating path planning, HTML compilation, artifact packs, tutor loops, cram budgets, source-grounding, advanced playgroups, and learner model recalibration in a single unified execution pass.

This change is the final gate before archiving the learning runtime changes. It must prove the system works through code-level tests and produce a human-readable manual verification checklist for the desktop app. If any failure is discovered, the tester must map it back to the responsible phase and produce a targeted fix prompt instead of archiving.

## What Changes

- **End-to-End Integration Test Suite**: Implement a comprehensive test module `test_learning_runtime_e2e.py` under `apps/api/tests/`.
- **Mock Integration Stubs**: Add deterministic mocks representing AI generation, diagnostic mistake analyses, and web search providers to guarantee headless, offline execution.
- **State Flow Validation**: Programmatically verify database writes to `ater_queue.db`, note frontmatter serialization, relative link navigation, and metric changes.
- **Regression Matrix**: Run and report the targeted tests from every learning runtime phase so phase-local regressions are caught before the final E2E assertions.
- **Manual Verification Guide**: Produce a short, step-by-step desktop verification guide that a user can execute in the app after automated tests pass.
- **Failure Routing**: Produce phase-specific fix prompts for any failure instead of broad "fix tests" guidance.

## Capabilities

### New Capabilities
- `learning-runtime-e2e`: Simulates and verifies the full integrated learning loop (Planning -> Writing -> Compiling -> Artifact Mapping -> Tutoring -> Cramming -> Ingesting -> Profiling) under temporary SQLite and vault conditions.
- `learning-runtime-final-verification-report`: Captures automated test results, manual verification steps, known residual risks, and archive/no-archive recommendation.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Adds `test_learning_runtime_e2e.py` under the test suite directory.
- **Docs/Reports**: Adds a generated manual verification guide and final verification report under a stable documentation or test-artifact location.
- **Tests**: Adds the final, comprehensive integration test suite and runs the phase regression suite needed to verify the entire learning runtime system.
