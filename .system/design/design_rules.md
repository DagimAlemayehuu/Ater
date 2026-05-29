<!--
[TEMPLATE: FRONTEND DESIGN SYSTEM & UI/UX RULES]
Instructions for the User (Delete this block before use):
Use your Gemini Gem to fill out this template.
The Frontend Agent will read this to generate the exact UI design and Tailwind rules.
DO NOT put routing or page structures here. Put them in `app_structure.md`.
-->

# UI/UX Specifications & Design System
## 1. Visual Identity
**Brand Essence**: Monochrome High-Fidelity. A professional, minimalist interface focused on information density without cognitive load. Uses subtle shadows, refined typography (Outfit/Inter), and glassmorphism.

## 2. Color Palette (Tailwind Tokens - Dark Mode Only)
*   `background`: `#131313` (Surface)
*   `foreground`: `#e2e2e2` (On-surface)
*   `primary`: `#e8e8e8` (Primary text/accent)
*   `muted`: `#737373` (Neutral gray for secondary text)
*   `border`: `#444748` (Outline-variant)

## 3. Typography & Spacing
*   **Primary Font**: Inter / Outfit
*   **Headings**:
    *   `h1`: `text-3xl font-bold tracking-tight uppercase`
    *   `h2`: `text-xl font-semibold tracking-tight`
*   **Spacing**: Standardized gutters using `p-6` or `p-8`. Consistent `gap-4` for grid items.

## 4. Component Rules
*   **Buttons**: Strict `rounded-md` or `rounded-full`. Monochrome only. High-fidelity glass effect on hover.
*   **Cards**: Sub-pixel borders (`border-[0.5px]`), subtle `shadow-sm`, and `bg-card` with slight transparency if glassmorphism is active.
*   **Inputs**: Minimalist borders, focus state uses `ring-offset-background` and `ring-1 ring-ring`.

## 5. Terminology & Navigation
*   **Direct-English Rule**: UI labels must use the simplest possible English. 
    *   `Master Unit Hub` → `Topic`
    *   `Architectural Fragment` → `Note`
    *   `Binary` → `True/False`
    *   `Note Properties` → `Info`
    *   `Hub Connections` → `Map`
*   **Direct-Entry Rule**: No intermediary list screens for primary modules. Clicking an icon (e.g., Agents) must resolve to the primary functional dashboard (e.g., Ater Dashboard) immediately.
