## 1. Loop Guard Preprocessor Enhancements

- [x] 1.1 Add helper `isDoWhileKeyword` to detect if `while` is the ending of a `do-while` loop in `apps/desktop/src/lib/artifacts/sandbox.ts`
- [x] 1.2 Update `injectLoopGuardToJS` to support `do` loops (injecting guard declarations and increment statements) and skip rewriting the ending `while` keyword of `do-while` loops
- [x] 1.3 Add unit tests to `apps/desktop/src/tests/sandboxFrame.test.ts` verifying that `do-while` loops are successfully guarded and execute/throw correctly

## 2. Sandbox Viewer Compilation and Retry Fixes

- [ ] 2.1 Update `handleOfflineRetry` in `apps/desktop/src/components/obsidian/UnifiedSandboxViewer.tsx` to clear active compile errors when retrying connection
- [ ] 2.2 Add auto-compilation `useEffect` in `UnifiedSandboxViewer` that triggers LLM compilation of `sandboxSpec` nodes when they lack sandbox HTML code
- [ ] 2.3 Store note content in local state when reading an Obsidian note in `UnifiedSandboxViewer` to pass it as context for LLM compilation

## 3. End-to-End Verification

- [ ] 3.1 Run frontend unit tests with `pnpm test` and verify that all 115+ tests pass
- [ ] 3.2 Run backend unit tests with `pytest` and verify that all 281+ tests pass
- [ ] 3.3 Run typecheck and lint checks to ensure codebase integrity
