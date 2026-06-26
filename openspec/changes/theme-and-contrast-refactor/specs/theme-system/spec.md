## MODIFIED Requirements

### Requirement: Dynamic Component Theme Switch
All layout screens, panels, sidebar, header, and components SHALL use Tailwind theme-aware classes instead of hardcoded hex colors to dynamically adapt to the active theme. Furthermore, to maintain readability and contrast consistency across both themes:
1. All button backgrounds SHALL utilize adaptive de-warmed industrial gray scales.
2. In light mode, button backgrounds SHALL NEVER be completely black or dark gray with low contrast text (e.g. `#111113`, `#0e0e0f`, `#000000`, or `#262626`).
3. In dark mode, button backgrounds SHALL NEVER be pure white or light gray (e.g. `#ffffff` or `#ebebeb`).

#### Scenario: Switching active theme
- **WHEN** the active theme is toggled between 'light' and 'dark'
- **THEN** the root `<html>` element class list SHALL be updated with the active theme class and all dependent components and buttons SHALL transition their backgrounds and text styles automatically to preserve proper contrast and avoid pure black/white background states.
