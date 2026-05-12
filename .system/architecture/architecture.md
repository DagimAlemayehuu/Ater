# System Architecture (Ater)

## 1. System Map & Technologies
*   `apps/desktop`: Tauri v2 (Rust) + React/Vite (TS, Tailwind, shadcn/ui)
*   `apps/mobile-client`: React/Vite (IIFE) + Scriptable Bridge
*   `apps/api`: Python FastAPI Sidecar (Desktop Only)

### Core Reasoning Engine: Ater v32.0 Oracle (Context-Aware & Massive Parallel)
1.  **Oracle Context Briefing**: Document pre-processing via `MetaScannerAgent` generates a global context summary, primary discipline detection, and core keywords before any note generation begins. This eliminates "chunk-level amnesia."
2.  **Law of Cognitive Anchoring**: Every atomic concept is anchored to a globally-detected domain mode during the planning phase. This prevents hallucinated domain modes (e.g., bio-ecology in a CS textbook) by enforcing strict persona compliance.
3.  **Singularity Parallel Protocol**: Massively parallelized generation loop for atomic notes, governed by the `TokenGovernor`. High-throughput concurrency is balanced by deterministic rate-limit protection.
4.  **2-Pass Generation Strategy**: Decouples technical theory (TheoryAgent) from pedagogical artifacts (PractitionerAgent).
5.  **Exoskeleton Assembler**: Combines theory, artifacts, and assessment into a single, structurally-sound knowledge asset.
6.  **Oracle Routing**: Upgraded `DomainRouter` uses LLM-assisted "Wisdom Routing" against a canonical taxonomy, fallbacking to deterministic keywords only when confidence is low.
7.  **Fail-Safe Token Sovereignty**: The `TokenGovernor` dynamically scales concurrency based on system pressure and Groq API status.

## 2. UI/UX Strategy
*   **Monochrome High-Fidelity**: Professional grayscale palette with premium typography (Inter/Outfit).
*   **Direct-Entry Architecture**: Navigation depth is minimized. Major modules (Agents, Settings) use direct-access entry points, bypassing intermediary lists.
*   **Direct-English Standard**: UI terminology must be "plain and direct." Avoid academic jargon (e.g., use "True/False" instead of "Binary", "Topic" instead of "Master Unit Hub").
*   **Agnostic Interaction**: Sidebar for Desktop; Bottom Navbar + Drawer sheets for Mobile.
*   **Integrated Study Architecture**: Navigation controls (Start Session, Next/Prev) are integrated directly into the Markdown content flow to maintain focus and context.
*   **High-Fidelity List Resolution**: Markdown lists are rendered with strict vertical alignment and sub-list detection to mirror Obsidian's native layout.

## 3. Storage Blueprint
*   **Desktop State**: Tauri secure store.
*   **Mobile State**: iOS Filesystem (`ater_config.json`).
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
