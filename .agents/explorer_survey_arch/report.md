# Ater Phase 6 Architecture Survey Report

This report provides a comprehensive architectural investigation of the existing codebase in `/Users/dabodestroyer/code/Ater` to prepare for Phase 6 execution: Literature Grounding, In-App NotebookLM Studio, In-Lesson Sources Tray, and Autonomous Research Station.

---

## 1. Package Configuration and Runtime Environment

### 1.1 Frameworks and Core Libraries
From [package.json](file:///Users/dabodestroyer/code/Ater/package.json):
- **Framework**: Next.js `^15.1.7` (Next.js 15 App Router architecture)
- **UI Runtime**: React `^19.0.0`, React-DOM `^19.0.0`
- **Styling**: Tailwind CSS `^3.4.17`, Autoprefixer `^10.4.20`, PostCSS `^8.5.2`
- **Class Utilities**: `clsx` `^2.1.1`, `tailwind-merge` `^3.7.0`
- **Icons**: `lucide-react` `^0.475.0`
- **Animation**: `motion` `^13.3.0`
- **Math and Diagrams**: `katex` `^0.18.7`, `mermaid` `^12.0.0`
- **Speech Synthesis**: `node-edge-tts` `^1.2.10`
- **AI Models & Backend Storage**:
  - `@google/generative-ai`: `^0.24.1`
  - `@supabase/supabase-js`: `^2.116.0`

### 1.2 Development and Testing Stack
- **Test Framework**: Vitest `^3.0.5`
- **Test Environment**: `jsdom` `^26.0.0`, `@testing-library/react` `^16.2.0`, `@testing-library/jest-dom` `^6.6.3`
- **Vite Integration**: `@vitejs/plugin-react` `^4.3.4`
- **TypeScript**: `^5.7.3`
- **Package Manager**: `pnpm@9.15.4` (also compatible with `npm` / `npx`)

### 1.3 State Management Observation
**Important**: Neither `zustand` nor any external state store is installed in `package.json`.
Instead, client-side state is managed cleanly with:
- React hooks (`useState`, `useRef`, `useCallback`, `useEffect`)
- React context providers ([context/ThemeContext.tsx](file:///Users/dabodestroyer/code/Ater/context/ThemeContext.tsx), [context/LanguageContext.tsx](file:///Users/dabodestroyer/code/Ater/context/LanguageContext.tsx))
- Persistent hybrid store in [lib/sync/store.ts](file:///Users/dabodestroyer/code/Ater/lib/sync/store.ts) combining Supabase database operations with `localStorage` fallbacks.
Phase 6 UI components should adhere to this established native React + local store pattern rather than introducing new dependencies.

### 1.4 Scripts
- `npm run dev`: `next dev`
- `npm run build`: `next build`
- `npm run start`: `next start`
- `npm run lint`: `next lint`
- `npm test` or `npx vitest run`: `vitest run`
- `npm run test:watch`: `vitest`

---

## 2. Existing API Routes and Curriculum Generation Architecture

### 2.1 Inventory of API Routes in `app/api/`
The API layer is organized into modular Route Handlers:
- **Admin**:
  - `app/api/admin/deployments/route.ts`
- **AI & Socratic Engines**:
  - `app/api/ai/compile-note/route.ts`: Compiles 5-section pedagogical `DynamicLessonNote`.
  - `app/api/ai/feynman-evaluate/route.ts`: Evaluates Feynman explanations against taboo words and causal thresholds.
  - `app/api/ai/feynman-prompt/route.ts`: Generates Feynman challenge questions and taboo criteria.
  - `app/api/ai/gate/route.ts`: Evaluates Socratic Defense Gate turns.
  - `app/api/ai/translate-curriculum/route.ts`: Translates course curricula between English and Amharic.
  - `app/api/ai/translate-note/route.ts`: Translates lesson notes between English and Amharic.
- **Curriculum Management**:
  - `app/api/curriculum/generate/route.ts`: Generates structured course roadmap DAGs.
  - `app/api/curriculum/modify/route.ts`: Modifies existing curricula based on student feedback.
  - `app/api/curriculum/remediate/route.ts`: Generates micro-remediation mini-lessons.
- **Ingestion & Discovery**:
  - `app/api/ingest/intake/route.ts`: Socratic discovery intake from prompt or PDF.
  - `app/api/ingest/grill/route.ts`: Evaluates student diagnostic answers during intake.
  - `app/api/demo/evaluate/route.ts`: Evaluates interactive landing page demonstrations.
- **Lesson & Voice**:
  - `app/api/lesson/step/route.ts`: Evaluates midway interactive checkpoints.
  - `app/api/voice/converse/route.ts`: Handles conversational side questions.
  - `app/api/voice/transcribe/route.ts`: Audio transcription.
  - `app/api/voice/tts/route.ts`: Edge Neural TTS audio streaming.

### 2.2 In-Depth Analysis: `/api/curriculum/generate`

#### Route Implementation
File: [app/api/curriculum/generate/route.ts](file:///Users/dabodestroyer/code/Ater/app/api/curriculum/generate/route.ts)
- **HTTP Method**: POST
- **Dynamic Config**: `export const dynamic = 'force-dynamic';`
- **Payload Validation**:
  - Verifies body is a JSON object.
  - Requires non-empty `topic: string`. Returns `400 Bad Request` if missing.
  - Reads optional `sourceType`, `answers`, `useMock`, `language`.
- **Execution Flow**:
  1. Calls `generateCourseCurriculum` from [lib/curriculum/generator.ts](file:///Users/dabodestroyer/code/Ater/lib/curriculum/generator.ts).
  2. If `useMock || !process.env.GEMINI_API_KEY`, immediately invokes `generateFallbackCurriculum`.
  3. When live API key is present, calls Google Gemini API (`GEMINI_MODEL || 'gemini-3.5-flash-lite'`).
  4. Parses structured JSON using `extractJsonFromResponse`.
  5. Enforces topological ordering: First lesson is `active` with empty prerequisites `[]`; subsequent lessons are `locked` with prerequisites pointing to the preceding lesson.
  6. Enforces the Single-Concept Invariant (15-20 minutes pacing), strictly zero emojis, and continuous analytical prose (zero bullets).
  7. On error or exception, catches cleanly and returns `generateFallbackCurriculum` with HTTP 200 to ensure client resilience.

#### Request Schema
Defined in [types/index.ts](file:///Users/dabodestroyer/code/Ater/types/index.ts) (line 314):
```typescript
export interface CurriculumGenerateRequest {
  topic: string;
  sourceType?: 'prompt' | 'pdf' | 'document';
  answers: Record<string, string>;
  useMock?: boolean;
  language?: 'en' | 'am';
}
```

#### Response Schema
Defined in [types/index.ts](file:///Users/dabodestroyer/code/Ater/types/index.ts) (line 37 & line 323):
```typescript
export type CurriculumGenerateResponse = CourseCurriculum;

export interface CourseCurriculum {
  id: string;                               // e.g. "course-distributed-systems"
  title?: string;                           // e.g. "Distributed Systems & Raft Consensus"
  topic: string;
  sourceType?: 'prompt' | 'pdf' | 'document';
  sourceName?: string;
  targetGoal?: string;                      // Synthesized learner goal
  learnerBaseline?: string;                 // Diagnostic baseline assessment
  learnerLevel?: string;
  lessons: RoadmapLesson[];                 // 3 to 6 ordered lessons
  activeLessonId: string;                   // Initial active lesson (e.g. "lesson-01")
  teacherWalkthrough?: string;              // Spoken audio narrative walkthrough
  disableGate?: boolean;
  createdAt?: string;
  generatedAt?: string;
}

export type LessonStatus = 'locked' | 'active' | 'mastered' | 'remediation';

export interface RoadmapLesson {
  id: string;                               // e.g. "lesson-01"
  order: number;                            // 1, 2, 3...
  title: string;                            // Concise concept name
  slug: string;                             // e.g. "01_foundational_principles"
  summary: string;                          // Continuous prose, zero bullets
  description?: string;                     // 1-2 sentence mastery outcome
  status: LessonStatus;                     // 'active' for first lesson, 'locked' for rest
  estimatedMinutes: number;                 // 15 or 20
  prerequisites: string[];                  // [] for lesson 1, [preceding] for rest
  conceptsCovered?: string[];               // Key conceptual tags
  isRemediation?: boolean;                  // false for normal curriculum
  parentLessonId?: string;
}
```

#### Relevance to Phase 6 Research Station Bridge (R3)
The `[Convert into Living Course]` bridge in `app/research/page.tsx` directly constructs a `CurriculumGenerateRequest`:
```typescript
const payload: CurriculumGenerateRequest = {
  topic: researchQuery,
  sourceType: 'document',
  answers: {
    q1: `Research Goal: ${selectedPaperTitles.join(', ')}`,
    q2: `Academic Synthesis: ${synthesisSummary}`,
  },
};
const res = await fetch('/api/curriculum/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const curriculum: CourseCurriculum = await res.json();
```
The resulting curriculum is then saved via `saveCourseToStore(curriculum)` and the user is redirected to `/app`.

---

## 3. Existing `lib/` Architecture and Storage Utilities

### 3.1 Directory Map
```
lib/
├── ai/
│   ├── gate.ts               # Socratic Defense Gate engine & scoring
│   └── gemini.ts             # Gemini API client, JSON extractor, prose sanitizer
├── curriculum/
│   ├── generator.ts          # Living curriculum generator & fallbacks
│   ├── intake.ts             # Dual intake processing, emoji/bullet sanitizers
│   ├── notes.ts              # 5-section DynamicLessonNote compiler & cache
│   ├── showcaseCourses.ts    # Deterministic showcase course fixtures
│   └── viewerDemo.ts         # Rich content viewer demo curriculum
├── i18n/
│   └── translations.ts       # English and Amharic UI dictionaries
├── supabase/
│   ├── client.ts             # Browser Supabase client (singleton)
│   └── server.ts             # Server Supabase client (service role / anon)
├── sync/
│   └── store.ts              # LocalStorage + Supabase sync layer
├── voice/
│   ├── ttsCache.ts           # Node Edge TTS cache (disk + memory)
│   └── ttsClient.ts          # Browser audio coordinator singleton
└── utils.ts                  # Tailwind clsx/twMerge helper (cn)
```

### 3.2 Existing Types Architecture
- [types/index.ts](file:///Users/dabodestroyer/code/Ater/types/index.ts): Core domain contracts: `CourseCurriculum`, `RoadmapLesson`, `DynamicLessonNote`, `LessonCheckpoint`, `SocraticGateSession`, `FeynmanEvaluation`.
- [types/scholarxiv.ts](file:///Users/dabodestroyer/code/Ater/types/scholarxiv.ts): Already defines complete Scholarxiv contracts:
  - `ScholarxivPaper`: `id`, `extractedID`, `title`, `summary`, `authors`, `published`, `doi`, `pdfLink`, `absLink`, etc.
  - `ScholarxivSearchResponse`: `data: ScholarxivPaper[]`, `pagination: ScholarxivPagination`.
  - `ScholarxivSearchOptions`: `query`, `searchFilterString`, `limit`, `page`, `sortBy`, `sortOrder`.
  - `ScholarxivCollection`, `ScholarxivRouterRequest`, `ScholarxivRouterResponse`.

### 3.3 Target Greenfield Modules for Phase 6
- `lib/scholarxiv/client.ts`: Interfaces with Scholarxiv MCP / REST API. Exports `searchScholarxivPapers(query, options)` with offline fallback fixtures matching `ScholarxivSearchResponse`.
- `lib/notebooklm/client.ts`: Interfaces with NotebookLM MCP / REST API. Exports `createNotebook`, `listNotebooks`, `addNotebookSource`, `createStudioArtifact`, `pollStudioStatus`, `startResearchQuery`, `pollResearchStatus` with offline fallbacks.
- New API Endpoints:
  - `app/api/research/query/route.ts`
  - `app/api/studio/create/route.ts`
  - `app/api/studio/status/route.ts`

---

## 4. Test Configuration and Verification Patterns

### 4.1 Vitest Setup
- **Config**: [vitest.config.ts](file:///Users/dabodestroyer/code/Ater/vitest.config.ts)
  - `environment: 'jsdom'`
  - `globals: true`
  - `setupFiles: ['./tests/setup.ts']`
  - `testTimeout: 30000`
  - `alias: { '@': path.resolve(__dirname, './') }`
- **Setup Polyfills**: [tests/setup.ts](file:///Users/dabodestroyer/code/Ater/tests/setup.ts)
  - Imports `@testing-library/jest-dom/vitest`.
  - Configures `dotenv` to load `.env.local`.
  - Polyfills `window.localStorage` and `globalThis.localStorage`.

### 4.2 Current Test Suite Status
Running `npx vitest run` executes 3 existing test suites:
1. `tests/landing.test.ts`: 7 tests verifying `/api/demo/evaluate` route handler with various responses, Supabase client initialization, and waitlist validation.
2. `tests/gate_engine.test.ts`: 10 tests verifying Socratic defense questions battery, Amharic language support, score evaluations, and session completion.
3. `tests/feynman_prompt.test.ts`: 2 tests verifying `/api/ai/feynman-prompt` route handler with missing concept rejection and mocked Gemini fetch.
- **Verification Baseline**: 19 tests passing across 3 test files, 0 failures, duration ~1s.

### 4.3 Build Status
Running `npm run build` succeeds cleanly with:
- Next.js 15.5.25 optimized production build.
- 0 TypeScript errors (`tsc --noEmit`).
- 0 ESLint errors.
- Prerendering of 14 static and dynamic routes.

### 4.4 Test Conventions for Phase 6 Tests
Phase 6 requires three new automated test files:
- `tests/scholarxiv_client.test.ts`: Test search querying, metadata mapping (`title`, `authors`, `doi`, `summary`), error handling, and deterministic fallback responses when external MCP/network is offline.
- `tests/studio_engine.test.ts`: Test artifact creation payload formatting, options parsing, and status polling state transitions (`queued` -> `processing` -> `completed` / `failed`).
- `tests/research_bridge.test.ts`: Test transformation of research findings into `CurriculumGenerateRequest` and verify `CourseCurriculum` output conformity.
Pattern to follow:
- Import Route Handlers directly (`import { POST } from '@/app/api/...'`).
- Pass web-standard `Request` or `NextRequest`.
- Use deterministic mock options (`useMock: true` or mocked `fetch`).

---

## 5. Potential Conflicts, Path Aliases, and TypeScript Strictness

### 5.1 Path Aliases
- In [tsconfig.json](file:///Users/dabodestroyer/code/Ater/tsconfig.json):
  ```json
  "paths": {
    "@/*": ["./*"]
  }
  ```
- Any file in `lib/`, `app/`, `components/`, `types/` is imported as `@/lib/...`, `@/components/...`, `@/types`.
- This matches Vitest's alias configuration in `vitest.config.ts`.

### 5.2 TypeScript Strictness
- `strict: true` is enabled in `tsconfig.json`.
- `target: ES2022`, `moduleResolution: bundler`, `skipLibCheck: true`.
- All function parameters, API payloads, and component props must have explicit TypeScript types.
- Strict null checks apply: handle `null` and `undefined` gracefully for optional properties.

### 5.3 Invariant Checklist for Phase 6
1. **Zero Emojis Invariant**:
   No emojis in any user-facing strings, logs, or comments. The project provides `stripEmojis()` in [lib/curriculum/intake.ts](file:///Users/dabodestroyer/code/Ater/lib/curriculum/intake.ts) for sanitizing inputs.
2. **Minimalist UI Aesthetic**:
   Use Tailwind tokens: `bg-white dark:bg-zinc-950`, `text-zinc-900 dark:text-zinc-50`, `border-zinc-200 dark:border-zinc-800`, `rounded-xl`, high whitespace.
3. **Continuous Prose Invariant**:
   Lesson summaries, descriptions, and takeaways must use continuous analytical prose with strictly zero bullet points (`cleanContinuousProse()` in [lib/curriculum/intake.ts](file:///Users/dabodestroyer/code/Ater/lib/curriculum/intake.ts)).
4. **Resilient Offline Fallbacks**:
   Whenever an external MCP server or API (Scholarxiv, NotebookLM) is offline or fails, all client functions and API routes must return valid, typed fallback responses with HTTP 200. Tests must never fail due to lack of network or external credentials.
5. **Next.js 15 Route Handler Dynamic Export**:
   All new API routes must include `export const dynamic = 'force-dynamic';` to prevent Next.js from caching dynamic route responses at build time.
6. **Client Component Directives**:
   All React components using hooks (`useState`, `useEffect`, `useRef`) or browser APIs (`localStorage`, `window`) must have `'use client';` as the first line.

---

## 6. Summary of Architectural Recommendations for Implementers

| Component / File | Recommendation |
| :--- | :--- |
| `lib/scholarxiv/client.ts` | Re-export or import types from `@/types/scholarxiv`. Provide `searchScholarxivPapers()` with fallback fixtures returning `ScholarxivSearchResponse`. |
| `lib/notebooklm/client.ts` | Define studio artifact types (`podcast_audio`, `video_explainer`, `presentation_slides`, `study_guide`, `flashcards`). Provide offline mock states. |
| `app/api/research/query/route.ts` | Accept `{ query: string, mode?: 'fast' | 'deep', sources?: string[], useMock?: boolean }`. Return unified findings. |
| `app/api/studio/create/route.ts` | Accept artifact creation configuration, return `{ artifactId, status: 'queued' | 'processing' }`. |
| `app/api/studio/status/route.ts` | Accept `artifactId`, return status, progress percentage, and artifact URL/content when completed. |
| `components/dashboard/SourcesTray.tsx` | Collapsible right column in `app/app/page.tsx` / `NoteCanvas`. Render grounded Scholarxiv cards with expandable abstracts and quick search. |
| `components/dashboard/StudioModal.tsx` | Modal triggered via `[Studio]` button in `NoteCanvas` header. Artifact type selector, configuration options, progress polling bar, and embedded media viewer. |
| `app/research/page.tsx` | Dedicated autonomous research station. Search bar with fast/deep toggle, source toggles, cards, and `[Convert into Living Course]` bridge calling `/api/curriculum/generate`. |
