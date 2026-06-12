## ADDED Requirements

### Requirement: Persistent LocalStorage Theme Storage
The system SHALL persist the theme configuration in `localStorage` to ensure setting persistence across desktop application restarts.

#### Scenario: Initial theme loading
- **WHEN** the desktop application starts and no theme is saved in `localStorage`
- **THEN** the theme SHALL fall back to the system media query settings and apply it to the root document class list

#### Scenario: Updating theme state
- **WHEN** the user selects 'light' or 'dark' using the theme switcher
- **THEN** the selection SHALL be saved in `localStorage` under the specified key and update the root document class list

### Requirement: Dynamic Component Theme Switch
All layout screens, panels, sidebar, header, and components SHALL use Tailwind theme-aware classes instead of hardcoded hex colors to dynamically adapt to the active theme.

#### Scenario: Switching active theme
- **WHEN** the active theme is toggled between 'light' and 'dark'
- **THEN** the root `<html>` element class list SHALL be updated with the active theme class and all dependent components SHALL transition their styles automatically

### Requirement: Dynamic Specialized Renderers Theme Syncing
The application SHALL propagate the active theme state to rich specialized components (CodeMirror, Mermaid diagrams, PDF viewer) to update their internal colors.

#### Scenario: CodeMirror editor theme update
- **WHEN** the resolved theme changes
- **THEN** the CodeMirror instance in the editor component SHALL dynamically apply the matching theme extension

#### Scenario: Mermaid diagram theme update
- **WHEN** the resolved theme changes
- **THEN** Mermaid SVGs SHALL re-render with the corresponding theme configuration

#### Scenario: PDF viewer theme update
- **WHEN** the resolved theme changes
- **THEN** the PDF viewer iframe source URL SHALL update its theme parameter and reload
