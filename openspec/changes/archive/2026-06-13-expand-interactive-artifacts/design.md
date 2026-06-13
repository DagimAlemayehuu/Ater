## Context

Ater recently introduced interactive sandboxes in the AI Tutor explanation panel. The implementation uses a two-stage code generation pipeline (prose chapters first, then custom code) combined with a background self-healing retry loop. However, this feature is confined to the tutor chat dialog. To realize the full potential of this visual approach, interactive sandbox rendering must be standardized and exposed across the Obsidian Note Viewer, the FSRS Practice Arena, and Mini-Practice Popups. Furthermore, issues regarding browser locks from infinite loops, offline operation, and parameter saving must be resolved.

## Goals / Non-Goals

**Goals:**
- Create a unified `UnifiedSandboxViewer` component shared across Chat, Note Editor, Practice, and Quiz views.
- Implement a loop guard processor in the host to rewrite generated JS and prevent infinite loop freezes.
- Build offline network checkers that intercept compilation and display styled warning cards when network connection is missing.
- Define a dual state-saving mechanism: persistent note frontmatter saving for note-viewing, and session-isolated state for reviews.
- Modify the AI Tutor system prompts to restrict HTML/JS generation to major lessons, favoring simple declarative templates otherwise.

**Non-Goals:**
- Creating a full server-side compiler/packer inside the FastAPI sidecar.
- Modifying core FSRS scheduling algorithms or the structure of `ater.db`.

## Decisions

### Decision 1: Shared UnifiedSandboxViewer Component
- **Rationale**: standardizing on a single component ensures that the complex XML parser, postMessage error boundaries, prebuilt CDN injections, and self-healing requests are identically executed and styled across all views.
- **Alternatives**: separate iframe components per view. Rejected due to code duplication and visual consistency drift.

### Decision 2: Client-Side Regex Loop-Guard Injection
- **Rationale**: Before injecting the generated code into the iframe `srcDoc`, the host pre-processes the JS blocks using a regex loop-guard compiler that inserts safety counters inside `while` and `for` statements. If a loop exceeds 1,000,000 iterations, the counter throws an error, halting the thread and triggering the healer.
- **Alternatives**: Web Workers. Rejected because weak LLMs struggle to modularize code into distinct worker scripts, whereas single-file HTML/JS execution is highly predictable.

### Decision 3: Offline Sandbox Compilation Interception
- **Rationale**: When the host detects `navigator.onLine === false` or sidecar api connection failures, it checks the YAML frontmatter of the note for cached code. If cached, it executes it. If not, it halts generation and renders a styled warning card, preventing network timeout crashes.
- **Alternatives**: Let the LLM requests fail naturally. Rejected because standard network timeouts degrade user experience with unhandled promise errors.

### Decision 4: Route-Based Dual State Persistence
- **Rationale**: The state saving logic checks the active route. On `/obsidian` routes, parameters are saved to the note's frontmatter properties. On `/practice` routes, the variables are kept strictly in session-only React states, preventing practice attempts from writing back to vault files.
- **Alternatives**: Save parameters everywhere. Rejected because it would dirty Obsidian files with quiz-specific variables.

### Decision 5: Declarative Prompts for Simple Explanations
- **Rationale**: In `ai.py`, we instruct the Socratic Tutor prompt to default to prebuilt declarative widgets (Math Plotter, Node Graph) for minor explanations. Custom HTML/JS is reserved for full `<artifact>` lessons.
- **Alternatives**: Allow full custom HTML generation for any query. Rejected due to high generation latency and validation failures on minor tasks.

## Risks / Trade-offs

- **[Risk] Regex Loop-Guard Bypass**
  - *Mitigation*: Ensure the regex compiler covers all JavaScript loop variations (`while`, `for`, `do-while`, `.forEach`, `.map`). If a syntax parsing error occurs during rewrite, fallback to executing in sandboxed iframe without loop-guards.
- **[Risk] State Serialization Size**
  - *Mitigation*: Limit the stored `state` string in frontmatter to 500 characters, containing only simple key-value pairs.
