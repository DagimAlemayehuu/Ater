# Design

## Canonical Academic Paths

Academic source jobs already carry placement metadata. For `learning_scope == "academic"`, every user-visible path must be derived from `_source_hub_rel_path()` and `_source_note_rel_path()`. The `SourceJobs/<job_id>/...` path remains valid only for non-academic or legacy sessions where no academic placement exists.

SQLite remains the runtime store for source job IDs, current concept IDs, active unlocks, wagers, coverage state, and restore metadata.

## Hub Discovery

The sidecar Practice builder must resolve hubs recursively below `database/study planner`, matching desktop hub discovery. A hub can be selected by filename, relative path with `.md`, relative path without `.md`, or metadata ID.

## Source-Grounded Degraded Notes

When AI generation is unavailable or invalid, deterministic fallback must still produce a usable source-grounded note. The fallback compiler should:

- choose excerpts from the concept's source pages;
- extract definition/mechanism/equation/detail sentences from those excerpts;
- avoid unrelated analogies and placeholder claims;
- create a meaningful MCQ whose correct answer is a clean concept fact, not a truncated arbitrary excerpt;
- create true/false and writing questions whose explanations cite the relevant source page;
- mark `fallback_generation: true` only as an implementation status, not as permission to generate low-quality content.

## Progression

Tutor progression should evaluate the current canonical note path. If all required recall questions pass, the source coverage row and completed notes should update. If the transfer gate is required and missing, the block reason should identify that. Failed answers should keep the learner on the note or remediation state without silently recording unrelated note progress.

## Verification

Regression coverage should prove:

- nested academic hubs are found by Practice;
- academic source job start does not create visible `SourceJobs` vault files;
- source deployment writes canonical notes and hub paths;
- fallback economics notes contain source-specific content and non-garbage questions;
- tutor status/advance remains aligned to canonical note paths.
