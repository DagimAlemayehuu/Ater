# Ater Desktop Problems Audit

Audit scope: desktop app only, including `apps/desktop`, `apps/desktop/src-tauri`, and the FastAPI sidecar used by the desktop app in `apps/api`.

Ignored scope: website and admin app.

Status: final cleanup pass completed and verified through PR #91. This document records confirmed problems found during the audit, the fixes applied, and the remaining non-blocking cleanup work.

## Final Cleanup Update - 2026-07-04

This section records the final manual cleanup pass after the Jules PR campaign. These items were implemented on the final cleanup branch after the automated Jules sessions were merged or superseded.

### Completed In Final Cleanup

- [x] Fixed the remaining `sidecarApi.ts` failed Jules task.
  - Problem fixed: desktop API calls were still using hardcoded sidecar URLs, inconsistent response handling, and no mutation request serialization.
  - What changed:
    - Added a dynamic sidecar base URL helper backed by the Tauri `get_sidecar_port` command.
    - Added checked fetch/JSON helpers so non-2xx sidecar responses throw useful errors.
    - Added per-method/per-URL locking for non-GET requests to reduce race conditions in mutation paths.
    - Updated Ater desktop sidecar calls to use relative `/api/...` URLs through the checked helpers.
  - Verification:
    - [x] `pnpm --filter @ater/desktop typecheck`
    - [x] `pnpm --filter @ater/desktop test -- src/tests/sidecarApi.test.ts src/tests/PdfViewer.test.tsx src/tests/UnifiedSandboxViewer.test.tsx src/tests/app-sidebar.test.tsx`
    - [x] `pnpm --filter @ater/desktop lint`

- [x] Fixed the `/practice/explain` outside-vault misconception append bug.
  - Problem fixed: `AterService.append_misconception_to_note()` accepted absolute paths and could read/write outside the configured vault.
  - What changed:
    - Resolved note paths through the shared `resolve_vault_path()` containment helper.
    - Outside-vault absolute paths and traversal attempts are rejected by the shared helper.
  - Verification:
    - [x] `uv run pytest tests/routers/test_ai_fixes.py tests/routers/test_ater_traversal.py tests/domains/ater/test_chat_attachment_security.py`

- [x] Removed the dead unauthenticated `/ater/save-persona` endpoint.
  - Problem fixed: the route was unauthenticated and imported a nonexistent `update_persona_prompt` function.
  - What changed:
    - Deleted the broken route instead of preserving a write endpoint with unclear product ownership.
  - Verification:
    - [x] Backend targeted tests passed.

- [x] Token-gated the remaining Ater status endpoints.
  - Problem fixed: `/api/practice/status`, `/api/rag/sync-status`, and `/api/practice/vault/status` did not require sidecar token validation.
  - What changed:
    - Added `Depends(get_app_secrets)` to each status route.
    - Adjusted traversal route tests so dependency overrides do not leak across tests.
  - Verification:
    - [x] Backend targeted tests passed.

- [x] Added missing frontend feature locks for source learning and Feynman validation paths.
  - Problem fixed: several source ingestion/job and Feynman validation client methods could bypass lower-level feature lock checks.
  - What changed:
    - Added `file_ingestion` checks to upload/create/start source learning paths.
    - Added `ai-features` checks and credit deduction to source augmentation/deployment paths.
    - Added `interactive_quiz` lock enforcement to Feynman validation.
  - Verification:
    - [x] Desktop typecheck passed.
    - [x] Focused desktop tests passed.

- [x] Removed random machine ID fallbacks from desktop entitlement flows.
  - Problem fixed: `ConfigContext` and `securityStore` could persist or request leases with random UUIDs when native machine ID resolution failed.
  - What changed:
    - `ConfigContext` no longer persists a random fallback `machineId`.
    - `securityStore` skips lease synchronization when no real native machine ID is available.
  - Verification:
    - [x] Desktop typecheck passed.
    - [x] Focused desktop tests passed.

- [x] Applied useful superseded PR work manually without Jules metadata artifacts.
  - Problem fixed: older pre-campaign PRs still contained useful code changes but also carried generated/session artifacts or overlapped with merged fixes.
  - What changed:
    - `AuthGuard` bypass is now development-only.
    - `HubConnectionsNav` search filtering no longer uses JSON deep cloning.
    - `MiniPracticeUI` markdown rendering was memoized and static component config was hoisted.
  - Verification:
    - [x] Desktop lint passed with warnings only.
    - [x] Desktop typecheck passed.

- [x] Fixed CI regressions discovered after opening final cleanup PR #91.
  - Problem fixed: full backend CI exposed regressions not covered by the initial targeted local tests.
  - What changed:
    - Restored legacy self-study learning-object defaults while preserving explicit academic/source-job routing.
    - Reintroduced transient `SourceJobs/...` runtime notes and hubs for source-learning sessions while keeping deployment writes in final academic/external vault locations.
    - Fixed source PDF topic inference for split chapter headings such as `CHAPTER THREE` followed by `3. Theory of Consumer Behavior`.
    - Fixed stale chat attachment promotion after source PDF deployment moves the original file.
    - Kept content-backed artifact attachments safe by copying them into an internal attachment store, while still rejecting content-backed markdown/text outside approved roots.
    - Added legacy `X-Inbox-Path`/`X-Vault-Path` header compatibility for practice logging, analytics, and SRS routes.
    - Restored edit-mode handling for `/api/ater/artifact/generate` payloads with `previous_code` without reintroducing duplicate routes.
    - Made the ONNX embeddings loader tolerant of mocked `onnxruntime` modules without `__spec__`, fixing the Ubuntu CI-only `transformers`/`torch` import failure.
    - Tightened the ONNX embeddings test availability guard so it skips when either `transformers` or `onnxruntime` is mocked.
    - Fixed Windows backend CI issues by treating POSIX-style absolute paths as unsafe on Windows and making SQLite temp-file cleanup resilient to delayed handle release.
    - Stabilized the Obsidian E2E note-selection flow by opening the mocked note through the supported `/obsidian?path=...` route contract instead of relying on file-tree expansion timing.
    - Stabilized the Obsidian unit test by waiting for note metadata/content before opening the shared lesson runtime.
  - Verification:
    - [x] `uv run pytest` from `apps/api` passed: 474 tests, 3 warnings.
    - [x] `pnpm --filter @ater/desktop test` passed: 34 files, 136 tests.
    - [x] `pnpm --filter @ater/desktop typecheck`
    - [x] `pnpm --filter @ater/desktop test -- src/tests/sidecarApi.test.ts src/tests/PdfViewer.test.tsx src/tests/UnifiedSandboxViewer.test.tsx src/tests/app-sidebar.test.tsx`
    - [x] `pnpm --filter @ater/desktop lint`
    - [x] GitHub CI for PR #91 passed across backend pytest on macOS/Ubuntu/Windows, desktop React on macOS/Ubuntu/Windows, Playwright E2E, Rust cargo test, Rust cargo test on Windows, Vercel, and Vercel Preview Comments.

### Remaining After Final Cleanup

- [x] Full GitHub CI completed successfully for PR #91.
  - Backend pytest passed on macOS, Ubuntu, and Windows.
  - Desktop React typecheck/test/build passed on macOS, Ubuntu, and Windows.
  - Playwright E2E passed.
  - Rust cargo build/test passed on the default runner and Windows.
  - Vercel and Vercel Preview Comments passed.

- [ ] Desktop lint still reports warnings, but zero errors.
  - Current result: `964 problems (0 errors, 964 warnings)`.
  - These warnings are mostly existing `no-explicit-any`, fast-refresh, and hook dependency warnings.
  - They do not block the current lint command because the command exits `0`.

- [ ] Root worktree still contains pre-existing dirty files and scratch scripts.
  - The final cleanup was done in an isolated temp worktree to avoid overwriting user/local changes.
  - Recommended cleanup after merge: compare root-local changes against `origin/main`, then delete only confirmed scratch scripts.

## Continuation Update

This section records the additional audit work done after the initial `Problems.Md` file was created.

### Newly Checked In This Continuation

- [x] Re-read the remaining high-risk portions of `apps/desktop/src/lib/sidecarApi.ts`.
- [x] Rechecked Tauri CSP and bundle configuration in `apps/desktop/src-tauri/tauri.conf.json`.
- [x] Compared frontend `invoke(...)` calls against registered Tauri commands.
- [x] Compared desktop HTTP sidecar call patterns against FastAPI route declarations.
- [x] Reviewed chat runtime attachment and promotion code.
- [x] Reviewed `ConfigContext`, activation binding, and `securityStore` machine ID/lease behavior.
- [x] Reviewed additional Ater router auth gaps and dead endpoints.

### New Problems Found In This Continuation

- [x] `/practice/explain` can append misconceptions to an outside-vault path.
  - Problem: `apps/api/src/api/routers/ai.py` accepts `note_path` in the explain payload. When a misconception is detected, it calls `AterService.append_misconception_to_note(note_path, misconception)`.
  - Root cause: `apps/api/src/domains/ater/service.py` resolves `Path(note_path)` directly when it is absolute, and only prepends the vault for relative paths. It does not verify the final path is inside the vault before reading and writing the note.
  - Impact: a crafted explain request can cause the backend to read and rewrite a Markdown-like file outside the configured vault.
  - Fix checklist:
    - [x] Resolve `note_path` through the shared vault containment helper.
    - [x] Reject absolute paths outside the vault.
    - [x] Reject encoded traversal and `../` traversal.
    - [x] Add regression tests for outside-vault and valid inside-vault behavior.
  - Completion: fixed in final cleanup PR #91.

- [x] `/ater/save-persona` is a broken dead endpoint and is not protected by sidecar auth.
  - Problem: `apps/api/src/api/routers/ater.py` defines `/ater/save-persona` without `Depends(get_app_secrets)`.
  - Additional runtime bug: the route imports `update_persona_prompt` from `src.domains.ater.agents`, but that function does not exist anywhere under `apps/api/src`.
  - Impact: the endpoint 500s if called. If it is later implemented without adding auth, it becomes an unauthenticated prompt-writing endpoint.
  - Fix checklist:
    - [x] Decide whether this endpoint is still needed.
    - [x] If unused, delete the route.
    - [x] If needed, implement the missing function intentionally. Not needed: endpoint was removed.
    - [x] Add `Depends(get_app_secrets)` or router-level auth.
    - [x] Add route coverage through backend CI.
  - Completion: deleted as dead code in final cleanup PR #91.

- [x] Several Ater status endpoints bypass sidecar token validation.
  - Problem: these routes are mounted under `ater_router` without router-level auth and do not depend on `get_app_secrets`:
    - `/api/practice/status`
    - `/api/rag/sync-status`
    - `/api/practice/vault/status`
  - Files:
    - `apps/api/src/api/routers/ater.py`
  - Impact: local unauthenticated callers can read global generation/sync status when `ATER_SIDECAR_TOKEN` is configured. This is lower severity than write-path auth gaps, but inconsistent with the protected sidecar model.
  - Fix checklist:
    - [x] Add `Depends(get_app_secrets)` to these routes unless they are intentionally public.
    - [x] Add token-required coverage.
    - [x] Document any route intentionally left public.
  - Completion: fixed in final cleanup PR #91.

- [x] Source learning sidecar methods still lack consistent frontend feature locks.
  - Problem: `uploadSourceFile`, `augmentGroundedContext`, `createSourceLearningJob`, `startSourceLearningJob`, `deploySourceLearningJob`, and `updateSourceLearningJobRoadmap` perform source ingestion/job mutations without the same `enforceFeatureLock()` pattern used by adjacent AI/source actions.
  - Files:
    - `apps/desktop/src/lib/sidecarApi.ts`
  - Impact: locked users can still reach parts of the source learning pipeline from lower-level client calls.
  - Fix checklist:
    - [x] Apply `file_ingestion` locks to upload/create/start paths.
    - [x] Apply `ai-features` and credit checks to augmentation/deployment paths.
    - [x] Verify locked and unlocked paths through desktop tests and CI.
  - Completion: fixed in final cleanup PR #91.

- [x] `srsFeynmanValidate` bypasses frontend feature-lock and credit checks.
  - Problem: `sidecarApi.srsFeynmanValidate()` invokes the native command directly without `enforceFeatureLock()` or credit deduction, while nearby explain/practice AI actions enforce locks and/or credits.
  - Files:
    - `apps/desktop/src/lib/sidecarApi.ts`
    - `apps/api/src/api/routers/ater.py`
    - `apps/desktop/src-tauri/src/commands.rs`
  - Impact: Feynman validation can become a backdoor around practice/AI restrictions.
  - Fix checklist:
    - [x] Decide the correct feature slug, likely `practice-recall` or `interactive_quiz`.
    - [x] Add `enforceFeatureLock()` before invoking.
    - [x] Add credit deduction if this path uses AI or expensive validation.
    - [x] Verify through desktop typecheck/tests and CI.
  - Completion: fixed in final cleanup PR #91 with the `interactive_quiz` feature lock.

- [x] Machine ID fallback can persist or request leases for a random device ID.
  - Problem: `ConfigContext` persists `crypto.randomUUID()` as `machineId` if native `get_machine_id` times out. `securityStore` also uses `crypto.randomUUID()` when resolving the machine ID for lease generation fails.
  - Files:
    - `apps/desktop/src/lib/ConfigContext.tsx`
    - `apps/desktop/src/context/securityStore.ts`
    - `apps/desktop/src-tauri/src/lib.rs`
    - `apps/desktop/src-tauri/src/commands.rs`
  - Impact: the UI can display a fake persisted device ID, and the security store can ask the lease edge function for a lease bound to a random hash that Rust will reject against the real local machine hash. This creates entitlement drift and confusing lockout behavior when native machine ID resolution is slow.
  - Fix checklist:
    - [x] Do not persist a random fallback as `machineId`.
    - [x] Treat native machine ID failure as a recoverable error state.
    - [x] Do not request security leases with a random machine hash.
    - [x] Verify through desktop tests and CI.
  - Completion: fixed in final cleanup PR #91.

- [x] Chat attachment path validation is inconsistent for relative paths and promotion.
  - Problem: `AttachmentManager.extract_and_chunk()` has local root checks, but stores the original `file_path`. Promotion later reopens `attachment["file_path"]` directly for non-PDF attachments. The earlier content-bypass bug makes this worse, but even normal attachment handling should store a resolved, approved path rather than the caller-supplied string.
  - Files:
    - `apps/api/src/domains/ater/chat_runtime/attachments.py`
  - Impact: validation and later file reads can drift apart. A path that passed one branch can be reopened later through a different branch without re-validating the resolved target.
  - Fix checklist:
    - [x] Store the resolved approved path, not the raw input path.
    - [x] Re-run containment validation during promotion.
    - [x] Use copied attachment storage instead of reopening caller paths where possible.
    - [x] Add tests for relative paths, absolute outside paths, content-provided attachments, and promotion.
  - Completion: fixed in final cleanup PR #91.

## How To Use This File

- `[ ]` means the issue is not fixed.
- Each issue includes the observed problem, why it matters, likely files involved, and a concrete fix checklist.
- Some issues are grouped because they share the same root cause.
- After fixing an item, run the verification listed for that item and then mark it complete.

## Current Verification State

- [ ] Desktop lint is failing.
  - Problem: `pnpm --filter @ater/desktop lint` reports hard errors.
  - Confirmed errors:
    - `benchmark_config_context.js`: console usage, `setTimeout`, and empty block lint failures.
    - `HubConnectionsNav.tsx`: unicode regex issue because the regex is missing the `u` flag.
  - Impact: lint gate cannot pass.
  - Fix checklist:
    - [ ] Remove or gate benchmark debug code.
    - [ ] Replace empty blocks with explicit comments or real handling.
    - [ ] Add the unicode `u` regex flag in `HubConnectionsNav.tsx`.
    - [ ] Re-run desktop lint.

- [ ] Desktop unit tests are failing.
  - Problem: `Obsidian.test.tsx` expects PDF/sidebar behavior that no longer matches the current UI/data.
  - Impact: test suite is red and may hide real regressions.
  - Fix checklist:
    - [ ] Update the mocked vault data or UI expectation around `Algorithms_Syllabus`.
    - [ ] Verify whether the product should still show that PDF item.
    - [ ] Re-run `pnpm --filter @ater/desktop test`.

- [ ] Desktop e2e tests are failing.
  - Problem: `/obsidian` crashes with `TypeError: h.title.toLowerCase()` when mocked hub data uses `name`.
  - Impact: Obsidian route is not shape-safe and can crash with realistic API drift.
  - Fix checklist:
    - [ ] Normalize hub records before filtering/rendering.
    - [ ] Accept `title`, `name`, or fallback display strings safely.
    - [ ] Add a regression test using hub records with only `name`.
    - [ ] Re-run e2e tests.

- [ ] API tests are failing.
  - Problem: API tests show route contract drift and PDF/topic inference failures.
  - Impact: backend behavior does not match current tests or desktop expectations.
  - Fix checklist:
    - [ ] Review each failed API test.
    - [ ] Separate stale tests from real route bugs.
    - [ ] Fix route payload/response contracts.
    - [ ] Re-run API tests.

- [ ] Tauri Clippy fails with warnings treated as errors.
  - Problem: `cargo clippy --all-targets -- -D warnings` reports many Rust errors.
  - Impact: native shell cannot pass strict quality gates.
  - Fix checklist:
    - [ ] Clean up unused imports/variables/dead code in `apps/desktop/src-tauri`.
    - [ ] Resolve private command and handler warnings.
    - [ ] Re-run Cargo check and Clippy.

## Critical Route And Contract Bugs

- [ ] Desktop calls the wrong lesson preview registration endpoint.
  - Problem: `sidecarApi.registerAterLessonPreview()` posts to `/api/ater/lesson/preview/register`, but the backend exposes `/api/ater/lesson/register`.
  - Files:
    - `apps/desktop/src/lib/sidecarApi.ts`
    - `apps/api/src/api/routers/ater.py`
  - Impact: lesson preview registration fails from the desktop app.
  - Fix checklist:
    - [ ] Change the frontend URL to `/api/ater/lesson/register` or add a backend alias.
    - [ ] Add a frontend/API contract test.
    - [ ] Verify lesson preview opens end to end.

- [ ] Duplicate `/api/ater/artifact/generate` routes are mounted in the wrong order.
  - Problem: both `ai.py` and `ater.py` define `/ater/artifact/generate`; `ai_router` is included first, so it wins.
  - Files:
    - `apps/api/src/api/main.py`
    - `apps/api/src/api/routers/ai.py`
    - `apps/api/src/api/routers/ater.py`
  - Impact: desktop persisted artifact generation hits the wrong handler and can return 400.
  - Additional bug: the shadowed `ater.py` handler references `secrets.ai_api_key`, which does not match the current secrets model.
  - Fix checklist:
    - [ ] Remove one route or rename one route.
    - [ ] Ensure desktop calls the intended artifact service.
    - [ ] Replace `secrets.ai_api_key` with the correct key field.
    - [ ] Add a route collision test or route inventory check.

- [ ] Desktop/Rust proxies call missing `/api/ater/interactive-quiz`.
  - Problem: Rust has a proxy for `/api/ater/interactive-quiz`, but the backend route is missing.
  - Files:
    - `apps/desktop/src-tauri/src/commands.rs`
    - `apps/api/src/api/routers/ater.py`
  - Impact: interactive quiz generation/proxy paths fail at runtime.
  - Fix checklist:
    - [ ] Either implement the backend route or remove the proxy and callers.
    - [ ] Add an integration test around the actual quiz route.

- [ ] Stale IPC test references nonexistent `get_vault_status`.
  - Problem: `apps/desktop/src/tests/ipc.test.ts` calls `invoke('get_vault_status')`, but no command exists.
  - Impact: test suite includes a fake command contract.
  - Fix checklist:
    - [ ] Delete the stale test or add the real command if product still needs it.
    - [ ] Re-run desktop tests.

- [ ] Academic route/test naming is stale.
  - Problem: the actual route is `/academic`; some tests or expectations refer to stale naming/title behavior.
  - Impact: route coverage is confusing and can hide actual page regressions.
  - Fix checklist:
    - [ ] Normalize route naming in tests and navigation.
    - [ ] Verify `/academic` loads under real and simulation modes.

## Security And Path Traversal Bugs

- [ ] New vault file/folder/item APIs allow path traversal.
  - Problem: routes such as `/api/vault/files`, `/api/vault/folders`, and `/api/vault/items` build paths with `Path(secrets.vault_path) / req.path` without containment checks.
  - Files:
    - `apps/api/src/domains/obsidian/router.py`
  - Impact: a caller can write, move, or delete files outside the configured vault using `../`.
  - Fix checklist:
    - [ ] Add a shared `resolve_vault_relative_path()` helper.
    - [ ] Reject absolute paths.
    - [ ] Resolve and verify every target is inside the vault root.
    - [ ] Add tests for `../escaped.md`, encoded traversal, and absolute paths.

- [ ] Legacy Obsidian file/item APIs also allow path traversal.
  - Problem: `/api/obsidian/file` and `/api/obsidian/item` accept paths that can escape the vault.
  - Files:
    - `apps/api/src/api/routers/ater.py`
  - Impact: legacy desktop/API paths can still read/write/delete outside the vault.
  - Fix checklist:
    - [ ] Use the same containment helper as the new vault APIs.
    - [ ] Add regression tests for legacy endpoints.

- [ ] PDF helper accepts absolute paths and paths outside the vault.
  - Problem: PDF resolution accepts absolute/local paths outside the vault.
  - Files:
    - `apps/api/src/domains/obsidian/router.py`
  - Impact: PDF metadata/view/serve can expose arbitrary local PDFs if reachable.
  - Fix checklist:
    - [ ] Reject absolute paths unless explicitly whitelisted and inside vault.
    - [ ] Resolve all PDF paths relative to the vault.
    - [ ] Add tests for outside-vault PDF attempts.

- [ ] Practice get/score endpoints can read or mutate outside the vault.
  - Problem: `/api/practice/get` and `/api/practice/score` accept absolute paths and traversal. `/practice/delete` has a containment check, so behavior is inconsistent.
  - Files:
    - `apps/api/src/api/routers/ater.py`
  - Impact: practice APIs can access or modify files outside the vault.
  - Fix checklist:
    - [ ] Apply the same containment logic to get, score, and delete.
    - [ ] Add tests for outside paths.

- [ ] Vault option APIs can operate outside the vault.
  - Problem: `/api/vault/options` create/rename/delete accepts `source="../..."`.
  - Files:
    - `apps/api/src/domains/obsidian/router.py`
  - Impact: property option management can create/delete files outside the intended option folder.
  - Fix checklist:
    - [ ] Validate `source` against known option directories or vault-contained paths.
    - [ ] Reject traversal and absolute paths.
    - [ ] Add tests for `../option_escape`.

- [ ] Rust vault path resolver allows absolute and existing outside-vault paths.
  - Problem: `resolve_path_robust` returns an absolute or existing path directly without vault containment.
  - Files:
    - `apps/desktop/src-tauri/src/commands.rs`
  - Affected commands:
    - `read_obsidian_note`
    - `update_obsidian_note`
    - `delete_obsidian_item`
    - `create_obsidian_file`
    - `create_obsidian_folder`
    - `move_obsidian_item`
  - Impact: native command surface can access files outside the vault.
  - Fix checklist:
    - [ ] Replace `resolve_path_robust` with a strict vault resolver.
    - [ ] Reject absolute paths outside configured vault.
    - [ ] Add Rust tests for traversal and absolute outside paths.

- [ ] Rust database fallback commands join user-controlled path segments.
  - Problem: Rust fallback logic joins `db_name`, `id`, `old_id`, `new_id`, `source`, and `name` directly into paths.
  - Files:
    - `apps/desktop/src-tauri/src/commands.rs`
  - Impact: database row/option commands can escape expected folders.
  - Fix checklist:
    - [ ] Sanitize path components.
    - [ ] Use allowlisted database roots.
    - [ ] Verify resolved paths remain inside vault/database.

- [ ] NotebookLM file upload has filename traversal.
  - Problem: uploaded `file.filename` is joined directly into a temp path.
  - Files:
    - `apps/api/src/api/routers/notebooklm.py`
  - Confirmed behavior: filename `../escaped_upload.txt` can overwrite/delete a sibling file outside the temp dir.
  - Impact: upload can write or delete unintended local files.
  - Fix checklist:
    - [ ] Use `Path(file.filename).name`.
    - [ ] Generate a server-side unique filename.
    - [ ] Verify temp path remains inside temp dir.
    - [ ] Add regression tests.

- [ ] Ater inbox upload has filename traversal.
  - Problem: `/api/ater/inbox/upload` uses `inbox_dir / file.filename`.
  - Files:
    - `apps/api/src/api/routers/ater.py`
  - Impact: upload can write outside the inbox, including vault root.
  - Fix checklist:
    - [ ] Strip directory components from upload names.
    - [ ] Generate collision-safe names.
    - [ ] Add traversal tests.

- [ ] Native `ater_inbox_upload` trusts caller-provided `file_name`.
  - Problem: normal UI sends a basename, but the command surface directly joins the supplied name.
  - Files:
    - `apps/desktop/src-tauri/src/commands.rs`
  - Impact: direct native invocation can write outside inbox.
  - Fix checklist:
    - [ ] Sanitize `file_name` in Rust.
    - [ ] Reject slashes and traversal components.

- [ ] `/api/ai/upload` leaks local files for non-Google providers.
  - Problem: upload leaves files in the working directory and returns absolute local paths for providers such as OpenAI.
  - Files:
    - `apps/api/src/api/routers/ai.py`
  - Confirmed behavior: `temp_sample.txt` remained after upload.
  - Impact: local temp leakage and path disclosure.
  - Fix checklist:
    - [ ] Store uploads in a controlled temp dir.
    - [ ] Clean up after provider upload or request completion.
    - [ ] Do not return absolute local paths to the client.

- [x] Chat attachment promotion can read arbitrary outside files.
  - Problem: `AttachmentManager.attach_file` skips path validation when `content` is provided, but stores arbitrary `file_path`; promotion later reopens that path.
  - Files:
    - `apps/api/src/domains/ater/chat_runtime/*`
    - `apps/api/src/api/routers/ai.py`
  - Impact: a crafted attachment can promote/read a local file outside the vault.
  - Fix checklist:
    - [x] Validate stored file paths even when content is provided.
    - [x] Avoid reopening arbitrary stored paths during promotion.
    - [x] Store copied attachment content under a controlled attachment directory.
    - [x] Add promotion regression tests.
  - Completion: fixed in final cleanup PR #91.

- [ ] Note version restore accepts encoded traversal.
  - Problem: `/api/ater/notes/{note_path:path}/restore` writes version content to `Path(vault) / note_path`; encoded `..` can escape.
  - Files:
    - `apps/api/src/api/routers/ater.py`
  - Impact: restore can overwrite files outside the vault.
  - Fix checklist:
    - [ ] Decode and normalize route path.
    - [ ] Enforce vault containment.
    - [ ] Add encoded traversal tests.

- [ ] Oracle tutor route can read outside-vault notes.
  - Problem: `/api/oracle/tutor/{note_path:path}` reads `vault_path / note_path` without strict containment.
  - Files:
    - `apps/api/src/api/routers/ater.py`
  - Impact: tutor prompt can include outside local file content.
  - Fix checklist:
    - [ ] Enforce vault-contained note paths.
    - [ ] Reject encoded traversal.
    - [ ] Add tests with `%2E%2E%2F`.

- [ ] Reference vault practice APIs can read arbitrary local files.
  - Problem: `/practice/vault/questions` accepts `vault_path`; `/practice/vault/generate` accepts `vault_paths[]`; `VaultWriter.load_questions()` reads the given path directly.
  - Files:
    - `apps/api/src/api/routers/ater.py`
    - `apps/api/src/domains/ater/reference_vault.py`
  - Impact: practice generation can ingest outside local files.
  - Fix checklist:
    - [ ] Store reference vault IDs instead of arbitrary paths.
    - [ ] Resolve all selected files through a vault-contained index.
    - [ ] Add outside-path tests.

- [ ] Artifact pack path can escape the vault.
  - Problem: `get_artifact_pack_path(note_path)` preserves `../` through `Path(note_path).parent / "artifacts"`.
  - Files:
    - `apps/api/src/domains/ater/artifact_service.py`
    - `apps/api/src/domains/ater/learning_object.py`
  - Affected routes:
    - `/ater/artifact/generate`
    - `/ater/artifact/rollback`
    - `/ater/artifact/pin`
  - Impact: artifact pack JSON can be read/written outside the vault.
  - Fix checklist:
    - [ ] Resolve note paths through the strict vault resolver.
    - [ ] Build artifact paths from the resolved vault-relative path only.
    - [ ] Add traversal tests.

- [ ] Lesson compile can write outside the vault.
  - Problem: `/ater/lesson/compile` accepts `note_path`; compiler writes to `note_path.parent / "lessons"` and rewrites frontmatter without containment.
  - Files:
    - `apps/api/src/api/routers/ater.py`
    - `apps/api/src/domains/ater/compiler_service.py`
  - Impact: lesson compilation can write HTML and modify files outside the vault.
  - Fix checklist:
    - [ ] Reject absolute/outside paths.
    - [ ] Use vault-relative note IDs.
    - [ ] Add tests for outside note compile attempts.

- [ ] Tutor service accepts outside absolute paths.
  - Problem: `_resolve_vault_path()` returns existing absolute paths directly.
  - Files:
    - `apps/api/src/domains/ater/tutor_service.py`
  - Affected routes:
    - `/ater/tutor/start`
    - `/ater/practice/remediate`
    - `/ater/tutor/adaptive_question`
    - `/ater/tutor/adaptive_check`
    - `/ater/tutor/transfer/submit`
  - Impact: tutor flows can read or modify outside files.
  - Fix checklist:
    - [ ] Remove absolute-path acceptance.
    - [ ] Resolve note IDs relative to vault root.
    - [ ] Add containment tests for every tutor endpoint that accepts `note_path`.

- [ ] Source learning jobs can ingest arbitrary local files.
  - Problem: `/ater/source/jobs` accepts `file_path` or attachment file path; service only checks that the path exists.
  - Files:
    - `apps/api/src/api/routers/ater.py`
    - `apps/api/src/domains/ater/source_service.py`
  - Impact: source learning can ingest arbitrary local files, especially combined with the chat attachment path bug.
  - Fix checklist:
    - [ ] Only accept files from controlled upload/inbox/attachment stores.
    - [ ] Convert file paths to server-issued IDs.
    - [ ] Add tests for arbitrary outside paths.

## Auth, Feature Locking, And Destructive Action Bugs

- [ ] NotebookLM routes mostly ignore the sidecar token.
  - Problem: the NotebookLM router is mounted without router-level auth, and many endpoints do not depend on `get_app_secrets`.
  - Files:
    - `apps/api/src/api/routers/notebooklm.py`
    - `apps/api/src/api/main.py`
  - Affected endpoints include:
    - auth status/login
    - notebook CRUD/list
    - source list/add/delete/file
    - studio status/download
    - query
  - Impact: when `ATER_SIDECAR_TOKEN` is set, these routes still accept unauthenticated local requests.
  - Fix checklist:
    - [ ] Add router-level dependency or per-route dependency.
    - [ ] Decide whether login/status should be public locally.
    - [ ] Add auth tests with and without `X-Ater-Token`.

- [ ] PDF iframe cannot authenticate to protected backend routes.
  - Problem: Obsidian router is protected by `validate_vault_path`, which requires `X-Ater-Token` when token auth is enabled. Browser iframe navigation and PDF.js fetches cannot attach that header.
  - Files:
    - `apps/desktop/src/components/obsidian/PdfViewer.tsx`
    - `apps/api/src/domains/obsidian/router.py`
    - `apps/api/src/api/main.py`
  - Impact: PDF viewer/serve routes can 401 inside the desktop UI.
  - Fix checklist:
    - [ ] Serve PDFs through an authenticated fetch/blob flow, not raw iframe navigation.
    - [ ] Or issue short-lived signed viewer URLs.
    - [ ] Verify viewer, metadata, and PDF.js worker fetches under token auth.

- [ ] Academic write protection is incomplete.
  - Problem: some academic UI guards are CSS/UI-only and sidecar/Rust mutation paths are not consistently feature-locked.
  - Files:
    - `apps/desktop/src/routes/academic.tsx`
    - `apps/desktop/src/lib/sidecarApi.ts`
    - `apps/desktop/src-tauri/src/commands.rs`
  - Impact: locked users can still reach write paths through lower-level APIs.
  - Fix checklist:
    - [ ] Enforce feature locks in every sidecar API mutation.
    - [ ] Enforce lock-sensitive commands in Rust where applicable.
    - [ ] Add tests that call the lower-level API directly while locked.

- [x] Source learning job frontend calls miss feature-lock checks.
  - Problem: source job creation/start/deploy paths are not consistently protected by frontend feature locks.
  - Files:
    - `apps/desktop/src/lib/sidecarApi.ts`
    - Source learning route/components
  - Impact: locked users may trigger source learning workflows.
  - Fix checklist:
    - [x] Add `enforceFeatureLock()` checks to source learning actions.
    - [x] Verify locked and unlocked states through desktop tests and CI.
  - Completion: fixed in final cleanup PR #91.

- [ ] `generatePractice` deducts credits but skips the practice feature lock.
  - Problem: `generatePractice` calls `deductCredits('generate-practice')` but does not call `enforceFeatureLock('practice-recall')`.
  - Files:
    - `apps/desktop/src/lib/sidecarApi.ts`
  - Impact: billing and lock semantics are inconsistent.
  - Fix checklist:
    - [ ] Add the expected feature lock before credit deduction.
    - [ ] Add a test that locked practice generation is blocked.

- [ ] Assistant action handler can trigger destructive actions without Settings confirmation.
  - Problem: assistant actions can call `factory_reset` and `clear_study_history` outside the Settings confirmation flow.
  - Files:
    - `apps/desktop/src/routes/agents.tsx`
    - `apps/desktop/src/lib/sidecarApi.ts`
  - Impact: high-risk data deletion can be triggered from chat/action flow.
  - Fix checklist:
    - [ ] Remove destructive tools from assistant action surface or require a dedicated confirmation modal.
    - [ ] Require explicit typed confirmation for factory reset.
    - [ ] Add tests ensuring assistant cannot execute destructive actions silently.

- [ ] Auth provider and security store use different Supabase clients.
  - Problem: `AuthProvider` uses `realSupabase`; `securityStore` uses hybrid `supabase`.
  - Files:
    - `apps/desktop/src/context/auth-context.tsx`
    - `apps/desktop/src/context/securityStore.ts`
    - `apps/desktop/src/lib/supabase.ts`
  - Impact: online/offline auth, entitlement, and lease behavior can diverge.
  - Fix checklist:
    - [ ] Decide one source of truth for authenticated cloud calls.
    - [ ] Make auth and security store use the same client policy.
    - [ ] Add tests for offline fallback and online Supabase behavior.

- [ ] `securityStore.initializeSecurity` registers duplicate online listeners.
  - Problem: each call adds a browser online listener without cleanup/de-dupe.
  - Files:
    - `apps/desktop/src/context/securityStore.ts`
  - Impact: repeated initialization can cause duplicate lease refresh attempts and memory leaks.
  - Fix checklist:
    - [ ] Track whether listeners are already installed.
    - [ ] Provide cleanup when the store is reset.
    - [ ] Add a test around repeated initialization.

## Frontend Runtime Bugs

- [ ] `/obsidian` dashboard has unsafe data-shape assumptions.
  - Problem: code assumes fields such as `h.title`, `file.name`, and `f.name` always exist.
  - Files:
    - `apps/desktop/src/routes/obsidian.tsx`
    - Related Obsidian components
  - Impact: route crashes when backend or simulation data uses slightly different shapes.
  - Fix checklist:
    - [ ] Normalize API data at the boundary.
    - [ ] Use safe fallback display fields.
    - [ ] Add tests with missing `title` and `name`.

- [ ] Agent deployment result handling assumes `title` exists.
  - Problem: code checks only `r.path` but later calls `r.title.toLowerCase()`.
  - Files:
    - `apps/desktop/src/routes/agents.tsx`
  - Impact: deployment result rendering can crash.
  - Fix checklist:
    - [ ] Normalize deployment results.
    - [ ] Use optional chaining/fallbacks for `title`.
    - [ ] Add a test with path-only results.

- [ ] Chat runtime direct fetches do not consistently check `res.ok`.
  - Problem: most create/list/get/update/delete/archive/restore/message/memory/attachment/promote/tool calls return `res.json()` blindly.
  - Files:
    - `apps/desktop/src/lib/sidecarApi.ts`
  - Impact: HTTP errors can be treated as valid JSON, causing confusing UI state and swallowed backend failures.
  - Fix checklist:
    - [ ] Route all non-stream fetches through a shared checked JSON helper.
    - [ ] Include backend error text in thrown errors.
    - [ ] Add tests for 400/401/500 responses.

- [ ] Chat runtime URL path params are not encoded.
  - Problem: IDs such as `convId`, `memoryId`, `attachmentId`, and `messageId` are interpolated directly into URLs.
  - Files:
    - `apps/desktop/src/lib/sidecarApi.ts`
  - Impact: special characters in IDs can break routes or alter paths.
  - Fix checklist:
    - [ ] Use `encodeURIComponent()` for all URL path params.
    - [ ] Add tests with IDs containing `/`, `?`, and spaces.

- [ ] Sandbox iframe message handlers do not verify `event.source`.
  - Problem: `UnifiedSandboxViewer` and `PdfViewer` handle `postMessage` events without checking the source frame.
  - Files:
    - `apps/desktop/src/components/obsidian/UnifiedSandboxViewer.tsx`
    - `apps/desktop/src/components/obsidian/PdfViewer.tsx`
  - Impact: unrelated frames/windows can send messages that affect UI state.
  - Fix checklist:
    - [ ] Store iframe refs and verify `event.source === iframe.contentWindow`.
    - [ ] Keep strict origin/data validation.
    - [ ] Add message-handler tests.

- [ ] Sandbox generated HTML CSP conflicts with Tauri CSP.
  - Problem: generated sandbox content expects `cdn.tailwindcss.com`, but Tauri CSP allows only `script-src 'self'`.
  - Files:
    - `apps/desktop/src-tauri/tauri.conf.json`
    - Sandbox generation/rendering code
  - Impact: generated artifacts may render blank or without expected styling/scripts.
  - Fix checklist:
    - [ ] Remove CDN runtime dependency from sandbox HTML.
    - [ ] Bundle required CSS locally or inline a safe subset.
    - [ ] Add a rendering test for generated sandbox artifacts.

- [ ] Tauri CSP allows only fixed sidecar ports.
  - Problem: CSP allows `127.0.0.1:8765` and `8766`, but the launcher may choose `8767+`.
  - Files:
    - `apps/desktop/src-tauri/tauri.conf.json`
    - Sidecar launcher code
  - Impact: desktop fetches can fail when the sidecar falls back to a higher port.
  - Fix checklist:
    - [ ] Align launcher port range with CSP.
    - [ ] Prefer one reserved port or generate CSP for the range.
    - [ ] Add a fallback-port smoke test.

- [ ] Stale chat sidebar localStorage state remains.
  - Problem: sidebar polls legacy `ater_oracle_conversations`.
  - Files:
    - `apps/desktop/src/components/layout/app-sidebar.tsx`
    - `apps/desktop/src/routes/agents.tsx`
  - Impact: legacy localStorage can diverge from backend chat state.
  - Fix checklist:
    - [ ] Remove polling of legacy state after migration.
    - [ ] Read current conversations from the chat API/store.
    - [ ] Add migration cleanup behavior.

- [ ] Settings vault-change flow saves stale inbox path.
  - Problem: changing vault path updates `vaultEdit.vaultPath`, calls `updateVaultPath`, then saves `vaultEdit.inboxPath`, which may still point to the old vault.
  - Files:
    - `apps/desktop/src/routes/settings.tsx`
    - `apps/desktop/src/routes/onboarding.tsx`
  - Impact: after changing vaults, inbox can remain configured to the previous vault.
  - Fix checklist:
    - [ ] When vault path changes, recompute default inbox path unless user explicitly selected one.
    - [ ] Add a test for vault path change in Settings.

## Backend Runtime Bugs And Inconsistencies

- [ ] Obsidian database routes crash because `ruamel` is not imported.
  - Problem: `router.py` calls `ruamel.yaml.YAML(...)` but imports only `yaml`.
  - Files:
    - `apps/api/src/domains/obsidian/router.py`
  - Affected endpoints:
    - `/api/vault/databases`
    - `/api/vault/databases/{db_name}`
    - `/api/vault/databases/{db_name}/schema`
  - Impact: direct API/proxy database calls raise `NameError`.
  - Fix checklist:
    - [ ] Import `ruamel.yaml` correctly or use the imported `yaml` API consistently.
    - [ ] Add route tests for list/query/schema.

- [ ] Obsidian option sanitization computes `safe_name` but does not use it.
  - Problem: create option computes a sanitized name, then writes `f"{req.name}.md"` anyway.
  - Files:
    - `apps/api/src/domains/obsidian/router.py`
  - Impact: unsafe option names with slashes/traversal are still used.
  - Fix checklist:
    - [ ] Use `safe_name` for filenames.
    - [ ] Store original display title separately if needed.
    - [ ] Add tests for slash-containing option names.

- [ ] Database delete archives to `Database` instead of `database`.
  - Problem: deleted database archive path uses uppercase `Database/12 - Archive`, while the rest of the app uses lowercase `database`.
  - Files:
    - `apps/api/src/domains/obsidian/router.py`
  - Impact: creates parallel roots and inconsistent vault layout.
  - Fix checklist:
    - [ ] Change archive path to lowercase `database`.
    - [ ] Add migration/cleanup guidance for existing uppercase archive folders.

- [ ] Chat soft-delete does not hide conversation messages.
  - Problem: soft-delete makes `GET /chat/conversations/{id}` return 404, but `GET /chat/conversations/{id}/messages` still returns messages.
  - Files:
    - `apps/api/src/api/routers/ai.py`
    - Chat runtime persistence files
  - Impact: deleted conversations can still expose their messages.
  - Fix checklist:
    - [ ] Make message listing respect conversation deleted state.
    - [ ] Add tests for soft-deleted conversation messages.

- [ ] Chat branch endpoint allows cross-conversation parent links.
  - Problem: `/chat/conversations/{convB}/branch` accepts `message_id` from `convA`.
  - Files:
    - `apps/api/src/api/routers/ai.py`
    - Chat runtime context/branching code
  - Impact: creates invalid message trees across conversations.
  - Fix checklist:
    - [ ] Verify the message belongs to the target conversation before branching.
    - [ ] Add cross-conversation branch rejection tests.

- [ ] NotebookLM saved practice JSON is not normalized before storage.
  - Problem: backend stores raw NotebookLM artifact JSON; frontend expects exact quiz/flashcard shapes.
  - Files:
    - `apps/api/src/api/routers/notebooklm.py`
    - `apps/desktop/src/routes/notebooks.tsx`
  - Impact: saved quizzes can render with zero cards/questions or missing answer options.
  - Fix checklist:
    - [ ] Define canonical saved quiz and flashcard schemas.
    - [ ] Normalize CLI output before SQLite insert.
    - [ ] Validate and reject unsupported artifact shapes.
    - [ ] Add fixture tests with realistic NotebookLM outputs.

- [ ] NotebookLM artifact downloads leak files under `~/.ater/notebooklm-artifacts`.
  - Problem: studio downloads are saved to a persistent local artifact directory and never cleaned up.
  - Files:
    - `apps/api/src/api/routers/notebooklm.py`
    - `apps/api/src/domains/notebooklm/runner.py`
    - `apps/desktop/src/lib/notebooklmArtifacts.ts`
  - Impact: disk usage grows and sensitive generated files can remain after preview/download.
  - Fix checklist:
    - [ ] Add retention cleanup.
    - [ ] Delete temp artifacts after response where safe.
    - [ ] Add user-visible cleanup or cache management.

## Tauri And Native Shell Bugs

- [ ] Native database commands are stubs that return success without doing work.
  - Problem: these Rust commands do not create/delete/update actual vault database state:
    - `create_vault_database`
    - `delete_vault_database`
    - `update_vault_database_schema`
  - Files:
    - `apps/desktop/src-tauri/src/commands.rs`
    - `apps/desktop/src/lib/sidecarApi.ts`
  - Impact: UI can report success while vault files remain unchanged.
  - Fix checklist:
    - [ ] Implement real native behavior or route to backend APIs.
    - [ ] Return errors for unsupported commands instead of fake success.
    - [ ] Add end-to-end database mutation tests.

- [ ] `get_vault_backlinks` command/API is stale.
  - Problem: frontend calls `invoke('get_vault_backlinks', { pageName })`, but Rust command takes no `pageName` and returns `backlinks: []`.
  - Files:
    - `apps/desktop/src/lib/sidecarApi.ts`
    - `apps/desktop/src-tauri/src/commands.rs`
  - Impact: backlinks feature is dead or misleading.
  - Fix checklist:
    - [ ] Implement real backlinks lookup with page parameter, or remove the frontend API.
    - [ ] Add tests for a note with known backlinks.

- [ ] Sidecar launcher can kill an arbitrary process on port 8765.
  - Problem: launcher kills whatever is listening on the default sidecar port without verifying it is Ater.
  - Files:
    - Sidecar launcher code under `apps/desktop/src-tauri`
  - Impact: app startup can terminate an unrelated local process.
  - Fix checklist:
    - [ ] Probe process identity before killing.
    - [ ] Prefer another free port when occupied by a non-Ater process.
    - [ ] Add startup tests/mocks for occupied port behavior.

- [ ] Sidecar binary packaging and verification are misaligned.
  - Problem: bundle config targets all external binary variants, but verifier checks only the current target; only the darwin-arm64 binary appears present.
  - Files:
    - `apps/desktop/src-tauri/tauri.conf.json`
    - `apps/desktop/scripts/verify-sidecar-binaries.mjs`
  - Impact: release builds for other targets can miss required sidecar binaries.
  - Fix checklist:
    - [ ] Align bundle targets with shipped binaries.
    - [ ] Make verifier check all release targets in CI.
    - [ ] Document supported desktop platforms.

- [ ] `walk_for_graph` has a stale Tauri command annotation.
  - Problem: private helper still carries `#[tauri::command]`.
  - Files:
    - `apps/desktop/src-tauri/src/commands.rs`
  - Impact: dead/stale command metadata and Clippy noise.
  - Fix checklist:
    - [ ] Remove command annotation from private helper.
    - [ ] Re-run Clippy.

## Stale Paths, Legacy Flows, And Product Misalignments

- [ ] Remediation flow uses hardcoded legacy path.
  - Problem: multiple UI flows use `database/learning paths/remediation_temp.md`.
  - Files:
    - `apps/desktop/src/components/MiniPracticeUI.tsx`
    - `apps/desktop/src/components/intelligence/LearningWorkspace.tsx`
    - `apps/desktop/src/routes/obsidian.tsx`
    - `apps/desktop/src/hooks/usePracticeSession.ts`
    - `apps/desktop/src/components/obsidian/MarkdownViewer.tsx`
  - Impact: current jobs emit content under newer paths such as `Notes/external`, `Notes/academic`, and `database/study planner`; remediation cleanup and note detection are stale.
  - Fix checklist:
    - [ ] Replace hardcoded path with a generated temp note service.
    - [ ] Store remediation temp note path in session state.
    - [ ] Clean up by stored path, not by global legacy filename.

- [ ] Academic fallback writes swallow errors.
  - Problem: Rust academic fallback paths can silently ignore write failures.
  - Files:
    - `apps/desktop/src-tauri/src/commands.rs`
  - Impact: UI may report success while academic files were not written.
  - Fix checklist:
    - [ ] Return write errors to the frontend.
    - [ ] Show actionable UI errors.
    - [ ] Add tests for unwritable vault/database paths.

- [ ] `validate_vault_path` verifies vault existence but not child route paths.
  - Problem: backend dependency validates the configured vault but does not constrain route-specific paths.
  - Files:
    - `apps/api/src/api/deps.py`
  - Impact: gives a false sense of safety while child endpoints still accept traversal.
  - Fix checklist:
    - [ ] Keep vault validation separate from path containment.
    - [ ] Add a required containment helper for every path-taking endpoint.

## Dead Code And Unused Dependencies

- [ ] Remove unused dependency group: `@dnd-kit/*`.
  - Problem: `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` are in `apps/desktop/package.json` but have no source imports.
  - Fix checklist:
    - [ ] Confirm no planned drag/drop feature depends on them.
    - [ ] Remove from `package.json`.
    - [ ] Run install/build.

- [ ] Remove unused dependency: `@monaco-editor/react`.
  - Problem: package is installed but no source imports it.
  - Fix checklist:
    - [ ] Confirm CodeMirror is the chosen editor.
    - [ ] Remove dependency.

- [ ] Remove unused dependency: `@tanstack/react-table`.
  - Problem: package is installed but no source imports it.
  - Fix checklist:
    - [ ] Remove dependency or migrate actual tables to it intentionally.

- [ ] Remove unused dependency: `react-hook-form`.
  - Problem: package is installed but no source imports it.
  - Fix checklist:
    - [ ] Remove dependency unless upcoming forms will use it.

- [ ] Remove unused UI wrappers.
  - Confirmed unused files:
    - `apps/desktop/src/components/ui/alert-dialog.tsx`
    - `apps/desktop/src/components/ui/scroll-area.tsx`
    - `apps/desktop/src/components/ui/skeleton.tsx`
    - `apps/desktop/src/components/ui/calendar.tsx`
  - Impact: extra code and dependencies remain without product use.
  - Fix checklist:
    - [ ] Delete unused wrappers.
    - [ ] Remove corresponding Radix/date dependencies if no longer used.
    - [ ] Re-run build/typecheck.

- [ ] Remove old duplicate theme context.
  - Problem: `apps/desktop/src/lib/ThemeContext.tsx` is unused; app uses `apps/desktop/src/context/theme-provider.tsx`.
  - Impact: duplicate theme implementations can confuse future changes.
  - Fix checklist:
    - [ ] Delete old file.
    - [ ] Verify all imports use `@/context/theme-provider`.

- [ ] Remove unused layout header.
  - Problem: `apps/desktop/src/components/layout/app-header.tsx` exports `AppHeader` but no app code imports it.
  - Fix checklist:
    - [ ] Delete the file or wire it intentionally.

- [ ] Remove unused sandbox iframe component.
  - Problem: `apps/desktop/src/components/obsidian/SandboxIFrame.tsx` is orphaned; current viewer uses `UnifiedSandboxViewer`.
  - Fix checklist:
    - [ ] Delete old component or document why both viewers exist.

- [ ] Decide whether `NoteCanvas` is dead product code or test-only code.
  - Problem: `NoteCanvas` is only imported by tests.
  - Fix checklist:
    - [ ] If obsolete, delete component and tests.
    - [ ] If intended, wire it into the app.

## Not Yet Completed In This Audit

The audit is not finished. These are the remaining areas that should be continued:

- [ ] Finish full backend route-by-route review for every `apps/api` endpoint used by desktop.
- [ ] Finish dead-code scan across all desktop routes, hooks, stores, and backend services.
- [ ] Finish dependency cleanup verification after removing confirmed unused packages.
- [ ] Run a fresh complete check matrix after fixes:
  - [ ] `pnpm --filter @ater/desktop lint`
  - [ ] `pnpm --filter @ater/desktop typecheck`
  - [ ] `pnpm --filter @ater/desktop test`
  - [ ] `pnpm --filter @ater/desktop build`
  - [ ] `pnpm --filter @ater/desktop test:e2e`
  - [ ] API pytest suite
  - [ ] Cargo check
  - [ ] Cargo Clippy with warnings denied
- [ ] Manually smoke test desktop flows:
  - [ ] onboarding
  - [ ] vault selection/change
  - [ ] Obsidian note browsing/editing
  - [ ] PDF viewing
  - [ ] academic dashboard
  - [ ] agents/chat
  - [ ] source learning jobs
  - [ ] practice generation/session/scoring
  - [ ] NotebookLM notebook/source/studio/practice flows
  - [ ] artifact generation and rollback
  - [ ] lesson preview/compile
  - [ ] tutor/remediation/adaptive flows
- [ ] Add a central vault path containment library for Python and Rust before fixing individual traversal bugs.
- [ ] Add a sidecar API contract test suite so frontend paths cannot drift from backend routes again.
- [ ] Add an endpoint collision check to prevent duplicate FastAPI routes like `/api/ater/artifact/generate`.
- [ ] Review whether simulation/demo mode should be isolated from real file mutations more strictly.
- [ ] Review current release packaging for every supported OS/architecture.
