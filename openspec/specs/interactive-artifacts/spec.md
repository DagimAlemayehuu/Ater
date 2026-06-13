# Interactive Artifacts Spec

## Purpose
This specification defines the core requirements for XML-based interactive lesson artifacts, split-pane Tauri/React rendering, runtime loop protection, and automatic healing of LLM-generated JavaScript.

## Requirements

### Requirement: XML Parsing of Lesson Artifacts
The system SHALL parse custom XML tags (`<artifact>`, `<chapter>`, and `<sandbox>`) in LLM response streams, extracting structured data without relying on strict JSON formats.

#### Scenario: Parse a complete XML artifact structure
- **WHEN** the chat parser detects a fully closed `<artifact>` block containing `<chapter>` and `<sandbox>` tags
- **THEN** it registers a new entry in the artifact state manager containing the chapters, title, and custom HTML/JS payload

#### Scenario: Progressive rendering of streaming tags
- **WHEN** the assistant stream emits incomplete, streaming XML tags in real-time
- **THEN** the parser progressively parses the content and updates the view state without throwing fatal parsing errors

### Requirement: Asymmetric Split-Pane Layout UI
The system MUST render a split-screen panel (Tauri/React) with expand/collapse buttons and drag-to-resize controls when an artifact is active.

#### Scenario: Open split-pane automatically on generation
- **WHEN** a new `<artifact>` block is successfully parsed from the chat message stream
- **THEN** the right pane slides open automatically to display the preview canvas

#### Scenario: Toggle panel visibility manually
- **WHEN** the user clicks the collapse button or drags the split border to 0% width
- **THEN** the artifact panel hides, restoring full width to the chat panel

### Requirement: Low-LLM-Dependency Sandbox Generation
The system SHALL wrap the LLM's custom HTML/JS sandbox code in a host template injecting Tailwind CSS, Outfit fonts, CSS dark-mode system colors, and common JS libraries inside a sandboxed iframe.

#### Scenario: Inject layout boilerplate into iframe
- **WHEN** a custom widget code block inside a `<sandbox>` tag is loaded
- **THEN** the host wraps it with Tailwind CSS CDN, Outfit font links, and CSS theme variables before writing to `srcDoc`

### Requirement: JS Error Detection & Self-Healing Loop
The system SHALL catch unhandled Javascript errors inside the sandboxed iframe and automatically dispatch a background repair request to the LLM to heal the code.

#### Scenario: Capturing runtime errors and triggering repair
- **WHEN** a script execution exception occurs inside the sandboxed iframe
- **THEN** the iframe transmits the error trace to the host app using `postMessage`, displaying a "Self-healing in progress..." notification and launching a silent refinement LLM query

### Requirement: Interactive Versioning and History Navigation
The system SHALL support chapter navigation within artifacts, switching between multiple active artifacts, and traversing edit version history.

#### Scenario: Navigating chapters in split-pane
- **WHEN** the user clicks the "Next" or "Back" buttons in the lesson navigation footer
- **THEN** the right pane switches the active slide and renders the corresponding content, preserving global lesson cache states
