# SDLC State

Status: archived
Active Change:
GitHub Issue: #8
Branch:
Worktree:
Base Branch: main
Run File: .sdlc/run.json

## Harness Health
- OpenSpec: /opt/homebrew/bin/openspec (Available)
- GitHub CLI: /opt/homebrew/bin/gh (Available)
- Test command: pnpm --filter @ater/desktop test / cd apps/api && uv run python -m pytest tests/
- Build command: pnpm build
- Lint command: pnpm lint
- CI provider: GitHub Actions
- Context budget: Healthy

## Current Phase
- [x] **Phase 1: Button Component, Stylesheet, and Practice Buttons Refactor**
  - [x] 1.1 Update `button.tsx` default variant's hover style.
  - [x] 1.2 Verify `index.css` global selectors and rules.
  - [x] 3.1 Refactor `PracticeConfigurator.tsx` buttons and checkboxes.
  - [x] 3.2 Refactor `PracticeResults.tsx` buttons and progress bar.
  - [x] 3.3 Refactor `PracticeSession.tsx` keyword checkboxes.
  - [x] 3.4 Refactor `PracticeVault.tsx` checkboxes and modes.
- [x] **Phase 2: Page and Layout Backgrounds Refactor**
  - [x] 2.1 Refactor `login.tsx` root container to `bg-background`.
  - [x] 2.2 Refactor `welcome.tsx` root container to `bg-background`.
  - [x] 2.3 Refactor `onboarding.tsx` container and borders.
  - [x] 2.4 Refactor `LockoutScreen.tsx` backgrounds to theme classes.
  - [x] 2.5 Refactor `PdfViewer.tsx` mock document layout and text colors.
- [x] **Phase 3: Replace `bg-foreground` Buttons and Verify**
- [x] Archive
