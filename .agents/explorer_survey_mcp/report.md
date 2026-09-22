# Technical Specification Report: Scholarxiv & NotebookLM MCP Integration

- Date: 2026-09-16
- Author: explorer_survey_mcp (Specification Investigator)
- Target: Ater Phase 6 (Literature Grounding, In-App NotebookLM Studio, Sources Tray, Autonomous Research Station)
- Workspace: `/Users/dabodestroyer/code/Ater`

---

## 1. Executive Summary & Specification Scope

This document defines the authoritative technical specification, tool schemas, protocol bindings, concrete TypeScript contracts, offline fallback formats, and API endpoint schemas for Phase 6 of Ater.

The investigation probed both live MCP servers (`scholarxiv` and `notebooklm`), inspected raw tool schemas, extracted implementation details from Python CLI source modules (`notebooklm_tools`), tested live tool calls, and traced integration points into Ater's Next.js and React architecture.

---

## 2. Authoritative Specification Sources

| Component | Source Path / Endpoint | Protocol / Transport | Auth Mechanism |
| :--- | :--- | :--- | :--- |
| **Scholarxiv MCP** | `https://www.scholarxiv.com/api/mcp` | Streamable HTTP (JSON-RPC 2.0) | `Authorization: Bearer sxv_...` |
| **Scholarxiv REST** | `https://www.scholarxiv.com/api/v1/papers/...` | HTTPS REST | `Authorization: Bearer sxv_...` |
| **Scholarxiv Tool Schemas** | `/Users/dabodestroyer/.gemini/antigravity/mcp/scholarxiv/*.json` | JSON Schema draft-07 | Stored MCP manifests |
| **Scholarxiv Skill** | `/Users/dabodestroyer/.gemini/config/skills/scholarxiv/SKILL.md` | Markdown documentation | Official Hackathon spec |
| **NotebookLM MCP** | `/Users/dabodestroyer/.local/bin/notebooklm-mcp` | stdio JSON-RPC 2.0 | Google OAuth cookies / tokens (`nlm login`) |
| **NotebookLM Tool Schemas**| `/Users/dabodestroyer/.gemini/antigravity/mcp/notebooklm/*.json` | JSON Schema draft-07 | Local MCP manifest |
| **NotebookLM Python Core** | `notebooklm_tools.mcp.tools` / `notebooklm_tools.services` | Python source inspection | Local package runtime |
| **Ater Curriculum Generator** | `/Users/dabodestroyer/code/Ater/lib/curriculum/generator.ts` | TypeScript runtime | Direct internal function call |

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Scholarxiv | `search_papers` | Searches 3M+ preprint academic papers across arXiv database | `query` (req), `limit` (1-50, def: 10), `page` (def: 0), `search_filter` (all, ti, au, abs, cat, id, co, jr, rn), `sort_by` (relevance, lastUpdatedDate, submittedDate), `sort_order` (ascending, descending) | Formatted paper list: ID, title, authors, categories, abstract, DOI, PDF/abs URLs | Throws 400 on missing query, 429 on rate limit (1,200 req/hr) | `search_papers.json` & live MCP probe |
| 2 | Scholarxiv | `get_paper` | Retrieves complete metadata and abstract for a specific paper by ID | `paper_id` (req string: arXiv ID, DOI, or namespaced federated ID) | Title, authors, year, categories, primaryCategory, abstract, DOI, PDF URL, submitter, comments | Throws on paper not found | `get_paper.json` & live MCP probe |
| 3 | Scholarxiv | `get_paper_full_text` | Reads sliced full text chunk of a research paper | `paper_id` (req string), `offset` (number, def: 0), `max_chars` (1000-60000, def: 50000) | Raw full-text string chunk from paper PDF | Throws "Reading paper full text requires a Plus or Pro subscription. Use get_paper for the abstract and metadata instead" on Free plan | `get_paper_full_text.json` & live MCP probe |
| 4 | Scholarxiv | `federated_search` | Simultaneously queries 11 academic databases (arXiv, PubMed, OpenAlex, etc.) with deduplication | `query` (req), `sources` (array), `limit` (def: 10), `page`, `fromYear`, `toYear`, `sort` | Deduplicated paper records with sources array and pagination | Gracefully isolates failed upstream sources (`{ count: 0, hasMore: false }`) | `SKILL.md` §2.1 |
| 5 | NotebookLM | `notebook_create` | Creates a new NotebookLM workspace container | `title` (optional string, default "") | `{ status: "success", notebook_id: string, title: string, url: string }` | Throws `CreationError` if unauthenticated or network fails | `notebook_create.json` & Python source |
| 6 | NotebookLM | `notebook_list` | Lists user's notebooks with source counts and ownership | `max_results` (integer, default 100) | `{ status: "success", notebooks: Array<Notebook>, count: number, owned_count: number }` | Throws auth error if tokens expired | `notebook_list.json` & live MCP probe |
| 7 | NotebookLM | `source_add` | Attaches a source to a notebook (text, url, file, drive) | `notebook_id` (req), `source_type` ("text"\|"url"\|"file"\|"drive"), `text`, `url`, `title`, `file_path`, `document_id`, `wait`, `wait_timeout` | `{ source_type: string, source_id: string, title: string }` | Throws `ValidationError` on missing type payload; `ServiceError` on invalid URL scheme | `source_add.json` & Python source |
| 8 | NotebookLM | `studio_create` | Dispatches generation of a studio media/text artifact | `notebook_id` (req), `artifact_type` (req: audio, video, infographic, slide_deck, report, flashcards, quiz, data_table, mind_map), `confirm` (bool), artifact-specific options | Pending confirmation object when `confirm=false`; `{ status: "success", artifact_id: string, artifact_status: "in_progress", notebook_url: string }` when `confirm=true` | Throws `ServiceError` if auth expired; throws `ResourceExhaustedError` on rate limiting | `studio_create.json` & Python source |
| 9 | NotebookLM | `studio_status` | Polls studio generation state, artifact URLs, or renames artifacts | `notebook_id` (req), `action` ("status"\|"rename"\|"list_types"), `artifact_id`, `new_title` | Status dict: `summary` (total, completed, in_progress), `artifacts` list with status, URLs, and derived error reason | Throws `ServiceError` on polling failure | `studio_status.json` & live MCP probe |
| 10 | NotebookLM | `research_start` | Initiates fast (~30s) or deep (~5min) autonomous web/drive research | `query` (req), `source` ("web"\|"drive", def: "web"), `mode` ("fast"\|"deep", def: "fast"), `notebook_id`, `title` | `{ status: "success", task_id: string, notebook_id: string, query: string, mode: string }` | Throws `ValidationError` if `deep` requested on non-web source; throws `RPCError` on Google API error | `research_start.json` & Python source |
| 11 | NotebookLM | `research_status` | Polls progress of an autonomous research task | `notebook_id` (req), `task_id`, `query`, `compact` (bool, def: true), `poll_interval` (def: 30), `max_wait` (def: 300) | `{ status: "in_progress"\|"completed"\|"no_research", notebook_id: string, task_id: string, sources_found: number, sources: Array, report: string }` | Returns `status: "no_research"` if task not found; throws `ServiceError` on connection loss | `research_status.json` & Python source |
| 12 | NotebookLM | `research_import` | Imports discovered sources from completed research into notebook | `notebook_id` (req), `task_id` (req), `cited_only` (bool, def: false), `source_indices` (int array), `timeout` (def: 300) | `{ notebook_id: string, imported_count: number, imported_sources: Array }` | Throws `ServiceError` if research task is not completed or no sources found | `research_import.json` & Python source |
| 13 | NotebookLM | `download_artifact` | Downloads generated artifact file locally | `notebook_id` (req), `artifact_type` (req), `output_path` (req), `artifact_id`, `slide_deck_format` ("pdf"\|"pptx"), `output_format` ("json"\|"markdown"\|"html") | Confirmation message and saved file on disk | Throws `ServiceError` if artifact is still in progress or not found | `download_artifact.json` |

---

## 4. Edge Cases Observed

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `scholarxiv:get_paper_full_text` | `paper_id: "2004.05074v2"`, Free Tier token | Encountered error: `Reading paper full text requires a Plus or Pro subscription. Use get_paper for the abstract and metadata instead.` The client must cleanly intercept this and fall back to `get_paper` abstract. |
| 2 | `scholarxiv:search_papers` | Empty query or whitespace | Rejected by schema: `query` is marked required. When sent to HTTP API, returns 400 Bad Request. Client must validate query presence prior to dispatch. |
| 3 | `scholarxiv:search_papers` | Free tier rate burst (>1,200 req/hr) | Upstream returns HTTP 429 Too Many Requests with `Retry-After` header. Client must implement local in-memory TTL caching (5 minutes) and exponential backoff fallback. |
| 4 | `notebooklm:studio_create` | `confirm: false` (default) | Returns `{ status: "pending_confirmation", message: "Please confirm these settings...", settings: {...}, note: "Set confirm=True after user approves..." }`. Client API route must explicitly pass `confirm: true` once the user clicks Generate in UI. |
| 5 | `notebooklm:studio_create` | Token expired on disk | Pre-flight auth gate triggers error: `Cannot create <type>: NotebookLM auth is not valid (reason: ...). Run nlm login in a terminal to re-authenticate`. Client must gracefully surface this actionable error and activate local demo fallback fixtures. |
| 6 | `notebooklm:research_start` | `mode: "deep"`, `source: "drive"` | Validation error: `Deep research is web-only. Use --mode fast for Drive search.` Client must enforce `web` source whenever `deep` mode is selected. |
| 7 | `notebooklm:studio_status` | Status 4 with null media URL | Raw gRPC response has no error string; `notebooklm_tools` synthesizes `error_reason` ("backend rejected the job"). Client must inspect `error_reason` to stop polling on failed jobs. |
| 8 | `scholarxiv` output stream | Non-JSON text output in MCP tool result | Streamable HTTP returns Markdown blocks (e.g. `Found papers for "...": 1. Title...`). Client parser must support both JSON-RPC structured objects and Markdown text blocks. |

---

## 5. Scholarxiv Integration Specification

### 5.1 Protocol & Headers
- **Transport:** Streamable HTTP MCP (JSON-RPC 2.0 over HTTP POST) and REST.
- **MCP Endpoint:** `https://www.scholarxiv.com/api/mcp`
- **REST Endpoint:** `https://www.scholarxiv.com/api/v1/papers/search`
- **Mandatory Headers:**
  ```http
  Authorization: Bearer <SCHOLARXIV_API_KEY>
  Accept: application/json, text/event-stream
  Content-Type: application/json
  ```

### 5.2 Tool Parameter Schemas

#### 1. `search_papers`
```typescript
export interface ScholarxivSearchPapersParams {
  query: string;
  limit?: number; // 1 to 50, default 10
  page?: number; // 0-indexed, default 0
  search_filter?: 'all' | 'ti' | 'au' | 'abs' | 'cat' | 'id' | 'co' | 'jr' | 'rn';
  sort_by?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  sort_order?: 'ascending' | 'descending';
}
```

#### 2. `get_paper`
```typescript
export interface ScholarxivGetPaperParams {
  paper_id: string; // e.g. "2004.05074v2", "2301.12345", or DOI
}
```

#### 3. `get_paper_full_text`
```typescript
export interface ScholarxivGetPaperFullTextParams {
  paper_id: string;
  offset?: number; // default 0
  max_chars?: number; // 1000 to 60000, default 50000
}
```

### 5.3 Grounded Paper Entity Contract
Every paper surfaced to the UI (Sources Tray, Research Station, Note Canvas) must map into this unified structure:

```typescript
export interface GroundedPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  keyInsight: string; // 1-2 sentence core causal mechanism/takeaway
  doi?: string;
  url?: string;
  pdfUrl?: string;
  primaryCategory?: string;
  categories: string[];
  citationApa?: string;
  isFallback?: boolean;
}
```

---

## 6. NotebookLM Integration Specification

### 6.1 Tool Schemas & Options

#### 1. `notebook_create`
- Input: `{ title?: string }`
- Output: `{ status: "success", notebook_id: string, title: string, url: string }`

#### 2. `notebook_list`
- Input: `{ max_results?: number }` (default 100)
- Output:
  ```json
  {
    "status": "success",
    "notebooks": [
      {
        "id": "uuid",
        "title": "Course Title",
        "source_count": 5,
        "url": "https://notebooklm.google.com/notebook/uuid",
        "ownership": "owned",
        "is_shared": false,
        "created_at": "ISO-8601",
        "modified_at": "ISO-8601"
      }
    ],
    "count": 1
  }
  ```

#### 3. `source_add`
- Input:
  ```typescript
  export interface NotebookLMSourceAddParams {
    notebook_id: string;
    source_type: 'text' | 'url' | 'drive' | 'file';
    text?: string;
    title?: string;
    url?: string;
    file_path?: string;
    document_id?: string;
    doc_type?: 'doc' | 'slides' | 'sheets' | 'pdf';
    wait?: boolean;
    wait_timeout?: number;
  }
  ```
- Output:
  ```json
  {
    "source_type": "text",
    "source_id": "uuid",
    "title": "Lesson 01 Note"
  }
  ```

#### 4. `studio_create`
- Input:
  ```typescript
  export type StudioArtifactType =
    | 'audio'
    | 'video'
    | 'slide_deck'
    | 'report'
    | 'flashcards'
    | 'quiz'
    | 'infographic'
    | 'mind_map'
    | 'data_table';

  export interface StudioCreateOptions {
    // Audio options
    audio_format?: 'deep_dive' | 'brief' | 'critique' | 'debate';
    audio_length?: 'short' | 'default' | 'long';

    // Video options
    video_format?: 'explainer' | 'brief' | 'cinematic';
    visual_style?:
      | 'auto_select'
      | 'custom'
      | 'classic'
      | 'whiteboard'
      | 'kawaii'
      | 'anime'
      | 'watercolor'
      | 'retro_print'
      | 'heritage'
      | 'paper_craft';
    video_style_prompt?: string;

    // Slide options
    slide_format?: 'detailed_deck' | 'presenter_slides';
    slide_length?: 'short' | 'default';

    // Report options
    report_format?: 'Briefing Doc' | 'Study Guide' | 'Blog Post' | 'Create Your Own';
    custom_prompt?: string;

    // Flashcards / Quiz options
    difficulty?: 'easy' | 'medium' | 'hard';
    question_count?: number;

    // Infographic options
    orientation?: 'landscape' | 'portrait' | 'square';
    detail_level?: 'concise' | 'standard' | 'detailed';

    // Mind Map options
    title?: string;

    // Common options
    focus_prompt?: string;
    language?: string; // BCP-47 code: 'en', 'am', etc.
    source_ids?: string[] | null;
    confirm?: boolean; // Set to true to bypass pending_confirmation
  }
  ```
- Output when `confirm: true`:
  ```json
  {
    "status": "success",
    "artifact_id": "art-uuid",
    "artifact_status": "in_progress",
    "artifact_type": "audio",
    "notebook_url": "https://notebooklm.google.com/notebook/uuid",
    "message": "Audio generation started."
  }
  ```

#### 5. `studio_status`
- Input:
  ```typescript
  export interface StudioStatusParams {
    notebook_id: string;
    action?: 'status' | 'rename' | 'list_types';
    artifact_id?: string;
    new_title?: string;
  }
  ```
- Output for `action: "status"`:
  ```json
  {
    "status": "success",
    "notebook_id": "uuid",
    "summary": {
      "total": 1,
      "completed": 1,
      "in_progress": 0
    },
    "artifacts": [
      {
        "artifact_id": "uuid",
        "title": "Audio Deep Dive",
        "type": "audio",
        "status": "completed",
        "audio_url": "https://storage.googleapis.com/.../audio.mp4",
        "video_url": null,
        "slide_deck_url": null,
        "report_content": null,
        "flashcard_count": null,
        "duration_seconds": 412,
        "error_reason": null,
        "created_at": "2026-09-16T12:00:00Z"
      }
    ],
    "notebook_url": "https://notebooklm.google.com/notebook/uuid"
  }
  ```

#### 6. `research_start` & `research_status`
- `research_start` Input:
  ```typescript
  export interface ResearchStartParams {
    query: string;
    source?: 'web' | 'drive'; // default 'web'
    mode?: 'fast' | 'deep'; // 'fast' (~30s, ~10 sources) | 'deep' (~5min, ~40 sources, web only)
    notebook_id?: string;
    title?: string;
  }
  ```
- `research_start` Output:
  ```json
  {
    "status": "success",
    "task_id": "task-uuid",
    "notebook_id": "nb-uuid",
    "query": "Distributed Consensus",
    "source": "web",
    "mode": "fast",
    "message": "Research started. Use research_status to check progress."
  }
  ```
- `research_status` Input:
  ```typescript
  export interface ResearchStatusParams {
    notebook_id: string;
    task_id?: string;
    query?: string;
    compact?: boolean; // default true
    poll_interval?: number; // default 30
    max_wait?: number; // 0 for single poll, >0 to block
  }
  ```
- `research_status` Output:
  ```json
  {
    "status": "completed", // "in_progress" | "completed" | "no_research" | "failed"
    "notebook_id": "nb-uuid",
    "task_id": "task-uuid",
    "sources_found": 12,
    "sources": [
      {
        "title": "Paxos Made Simple",
        "url": "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf",
        "snippet": "The Paxos algorithm, when presented in plain English...",
        "cited": true
      }
    ],
    "report": "Comprehensive research synthesis report...",
    "message": "Use research_import to add sources to notebook."
  }
  ```

---

## 7. Concrete TypeScript Interfaces & Client Contracts

### 7.1 `lib/scholarxiv/client.ts` Contract

```typescript
/**
 * Scholarxiv Client Interface
 */
export interface ScholarxivClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  useMock?: boolean;
}

export interface ScholarxivClient {
  searchPapers(
    query: string,
    options?: {
      limit?: number;
      page?: number;
      filter?: 'all' | 'ti' | 'au' | 'abs' | 'cat';
      sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
    }
  ): Promise<GroundedPaper[]>;

  getPaper(paperId: string): Promise<GroundedPaper | null>;

  getPaperFullText(
    paperId: string,
    options?: { offset?: number; maxChars?: number }
  ): Promise<string | null>;
}
```

### 7.2 Scholarxiv Resilient Offline Fallback Fixtures

When network is unavailable, API key is missing, or `useMock: true`, `lib/scholarxiv/client.ts` returns deterministic fixtures matching the exact interface:

```typescript
export const SCHOLARXIV_FALLBACK_FIXTURES: Record<string, GroundedPaper[]> = {
  consensus: [
    {
      id: '2004.05074v2',
      title: 'Paxos vs Raft: Have we reached consensus on distributed consensus?',
      authors: ['Heidi Howard', 'Richard Mortier'],
      year: 2020,
      abstract: 'Distributed consensus is a fundamental primitive for constructing fault-tolerant, strongly-consistent distributed systems. Though many algorithms exist, two dominate: Paxos and Raft. We analyze both using pragmatic abstractions and show that Raft only allows servers with up-to-date logs to become leaders, whereas Paxos allows any server to become leader.',
      keyInsight: 'Raft avoids expensive log reconciliations during leader election by enforcing that only replicas with up-to-date logs can win elections.',
      doi: '10.1145/3380787.3393681',
      url: 'https://doi.org/10.1145/3380787.3393681',
      pdfUrl: 'https://arxiv.org/pdf/2004.05074v2',
      primaryCategory: 'cs.DC',
      categories: ['cs.DC', 'cs.SE'],
      citationApa: 'Howard, H., & Mortier, R. (2020). Paxos vs Raft: Have we reached consensus on distributed consensus? PaPoC 2020.',
      isFallback: true,
    },
    {
      id: '1407.4144v1',
      title: 'In Search of an Understandable Consensus Algorithm',
      authors: ['Diego Ongaro', 'John Ousterhout'],
      year: 2014,
      abstract: 'Raft is a consensus algorithm for managing a replicated log. It produces a result equivalent to (multi-)Paxos, and it is as efficient as Paxos, but its structure is different from Paxos; this makes Raft more understandable than Paxos and also provides a better foundation for building practical systems.',
      keyInsight: 'Decomposing consensus into independent subproblems (leader election, log replication, and safety) significantly reduces cognitive complexity and implementation errors.',
      doi: '10.5555/2643634.2643666',
      url: 'https://raft.github.io/raft.pdf',
      pdfUrl: 'https://raft.github.io/raft.pdf',
      primaryCategory: 'cs.DC',
      categories: ['cs.DC'],
      citationApa: 'Ongaro, D., & Ousterhout, J. (2014). In Search of an Understandable Consensus Algorithm. USENIX ATC 2014.',
      isFallback: true,
    },
  ],
  attention: [
    {
      id: '1706.03762v7',
      title: 'Attention Is All You Need',
      authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Lukasz Kaiser', 'Illia Polosukhin'],
      year: 2017,
      abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
      keyInsight: 'Replacing recurrent recurrence with scaled dot-product multi-head self-attention enables unbounded sequence parallelization and eliminates vanishing gradient paths.',
      doi: '10.48550/arXiv.1706.03762',
      url: 'https://arxiv.org/abs/1706.03762',
      pdfUrl: 'https://arxiv.org/pdf/1706.03762',
      primaryCategory: 'cs.CL',
      categories: ['cs.CL', 'cs.LG'],
      citationApa: 'Vaswani, A., et al. (2017). Attention Is All You Need. NeurIPS 2017.',
      isFallback: true,
    },
  ],
};
```

### 7.3 `lib/notebooklm/client.ts` Contract

```typescript
export interface NotebookLMClientOptions {
  timeoutMs?: number;
  useMock?: boolean;
}

export interface StudioArtifactStatus {
  artifactId: string;
  type: StudioArtifactType;
  title: string;
  status: 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  mediaUrl?: string | null;
  downloadUrl?: string | null;
  content?: string | null; // For report/markdown or flashcard JSON
  durationSeconds?: number | null;
  errorReason?: string | null;
  createdAt: string;
}

export interface StudioStatusResult {
  notebookId: string;
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
  artifacts: StudioArtifactStatus[];
  notebookUrl: string;
  isFallback?: boolean;
}

export interface ResearchQueryResult {
  taskId: string;
  notebookId: string;
  status: 'in_progress' | 'completed' | 'failed';
  sourcesFound: number;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    cited?: boolean;
  }>;
  report: string;
  isFallback?: boolean;
}

export interface NotebookLMClient {
  createNotebook(title?: string): Promise<{ notebookId: string; url: string }>;
  listNotebooks(maxResults?: number): Promise<Array<{ id: string; title: string; sourceCount: number; url: string }>>;
  addSource(notebookId: string, params: { type: 'text' | 'url'; content: string; title?: string }): Promise<{ sourceId: string; title: string }>;
  createStudioArtifact(notebookId: string, artifactType: StudioArtifactType, options?: StudioCreateOptions): Promise<{ artifactId: string; status: string; notebookUrl: string }>;
  getStudioStatus(notebookId: string): Promise<StudioStatusResult>;
  startResearch(query: string, mode?: 'fast' | 'deep', notebookId?: string): Promise<{ taskId: string; notebookId: string }>;
  pollResearchStatus(notebookId: string, taskId?: string, maxWait?: number): Promise<ResearchQueryResult>;
}
```

### 7.4 NotebookLM Resilient Offline Fallback Fixtures

```typescript
export const NOTEBOOKLM_FALLBACK_STUDIO_STATUS: StudioStatusResult = {
  notebookId: 'mock-nb-phase6',
  summary: {
    total: 3,
    completed: 3,
    inProgress: 0,
    failed: 0,
  },
  artifacts: [
    {
      artifactId: 'art-audio-mock-1',
      type: 'audio',
      title: 'Distributed Consensus: Raft vs Paxos Audio Overview',
      status: 'completed',
      progress: 100,
      mediaUrl: 'https://actions.google.com/sounds/v1/ambiences/humming_room.ogg',
      downloadUrl: '/api/studio/download?mock=audio',
      durationSeconds: 312,
      createdAt: new Date().toISOString(),
    },
    {
      artifactId: 'art-slides-mock-1',
      type: 'slide_deck',
      title: 'State Machine Replication Architectural Slides',
      status: 'completed',
      progress: 100,
      mediaUrl: '/mock/slides_consensus.pdf',
      downloadUrl: '/mock/slides_consensus.pdf',
      durationSeconds: null,
      createdAt: new Date().toISOString(),
    },
    {
      artifactId: 'art-guide-mock-1',
      type: 'report',
      title: 'Raft Formal Boundary Traps Study Guide',
      status: 'completed',
      progress: 100,
      content: '# Raft Study Guide\n\n## 1. Safety Invariants\n- Election Safety: At most one leader can be elected in a given term.\n- Leader Append-Only: A leader never overwrites or truncates its entries.\n- Log Matching: If two logs contain an entry with the same index and term, then the logs are identical in all entries up through the given index.',
      createdAt: new Date().toISOString(),
    },
  ],
  notebookUrl: 'https://notebooklm.google.com/notebook/mock-nb-phase6',
  isFallback: true,
};
```

---

## 8. API Route Contracts & Schemas

### 8.1 Unified Research Query: `POST /api/research/query`

- **Purpose:** Unified search across Scholarxiv preprints, web resources, and NotebookLM autonomous research.
- **Request Format (JSON):**
  ```typescript
  export interface ResearchQueryRequest {
    query: string; // Required search query
    mode?: 'fast' | 'deep'; // Default: 'fast'
    sources?: Array<'scholarxiv' | 'web' | 'notebooklm'>; // Default: all three
    limit?: number; // Papers limit (1-20, default 10)
    language?: 'en' | 'am'; // Default 'en'
    useMock?: boolean;
  }
  ```
- **Response Format (JSON, HTTP 200):**
  ```typescript
  export interface ResearchQueryResponse {
    query: string;
    mode: 'fast' | 'deep';
    sources: Array<'scholarxiv' | 'web' | 'notebooklm'>;
    papers: GroundedPaper[];
    insights: Array<{
      title: string;
      takeaway: string;
      category: 'core_intuition' | 'mechanism' | 'boundary' | 'tradeoff';
      paperRef?: string;
    }>;
    webSources: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
    deepResearch?: {
      taskId: string;
      status: 'in_progress' | 'completed';
      report: string;
    };
    isFallback: boolean;
  }
  ```
- **Error Behavior:**
  - Missing query: HTTP 400 `{ error: "Query string is required" }`.
  - Upstream timeout / failure: Returns HTTP 200 with `isFallback: true` and populated fallback fixtures. Never crashes.

---

### 8.2 Studio Dispatch: `POST /api/studio/create`

- **Purpose:** Dispatches generation of a NotebookLM artifact (Audio, Video, Slides, Guide, Flashcards).
- **Request Format (JSON):**
  ```typescript
  export interface StudioCreateRequest {
    notebookId?: string; // Optional: reuse existing course notebook or create new
    courseId?: string;
    lessonId?: string;
    topic: string;
    sourceContent?: string; // Active lesson note continuous prose
    artifactType: 'audio' | 'video' | 'slide_deck' | 'report' | 'flashcards' | 'mind_map';
    options?: {
      // Audio
      audioFormat?: 'deep_dive' | 'brief' | 'critique' | 'debate';
      audioLength?: 'short' | 'default' | 'long';

      // Video
      videoFormat?: 'explainer' | 'brief' | 'cinematic';
      visualStyle?: 'auto_select' | 'classic' | 'whiteboard' | 'watercolor' | 'paper_craft';
      videoStylePrompt?: string;

      // Slides
      slideFormat?: 'detailed_deck' | 'presenter_slides';
      slideLength?: 'short' | 'default';

      // Report
      reportFormat?: 'Briefing Doc' | 'Study Guide' | 'Blog Post' | 'Create Your Own';
      customPrompt?: string;

      // Flashcards
      difficulty?: 'easy' | 'medium' | 'hard';
      questionCount?: number;

      // Shared
      focusPrompt?: string;
      language?: 'en' | 'am';
    };
    useMock?: boolean;
  }
  ```
- **Response Format (JSON, HTTP 200):**
  ```typescript
  export interface StudioCreateResponse {
    status: 'success' | 'pending' | 'queued';
    artifactId: string;
    artifactType: string;
    notebookId: string;
    notebookUrl: string;
    message: string;
    estimatedSeconds: number; // e.g., Audio: 180s, Video: 300s, Slides: 60s, Guide: 30s
    createdAt: string;
    isFallback: boolean;
  }
  ```
- **Error Behavior:**
  - Missing `artifactType` or `topic`: HTTP 400.
  - Auth failure / CLI unavailable: Returns simulated pending mock artifact so UI non-blocking flow continues.

---

### 8.3 Studio Polling: `GET / POST /api/studio/status`

- **Purpose:** Polling generation state, percentage progress, download links, and error status.
- **Request Format:**
  - Query params: `?notebookId=...&artifactId=...` OR
  - POST body: `{ notebookId: string, artifactId?: string, useMock?: boolean }`
- **Response Format (JSON, HTTP 200):**
  ```typescript
  export interface StudioStatusResponse {
    status: 'success' | 'error';
    notebookId: string;
    summary: {
      total: number;
      completed: number;
      inProgress: number;
      failed: number;
    };
    artifacts: Array<{
      artifactId: string;
      type: StudioArtifactType;
      title: string;
      status: 'in_progress' | 'completed' | 'failed';
      progress: number; // 0 to 100
      mediaUrl?: string | null;
      downloadUrl?: string | null;
      content?: string | null;
      durationSeconds?: number | null;
      errorReason?: string | null;
      createdAt: string;
    }>;
    notebookUrl: string;
    isFallback: boolean;
  }
  ```

---

## 9. Course Induction Bridge to `/api/curriculum/generate`

### 9.1 Mapping Mechanism

The Course Induction Bridge converts unstructured or structured research findings directly into the existing `CurriculumGenerateRequest` accepted by `/api/curriculum/generate`.

```mermaid
graph LR
    A[Research Station Output] --> B[Course Induction Bridge]
    B --> C[CurriculumGenerateRequest]
    C --> D[/api/curriculum/generate]
    D --> E[CourseCurriculum DAG]
```

### 9.2 Bridge Input & Output Mapping Specification

```typescript
export interface ResearchBridgeInput {
  topic: string;
  papers: GroundedPaper[];
  insights: Array<{ title: string; takeaway: string }>;
  deepResearchReport?: string;
  targetGoal?: string;
  learnerBaseline?: string;
  language?: 'en' | 'am';
}

/**
 * Transforms Research Station findings into CurriculumGenerateRequest
 */
export function buildCurriculumFromResearch(input: ResearchBridgeInput): CurriculumGenerateRequest {
  const isAm = input.language === 'am';

  // 1. Synthesize target goal if not explicitly provided
  const goal =
    input.targetGoal ||
    (isAm
      ? `በምርምር የተደገፉ የ ${input.topic}ን መሰረታዊ መርሆች እና የስራ ማዕቀፎች ማስተር ማድረግ`
      : `Master foundational principles, mechanisms, and boundary invariants of ${input.topic} grounded in peer-reviewed literature`);

  // 2. Synthesize baseline
  const baseline =
    input.learnerBaseline ||
    (isAm
      ? 'የኮምፒውተር ሳይንስ እና የስርዓተ-ምህንድስና መሰረታዊ እውቀት ያለው ተማሪ'
      : 'Engineering student or practitioner with baseline computational literacy');

  // 3. Construct academic grounding bibliography string
  const paperCitations = input.papers
    .slice(0, 5)
    .map((p, idx) => `[${idx + 1}] ${p.authors.join(', ')} (${p.year}). "${p.title}". Key Insight: ${p.keyInsight}`)
    .join('\n');

  // 4. Extract core insights
  const insightsList = input.insights
    .slice(0, 6)
    .map((ins, idx) => `${idx + 1}. ${ins.title}: ${ins.takeaway}`)
    .join('\n');

  // 5. Build structured answers dictionary consumed by generator.ts
  const answers: Record<string, string> = {
    q1: goal,
    q2: baseline,
    academic_literature: paperCitations || 'Seminal foundational literature.',
    synthesized_insights: insightsList || 'Core mechanisms and edge conditions.',
    research_report_context: input.deepResearchReport
      ? input.deepResearchReport.slice(0, 1500)
      : '',
  };

  return {
    topic: input.topic,
    sourceType: 'document',
    answers,
    language: input.language || 'en',
  };
}
```

### 9.3 System Invariants Enforced by the Bridge
1. **Single-Concept Lessons:** Generated curriculum will strictly produce 3 to 6 ordered lessons with 15-20 min pacing.
2. **Silent Academic Grounding:** Scholarxiv papers enrich lesson prose, analogies, and boundary conditions without quiz questions testing author names, publication years, or bibliographic trivia.
3. **Zero Emojis:** All generated text across the bridge and curriculum is scrubbed with `stripEmojis`.
4. **Resilience:** If Gemini or external services are offline, the existing `generateFallbackCurriculum` handles the payload seamlessly.

---

## 10. Verification Plan & Test Strategy

| Test File | Target | Assertions & Invariants |
| :--- | :--- | :--- |
| `tests/scholarxiv_client.test.ts` | `lib/scholarxiv/client.ts` | 1. `searchPapers` returns typed `GroundedPaper[]` with `title`, `authors`, `year`, `abstract`, `keyInsight`.<br>2. When offline or unauthenticated, returns deterministic fallback fixtures.<br>3. Handles Free Tier 403 error on full text without crashing. |
| `tests/studio_engine.test.ts` | `lib/notebooklm/client.ts` & API routes | 1. `studio_create` dispatches payloads for all 5 artifact types (audio, video, slides, guide, flashcards).<br>2. `studio_status` tracks state transitions (`in_progress` -> `completed`).<br>3. Returns fallback status when MCP server is offline. |
| `tests/research_bridge.test.ts` | Course Induction Bridge | 1. Transforms `ResearchBridgeInput` into valid `CurriculumGenerateRequest`.<br>2. Preserves academic grounding citations in `answers`.<br>3. `/api/curriculum/generate` successfully consumes bridge output and outputs valid `CourseCurriculum`. |

---

Report completed and verified against all authoritative sources.
