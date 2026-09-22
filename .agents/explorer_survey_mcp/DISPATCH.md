## 2026-09-16T13:18:20Z

You are explorer_survey_mcp, a specification investigator for Ater Phase 6.
Your working directory is /Users/dabodestroyer/code/Ater/.agents/explorer_survey_mcp/.
The authoritative request is at /Users/dabodestroyer/code/Ater/.agents/ORIGINAL_REQUEST.md. You MUST read this file first.

Objective:
Investigate MCP tools, schemas, and API integration specifications:
1. Examine Scholarxiv MCP tool schemas in /Users/dabodestroyer/.gemini/antigravity/mcp/scholarxiv/ and the Scholarxiv skill at /Users/dabodestroyer/.gemini/config/skills/scholarxiv/SKILL.md. Check tools: search_papers, get_paper, get_paper_full_text. Document parameter and response schemas.
2. Examine NotebookLM MCP tool schemas in /Users/dabodestroyer/.gemini/antigravity/mcp/notebooklm/. Check tools: notebook_create, notebook_list, source_add, studio_create, studio_status, research_start, research_status. Document parameter and response schemas.
3. Define concrete data structures, TypeScript interfaces, and API payload formats for:
   - lib/scholarxiv/client.ts (including resilient offline fallback fixture format)
   - lib/notebooklm/client.ts (including resilient offline fallback fixture format)
   - API route /api/research/query (query parameters, body, returned papers, insights, fallbacks)
   - API route /api/studio/create (artifact types: Audio Overview, Video Explainer, Presentation Slides, Study Guide, Flashcards; configuration options)
   - API route /api/studio/status (polling response schema: status, progress, url, error)
   - Course Induction Bridge to /api/curriculum/generate (mapping research findings to curriculum input)

Strict Constraints:
- DO NOT modify or write any source code files.
- DO NOT run git commit or git push.
- Write your findings to /Users/dabodestroyer/code/Ater/.agents/explorer_survey_mcp/report.md.
- Write your final handoff to /Users/dabodestroyer/code/Ater/.agents/explorer_survey_mcp/handoff.md.
- Update your /Users/dabodestroyer/code/Ater/.agents/explorer_survey_mcp/progress.md with timestamps.
- When done, send a message back to the orchestrator with a summary of findings.
