## 1. E2E Integration Setup

- [x] 1.1 Create the E2E integration test module `apps/api/tests/test_learning_runtime_e2e.py` with sandboxed vault and SQLite fixtures.
- [x] 1.2 Implement mock models for structured LLM outputs, diagnostic grading, and web search results.
- [x] 1.3 Inspect the final names and APIs of the implemented learning runtime modules before writing tests; do not invent missing APIs.
- [x] 1.4 Build small reusable test fixtures for a Git self-study path, temporary vault, temporary SQLite database, mock source document, and deterministic search output.

## 2. Step-by-Step E2E Assertions

- [x] 2.1 Implement step 1: Verify prompt-based curriculum planning writes valid Hub, Chapter, and Note stubs to the temporary vault.
- [x] 2.2 Implement step 2: Verify compiling notes parses markdown sections, builds relative link navigation, and updates frontmatter variants using the custom YAML dumper.
- [x] 2.3 Implement step 3: Verify artifact pack generation maps note concepts and writes versioned JSON files under the unified chapter `artifacts/` folder.
- [x] 2.4 Implement step 4: Verify starting tutor sessions persists state to SQLite, grades correctness wagers, and logs misconceptions.
- [x] 2.5 Implement step 5: Verify cram sessions compress budgets, rank weakness scores, and activate rescue mode when remaining time runs low.
- [x] 2.6 Implement step 6: Verify PDF ingestion loads pages, resolves citations to page numbers, appends augmented search context, and writes references to note frontmatter.
- [x] 2.7 Implement step 7: Verify executing SQL queries in the playground validates against transient databases, and branching case simulations update metrics additively.
- [x] 2.8 Implement step 8: Verify the learner model computes accuracy rates, overconfidence levels, and prerequisite-blocked recommendations.
- [x] 2.9 Verify the complete learning object validator reports the final temporary vault as valid after all generated files, lesson variants, and artifact packs are written.
- [x] 2.10 Verify generated lesson HTML contains the full Atomic Note Markdown source and at least one interactive artifact reference.

## 3. Phase Regression Matrix

- [x] 3.1 Identify all phase-specific learning runtime test files currently present in `apps/api/tests/`.
- [x] 3.2 Run targeted backend tests for learning object model, Teach Anything planner, lesson compiler, artifact packs, tutor runtime, cram mode, source-driven learning, advanced artifacts, adaptive learner model, final hardening, and the new E2E suite.
- [x] 3.3 If an expected phase test file is missing, document whether another test covers that phase or mark it as a real coverage gap.
- [x] 3.4 Run the full backend test suite if feasible; if not feasible, document why and run the maximal targeted suite.

## 4. Final Verification Artifacts

- [x] 4.1 Create `docs/testing/learning-runtime-final-verification.md` with exact commands run, pass/fail status, phase coverage table, failures, targeted fix prompts, residual risks, and archive recommendation.
- [x] 4.2 Create `docs/testing/learning-runtime-manual-verification.md` with concrete desktop app manual verification steps and expected results.
- [x] 4.3 Ensure the final verification report says `Archive recommendation: no` unless all automated tests and OpenSpec validation pass.
- [x] 4.4 Ensure the report says archiving still requires explicit user approval after manual verification.

## 5. OpenSpec Verification

- [x] 5.1 Run `openspec validate learning-runtime-e2e` and resolve any validation issues.
- [x] 5.2 Run `openspec status --change "learning-runtime-e2e" --json` and confirm all artifacts are complete.
- [x] 5.3 Do not archive any learning runtime OpenSpec changes as part of this implementation.
