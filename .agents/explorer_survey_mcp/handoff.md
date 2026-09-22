# Handoff Report: Scholarxiv & NotebookLM MCP Integration Specification

- Agent: explorer_survey_mcp
- Target Agent: orchestrator / implementer
- Timestamp: 2026-09-16T13:25:00Z
- Scope: MCP Tool Schemas, API Endpoints, TypeScript Contracts, Offline Fallbacks, and Course Induction Bridge for Ater Phase 6

---

## 1. Observation

1. **Scholarxiv MCP Tool Schemas**:
   - Location: `/Users/dabodestroyer/.gemini/antigravity/mcp/scholarxiv/`
   - Files examined: `search_papers.json` (1028 bytes), `get_paper.json` (474 bytes), `get_paper_full_text.json` (875 bytes).
   - Tool `search_papers` requires `query: string`. Optional parameters: `limit` (integer 1–50, default 10), `page` (integer, default 0), `search_filter` (`"all"|"ti"|"au"|"abs"|"cat"|"id"|"co"|"jr"|"rn"`), `sort_by` (`"relevance"|"lastUpdatedDate"|"submittedDate"`), `sort_order` (`"ascending"|"descending"`).
   - Live probe of `search_papers` with `query: "Raft consensus"`, `limit: 2` succeeded, returning papers `2004.05074v2` (Howard & Mortier 2020) and `2403.18916v1` (Bora et al. 2024).
   - Live probe of `get_paper` with `paper_id: "2004.05074v2"` succeeded, returning Title, Authors, Year, Categories, Abstract, DOI, and PDF link.
   - Live probe of `get_paper_full_text` with `paper_id: "2004.05074v2"` failed with error:
     `Encountered error in tool execution: Reading paper full text requires a Plus or Pro subscription. Use get_paper for the abstract and metadata instead.`
   - Server configuration: Defined in `~/.gemini/config/mcp_config.json` line 30–36 as Streamable HTTP at `https://www.scholarxiv.com/api/mcp` with `Authorization: Bearer sxv_...` and `Accept: application/json, text/event-stream`.

2. **NotebookLM MCP Tool Schemas & CLI Implementation**:
   - Location: `/Users/dabodestroyer/.gemini/antigravity/mcp/notebooklm/`
   - Files examined: `notebook_create.json`, `notebook_list.json`, `source_add.json`, `studio_create.json`, `studio_status.json`, `research_start.json`, `research_status.json`, `research_import.json`, `download_artifact.json`.
   - Python implementation inspected: `notebooklm_tools.mcp.tools.studio`, `notebooklm_tools.mcp.tools.research`, `notebooklm_tools.services.studio`.
   - Tool `studio_status` with `action: "list_types"` executed live on notebook `35f927f8-7974-4403-b855-ccd2e4b466dd`, enumerating all 9 supported artifact types:
     - `audio`: formats `["deep_dive", "brief", "critique", "debate"]`, lengths `["short", "default", "long"]`.
     - `video`: formats `["explainer", "brief", "cinematic"]`, visual styles `["auto_select", "custom", "classic", "whiteboard", "kawaii", "anime", "watercolor", "retro_print", "heritage", "paper_craft"]`.
     - `infographic`: orientations `["landscape", "portrait", "square"]`, detail levels `["concise", "standard", "detailed"]`.
     - `slide_deck`: formats `["detailed_deck", "presenter_slides"]`, lengths `["short", "default"]`.
     - `report`: formats `["Briefing Doc", "Study Guide", "Blog Post", "Create Your Own"]`.
     - `flashcards`: difficulty `["easy", "medium", "hard"]`.
     - `quiz`: `question_count`, difficulty `["easy", "medium", "hard"]`.
     - `data_table`: `description`, `language`.
     - `mind_map`: `title`.
   - `studio_create` execution dynamics: When `confirm: false` (default), it returns `{ status: "pending_confirmation", message: "...", settings: {...}, note: "Set confirm=True after user approves..." }`. Setting `confirm: true` executes creation and returns `{ status: "success", artifact_id: "...", artifact_status: "in_progress", notebook_url: "..." }`.
   - `research_start` execution dynamics: Accepts `query` (required), `source` (`"web"|"drive"`, default `"web"`), `mode` (`"fast"|"deep"`, default `"fast"`). When `mode: "deep"`, source must be `"web"`. Returns `{ status: "success", task_id: "...", notebook_id: "...", query: "...", mode: "..." }`.
   - `research_status` polling: Returns `{ status: "in_progress"|"completed", sources_found: number, sources: [...], report: "..." }`.

3. **Current Ater Codebase Baseline**:
   - `types/scholarxiv.ts`: Already contains base definitions `ScholarxivPaper`, `ScholarxivSearchResponse`, `ScholarxivSearchOptions`.
   - `types/index.ts`: Defines `CourseCurriculum`, `CurriculumGenerateRequest`, `RoadmapLesson`, `DynamicLessonNote`.
   - `app/api/curriculum/generate/route.ts`: Accepts `CurriculumGenerateRequest` with `topic`, `sourceType`, and `answers: Record<string, string>`, passing them to `generateCourseCurriculum`.
   - Test suite baseline: `npx vitest run` executed 3 test files (`tests/gate_engine.test.ts`, `tests/feynman_prompt.test.ts`, `tests/landing.test.ts`), passing 19 of 19 tests in 890ms.
   - Production build baseline: `npm run build` completed with exit code 0, generating all 14 static pages and API routes without TypeScript or lint errors.

---

## 2. Logic Chain

1. **Scholarxiv Fallback Invariant**:
   - Observation: `get_paper_full_text` fails on Free Tier tokens with a 403-equivalent permission message, and network connectivity may be unavailable in offline or restricted environments.
   - Deduction: `lib/scholarxiv/client.ts` cannot rely on raw full-text paper retrieval or unthrottled live network calls. It must rely on `get_paper` metadata and abstract, and must bundle deterministic offline fallback fixtures indexed by common domains (consensus, attention, memory, operating systems) to guarantee test resilience and 0-error offline mode.

2. **NotebookLM Execution & Polling Model**:
   - Observation: `studio_create` takes between 30s and 300s to generate media (audio, video, slides, reports), requires `confirm: true` to bypass approval gating, and reports status via `studio_status`.
   - Deduction: Media generation cannot be synchronous. The API route `/api/studio/create` must initiate the job and immediately return an `in_progress` artifact ticket with an estimated duration. The frontend `StudioModal` will non-blockingly poll `/api/studio/status` until `status === 'completed'` or `status === 'failed'`.
   - Deduction: If local `nlm` authentication tokens are expired or absent, `/api/studio/create` and `/api/studio/status` must activate fallback mock artifacts so the user experience in the UI remains interactive and never stalls with unhandled exceptions.

3. **Course Induction Bridge Invariant**:
   - Observation: `/api/curriculum/generate` consumes `{ topic: string, sourceType?: 'prompt'|'pdf'|'document', answers: Record<string, string> }`. In `lib/curriculum/generator.ts`, `answers` is formatted into prompt lines: `Question [k]: "v"`, which Gemini incorporates directly into curriculum generation.
   - Deduction: The Course Induction Bridge can directly transform Research Station outputs into a valid `CurriculumGenerateRequest` without changing `/api/curriculum/generate`'s interface signature. The bridge will populate `answers` with `q1` (synthesized target goal), `q2` (learner baseline), `academic_literature` (formatted citations and key insights of grounded papers), and `research_report_context` (takeaways from deep research).

---

## 3. Caveats

- **Free Tier Scholarxiv Full-Text**: Full-text streaming (`get_paper_full_text`) is verified to be gated behind Scholarxiv Plus/Pro plans. The client implementation must strictly treat full-text as optional and rely on abstract and paper metadata for lesson grounding.
- **Local NotebookLM CLI**: Direct stdio execution of `notebooklm-mcp` requires Python with valid Google session cookies. In cloud CI or test environments where `nlm login` has not been executed, the mock/fallback pathway must be automatically triggered via `useMock` or pre-flight check.

---

## 4. Conclusion

All MCP tool schemas, protocol bindings, concrete TypeScript interfaces, offline fallback formats, and API endpoint contracts for Scholarxiv and NotebookLM integration in Ater Phase 6 have been authored and verified.

The complete technical specification report is documented at:
`/Users/dabodestroyer/code/Ater/.agents/explorer_survey_mcp/report.md`.

---

## 5. Verification Method

1. **Verify Schema Report**:
   Inspect `/Users/dabodestroyer/code/Ater/.agents/explorer_survey_mcp/report.md` for completeness of:
   - Tool parameter and return schemas for Scholarxiv (`search_papers`, `get_paper`, `get_paper_full_text`) and NotebookLM (`notebook_create`, `notebook_list`, `source_add`, `studio_create`, `studio_status`, `research_start`, `research_status`).
   - Concrete TypeScript interfaces for `lib/scholarxiv/client.ts` and `lib/notebooklm/client.ts`.
   - API route contracts for `/api/research/query`, `/api/studio/create`, and `/api/studio/status`.
   - Course Induction Bridge mapping function `buildCurriculumFromResearch`.

2. **Verify Codebase Health**:
   - Run `npx vitest run`: Confirms 19/19 existing tests pass.
   - Run `npm run build`: Confirms Next.js 15 production build succeeds with exit code 0.

3. **Verify Constraints**:
   - Confirm zero source code files outside `.agents/explorer_survey_mcp/` were modified.
   - Confirm zero git commit or git push commands were run.
   - Confirm zero emojis were used in any output file.
