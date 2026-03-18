<!--
[TEMPLATE: FRONTEND DESIGN SYSTEM & UI/UX RULES]
Instructions for the User (Delete this block before use):
Use your Gemini Gem to fill out this template.
The Frontend Agent will read this to generate the exact UI design and Tailwind rules.
DO NOT put routing or page structures here. Put them in `app_structure.md`.
-->

# UI/UX Specifications & Design System
## 1. Visual Identity
> Define the mood, brand, and target audience. Is it playful and modern or corporate and sleek?

**Brand Essence:** [Insert summary of visual style]

## 2. Color Palette (Tailwind Tokens)
> Provide the exact hex codes and corresponding Tailwind variable names.

*   `primary`: `#1A202C` (Deep Blue/Black)
*   `secondary`: `#E2E8F0` (Light Slate)
*   `accent`: `#F59E0B` (Amber)
*   `destructive`: `#EF4444` (Red)

## 3. Typography & Spacing
> Define fonts, heading hierarchies, and standard padding/margins.

*   **Primary Font:** Inter
*   **Headings:**
    *   `h1`: `text-4xl font-bold tracking-tight`
    *   `h2`: `text-2xl font-semibold`
*   **Spacing Rules:** All containers must have `px-4 py-8` padding. Use `gap-6` for grid/flex items.

## 4. Component Rules (The "Primitives")
> Detail how specific UI elements should look and behave (Buttons, Cards, Inputs).

*   **Buttons:** Must have `rounded-md transition-colors`. Primary buttons use `bg-primary text-white hover:bg-primary/90`.
*   **Cards:** Use `bg-white shadow-sm border border-slate-200 rounded-lg p-6`.
*   **Inputs:** Use `border border-slate-300 rounded-md focus:ring-2 focus:ring-primary`.
