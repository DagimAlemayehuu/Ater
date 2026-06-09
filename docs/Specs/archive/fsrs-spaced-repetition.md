---
title: "FSRS Spaced Repetition"
slug: "fsrs-spaced-repetition"
status: ARCHIVED
author: Antigravity
created: 2026-06-08
signed_off_date: 2026-06-08
---

## Context

To minimize studying effort while maximizing retention, Ater schedules note reviews using spaced repetition intervals. It locks progression when memory retrievability drops below acceptable thresholds.

## Goals

1. Schedule review intervals using FSRS v4 algorithm parameters.
2. Persist card review history (stability, difficulty, reps, lapses) in local SQLite database.
3. Calculate memory retrievability based on elapsed time.
4. Enforce the Cognitive Lock via a case-insensitive, stem-compatible Feynman active recall keyword check.

## Non-Goals

1. Training custom FSRS weights locally (pre-trained v4 weights are hardcoded).

## Actual Behavior

The system boundaries are defined as follows:
- **Interval Processing**: Implemented in `apps/api/src/domains/ater/srs.py`.
  - Retrievability is computed as $R(t, s) = (1 + t / (9s))^{-1}$ where $t$ is days elapsed and $s$ is stability (`srs.py:L28`).
  - Next interval is calculated as $I(s) = 9s(R_{target}^{-1} - 1)^{-1}$ with $R_{target} = 0.90$.
  - First-time reviews seed parameters from hardcoded pre-trained weights `FSRS_W` (`srs.py:L11`). Subsequent reviews update stability and difficulty recursively based on rating (Again=1, Hard=2, Good=3, Easy=4) in `fsrs_update` (`srs.py:L40`).
- **Database Schema**: Managed by `SRSEngine` (`srs.py:L83`) using table `srs_cards` in local SQLite `ater.db` with columns:
  - `note_path` (TEXT Primary Key)
  - `stability` (REAL)
  - `difficulty` (REAL)
  - `due` (TEXT timestamp)
  - `reps` (INTEGER)
  - `lapses` (INTEGER)
  - `last_review` (TEXT timestamp)
- **Feynman Validation**: `validate_feynman_gate` (`srs.py:L151`) parses the note, extracts the writing question's `required_keywords` from the `interactive-quiz` JSON, and matches them against the user's input:
  1. Exact substring check.
  2. Word-level singular/plural check (suffix strips: `s`, `es`, `ies` -> `y`).
  3. Prefix stem match for words longer than 5 letters.
  If all keywords match, the card rating is updated as Good (3) and rescheduled. Otherwise, it returns the missing keywords list.

## Decisions

- **Pre-trained FSRS v4 Parameters**: Standardizing on FSRS v4 default weights eliminates the need to run local optimization algorithms on client devices, conserving battery and CPU.
- **Stemming Keyword Check**: Incorporating stem and plural checks in Feynman validation prevents system frustration from slight grammatical variations.

## Acceptance Criteria

| AC# | Criterion | Mapped Test |
|-----|-----------|-------------|
| AC-1 | Calculates memory stability, difficulty, and next due date using FSRS v4 equations. | `apps/api/src/domains/ater/srs.py > "fsrs_update"` |
| AC-2 | Reads and writes FSRS states into the local SQLite `srs_cards` table. | `apps/api/src/domains/ater/srs.py > "SRSEngine"` |
| AC-3 | Unlocks cards only if the explanation contains all required keywords (case-insensitive, plural, and stem-compatible). | `apps/api/src/domains/ater/srs.py > "validate_feynman_gate"` |

## Risks & Trade-offs

- **Manual Note renaming**: Renaming note files via external file managers can break `note_path` database keys. (Mitigation: Rust re-indexes moved files and re-associates vector IDs, but external renames bypass this).
