## 1. XML Parsing & Backend Context

- [x] 1.1 Implement client-side XML parser (`extractArtifacts`) to extract `<artifact>`, `<chapter>`, and `<sandbox>` tags progressively during streaming.
- [x] 1.2 Update the Socratic AI Tutor system prompt in `apps/api/src/api/routers/ai.py` to guide the model to output lessons in the XML format.
- [x] 1.3 Update backend router payload parser in `apps/api` to parse and inject previous active artifact code states into LLM chat history.

## 2. Split-Pane UI & React State Store

- [x] 2.1 Create a Zustand/React state store to track the list of active artifacts, versions, active chapters, and active iframe states.
- [x] 2.2 Implement the double-column Split-Pane UI layout in the Tauri desktop application with mouse pointer click-shield overlays.
- [x] 2.3 Add panel transition animations, expand/collapse toggles, drag-resize handles, and a version history dropdown.
- [x] 2.4 Integrate the split-pane trigger directly into `AterExplainDialog.tsx` to slide open the right pane upon detecting an artifact tag.

## 3. Isolated Sandbox & Self-Healing Runtime

- [x] 3.1 Build `SandboxIFrame.tsx` to handle writing code into `srcDoc` of a sandboxed `<iframe>` with `sandbox="allow-scripts"`.
- [x] 3.2 Add a host injector script that automatically appends Tailwind CDN, Outfit font links, and CSS theme variables into the iframe.
- [x] 3.3 Embed a script in the iframe wrapping `window.onerror` to forward stack traces to the host app via `window.parent.postMessage`.
- [x] 3.4 Implement a React error listener that triggers a "Self-healing..." loader and launches a background repair API request.
- [x] 3.5 Implement retry limits (max 3 attempts) and fallback error alerts displaying the raw Code View on failure.

## 4. Two-Stage Generation Pipeline

- [x] 4.1 Write code block parser to immediately render Stage 1 lesson text while displaying a placeholder card for `<sandbox-spec>` widgets.
- [x] 4.2 Build client-side React hooks to trigger a Stage 2 background api request for custom HTML/JS code generation.
- [x] 4.3 Create a new API router endpoint in Python sidecar (`/api/routers/ai.py`) to process code-only LLM queries.

## 5. Verification & Testing

- [x] 5.1 Write unit tests for the streaming XML parser checking for tolerance of truncated, unclosed tags.
- [x] 5.2 Write unit tests for the host script injector ensuring Tailwind CDN and variables are appended correctly.
- [x] 5.3 Build manual UI verification checklist to test resize layouts, self-healing corrections, and chapter navigation.
