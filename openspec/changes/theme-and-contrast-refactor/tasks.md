## 1. Stylesheet & Button Component Refactor

- [x] 1.1 Update `button.tsx` default variant to use a responsive hover class: change `hover:bg-[#2c2c30]` to `hover:bg-muted-foreground/20 dark:hover:bg-[#2c2c30]`.
- [x] 1.2 Update `index.css` to add any necessary global utility classes if required, and double-check theme variables.

## 2. Refactor Hardcoded Dark Backgrounds in Pages

- [x] 2.1 Refactor `login.tsx` root container to change `bg-[#0e0e0f]` to `bg-background`.
- [x] 2.2 Refactor `welcome.tsx` root container to change `bg-[#0a0a0b]` to `bg-background`.
- [x] 2.3 Refactor `onboarding.tsx` root container and internal elements to use `bg-background` instead of `bg-[#0e0e0f]`, and change hardcoded border colors `bg-[#242426]` to `bg-border`.
- [x] 2.4 Refactor `LockoutScreen.tsx` root and internal elements to use `bg-background` and `bg-card` instead of `bg-[#0a0a0a]` and `bg-[#131313]`.
- [x] 2.5 Refactor `PdfViewer.tsx` mock document background, borders, and text to use bento theme-aware classes (`bg-bento-panel`, `bg-bento-card`, `border-border`, `text-muted-foreground`) instead of hardcoded hex values (`bg-[#111317]`, `bg-[#0c0e11]`, `border-[#282E36]`, `text-[#bbc9cd]`, and `text-[#48defd]` for formulas).

## 3. Refactor Hardcoded Buttons in Practice & Results Components

- [x] 3.1 Refactor `PracticeConfigurator.tsx` buttons and checkboxes: change `bg-[#e4e4e7] text-background` to `bg-primary text-primary-foreground`, and replace `hover:bg-[#e4e4e7]/5` with `hover:bg-foreground/5`.
- [x] 3.2 Refactor `PracticeResults.tsx` buttons and progress bar: change progress bar indicator `bg-[#e4e4e7]` to `bg-primary`, main action button to `bg-primary text-primary-foreground`, and replace `hover:bg-[#e4e4e7]/5` with `hover:bg-foreground/5`.
- [x] 3.3 Refactor `PracticeSession.tsx` keyword checkboxes: change `checked:bg-[#e4e4e7]/10` to `checked:bg-foreground/10`.
- [x] 3.4 Refactor `PracticeVault.tsx` checkboxes and mode select: change `bg-[#e4e4e7]/5` to `bg-foreground/5` (or similar responsive styling), and selection check background to `bg-primary` or `bg-foreground`.

## 4. Refactor and Replace `bg-foreground` Buttons Across routes/components

- [x] 4.1 Replace `bg-foreground text-background` buttons in `OracleUIBlocks.tsx` with `bg-primary text-primary-foreground` to resolve pure black/white contrast issues.
- [x] 4.2 Replace `bg-foreground text-background` buttons/tabs in other routes/components (e.g. `settings.tsx`, `onboarding.tsx`, `agents.tsx`, `notebooks.tsx`, `InteractiveLessonRenderer.tsx`, `InteractiveLessonPlayer.tsx`) with `bg-primary text-primary-foreground`.

## 5. Verification and Auditing

- [x] 5.1 Run `pnpm lint` and `pnpm build` in desktop directory to verify there are no compilation or typescript errors.
- [x] 5.2 Launch application or run verification checks using `checklist.py` if applicable.
