---
title: "Notion Sync (Retired)"
slug: "notion-sync"
status: ARCHIVED
author: Antigravity
created: 2026-06-08
signed_off_date: 2026-06-08
---

## Context

Ater previously included a cloud Notion integration module designed to sync Obsidian note databases (semesters, courses, assignments) to Notion tables. This feature created a heavy dependency on Notion's API, conflicted with Ater's local-first privacy model, and introduced latency.

## Goals

1. Fully retire and purge Notion sync databases and profile parameters.
2. Maintain local database directory compatibility inside the user's Obsidian Vault.
3. Fallback academic metrics retrieval to local markdown scans.

## Non-Goals

1. Supporting remote Notion webhooks or token authentication.

## Actual Behavior

The feature has been fully **decommissioned**:
- **Database Cleanup**: The database migration `purge_notion_schema.sql` dropped tables `public.notion_sync_state` and `public.notion_databases`, and removed columns `notion_token`, `notion_workspace_id`, `notion_sync_enabled`, and `notion_credentials` from the `public.profiles` table in Supabase.
- **Local-First Fallback Router**: The FastAPI academics router (`apps/api/src/domains/academics/router.py`) no longer integrates with the Notion Client.
  - `sync_academics_profile` creates local directories (`database/assignments`, `database/exams`, `database/study planner`, `database/courses`, `database/semesters`, `database/years`) inside the Obsidian vault.
  - `get_academics_dashboard` reads markdown files from these local directories, extracts YAML metadata using frontmatter loaders, and compiles them into the academics dashboard JSON payload returned to the UI.

## Decisions

- **Complete Decommissioning over Hybrid Mode**: Hybrid cloud-sync options were rejected to eliminate external network failure vectors from the core academic dashboard.

## Acceptance Criteria

| AC# | Criterion | Mapped Test |
|-----|-----------|-------------|
| AC-1 | Drops all Notion-specific tables and user profile integration columns. | `purge_notion_schema.sql` |
| AC-2 | Scans local vault database folder structures instead of calling external Notion APIs. | `apps/api/src/domains/academics/router.py > "get_academics_dashboard"` |

## Risks & Trade-offs

- **Loss of Web Interface Access**: Users can no longer access their academic schedules on Notion. (Mitigation: Users interact with notes directly via local markdown editors or Ater's built-in React dashboard).
