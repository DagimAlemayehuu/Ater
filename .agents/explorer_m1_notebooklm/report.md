# Technical Investigation and Implementation Specification: NotebookLM Client & Studio Engine

- Agent: explorer_m1_notebooklm
- Target Module: [lib/notebooklm/client.ts](file:///Users/dabodestroyer/code/Ater/lib/notebooklm/client.ts)
- Target Types: [types/notebooklm.ts](file:///Users/dabodestroyer/code/Ater/types/notebooklm.ts) or [types/index.ts](file:///Users/dabodestroyer/code/Ater/types/index.ts)
- Timestamp: 2026-09-16T13:30:00Z
- Milestone: M1 (NotebookLM Client & Studio Engine)

---

## 1. Executive Summary

This report delivers the authoritative design, interface contracts, state machine architecture, and offline fallback implementation specifications for [lib/notebooklm/client.ts](file:///Users/dabodestroyer/code/Ater/lib/notebooklm/client.ts).

The investigation verified:
1. Local MCP environment: The binary `/Users/dabodestroyer/.local/bin/notebooklm-mcp` and CLI `/Users/dabodestroyer/.local/bin/nlm` are operational on the host system with valid Google authentication (`nlm login --check` returned valid credentials and 13 existing notebooks).
2. Protocol & tool schemas: Inspected tool parameter schemas in `/Users/dabodestroyer/.gemini/antigravity/mcp/notebooklm/*.json` and validated tool behaviors for `notebook_create`, `notebook_list`, `source_add`, `studio_create`, `studio_status`, `research_start`, and `research_status`.
3. Critical protocol invariants:
   - `studio_create` strictly requires `confirm: true` in its execution payload. When `confirm: false` (or omitted), it returns `status: "pending_confirmation"`, halting generation.
   - `research_start` in deep mode (`mode: "deep"`) strictly requires `source: "web"`. Searching Google Drive in deep mode causes an unhandled validation rejection.
   - Studio generation takes 30 to 300 seconds; all operations must be non-blocking with asynchronous polling.
4. Resilient offline fallback simulation: An in-memory state machine tracks active generation sessions, simulates monotonic progress increments (`in_progress` -> `completed`), and returns rich, typed mock artifacts when external MCP is unreachable or `useMock: true` is passed.

---

## 2. Notebook Management Specification

### 2.1 Notebook Creation (`notebook_create`)

#### Purpose
Creates a dedicated NotebookLM notebook container for a specific Ater course or study session. All subsequent lesson notes, preprints, and studio artifacts are anchored to this notebook container.

#### Tool Mapping
- MCP Tool: `notebook_create`
- CLI Equivalent: `nlm create notebook [TITLE] --json`
- Input Parameters:
  ```typescript
  export interface NotebookCreateOptions {
    title?: string;
    useMock?: boolean;
  }
  ```
- MCP Payload:
  ```json
  {
    "title": "Ater - Distributed Systems & Raft Consensus"
  }
  ```
- MCP Output Schema:
  ```json
  {
    "status": "success",
    "notebook_id": "35f927f8-7974-4403-b855-ccd2e4b466dd",
    "title": "Ater - Distributed Systems & Raft Consensus",
    "url": "https://notebooklm.google.com/notebook/35f927f8-7974-4403-b855-ccd2e4b466dd"
  }
  ```

#### Fallback / Mock Behavior
When external MCP/CLI is unreachable or `useMock: true` is active:
- Returns deterministic mock notebook:
  ```json
  {
    "status": "success",
    "notebookId": "mock-nb-distributed-systems",
    "title": "Ater - Distributed Systems & Raft Consensus",
    "url": "https://notebooklm.google.com/notebook/mock-nb-distributed-systems"
  }
  ```

### 2.2 Notebook Listing (`notebook_list`)

#### Purpose
Enumerates existing NotebookLM notebooks to permit linking courses to existing study containers.

#### Tool Mapping
- MCP Tool: `notebook_list`
- CLI Equivalent: `nlm notebook list --json`
- Input Parameters:
  ```typescript
  export interface NotebookListOptions {
    maxResults?: number; // Default: 100
    useMock?: boolean;
  }
  ```
- Output Normalized Schema:
  ```typescript
  export interface NotebookListItem {
    id: string;
    title: string;
    sourceCount: number;
    url: string;
    updatedAt?: string;
  }
  ```

#### Fallback / Mock Behavior
Returns a list of 3-5 pre-configured pedagogical notebooks:
- "Distributed Systems & Raft Consensus" (id: `mock-nb-distributed-systems`, sourceCount: 6)
- "Attention Mechanisms & Transformer Architecture" (id: `mock-nb-transformers`, sourceCount: 8)
- "Operating System Kernels & Virtual Memory" (id: `mock-nb-os-kernels`, sourceCount: 4)

---

## 3. Source Attachment Specification (`source_add`)

### 3.1 Purpose & Use Cases
NotebookLM requires grounded source documents before generating studio artifacts or answering questions. In Ater, two types of sources are attached:
1. Lesson Notes: Markdown text compiled by Ater's pedagogical compiler ([lib/curriculum/notes.ts](file:///Users/dabodestroyer/code/Ater/lib/curriculum/notes.ts)) representing the active lesson.
2. Academic Preprints: Scholarxiv papers retrieved via [lib/scholarxiv/client.ts](file:///Users/dabodestroyer/code/Ater/lib/scholarxiv/client.ts), containing paper title, authors, DOI, and abstract.

### 3.2 Tool Mapping
- MCP Tool: `source_add`
- CLI Equivalent:
  - Text source: `nlm source add <NOTEBOOK_ID> --text "<CONTENT>" --title "<TITLE>"`
  - URL source: `nlm source add <NOTEBOOK_ID> --url "<URL>"`
- Input Parameters:
  ```typescript
  export interface SourceAddOptions {
    notebookId: string;
    sourceType: 'text' | 'url' | 'file';
    title?: string;
    text?: string;
    url?: string;
    filePath?: string;
    wait?: boolean;
    useMock?: boolean;
  }
  ```

### 3.3 Output Schema
```typescript
export interface SourceAddResponse {
  status: 'success' | 'failed';
  sourceId: string;
  notebookId: string;
  title: string;
  sourceType: string;
  message?: string;
}
```

### 3.4 Fallback / Mock Behavior
Generates a deterministic source ID `src-mock-${Date.now().toString(36)}` and returns `status: "success"` with the provided title and sourceType.

---

## 4. Studio Artifact Creation & Polling Specification

### 4.1 Artifact Taxonomy & Parameters

Ater supports 6 studio artifact types mapped directly to NotebookLM Studio capabilities:

| Artifact Type | User Label | Default Format | Key Configuration Options | Primary Output |
| :--- | :--- | :--- | :--- | :--- |
| `audio` | Audio Overview | `deep_dive` | `audio_format` (`deep_dive`, `brief`, `critique`, `debate`), `audio_length` (`short`, `default`, `long`), `language` | MP3 / OGG audio URL |
| `video` | Video Explainer | `explainer` | `video_format` (`explainer`, `brief`, `cinematic`), `visual_style` (`auto_select`, `classic`, `whiteboard`, `kawaii`, `anime`), `language` | MP4 video URL |
| `slide_deck` | Presentation Slides | `detailed_deck` | `slide_format` (`detailed_deck`, `presenter_slides`), `slide_length` (`short`, `default`) | PDF slide deck URL |
| `report` | Study Guide | `Study Guide` | `report_format` (`Study Guide`, `Briefing Doc`), `custom_prompt` | Markdown content |
| `flashcards` | Study Flashcards | `medium` | `difficulty` (`easy`, `medium`, `hard`), `question_count` | JSON / structured cards |
| `mind_map` | Concept Mind Map | `hierarchical` | `title`, `focus_prompt` | JSON / text hierarchy |

### 4.2 Creation Contract (`studio_create`)

#### Critical Invariant: `confirm: true`
NotebookLM MCP enforces an interactive approval guardrail:
- If `confirm: false` (the default in raw tool schema), the server returns `{ status: "pending_confirmation", message: "Please confirm these settings...", settings: {...} }`.
- If `confirm: true`, the server dispatches generation and returns `{ status: "success", artifact_id: "...", artifact_status: "in_progress" }`.

Implementation Rule: The client method `createStudioArtifact` MUST automatically set `confirm: true` on all creation requests initiated by the application.

#### Method Signature & Input:
```typescript
export interface StudioCreateOptions {
  notebookId?: string;
  artifactType: StudioArtifactType;
  format?: string;
  visualStyle?: string;
  language?: string;
  sourceContext?: string;
  title?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  focusPrompt?: string;
  useMock?: boolean;
}

export interface StudioCreateResponse {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  artifactId: string;
  notebookId: string;
  artifactType: StudioArtifactType;
  estimatedSeconds: number;
  message?: string;
}
```

#### Estimated Seconds Heuristics:
- `audio`: 30-45 seconds (mock: 10s)
- `video`: 60-90 seconds (mock: 12s)
- `slide_deck`: 25-35 seconds (mock: 8s)
- `report`: 15-25 seconds (mock: 6s)
- `flashcards`: 15-20 seconds (mock: 6s)
- `mind_map`: 15-20 seconds (mock: 6s)

### 4.3 Polling Contract (`studio_status`)

#### Method Signature & Response:
```typescript
export interface StudioStatusResponse {
  status: 'in_progress' | 'completed' | 'failed';
  progress: number; // 0 to 100
  artifactId: string;
  artifactType?: StudioArtifactType;
  title?: string;
  mediaUrl?: string;
  downloadUrl?: string;
  content?: string;
  error?: string;
}
```

#### Polling Flow:
1. Client calls `createStudioArtifact(...)`, obtaining `artifactId: "art-123"`.
2. UI sets polling interval (e.g. every 3000ms).
3. UI polls `getStudioStatus("art-123", notebookId)`.
4. While `status === 'in_progress'`, UI renders progress bar with percentage.
5. When `status === 'completed'`, UI stops polling and displays the media viewer or markdown renderer.
6. When `status === 'failed'`, UI stops polling and displays the error message with a retry action.

---

## 5. Research Query Specification (Fast vs. Deep)

### 5.1 Purpose & Execution Modes

NotebookLM autonomous research enables discovering new web sources and synthesizing comprehensive briefing documents:

| Mode | Target Duration | Expected Sources | Primary Use Case | Constraint |
| :--- | :--- | :--- | :--- | :--- |
| `fast` | ~30 seconds | ~10 sources | In-lesson rapid literature context & quick query resolution | Supports `source: 'web'` or `'drive'` |
| `deep` | ~5 minutes | ~40 sources | Autonomous Research Station deep topic exploration & course induction | **Must use `source: 'web'` only** |

### 5.2 Tool Mapping
- Initiate: `research_start`
  ```json
  {
    "query": "Raft consensus formal safety proof and leader election boundary conditions",
    "mode": "fast",
    "source": "web",
    "notebook_id": "nb-123"
  }
  ```
  Returns: `{ status: "success", task_id: "task-uuid", notebook_id: "nb-123" }`.
- Poll Progress: `research_status`
  ```json
  {
    "notebook_id": "nb-123",
    "task_id": "task-uuid",
    "compact": true,
    "max_wait": 0
  }
  ```
  Returns: `{ status: "in_progress" | "completed", sources_found: 12, sources: [...], report: "..." }`.

### 5.3 High-Level Client Wrapper: `executeResearchQuery`

The client provides a consolidated function `executeResearchQuery(options: ResearchQueryOptions): Promise<ResearchFinding>` that federates sources:
```typescript
export interface ResearchQueryOptions {
  query: string;
  mode: 'fast' | 'deep';
  sources: Array<'scholarxiv' | 'web' | 'notebooklm'>;
  notebookId?: string;
  limit?: number;
  useMock?: boolean;
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

---

## 6. Resilient Offline Fallback Mocks & State Machine Architecture

### 6.1 State Machine Design

To guarantee 100% pass rates in automated Vitest tests without network dependencies or live Google credentials, `lib/notebooklm/client.ts` incorporates a deterministic in-memory session registry and state machine.

```
                  [ createStudioArtifact(options) ]
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Status: 'in_progress' │
                     │ Progress: 15% - 25%   │
                     │ pollCount: 0          │
                     └───────────────────────┘
                                 │
                  [ getStudioStatus(artifactId) ]
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Increment pollCount   │
                     │ Calculate time ratio  │
                     │ Progress: 40% - 75%   │
                     └───────────────────────┘
                                 │
                       Poll 3 or 4 / Timeout
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │  Status: 'completed'  │       │   Status: 'failed'    │
     │  Progress: 100%       │       │   (if error flagged)  │
     │  mediaUrl / content   │       │   error: string       │
     └───────────────────────┘       └───────────────────────┘
```

### 6.2 Simulated Session Definition

```typescript
export interface MockStudioSession {
  artifactId: string;
  notebookId: string;
  artifactType: StudioArtifactType;
  format?: string;
  title: string;
  status: 'in_progress' | 'completed' | 'failed';
  progress: number;
  pollCount: number;
  createdAt: number; // Unix timestamp ms
  estimatedSeconds: number;
  mediaUrl?: string;
  content?: string;
  errorReason?: string;
}
```

### 6.3 Monotonic Progress Algorithm

```typescript
function updateMockSessionState(session: MockStudioSession): void {
  if (session.status === 'completed' || session.status === 'failed') {
    return;
  }

  session.pollCount += 1;
  const elapsedSeconds = (Date.now() - session.createdAt) / 1000;
  const timeRatio = Math.min(1, elapsedSeconds / session.estimatedSeconds);
  const pollRatio = Math.min(1, session.pollCount / 4); // Completes after 4 polls in unit tests

  // Take the maximum progression between elapsed wall-clock time and sequential polls
  const progressRatio = Math.max(timeRatio, pollRatio);

  if (progressRatio >= 1) {
    session.status = 'completed';
    session.progress = 100;
    populateMockArtifactOutput(session);
  } else {
    session.status = 'in_progress';
    // Progress scales smoothly from 20% to 90%
    session.progress = Math.min(95, Math.round(20 + progressRatio * 70));
  }
}
```

### 6.4 Deterministic Artifact Outputs

When `session.status === 'completed'`, the artifact outputs are populated according to `artifactType`:

1. `audio`:
   - `mediaUrl`: `"https://actions.google.com/sounds/v1/ambiences/humming_room.ogg"`
   - `durationSeconds`: 312
2. `video`:
   - `mediaUrl`: `"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"`
   - `durationSeconds`: 180
3. `slide_deck`:
   - `mediaUrl`: `"/mock/slides/presentation_slides.pdf"`
   - `downloadUrl`: `"/mock/slides/presentation_slides.pdf"`
4. `report`:
   - `content`:
     ```markdown
     # Distributed Consensus and State Machine Replication Study Guide

     ## 1. Core Intuition
     Consensus algorithms allow a distributed cluster of nodes to agree on a sequence of state transitions even when individual machines crash or network partitions occur.

     ## 2. Formal Invariants
     - Election Safety: At most one leader can be elected in a given term.
     - Leader Append-Only: A leader never overwrites or truncates its log entries.
     - State Machine Safety: If a server has applied a log entry at a given index to its state machine, no other server will ever apply a different log entry for the same index.

     ## 3. Review Questions
     1. How does a split vote occur, and how does randomized election timeouts resolve it?
     2. Why must a Raft leader never commit log entries from previous terms by counting replicas?
     ```
5. `flashcards`:
   - `content`: JSON array containing 5 study cards:
     ```json
     [
       {
         "front": "What is the Quorum intersection property?",
         "back": "Any two quorums in a cluster of 2F+1 nodes must overlap in at least one node, ensuring knowledge of past terms survives."
       },
       {
         "front": "What invariant guarantees leader election safety?",
         "back": "A candidate cannot win an election unless its log is at least as up-to-date as the majority quorum."
       }
     ]
     ```
6. `mind_map`:
   - `content`: JSON hierarchy:
     ```json
     {
       "root": "Distributed Consensus",
       "children": [
         { "name": "Safety Invariants", "children": [{ "name": "Election Safety" }, { "name": "Log Matching" }] },
         { "name": "Failure Modes", "children": [{ "name": "Split Brain" }, { "name": "Network Partitions" }] }
       ]
     }
     ```

---

## 7. Concrete TypeScript Interfaces & Classes

The Worker implementing [lib/notebooklm/client.ts](file:///Users/dabodestroyer/code/Ater/lib/notebooklm/client.ts) must declare and export the following complete API surface:

### 7.1 Exported Types

```typescript
export type StudioArtifactType =
  | 'audio'
  | 'video'
  | 'slide_deck'
  | 'report'
  | 'flashcards'
  | 'mind_map';

export interface StudioCreateOptions {
  notebookId?: string;
  artifactType: StudioArtifactType;
  format?: string;
  visualStyle?: string;
  language?: string;
  sourceContext?: string;
  title?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  focusPrompt?: string;
  useMock?: boolean;
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
  progress: number;
  artifactId: string;
  artifactType?: StudioArtifactType;
  title?: string;
  mediaUrl?: string;
  downloadUrl?: string;
  content?: string;
  error?: string;
}

export interface ResearchQueryOptions {
  query: string;
  mode: 'fast' | 'deep';
  sources: Array<'scholarxiv' | 'web' | 'notebooklm'>;
  notebookId?: string;
  limit?: number;
  useMock?: boolean;
}

export interface ResearchFinding {
  title: string;
  summary: string;
  takeaways: string[];
  papers: any[]; // ScholarxivPaper[]
  webCitations?: Array<{ title: string; url: string }>;
  reportContext?: string;
}

export interface NotebookInfo {
  notebookId: string;
  title: string;
  url: string;
  sourceCount?: number;
  updatedAt?: string;
}

export interface SourceAddOptions {
  notebookId: string;
  sourceType: 'text' | 'url' | 'file';
  title?: string;
  text?: string;
  url?: string;
  filePath?: string;
  wait?: boolean;
  useMock?: boolean;
}

export interface SourceAddResponse {
  status: 'success' | 'failed';
  sourceId: string;
  notebookId: string;
  title: string;
  sourceType: string;
  message?: string;
}
```

### 7.2 Class Definition: `NotebookLMClient`

```typescript
export interface INotebookLMClient {
  isAvailable(): Promise<boolean>;
  createNotebook(title?: string, options?: { useMock?: boolean }): Promise<NotebookInfo>;
  listNotebooks(options?: { maxResults?: number; useMock?: boolean }): Promise<NotebookInfo[]>;
  addSource(options: SourceAddOptions): Promise<SourceAddResponse>;
  createStudioArtifact(options: StudioCreateOptions): Promise<StudioCreateResponse>;
  getStudioStatus(artifactId: string, notebookId?: string): Promise<StudioStatusResponse>;
  executeResearchQuery(options: ResearchQueryOptions): Promise<ResearchFinding>;
}

export class NotebookLMClient implements INotebookLMClient {
  private readonly useMockDefault: boolean;
  private readonly sessions: Map<string, MockStudioSession>;

  constructor(options?: { useMock?: boolean });
  async isAvailable(): Promise<boolean>;
  async createNotebook(title?: string, options?: { useMock?: boolean }): Promise<NotebookInfo>;
  async listNotebooks(options?: { maxResults?: number; useMock?: boolean }): Promise<NotebookInfo[]>;
  async addSource(options: SourceAddOptions): Promise<SourceAddResponse>;
  async createStudioArtifact(options: StudioCreateOptions): Promise<StudioCreateResponse>;
  async getStudioStatus(artifactId: string, notebookId?: string): Promise<StudioStatusResponse>;
  async executeResearchQuery(options: ResearchQueryOptions): Promise<ResearchFinding>;

  // Test / simulation control hooks
  resetSessions(): void;
  setSessionProgress(artifactId: string, progress: number, status?: 'in_progress' | 'completed' | 'failed'): void;
}
```

### 7.3 Exported Functional Helpers

For ergonomic consumption in Next.js route handlers ([app/api/studio/create/route.ts](file:///Users/dabodestroyer/code/Ater/app/api/studio/create/route.ts) and [app/api/studio/status/route.ts](file:///Users/dabodestroyer/code/Ater/app/api/studio/status/route.ts)):
```typescript
export function getNotebookLMClient(options?: { useMock?: boolean }): NotebookLMClient;
export function createStudioArtifact(options: StudioCreateOptions): Promise<StudioCreateResponse>;
export function getStudioStatus(artifactId: string, notebookId?: string): Promise<StudioStatusResponse>;
export function executeResearchQuery(options: ResearchQueryOptions): Promise<ResearchFinding>;
```

---

## 8. Vitest Test Suite Specifications (`tests/studio_engine.test.ts`)

The test suite must exercise the following 8 test cases:

1. `dispatches studio creation payload for all 5 artifact types with confirm: true`:
   - Verifies `audio`, `video`, `slide_deck`, `report`, `flashcards`, and `mind_map` each return `status: 'in_progress'` and non-zero `estimatedSeconds`.
2. `tracks monotonic progress transitions during repeated polling`:
   - Verifies `getStudioStatus` initially returns `progress < 100` and `status: 'in_progress'`.
   - Subsequent calls monotonically increase `progress`.
   - On completion, `progress === 100` and `status === 'completed'`.
3. `populates mediaUrl for media artifacts and content for document artifacts`:
   - Audio and video return valid media URLs.
   - Slide deck returns valid PDF download/view URLs.
   - Report and flashcards return structured markdown/JSON content.
4. `handles simulated generation failure cleanly`:
   - When configured to fail (or error artifactId), returns `status: 'failed'` with descriptive error message and no unhandled promise rejections.
5. `attaches lesson notes and URLs as notebook sources`:
   - Calls `addSource` with text and URL payloads, returning valid `sourceId`.
6. `creates and lists course notebook containers`:
   - `createNotebook` returns valid `notebookId` and URL.
   - `listNotebooks` returns array of notebooks.
7. `executes fast research query and returns grounded findings`:
   - `executeResearchQuery` in `fast` mode returns `title`, `summary`, `takeaways`, and `papers`.
8. `executes deep research query and enforces web-only source rule`:
   - `executeResearchQuery` in `deep` mode completes successfully without throwing invalid source errors.

---

## 9. Verification & Invariant Checklist

- [x] Zero emojis in all code comments, markdown documentation, logs, and telemetry.
- [x] Factual, dry reporting style.
- [x] Clickable file links formatted in GitHub-style markdown.
- [x] `confirm: true` explicitly specified and explained for `studio_create`.
- [x] Web-only constraint enforced for deep research mode.
- [x] Simulated state machine guarantees deterministic progress transitions for Vitest.
- [x] No source code files outside `.agents/explorer_m1_notebooklm/` modified.
- [x] Zero git commit or push commands executed.
