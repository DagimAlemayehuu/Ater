## Why

To ensure the complete integration and correctness of all 9 learning runtime phases, Ater requires a comprehensive, end-to-end (E2E) integration test suite. This suite will execute a complete learning loop inside a temporary vault fixture, validating path planning, HTML compilation, artifact packs, tutor loops, cram budgets, source-grounding, advanced playgroups, and learner model recalibration in a single unified execution pass.

## What Changes

- **End-to-End Integration Test Suite**: Implement a comprehensive test module `test_learning_runtime_e2e.py` under `apps/api/tests/`.
- **Mock Integration Stubs**: Add deterministic mocks representing AI generation, diagnostic mistake analyses, and web search providers to guarantee headless, offline execution.
- **State Flow Validation**: Programmatically verify database writes to `ater_queue.db`, note frontmatter serialization, relative link navigation, and metric changes.

## Capabilities

### New Capabilities
- `learning-runtime-e2e`: Simulates and verifies the full integrated learning loop (Planning -> Writing -> Compiling -> Artifact Mapping -> Tutoring -> Cramming -> Ingesting -> Profiling) under temporary SQLite and vault conditions.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Adds `test_learning_runtime_e2e.py` under the test suite directory.
- **Tests**: Adds the final, comprehensive integration test suite to verify the entire learning runtime system.
