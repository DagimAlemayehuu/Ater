# API Endpoints Reference

**Base URL:** `http://127.0.0.1:8765`
**Auth:** All endpoints (except health) require secret headers from the frontend.

## Common Headers

| Header | Required | Description |
|---|---|---|
| `X-Notion-Key` | For Notion ops | Notion integration token |
| `X-Gemini-Key` | For AI ops | Google Gemini API key |
| `X-Gemini-Model` | Optional | Model selection (default: `gemini-2.5-flash`) |
| `X-Vault-Path` | For Obsidian ops | Absolute path to Obsidian vault |

---

## Core

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check | None |

**Response:** `{"status": "ok", "version": "0.1.0"}`

---

## Notion

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/notion/pages` | List workspace pages | Notion |
| `GET` | `/api/notion/databases` | List databases | Notion |
| `GET` | `/api/notion/databases/{database_id}/query` | Query a database | Notion |
| `POST` | `/api/notion/databases/{database_id}/pages` | Create page in database | Notion |
| `PATCH` | `/api/notion/pages/{page_id}` | Update page properties | Notion |
| `DELETE` | `/api/notion/pages/{page_id}` | Archive (delete) a page | Notion |
| `GET` | `/api/notion/pages/{page_id}/content` | Get page blocks/content | Notion |
| `PUT` | `/api/notion/pages/{page_id}/content` | Replace page content | Notion |

### Create Page Body
```json
{
  "properties": {
    "Name": {"title": [{"text": {"content": "My Page"}}]},
    "Status": {"select": {"name": "Active"}}
  }
}
```

### Update Page Body
```json
{
  "properties": {
    "Name": {"title": [{"text": {"content": "Updated Name"}}]}
  }
}
```

---

## Obsidian

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/obsidian/files` | List all `.md` files in vault | Vault Path |
| `GET` | `/api/obsidian/files/{relative_path}` | Read note content | Vault Path |
| `PUT` | `/api/obsidian/files/{relative_path}` | Write/update note content | Vault Path |

### List Files Response
```json
[
  {
    "name": "note.md",
    "path": "folder/note.md",
    "full_path": "/Users/.../vault/folder/note.md",
    "modified": "2026-03-10T15:30:00",
    "size": 1234
  }
]
```

---

## AI (Strategist)

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/ai/brainstorm` | AI agent with Notion/Obsidian tools | Gemini + Notion + Vault |
| `POST` | `/api/personae/save` | Save custom persona prompt to filesystem | None |

### Brainstorm Body
```json
{
  "query": "What should I focus on this week?",
  "context": "Optional knowledge base context...",
  "system_prompt": "Optional custom system prompt...",
  "model": "gemini-2.5-flash",
  "history": [
    {"role": "user", "parts": "Previous message"},
    {"role": "model", "parts": "Previous response"}
  ]
}
```

**Response:** `{"response": "AI-generated text..."}`

---

## OKA (Obsidian Knowledge Architect)

All prefixed with `/api/oka/`.

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/oka/chat` | Chat with Gemini (OKA context) | Gemini |
| `POST` | `/api/oka/ingest-resource` | Upload file for Gemini | Gemini |
| `POST` | `/api/oka/ingest-local-path` | Ingest local file by path | Gemini |
| `POST` | `/api/oka/generate-plan` | Generate study plan from resource | Gemini |
| `POST` | `/api/oka/generate-batch` | Queue batch note generation | None |
| `GET` | `/api/oka/generate-status/{job_id}` | Poll job status | None |
| `GET` | `/api/oka/generate-results/{job_id}` | Fetch completed notes | None |
| `POST` | `/api/oka/deploy-batch` | Deploy notes to Obsidian vault | None |
| `GET` | `/api/oka/hub-structure` | Parse hub file structure | None |
| `GET` | `/api/oka/validate-path?vault_path=...` | Validate vault path | None |
| `GET` | `/api/oka/settings` | Get OKA settings | Gemini (for sync) |
| `PATCH` | `/api/oka/settings` | Update OKA settings | None |
| `POST` | `/api/oka/test-api` | Test Gemini API key validity | None |

### Chat Body
```json
{
  "messages": [
    {"role": "user", "content": "Explain chapter 3"},
    {"role": "model", "content": "Chapter 3 covers..."}
  ],
  "file_uri": "https://generativelanguage.googleapis.com/..."
}
```

### Ingest Resource
- **Content-Type:** `multipart/form-data`
- **Field:** `file` (the document to upload)
- **Response:** `{"file_uri": "https://generativelanguage.googleapis.com/..."}`

### Generate Plan Body
```json
{
  "file_uri": "https://generativelanguage.googleapis.com/..."
}
```

### Generate Batch Body
```json
{
  "file_uri": "https://generativelanguage.googleapis.com/...",
  "unit_context": "Unit 3: Data Structures",
  "batch_id": 1,
  "batch_notes": ["Arrays", "Linked Lists", "Stacks"],
  "metadata": {"course": "CS1220", "semester": "S1"}
}
```

### Deploy Batch Body
```json
{
  "notes": [
    {"title": "Arrays", "content": "# Arrays\n...", "type": "note"}
  ],
  "vault_path": "/Users/.../vault"
}
```

---

## Academics

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/academics/dashboard` | Full academic status | Notion |
| `POST` | `/api/academics/sync-profile` | Sync academic data to markdown | Notion |

### Dashboard Response
Returns aggregated data from multiple Notion databases:
- Active semester info
- Courses list with completion stats
- Upcoming exams with dates and urgency
- Pending assignments
- Study planner items needing review
