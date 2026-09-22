# Ater Phase 6 Frontend UI and Canvas Investigation Report

**Explorer**: `explorer_survey_ui`  
**Date**: 2026-09-16  
**Target Project**: [/Users/dabodestroyer/code/Ater](file:///Users/dabodestroyer/code/Ater)  
**Mode**: Read-Only Architecture Exploration  

---

## 1. Executive Summary

This report documents the architectural structure, component layout, design token standards, state persistence mechanisms, and styling conventions of the frontend UI and canvas in Ater. It provides precise specifications for implementing:
1. The **In-Lesson Sources Tray** ([components/dashboard/SourcesTray.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/SourcesTray.tsx)).
2. The **Studio Creator Modal** ([components/dashboard/StudioModal.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/StudioModal.tsx)) and its trigger in [components/dashboard/NoteCanvas.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/NoteCanvas.tsx).
3. The **Autonomous Research Station** ([app/research/page.tsx](file:///Users/dabodestroyer/code/Ater/app/research/page.tsx)) and its Course Induction Bridge.
4. The **User Settings Toggle** (`Enable NotebookLM Studio`) and distraction-free canvas preservation.

---

## 2. /app Canvas Page Location & Architecture

The primary learning application lives at:
- **File**: [app/app/page.tsx](file:///Users/dabodestroyer/code/Ater/app/app/page.tsx)
- **Framework**: Next.js 15.1.7 App Router (`'use client'`).

### View Modes
The page state `currentView` alternates between two views:
1. `'library'`: The Course Library view.
   - Top Header (height `h-14`): Logo (`ATER / አጠር`), Theme Toggle (`Sun`/`Moon`), Language Switch (`English`/`አማርኛ`), and Profile Dropdown Menu (`User` icon).
   - Content: Responsive grid displaying the "+ Create Course" dashed action card and saved course cards with progress metrics.
2. `'study'`: The Cognitive Studio / Canvas view (lines 958–1212).
   - Breadcrumb Header (height `h-11`): "Back to Library" button, `/`, curriculum topic label, Theme Toggle, Language Switch, and Profile Menu.
   - Canvas Viewport: `<div className="flex-1 flex overflow-hidden">` rendering `<NoteCanvas ... />`.

---

## 3. NoteCanvas Component & Header Structure

- **File**: [components/dashboard/NoteCanvas.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/NoteCanvas.tsx)
- **Props interface**: `NoteCanvasProps` (lines 37–58) accepting `note`, `curriculum`, `activeLessonId`, callbacks, and modal state flags.

### Canvas Header Layout (Lines 616–710)
```tsx
<header className="border-b border-transparent dark:border-transparent px-6 py-3 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-950 z-10">
  <div>
    <h1 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      {note.title.replace(/^(\d+\s*[\cdot·\-–—]\s*)+/u, '').trim()}
    </h1>
    {readingSection && (
      <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
        <span>{readingSection}</span>
      </p>
    )}
  </div>

  <div className="flex items-center gap-2">
    {/* Audio Play/Pause Button */}
    {/* Audio Restart Button */}
    {/* View Mode Toggle: Summary | Transcription */}
    {/* Reset Demo Button */}
  </div>
</header>
```

### Action Insertion Points
The header action container at line 629 (`<div className="flex items-center gap-2">`) is the exact insertion point for:
1. **`[Studio]` Button**:
   - Conditionally rendered if `enableNotebookLMStudio` user setting is `true`.
   - Launches `StudioModal.tsx`.
   - Style: `p-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium`.
   - Icon: `Sparkles` or `Radio` or `Film` from `lucide-react`.
2. **`[Sources]` Toggle Button**:
   - Controls expanding/collapsing the right-column `SourcesTray`.
   - Style: Same rounded-lg button pattern with `BookOpen` icon and badge count of grounded papers.

### Canvas Body Structure (Lines 713–1172)
The canvas body is divided into:
- **Left Column**: Lessons Sidebar (`<aside className="w-60 sm:w-72 bg-transparent flex flex-col shrink-0 overflow-hidden select-none">`, lines 716–767). Renders the ordered list of roadmap lessons with status indicators.
- **Center Column**: Scrollable note canvas (`<div className="flex-1 flex flex-col h-full overflow-hidden w-full">`, lines 771–1170):
  - Stepper navigation bar (lines 777–804): Intuition, Framework, Mechanism, Boundary Checkpoint, Synthesis.
  - Scrollable `<main>` area (lines 773–1121): Rich content renderers, interactive MCQs, artifact viewers, Socratic checkpoints, proving grounds, and defense trigger card.
  - Bottom bar: `<AskTeacherBar>` (line 1140) and floating `<SideQuestionModal>` (line 1154).
- **Right Column (Target for SourcesTray)**:
  - Sits inside `<div className="flex-1 flex overflow-hidden">` directly to the right of the Center Column.
  - Collapsible container with animated transition (`transition-all duration-200`).

---

## 4. Dashboard Components Inventory

Directory: [components/dashboard/](file:///Users/dabodestroyer/code/Ater/components/dashboard/)

| Component | File Path | Current Purpose |
|---|---|---|
| `NoteCanvas` | [NoteCanvas.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/NoteCanvas.tsx) | Main study canvas, lesson stepper, and content viewer. |
| `AskTeacherBar` | [AskTeacherBar.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/AskTeacherBar.tsx) | Bottom input bar with voice indicator and teacher dispatch. |
| `SideQuestionModal` | [SideQuestionModal.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/SideQuestionModal.tsx) | Centered floating pop-up card for contextual Q&A threads. |
| `FeynmanModal` | [FeynmanModal.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/FeynmanModal.tsx) | Full-screen oral/written Socratic defense gate. |
| `InlineMCQCard` | [InlineMCQCard.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/InlineMCQCard.tsx) | Mid-lesson interactive retrieval questions (MCQ, True/False, Blank, Matching, Short Answer). |

### Related Reference Components
- [components/LeftDrawer.tsx](file:///Users/dabodestroyer/code/Ater/components/LeftDrawer.tsx): Reference implementation for collapsible sidebars (`w-72` vs `w-12`, `PanelLeftClose`/`PanelLeft`).
- [components/intake/IntakeModal.tsx](file:///Users/dabodestroyer/code/Ater/components/intake/IntakeModal.tsx): Reference implementation for centered overlay modals (`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`, `rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950`).

---

## 5. Design Tokens & CSS Styling Guidelines

Configuration files:
- [tailwind.config.js](file:///Users/dabodestroyer/code/Ater/tailwind.config.js): `darkMode: 'class'`, content paths configured for `./app`, `./components`, `./lib`.
- [app/globals.css](file:///Users/dabodestroyer/code/Ater/app/globals.css):
  - `:root { --background: #ffffff; --foreground: #09090b; }`
  - `.dark { --background: #09090b; --foreground: #fafafa; }`

### Exact Utility Token Conventions
- **Backgrounds**:
  - Primary canvas: `bg-white dark:bg-zinc-950`
  - Card surfaces: `bg-zinc-50/70 dark:bg-zinc-900/60` or `bg-white dark:bg-zinc-900`
  - Subtle interactive pill/button: `bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800`
  - Modal backdrop: `bg-black/60 backdrop-blur-sm`
- **Borders**:
  - Default borders: `border border-zinc-200 dark:border-zinc-800`
  - Subtle separators: `border-zinc-100 dark:border-zinc-800/60`
  - Input/Hover focus: `border-zinc-300 dark:border-zinc-700` and `focus:ring-1 focus:ring-zinc-400`
- **Typography & Foreground**:
  - Primary text: `text-zinc-900 dark:text-zinc-100`
  - Secondary/meta text: `text-zinc-500 dark:text-zinc-400`
  - Monospace labels/tags: `font-mono text-[10px] uppercase tracking-wider text-zinc-400`
- **Border Radiuses**:
  - Small chips/buttons: `rounded-lg` or `rounded-md`
  - Standard cards and inputs: `rounded-xl`
  - Modals and large card containers: `rounded-2xl`
- **Whitespace & Density**:
  - High whitespace, zero visual clutter, generous padding (`p-4`, `p-5`, `p-6`).

---

## 6. User Settings & State Persistence Architecture

### Current Persistence Patterns
1. **LocalStorage Keys**:
   - `ater-theme`: Theme mode (`'dark'` | `'light'`).
   - `ater_global_language`: Global language preference (`'en'` | `'am'`).
   - `ater_curricula`: List of saved courses (`CourseCurriculum[]`).
   - `ater_notes`: List of saved lesson notes (`DynamicLessonNote[]`).
   - `ater_side_questions_${noteKey}_${language}`: Contextual Q&A threads.
2. **Database Sync**:
   - [lib/sync/store.ts](file:///Users/dabodestroyer/code/Ater/lib/sync/store.ts) provides dual-layer persistence: immediate local storage write followed by asynchronous Supabase upsert when online.
3. **React Contexts**:
   - [context/ThemeContext.tsx](file:///Users/dabodestroyer/code/Ater/context/ThemeContext.tsx) (`useTheme()`)
   - [context/LanguageContext.tsx](file:///Users/dabodestroyer/code/Ater/context/LanguageContext.tsx) (`useLanguage()`)

### Recommended Settings Pattern for Phase 6
- **Storage Key**: `ater_settings` or `ater_enable_notebooklm_studio` in `localStorage`.
- **State Interface**:
```ts
export interface UserSettings {
  enableNotebookLMStudio: boolean;
  enableFastResearchDefault?: boolean;
}
```
- **Default Value**: `enableNotebookLMStudio: true` (or toggleable).
- **Distraction-Free Canvas Guard**:
  When `enableNotebookLMStudio` is `false`:
  - The `[Studio]` button in `NoteCanvas.tsx` header is hidden.
  - The studio generation indicators are suppressed from the canvas.
- **UI Exposure**:
  - Toggle switch in Profile Dropdown Menu in [app/app/page.tsx](file:///Users/dabodestroyer/code/Ater/app/app/page.tsx) (lines 899–954 and 1024–1077) alongside Account and Settings.
  - Or dedicated Settings modal trigger.

---

## 7. Icon System & Emoji Verification

### Emoji Audit
- Ripgrep scan across all `.ts`, `.tsx`, `.css`, and `.json` files yielded **zero emojis**.
- Strictly zero emojis invariant is currently respected throughout the codebase.

### Icon System
- Library: `lucide-react` (version `^0.475.0`).
- Icons in use:
  - Navigation & App: `ArrowLeft`, `ArrowRight`, `Plus`, `Trash2`, `User`, `Settings`, `LogOut`, `Sun`, `Moon`.
  - Drawers & Panels: `PanelLeft`, `PanelLeftClose`, `Bookmark`, `History`, `GraduationCap`.
  - Viewers & Controls: `Sparkles`, `Copy`, `Check`, `RotateCcw`, `ZoomIn`, `ZoomOut`, `Maximize2`, `Play`, `Volume2`, `Mic`, `MicOff`, `X`, `Loader2`.
- Standard Icon Styling:
  - Header actions: `w-3.5 h-3.5` or `w-4 h-4`.
  - Color: `text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100`.

---

## 8. Target Blueprint for New Phase 6 UI Components

### 1. `components/dashboard/SourcesTray.tsx`
- **Container**: Collapsible right-hand panel inside `NoteCanvas` body.
- **Expanded Width**: `w-80 sm:w-96` with `border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex flex-col`.
- **Collapsed State**: Either hidden completely with toggle in header, or collapsed to a `w-10` vertical action rail.
- **Sub-components**:
  - Header: Title `Sources`, grounded paper count chip, close/collapse button (`PanelRightClose` or `X`).
  - Search Bar: Quick input `Find related sources...` with debounced search calling `/api/research/query` or Scholarxiv client.
  - Paper Cards:
    - Title, Authors, Year, DOI/absLink button.
    - Expandable abstract (`line-clamp-3` toggleable to full prose).
    - Key insight callout box with `border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 rounded-lg text-xs`.
    - "Silent Academic Grounding": No trivia questions; purely factual enrichment.

### 2. `components/dashboard/StudioModal.tsx`
- **Container**: Centered dialog using IntakeModal pattern:
  `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`.
- **Card**: `w-full max-w-2xl rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`.
- **Controls**:
  - Artifact Type selector: Podcast Audio, Video Explainer, Presentation Slides, Study Guide, Flashcards / Mind Map.
  - Options: Format, Depth (Fast Overview vs Deep Dive), Target Language (English / Amharic).
  - Generation state: Dispatches to `/api/studio/create`, polls `/api/studio/status`.
  - Non-blocking: Can be minimized/closed while polling continues in the background.
  - Built-in Viewer: Audio player (HTML5 / TTS player), Slides Carousel, or Markdown Document Viewer.

### 3. `app/research/page.tsx`
- **Container**: Dedicated Next.js page at `/research`.
- **Header**: Top branding, navigation back to `/app`, theme and language switches.
- **Search Station**:
  - Mode toggle: `Fast Research (~30s)` vs `Deep Research (~5m)`.
  - Source filter checkboxes/pills: `Scholarxiv Academic Literature`, `Web & General Insights`, `NotebookLM Deep Research`.
  - Search input with submit button.
- **Results Canvas**:
  - High-signal structured findings cards with takeaways and paper references.
  - Action trigger: `[Convert into Living Course]` calling `/api/curriculum/generate` to induct the user into a new study course.
