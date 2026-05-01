# System Architecture (Life OS)

## 1. System Map & Technologies
*   `apps/desktop`: Tauri v2 (Rust) + React/Vite (TS, Tailwind, shadcn/ui)
*   `apps/mobile-client`: React/Vite (IIFE) + Scriptable Bridge
*   `apps/api`: Python FastAPI Sidecar (Desktop Only)

### Core Reasoning Engine: OKA v26.0 (High-Density & Seamless)
1.  **2-Pass Generation Strategy**: Decouples technical theory from pedagogical artifacts. Pass 1 (Theorist) generates strict markdown prose; Pass 2 (Inquisitor) generates artifacts and randomized 3-level quizzes.
2.  **Validation Gatekeeping**: A nuclear-grade `OkaValidator` intercepts generation output to block error markers, answer leaks in debug questions, and insufficient wikilink density. Notes failing these checks are automatically regenerated.
3.  **Fail-Safe Rate-Limit Recovery**: The `OkaService` captures 429 errors, persists current progress to disk, and enters a `rate_limited` state. Generation can be resumed exactly where it left off via a dedicated resume endpoint, supporting hot API-key swaps.
4.  **Interactive Recall Interceptor**: The React frontend intercepts `interactive-quiz` JSON blocks within markdown and renders them as interactive, stateful components via `MiniPracticeUI.tsx`.
5.  **Domain Drift Guard**: Lexical signals are used to detect domain hallucination (e.g., C++ vs OAuth), triggering immediate rejection and regeneration if the model drifts from the target subject matter.
6.  **Source-Page Traceability**: Mandatory extraction of page markers from raw source text to ensure every atomic note is cited back to the precise PDF location.
7.  **Relational Integrity**: Hub notes are anchored via `anchored_hub_id` to ensure metadata and content persistence.

## 2. UI/UX Strategy
*   **Monochrome High-Fidelity**: Professional grayscale palette with premium typography (Inter/Outfit).
*   **Direct-Entry Architecture**: Navigation depth is minimized. Major modules (Agents, Settings) use direct-access entry points, bypassing intermediary lists.
*   **Direct-English Standard**: UI terminology must be "plain and direct." Avoid academic jargon (e.g., use "True/False" instead of "Binary", "Topic" instead of "Master Unit Hub").
*   **Agnostic Interaction**: Sidebar for Desktop; Bottom Navbar + Drawer sheets for Mobile.
*   **Integrated Study Architecture**: Navigation controls (Start Session, Next/Prev) are integrated directly into the Markdown content flow to maintain focus and context.
*   **High-Fidelity List Resolution**: Markdown lists are rendered with strict vertical alignment and sub-list detection to mirror Obsidian's native layout.

## 3. Storage Blueprint
*   **Desktop State**: Tauri secure store.
*   **Mobile State**: iOS Filesystem (`lifeos_config.json`).
*   **Knowledge Base**: Local Obsidian Markdown files (iCloud or local).
*   **Automation Queue**: SQLite-backed persistent queue (Desktop) or In-Memory Session (Mobile).

## 4. Key Architectural Laws
1.  **Direct English Enforcement**: All new UI components must use simple, direct English labels.
2.  **Setext Defense**: Mandatory double-newlines before all horizontal rules (`---`) to prevent accidental heading resizing.
3.  **Gutter Law**: Mandatory empty lines before and after all Tables, Code Blocks, and Diagrams.
4.  **Wikilink Safety**: All YAML wikilinks must be double-quoted (e.g., `hub: "[[Title]]"`).
5.  **Underscore Uniformity**: All wikilinks and filenames must use `Underscore_Title_Case`. Spaces inside `[[...]]` are forbidden to ensure graph compatibility.
6.  **Thin Context Protocol**: Individual turns for each note to maintain stability on weak models.
7.  **Density Optimization**: All UI components must prioritize information density over whitespace. Use compact font sizes (`text-sm` or smaller for UI elements) and tight padding to maximize screen utility.
8.  **Validation Law**: Notes containing error strings, answer leaks, or <3 wikilinks must be rejected by the deployer.
9.  **JSX Structural Law**: Complex nested ternaries and fragments in the Markdown/PDF viewer must be rigorously aligned to prevent build-time tree corruption.
