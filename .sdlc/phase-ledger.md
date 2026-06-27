# Phase Ledger: perfect-artifacts

## Phase 1: Loop Guard Preprocessor do-while Support
Status: completed
OpenSpec source:
- Main change: openspec/changes/perfect-artifacts/
- Phase spec/change: none
OpenSpec tasks:
- [x] 1.1 Add helper `isDoWhileKeyword` to detect if `while` is the ending of a `do-while` loop in `apps/desktop/src/lib/artifacts/sandbox.ts`
- [x] 1.2 Update `injectLoopGuardToJS` to support `do` loops (injecting guard declarations and increment statements) and skip rewriting the ending `while` keyword of `do-while` loops
- [x] 1.3 Add unit tests to `apps/desktop/src/tests/sandboxFrame.test.ts` verifying that `do-while` loops are successfully guarded and execute/throw correctly
OpenSpec requirements/scenarios:
- `Loop Guard Watchdog` -> `Halting infinite do while loops in sandbox`
Allowed files/areas:
- `apps/desktop/src/lib/artifacts/sandbox.ts`
- `apps/desktop/src/tests/sandboxFrame.test.ts`
Forbidden scope:
- UnifiedSandboxViewer or other UI files.
Verification:
- `pnpm --filter @ater/desktop test`
Manual preview impact:
- None (internal loop preprocessor only).
Completion report:
- Added `isDoWhileKeyword` helper and `do` keyword matching in the loop preprocessor. Standard and single-statement do-while loops are now fully supported, parsed, and guarded correctly without throwing syntax errors. All 9 loop preprocessor test cases passed successfully.

## Phase 2: Sandbox Viewer Auto-Compilation and Retry
Status: completed
OpenSpec source:
- Main change: openspec/changes/perfect-artifacts/
- Phase spec/change: none
OpenSpec tasks:
- [x] 2.1 Update `handleOfflineRetry` in `apps/desktop/src/components/obsidian/UnifiedSandboxViewer.tsx` to clear active compile errors when retrying connection
- [x] 2.2 Add auto-compilation `useEffect` in `UnifiedSandboxViewer` that triggers LLM compilation of `sandboxSpec` nodes when they lack sandbox HTML code
- [x] 2.3 Store note content in local state when reading an Obsidian note in `UnifiedSandboxViewer` to pass it as context for LLM compilation
OpenSpec requirements/scenarios:
- `Unified Sandbox Render Component` -> `Auto compile sandbox specs in Obsidian Note Viewer`
- `Offline Error Warning` -> `Retrying compilation after network error clears active error state`
Allowed files/areas:
- `apps/desktop/src/components/obsidian/UnifiedSandboxViewer.tsx`
Forbidden scope:
- Sandbox preprocessor logic (sandbox.ts) or other routes.
Verification:
- `pnpm --filter @ater/desktop test`
- Manual testing of note view compilation and retry button.
Manual preview impact:
- When opening an Obsidian note with an uncompiled `<sandbox-spec>`, it will automatically compile and display in the split pane preview.
Completion report:
- Added auto-compilation useEffect inside UnifiedSandboxViewer utilizing local state noteContentText to fetch the note's markdown content as generation context. Updated the handleOfflineRetry button handler to clear active compile errors, enabling re-triggering of compilation after simulated offline/unhealthy sidecar retries.
