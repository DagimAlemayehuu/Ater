# Sprints - Active Operational Focus

This file represents the current sprint state. It is the single source of truth for what is actively being built right now. Updated at the start and end of every work session.

Read docs/CONTEXT.md before reading this file.

---

## Current Sprint

**Sprint**: SDD Baseline & RAG Consolidation  
**Period**: 2026-06-08 -> ongoing  
**Status**: In Progress

---

## Active Feature Status

### 1. Completed Baseline Modules (As-Built)

The following modules have been completed and verified as functional:
- **Local RAG & ONNX Embeddings**: Offline semantic indexing using local ONNX model packages. No external cloud dependencies.
- **FSRS Spaced Repetition**: Memory stability calculations and next interval updates governed by the FSRS v4 algorithm. Local card reviews are stored in `ater.db`.
- **Feynman Validation**: Keyword matching (incorporating case-insensitivity, singular/plural variations, and prefixes) to validate user responses and release Cognitive Locks.
- **DRM & Hardware blacklisting**: Native machine signature hash checks verified against a remote database blacklist trigger, supplemented by cryptographically signed lease caching.
- **Obsidian Vault Traversal**: Native Rust folder scanning and frontmatter parsing to catalog notes and discover Hub templates.

### 2. In Progress

- **Hybrid Search**: Integrating BM25 keyword index retrieval with Vector similarity search in the Python sidecar to improve search precision for technical terms.

### 3. Decommissioned / Retired

- **Notion Synchronization**: The Notion integration has been completely decommissioned. Database schema tables and credentials columns were dropped in the database migration. Sidecar routes have been refactored to perform local vault scans rather than calling external cloud APIs.

---

## Active Tier 1 Queue

- None queued.

---

## Blocked

- None.

---

## Sprint Notes

- 2026-06-08: Completed baseline forensic analysis of Ater's component boundaries and data flows. Retroactive specs generated for all major modules. Notion sync documented as retired. Emojis cleaned from design documents.
