## 1. Intent Classification & Clarification Policy

- [x] 1.1 Create the planner module structure in `apps/api/src/domains/ater/planner.py`.
- [x] 1.2 Implement the intent classifier to detect learning-related prompts vs. non-learning requests.
- [x] 1.3 Implement the clarification evaluator: check if a prompt is too vague or lacks context.
- [x] 1.4 Implement the clarification question generator: return 1-3 targeted questions if clarification is needed.

## 2. Hub Lookup & Merging

- [x] 2.1 Integrate the existing Hub lookup from Phase 1.
- [x] 2.2 Implement the Hub merging logic: if an existing Hub is matched, append new chapters to it instead of creating a duplicate.

## 3. Curriculum Planner & File Ingestion

- [x] 3.1 Implement the curriculum generator using structured Pydantic outputs to return a JSON list of chapters and Atomic Note titles.
- [x] 3.2 Implement the file writing service for "Generate All" mode (writes Hub, all Chapters, and all Atomic Note stubs).
- [x] 3.3 Implement the file writing service for "Progressive" mode (writes Hub, first Chapter, and first chapter's Atomic Note stubs, keeping other chapters listed but uncreated).
- [x] 3.4 Ensure all generated files strictly conform to the Phase 1 path builders, metadata schemas (types, wikilinks, quoted values), and Obsidian-readable structure.

## 4. API Endpoints

- [x] 4.1 Add FastAPI router endpoints for the planning flow: `/api/ater/plan/intent`, `/api/ater/plan/curriculum`, and `/api/ater/plan/confirm`.
- [x] 4.2 Integrate the endpoints with the desktop client's API layer.

## 5. Headless Backend Tests

- [x] 5.1 Add unit tests for the intent classifier and clarification evaluator with mock responses.
- [x] 5.2 Add unit tests for the curriculum planner, verifying structured JSON output.
- [x] 5.3 Add unit tests for the Hub merger, confirming it appends new chapters correctly without corrupting existing content.
- [x] 5.4 Add integration tests in a temporary vault directory verifying file creation in both "Generate All" and "Progressive" modes.
- [x] 5.5 Ensure all tests run headlessly, require zero network access or live AI calls, and pass successfully using `pytest`.

## 6. Verification & Validation

- [x] 6.1 Run `openspec validate teach-anything-planner` and resolve any validation issues.
- [x] 6.2 Verify that no tests open a Tauri window or visible browser.
- [x] 6.3 Verify the old Ater Architect pipeline remains intact.
