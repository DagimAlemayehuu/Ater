## 1. E2E Integration Setup

- [ ] 1.1 Create the E2E integration test module `apps/api/tests/test_learning_runtime_e2e.py` with sandboxed vault and SQLite fixtures.
- [ ] 1.2 Implement mock models for structured LLM outputs, diagnostic grading, and web search results.

## 2. Step-by-Step E2E Assertions

- [ ] 2.1 Implement step 1: Verify prompt-based curriculum planning writes valid Hub, Chapter, and Note stubs to the temporary vault.
- [ ] 2.2 Implement step 2: Verify compiling notes parses markdown sections, builds relative link navigation, and updates frontmatter variants using the custom YAML dumper.
- [ ] 2.3 Implement step 3: Verify artifact pack generation maps note concepts and writes versioned JSON files under the unified chapter `artifacts/` folder.
- [ ] 2.4 Implement step 4: Verify starting tutor sessions persists state to SQLite, grades correctness wagers, and logs misconceptions.
- [ ] 2.5 Implement step 5: Verify cram sessions compress budgets, rank weakness scores, and activate rescue mode when remaining time runs low.
- [ ] 2.6 Implement step 6: Verify PDF ingestion loads pages, resolves citations to page numbers, appends augmented search context, and writes references to note frontmatter.
- [ ] 2.7 Implement step 7: Verify executing SQL queries in the playground validates against transient databases, and branching case simulations update metrics additively.
- [ ] 2.8 Implement step 8: Verify the learner model computes accuracy rates, overconfidence levels, and prerequisite-blocked recommendations.

## 3. Verification

- [ ] 3.1 Execute the new E2E test module using `pytest` and verify it passes successfully.
- [ ] 3.2 Run `openspec validate learning-runtime-e2e` and resolve any validation issues.
