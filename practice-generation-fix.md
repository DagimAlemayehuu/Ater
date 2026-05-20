# 4-Phase Implementation Plan: Practice Generation Fixes

This plan outlines the systematic path to resolve the practice generation issue where selected notes are not matched correctly due to relative path serialization, config synchronization gaps, and layout folder mismatches.

## Phase 1: Research (Completed)
- Traced the note-filtering bug in `service.py` to strict matching of relative paths instead of filename stems.
- Confirmed Tauri `AppConfig` does not deserialize or send `academicFolderPath` in its header mapper.
- Confirmed notes reside in `Notes/` while hubs reside in `database/`.
- Isolated the UI's generic error handling to a hardcoded toast string in `routes/practice.tsx`.

## Phase 2: Design & Verification Outline
We will introduce:
1. **Rust Tauri Alignment:** Addition of `academicFolderPath` field in `AppConfig` to properly map it in proxy headers.
2. **Resilient Python Lookup:** High-fidelity fallback in `_get_unit_dir` to look in `Notes/` directory when notes aren't found under the configured `academic_root` ("database").
3. **Robust Path Normalization:** Normalized stem-matching in `generate_practice` to ignore directory prefix differences.
4. **Descriptive UI Toasts:** User-friendly parsing of FastAPI detail exceptions inside `practice.tsx`.

## Phase 3: Implementation Steps
1. Update `apps/desktop/src-tauri/src/commands.rs` (AppConfig struct and `get_proxy_headers`).
2. Update `apps/api/src/domains/ater/service.py` (`_get_unit_dir` and `generate_practice` matching logic).
3. Update `apps/desktop/src/routes/practice.tsx` (descriptive error helper and toast update).

## Phase 4: Verification
1. Run local development build and verify no compiler/linting issues.
2. Generate practice sessions from the dashboard and confirm success.
