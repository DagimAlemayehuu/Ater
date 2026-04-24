# System Architecture (Life OS)

## 1. System Map & Technologies
*   `apps/desktop`: Tauri v2 (Rust) + React/Vite (TS, Tailwind, shadcn/ui)
*   `apps/mobile-client`: React/Vite (IIFE) + Scriptable Bridge
*   `apps/api`: Python FastAPI Sidecar (Desktop Only)

### Core Reasoning Engine: OKA v25.0 (Technical Pedagogy)
1.  **2-Pass Generation Strategy**: Decouples technical theory from pedagogical artifacts. Pass 1 (Theorist) generates strict markdown prose; Pass 2 (Inquisitor) generates artifacts and randomized 3-level quizzes.
2.  **Interactive Recall Interceptor**: The React frontend intercepts `interactive-quiz` JSON blocks within markdown and renders them as interactive, stateful components via `MiniPracticeUI.tsx`.
3.  **Self-Healing JSON Pipeline**: Automated retry loops in the Python sidecar intercept LLM formatting errors, providing feedback and re-prompting until valid JSON is achieved.
4.  **Randomized Multi-Level Pedagogy**: Dynamically assigns question types (MCQ, Fill-in-the-Blank, Debug, etc.) to 3 difficulty levels (L1/L2/L3) per note to prevent "Illusions of Competence."
5.  **Relational Integrity**: Hub notes are anchored via `anchored_hub_id` to ensure metadata and content persistence.

## 2. UI/UX Strategy
*   **Monochrome High-Fidelity**: Professional grayscale palette with premium typography (Inter/Outfit).
*   **Direct-Entry Architecture**: Navigation depth is minimized. Major modules (Agents, Settings) use direct-access entry points, bypassing intermediary lists.
*   **Direct-English Standard**: UI terminology must be "plain and direct." Avoid academic jargon (e.g., use "True/False" instead of "Binary", "Topic" instead of "Master Unit Hub").
*   **Agnostic Interaction**: Sidebar for Desktop; Bottom Navbar + Drawer sheets for Mobile.

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
5.  **Thin Context Protocol**: Individual turns for each note to maintain stability on weak models.
6.  **Density Optimization**: All UI components must prioritize information density over whitespace. Use compact font sizes (`text-sm` or smaller for UI elements) and tight padding to maximize screen utility.
