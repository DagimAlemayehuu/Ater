## Context

Ater requires the ability to compile Markdown Atomic Notes in the Obsidian Vault into interactive, self-contained, offline-runnable HTML lessons. This design details the compiler architecture that reads a note, parses its structure (the 4-section contract: Mental Model, H1, H2, Proving Grounds), resolves navigation from the parent Chapter and Hub, and outputs the HTML files.

The HTML files must be completely self-contained (inline styles and scripts, no external CDN assets) to ensure they work offline.

## Goals / Non-Goals

**Goals:**
- Implement `AterLessonCompiler` in the FastAPI sidecar (`apps/api/src/domains/ater/compiler_service.py` or similar).
- Parse the 4-section Atomic Note markdown structure.
- Embed the raw markdown source inside the HTML (within a hidden element) for full transparency.
- Resolve navigation (previous note, next note, chapter, hub) by reading the parent Chapter and Hub files in the vault.
- Implement four layout variants (`simple`, `deep`, `cram`, `exam`) with distinct explanation densities and structures.
- Write compiled HTML files to the `lessons/` subdirectory relative to the note's folder.
- Update the note's frontmatter `lesson_variants` list to point to the newly compiled files.
- Verify everything via headless Python tests.

**Non-Goals:**
- Do not implement the interactive Tutor Runtime (Phase 5) which handles wagers, session state, and active recall tracking.
- Do not generate or embed interactive artifacts (Phase 4).
- Do not use external CDN libraries (e.g. Tailwind from a CDN or Google Fonts) in the generated HTML; style using local, embedded CSS.

## Decisions

### 1. Self-Contained HTML Shell
The compiler will use a predefined HTML template embedded in Python. This template will include a clean, responsive CSS style block (using Ater's color scheme, sans-serif fonts, and support for system dark mode). It will require no external fonts, stylesheets, or JS libraries to load.

### 2. Navigation Resolution
To resolve previous and next buttons:
- Find the chapter file referenced in the note's frontmatter.
- Parse the chapter file's `atomic_notes` list to find the current note's position.
- Identify the previous and next notes.
- Resolve their relative paths and titles to generate `<a>` links or postMessage events.
- Find the hub file referenced in the note's frontmatter to link back to the Hub.

### 3. Layout Variants
The compiler will support generating different variants:
- **Simple**: Includes only the `Mental Model` and simplified summaries of `H1` and `H2`.
- **Deep**: Includes all sections in full detail.
- **Cram**: Focuses on the `Proving Grounds` section, showing high-yield summaries.
- **Exam**: Shows only the `Proving Grounds` quiz, hiding the main explanations until answered.

### 4. Embedding Raw Markdown
The raw markdown source of the note will be embedded in the HTML inside:
```html
<script type="text/markdown" id="raw-markdown-source">...</script>
```
This allows the desktop application to extract the original content directly from the HTML if needed.

## Risks / Trade-offs

- **[Risk]**: If the parent chapter or hub file is missing, navigation resolution will fail.  
  **Mitigation**: Fallback gracefully when chapter/hub files are missing by omitting navigation buttons or linking to the parent directory.

- **[Risk]**: Complex markdown elements (like mathematical formulas or code blocks) may render poorly in plain HTML.  
  **Mitigation**: Include simple markdown-to-HTML parsing rules for lists, code blocks, bold text, and math delimiters, ensuring code blocks are rendered inside `<pre><code>` tags.
