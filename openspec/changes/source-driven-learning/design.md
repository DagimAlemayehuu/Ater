## Context

Ater requires a source-grounded ingestion pipeline to build learning paths directly from student-provided reference materials (e.g. PDFs and text documents) rather than relying solely on abstract LLM knowledge. Currently, `AterPlanner` generates curriculum structures from a prompt. This design introduces the `SourceGroundedPlanner`, which processes reference documents, maps planned notes to page numbers, checks for explanation coverage weaknesses, and implements an optional, user-consented web-search augmentation loop to bridge knowledge gaps.

All tasks are verified headlessly in python pytest and do not require live network, cloud APIs, or desktop windows.

## Goals / Non-Goals

**Goals:**
- Implement `SourceIngestionService` in `apps/api/src/domains/ater/source_service.py` utilizing the robust `load_pdf_robust` helper to parse documents.
- Implement the `SourceGroundedPlanner` to extract a curriculum plan where each note is mapped to specific source citations (file name and page numbers).
- Implement the `SourceWeaknessDetector` to analyze source content against core learning dimensions (Definition, mechanism, failure modes) and flag high-severity warnings.
- Implement a user-consented web search augmentation engine that queries verified web sources (mockable in tests) only when approved by the user, appending external content to the ingestion context.
- Update compiled Atomic Note frontmatter to contain a list of `sources` (storing file names and page citations).
- Add FastAPI endpoints for uploading reference materials, analyzing coverage warnings, and executing search augmentation.

**Non-Goals:**
- Do not build complex cloud OCR models; keep PDF parsing local using `pypdf` and `pdf_extractor.py`.
- Do not require live web search API keys; all tests must utilize mock search results.
- Do not automate web search without explicit user consent; the system must return warnings and await a confirm command.
- Do not implement the desktop UI view container in this phase.

## Decisions

### 1. Source Grounding Data Schema
We will represent document source mappings using the following Pydantic models in `apps/api/src/domains/ater/source_service.py`:
- `SourceCitation`:
  - `file_name`: str
  - `pages`: list[int]
  - `confidence_score`: float  # How well the note aligns with the source section
- `CoverageWarning`:
  - `concept`: str
  - `dimension`: Literal["definition", "mechanism", "failure_mode"]
  - `severity`: Literal["low", "medium", "high"]
  - `description`: str
- `SourceGroundedNotePlan`:
  - `title`: str
  - `chapter_title`: str
  - `citations`: list[SourceCitation]
  - `suggested_concepts`: list[str]
- `SourceGroundedCurriculum`:
  - `topic`: str
  - `sources`: list[str]
  - `notes`: list[SourceGroundedNotePlan]
  - `warnings`: list[CoverageWarning]

### 2. PDF Parsing & Grounded Planning
When a user uploads a PDF, the backend:
1. Invokes `load_pdf_robust` to extract text chunks by page.
2. Index these page chunks temporarily using simple semantic keywords or embedding links.
3. The LLM acts as the `SourceGroundedPlanner`, structuring the curriculum and returning a list of `citations` mapping each planned note back to source files and page numbers.
4. When writing Atomic Notes, the metadata contract is updated to include:
   ```yaml
   type: Atomic Note
   hub: "[[Git_Hub]]"
   chapter: "[[Chapter_01_Foundations]]"
   sources:
     - file: "git-tutorial.pdf"
       pages: [12, 13]
   ```

### 3. Source Weakness & Coverage Analysis
Before generating note contents, the system performs a coverage check to ensure the source contains sufficient explanatory material:
- **Learning Dimensions Check**: Verify if the source text covers the concept's *Definition* (what it is), *Mechanism* (how it works), and *Failure Mode* (risks, traps, errors).
- **Severity Flagging**: If the source text lacks mechanism or failure mode explanations for a core concept, the `SourceWeaknessDetector` generates a `CoverageWarning` with `severity: "high"`.
- **User Alert**: These warnings are returned to the desktop client before writing files, enabling the user to choose to proceed with weak grounding or approve augmentation.

### 4. Optional Web Search Augmentation Loop
If the user consents to augment specific weak concepts flagged in the coverage check:
1. The backend triggers a `/api/ater/source/augment` POST request.
2. The sidecar queries a web search provider (e.g. Google Search or DuckDuckGo API wrapper, mockable in tests) using specific search terms.
3. The top results are fetched, stripped to clean markdown text, and appended to the generation context as "Augmented Source Context".
4. The generated Atomic Note frontmatter is updated with the source annotation:
   ```yaml
   sources:
     - file: "git-tutorial.pdf"
       pages: [12, 13]
     - file: "Web Search: Git Rebase Conflicts"
       url: "https://git-scm.com/docs/git-rebase"
   ```

## Risks / Trade-offs

- **[Risk]**: The PDF is scanned (images instead of text), resulting in empty page content.  
  **Mitigation**: The parser detects empty text outputs from `load_pdf_robust` and raises a warning advising the user to run OCR or enable full web search augmentation.

- **[Risk]**: Large PDFs exceed LLM context window limits.  
  **Mitigation**: The system maps keywords to relevant page chunks first (retrieval-augmented planning) instead of sending the entire raw PDF text to the LLM.
