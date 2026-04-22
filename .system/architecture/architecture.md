# System Architecture (Life OS)

## 1. System Map & Technologies
*   `apps/desktop`: Tauri v2 (Rust) + React/Vite (TS, Tailwind, shadcn/ui)
*   `apps/mobile-client`: React/Vite (IIFE) + Scriptable Bridge
*   `apps/api`: Python FastAPI Sidecar (Desktop Only)

### Core Reasoning Engine: OKA v23.0 (Ironclad)
1.  **Validation Loop**: Every note undergoes structural validation (YAML, backticks, tables). Invalid notes are re-prompted with `[REGENERATION_HINT]`.
2.  **Socratic Synthesis**: Probes are aggregated from atomic notes to build a comprehensive Master Question Bank (PQ note).
3.  **Relational Integrity**: Hub notes are anchored via `anchored_hub_id` to ensure metadata and content persistence.
4.  **Universal AI Bridge**: Desktop uses the Python Sidecar; Mobile uses a Native Scriptable Bridge to route requests to Gemini, OpenAI, Anthropic, Groq, and OpenRouter.

## 2. UI/UX Strategy
*   **Monochrome High-Fidelity**: Professional grayscale palette with professional typography.
*   **Agnostic Interaction**: Sidebar for Desktop; Bottom Navbar + Drawer sheets for Mobile.

## 3. Storage Blueprint
*   **Desktop State**: Tauri secure store.
*   **Mobile State**: iOS Filesystem (`lifeos_config.json`).
*   **Knowledge Base**: Local Obsidian Markdown files (iCloud or local).
*   **Automation Queue**: SQLite-backed persistent queue (Desktop) or In-Memory Session (Mobile).

## 4. Key Architectural Laws
1.  **Setext Defense**: Mandatory double-newlines before all horizontal rules (`---`) to prevent accidental heading resizing.
2.  **Gutter Law**: Mandatory empty lines before and after all Tables, Code Blocks, and Diagrams.
3.  **Wikilink Safety**: All YAML wikilinks must be double-quoted (e.g., `hub: "[[Title]]"`).
4.  **Thin Context Protocol**: Individual turns for each note to maintain stability on weak models.
