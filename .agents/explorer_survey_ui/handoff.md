# Phase 6 Frontend UI and Canvas Handoff Report

**Agent**: `explorer_survey_ui`  
**Date**: 2026-09-16T13:22:00Z  
**Target Project**: [/Users/dabodestroyer/code/Ater](file:///Users/dabodestroyer/code/Ater)  
**Handoff Type**: Hard (Task complete)  

---

## 1. Observation

Direct observations from examining the codebase:

1. **Canvas Page Location**:
   - The primary canvas page is located at [[app/app/page.tsx](file:///Users/dabodestroyer/code/Ater/app/app/page.tsx)].
   - It is a Next.js 15 Client Component (`'use client'`).
   - Line 32 manages the view state: `const [currentView, setCurrentView] = useState<'library' | 'study'>('library');`.
   - In `'study'` view (lines 1185–1212), it renders:
     ```tsx
     <div className="flex-1 flex overflow-hidden">
       <NoteCanvas
         note={activeNote}
         curriculum={curriculum}
         activeLessonId={activeLesson?.id}
         onSelectLesson={(lesson) => loadLesson(lesson, curriculum?.id)}
         savedCourses={savedCourses}
         onSelectCourse={(c) => { ... }}
         isLoading={isCompilingNote || isTranslating}
         onFeynmanSubmit={handleFeynmanSubmit}
         feynmanEvaluation={feynmanEvaluation}
         isEvaluatingFeynman={isEvaluatingFeynman}
         onOpenFeynman={() => setIsFeynmanModalOpen(true)}
         onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
         initialViewMode="interactive"
         language={appLanguage}
         isFeynmanOpen={isFeynmanModalOpen}
         isIntakeOpen={isIntakeModalOpen}
       />
     </div>
     ```

2. **NoteCanvas Component & Header Structure**:
   - Located at [[components/dashboard/NoteCanvas.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/NoteCanvas.tsx)].
   - The sub-header is rendered at lines 616–710:
     - Left: Note title (`note.title.replace(...)`) and `readingSection` indicator.
     - Right (lines 629–709): Actions container `<div className="flex items-center gap-2">` holding Play/Pause, Restart, View Mode Toggle, and Reset Demo.
     - This exact container is the insertion point for the `[Studio]` button and `[Sources]` toggle button.
   - The body is rendered at lines 713–1172:
     - Left column (lines 716–767): `<aside className="w-60 sm:w-72 bg-transparent flex flex-col shrink-0 overflow-hidden select-none">` containing roadmap lessons.
     - Center column (lines 771–1170): `<div className="flex-1 flex flex-col h-full overflow-hidden w-full">` containing the section stepper nav, scrollable note content, bottom `<AskTeacherBar>`, and `<SideQuestionModal>`.
     - Right column: Currently does not have a third column; this is the insertion point for the collapsible `SourcesTray`.

3. **Dashboard Components**:
   - Directory [[components/dashboard/](file:///Users/dabodestroyer/code/Ater/components/dashboard/)] currently contains 5 files:
     - `AskTeacherBar.tsx` (static bottom question input bar with audio indicator).
     - `SideQuestionModal.tsx` (floating pop-up card for contextual Q&A threads).
     - `FeynmanModal.tsx` (full-screen oral/written Socratic defense gate).
     - `InlineMCQCard.tsx` (retrieval questions embedded in note sections).
     - `NoteCanvas.tsx` (main canvas).
   - `SourcesTray.tsx` and `StudioModal.tsx` do not exist yet.

4. **Design Tokens & Styling**:
   - Configured in [[tailwind.config.js](file:///Users/dabodestroyer/code/Ater/tailwind.config.js)] and [[app/globals.css](file:///Users/dabodestroyer/code/Ater/app/globals.css)].
   - Tokens:
     - Dark background: `dark:bg-zinc-950`
     - Light background: `bg-white`
     - Text: `text-zinc-900 dark:text-zinc-100` (subtle: `text-zinc-500 dark:text-zinc-400`)
     - Borders: `border-zinc-200 dark:border-zinc-800` (subtle: `border-zinc-100 dark:border-zinc-800/60`)
     - Cards: `bg-zinc-50/70 dark:bg-zinc-900/60` and `bg-white dark:bg-zinc-900`
     - Radiuses: `rounded-xl` for interactive elements and cards, `rounded-2xl` for modals and stepper containers.
     - Fonts: `font-sans` with `font-mono` accents.

5. **State Store & User Settings**:
   - Local state is backed by `localStorage` with keys prefixed by `ater_` (e.g. `ater_global_language`, `ater-theme`, `ater_curricula`, `ater_notes`).
   - Cloud sync is handled in [[lib/sync/store.ts](file:///Users/dabodestroyer/code/Ater/lib/sync/store.ts)] using Supabase with `localStorage` fallbacks.
   - For `Enable NotebookLM Studio`, storing in `localStorage` under `ater_enable_notebooklm_studio` (boolean) provides instantaneous retrieval and clean toggling.

6. **Icon System & Emojis**:
   - Emojis: Zero emojis detected via ripgrep across all `.ts`, `.tsx`, `.css`, and `.json` files.
   - Icons: Powered by `lucide-react` (version `^0.475.0`). Standard icons include `Plus`, `Trash2`, `ArrowLeft`, `ArrowRight`, `Settings`, `User`, `Sun`, `Moon`, `LogOut`, `X`, `Loader2`, `Sparkles`, `BookOpen`.

7. **Test Suite Baseline**:
   - Command `npx vitest run` executed with exit code 0: 3 test files passed, 19 tests passed (0 failures).

---

## 2. Logic Chain

1. **Sources Tray Placement**:
   - In `NoteCanvas.tsx`, line 713 defines `<div className="flex-1 flex overflow-hidden">`.
   - Inside this flex container, the Left Column is an `<aside>` of width `w-60 sm:w-72` and the Center Column is `<div className="flex-1 flex flex-col h-full overflow-hidden w-full">`.
   - Therefore, placing `<SourcesTray isOpen={sourcesOpen} onToggle={...} />` as a third child within this flex container creates a collapsible right-column panel without altering existing layout boundaries.
   - When collapsed, the Center Column expands to take the available width (`flex-1`). When expanded (`w-80 sm:w-96`), the Center Column smoothly contracts with zero layout breakage.

2. **Studio Trigger Placement**:
   - In `NoteCanvas.tsx`, line 629 defines `<div className="flex items-center gap-2">` which holds all canvas-level action triggers.
   - Placing the `[Studio]` button inside this container matches the exact button aesthetics of `handleTogglePause` and `handleRestartAudio`.
   - Conditional rendering `enableNotebookLMStudio && (<button onClick={() => setIsStudioOpen(true)}>...</button>)` guarantees that when the user setting is disabled, the canvas remains distraction-free.

3. **Modal Pattern Conformity**:
   - `IntakeModal.tsx` and `SideQuestionModal.tsx` use `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4` and an inner card of `rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-2xl`.
   - `StudioModal.tsx` should follow this exact pattern for visual harmony and responsive behavior.

4. **Autonomous Research Station**:
   - `app/research/page.tsx` is an independent page route in the Next.js App Router.
   - Because `CourseCurriculum` creation is already standardized via `/api/curriculum/generate` (and handled client-side in `app/app/page.tsx` through `saveCourseToStore`), the `[Convert into Living Course]` button can simply call `/api/curriculum/generate`, persist the result to the store via `saveCourseToStore`, and navigate to `/app` with the new course activated.

---

## 3. Caveats

1. **No External Network Dependency**:
   - Scholarxiv MCP and NotebookLM MCP integration must implement strict offline fallback mocks to guarantee that Vitest tests and offline development operate without timeouts or network crashes.
2. **DynamicLessonNote Schema**:
   - `DynamicLessonNote` in `types/index.ts` does not currently include a `sources?: ScholarxivPaper[]` property. When implementing Phase 6, adding an optional `sources?: ScholarxivPaper[]` field to `DynamicLessonNote` in `types/index.ts` will allow notes to carry their grounded papers deterministically.
3. **Settings Context**:
   - While a direct `localStorage` read/write is sufficient, wrapping it in a hook (`useUserSettings`) or context will allow components in `/app` and `/research` to respond reactively to setting toggles.

---

## 4. Conclusion

The Ater frontend architecture is clean, highly modular, and ready for Phase 6 implementation:
1. `NoteCanvas.tsx` has exact designated insertion points for the `[Studio]` header button (line 629) and the collapsible right-column `SourcesTray.tsx` (line 713).
2. `components/dashboard/` provides mature modal and card patterns (`IntakeModal`, `AskTeacherBar`, `SideQuestionModal`, `InlineMCQCard`) to model `SourcesTray.tsx` and `StudioModal.tsx` after.
3. The design tokens (`bg-white dark:bg-zinc-950`, `border-zinc-200 dark:border-zinc-800`, `rounded-xl`, `rounded-2xl`, high whitespace) and icon conventions (`lucide-react`, zero emojis) are clearly defined and consistent across all files.
4. User settings can be cleanly stored in `localStorage` (`ater_enable_notebooklm_studio`) to toggle the Studio trigger and preserve distraction-free studying.

---

## 5. Verification Method

To independently verify all observations in this report:

1. **Verify Canvas & Dashboard Structure**:
   - Inspect [app/app/page.tsx](file:///Users/dabodestroyer/code/Ater/app/app/page.tsx) lines 838–1212.
   - Inspect [components/dashboard/NoteCanvas.tsx](file:///Users/dabodestroyer/code/Ater/components/dashboard/NoteCanvas.tsx) lines 616–775.
2. **Verify Emoji Invariant**:
   - Run ripgrep for emoji ranges:
     `rg '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' app components lib`
     Result must be empty (0 matches).
3. **Verify Existing Tests**:
   - Execute the test suite:
     `npx vitest run`
     Expected result: 3 test files passed, 19 tests passed, exit code 0.
