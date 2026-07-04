# Context Brief

Updated: 2026-07-04T10:20:00+03:00

## Current Objective
- Status: `idle`
- Active change: `none`
- Associated changes: `None`
- Current phase: `none`
- Git branch: `main`
- GitHub issue: `None`

## OpenSpec Artifacts
- No active OpenSpec change.
- Historical OpenSpec artifacts remain under `openspec/changes/archive/` and long-lived specs under `openspec/specs/`.

## Phase State
- Final cleanup campaign completed and merged through PR #91.
- Repository branch hygiene completed: only `main` and `origin/main` remain.

## Verification State
- Last verification: GitHub CI for PR #91 passed backend pytest on macOS/Ubuntu/Windows, desktop React on macOS/Ubuntu/Windows, Playwright E2E, Rust cargo test, Rust cargo test on Windows, Vercel, and Vercel Preview Comments.

## Decisions Made
- PR #91 is the merged source of truth for the final security/runtime cleanup campaign.
- New work must branch from current `main`.
- Stale repair/Jules/Bolt/Sentinel branches were deleted after their useful changes were merged or superseded.

## Blockers
- None recorded.

## Next Agent Should
- Start from clean `main`.
- Read `docs/CONTEXT.md` and `docs/SOP.md` before any new feature or code change.
