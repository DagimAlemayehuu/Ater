## 1. Split-Pane Workspace Layout (Frontend UI)

- [ ] 1.1 Create the draggable vertical divider handle component that tracks drag state.
- [ ] 1.2 Implement the pane flex width calculations with a 20% minimum size boundary constraint.
- [ ] 1.3 Implement the 80% snapping threshold to collapse panes into edge sidebars.
- [ ] 1.4 Render vertical margin tabs for collapsed states and wire click handlers to restore split.
- [ ] 1.5 Add keyframe CSS pulse animations and states to trigger edge glow highlights upon background alerts.

## 2. Dynamic Curriculum Planner Card (Frontend UI)

- [ ] 2.1 Implement the `CurriculumPlannerCard` visual widget with Searching, Proposed, Generating, and Completed states.
- [ ] 2.2 Implement inline text inputs and edit buttons within the `Proposed` list to allow syllabus edits.
- [ ] 2.3 Add the "Confirm & Ingest" trigger button to initiate background note generation.

## 3. Ingestion & Progressive Loading (Tauri & Sidecar)

- [ ] 3.1 Build web-search and RAG syllabus planning endpoints in the FastAPI sidecar.
- [ ] 3.2 Implement a directory watcher using the Rust `notify` crate in the Tauri backend to monitor active units.
- [ ] 3.3 Emit Tauri IPC events to the React client when a new note file is created.
- [ ] 3.4 Bind IPC watcher events to auto-load completed notes progressively into the Note Canvas.

## 4. Active Diagnostics & Misconceptions Loop (AI Engine)

- [ ] 4.1 Update the sidecar's Active Recall evaluation prompt to generate structured diagnostic feedback on incorrect answers.
- [ ] 4.2 Implement a YAML-frontmatter and Markdown parser helper to append "My Common Misconceptions" sections to vault notes.
