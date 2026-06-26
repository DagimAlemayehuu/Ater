## Context

The Ater application uses a custom-tailored dark theme color palette using de-warmed industrial grays, but suffers from inconsistencies. Some pages (Login, Welcome, Onboarding, LockoutScreen) have hardcoded dark background classes (`bg-[#0e0e0f]`, `bg-[#0a0a0b]`, `bg-[#131313]`, `bg-[#0a0a0a]`). Additionally, several custom-styled buttons in practice sessions, results, and settings use hardcoded absolute background colors (`bg-[#e4e4e7]`, `bg-[#e4e4e7]/10`, `hover:bg-[#e4e4e7]/5`, or `bg-foreground` with `text-background`), leading to zero-contrast or pure white/black background violations when switching themes. Finally, standard button hovers are hardcoded to a dark hex color (`hover:bg-[#2c2c30]`), which makes them look like black boxes in light mode.

## Goals / Non-Goals

**Goals:**
- Refactor the buttons and backgrounds of the desktop application to adhere to the theme system variables and proper contrast.
- Ensure that the application background switches perfectly to light mode on all routes/pages, including Welcome, Login, Onboarding, and Lockout.
- Make all buttons theme-reactive and respect the constraints: no pure black/almost black background in light mode, and no pure white/almost white in dark mode.
- Use de-warmed industrial grays (mapped via `--primary`, `--bento-item`, `--bento-card`, etc.) to achieve this.

**Non-Goals:**
- Redesigning the layout of the screens or pages.
- Rewriting backend/sidecar features.
- Modifying fonts or icon sets.

## Decisions

### 1. Map Primary Buttons to `--primary` and `--primary-foreground`
- **Choice**: Instead of `bg-foreground text-background hover:bg-foreground/90` (which turns almost black in light mode and almost white in dark mode), we will use `bg-primary text-primary-foreground hover:bg-primary/90`.
- **Rationale**: In light mode, this maps to `#404040` (dark gray), and in dark mode to `#d9d9d9` (light gray). Both satisfy the constraint of using sheets of gray, avoiding pure black/white, and maintaining excellent contrast.

### 2. Replace Hardcoded Hex Colors with Tailwind Opacity and Variable Classes
- **Choice**: Replace `hover:bg-[#e4e4e7]/5` and `checked:bg-[#e4e4e7]/10` in practice pages with `hover:bg-foreground/5` and `checked:bg-foreground/10`.
- **Rationale**: This is responsive and works in both light and dark themes. Replace `#e4e4e7` (zinc-200) selections and progress bars with `--primary` or `--foreground/10`.

### 3. Standardize Default Button Hover
- **Choice**: Update `button.tsx` default variant's `hover:bg-[#2c2c30]` to `hover:bg-muted-foreground/20 dark:hover:bg-[#2c2c30]`.
- **Rationale**: This keeps button hover effects responsive to both light and dark modes, avoiding black hovers in light mode.

### 4. Replace Hardcoded Background Colors with Theme Variables
- **Choice**: Change `bg-[#0e0e0f]`, `bg-[#0a0a0b]`, `bg-[#131313]`, `bg-[#0a0a0a]` to `bg-background` or `bg-bento-bg`.
- **Rationale**: Ensuring the background responds fully to light/dark toggles.

## Risks / Trade-offs

- **[Risk]**: Contrast in complex interactive widgets (e.g. CodeMirror, PDF Viewer, Rubik's cube, etc.)
- **[Mitigation]**: Verify and manually review pages after changing classes. Ensure PDF mock viewer utilizes bento themes or responsive borders/text.
