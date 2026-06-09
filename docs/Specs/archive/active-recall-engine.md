---
title: "Active Recall Engine"
slug: "active-recall-engine"
status: ARCHIVED
author: Antigravity
created: 2026-06-08
signed_off_date: 2026-06-08
---

## Context

Static study is ineffective for long-term memorization. Ater provides an interactive practice interface directly linked to notes to facilitate active learning.

## Goals

1. Render a clean, high-density dashboard displaying active review lists and due metrics.
2. Support multiple question modalities (MCQ, matching, fill-in, sorting, writing).
3. Score responses dynamically and log success rates.
4. Record performance metrics (times, dates, correctness) locally.

## Non-Goals

1. Hosting multiplayer quiz sessions.

## Actual Behavior

The system boundaries are defined as follows:
- **Practice Canvas**: Implemented in React route `apps/desktop/src/routes/practice.tsx`. Renders bento cards representing questions, selections, and validation status.
- **Data Hydration**: Quizzes are retrieved via `sidecarApi.getPractice` which invokes Tauri Rust `get_practice` (`commands.rs:L1517`). It extracts the quiz JSON structure stored inside the note's ````interactive-quiz` markdown block.
- **Question Modalities**: Supports 13 visual question types including:
  - Multiple Choice (MCQ).
  - True / False.
  - Fill in the blank (evaluating multi-word blank fields).
  - Matching (connecting left/right key pairs).
  - Ordering (arranging steps sequentially).
  - Writing (Feynman Challenge keyword validation).
- **Telemetry Logging**: Upon answer submission, the UI calls `sidecarApi.recordPerformance` which invokes Tauri command `record_performance` (`commands.rs:L1233`), writing response times and scores into the local SQLite database `ater.db`.

## Decisions

- **Direct Markdown Embedding**: Embedding quizzes directly in note markdown rather than separate DB tables ensures that copying or moving a note folder preserves its quiz assets.

## Acceptance Criteria

| AC# | Criterion | Mapped Test |
|-----|-----------|-------------|
| AC-1 | Renders interactive components matching multiple quiz modalities. | `apps/desktop/src/routes/practice.tsx` |
| AC-2 | Extracts question structures from note markdown codeblocks. | `apps/desktop/src-tauri/src/commands.rs > "get_practice"` |
| AC-3 | Writes completion times and correctness logs into the local database. | `apps/desktop/src-tauri/src/commands.rs > "record_performance"` |

## Risks & Trade-offs

- **Manual Markdown Tampering**: Users modifying note text can break quiz JSON formatting. (Mitigation: If parsing fails, the backend triggers a fallback generator).
