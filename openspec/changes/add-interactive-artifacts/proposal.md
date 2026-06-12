## Why

Enable students and self-learners to receive fully dynamic, interactive lessons with live-rendered simulations in Ater, matching modern split-screen "Artifact" architectures (like Claude and Gemini). By offloading logic to host-guided scripts, utilizing XML parsing, and establishing a background self-healing correction loop, this system enables high-fidelity interactive elements to function reliably even with very small LLMs (<20B and <2B parameters).

## What Changes

- **Asymmetric Split-Pane Layout**: Introduce a collapsible and resizable side-by-side UI panel in the Tauri desktop application containing the active interactive lesson/sandbox.
- **Multi-Artifact History & Versioning**: Support dropdown selection to switch between different generated artifacts and a version controller (`v1`, `v2`, etc.) to jump between historical edits.
- **Low-LLM-Dependency Sandbox**: Iframe sandbox wrapping LLM outputs with pre-configured boilerplates (Tailwind CSS CDN, Outfit font, HSL system color variables, and standard JS plotting helpers) so small models do not have to write layout code.
- **Error Trapping & Self-Healing**: Automated detection of iframe runtime Javascript exceptions via message passing (`postMessage`), triggering silent background LLM revision loops to repair broken widgets.
- **Streamlined XML Parsing**: Transition from strict, error-prone JSON parsing to a resilient XML-based parser (supporting `<artifact>`, `<chapter>`, and `<sandbox>` tags) that is highly compatible with weak model outputs.
- **Artifact Iteration Protocol**: Update LLM system prompts and context pipelines to inject the current active artifact, allowing users to modify, expand, or fix simulators via follow-up chat prompts.

## Capabilities

### New Capabilities

- `interactive-artifacts`: Implementation of sandboxed iframe preview canvas, host injection scripts, HTML/JS self-healing loops, XML lesson parsing, and split-pane version history layout.

### Modified Capabilities

None.

## Impact

- **Frontend (`apps/desktop/src`)**:
  - `components/obsidian/AterExplainDialog.tsx`: Expand to support split-pane trigger, toggle events, and follow-up updates.
  - `components/obsidian/MarkdownViewer.tsx`: Update parser hooks to intercept custom XML `<artifact>` and `<sandbox>` tags.
  - `components/obsidian/ArtifactViewer.tsx` [NEW]: Component to display tabs (Preview vs Code), version switcher, and iframe frame.
- **Backend (`apps/api/src`)**:
  - `api/routers/ai.py`: Update tutor prompts to yield the new XML format.
  - `domains/ater/tutor.py`: Inject previous active artifact states into prompt messages context.
