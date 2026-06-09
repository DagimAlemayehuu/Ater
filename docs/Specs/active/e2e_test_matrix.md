# Updated E2E Test Matrix

This matrix maps high-level user flows to the unit, integration, and end-to-end tests that validate them. All listed tests are passing.

---

## 1. Test Suite Summary

- **Desktop App Tests (Vitest)**: 40 tests passed.
- **Python ML Sidecar Tests (Pytest)**: 141 tests passed.
- **Project Linting & Typings**: Clean execution (0 warnings, 0 errors).

---

## 2. High-Level User Flow Matrix

| Flow ID | User Flow Sequence | Success Criteria | Validating Test Files |
|---|---|---|---|
| **Flow A** | Landing Page Waitlist Registration $\rightarrow$ Admin Approval $\rightarrow$ Desktop App Signup | Profile is immediately created in the remote database with `is_approved = true`, `waitlist_status = 'approved'`, and the correct activation code linked. | - [Onboarding.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Onboarding.test.tsx)<br>- [Login.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Login.test.tsx)<br>- [test_provider_profiles.py](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/api/tests/test_provider_profiles.py) |
| **Flow B** | User Session Active $\rightarrow$ Admin Suspension or Device Blacklisting $\rightarrow$ Immediate Session Lock | Desktop PageGuard blocks route rendering, showing the LockoutScreen. Direct client updates to status or machine bindings are blocked by database RLS. | - [security.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/security.test.tsx)<br>- [test_provider_profiles.py](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/api/tests/test_provider_profiles.py) |
| **Flow C** | Ingest Academic Source $\rightarrow$ FastAPI Ingest Pipeline $\rightarrow$ Local Obsidian Vault Compilation | Source material is analyzed, semantic ONNX embeddings are generated, dependencies are sorted without circular loops, and 4-section notes are written to the local vault. | - [test_academic_engine.py](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/api/tests/test_academic_engine.py)<br>- [test_embeddings_linker.py](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/api/tests/test_embeddings_linker.py)<br>- [test_vault_manager.py](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/api/tests/test_vault_manager.py)<br>- [Obsidian.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Obsidian.test.tsx) |
| **Flow D** | SRS practice Session $\rightarrow$ FSRS Retrievability Drop $\rightarrow$ Cognitive Lock Active $\rightarrow$ Feynman Challenge Approval | Review interface blocks progression if retrievability falls below 70%. Submitting a valid socratic explanation unlocks the screen and updates FSRS metrics. | - [usePracticeSession.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/usePracticeSession.test.tsx)<br>- [Practice.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Practice.test.tsx)<br>- [test_srs_sync.py](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/api/tests/test_srs_sync.py)<br>- [test_validator.py](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/api/tests/test_validator.py) |
| **Flow E** | Admin Dashboard Selection $\rightarrow$ Real-time Status updates $\rightarrow$ Numerical Balance Editing | State triggers do not overwrite the balance input field while typing. balance adjustments and feature unlocks are successfully committed to remote databases. | - [AterDashboard.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/AterDashboard.test.tsx)<br>- [test_provider_profiles.py](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/api/tests/test_provider_profiles.py) |

---

## 3. Detailed Test Catalog

### 3.1 Vitest Unit & Integration Suites (Desktop & Admin)

1. **[usePracticeSession.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/usePracticeSession.test.tsx)** (5 assertions)
   - Validates initial SRS card loading parameters.
   - Asserts retrievability updates post-rating.
   - Tests Cognitive Lock activation when FSRS values drop below 70%.
   - Verifies the state of the active recall practice loop.
2. **[Login.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Login.test.tsx)** (2 assertions)
   - Tests form inputs and client validation constraints.
   - Verifies error reporting for incorrect activation keys.
3. **[Onboarding.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Onboarding.test.tsx)** (1 assertion)
   - Verifies first-time database and vault setup routing.
4. **[Settings.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Settings.test.tsx)** (1 assertion)
   - Tests toggle adjustments for local application preferences.
5. **[AterDashboard.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/AterDashboard.test.tsx)** (3 assertions)
   - Verifies sidebar loading and user grid metrics rendering.
   - Checks balance modification persistence triggers.
6. **[sidecarApi.test.ts](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/sidecarApi.test.ts)** (11 assertions)
   - Checks client-to-sidecar network bridge endpoints.
7. **[Obsidian.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Obsidian.test.tsx)** (1 assertion)
   - Verifies connection limits and parsing for local directories.
8. **[Practice.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/Practice.test.tsx)** (1 assertion)
   - Asserts rendering states for active question blocks.
9. **[ipc.test.ts](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/ipc.test.ts)** (2 assertions)
   - Asserts IPC command execution bindings.
10. **[markdownHelper.test.ts](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/markdownHelper.test.ts)** (11 assertions)
    - Validates wikilink extractors, YAML parser, and continuous prose formatting checks.
11. **[security.test.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/tests/security.test.tsx)** (2 assertions)
    - Asserts PageGuard interception for banned device signatures.

### 3.2 Pytest Integration & Inference Suites (Python Sidecar)

1. **`test_provider_profiles.py`**
   - Validates user profile activation flow, waitlist matching, and RLS constraint triggers.
2. **`test_embeddings_linker.py`**
   - Verifies ONNX vector similarity calculations, cycle resolution, and topological sort.
3. **`test_validator.py`**
   - Checks the keyword validator engine (plural matching, case insensitivity, prefix validation).
4. **`test_academic_engine.py`**
   - Validates MetaScanner pre-analysis and PDF ingestion processing.
5. **`test_srs_sync.py`**
   - Tests FSRS scheduling intervals, state updates, and SQLite database writes.
6. **`test_vault_manager.py`**
   - Asserts markdown file reading/writing routines for the Obsidian vault.
