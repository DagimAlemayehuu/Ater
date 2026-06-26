## Why

Ater's light/dark mode transition is incomplete, leading to visual inconsistencies (e.g., elements staying dark when switching to light mode, unreadable contrast on button text, and hardcoded backgrounds). Refactoring the theme variables and applying consistent semantic gray tokens is required to ensure perfect contrast and aesthetic compliance across all pages.

## What Changes

- Replace all hardcoded hex backgrounds (e.g., `#0e0e0f`, `#0a0a0b`, `#131313`, `#1c1c1e`) in screens and components with responsive Tailwind theme classes (e.g., `bg-background`, `bg-card`, `bg-bento-panel`).
- Replace hardcoded hex colors and opacity colors (e.g., `#e4e4e7`, `bg-[#e4e4e7]/10`) in practice session, results, configurator, and vault pages with responsive opacity classes (e.g., `bg-foreground/10`, `hover:bg-foreground/5`).
- Update button component styles to never use pure black/almost black (`bg-foreground` in light mode) or pure white/almost white (`bg-foreground` in dark mode) as backgrounds. Map primary buttons to `--primary` and `--primary-foreground` to enforce a clean de-warmed industrial gray scale.
- Fix low contrast button text (e.g. white text on light gray backgrounds in light mode).

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `theme-system`: Add requirements and scenarios specifying button background constraints (no pure black/almost black backgrounds in light mode, no pure white/almost white in dark mode, and uniform use of adaptive industrial grays).

## Impact

- Frontend layout and components (`apps/desktop/src/routes/*.tsx`, `apps/desktop/src/components/**/*.tsx`).
- Main stylesheet (`apps/desktop/src/index.css`) and tailwind configurations.
