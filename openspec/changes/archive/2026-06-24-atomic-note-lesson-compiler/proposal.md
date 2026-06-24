## Why

To support Ater's offline-first learning loop, the system needs to compile Markdown Atomic Notes into interactive, self-contained, offline-runnable HTML lessons. Currently, Ater lacks a unified compilation service to transform the four-section note contract into structured HTML files containing embedded source markdown, navigation between lessons/chapters/hubs, and support for multiple learning variants (`simple`, `deep`, `cram`, `exam`).

## What Changes

- **Lesson Compiler Service**: A new backend compiler service that reads an Atomic Note, parses its YAML frontmatter and markdown sections, and generates an offline HTML file.
- **Embedded Source Markdown**: The compiled HTML lesson will embed the raw source markdown (e.g. within a hidden `<script type="text/markdown">` or data attribute) to maintain the markdown as the single source of truth.
- **Support for Lesson Variants**: The compiler will support four distinct HTML layout structures based on the requested variant:
  - `simple`: Conversational, high-level summaries with clear, progressive definitions.
  - `deep`: Detailed, comprehensive technical breakdowns with in-depth explanations of concepts.
  - `cram`: Fast, high-yield bulleted highlights and heavy active-recall cues.
  - `exam`: Formal assessment focus, prioritizing the "Proving Grounds" section and checking understanding.
- **Durable Navigation Header/Footer**: The generated HTML will include navigation links for the parent Hub, parent Chapter, previous note, and next note, resolved dynamically from the chapter/hub metadata.
- **Tauri / Desktop Integration**: API endpoints to trigger compilation and UI integrations to load these HTML files into the desktop client's iframe viewer.

## Capabilities

### New Capabilities
- `atomic-note-lesson-compiler`: Translates Atomic Notes into structured, offline-runnable HTML lessons across different learning variants.

### Modified Capabilities
None.

## Impact

- **FastAPI Sidecar (`apps/api`)**: New compilation logic and endpoints in `apps/api/src/domains/ater/compilers.py` (or `apps/api/src/domains/ater/compiler_service.py`) to handle the Markdown-to-HTML compilation.
- **Tauri / Desktop Client**: UI views (e.g., `HtmlLessonViewer.tsx`) will consume these generated HTML files directly via local file server or iframe source.
- **Obsidian Vault**: Writes compiled HTML files under the `lessons/` subdirectory inside each chapter folder.
- **Tests**: Headless unit and integration tests verifying HTML structure, embedded markdown validity, correct navigation link injection, and variant-specific layouts.
