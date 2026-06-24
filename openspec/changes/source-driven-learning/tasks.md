## 1. Document Ingestion Service

- [x] 1.1 Implement PDF loading and chunking in `apps/api/src/domains/ater/source_service.py` using the `load_pdf_robust` helper.
- [x] 1.2 Implement warnings when extracted PDF page content is empty or contains no extractable text.

## 2. Source-Grounded Planner

- [x] 2.1 Implement Pydantic models for `SourceCitation`, `CoverageWarning`, `SourceGroundedNotePlan`, and `SourceGroundedCurriculum` in `source_service.py`.
- [x] 2.2 Implement grounded curriculum extraction in `SourceGroundedPlanner` (or as an extension of `AterPlanner`), mapping notes to page-level citations.
- [x] 2.3 Update the note writer to serialize the `sources` mapping (filenames and page ranges) to Atomic Note frontmatter.

## 3. Source Weakness Detector

- [x] 3.1 Implement explanation coverage analysis checking notes against Definition, Mechanism, and Failure Mode dimensions in reference texts.
- [x] 3.2 Implement warning generator to return `CoverageWarning` lists to the desktop client before writing files.

## 4. Consented Web Search Augmentation

- [x] 4.1 Implement search utility (mockable in tests) that queries external terms and parses results to clean markdown.
- [x] 4.2 Implement the consent command to execute search augmentation and append results to the note generation context.
- [x] 4.3 Update the note frontmatter writer to list search query URLs and page titles under the `sources` metadata.

## 5. FastAPI Endpoints & Client Wrappers

- [x] 5.1 Register sidecar endpoints under `apps/api/src/api/routers/ater.py`: `/api/ater/source/upload`, `/api/ater/source/plan`, and `/api/ater/source/augment`.
- [x] 5.2 Add client fetch wrappers in `apps/desktop/src/lib/sidecarApi.ts` for desktop client integration.

## 6. Headless Verification Tests

- [x] 6.1 Add unit tests verifying page-level PDF text extraction and metadata mapping in `apps/api/tests/test_source_driven.py`.
- [x] 6.2 Add unit tests verifying note citation frontmatter serialization.
- [x] 6.3 Add unit tests verifying weakness coverage checking and severity warnings.
- [x] 6.4 Add unit tests verifying consented search query execution and mock result augmentation.
- [x] 6.5 Run `openspec validate source-driven-learning` and verify all tests pass headlessly using `pytest`.
