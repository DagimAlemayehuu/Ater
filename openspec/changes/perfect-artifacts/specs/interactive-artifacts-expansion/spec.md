## MODIFIED Requirements

### Requirement: Unified Sandbox Render Component
The system SHALL parse Markdown text for `<artifact>` and `<sandbox-spec>` blocks using a client-side XML parser and render them in a split-pane layout using a shared component called `UnifiedSandboxViewer`.

#### Scenario: Parse and render streaming chat artifacts
- **WHEN** the AI Tutor chat streams an explanation containing `<artifact>` or `<sandbox-spec>` tags
- **THEN** the desktop client SHALL immediately split the viewport and display the interactive sandbox panel on the right side

#### Scenario: Render saved artifacts in Obsidian note viewer
- **WHEN** a user opens an Obsidian note containing `<artifact>` blocks in the note viewer
- **THEN** the editor page SHALL parse the markdown and automatically open the split-pane preview displaying the compiled HTML simulator

#### Scenario: Auto compile sandbox specs in Obsidian Note Viewer
- **WHEN** a user opens an Obsidian note containing `<sandbox-spec>` blocks in the note viewer and the sandbox code is missing
- **THEN** the system SHALL automatically trigger FastAPI sidecar generation and compile the sandbox simulator using the note content as context

### Requirement: Loop Guard Watchdog
The system SHALL intercept and post-process LLM-generated JavaScript before injecting it into the iframe, inserting counter-based watchdog loops to prevent browser freezes.

#### Scenario: Halting infinite loops in sandbox
- **WHEN** a JavaScript script inside the sandbox attempts to run a `while` or `for` loop that exceeds 1,000,000 iterations
- **THEN** the injected loop guard SHALL throw a runtime exception, halting loop execution, and trigger the self-healing error flow

#### Scenario: Halting infinite do while loops in sandbox
- **WHEN** a JavaScript script inside the sandbox attempts to run a `do` `while` loop that exceeds 1,000,000 iterations
- **THEN** the injected loop guard SHALL throw a runtime exception, halting loop execution, and trigger the self-healing error flow

### Requirement: Offline Error Warning
The system SHALL check for network connectivity and sidecar availability before invoking code generation.

#### Scenario: Compiling new sandboxes when offline
- **WHEN** the system attempts to compile a new `<sandbox-spec>` block while offline
- **THEN** the sandbox preview panel SHALL display a styled offline error card explaining that internet connectivity is required to compile the simulator

#### Scenario: Retrying compilation after network error clears active error state
- **WHEN** a sandbox compilation has failed due to offline status or unreachable sidecar, and the user clicks retry connection
- **THEN** the system SHALL check health and connectivity, clear the active compile error state, and automatically re-trigger sandbox compilation if connection is restored
