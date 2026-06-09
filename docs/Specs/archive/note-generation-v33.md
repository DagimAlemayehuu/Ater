---
title: "Note Generation (v3.3)"
slug: "note-generation-v33"
status: ARCHIVED
author: Antigravity
created: 2026-06-08
signed_off_date: 2026-06-08
---

## Context

To enable effective spaced repetition, Ater must process raw unstructured source materials (PDFs, lectures, textbook chapters) and compile them into standardized, high-quality, local Obsidian knowledge notes.

## Goals

1. Classify incoming raw text into academic domains (e.g., Computer Science, Mathematics, Economics).
2. Segment source material into conceptual nodes and generate note outlines (Sovereign Planning).
3. Generate detailed academic notes with continuous technical prose, LaTeX math formulas, and code snippets.
4. Enforce a strict 4-section note structure.
5. Embed interactive quizzes directly within note files.

## Non-Goals

1. Synchronizing files to remote cloud drives.
2. Generating audio Overviews or flashcards (handled by external modules).

## Actual Behavior

The system boundaries are defined as follows:
- **Pipeline Ingest**: Triggered from the UI via `sidecarApi.aterProcess` which calls Tauri command `ater_process` (`commands.rs:L1519`), proxying to `/api/ater/process` in the FastAPI sidecar.
- **Domain Scan**: The `MetaScannerAgent` (`apps/api/src/domains/ater/agents.py`) extracts domain taxonomies, identifying core prerequisites and difficulty ratings.
- **Planner & Generator**: `AterService` (`service.py:L269`) builds a `SovereignPlan` that splits concepts into atomic titles. It then coordinates parallel Gemini model calls, regulated by `TokenGovernor` (`governor.py`) to prevent quota blockages.
- **Structure Enforcement (Ater.md Contract)**: Every note is validated via `validator.py` to ensure it contains:
  1. `Mental Model` section (continuous analytical prose, zero bullet points).
  2. Domain `h1` concept block.
  3. Domain `h2` implementation block.
  4. `The Proving Grounds` (code examples, math calculations).
- **Quiz Appending**: `_compile_pq_note` (`service.py:L4019`) appends a ````interactive-quiz` JSON codeblock containing multiple question modalities (e.g., MCQ, fill-in, order, matching, writing) for Active Recall verification.

## Decisions

- **No Bullet Points in Prose Invariant**: Continuous technical prose was chosen over bulleted lists in the first three sections of the note to encourage deep reading comprehension rather than superficial skimming.
- **Local Validation Repair Loop**: Rather than rejecting failed note layouts, a local healer (`healer.py`) attempts to correct syntax errors before final vault commit.

## Acceptance Criteria

| AC# | Criterion | Mapped Test |
|-----|-----------|-------------|
| AC-1 | Pre-analyzes source text and extracts taxonomy classification metadata. | `apps/api/src/domains/ater/test_ater.py > "test_metascanner"` |
| AC-2 | Enforces 4-section layout contract and rejects notes that violate prose structures. | `apps/api/src/domains/ater/validator.py > "NoteValidator"` |
| AC-3 | Appends a structured `interactive-quiz` JSON block to note markdown files. | `apps/api/src/domains/ater/service.py > "_compile_pq_note"` |

## Risks & Trade-offs

- **API Rate Limits**: Batch generation calls multiple Gemini LLM endpoints concurrently, which can cause rate locks. (Mitigation: `TokenGovernor` schedules calls and queues them under a max concurrency pool).
