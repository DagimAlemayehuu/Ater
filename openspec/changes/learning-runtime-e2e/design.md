## Context

The Ater Learning Runtime is fully implemented. To protect the integrity of the integrated system, we require a comprehensive, end-to-end (E2E) integration test suite. This suite will execute a unified user study lifecycle inside a sandboxed environment, verifying that all 9 domain modules function in sequence without regressions.

## Goals / Non-Goals

**Goals:**
- Implement `apps/api/tests/test_learning_runtime_e2e.py` verifying the full integration loop.
- Sandbox all file and database operations using pytest `tmp_path` fixtures for the vault and ephemeral SQLite files.
- Mock all LLM and web search requests deterministically.
- Verify the step-by-step sequence: Planning -> Compilation -> Artifact Versioning -> Tutoring Persistence -> Cram Phase Allocations & Rescue Mode -> PDF Ingestion & Grounding -> SQL & Branching Playgrounds -> Learner Profile Recalibration.
- Ensure 100% offline, headless execution with zero Tauri/browser requirements.
- Run a phase regression matrix covering all learning runtime phase test files that already exist.
- Generate a final verification report that includes pass/fail status, failing phase ownership, fix prompts, residual risks, and archive recommendation.
- Generate a manual desktop verification checklist that confirms the actual user-facing workflow works after automated tests pass.

**Non-Goals:**
- Do not run live network or cloud tests.
- Do not require visual layout regression tests for CI.
- Do not archive OpenSpec changes automatically from this test implementation. Archiving remains a manual decision after automated and manual verification pass.
- Do not silently fix unrelated phase implementation bugs inside the E2E change. If a phase bug blocks E2E, record it and provide a targeted fix prompt for that phase.

## Decisions

### 1. Unified Test Loop Sequence
We will implement a structured test class `TestLearningRuntimeE2E` in `apps/api/tests/test_learning_runtime_e2e.py`. It will run the following sequence:
1. **Planning**: Initialize `AterPlanner` with a mock LLM. Submit intent, extract topic, and write Hub, Chapter, and Note stubs to the temporary vault, verifying links and double-quoted frontmatter properties.
2. **Compilation**: Compile the generated Atomic Note. Verify markdown section parsing, previous/next link navigation, and ensure note metadata is updated with the compiled lesson variant paths.
3. **Artifact packs**: Map note concepts to candidate types and generate a versioned artifact pack, saving the JSON file to `<chapter_dir>/artifacts/<note_name>.artifacts.json`.
4. **Tutor Persistence**: Start a tutor session for the Hub. Submit answers with confidence wagers, verifying points calculation, mistake diagnosis, and misconceptions logging to SQLite.
5. **Cram Mode**: Initialize a 15-minute cram session. Verify orientation is skipped, phases are compressed, weakness scores are calculated, and rescue mode activates when remaining time runs low.
6. **Source Grounding**: Load a mock PDF page-by-page. Extract text, verify citations map to page numbers, mock web search augmentation, and write grounded references to the note's frontmatter.
7. **Advanced Playgrounds**: Execute a candidate SQL query against an in-memory database and verify the returned dataset. Execute a Case Simulation choice, updating stability metrics.
8. **Learner Recalibration**: Fetch the learner profile stats and verify that accuracy rates, overconfidence counts, and next-lesson recommendations are updated.

Each step must use descriptive assertion messages and must leave enough intermediate state in local variables or fixtures for debugging. The test may be split into several test functions if that gives clearer failures, but it must still cover one complete "student starts learning Git from scratch" lifecycle across the generated Hub, Chapter, Atomic Note, lessons, artifacts, tutor telemetry, cram scheduler, source grounding, advanced artifacts, and learner model.

### 2. Sandbox Setup & Mocks
- **Vault Sandbox**: The test class uses a pytest fixture that maps the `vault_path` to a temporary directory.
- **SQLite Sandbox**: The database connection string is mapped to a temporary database file in the `tmp_path` folder, initialized using `srs.py` schema setups.
- **LLM Mocks**: We mock `ainvoke` of the LLM client to return structured Pydantic results matching the expected schemas for planner intent, curriculum plan, artifact pack generation, and tutor mistake diagnosis.
- **Search Mocks**: We mock search query methods in the search engine to return clean, static markdown articles.

### 3. Phase Regression Matrix
The tester must run targeted phase tests before or alongside the E2E test. The exact command list may be adjusted to match the repository after inspection, but it should include the learning runtime files such as:

- `apps/api/tests/test_learning_object.py`
- `apps/api/tests/test_planner.py`
- `apps/api/tests/test_compiler.py`
- `apps/api/tests/test_artifact_pack.py` if present
- `apps/api/tests/test_tutor_runtime.py`
- `apps/api/tests/test_cram_mode.py`
- `apps/api/tests/test_source_driven_learning.py` if present
- `apps/api/tests/test_advanced_artifacts.py`
- `apps/api/tests/test_learner_model.py`
- `apps/api/tests/test_learning_runtime_e2e.py`

If a listed file does not exist, the final verification report must say whether the coverage is represented by another test file or whether it is a real test gap.

### 4. Final Verification Report
The implementation must create a durable Markdown report, recommended path:

`docs/testing/learning-runtime-final-verification.md`

The report must include:

- the exact automated commands run and whether they passed;
- a phase-by-phase coverage table for phases 1 through 9 and final hardening;
- every failure found, mapped to the likely phase/change responsible;
- a copy-paste fix prompt for the responsible implementation agent when failures exist;
- any known residual risks that remain even after passing tests;
- a clear `Archive recommendation: yes/no` line.

The archive recommendation must be `no` if any automated test fails, any manual verification blocker remains, or any OpenSpec validation command fails.

### 5. Manual Desktop Verification Guide
The implementation must create a manual verification checklist, recommended path:

`docs/testing/learning-runtime-manual-verification.md`

This guide must be written for the user and must use concrete steps in the running desktop application. It must verify:

- creating a Teach Anything path from a prompt such as "Teach me Git from scratch";
- confirming a Learning Hub appears in the correct route;
- opening Chapter and Atomic Note files through Explorer;
- opening the generated HTML lesson for an Atomic Note;
- verifying at least one interactive artifact works;
- using the tutor loop and seeing feedback/mistake repair;
- starting Cram Mode with a short time budget and seeing compressed priorities;
- optionally adding a small source/PDF fixture if the source-driven feature is exposed in the UI;
- verifying artifacts can be updated/versioned or at least that version metadata is visible/usable;
- checking that the app remains usable offline for generated lessons.

The guide must avoid vague instructions like "check it works." Every step needs an expected result.

## Risks / Trade-offs

- **[Risk]**: Running the entire loop in one test makes it difficult to pinpoint failures.  
  **Mitigation**: The test will split the validation steps into distinct assertions with descriptive logging, so any step failure immediately indicates which phase failed.

- **[Risk]**: The E2E suite may pass while the desktop flow is broken.  
  **Mitigation**: The manual verification guide is part of this change and must be completed before archive.

- **[Risk]**: A tester agent may patch the wrong phase while implementing E2E.  
  **Mitigation**: This change is test/report oriented. Blocking product bugs must be routed back to the responsible phase with a targeted prompt unless the fix is strictly limited to test harness wiring.
