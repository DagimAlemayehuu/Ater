# Project: Ater Phase 6 (Literature Grounding, NotebookLM Studio, Sources Tray, and Autonomous Research Station)

## Architecture
- **Framework**: Next.js 15.1.7 (App Router), React 19.0.0, Tailwind CSS 3.4.17, Vitest 3.0.5, TypeScript 5 (strict mode).
- **Module Boundaries**:
  - `lib/scholarxiv/client.ts`: Interfaces with Scholarxiv MCP / Streamable HTTP API; search, metadata parsing, and offline fallback fixtures.
  - `lib/notebooklm/client.ts`: Interfaces with NotebookLM MCP; notebook management, source attachment, async studio artifact creation & polling, fast/deep research queries, and offline fallbacks.
  - `app/api/research/query/route.ts`: Server-side endpoint performing federated academic/web/notebook research queries.
  - `app/api/studio/create/route.ts`: Server-side endpoint initiating async artifact generation with parameter payloads.
  - `app/api/studio/status/route.ts`: Server-side endpoint polling artifact status and returning media URLs.
  - `components/dashboard/SourcesTray.tsx`: Collapsible right-column panel in `/app` study canvas rendering grounded paper cards with expandable abstracts, key insights, and live literature search.
  - `components/dashboard/StudioModal.tsx`: Modal dialog launched from `NoteCanvas` header; artifact configuration, non-blocking progress polling, and built-in media viewer.
  - `app/research/page.tsx`: Full-page Autonomous Research Station with fast/deep modes, source filter toggles, structured finding cards, and `[Convert into Living Course]` bridge trigger.
  - `lib/research/bridge.ts`: Data transformation mapping research station results into `CurriculumGenerateRequest` for `/api/curriculum/generate`.
  - `tests/`: Vitest automated test suite ensuring 100% pass rate across clients, studio engine, and bridge.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| 1 | Scholarxiv Client & Fallbacks | `lib/scholarxiv/client.ts` with topic search, metadata parsing (Title, Authors, Year, DOI/URL, Abstract, Key Insight), and offline fallbacks | M1 | ORIGINAL_REQUEST §R1 |
| 2 | NotebookLM Client & Studio Engine | `lib/notebooklm/client.ts` with notebook create/list, source add, studio create/poll (Audio, Video, Slides, Guide, Flashcards), research queries, and fallbacks | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Research Query API Route | `app/api/research/query/route.ts` unified search across Scholarxiv, Web, and NotebookLM | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Studio Create & Status API Routes | `app/api/studio/create/route.ts` & `app/api/studio/status/route.ts` async creation and polling endpoints | M1 | ORIGINAL_REQUEST §R1 |
| 5 | In-Lesson Sources Tray | `components/dashboard/SourcesTray.tsx` collapsible right-column panel in `/app` canvas with paper cards, expandable abstract/insight, and search bar | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Studio Creator Modal & Viewer | `components/dashboard/StudioModal.tsx` launched from NoteCanvas header [Studio] button, artifact options, progress indicator, media viewer | M2 | ORIGINAL_REQUEST §R2 |
| 7 | User Settings Toggle | Toggle for `Enable NotebookLM Studio` in localStorage (`ater_enable_notebooklm_studio`) preserving distraction-free canvas when disabled | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Autonomous Research Station | `app/research/page.tsx` with Fast (~30s) vs Deep (~5m) mode toggles, source filter toggles, structured findings cards | M3 | ORIGINAL_REQUEST §R3 |
| 9 | Course Generator Bridge | `lib/research/bridge.ts` and `[Convert into Living Course]` button mapping research output to `/api/curriculum/generate` payload | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Vitest Unit Test Suite | `tests/scholarxiv_client.test.ts`, `tests/studio_engine.test.ts`, `tests/research_bridge.test.ts` passing 100% (`npx vitest run`) | M4 | ORIGINAL_REQUEST §R4 |
| 11 | Production Build Verification | Next.js 15 production build succeeds with exit code 0 (`npm run build`) | M4 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Scholarxiv & NotebookLM Backend Integration | `lib/scholarxiv/client.ts`, `lib/notebooklm/client.ts`, `/api/research/query`, `/api/studio/create`, `/api/studio/status` | none | PLANNED |
| M2 | In-Lesson Sources Tray & Studio Modal Canvas Integration | `components/dashboard/SourcesTray.tsx`, `components/dashboard/StudioModal.tsx`, `NoteCanvas.tsx` header/body hookup, settings toggle | M1 | PLANNED |
| M3 | Autonomous Research Station & Course Induction Bridge | `app/research/page.tsx`, `lib/research/bridge.ts`, bridge trigger to `/api/curriculum/generate` | M1, M2 | PLANNED |
| M4 | Verification Suite & Production Build | `tests/scholarxiv_client.test.ts`, `tests/studio_engine.test.ts`, `tests/research_bridge.test.ts`, Vitest 100% pass, Next.js build clean | M1, M2, M3 | PLANNED |

## Interface Contracts

### 1. Scholarxiv Client (`lib/scholarxiv/client.ts`)
```typescript
import { ScholarxivPaper, ScholarxivSearchResponse, ScholarxivSearchOptions } from '@/types/scholarxiv';

export interface IScholarxivClient {
  searchPapers(options: ScholarxivSearchOptions): Promise<ScholarxivSearchResponse>;
  getPaper(paperId: string): Promise<ScholarxivPaper | null>;
}
```
- Metadata fields guaranteed: `id`, `title`, `authors` (string[]), `year` (number), `doi` (string), `url` (string), `abstract` (string), `keyInsight` (string), `categories` (string[]).
- When live API or MCP is offline/fails, returns deterministic domain-indexed fixtures (consensus, attention, memory, operating systems) with zero unhandled exceptions.

### 2. NotebookLM Client (`lib/notebooklm/client.ts`)
```typescript
export type StudioArtifactType = 'audio' | 'video' | 'slide_deck' | 'report' | 'flashcards' | 'mind_map';

export interface StudioCreateOptions {
  notebookId?: string;
  artifactType: StudioArtifactType;
  format?: string; // e.g. "deep_dive", "explainer", "Study Guide"
  visualStyle?: string;
  language?: string;
  sourceContext?: string;
}

export interface StudioCreateResponse {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  artifactId: string;
  notebookId: string;
  artifactType: StudioArtifactType;
  estimatedSeconds: number;
  message?: string;
}

export interface StudioStatusResponse {
  status: 'in_progress' | 'completed' | 'failed';
  progress: number; // 0 to 100
  artifactId: string;
  mediaUrl?: string;
  content?: string;
  error?: string;
}

export interface ResearchQueryOptions {
  query: string;
  mode: 'fast' | 'deep'; // ~30s vs ~5m
  sources: Array<'scholarxiv' | 'web' | 'notebooklm'>;
}

export interface ResearchFinding {
  title: string;
  summary: string;
  takeaways: string[];
  papers: ScholarxivPaper[];
  webCitations?: Array<{ title: string; url: string }>;
  reportContext?: string;
}
```

### 3. API Routes
- `POST /api/research/query`:
  - Body: `ResearchQueryOptions`
  - Response: `{ status: 'success', data: ResearchFinding }`
- `POST /api/studio/create`:
  - Body: `StudioCreateOptions`
  - Response: `{ status: 'success', data: StudioCreateResponse }`
- `GET /api/studio/status?artifactId=...`:
  - Query parameter: `artifactId` (string)
  - Response: `{ status: 'success', data: StudioStatusResponse }`

### 4. Course Induction Bridge (`lib/research/bridge.ts`)
```typescript
import { CurriculumGenerateRequest } from '@/types';
import { ResearchFinding } from '@/lib/notebooklm/client';

export function buildCurriculumFromResearch(
  finding: ResearchFinding,
  language: 'en' | 'am' = 'en'
): CurriculumGenerateRequest {
  return {
    topic: finding.title,
    sourceType: 'document',
    language,
    answers: {
      q1: finding.summary,
      q2: 'Intermediate academic baseline with foundational knowledge',
      academic_literature: finding.papers.map(p => `${p.title} (${p.year}) - ${p.keyInsight}`).join('\n'),
      research_report_context: finding.takeaways.join('\n')
    }
  };
}
```

## Code Layout
- `lib/scholarxiv/client.ts`: Scholarxiv client, parser, and offline fixtures.
- `lib/notebooklm/client.ts`: NotebookLM client, studio engine, and offline fallbacks.
- `lib/research/bridge.ts`: Research station to curriculum generator payload bridge.
- `app/api/research/query/route.ts`: Research query API endpoint.
- `app/api/studio/create/route.ts`: Studio artifact creation endpoint.
- `app/api/studio/status/route.ts`: Studio artifact status polling endpoint.
- `components/dashboard/SourcesTray.tsx`: In-lesson collapsible sources tray.
- `components/dashboard/StudioModal.tsx`: Studio modal and media viewer.
- `components/dashboard/NoteCanvas.tsx`: Header trigger and layout container integration.
- `app/research/page.tsx`: Autonomous research station page.
- `tests/scholarxiv_client.test.ts`: Vitest unit tests for Scholarxiv client.
- `tests/studio_engine.test.ts`: Vitest unit tests for Studio engine.
- `tests/research_bridge.test.ts`: Vitest unit tests for Course induction bridge.

## Invariant Enforcement
1. Zero Emojis: Strictly zero emojis across all code, notes, logs, and UI.
2. Minimalist UI Aesthetic: Zinc-900 / zinc-50 tokens, border-zinc-200 dark:border-zinc-800, rounded-xl borders, high whitespace, no visual clutter.
3. Plain, Everyday English: Clear, accessible vocabulary in UI and telemetry.
4. Silent Academic Grounding: Scholarxiv papers are strictly for factual enrichment and optional reading; no trivia questioning.
5. Async Non-Blocking Architecture: All studio generations and deep queries are asynchronous with polling and resilient offline fallbacks.
6. Git safety: Zero git commit or git push commands.
