## Why

Currently, Ater's learning path generation and curriculum planner relies entirely on a textual user prompt to generate the Hub, Chapters, and Atomic Notes. To ingest academic and complex technical material accurately, we need the capability to ground the curriculum planning and note generation in specific source materials (such as PDFs and text documents), while warning the user of source coverage gaps and optionally augmenting them with verified web sources.

## What Changes

- **Source Ingestion Service**: Process uploaded reference documents (using `pdf_extractor.py`) and split them into chunks for prompt context.
- **Source-Grounded Curriculum Planner**: Extend the curriculum planning service to extract a structured learning path (Chapters & Atomic Notes) directly mapped to specific source pages or sections.
- **Source Weakness Detector**: A check that identifies if the reference source has insufficient explanation, missing prerequisites, or ambiguity for key concepts, generating warning notifications.
- **Optional Web Search Augmentation**: A search loop that queries verified web resources to retrieve additional explanations or examples when source coverage is weak, contingent on user confirmation.
- **FastAPI Source Ingestion Endpoints**: Endpoints to upload sources, analyze coverage, and trigger grounded path generation.

## Capabilities

### New Capabilities
- `source-driven-learning`: Manages reference document loading, source-grounded chapter extraction, source weakness detection/warnings, and user-consented web search augmentation.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: Adds `source_service.py` to handle document ingestion, grounding verification, gap detection, and search augmentation. Extends routers in `ater.py` with `/api/ater/source/upload`, `/api/ater/source/plan`, and `/api/ater/source/augment`.
- **Tauri / Desktop Client**: New UI buttons to upload files, view coverage warnings, and approve web augmentation. Client API wrappers added to `sidecarApi.ts`.
- **Obsidian Vault / Database**: Sources are saved under `database/sources/` or in temporary folders. Ingested metadata links notes back to source files and page numbers.
- **Tests**: Headless backend unit and integration tests verifying source-grounded curriculum plans, coverage checks, and search fallbacks.
