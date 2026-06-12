## Context

Ater is a Tauri application built with React, Supabase, and a Python/FastAPI sidecar. It features an AI Tutor chat (`AterExplainDialog`) that provides explanations of academic concepts. Currently, interactive widgets (e.g., `RubiksCubeWidget`) are hardcoded into the frontend, and the rendering logic (`InteractiveLessonRenderer`) is restricted to specific matched file names.

To allow Ater to dynamically teach any subject with dynamic simulators, we need a flexible "Artifacts" panel. Crucially, the system must work with weak, free models (<20B and 2B parameters) that have limited coding capabilities and struggle to produce syntactically valid JSON.

## Goals / Non-Goals

**Goals:**
- Implement a collapsible and resizable side-by-side Artifact pane in the React client.
- Support history dropdowns to browse multiple active artifacts in a thread and traverse their edit versions (`v1`, `v2`, etc.).
- Build a robust XML stream parser that translates `<artifact>`, `<chapter>`, and `<sandbox>` tags into an interactive slideshow.
- Create an isolated IFrame sandbox wrapper that injects Ater's visual system (Tailwind, Outfit font, HSL color tokens) into LLM-generated HTML.
- Build a client-side Javascript error catcher inside the IFrame that reports errors back to the host, triggering a silent self-healing LLM prompt.
- Update the chat history context to feed the active artifact's current code back to the LLM for iterative conversational modifications.

**Non-Goals:**
- Server-side sandboxing of node or python code.
- Compiling complex multi-file React/Vue bundles on the fly.
- Direct WebGL/3D model asset generation (must use standard canvas, SVG, or prebuilt CDN script libraries).

## Decisions

### Decision 1: XML Parser over JSON for Stream Extraction
- **Rationale**: Small models frequently fail to output valid JSON (unclosed brackets, unescaped quotes). In contrast, XML tags are easy for 2B models to write, and can be parsed progressively during token streaming using simple regular expressions.
- **Alternatives**: Code blocks (e.g., ````json). Rejected due to high failure rate on small models.

### Decision 2: Decoupled Two-Stage Generation for Custom Simulators
- **Rationale**: Generating educational prose and functional Javascript in the same turn dilutes the model's focus. The model will write the lesson text first and output a small spec tag: `<sandbox-spec>Linear interpolation graph</sandbox-spec>`. The host immediately renders the text and triggers a silent, hidden LLM call: *"Generate a self-contained HTML/JS snippet implementing: Linear interpolation graph. No prose, raw code only."*
- **Alternatives**: Single-pass generation. Rejected due to code fragility.

### Decision 3: Sandboxed IFrame with Host Injection
- **Rationale**: To prevent styling pollution and security issues (XSS), the code executes in an iframe with `sandbox="allow-scripts"`. To keep LLM code short, the host wrapper automatically injects Tailwind CSS CDN, the Google Outfit font, and Ater's dark gray palette CSS variables.
- **Alternatives**: Shadow DOM. Rejected due to high security risk (access to Tauri/Rust native commands).

### Decision 4: window.onerror postMessage for Self-Healing
- **Rationale**: We inject a standard error handling script into the iframe wrapper. If a runtime JS error occurs, it reports the traceback back to the host React app using `window.parent.postMessage`. The host displays a "Self-healing..." loading indicator and issues a background correction prompt to fix the code.
- **Alternatives**: Manual error display. Rejected as it frustrates the learning flow.

## Risks / Trade-offs

* **[Risk] Infinite loops in self-healing**
  - *Mitigation*: Limit the background repair loops to a maximum of 3 retries. If the 3rd attempt still throws an error, halt the loop and display the Code View alongside an manual error log and "Retry" option.
* **[Risk] Mouse pointer lockup during drag-resize**
  - *Mitigation*: When dragging the split-pane resize handler, place a transparent overlay `div` on top of the iframe to prevent mouse events from getting trapped inside the iframe canvas.
* **[Risk] XML tag truncation**
  - *Mitigation*: If the stream terminates before closing the `<artifact>` tag, the parser automatically appends closing tags at the end of the received buffer to prevent layout breakage.
