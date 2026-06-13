## Why

Currently, Ater's interactive simulator and sandboxing features (introduced in `add-interactive-artifacts`) are restricted to a single chat explanation dialog. To maximize the pedagogical power of Ater, students need dynamic visual simulations to be active across all key learning viewports (the main AI Chat, the Obsidian Note Viewer, the FSRS Practice Arena, and Mini-Practice Popups) with robust loop-guard protection and offline error handling.

## What Changes

- **Unified Sandbox Viewer Component**: Standardize rendering on a single, shared frontend React component (`UnifiedSandboxViewer`) that handles XML parsing, iframe rendering, and error trapping.
- **Surface Integrations**:
  - **AI Chat Dialog**: Slide open the right-side split-pane when streaming tutor answers contain artifacts.
  - **Obsidian Note Viewer**: Parse note content on open and render the associated interactive simulation in a sidecar drawer or split-pane.
  - **Practice Arena**: Embed the interactive simulator alongside/above active recall cards during spaced-repetition reviews.
  - **Mini-Practice / Quizzes**: Render mini-sandbox controllers for code-tracing or state-analysis questions.
- **Parameter State Persistence**: Save adjusted simulator parameters directly into the note's frontmatter properties for main note viewing, while keeping practice attempts session-isolated and independent.
- **Model Prompt Guidance**: Limit tutor models to declarative presets (Math Plotter, Node Graph) for minor explanations, reserving custom HTML/JS code generation for major lessons.
- **Infinite Loop Watchdog**: Pre-process LLM-generated JavaScript inside the sandbox to inject loop guard watchdog counters, preventing browser thread lockups from bad loops.
- **Offline Error Handling**: Detect network states and render clear error warning layouts when trying to compile new sandbox specifications offline.

## Capabilities

### New Capabilities
- `interactive-artifacts-expansion`: Broaden sandbox rendering, state saving, loop guards, and offline alerts across Chat, Note, and Practice viewports.

### Modified Capabilities
None.

## Impact

- **Frontend (`apps/desktop/src`)**:
  - `routes/agents.tsx`: Integrate unified sandbox parser and drawer triggers.
  - `routes/obsidian.tsx`: Parse note body for artifacts and render the split-pane viewer.
  - `routes/practice.tsx`: Display card-specific simulators during reviews.
  - `components/MiniPracticeUI.tsx`: Render dynamic quiz sandboxes.
  - `lib/artifacts/sandbox.ts`: Inject loop-guard counters and check connection status.
- **Backend (`apps/api/src`)**:
  - `api/routers/ai.py`: Refine prompts to guide tutor models on template usage vs. generative code.
