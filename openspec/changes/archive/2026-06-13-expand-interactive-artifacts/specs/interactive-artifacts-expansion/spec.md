## ADDED Requirements

### Requirement: Unified Sandbox Render Component
The system SHALL parse Markdown text for `<artifact>` and `<sandbox-spec>` blocks using a client-side XML parser and render them in a split-pane layout using a shared component called `UnifiedSandboxViewer`.

#### Scenario: Parse and render streaming chat artifacts
- **WHEN** the AI Tutor chat streams an explanation containing `<artifact>` or `<sandbox-spec>` tags
- **THEN** the desktop client SHALL immediately split the viewport and display the interactive sandbox panel on the right side

#### Scenario: Render saved artifacts in Obsidian note viewer
- **WHEN** a user opens an Obsidian note containing `<artifact>` blocks in the note viewer
- **THEN** the editor page SHALL parse the markdown and automatically open the split-pane preview displaying the compiled HTML simulator

### Requirement: Loop Guard Watchdog
The system SHALL intercept and post-process LLM-generated JavaScript before injecting it into the iframe, inserting counter-based watchdog loops to prevent browser freezes.

#### Scenario: Halting infinite loops in sandbox
- **WHEN** a JavaScript script inside the sandbox attempts to run a `while` or `for` loop that exceeds 1,000,000 iterations
- **THEN** the injected loop guard SHALL throw a runtime exception, halting loop execution, and trigger the self-healing error flow

### Requirement: Offline Error Warning
The system SHALL check for network connectivity and sidecar availability before invoking code generation.

#### Scenario: Compiling new sandboxes when offline
- **WHEN** the system attempts to compile a new `<sandbox-spec>` block while offline
- **THEN** the sandbox preview panel SHALL display a styled offline error card explaining that internet connectivity is required to compile the simulator

### Requirement: Parameter State Persistence
The system SHALL support saving simulator variables in the parent note's frontmatter properties for note-viewing sessions, while isolating practice arena sessions.

#### Scenario: Saving state in Obsidian Note Viewer
- **WHEN** a user modifies a slider or parameter in the note viewer's simulator panel and clicks save
- **THEN** the system SHALL serialize the parameters and write them to the Obsidian note's frontmatter `state` property

#### Scenario: Isolated session state during practice
- **WHEN** a user adjusts parameters in the Practice Arena's simulator panel during an FSRS active recall quiz
- **THEN** the changes SHALL remain session-isolated and SHALL NOT overwrite the source Atomic Note in the vault
