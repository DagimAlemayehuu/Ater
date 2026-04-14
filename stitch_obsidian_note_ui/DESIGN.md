# Design System Specification: High-End Editorial Minimalism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Manuscript."**

Moving beyond the utilitarian density of standard knowledge bases, this system treats digital information with the reverence of a high-end architectural monograph. We are rejecting the "software-as-a-tool" aesthetic in favor of "software-as-a-gallery." By utilizing a strictly monochromatic palette and a high-contrast typography scale, we create a signature identity driven by intentional white space and rhythmic hierarchy.

The goal is to break the "template" look through:
*   **Intentional Asymmetry:** Offsetting content columns to create a dynamic, editorial flow.
*   **Micro-tension:** Using tight letter-spacing and ultra-fine iconography to create a sense of precision.
*   **Tonal Architecture:** Defining structure through shifts in paper-white and soft-grey surfaces rather than structural lines.

---

## 2. Colors
This system employs a radical monochromatic philosophy. Every interaction must feel like ink on paper.

### Palette Mapping
*   **Primary (`#000000`):** Reserved for high-impact text, active states, and primary iconography.
*   **Surface (`#F9F9FF`):** The primary canvas. A cool, crisp white that feels clinical and focused.
*   **Surface-Container-Low (`#F1F3FF`):** Used for sidebar regions or secondary panels to create soft separation.
*   **Surface-Container-Highest (`#DCE2F7`):** Reserved for "active" or "highlighted" regions within the UI.
*   **Surface-Container-Lowest (`#FFFFFF`):** Used for in-line components or indented metadata blocks.
*   **Outline-Variant (`#C6C6C6`):** A subtle grey for implied borders or outlines.
*   **Text-Primary (`#111827`):** A very dark grey for most body text to reduce eye strain.
*   **Text-Secondary (`#6B7280`):** A medium grey for metadata and secondary information.
*   **Primary-Container (`#3B3B3B`):** A darker grey used for hover states on primary elements.

### The "No-Line" Rule
Prohibit 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a sidebar using `surface-container-low` should sit against the `surface` document area without a dividing line. This creates a "seamless" interface that feels like a single, cohesive object.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers.
1.  **Level 0 (Base):** `surface` (The desk).
2.  **Level 1 (Panels):** `surface-container-low` (The paper stack).
3.  **Level 2 (In-line Components):** `surface-container-lowest` (Indented metadata blocks or property tables).

### Glassmorphism & Depth
While we avoid traditional shadows, depth is achieved through **Backdrop Blur**. Floating elements (like command palettes or tooltips) should utilize a semi-transparent `surface` color with a `20px` blur. This allows the high-density text beneath to bleed through as soft, unrecognizable shapes, maintaining the monochromatic soul while providing spatial orientation.

---

## 3. Typography
Typography is the primary engine of this system. We use **Inter** with custom tuning to achieve an "International Typographic Style" (Swiss Design) feel.

*   **Display Scales:** Use `display-md` (2.75rem) for document titles. Apply a `-0.04em` letter-spacing to create a "tight," authoritative look.
*   **Headline & Title:** `headline-sm` (1.5rem) should be used for major sections. Ensure a 1:3 ratio of text-to-whitespace above headlines.
*   **Body:** `body-md` (0.875rem) is the workhorse. Increase line-height to `1.6` to ensure long-form legibility against the high-contrast background.
*   **Labels:** `label-sm` (0.6875rem) is used for metadata. Always pair this with `text-secondary` (#6B7280) and all-caps styling to differentiate it from body content.

---

## 4. Elevation & Depth
In the absence of shadows and colors, elevation is communicated through **Tonal Layering**.

*   **The Layering Principle:** Place `surface-container-lowest` (#FFFFFF) cards on top of `surface-container-low` (#F1F3FF) backgrounds. This creates a "ghost lift"—a natural perceived elevation that is felt rather than seen.
*   **Ambient Shadows:** If a floating state (like a modal) requires absolute focus, use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04)`. The opacity must never exceed 5%.
*   **The "Ghost Border" Fallback:** If a container requires definition against a white background, use the `outline-variant` (#C6C6C6) at **10% opacity**. It should be a suggestion of a line, not a boundary.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` background with `#FFFFFF` text. Sharp corners (`roundedness: 0`).
*   **Secondary:** No background. `outline-variant` ghost border (20% opacity). Black text.
*   **State:** On hover, primary buttons shift to `primary-container`.

### Property Tables (Knowledge Base Specific)
Instead of a grid, use a two-column layout with `label-md` for keys and `body-md` for values. Use a `surface-container-low` background for the entire block to group metadata visually without using a border.

### Input Fields
Strictly minimal. Use a bottom-only border of 1px using `outline-variant`. Upon focus, the border transitions to `primary`. Do not use background fills for inputs unless they are in a search-bar context.

### Lists & Navigation
Forbid divider lines. Use `spacing-md` (vertical white space) to separate list items. The "Active" state in a sidebar is indicated by a shift to `surface-container-highest` and a `primary` (Black) 2px vertical "accent" line on the far left or right.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If two sections feel cluttered, increase the padding rather than adding a line.
*   **DO** use 1px to 1.5px line-art icons. They should feel like "technical drawings."
*   **DO** use `text-secondary` for "meta" information (file paths, dates) to keep the visual noise low.

### Don't
*   **DON'T** use pure grey for shadows. Use a tint of the surface color to keep the "temperature" of the UI consistent.
*   **DON'T** use 100% black text for long-form body copy; use `text-primary` (#111827) to reduce eye strain.
*   **DON'T** allow "floating" elements to exist without a backdrop blur. Without shadows, the blur is the only thing providing necessary spatial context.