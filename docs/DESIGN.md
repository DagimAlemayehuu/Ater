# DESIGN.md — Ater Design System & Visual Tokens

This document defines the visual theme, HSL color tokens, typography scales, layout specs, and motion guidelines for the Ater desktop application.

---

## 1. Color Strategy (Industrial Grays & De-warmed Neutrals)

To deliver a premium "scientific instrument" feel, we employ a highly calibrated, de-warmed neutral scale utilizing a 240-scale gray spectrum. Rather than standard pure black and white, we leverage subtle, low-saturation industrial grays to avoid visual fatigue and maintain maximum information legibility.

### Core Palette (Dark Mode Base)

| Token | HSL / Hex / Value | Purpose |
| :--- | :--- | :--- |
| `--background` | `hsl(240, 5%, 7%)` / `#111113` | Deep industrial background canvas |
| `--foreground` | `hsl(0, 0%, 92%)` / `#ebebeb` | Faint white primary prose and headings |
| `--card` | `hsl(240, 4%, 9%)` / `#151517` | Standard elevated Bento panels |
| `--border` | `hsl(240, 4%, 15%)` / `#242426` | Faint separation borders and separator lines |
| `--muted` | `hsl(240, 4%, 12%)` / `#1d1d20` | Secondary backgrounds, inactive states |
| `--muted-foreground` | `hsl(240, 5%, 65%)` / `#a1a1aa` | Faint secondary details and captions |
| `--accent` | `hsl(240, 4%, 15%)` / `#242426` | Active borders and highlighted tabs |
| `--primary` | `hsl(0, 0%, 85%)` / `#d9d9d9` | Steel primary highlight accent |

### Bento Box Space Mapping

| Class Name | Hex Value | Purpose |
| :--- | :--- | :--- |
| `bg-bento-bg` | `#111113` | Root base background surrounding panels |
| `bg-bento-panel` | `#151517` | Main container card panels |
| `bg-bento-card` | `#1a1a1c` | Inner components, outlines, list containers |
| `bg-bento-item` | `#232326` | Selectable active/focused sub-elements |

---

## 2. Typography & Type Scale

We prioritize ultra-clean legibility. In Ater, typography is strictly uniform to preserve the rigorous visual structure of a technical dashboard.

### Uniform Font Override
* **Global Sans (All elements)**: `"Outfit", ui-sans-serif, system-ui, -apple-system, sans-serif`
* **LaTeX / Prose / Monospace Override**: The **Outfit** font is applied globally across all elements—including body text, headings, code fragments, pre-formatted sections, buttons, and input fields—to maintain visual consistency.

### Typography Hierarchy

| Selector | Size | Weight | Tracking | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `h1` | `2.25rem (36px)` | `900 (Black)` | `-0.02em` | Major Concept Title |
| `h2` | `1.5rem (24px)` | `600 (Semibold)` | `-0.01em` | Core Logic / Section Heading |
| `p` | `1.0rem (16px)` | `400 (Regular)` | `0` | Prose, explanations |
| `code` | `0.875rem (14px)` | `400 (Regular)` | `0` | Mathematical & CS formulas |

---

## 3. Layout & Spacing

* **asymmetric Dashboard Grid**: A clean, high-density left sidebar (nav and file tree), central editor (Monaco + markdown rendering), and right-side interactive inspector (AST status, RLS policies, quizzes).
* **Bento Box Gaps**: Strict outer page padding of `12px` (`p-3`) and internal panel gaps of `12px` (`gap-3`) surrounding all floating Bento panel cards.
* **Radix Interface Controls**: Standardized 8px padding (`p-2`), 12px panel gaps (`gap-3`), and minimal border radii (`rounded-md` or 4px) to retain a rigid, clean interface structure.
* **Panel Borders**: Separators are strictly solid `1px` borders (`--border` / `#242426`) with zero physical box-shadows.

---

## 4. Motion & Animations

Transitions are fast, clean, and purposeful:
* **Fades/Popovers**: Clean, 100ms fade-in with a subtle `translateY` offset using `cubic-bezier(0.16, 1, 0.3, 1)`.
* **State Updates**: Sharp 80ms transitions to communicate instant compiler/AST feedback.
