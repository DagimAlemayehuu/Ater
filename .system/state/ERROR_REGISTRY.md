# Known Issues & Tech Debt

Active bugs, workarounds, and technical debt to address.

**Last Updated:** 2026-03-11

---

## 🐛 Active Issues

### 1. Generic Error Handling
- **Severity:** Medium
- **Location:** Most backend endpoints (`apps/api/src/api/main.py`, `domains/oka/router.py`)
- **Problem:** Many endpoints catch bare `Exception` and return generic 500 errors. Error messages may leak internal details.
- **Workaround:** None — errors surface as vague "Internal Server Error" in the UI
- **Fix:** Define structured error response model, add specific exception handlers

### 2. OKA Background Worker Reliability
- **Severity:** Medium
- **Location:** `domains/oka/gemini_service.py`
- **Problem:** If the sidecar restarts, pending/processing jobs may get stuck. No retry mechanism.
- **Workaround:** Manually reset job status in SQLite
- **Fix:** Add job timeout detection and auto-retry on worker startup

### 3. Hardcoded Goals Database ID
- **Severity:** Low
- **Location:** `domains/ai/strategist.py:10` — `GOALS_DB_ID = "2a9219ed-..."`
- **Problem:** The Goals Notion database ID is hardcoded. Won't work for other users.
- **Fix:** Make configurable via settings/headers or auto-discover from workspace

---

## 🏗️ Technical Debt

### 1. `core/` Directory is Empty
- **Location:** `apps/api/src/core/`
- **Issue:** Was intended for shared utilities but nothing was extracted
- **Impact:** Some code is duplicated between domains (e.g., Notion client instantiation)

### 2. `resources/` Duplication
- **Issue:** Profile templates exist in 3 places:
  - `resources/templates/` — blank + filled markdown templates
  - `resources/reference/` — filled example profiles
  - `apps/desktop/src/templates/` — same content bundled for Vite `?raw` import
- **Impact:** Changes need to be mirrored in multiple locations
- **Fix:** Consolidate to one source of truth, use build-time copy or symlinks

### 3. Large Frontend Components
- **Issue:** Several route components are very large:
  - `strategist.tsx` — 116KB
  - `academics.tsx` — 49KB
  - `oka.tsx` — 47KB
  - `settings.tsx` — 43KB
- **Impact:** Hard to maintain, slow to review
- **Fix:** Extract into sub-components and custom hooks

### 4. Mixed Gemini SDK Usage
- **Issue:** `domains/ai/strategist.py` uses `google-genai` (new SDK), while `domains/oka/` uses both
- **Impact:** Inconsistent API patterns, potential version conflicts
- **Fix:** Standardize on one SDK across the project

### 5. No Type Safety for API Responses
- **Issue:** Frontend `sidecarApi.ts` uses mostly `any` types for API responses
- **Impact:** No compile-time safety for data shapes
- **Fix:** Generate shared types from Pydantic models or define manually

---

## ✅ Resolved Issues

| Issue | Resolution | Date |
|---|---|---|
| `@tanstack/react-router` module resolution | Removed unused dependency | 2026-03-10 |
| Missing `auth-store` and `ConfirmDialog` components | Created stubs / removed references | 2026-03-10 |
| App not opening after build | Fixed import paths and component references | 2026-03-10 |
