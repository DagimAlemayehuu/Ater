## Context

The current Tauri-based desktop application frontend has inconsistent theme implementation. Multiple React components and page routes contain hardcoded dark colors (such as hex values `#111113`, `#151517`, `#1a1a1c`, `#232326`, and border color `#242426`) instead of using Tailwind theme variables. This prevents screens from updating to light mode when the theme is toggled. Additionally, the theme provider stores configuration in cookies, which do not persist reliably on app restarts inside Tauri WebViews, and third-party tools (CodeMirror, Mermaid, PDF Sidecar) are not dynamically synced to theme changes.

## Goals / Non-Goals

**Goals:**
- Guarantee theme state is reliably persisted across application restarts using `localStorage`.
- Ensure all screens, layouts, components, inputs, and borders dynamically and fully swap styles between light and dark modes.
- Propagate the active theme to dynamic components like CodeMirror (editor theme), Mermaid diagrams, and the PDF sidecar.
- Support system preferences (`prefers-color-scheme`) correctly inside the Tauri environment.

**Non-Goals:**
- Implementing additional themes beyond 'light', 'dark', and 'system'.
- Refactoring layout topologies or core visual geometry (rounded corners vs. sharp edges).

## Decisions

### 1. Persistent Storage Mechanism: `localStorage` over Cookies
- **Rationale:** Tauri runs inside platform-specific WebViews (WebKit/Webview2). WebViews frequently clear or restrict cookie persistence across restarts or sandbox boundaries. `localStorage` is universally and consistently persistent across restarts in Tauri.
- **Alternatives Considered:** Tauri's official Store plugin (unnecessary complexity for a single theme variable), file-based JSON config read/write via Tauri API (slower than synchronous Web API `localStorage`).

### 2. Standardizing Hardcoded Colors to Semantic Variables
- **Rationale:** Replacing hardcoded hex classes like `bg-[#111113]` with Tailwind utility classes that reference CSS custom variables (e.g. `bg-background`, `bg-card`, `bg-bento-bg`, `bg-bento-panel`, `border-border`) ensures that changing the class list on the root `<html>` element dynamically switches all component colors.
- **Mapping Guide:**
  - `bg-[#111113]` -> `bg-bento-bg`
  - `bg-[#151517]` -> `bg-bento-panel`
  - `bg-[#1a1a1c]` -> `bg-bento-card`
  - `bg-[#232326]` -> `bg-bento-item`
  - `border-[#242426]` -> `border-border`
  - `bg-[#18181b]` -> `bg-muted` or `bg-accent`

### 3. Dynamic CodeMirror Themes
- **Rationale:** Currently, `ObsidianEditor.tsx` hardcodes the CodeMirror `oneDark` theme. We will wrap the editor instantiation in a hook or effect that reads `resolvedTheme` from `useTheme()` and dynamically supplies either `oneDark` (for dark mode) or standard/light editor themes.

### 4. Mermaid Diagram Dynamic Theming
- **Rationale:** Mermaid graphs render to SVG. The configuration needs to specify the theme (`dark` vs `default`) and reinitialize when the resolved theme state shifts.

### 5. PDF Sidecar Theme Parameter Update
- **Rationale:** The local PDF sidecar viewer receives a `theme=dark` or `theme=light` query parameter. We will modify `PdfViewer.tsx` to include the current `resolvedTheme` in its dependency array for generating the viewer iframe source URL.

## Risks / Trade-offs

- **[Risk]** Unmapped inline classes: Some nested components might still hold hardcoded colors.
  - *Mitigation:* Conduct a codebase-wide audit using `grep` search for hex values like `#1` or `#2` in `apps/desktop/src` to identify all hardcoded style attributes.
- **[Risk]** Flashing/Theme Desync: If Tauri loads index.html before theme is initialized from `localStorage`.
  - *Mitigation:* Ensure theme retrieval is immediate and synchronous during application bootstrap in `theme-provider.tsx` and run side-effects on window mount.
