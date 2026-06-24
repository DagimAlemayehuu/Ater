## ADDED Requirements

### Requirement: Resizable Split-Pane Layout
The system SHALL render a unified study console split-pane consisting of the Chat Companion (left) and the Note Canvas (right) with a draggable separator handler.

#### Scenario: Dragging the divider to resize
- **WHEN** the user hovers over the separator handler and drags left or right
- **THEN** the system SHALL dynamically resize both viewports in real-time, respecting a minimum 20% width boundary for both panes

#### Scenario: Snapping pane to edge collapse
- **WHEN** the user drags the separator past 80% width toward either edge
- **THEN** the system SHALL snap that side shut and compress it into a 16px wide vertical tab on the margin

#### Scenario: Ambient edge notification pulse
- **WHEN** the chat pane is collapsed and a background message or event is fired
- **THEN** the collapsed tab SHALL emit a slow, pulsing border highlight in the primary accent gray to alert the user

### Requirement: Dynamic Curriculum Planner
The system SHALL support a gated planning loop in the chat stream when a user requests learning a new technical concept.

#### Scenario: Displaying proposed syllabus plan
- **WHEN** the user requests a curriculum (e.g., "Teach me ColBERT")
- **THEN** the system SHALL search web sources, analyze the academic domain, and display a plan card listing chapters and proposed Atomic Notes

#### Scenario: Editing plan via conversation
- **WHEN** the user types requests to change, remove, or add notes to the proposed list
- **THEN** the system SHALL update the planner card details to reflect the changes in real-time

#### Scenario: Confirming plan starts generation
- **WHEN** the user clicks the "Confirm & Ingest" button on the planner card
- **THEN** the system SHALL begin generating the notes in the background and show a progress list

### Requirement: Progressive Note Ingestion and Rendering
The system SHALL monitor the Obsidian vault path and load notes dynamically as they are written by the sidecar.

#### Scenario: Progressive note loading during batch compilation
- **WHEN** a note in the active curriculum is successfully compiled and written to the local disk
- **THEN** the system SHALL immediately list the note as complete in the progress card and load it in the Note Canvas for reading

### Requirement: Mistake Diagnostic Loop
The system SHALL diagnose user mistakes during active recall sessions and append the misconceptions directly to the active note.

#### Scenario: Diagnostic feedback on wrong quiz answer
- **WHEN** the user submits an incorrect answer to a quiz question
- **THEN** the system SHALL output a step-by-step diagnostic breakdown explaining why the answer is wrong and the correct mental model

#### Scenario: Note modification with custom misconception
- **WHEN** a mistake is diagnosed
- **THEN** the system SHALL automatically edit the corresponding Obsidian note in the vault, appending the user's specific misconception to a new "My Common Misconceptions" section in the file
