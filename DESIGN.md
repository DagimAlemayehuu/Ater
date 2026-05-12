# Ater Design System — Ground Truth Specification

> **North Star:** "The Living Blueprint" — A surgical, monochromatic pro-tool. Every pixel earns its place. No decoration for decoration's sake.

---

## 1. Philosophy

Ater is built on one non-negotiable constraint: **the palette is white, black, and grey only.** No blue, no green, no purple, no indigo. Every interactive state, every status indicator, every emphasis — all achieved through tonal contrast within the greyscale spectrum.

The aesthetic borrows from:
- **Apple Pro apps** — extreme density with zero clutter
- **Linear** — everything feels alive but never distracting  
- **Technical engineering diagrams** — labels are uppercase, small, precise

The UI must feel like a high-performance instrument, not a consumer app.

---

## 2. Color System

### Token Definitions (HSL — zero chroma)

```css
/* Light Mode */
--background:          0 0% 100%;   /* Pure white canvas */
--foreground:          0 0% 0%;     /* Pure black text */
--card:                0 0% 100%;
--card-foreground:     0 0% 0%;
--popover:             0 0% 100%;
--popover-foreground:  0 0% 0%;
--primary:             0 0% 9%;     /* Near-black — active states, CTAs */
--primary-foreground:  0 0% 98%;   /* Near-white on primary */
--secondary:           0 0% 96%;
--secondary-foreground: 0 0% 9%;
--muted:               0 0% 96%;   /* Light grey surfaces */
--muted-foreground:    0 0% 45%;   /* Mid-grey labels */
--accent:              0 0% 96%;   /* Hover/active surface */
--accent-foreground:   0 0% 9%;
--destructive:         0 0% 15%;   /* Dark grey — NOT red */
--destructive-foreground: 0 0% 98%;
--border:              0 0% 90%;   /* Hairline borders */
--input:               0 0% 90%;
--ring:                0 0% 9%;
--sidebar-background:  0 0% 98%;
--sidebar-foreground:  0 0% 26%;
--sidebar-primary:     0 0% 9%;
--sidebar-border:      0 0% 91%;

/* Dark Mode */
--background:          0 0% 4%;    /* Near-black canvas */
--foreground:          0 0% 98%;   /* Near-white text */
--primary:             0 0% 98%;   /* Near-white — active states, CTAs */
--primary-foreground:  0 0% 9%;
--muted:               0 0% 15%;
--muted-foreground:    0 0% 65%;
--accent:              0 0% 15%;
--border:              0 0% 15%;
--sidebar-background:  0 0% 4%;
```

### Absolute Rules
- **NEVER** use `bg-white`, `text-black`, hardcoded hex, or any non-zero chroma HSL
- **NEVER** use Tailwind color names: `blue-*`, `green-*`, `red-*`, `indigo-*`, `amber-*`, `orange-*`, etc.
- **ALWAYS** use semantic tokens: `bg-background`, `text-foreground`, `bg-muted`, `border-border`, `bg-primary`, `text-muted-foreground`
- Opacity modifiers on tokens are the **only** way to create tonal variation: `text-muted-foreground/40`, `border-border/10`, `bg-primary/20`

### Surface Layering (Depth without color)
| Layer | Token | Use |
|---|---|---|
| L0 — Canvas | `bg-background` | The root workspace |
| L1 — Panels | `bg-muted/30` or `bg-background` with `border-border` | Sidebars, cards, panels |
| L2 — Interactive cells | `bg-accent` / `bg-muted` | Hover states, selected rows, active items |
| L3 — Floating | `bg-popover/95 backdrop-blur-md` | Popovers, command palettes, tooltips |

### State Communication (Greyscale-only)
All state must be communicated through **contrast, opacity, and border weight** — never color:

| State | Implementation |
|---|---|
| Active / Selected | `bg-accent text-accent-foreground font-semibold` |
| Disabled / Inactive | `opacity-30` or `text-muted-foreground/30` |
| Completed / Done | `line-through opacity-50` |
| Error | `bg-destructive/10 border-destructive/20 text-destructive` (all greyscale tokens) |
| Loading | `animate-pulse` on `bg-muted` skeleton |
| Processing | `animate-spin` on `RefreshCw` icon |
| In-progress pipeline | `animate-pulse` dot using `bg-primary` |

---

## 3. Typography

**Font:** Inter (loaded via system font stack: `"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif`)

The type scale is built on **extreme weight contrast** — not size contrast.

### Scale

| Role | Classes | Example |
|---|---|---|
| Page Title | `text-5xl font-extrabold text-foreground tracking-tight leading-tight` | Note title in content area |
| Section Title | `text-4xl font-extrabold tracking-tight text-foreground` | Dashboard H1s |
| Sub-heading H2 | `text-xl font-black mt-8 mb-4 tracking-tight text-foreground` | Markdown H2 |
| Sub-heading H3 | `text-lg font-bold mt-6 mb-3 tracking-tight text-foreground/90` | Markdown H3 |
| Micro-label (Blueprint) | `text-[9px] font-black uppercase tracking-widest text-muted-foreground/40` | Property key names, section headers |
| Engineering label | `text-[10px] font-black uppercase tracking-[0.15em] text-foreground/70` | Panel headers like "MAP" |
| UI label | `text-[10px] font-bold uppercase tracking-wider text-muted-foreground` | Card section headers |
| Body / prose | `text-[13px] leading-relaxed text-foreground/90` | Markdown paragraph content |
| List item | `text-[13px] leading-relaxed text-foreground/80` | Rendered MD list items |
| File tree | `text-[12px] text-muted-foreground/90` | Explorer file names |
| Hub nav node | `text-[11px] leading-tight` | Connections sidebar links |
| Nav footer label | `text-[8px] font-black uppercase tracking-widest opacity-30` | "Previous Note" / "Next Note" |

### Typography Rules
- **Bold hierarchy:** Only `font-black` and `font-extrabold` for headings; `font-bold` for labels; `font-medium` for body
- **Uppercase is structural:** Never decorate — only use uppercase for labels, section names, button text, metadata keys
- **Tracking is semantic:** `tracking-widest` = metadata/labels; `tracking-tight` = headings; `tracking-tighter` = large display
- Strip underscores from all displayed filenames and WikiLinks: `name.replace(/_/g, ' ')`
- File extensions (`.md`, `.pdf`) are always hidden in the UI

### Code Typography
- **Inline code:** `bg-muted/30 px-1.5 py-0.5 rounded text-[12px] font-mono text-foreground border border-border/5 font-medium`
- **Block code:** `SyntaxHighlighter` with `JetBrains Mono, Fira Code, Menlo, monospace` at `14px / 1.7 line-height`, transparent background, `border border-border/20 rounded-xl`
- Code block header: language tag `text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30`; ghost copy button appears on hover only

---

## 4. Spacing & Layout

### The 3-Column Obsidian Layout
The primary page is a horizontal flex of three resizable columns:

```
[ Explorer Sidebar ] | [ Map/Connections ] | [ Content Area ] | [ Ater Panel (optional) ]
  default: 520px         default: 220px         flex-1               400px fixed
  min: 160px             min: 160px                                   
  max: 800px             max: 500px             
```

- Columns separated by `border-r border-border` hairlines
- Each column has a **drag handle** (1px wide, `cursor-col-resize`, `hover:bg-primary/50`)
- In fullscreen mode, the explorer sidebar is hidden entirely (`!isFullscreen` guard)

### Content Area Padding
- Markdown content: `py-12 px-16 max-w-5xl mx-auto` (generous reading margins)
- Sticky toolbar: `-mx-16 px-16` (bleeds to full width, matches content padding)
- PDF mode: `p-0` (flush, no padding)

### Toolbar / Header Patterns
- **Sticky top bar:** `sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/10 py-6`
- **Panel header:** `px-4 py-3 border-b border-border bg-muted/10` with icon + uppercase label
- **Section dividers:** `border-t border-border/40` with `mt-24 pt-12` spacing (generous breathing room)

### Component Spacing
| Element | Spacing |
|---|---|
| Explorer toolbar | `p-3` |
| File tree items | `py-1 px-2 gap-1.5` |
| File tree children | `pl-3.5 border-l border-border/10 ml-[9px]` |
| Hub nav items | `py-1 px-2 gap-1.5 rounded-sm` |
| Property grid rows | `gap-3 px-2 py-1 -mx-2` |
| Card internal padding | `p-4` to `p-6` |
| Page sections | `space-y-6` |
| Knowledge footer | `mt-24 pt-12 pb-24 px-8` |

---

## 5. Components

### Buttons

**Primary CTA:**
```
px-4 py-2 bg-primary text-primary-foreground rounded-lg 
text-xs font-bold uppercase tracking-widest 
hover:opacity-90 transition-all shadow-sm
```

**Ghost / Secondary:**
```
flex items-center justify-center w-7 h-7 
bg-background border border-border text-muted-foreground rounded-md 
hover:text-foreground hover:border-primary 
transition-all shadow-sm
```
Used for: Fullscreen, Edit, Delete, Properties toggle toolbar buttons.

**Icon-only toolbar button** (active state):
```
bg-primary border-primary text-primary-foreground
```
(inactive): `bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary`

**Text button / action link:**
```
text-[9px] font-bold text-muted-foreground/30 hover:text-foreground uppercase transition-colors
```

**Navigation button (Prev/Next):**
```
flex items-center gap-3 px-6 py-2.5 
bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground 
rounded-xl border border-border/40 transition-all group
```
- Icon has `group-hover:-translate-x-1 transition-transform` (left) or `group-hover:translate-x-1` (right)

**Inline "Add Property" trigger:**
```
text-[9px] font-black uppercase tracking-[0.2em] 
text-muted-foreground/20 hover:text-primary transition-all py-2
```

**Size rule:** Most action buttons are `w-7 h-7` (28px). CTA buttons use `h-8` to `h-10`. Never larger than `rounded-lg` corner radius.

### Inputs

All inputs are **borderless by default** — boundary defined by parent container:

**Search bar (Explorer):**
```
w-full bg-muted/50 border border-border text-[11px] 
px-2 py-1.5 pl-7 rounded-md 
focus:outline-none focus:ring-1 focus:ring-ring 
placeholder:text-muted-foreground/50 transition-all
```

**Inline rename / create:**
```
flex-1 bg-background border border-primary rounded 
px-1 py-0 text-[12px] outline-none h-5
```

**Property value inline edit:**
```
w-full bg-transparent border-none p-0 text-[12px] 
focus:ring-0 text-primary font-bold
```

**Add property name input:**
```
w-32 bg-transparent border-b border-border/50 
text-[10px] font-black uppercase tracking-widest 
placeholder:text-muted-foreground/10 
focus:border-primary focus:ring-0 transition-all
```

**Edit mode textarea:**
```
w-full h-[600px] p-8 bg-muted border border-border 
rounded-2xl font-mono text-sm leading-relaxed 
focus:outline-none focus:ring-1 focus:ring-ring transition-all
```

**Rule:** `focus:ring-0` or `focus:outline-none` everywhere except explicit search/edit fields. Never show a blue focus ring.

### File Tree (Explorer)

- Item row: `flex items-center gap-1.5 py-1 cursor-pointer transition-colors px-2 group relative`
- **Selected:** `bg-accent text-accent-foreground font-medium rounded-sm`
- **Hover:** `hover:bg-accent/50 text-muted-foreground/90`
- **Drag target:** `bg-primary/20 ring-1 ring-primary/50`
- Chevron icon: `w-3 h-3 transition-transform` with `rotate-90` when expanded
- File icon: `w-3.5 h-3.5 shrink-0 text-muted-foreground/40`
- Folder icon: `w-3.5 h-3.5 shrink-0 text-muted-foreground/60`
- Nesting guide: `pl-3.5 border-l border-border/10 ml-[9px]`
- Hover actions (rename, delete): `opacity-0 group-hover:opacity-100 transition-all`, icons `size={10}`

### Hub Connections Nav (Map Panel)

- Header: `px-4 py-3 flex items-center justify-between border-b border-border bg-muted/10`
- Header label: `text-[10px] font-black uppercase tracking-[0.15em] text-foreground/70` + `Network` icon `size={12}`
- Topic badge (clickable hub link): `p-2 rounded-md bg-muted/30 border border-border/50 hover:border-primary/30`
  - Sub-label: `text-[8px] font-black uppercase tracking-widest text-muted-foreground/40`
  - Value: `text-[11px] font-bold text-foreground/80 truncate`
- Node item: `py-1 px-2 rounded-sm cursor-pointer transition-colors`
  - Active: `bg-accent text-accent-foreground font-semibold`
  - Inactive: `hover:bg-accent/50 text-muted-foreground/80`
- Indentation guides: 1px vertical `border-r border-border/10`, width = `depth * 12px`
- Checkbox: `h-3 w-3 appearance-none border border-muted-foreground/40 bg-transparent rounded-sm checked:bg-primary/20 checked:border-primary`
- Checked item text: `line-through opacity-40`
- Section header (no target): `text-[9px] font-black uppercase tracking-widest opacity-30`
- Link text: `text-[11px] leading-tight truncate flex-1 hover:text-foreground transition-colors`
- Empty state: `py-20 flex flex-col items-center gap-3 opacity-20` with `Network` icon `size={24} strokeWidth={1}`

### Note Properties Panel

- Grid: `grid-cols-1 gap-y-1.5 py-6`
- Row: `flex items-center gap-3 group/prop hover:bg-muted/10 px-2 py-1 -mx-2 rounded-md transition-colors`
- Icon: `w-4 flex justify-center text-muted-foreground/30 group-hover/prop:text-primary transition-colors`, size `14px`
- Key label: `text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest`
- Value: `text-[12px] font-medium text-foreground truncate min-h-[18px]`
- Delete button: `opacity-0 group-hover/prop:opacity-100 p-1 hover:text-destructive transition-all`, `X size={12}`
- WikiLink value: `text-primary hover:underline underline-offset-4 decoration-primary/30 font-bold`
- Status badge: `px-1.5 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-widest bg-muted border border-border text-muted-foreground`
- Separator before "Add": `border-t border-border/10`

### Markdown Rendered Content

Typography classes for all rendered elements:

| Element | Classes |
|---|---|
| `<p>` | `mb-4 leading-relaxed text-[13px] text-foreground/90 antialiased` |
| `<h1>` | `text-2xl font-black mt-10 mb-6 tracking-tighter border-b pb-2 border-border text-foreground` |
| `<h2>` | `text-xl font-black mt-8 mb-4 tracking-tight text-foreground` |
| `<h3>` | `text-lg font-bold mt-6 mb-3 tracking-tight text-foreground/90` |
| `<h4>` | `text-[11px] font-black mt-5 mb-2 uppercase tracking-[0.2em] text-muted-foreground/60` |
| `<ul>` | `list-disc pl-5 space-y-1 mb-4 text-[13px] text-foreground` |
| `<ol>` | `list-decimal pl-5 space-y-1 mb-4 text-[13px] text-foreground` |
| `<li>` | `text-[13px] leading-relaxed mb-1 text-foreground/80` |
| `<table>` | `overflow-x-auto my-6 rounded-md border border-border` |
| `<th>` | `px-4 py-2 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-left` |
| `<td>` | `px-4 py-2 border-b border-border/10 text-foreground/80` |
| `<thead>` | `bg-muted/50 border-b border-border` |
| `<blockquote>` | `border-l-4 border-primary/20 pl-4 italic my-6 text-muted-foreground text-[13px] bg-muted/10 py-3 rounded-r-lg` |
| `<hr>` | `my-10 border-t border-border` |
| `<a>` | `text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors font-medium` |

Callout blocks use `border-l-4` with `bg-muted/20` — the border color may use semantic named colors (`border-blue-500` etc.) as an exception **only** inside Obsidian callout blocks `[!note]`, `[!warning]`, etc. This is the **only** allowed use of non-greyscale color.

### Selection Popover (Text Highlight)
Appears above selected text:
```
fixed z-[9999] bg-popover/95 backdrop-blur-md border border-border 
rounded-full h-10 flex items-center px-2 shadow-2xl 
animate-in fade-in zoom-in duration-200
```
Buttons inside: `flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-accent rounded-full transition-all active:scale-95`

### Resize Handle
```
absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 
transition-colors hover:bg-primary/50
```
Active: `bg-primary w-1`; Inactive: `bg-transparent`

### Scrollbar (Custom)
```css
width: 6px; height: 6px;
track: transparent
thumb: hsl(var(--muted-foreground) / 0.2)
thumb:hover: hsl(var(--muted-foreground) / 0.35)
border-radius: 999px
```
Applied via `.custom-scrollbar` class. All scrollable panels use this.

### Loading States
- **Spinner:** `<RefreshCw size={24} className="animate-spin" />` centered in container
- **Skeleton:** `h-12 rounded-md bg-muted animate-pulse`
- **Spinner label:** `text-[10px] font-bold uppercase tracking-widest text-muted-foreground`
- **Full page loading:** `h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground`

### Empty States
```
py-20 flex flex-col items-center gap-3 opacity-20
icon: size={24} strokeWidth={1}
label: text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center
```

---

## 6. Iconography

**Library:** Lucide React exclusively. No other icon sets.

### Size Rules
| Context | Size |
|---|---|
| Toolbar action buttons | `size={14}` or `size={16}` |
| Panel headers | `size={12}` |
| File tree items | `w-3.5 h-3.5` (14px) |
| Chevrons in tree | `w-3 h-3` (12px) |
| Empty state illustrations | `size={24} strokeWidth={1}` or `size={64} strokeWidth={1}` |
| Loading spinner | `size={24}` |
| Hub nav tree | `w-3 h-3` |

### Behavior
- All icons default to `text-muted-foreground` and transition to `text-foreground` on hover
- Active icons: `text-foreground` or `text-accent-foreground`
- Icons inside active primary buttons: `text-primary-foreground`
- Hover micro-animation: `group-hover:scale-110 transition-transform` on decorative icons
- Chevron rotation: `transition-transform` with `rotate-90` class toggled

---

## 7. Animation System

**Base timing function:** `cubic-bezier(0.16, 1, 0.3, 1)` — snappy spring curve

### Entry Animations (via `.animate-in`)
```css
animation-duration: 300ms;
animation-fill-mode: both;
animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
```

Available variants:
| Class | Effect |
|---|---|
| `fade-in` | opacity 0→1 |
| `slide-in-from-bottom-2` | 0.5rem Y offset |
| `slide-in-from-bottom-4` | 1rem Y offset |
| `slide-in-from-right-4` | 1rem X offset |
| `zoom-in-95` | scale 0.95→1 |
| `duration-300/500/700/1000` | Duration overrides |

### Usage Rules
- Content panels on mount: `animate-in fade-in slide-in-from-bottom-4 duration-500`
- Popovers / floating: `animate-in fade-in zoom-in duration-200`
- Workspace transitions: `animate-in fade-in slide-in-from-bottom-2`
- Ater plan reveal: `animate-in fade-in slide-in-from-bottom-4 duration-500`
- **Do NOT** animate structural layout elements (sidebar, toolbar)

### Transition Utilities
- **All interactive elements:** `transition-all` or `transition-colors`
- **Chevron rotation:** `transition-transform`
- **Progress bars:** `transition-all duration-500` or `duration-700`
- **Opacity reveals:** `transition-opacity`
- **Active scale:** `active:scale-[0.98]` on primary buttons; `active:scale-95` on popover actions

---

## 8. Elevation & Depth

No traditional box shadows except:
- Floating panels: `shadow-sm` (cards, toolbar buttons)
- Ater side panel: `shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]` (left-edge shadow, dark mode only)
- Modals: `shadow-2xl` with low opacity

**Primary depth technique:** Tonal layering — `bg-muted/10` → `bg-muted/30` → `bg-muted` → `bg-background` creates physical sense of depth without shadows.

**Borders as separators:** `border-border` at full opacity for structural dividers; `border-border/10` for subtle tree guides; `border-border/40` for navigation components.

---

## 9. PDF Viewer Rules

- Container: `p-0 h-full overflow-hidden flex flex-col` — completely flush
- No box shadows, no white halos, no rounded corners on document
- Dark mode: backend CSS inversion filter — document appears as native dark content
- Controls grouped in pill container: `bg-muted rounded-lg border border-border p-0.5`
- Page counter: `text-[10px] font-black text-foreground tabular-nums` / `text-[9px] font-bold text-muted-foreground/40` for the slash separator

---

## 10. Do's and Don'ts

### DO
- Use HSL semantic tokens for **every** color value — no exceptions
- Use `text-muted-foreground/30` for ghost labels, `text-muted-foreground/60` for secondary, `text-muted-foreground` for standard
- Use `font-black` + `uppercase` + `tracking-widest` for all metadata labels and section titles
- Use `animate-in fade-in` for content that appears after loading
- Use `transition-all` on every interactive element
- Use `opacity-0 group-hover:opacity-100` for hover-revealed actions (rename, delete, copy)
- Use `w-7 h-7` (28px) as the standard toolbar icon button size
- Use `rounded-md` maximum for buttons; `rounded-xl` maximum for cards/panels; `rounded-2xl` for textareas
- Use `backdrop-blur-xl` on sticky headers and `backdrop-blur-md` on floating popovers
- Strip `_` → ` ` on all displayed file/note names
- Strip `.md` and `.pdf` extensions from all displayed names

### DON'T
- **DON'T** use any color other than white, black, or grey — not even `text-blue-500` for links
- **DON'T** use `rounded-full` except for selection popovers and toggle switches
- **DON'T** use `shadow-lg` or heavier shadows on non-floating elements
- **DON'T** hardcode pixel sizes for layout — use Tailwind spacing scale
- **DON'T** use `border-2` or heavier borders except on active input focus states
- **DON'T** animate the sidebar, toolbar, or structural layout elements
- **DON'T** use `font-normal` for labels — minimum `font-medium` for any text the user needs to read
- **DON'T** allow scrollbars to show default OS styling — always apply `.custom-scrollbar`
- **DON'T** show file extensions (`.md`, `.pdf`) to the user anywhere in the UI