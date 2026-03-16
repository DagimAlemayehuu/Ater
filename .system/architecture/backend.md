# Backend Architecture

**Location:** `apps/api/`
**Package:** `life-os-api`
**Entry:** `src/api/main.py`
**Runtime:** Python 3.11+ / FastAPI / Uvicorn
**Port:** `127.0.0.1:8765`

## Application Structure

```
apps/api/src/
├── api/
│   ├── main.py           # FastAPI app, CORS, lifespan, core endpoints
│   └── deps.py           # Dependency injection (AppSecrets from headers)
├── core/                 # (reserved for shared utilities — currently empty)
└── domains/
    ├── ai/
    │   ├── __init__.py
    │   └── strategist.py     # Gemini AI agent with Notion/Obsidian tools
    ├── notion/
    │   └── client.py         # Async Notion API wrapper (httpx)
    ├── obsidian/
    │   └── client.py         # Local vault filesystem scanner
    ├── oka/
    │   ├── __init__.py
    │   ├── router.py         # OKA FastAPI endpoints
    │   ├── gemini_service.py # Gemini API integration for note generation
    │   ├── database.py       # SQLAlchemy async engine + session (SQLite)
    │   ├── models.py         # SQLAlchemy ORM models (OkaSettings, JobQueue)
    │   ├── constants.py      # OKA system prompt constants (~166KB)
    │   ├── vault_service.py  # Vault operations (deploy notes, parse hubs)
    │   └── vault_utils.py    # Utility helpers (title canonicalization, paths)
    └── academics/
        ├── router.py         # Academics FastAPI endpoints
        └── service.py        # AcademicsService (Notion database orchestration)
```

## Dependency Injection

**`deps.py`** defines `AppSecrets`, extracted from HTTP headers:

```python
class AppSecrets:
    notion_key: str | None      # From X-Notion-Key header
    gemini_key: str | None      # From X-Gemini-Key header
    gemini_model: str | None    # From X-Gemini-Model header
    vault_path: str | None      # From X-Vault-Path header
```

All endpoints receive secrets via `Depends(get_app_secrets)`.

## Domain Modules

### AI (Strategist)

**File:** `domains/ai/strategist.py`

The `Strategist` class is a Gemini-powered AI agent with **automatic function calling**. It has these tools:

| Tool | What it does |
|---|---|
| `_list_notion_goals()` | Queries the Goals Notion database |
| `_create_notion_goal()` | Creates a new goal with type/priority/due date |
| `_update_notion_goal()` | Updates existing goal properties |
| `_delete_notion_goal()` | Archives a goal |
| `_list_obsidian_notes()` | Lists all `.md` files in the vault |
| `_read_obsidian_note()` | Reads the content of a specific note |

**Gemini config:** Uses `AutomaticFunctionCallingConfig(disable=False)` for agent-style tool invocation. Supports thinking mode for 2.5 and 3.1 models.

**Goals DB ID:** `2a9219ed-7519-815f-ac0f-ebfcd1dcd003` (hardcoded in strategist.py)

### Notion Client

**File:** `domains/notion/client.py`

Async `httpx.AsyncClient` wrapper. API version: `2022-06-28`.

| Method | Notion API Call |
|---|---|
| `list_pages()` | POST /search (filter: page) |
| `list_databases()` | POST /search (filter: database) |
| `query_database()` | POST /databases/{id}/query (with pagination) |
| `get_page_content()` | GET /blocks/{id}/children |
| `update_page_properties()` | PATCH /pages/{id} |
| `create_page_in_database()` | POST /pages |
| `archive_page()` | PATCH /pages/{id} {archived: true} |
| `delete_block()` | DELETE /blocks/{id} |
| `append_block_children()` | PATCH /blocks/{id}/children |

### Obsidian Client

**File:** `domains/obsidian/client.py`

Pure filesystem scanner using `pathlib.Path`:
- `is_valid_vault()` — Checks path exists and is directory
- `list_files(extension=".md")` — Recursive glob, skips `.obsidian/` dirs
- `read_note(relative_path)` — Reads file content as UTF-8 string

### OKA (Obsidian Knowledge Architect)

**Files:** `domains/oka/` (7 files)

A complete subsystem with its own database, background workers, and vault deployment.

**Pipeline:**
```
Ingest Resource (upload/local path)
  → Gemini File API (returns file_uri)
    → Generate Plan (structured JSON: units, batches, note titles)
      → Queue Batch Jobs (SQLite JobQueue, status: pending)
        → Background Worker (polls JobQueue, calls Gemini for each batch)
          → Store Results (job status: completed, result_json)
            → Deploy to Vault (creates dirs, writes .md files with YAML frontmatter)
```

**Local Database (SQLite):**
- `OkaSettings` — Stores API key, model, vault path, system instruction parts A/B
- `JobQueue` — Batch generation jobs with status tracking (pending → processing → completed/failed)

**Lazy Sync:** The GET `/oka/settings` endpoint syncs header-provided keys into the SQLite database for background worker access (worker can't read HTTP headers).

### Academics Service

**Files:** `domains/academics/`

- `AcademicsService.__init__(notion_key)` — Instantiated per-request with Notion key
- `get_dashboard_data()` — Aggregates data from multiple Notion databases (Semesters, Courses, Exams, Assignments, Study Planner, CRM) into a dashboard view
- `sync_profile_markdown()` — Generates a markdown `academic_profile.md` from current Notion data for AI context injection

## CORS Configuration

```python
origins = [
    "tauri://localhost",
    "http://localhost:1420",
    "http://127.0.0.1:1420",
]
```

## Process Lifecycle

- **Startup:** Initializes SQLite database, starts OKA background worker
- **Shutdown:** Handles SIGINT/SIGTERM gracefully, stops background workers
- Tauri manages the Python process lifecycle — starts on app launch, kills on window close
