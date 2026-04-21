# System Architecture (Life OS)

## 1. System Map & Technologies
*   `apps/desktop`: Tauri v2 (Rust) + React/Vite (TS, Tailwind, shadcn/ui)
*   `apps/api`: Python FastAPI Sidecar

### Core Reasoning Engine: OKA v23.0 (Ironclad)
1.  **Validation Loop**: Every note undergoes structural validation (YAML, backticks, tables). Invalid notes are re-prompted with `[REGENERATION_HINT]`.
2.  **Socratic Synthesis**: Probes are aggregated from atomic notes to build a comprehensive Master Question Bank (PQ note).
3.  **Relational Integrity**: Hub notes are anchored via `anchored_hub_id` to ensure metadata and content persistence between Study Planner stubs and full Mastery Maps.
4.  **Strict Batching**: The "Strictly Generate All" mode uses a frontend-driven async loop to process batches sequentially, eliminating HTTP timeout issues.

## 2. UI/UX Strategy
*   **Monochrome High-Fidelity**: Professional grayscale palette with professional typography.
*   **Dashboard Mission Control**: Real-time batch status, curriculum lock, and "Strict" automation triggers.

## 3. Storage Blueprint
*   **Local State**: Tauri secure store.
*   **Knowledge Base**: Local Obsidian Markdown files.
*   **Automation Queue**: SQLite-backed persistent queue in `inbox/oka_queue.db`.

## 4. Key Architectural Laws
1.  **Setext Defense**: Mandatory double-newlines before all horizontal rules (`---`) to prevent accidental heading resizing.
2.  **Gutter Law**: Mandatory empty lines before and after all Tables, Code Blocks, and Diagrams.
3.  **Wikilink Safety**: All YAML wikilinks must be double-quoted (e.g., `hub: "[[Title]]"`).
4.  **Thin Context Protocol**: Individual turns for each note to maintain stability on weak models.
