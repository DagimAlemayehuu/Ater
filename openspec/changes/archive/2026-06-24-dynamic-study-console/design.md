## Context

Ater's current desktop client separates note reading, practice exercises, and AI chat into distinct tabs. The note ingestion pipeline operates asynchronously in the background via the FastAPI sidecar, writing static markdown files to the local Obsidian vault.

This design integrates these distinct modules into a single, unified "Interactive Study Console" where the chat companion (left) acts as the interactive driver, and the note canvas (right) acts as the live-updating workspace.

## Goals / Non-Goals

**Goals:**
- Implement a resizable split-pane layout for the study view with custom drag-resizing, edge collapsing, and ambient notification states.
- Introduce an interactive Curriculum Planner card in the chat that aggregates search resources, drafts note lists, and halts until user confirmation.
- Implement progressive file ingestion, loading notes into the renderer the moment they are written to the local disk.
- Embed custom "My Common Misconceptions" injection during interactive recall evaluations.

**Non-Goals:**
- Modifying the underlying FSRS scheduling algorithm.
- Replacing the offline ONNX vector search engine with cloud RAG APIs.
- Introducing banned UI colors (violet, indigo, purple).

## Decisions

### 1. Resizable Split-Pane with DragSnapping
We will implement a custom drag-and-resize panel layout in React. 
- *Alternatives Considered*: Standard React libraries (e.g., `react-resizable-panels`).
- *Chosen Approach*: Lightweight React mouse listener state mapping. We use CSS grid or flexbox with direct width calculations based on clientX.
- *Rationale*: Keeps bundle size minimal, ensures zero-lag alignment of Monaco and visual sandboxes, and gives us direct programmatic control over collapse snapping thresholds (<20% or >80%) and edge tabs.

### 2. Gated Planning State Machine
The chat message UI will support a new interactive widget block: `CurriculumPlannerCard`.
- *States*:
  1. `SEARCHING`: Web search and RAG extraction in progress.
  2. `PROPOSED`: Render proposed syllabus list (Chapters and Notes) with inline text inputs.
  3. `GENERATING`: Asynchronous note-by-note progress bar.
  4. `COMPLETED`: Collapsed summary of generated curriculum.
- *Confirm Action*: Generates a `ConfirmCurriculum` Tauri command, triggering the FastAPI Sidecar generation task.

### 3. Progressive Note File Ingestion
- *Mechanism*: The Tauri backend will spawn a directory file watcher (using the Rust `notify` crate) targeting the active course/unit subfolders. 
- *Rationale*: As soon as the Python sidecar finishes writing an Atomic Note file to the Obsidian vault, the file-watcher fires an event, allowing the React UI to list and open it immediately, avoiding waiting for the entire batch to finish.

### 4. Interactive Sandbox Insertion
- *Integration*: Replace standard markdown renderer logic inside Ater for specific markdown extensions. 
- *Mechanism*: When rendering a note, if a custom block (e.g., `<sandbox-spec>`) is found, Ater intercepts it and mounts a visual React simulator (e.g., interactive graph, state trace tool) inline instead of static code text.

## Risks / Trade-offs

- **Risk**: Excessive web search delay causing the chat to feel frozen during the planning phase.
  - *Mitigation*: Stream intermediate planning steps (`[Web Search Complete]`, `[Parsing 3 URLs...]`) to the user to keep the interface highly responsive.
- **Risk**: Dynamic note updates (misconceptions injection) corrupting standard Obsidian YAML headers.
  - *Mitigation*: Perform all YAML frontmatter updates through a centralized helper function in the FastAPI sidecar (`update_academic_record`) using strict schema validation.
