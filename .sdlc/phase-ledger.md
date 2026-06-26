# Phase Ledger: theme-and-contrast-refactor

## Phase 1: Button Component, Stylesheet, and Practice Buttons Refactor
Status: completed
OpenSpec tasks:
- [x] 1.1 Update `button.tsx` default variant to use a responsive hover class: change `hover:bg-[#2c2c30]` to `hover:bg-muted-foreground/20 dark:hover:bg-[#2c2c30]`.
- [x] 1.2 Update `index.css` to add any necessary global utility classes if required, and double-check theme variables.
- [x] 3.1 Refactor `PracticeConfigurator.tsx` buttons and checkboxes: change `bg-[#e4e4e7] text-background` to `bg-primary text-primary-foreground`, and replace `hover:bg-[#e4e4e7]/5` with `hover:bg-foreground/5`.
- [x] 3.2 Refactor `PracticeResults.tsx` buttons and progress bar: change progress bar indicator `bg-[#e4e4e7]` to `bg-primary`, main action button to `bg-primary text-primary-foreground`, and replace `hover:bg-[#e4e4e7]/5` with `hover:bg-foreground/5`.
- [x] 3.3 Refactor `PracticeSession.tsx` keyword checkboxes: change `checked:bg-[#e4e4e7]/10` to `checked:bg-foreground/10`.
- [x] 3.4 Refactor `PracticeVault.tsx` checkboxes and mode select: change `bg-[#e4e4e7]/5` to `bg-foreground/5` (or similar responsive styling), and selection check background to `bg-primary` or `bg-foreground`.
Acceptance criteria:
- Default buttons and practice buttons do not have pure black/white backgrounds, use sheets of gray (such as primary and bento items), and have perfect contrast in both light and dark modes.
Allowed files/areas:
- `apps/desktop/src/components/ui/button.tsx`
- `apps/desktop/src/index.css`
- `apps/desktop/src/components/practice/*.tsx`
Forbidden scope:
- Unrelated styling or functional changes to practice modes.
Verification:
- Run `pnpm lint` in `apps/desktop`.
Completion report:
- Completed successfully. All Vitest tests passed.

## Phase 2: Page and Layout Backgrounds Refactor
Status: completed
OpenSpec tasks:
- [x] 2.1 Refactor `login.tsx` root container to change `bg-[#0e0e0f]` to `bg-background`.
- [x] 2.2 Refactor `welcome.tsx` root container to change `bg-[#0a0a0b]` to `bg-background`.
- [x] 2.3 Refactor `onboarding.tsx` root container and internal elements to use `bg-background` instead of `bg-[#0e0e0f]`, and change hardcoded border colors `bg-[#242426]` to `bg-border`.
- [x] 2.4 Refactor `LockoutScreen.tsx` root and internal elements to use `bg-background` and `bg-card` instead of `bg-[#0a0a0a]` and `bg-[#131313]`.
- [x] 2.5 Refactor `PdfViewer.tsx` mock document background, borders, and text to use bento theme-aware classes (`bg-bento-panel`, `bg-bento-card`, `border-border`, `text-muted-foreground`) instead of hardcoded hex values (`bg-[#111317]`, `bg-[#0c0e11]`, `border-[#282E36]`, `text-[#bbc9cd]`, and `text-[#48defd]` for formulas).
Acceptance criteria:
- Welcome, Login, Onboarding, LockoutScreen, and PdfViewer elements adjust dynamically when switching between light and dark modes (no elements stay dark in light mode).
- Mock PDF viewer formulas and text have high contrast in light mode.
Allowed files/areas:
- `apps/desktop/src/routes/login.tsx`
- `apps/desktop/src/routes/welcome.tsx`
- `apps/desktop/src/routes/onboarding.tsx`
- `apps/desktop/src/components/ui/LockoutScreen.tsx`
- `apps/desktop/src/components/obsidian/PdfViewer.tsx`
Forbidden scope:
- Unrelated structural changes to the pages.
Verification:
- Run `pnpm lint` in `apps/desktop`.
Completion report:
- Completed successfully. Verified visually and programmatically.

## Phase 3: Replace `bg-foreground` Buttons and Verify
Status: completed
OpenSpec tasks:
- [x] 4.1 Replace `bg-foreground text-background` buttons in `OracleUIBlocks.tsx` with `bg-primary text-primary-foreground` to resolve pure black/white contrast issues.
- [x] 4.2 Replace `bg-foreground text-background` buttons/tabs in other routes/components (e.g. `settings.tsx`, `onboarding.tsx`, `agents.tsx`, `notebooks.tsx`, `InteractiveLessonRenderer.tsx`, `InteractiveLessonPlayer.tsx`) with `bg-primary text-primary-foreground`.
- [x] 5.1 Run `pnpm lint` and `pnpm build` in desktop directory to verify there are no compilation or typescript errors.
- [x] 5.2 Launch application or run verification checks using `checklist.py` if applicable.
Acceptance criteria:
- Every button across all pages (Settings, Onboarding, Oracle, etc.) has been updated to avoid pure black background in light mode or pure white background in dark mode.
- Desktop project compiles and builds successfully with no lint or typescript errors.
Allowed files/areas:
- `apps/desktop/src/components/intelligence/OracleUIBlocks.tsx`
- `apps/desktop/src/routes/*.tsx`
- `apps/desktop/src/components/**/*.tsx`
Forbidden scope:
- Unrelated functional modifications.
Verification:
- Run `pnpm lint` and `pnpm build` in `apps/desktop`.
Completion report:
- Completed successfully. All tests and compilation checks passed.
