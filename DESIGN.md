# Design System Specification: High-Fidelity Minimalist (LifeOS)

 

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Living Blueprint."**

 

Moving beyond the utilitarian density of standard knowledge bases, this system treats information as a high-performance, interactive asset. We are rejecting the "software-as-a-tool" aesthetic in favor of a "Pro-Tool Utility" look—borrowing from the precision of Apple’s Pro apps and the "alive" interactivity of Linear. By utilizing a theme-aware dynamic palette and a blueprint-scale typography, we create an interface that feels technically superior and surgically precise.

 

The goal is to provide a "High-Fidelity" experience through:

*   **System-Level Theming:** Using HSL variables to ensure perfect alignment in both Light and Dark modes.

*   **Micro-tension:** Using tight, bold typography and ultra-fine iconography (Lucide-react) to create a sense of engineering precision.

*   **Interactivity & Flow:** Defining the app as "alive" through subtle, rhythmic entry animations and tactile active states.

 

---

 

## 2. Colors

This system employs a semantic, theme-aware HSL philosophy. Interaction is defined by contrast and tonal shifts.

 

### Palette Mapping (Tailwind Standard)

*   **Background (`bg-background`):** The primary canvas. Pure White (`0 0% 100%`) in light mode; Deep Black (`0 0% 4%`) in dark mode.

*   **Foreground (`text-foreground`):** High-impact text and primary icons. Pure Black in light; Off-white (`0 0% 98%`) in dark.

*   **Muted (`bg-muted`):** Used for secondary surfaces (sidebars, empty states). A cool grey that provides soft separation.

*   **Accent (`bg-accent`):** Reserved for highlights, hover states, and "active" regions within the UI.

*   **Border (`border-border`):** A low-contrast separator. In dark mode, opacity is kept low (15%) to prevent visual noise.

*   **Primary (`bg-primary`):** High-contrast background for active buttons or "Surgical" state indicators.

 

### The "High-Fidelity" Color Logic

Status indicators (e.g., "Done", "In Progress") use **10% opacity fills** with **solid borders** of the same hue. This creates a modern, glass-morphic feel that communicates state without overpowering the monochromatic soul of the system.

 

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers using semantic classes.

1.  **Level 0 (Base):** `bg-background` (The Workspace).

2.  **Level 1 (Panels):** `bg-muted/30` or `bg-card` (The Surface).

3.  **Level 2 (In-line Components):** `bg-accent` or `bg-muted` (Interactive cells and active metadata blocks).

 

### Glassmorphism & Depth

Floating elements (like popovers, command palettes, or tooltips) MUST utilize `bg-popover/95` with `backdrop-blur-md`. This provides depth and maintains spatial orientation by allowing the high-density content beneath to bleed through as soft, diffused shapes.

 

---

 

## 3. Typography

Typography is the primary engine of the LifeOS aesthetic. We use **Inter** tuned for a "Technical Monograph" feel.

 

*   **Title Scale:** Use `4xl font-black tracking-tighter`. Stark, bold, and authoritative.

*   **Sub-headings:** `text-xl font-black tracking-tight`. Always rendered in `text-foreground`.

*   **Metadata (Blueprint Labels):** `text-[10px] font-black uppercase tracking-widest`. Pair this with `text-muted-foreground/50` to mimic technical engineering labels.

*   **Body Content:** `text-[13px] leading-relaxed`. Optimized for reading long-form Markdown against high-contrast backgrounds.

*   **Code/Mono:** `font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded`.

 

---

 

## 4. Elevation & Depth

Elevation is communicated through **Tonal Layering** and **Backdrop Blur** rather than heavy shadows.

 

*   **The Layering Principle:** Place `bg-muted` or `bg-accent` cards on top of `bg-background`. This creates a "ghost lift" that feels physically grounded in the app frame.

*   **The "Apple Preview" PDF Aesthetic:** The PDF viewer MUST strip all box-shadows and white halos. Dark mode is achieved via a backend CSS inversion filter, making the document feel like a flat, native part of the background.

*   **Shadows:** Reserved strictly for floating modals. Use an ultra-diffused, large-radius shadow: `shadow-2xl` with a low-opacity black tint.

 

---

 

## 5. Components

 

### Buttons

*   **Primary:** Solid `bg-primary` with `text-primary-foreground`. Sharp but slightly rounded corners (`rounded-md`). Include a subtle `active:scale-[0.98]` transform.

*   **Ghost/Secondary:** `bg-transparent` with `hover:bg-muted` and `border-border`.

*   **Action Buttons (Run):** High-contrast `bg-background` border with `font-black text-[10px]` uppercase labels.

 

### Database Views (Dynamic Grid)

*   **Editable Cells:** Appear as plain text; transition to `bg-muted` or `border-border` input states on focus.

*   **Status Badges:** Use deterministic color generation. Fills should be at 10% opacity with 1px borders for a "Pro" look.

 

### Input Fields

Strictly minimal. Use `bg-transparent` with `border-none` and `focus-visible:ring-0`. Define the boundary through the parent container's `bg-muted` background or a subtle `border-b`.

 

### Lists & Navigation

Sidebar items use `px-3 py-2` spacing. The "Active" state is indicated by a shift to `bg-accent` and a shift in typography to `font-bold` or a `primary` color highlight.

 

---

 

## 6. Do's and Don'ts

 

### Do

*   **DO** use HSL variables for EVERYTHING. No hardcoded hex codes.

*   **DO** use entry animations (`animate-in fade-in slide-in-from-bottom-4`) to make the UI feel "alive."

*   **DO** use Lucide-react icons with a size of `12-16px` to maintain technical precision.

*   **DO** use `text-foreground/90` for paragraphs to ensure readability in dark mode.

 

### Don't

*   **DON'T** use `bg-white` or `text-black`. Use `bg-background` and `text-foreground`.

*   **DON'T** use rounded corners larger than `rounded-lg` (8px). The system prefers sharp, architectural edges.

*   **DON'T** allow gray "halos" or edges on PDF viewers. They must blend perfectly with the container background.

*   **DON'T** use 1px solid black borders. Use `border-border` with appropriate theme-aware opacities.