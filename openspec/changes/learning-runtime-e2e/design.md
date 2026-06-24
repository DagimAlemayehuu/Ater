## Context

The Ater Learning Runtime is fully implemented. To protect the integrity of the integrated system, we require a comprehensive, end-to-end (E2E) integration test suite. This suite will execute a unified user study lifecycle inside a sandboxed environment, verifying that all 9 domain modules function in sequence without regressions.

## Goals / Non-Goals

**Goals:**
- Implement `apps/api/tests/test_learning_runtime_e2e.py` verifying the full integration loop.
- Sandbox all file and database operations using pytest `tmp_path` fixtures for the vault and ephemeral SQLite files.
- Mock all LLM and web search requests deterministically.
- Verify the step-by-step sequence: Planning -> Compilation -> Artifact Versioning -> Tutoring Persistence -> Cram Phase Allocations & Rescue Mode -> PDF Ingestion & Grounding -> SQL & Branching Playgrounds -> Learner Profile Recalibration.
- Ensure 100% offline, headless execution with zero Tauri/browser requirements.

**Non-Goals:**
- Do not run live network or cloud tests.
- Do not build visual layout regression tests.

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

### 2. Sandbox Setup & Mocks
- **Vault Sandbox**: The test class uses a pytest fixture that maps the `vault_path` to a temporary directory.
- **SQLite Sandbox**: The database connection string is mapped to a temporary database file in the `tmp_path` folder, initialized using `srs.py` schema setups.
- **LLM Mocks**: We mock `ainvoke` of the LLM client to return structured Pydantic results matching the expected schemas for planner intent, curriculum plan, artifact pack generation, and tutor mistake diagnosis.
- **Search Mocks**: We mock search query methods in the search engine to return clean, static markdown articles.

## Risks / Trade-offs

- **[Risk]**: Running the entire loop in one test makes it difficult to pinpoint failures.  
  **Mitigation**: The test will split the validation steps into distinct assertions with descriptive logging, so any step failure immediately indicates which phase failed.
