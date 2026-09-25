# Scholarxiv Platform, Developer API & MCP Architecture Reference

This specification documents the technical architecture, communication protocols, developer APIs, and Model Context Protocol (MCP) server of the **Scholarxiv** ecosystem for **Ater**.

---

## 1. Ecosystem Overview & Architecture Topography

Scholarxiv is an academic research platform and developer infrastructure indexing over 3 million papers across arXiv, PubMed, OpenAlex, Semantic Scholar, Crossref, and other scholarly repositories.

The developer surface consists of three core components:
1. **Model Context Protocol (MCP) Server:** A remote Streamable HTTP service exposing 45 tools for autonomous agent workflows.
2. **Papers REST API:** A high-throughput REST search and retrieval interface.
3. **Router API:** An intelligent inference and model-routing proxy that selects optimal models based on task classification, complexity, cost caps, and latency requirements.

### Key Discovery & Endpoint URIs

| Resource | Target URI | Protocol / Format |
| :--- | :--- | :--- |
| **Machine-Readable Index** | `https://scholarxiv.com/llms.txt` | Text / Markdown |
| **MCP Server Card (Discovery)** | `https://www.scholarxiv.com/.well-known/mcp/server-card.json` | JSON Schema v1 |
| **MCP Well-Known Alias** | `https://scholarxiv.com/.well-known/mcp.json` | JSON Schema v1 |
| **MCP Gateway Endpoint** | `POST https://www.scholarxiv.com/api/mcp` | Streamable HTTP / JSON-RPC 2.0 |
| **Papers REST Base** | `https://scholarxiv.com/api/v1/papers` | HTTPS / JSON REST |
| **Router REST Base** | `https://scholarxiv.com/api/v1/router` | HTTPS / JSON REST |
| **Developer Documentation** | `https://scholarxiv.com/developers/docs` | Web / Markdown |
| **Developer Dashboard** | `https://scholarxiv.com/developers/dashboard` | Web Application |

---

## 2. Authentication, Entitlements & Rate Limits

### 2.1 API Key Structure & Headers
All requests to the Papers API, Router API, and MCP tool execution require an API key generated in the Scholarxiv Developer Dashboard.

- **Prefix:** Keys strictly begin with `sxv_` (e.g., `sxv_live_...`).
- **Hashing:** Keys are validated on the server via secure hashing (`better-auth`).
- **Transport Headers:** Supported via either header:
  - Standard Bearer: `Authorization: Bearer sxv_...`
  - Custom Header: `x-api-key: sxv_...`

Unauthenticated discovery on the MCP endpoint (`initialize`, `ping`, `tools/list`) is permitted without credentials. Invoking `tools/call` mandates a valid key.

### 2.2 Subscription Tiers & Request Quotas
Entitlements are evaluated dynamically at runtime against the account's active subscription:

| Plan Tier | Max Active API Keys | Hourly Request Limit (Rolling 60m) | Max Results Per Request | Gated Features |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | 2 keys | 1,200 requests/hr | 6,000 papers | Single-source arXiv search, core MCP tools |
| **Go** | 3 keys | 1,800 requests/hr | 6,000 papers | Federated Search (11 sources), Full-text chunks, Health suite |
| **Plus** | 5 keys | 2,400 requests/hr | 6,000 papers | Elevated throughput, multi-service keys |
| **Pro** | 20 keys | 3,600 requests/hr | 6,000 papers | Production throughput, priority model routing |

### 2.3 Quota Lifecycle Invariants
- **Shared Account Quotas:** The hourly limit is shared collectively across all active API keys owned by that user account.
- **Continuous Rolling Window:** Rate limits are enforced on a continuous 60-minute sliding window rather than calendar-hour resets.
- **Immediate Plan Sync:** Upgrades take effect instantly. On plan downgrades, the system automatically disables the oldest keys exceeding the new tier quota, while existing active keys immediately adopt the reduced rate limits.

---

## 3. Transport Invariants & Protocol Specifications

### 3.1 Streamable HTTP vs SSE vs stdio
- **Selected Transport:** Scholarxiv operates exclusively over **Streamable HTTP** (`type: "streamable-http"`).
- **No stdio:** The service does not run as a local child process or over standard input/output pipes.
- **Stateless Operation:** No persistent SSE session connection or WebSocket state is maintained. Every JSON-RPC operation is an independent HTTP POST request to `https://www.scholarxiv.com/api/mcp`.
- **Supported Protocol Versions:** `2025-06-18`, `2025-06-15`, `2025-03-26`, `2024-11-05`.
- **CORS Configuration:** Fully enabled with headers `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`, and allowed headers `Content-Type, Authorization, x-api-key`.

### 3.2 JSON-RPC 2.0 Payload Wire Format

A standard tool invocation request:
```http
POST /api/mcp HTTP/1.1
Host: www.scholarxiv.com
Content-Type: application/json
Authorization: Bearer sxv_your_key_here

{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "tools/call",
  "params": {
    "name": "search_papers",
    "arguments": {
      "query": "distributed consensus",
      "limit": 5
    }
  }
}
```

Standard JSON-RPC success envelope:
```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"data\": [...], \"pagination\": {...}}"
      }
    ]
  }
}
```

### 3.3 Verified Empirical Invariants & Transport Pitfalls

1. **Canonical Host (`www.scholarxiv.com`):**
   - Requests sent to `https://scholarxiv.com` issue an HTTP `307 Temporary Redirect` to `https://www.scholarxiv.com`.
   - Standard HTTP clients (`fetch`, `axios`) automatically strip the `Authorization` header on subdomain redirects for security reasons, resulting in a false `401 API Key is required` error.
   - **Rule:** Always configure the base URL as `https://www.scholarxiv.com`.

2. **Strict MCP Accept Header:**
   - The MCP endpoint mandates: `Accept: application/json, text/event-stream`.
   - Omitting this header returns HTTP `406 Not Acceptable` (`Not Acceptable: Client must accept both application/json and text/event-stream`).

3. **Runtime Free-Tier Tool Filtering:**
   - On the Free plan, out-of-tier tools (e.g. `federated_search`, Health suite) are omitted from `tools/list` (leaving 35 available tools). Invoking them returns JSON-RPC error `-32602 Tool not found`.
   - Gated tools that remain visible (like `get_paper_full_text`) return an error payload with `isError: true` and instructions to upgrade.
   - REST `/api/v1/papers/federated/search` returns HTTP `403 Forbidden` with `{ "error": "Federated search is available on the Go plan and above. Upgrade to use it." }`.


---

## 4. The Complete MCP Tool Catalog (45 Tools)

The Scholarxiv MCP Server registers 45 distinct tools grouped into 7 functional categories.

### 4.1 Search & Discovery (5 Tools)

#### 1. `search_papers`
Searches the primary Scholarxiv arXiv index of 3M+ academic preprints.
- **Inputs:**
  - `query` (string, required): Search query string.
  - `search_filter` (enum string, optional): `all`, `ti`, `au`, `abs`, `cat`, `id`, `co`, `jr`, `rn`.
  - `limit` (number, optional, default: 10): Result count (1 to 50).
  - `page` (number, optional, default: 0): 0-indexed page number.
  - `sort_by` (enum string, optional, default: `relevance`): `relevance`, `lastUpdatedDate`, `submittedDate`.
  - `sort_order` (enum string, optional, default: `descending`): `ascending`, `descending`.
- **Return Payload:** JSON object containing `data: Paper[]` and `pagination: { page, limit, hasMore, nextPage }`.

#### 2. `federated_search`
Simultaneously queries 11 academic databases with automatic title/DOI deduplication. *(Requires Go plan or above)*.
- **Inputs:**
  - `query` (string, required): Search query.
  - `sources` (string[], optional, default: all): Selected subset from: `arxiv`, `openalex`, `pubmed`, `europepmc`, `medrxiv`, `biorxiv`, `clinicaltrials`, `semantic_scholar`, `crossref`, `chinarxiv`, `chemrxiv`.
  - `limit` (number, optional, default: 10): Results per source (1 to 50).
  - `page` (number, optional, default: 0): 0-indexed page applied per source.
  - `fromYear` (number, optional): Minimum publication year.
  - `toYear` (number, optional): Maximum publication year.
  - `sort` (enum string, optional): `relevance`, `date`, `citations`.
- **Return Payload:** Object containing merged and deduplicated `data: Paper[]`, per-source telemetry `bySource: Record<string, { count: number, hasMore: boolean }>`, and `pagination: { page, limit, hasMore, nextPage }`.

#### 3. `search_collections`
Discovers public paper collections authored by researchers.
- **Inputs:**
  - `query` (string, required): Search text matching collection title or description.
  - `page` (number, optional, default: 1): Page number.
- **Return Payload:** Collection summaries list with metadata and paper counts.

#### 4. `discover_collections`
Surfaces random curated public collections.
- **Inputs:**
  - `page` (number, optional, default: 1): Page number.
- **Return Payload:** Paginated list of public collections.

#### 5. `get_recommended_collections`
Generates personalized collection recommendations based on reading history.
- **Inputs:**
  - `page` (number, optional, default: 1): Page number.
- **Return Payload:** Tailored collection recommendations.

---

### 4.2 Paper Operations (9 Tools)

#### 6. `get_paper`
Fetches complete paper metadata, abstracts, categories, and direct PDF URLs.
- **Inputs:**
  - `paper_id` (string, required): Clean arXiv ID (e.g., `2401.01234`) or DOI string.
- **Return Payload:** Full `Paper` metadata object.

#### 7. `get_paper_full_text`
Reads the extracted text of a paper in chunk offsets. *(Paid plan required)*.
- **Inputs:**
  - `paper_id` (string, required): arXiv ID or arXiv URL.
  - `offset` (number, optional): Character starting index for chunking.
  - `max_chars` (number, optional): Characters to extract (1,000 to 60,000).
- **Return Payload:** Plain text chunk content with character boundary metadata.

#### 8. `bookmark_paper`
Toggles the bookmark status for a given paper.
- **Inputs:**
  - `paper_id` (string, required): Extracted paper identifier.
- **Return Payload:** Updated bookmark status boolean.

#### 9. `like_paper`
Toggles the like status on a paper.
- **Inputs:**
  - `paper_id` (string, required): Extracted paper identifier.
- **Return Payload:** Updated like status boolean.

#### 10. `get_bookmarked_papers`
Retrieves all papers bookmarked by the authenticated user.
- **Inputs:** None.
- **Return Payload:** Array of bookmarked `Paper` objects.

#### 11. `get_liked_papers`
Retrieves all papers liked by the authenticated user.
- **Inputs:** None.
- **Return Payload:** Array of liked `Paper` objects.

#### 12. `get_paper_comments`
Retrieves threaded community comments for a paper.
- **Inputs:**
  - `paper_id` (string, required): Extracted paper identifier.
- **Return Payload:** Threaded comments array with user metadata, timestamps, and replies.

#### 13. `comment_on_paper`
Posts a comment or threaded reply on a paper.
- **Inputs:**
  - `paper_id` (string, required): Extracted paper identifier.
  - `comment` (string, required): Text content of comment.
  - `parent_id` (string, optional): Parent comment ID for threading.
- **Return Payload:** Created comment record with ID and author details.

#### 14. `delete_comment`
Deletes an authenticated user's comment.
- **Inputs:**
  - `comment_id` (string, required): MongoDB ObjectId of comment.
  - `paper_id` (string, required): Extracted paper identifier.
- **Return Payload:** Deletion confirmation status.

---

### 4.3 Collections Management (10 Tools)

#### 15. `list_collections`
Lists all collections the user owns or belongs to.
- **Inputs:** None.
- **Return Payload:** Array of collection summaries (`id`, `title`, `description`, `visibility`, `paperCount`, `role`).

#### 16. `create_collection`
Creates a new research collection.
- **Inputs:**
  - `title` (string, required): Title of collection.
  - `description` (string, optional): Detailed collection objective.
  - `tags` (string[], optional): Topic categorization tags.
- **Return Payload:** Created collection object (`id`, `title`, `tags`, etc.).

#### 17. `update_collection`
Modifies metadata or visibility of a collection.
- **Inputs:**
  - `collection_id` (string, required): Collection ID.
  - `title` (string, optional): Updated title.
  - `description` (string, optional): Updated description.
  - `tags` (string[], optional): Updated tags.
  - `visibility` (enum string, optional): `public` or `private`.
- **Return Payload:** Updated collection record.

#### 18. `delete_collection`
Deletes a collection and its associated paper associations.
- **Inputs:**
  - `collection_id` (string, required): Collection ID.
- **Return Payload:** Deletion confirmation status.

#### 19. `get_collection_detail`
Retrieves comprehensive details of a collection including all contained papers.
- **Inputs:**
  - `collection_id` (string, required): Collection ID.
- **Return Payload:** Full collection entity with embedded `papers: Paper[]`.

#### 20. `get_collection_papers`
Retrieves all papers within a collection.
- **Inputs:**
  - `collection_id` (string, required): Collection ID.
- **Return Payload:** Array of `Paper` records.

#### 21. `add_paper_to_collection`
Associates an academic paper with a target collection.
- **Inputs:**
  - `collection_id` (string, required): Collection ID.
  - `paper_id` (string, required): Extracted paper identifier.
- **Return Payload:** Success confirmation.

#### 22. `remove_paper_from_collection`
Disassociates a paper from a target collection.
- **Inputs:**
  - `collection_id` (string, required): Collection ID.
  - `paper_id` (string, required): Extracted paper identifier.
- **Return Payload:** Success confirmation.

#### 23. `join_collection`
Joins a public collection as a viewer.
- **Inputs:**
  - `collection_id` (string, required): Collection ID.
- **Return Payload:** Membership status.

#### 24. `leave_collection`
Leaves a previously joined collection.
- **Inputs:**
  - `collection_id` (string, required): Collection ID.
- **Return Payload:** Confirmation.

---

### 4.4 Collection Member & Access Control (5 Tools)

#### 25. `get_collection_members`
Lists all members of a collection (owner only).
- **Inputs:** `collection_id` (required), `page` (optional), `limit` (optional), `search` (optional).
- **Return Payload:** Paginated list of members with user profiles and roles.

#### 26. `update_member_role`
Modifies a member's role (owner only).
- **Inputs:** `collection_id` (required), `user_id` (required), `role` (enum: `editor` | `viewer`, required).
- **Return Payload:** Updated membership profile.

#### 27. `remove_member`
Revokes collection access for a member (owner only).
- **Inputs:** `collection_id` (required), `user_id` (required).
- **Return Payload:** Removal status.

#### 28. `generate_share_token`
Generates a tokenized link enabling public view or edit access.
- **Inputs:** `collection_id` (required), `role` (enum: `viewer` | `editor`, required).
- **Return Payload:** Token string and fully-formed shareable URL.

#### 29. `revoke_share_token`
Invalidates an active share token.
- **Inputs:** `collection_id` (required), `role` (enum: `viewer` | `editor`, required).
- **Return Payload:** Revocation confirmation.

---

### 4.5 AI Research Chats (4 Tools)

#### 30. `list_chats`
Lists previous AI research conversations.
- **Inputs:** None.
- **Return Payload:** Array of chat sessions with titles, IDs, and last active timestamps.

#### 31. `get_chat_history`
Fetches complete message turns from a conversation.
- **Inputs:** `chat_id` (string, required).
- **Return Payload:** Array of message turns (`role`, `content`, `timestamp`, `tool_calls`).

#### 32. `delete_chat`
Deletes a conversation history.
- **Inputs:** `chat_id` (string, required).
- **Return Payload:** Deletion status.

#### 33. `research_chat`
Interactive multi-step research execution with live document grounding and sandbox execution.
- **Inputs:**
  - `question` (string, required): Research inquiry.
  - `chat_id` (string, optional): Chat ID to continue an ongoing conversation.
  - `selected_papers` (string, optional): Contextual paper identifiers.
  - `selected_texts` (string, optional): Specific excerpt passages to ground on.
  - `is_deep_research` (boolean, optional, default: false): Enables autonomous multi-step reasoning.
  - `model` (string, optional, default: auto): Override model selection.
- **Return Payload:** Synthesized research response with citations and execution outputs.

---

### 4.6 Account & Intelligence (3 Tools)

#### 34. `get_subscription_info`
Queries current plan, active key count, and hourly rate consumption.
- **Inputs:** None.
- **Return Payload:** Subscription plan identifier, key count, hourly quota, remaining requests.

#### 35. `get_plans`
Retrieves public plan tiers, pricing, and capability matrices.
- **Inputs:** None.
- **Return Payload:** Available tiers (`free`, `go`, `plus`, `pro`) with feature entitlements.

#### 36. `get_pulse`
Retrieves proactive, AI-generated thematic digests synthesized from user reading activity.
- **Inputs:** None.
- **Return Payload:** Thematic summary articles and trend digests.

---

### 4.7 Health Tools (9 Tools, Go Plan+)
Specialized clinical and biomedical tools backed by PubMed/MEDLINE, medRxiv, bioRxiv, ClinicalTrials.gov, RxNorm, and openFDA.
- `health_chat`: Medical research chat with clinical grounding and patient profile context.
- `get_medication_reference`: RxNorm identity and FDA label metadata lookup.
- `get_health_profile`: Fetches stored profile and GDPR Art. 9 consent state.
- `save_health_profile`: Stores health profile with mandatory `consent_given: true`.
- `delete_health_profile`: Hard deletion of profile and logs with `confirm: true`.
- `list_health_trackers`: Lists active symptom, illness, or habit tracking logs.
- `create_health_tracker`: Creates tracker (`acute`, `pregnancy`, or `custom`).
- `add_health_tracker_entry`: Appends timestamped log entry with severity, temperature, and symptoms.
- `delete_health_tracker`: Removes tracker and all historical log points.

---

## 5. Direct REST Endpoints & Schemas

For workflows requiring high throughput, batch processing, or non-agent pipelines, Scholarxiv provides direct REST endpoints.

### 5.1 Simple Paper Search
- **Endpoint:** `GET https://scholarxiv.com/api/v1/papers/search`
- **Query Parameters:**
  - `q` (string, required): Case-insensitive, word-aware title search.
  - `page` (number, optional, default: 0): Zero-based page offset.
  - `limit` (number, optional, default: 20): Results to return (1 to 6,000).
- **Response Format:**
```json
{
  "data": [
    {
      "id": "http://arxiv.org/abs/2401.01234v1",
      "extractedID": "2401.01234v1",
      "title": "Sample Paper Title",
      "summary": "Paper abstract text...",
      "authors": ["Author One", "Author Two"],
      "published": "2024-01-01T00:00:00Z",
      "updated": "2024-01-02T00:00:00Z",
      "primaryCategory": "cs.AI",
      "category": ["cs.AI", "cs.LG"],
      "pdfLink": "https://arxiv.org/pdf/2401.01234v1",
      "doi": "10.48550/arXiv.2401.01234"
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 20,
    "hasMore": true,
    "nextPage": 1
  }
}
```

### 5.2 Advanced Multi-Field Search
- **Endpoint:** `POST https://scholarxiv.com/api/v1/papers/search`
- **Payload Schema:**
```json
{
  "searchFilterString": {
    "all": "flash attention",
    "cat": "cs.LG",
    "ti": "transformer",
    "au": "Dao, Tri"
  },
  "page": 0,
  "limit": 25,
  "sortBy": "submittedDate",
  "sortOrder": "descending"
}
```
- **Supported Filters:**
  - `all`: Matches title, abstract, authors, comments, journal, categories, DOI.
  - `ti`: Paper title only.
  - `au`: Author names (comma-separated for multiples).
  - `abs`: Abstract text only.
  - `cat`: arXiv subject categories (e.g., `cs.AI`, `cs.CV`, `math.PR`).
  - `id`: Exact arXiv ID (`extractedID` or `baseArxivID`).
  - `jr`: Journal reference.
  - `co`: Comments.
  - `rn`: Report number.

### 5.3 Federated Multi-Source Search (Go+)
- **Endpoint:** `GET /api/v1/papers/federated/search?q=...` or `POST /api/v1/papers/federated/search`
- **Payload Schema:**
```json
{
  "q": "reinforcement learning human feedback",
  "page": 0,
  "limit": 15,
  "sources": ["arxiv", "openalex", "semantic_scholar"]
}
```
- **Per-Source Pagination Mechanism:**
  - `limit` applies per provider (capped at 50 per source to respect upstream APIs).
  - The `bySource` map tracks individual provider progress:
```json
{
  "data": [...],
  "bySource": {
    "arxiv": { "count": 15, "hasMore": true },
    "openalex": { "count": 15, "hasMore": true },
    "semantic_scholar": { "count": 8, "hasMore": false }
  },
  "pagination": {
    "page": 0,
    "limit": 15,
    "hasMore": true,
    "nextPage": 1
  }
}
```

### 5.4 Router API Endpoints

#### 1. Decision Only (`POST /api/v1/router`)
Classifies prompt complexity and selects an optimal model without executing inference.
- **Request:**
```json
{
  "prompt": "Synthesize the convergence bounds between AdamW and Muon optimizers",
  "preset": "balanced",
  "requires_tools": false,
  "has_image": false
}
```
- **Response:**
```json
{
  "decision_id": "dec_8f2c019a",
  "model": "google/gemini-3-flash",
  "fallbacks": ["alibaba/qwen3.7-plus", "xai/grok-4.1-fast-reasoning"],
  "task": "research_synthesis",
  "difficulty": 0.82,
  "preset": "balanced",
  "estimated_cost_usd": 0.00312,
  "candidates_considered": 47,
  "routing_latency_ms": 210,
  "degraded": false
}
```

#### 2. Decide and Run (`POST /api/v1/router/chat/completions`)
Drop-in OpenAI-compatible proxy executing model routing and inference in a single round-trip.
- **Request:**
```json
{
  "model": "auto",
  "messages": [
    { "role": "user", "content": "Explain gradient checkpointing in deep networks." }
  ]
}
```
- **Model Presets:** `"model": "auto"`, `"model": "auto:quality"`, or `"model": "auto:cheap"`.

#### 3. Feedback Loop (`POST /api/v1/router/feedback`)
Closes the loop on model quality, informing router ranking algorithms.
- **Payload:** `{ "decision_id": "dec_8f2c019a", "status": "success" | "retry" | "failure" }`.

---

## 6. Error Reference & Failure Modes

All error payloads conform to standard JSON envelopes:
```json
{
  "error": "Error description message"
}
```

| HTTP Status | Primary Cause | Resolution Strategy |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Missing search query or empty `searchFilterString` | Ensure query is non-empty and at least one filter field has text |
| **`401 Unauthorized`** | Missing header, invalid prefix, or revoked key | Validate `sxv_` key format and ensure header is `Bearer sxv_...` |
| **`403 Forbidden`** | Feature requires higher tier (e.g. federated search on Free) | Upgrade plan or restrict request to standard arXiv search |
| **`405 Method Not Allowed`** | GET/DELETE against stateless MCP endpoint | Use strictly POST for all MCP JSON-RPC requests |
| **`429 Rate Limit Exceeded`** | Rolling 60m hourly limit exceeded | Parse `Retry-After` header in seconds, apply exponential backoff |
| **`502 Bad Gateway`** | Upstream provider or model execution failed | Fall back down the `fallbacks` array from the router response |

---

## 7. Concrete Integration Opportunities for Ater

Connecting Ater to Scholarxiv provides three immediate architectural integrations:

```text
+-------------------------------------------------------------------------------+
|                                 ATER BACKEND                                  |
+-------------------------------------------------------------------------------+
        |                                                 |
        | [Course Ingestion]                              | [Failed Feynman Gate]
        v                                                 v
+-------------------------------+             +---------------------------------+
|   Curriculum / Note Engine    |             |      Remediation Engine         |
|    (lib/curriculum/notes.ts)  |             |  (lib/curriculum/generator.ts)  |
+---------------+---------------+             +---------------+-----------------+
                |                                             |
                +----------------------+----------------------+
                                       |
                                       v
                     +-----------------------------------+
                     |      Scholarxiv MCP / REST        |
                     |  POST https://scholarxiv.com/...  |
                     +-----------------+-----------------+
                                       |
        +------------------------------+------------------------------+
        |                                                             |
        v                                                             v
+------------------------------------+              +-----------------------------------+
|     Ground-Truth Peer Citations    |              |     Autonomous Ideation Trail     |
| - Top seminal papers per topic     |              | - STARK Hackathon Rule 1          |
| - DOIs & direct PDF links          |              | - Auto-curates course collection  |
| - Injected into Section 4/5 Notes  |              | - Generates public share token    |
+------------------------------------+              +-----------------------------------+
```

### 7.1 Integration 1: Verified Peer-Reviewed Citation Grounding
- **Target File:** `lib/curriculum/notes.ts`
- **Workflow:**
  1. When dynamic note compilation occurs, extract key domain tokens from the topic name and mechanical breakdown.
  2. Invoke Scholarxiv `search_papers` (or `federated_search` on Go+) with `limit: 2` and `sort_by: "relevance"`.
  3. Enrich the note with a structured `Ground Truth References` block containing clean clickable links (`https://scholarxiv.com/paper/{extractedID}`), publication dates, and author lists.
  4. Resolves the "hallucinated authority" trap by anchoring conceptual models in verifiable literature.

### 7.2 Integration 2: Automated Ideation Trail Logging for STARK Rule 1
- **Rule 1 Requirement:** STARK Hackathon mandates all teams document problem discovery, rejected alternatives, and architectural decisions on Scholarxiv.
- **Workflow:**
  1. During course creation or curriculum calibration, Ater can invoke `create_collection` with the title: `Ater — Socratic AI Learning Architecture & Ideation Trail`.
  2. Add reference papers discovered during initial domain intake directly via `add_paper_to_collection`.
  3. Automatically trigger `generate_share_token` with `role: "viewer"` and persist the resulting public URL in local state.
  4. Expose the verified Scholarxiv share link in the application header and export files for judge inspection.

### 7.3 Integration 3: Dynamic Canvas Grounding & Deep Research Socratic Fallback
- **Target File:** `lib/curriculum/generator.ts` and active lesson canvas.
- **Workflow:**
  1. If a student fails an oral Feynman Gate defense due to a deep conceptual misunderstanding, the system triggers `research_chat` with `is_deep_research: true`.
  2. The research agent analyzes the failure point against literature and extracts the exact mechanistic explanation.
  3. The resulting synthesis is fed into `CurriculumEngine.generateRemediationLesson()`, creating a targeted sub-lesson grounded in verified empirical results.
