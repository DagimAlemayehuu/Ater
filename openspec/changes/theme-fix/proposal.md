## Why

The current desktop application frontend has inconsistent and incomplete dark/light theme switching. A significant number of styling classes are hardcoded for dark mode (using raw background and border colors like `bg-[#1a1a1c]` or `border-[#242426]`), which do not change when the light theme is active. In addition, theme persistence relies on cookies, which are unreliable inside Tauri WebViews, causing theme settings to be lost on application restarts. Furthermore, rich client-side components like CodeMirror, Mermaid diagrams, and PDF viewers do not adapt their internal themes dynamically when the app-wide theme changes.

## What Changes

- **DRM/Theme Persistence**: Migrate theme persistence from cookies (`getCookie`, `setCookie`) to `localStorage` in `theme-provider.tsx` to ensure reliable persistence inside Tauri WebViews.
- **Theme Variables Standardization**: Refactor all hardcoded layout/component styling (backgrounds, borders, inputs, and text colors) to standard Tailwind theme variables (`bg-background`, `bg-card`, `border-border`, `text-foreground`, etc.).
- **Rich Component Dynamic Theme Syncing**:
  - Dynamically load CodeMirror's `oneDark` theme or light theme configurations in `ObsidianEditor.tsx` based on the active theme.
  - Dynamically re-render and style Mermaid diagrams with matching light/dark theme variables when the user toggles the theme.
  - Update `PdfViewer.tsx` to automatically listen and propagate the active theme to the PDF rendering sidecar.

## Capabilities

### New Capabilities
- `theme-system`: A fully responsive dark/light theme toggle mechanism that reliably persists via `localStorage`, updates all UI component backgrounds, text, and borders dynamically, and propagates theme state to specialized renderers (CodeMirror, Mermaid, PDF sidecar).

### Modified Capabilities

## Impact

- `theme-provider.tsx`: Storage mechanism changes from cookies to `localStorage`.
- All desktop screens/components in `apps/desktop/src/components` and `apps/desktop/src/routes` that currently use hardcoded background/border colors (e.g. `bg-[#111113]`, `border-[#242426]`).
- `ObsidianEditor.tsx`, `MarkdownViewer.tsx`, `PdfViewer.tsx`: Custom theme handlers will be implemented/updated.
