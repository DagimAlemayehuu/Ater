## 1. Environment and Path Configuration

- [x] 1.1 Add `notebooklm-mcp-cli` to project dependencies in `pyproject.toml` and `requirements.txt`
- [x] 1.2 Verify `nlm` CLI path and availability on FastAPI application startup, logging diagnostics if missing
- [x] 1.3 Implement asynchronous python CLI runner helper in `apps/api/src/domains/notebooklm/runner.py` to execute `nlm` commands and parse JSON stdout

## 2. FastAPI Endpoints for NotebookLM

- [x] 2.1 Implement `/api/notebooklm/auth/login` and `/api/notebooklm/auth/status` endpoints for browser login redirect and connection checks
- [x] 2.2 Implement `/api/notebooklm/notebooks` GET and POST routes for listing and creating notebooks
- [x] 2.3 Implement `/api/notebooklm/notebooks/{id}/sources` routes to list, add (file/url/text), and delete notebook sources
- [x] 2.4 Implement `/api/notebooklm/notebooks/{id}/studio` and `/api/notebooklm/notebooks/{id}/studio/status` routes to trigger and poll studio generation
- [x] 2.5 Implement `/api/notebooklm/notebooks/{id}/query` endpoint for querying sources inside a notebook

## 3. Python API Agent Tool Bindings

- [x] 3.1 Create LangChain Structured Tools in `apps/api/src/domains/ater/assistant.py` wrapping `notebooklm_query`, `notebooklm_research`, and `notebooklm_studio_create`
- [x] 3.2 Add the new NotebookLM tools to the Ater Oracle agent's tools list in `get_tools()`
- [x] 3.3 Update the Ater Oracle agent system prompt to teach it when and how to use the NotebookLM capabilities

## 4. SQLite Database Active Recall Sync

- [x] 4.1 Create SQLite database schema migration for storing generated quiz and flashcard details
- [x] 4.2 Implement python parser utility to convert downloaded study helper JSON data to SQLite record structures
- [x] 4.3 Wire the sync utility to trigger immediately after a studio quiz or flashcard generation completes successfully

## 5. React Frontend Page and Workspace

- [x] 5.1 Build the NotebookLM settings panel inside `apps/desktop/src/routes/settings.tsx` to display connection state and trigger authentication
- [x] 5.2 Create the main NotebookLM navigation tab and landing layout in `apps/desktop/src/routes/notebooks.tsx`
- [x] 5.3 Implement the side-by-side notebook list and active workspace panel rendering sources and generated studio assets
- [x] 5.4 Build custom React players/viewers for generated podcasts, PDFs, visual mind maps, and interactive quizzes
