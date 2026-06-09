---
title: "Vault Scanning"
slug: "vault-scanning"
status: ARCHIVED
author: Antigravity
created: 2026-06-08
signed_off_date: 2026-06-08
---

## Context

Ater operates as a local-first application where notes are stored in a standard Obsidian vault directory rather than an opaque custom database. The system needs to discover notes, map relationships, and extract metadata directly from the filesystem.

## Goals

1. Recursively traverse the Obsidian vault to index markdown and PDF files.
2. Parse YAML frontmatter in markdown files to extract note metadata (title, course, semester, hub).
3. Resolve loose note page references (e.g., wikilinks) to actual file paths robustly.
4. Index and list "Hubs" representing units or courses.

## Non-Goals

1. Handling write operations, file editing, or deletion (documented in Note Ingestion specs).
2. Parsing or rendering note bodies in the scanning phase.

## Actual Behavior

The system boundaries are defined as follows:
- **Directory Traversal**: The native Tauri Rust command `list_obsidian_files` (`commands.rs:L930`) calls the recursive `walk_dir` helper. It traverses directories up to a depth of 15 (`WALK_MAX_DEPTH`) and ignores hidden directories (e.g., `.obsidian`), node modules, SQLite database files (`.db`, `.db-shm`, `.db-wal`), and queue folders.
- **YAML Frontmatter Parser**: Implemented natively in `parse_markdown_note` (`commands.rs:L765`). If a file starts with `---`, it extracts the frontmatter block, parses simple key-value fields, supports block list array elements, and deserializes them into JSON objects.
- **Robust Page Resolving**: The Tauri command `find_vault_page` (`commands.rs:L1138`) matches query strings to files in three phases:
  1. Exact relative path match (normalized to lowercase, space-to-underscore).
  2. Exact filename match (matching file types, e.g. PDF).
  3. Loose filename match (ignoring exact file extension).
- **Hub Discovery**: Scanned via `list_hubs` (`commands.rs:L1239`). Finds markdown notes whose filename ends with `_Hub.md` or contains `type: hub` in its parsed frontmatter.

## Decisions

- **Rust-native parsing over Sidecar proxying**: Direct note listing and frontmatter parsing are handled in Rust (`commands.rs`) to avoid sidecar latency overheads for critical file browsing.

## Acceptance Criteria

| AC# | Criterion | Mapped Test |
|-----|-----------|-------------|
| AC-1 | Traverses vault directory recursively up to a depth of 15, returning a list of files. | `apps/desktop/src-tauri/src/commands.rs > "list_obsidian_files"` |
| AC-2 | Extracts YAML frontmatter key-values and exposes them as JSON objects. | `apps/desktop/src-tauri/src/commands.rs > "read_obsidian_note"` |
| AC-3 | Locates files based on loose wikilink strings by checking paths, exact names, and loose names sequentially. | `apps/desktop/src-tauri/src/commands.rs > "find_vault_page"` |
| AC-4 | Identifies Hub notes based on filename suffixes or frontmatter metadata values. | `apps/desktop/src-tauri/src/commands.rs > "list_hubs"` |

## Risks & Trade-offs

- **Memory Overhead for Large Vaults**: Walking the vault recursively on every file browser render can become expensive for vaults with >10,000 files. (Mitigation: depth limits and directory filtering are enforced).
