## 1. Theme Provider and Persistence Migration

- [ ] 1.1 Modify `theme-provider.tsx` to read theme preference from `localStorage` instead of cookies, and update helper functions.
- [ ] 1.2 Modify `theme-provider.tsx` to write/remove theme preference from `localStorage` upon theme change.
- [ ] 1.3 Ensure `useTheme` correctly returns the active theme and `resolvedTheme`.

## 2. Hardcoded Color Auditing and Refactoring

- [ ] 2.1 Replace hardcoded panel background colors (e.g. `bg-[#151517]`, `bg-zinc-50`) in components and routes with `bg-bento-panel`, `bg-card`, etc.
- [ ] 2.2 Replace hardcoded inner content colors (e.g. `bg-[#111113]`, `bg-white`, `bg-[#1a1a1c]`, `bg-[#18181b]`) with `bg-bento-bg`, `bg-bento-card`, `bg-background` or theme-aware values.
- [ ] 2.3 Replace hardcoded border classes (e.g. `border-[#242426]`, `border-zinc-200`) with `border-border` or `border-sidebar-border`.
- [ ] 2.4 Replace hardcoded text and hover colors across routes (like `settings.tsx`, `practice.tsx`, `obsidian.tsx`, `agents.tsx`, `academic.tsx`) to support light mode readability.

## 3. Specialized Renderers Theme Integration

- [ ] 3.1 Update `ObsidianEditor.tsx` to dynamically switch CodeMirror editor themes (swapping between `oneDark` and light theme extensions) based on `resolvedTheme`.
- [ ] 3.2 Update `MarkdownViewer.tsx` to re-configure and re-render Mermaid diagrams when the active theme is updated.
- [ ] 3.3 Update `PdfViewer.tsx` to pass the correct active theme query parameter to the PDF viewer sidecar and reload the iframe dynamically.

## 4. Verification and QA

- [ ] 4.1 Validate code quality and format by running linter and typescript checks.
- [ ] 4.2 Run the desktop application to verify dark and light themes on every screen.
