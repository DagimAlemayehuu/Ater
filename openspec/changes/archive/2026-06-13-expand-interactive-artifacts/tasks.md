## 1. Unified Components & Refactoring

- [x] 1.1 Create `UnifiedSandboxViewer.tsx` component consolidating rendering, XML parsing, postMessage boundaries, and pre-injected styles.
- [x] 1.2 Refactor `ArtifactViewer.tsx` and `AterExplainDialog.tsx` to replace duplicate rendering code with `UnifiedSandboxViewer`.

## 2. Loop-Guard Preprocessor

- [x] 2.1 Implement client-side JavaScript loop-guard preprocessor in `sandbox.ts` to inject iteration watchdogs inside `while` and `for` statements.
- [x] 2.2 Update runtime error catching scripts in the sandbox iframe to handle watchdog loop-halt exceptions.

## 3. Offline Verification & Warning UI

- [x] 3.1 Add network connectivity and sidecar health checking hooks before triggering sandbox compilation.
- [x] 3.2 Build styled offline warning card layout to display in the sandbox panel when offline with no cached code available.

## 4. Parameter State Saving & Routing

- [x] 4.1 Configure `UnifiedSandboxViewer` to check active route and distinguish note-viewing routes from review/practice routes.
- [x] 4.2 Implement parameter serialization and update Obsidian file writer command to persist slider state in note frontmatter.
- [x] 4.3 Ensure practice sessions in `practice.tsx` and `MiniPracticeUI.tsx` isolate states and run in session-only memory.

## 5. Backend Socratic Prompts

- [x] 5.1 Refine system tutor prompts in `ai.py` to specify declarative presets (Math Plotter, Node Graph) for minor explanations.

## 6. Verification & Automated Tests

- [x] 6.1 Write unit tests for loop-guard counter preprocessor checking infinite loop halt behaviors.
- [x] 6.2 Complete manual verification for infinite loop recovery, offline error triggers, and note parameter saving.
