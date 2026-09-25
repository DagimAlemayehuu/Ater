# Ater Design System & Visual Invariants

This document establishes the canonical UI standards, color tokens, and layout guidelines for Ater.

---

## 1. Dual Palette Architecture: Parchment Light & Zinc Dark

Ater supports two refined visual themes designed specifically for sustained, distraction-free cognitive reading:

### 1.1 Parchment Light Palette (Default Reading Theme)
Inspired by high-grade editorial typography and classical book paper:
- **Base Background:** `#faf8f5` (warm cream canvas that minimizes eye fatigue)
- **Card & Surface Surfaces:** `#f5f2eb` (elevated panels) and `#ede8de` (interactive controls)
- **Primary Typography:** `#1c1917` (deep stone charcoal with high reading contrast)
- **Muted Typography:** `#78716c` (warm neutral captions, labels, metadata)
- **Borders & Dividers:** `#e7e2d6` (subtle warm hairline borders)

### 1.2 Zinc Dark Palette (Night & Low-Light Mode)
A disciplined, zero-glare monochromatic dark theme:
- **Base Background:** `#09090b` (deep zinc black)
- **Card Surfaces:** `#18181b` (elevated cards, modals)
- **Interactive Hover Surfaces:** `#27272a`
- **Primary Typography:** `#f4f4f5` (clean bright zinc)
- **Muted Typography:** `#a1a1aa` (secondary labels)
- **Borders & Dividers:** `#27272a` (fine border outlines)

---

## 2. Semantic Functional Colors

Color is strictly functional and reserved for pedagogical status indicators. Garish rainbow gradients and decorative pills are forbidden:

| Indicator | Hex Token | Tailwind Class | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **Success / Mastered** | `#10b981` | `text-emerald-500` / `bg-emerald-500/10` | Lesson mastered, Feynman defense passed (>= 8/10), checkpoint correct. |
| **Remediation / Warning** | `#f43f5e` | `text-rose-500` / `bg-rose-500/10` | Remediation lesson triggered, defense failed, taboo word detected. |
| **Active / In-Progress** | `#f59e0b` | `text-amber-500` / `bg-amber-500/10` | Currently selected lesson node, active checkpoint. |
| **Locked / Queued** | `#71717a` | `text-zinc-500` / `bg-zinc-500/10` | Future prerequisite lesson node, locked state. |

---

## 3. Typography & Reading Hierarchy

- **Body Prose:** Clean, highly legible sans-serif (`font-sans`) with generous line-height (`leading-relaxed` / `1.75`) for dense technical explanations.
- **Section Headers:** Clear semantic hierarchy (`text-xl font-semibold tracking-tight`), separated by ample whitespace.
- **Code & Technical Data:** Monospace (`font-mono`) with high-contrast syntax backgrounds and subtle inline backtick formatting (`bg-stone-200/50 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 px-1.5 py-0.5 rounded`).
- **Mathematical Formulas:** KaTeX rendered formulas with consistent baseline alignment.

---

## 4. Component Layout Standards

1. **3-Column Studio Canvas (`app/page.tsx`):**
   - **Left Drawer (Collapsible):** Course navigation, session history, new topic intake trigger, and user profile menu.
   - **Center Stage:** 5-section pedagogical note viewer, embedded checkpoint cards, and inline voice companion.
   - **Right Roadmap Panel:** Sequenced lesson graph DAG with status badges and progress meter.
2. **NoteCanvas Keyboard Navigation:**
   - Learners can seamlessly step through unlocked sections using `ArrowLeft` and `ArrowRight`.
3. **Breathing Audio Indicator:**
   - Replaces jarring audio visualizers with a calm, pulsing minimalist dot indicating speech activity.
4. **Feynman Gate Modal:**
   - Prominently displays the 2 forbidden taboo words in high-contrast warning badges, accompanied by a live audio/text response input and score evaluation card.
