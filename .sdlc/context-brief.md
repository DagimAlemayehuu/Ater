# Context Brief

Updated: 2026-06-27T19:29:17.733205+00:00

## Current Objective
- Status: `implemented`
- Active change: `perfect-artifacts`
- Associated changes: `None`
- Current phase: `None`
- Git branch: `feature/perfect-artifacts`
- GitHub issue: `#12`

## OpenSpec Artifacts
- `perfect-artifacts`: 9/9 tasks complete
- `openspec/changes/perfect-artifacts/proposal.md`
- `openspec/changes/perfect-artifacts/design.md`
- `openspec/changes/perfect-artifacts/tasks.md`
- `openspec/changes/perfect-artifacts/specs/interactive-artifacts-expansion/spec.md`

## Phase State
- No phases recorded.

## Verification State
- Last verification: not run

## Decisions Made
- Finding the first non-whitespace character before `while`.
- If it is `}`, we track brace depth backward to locate the matching `{`.
- Once `{` is found, we scan backward to check if the word before `{` is `do`.
- We also handle single-statement `do-while` loops without braces by scanning backward for `do` without crossing other block delimiters (`{`, `}`, `;`).
- If it is a `do-while` ending, we skip injecting a loop guard block on that specific `while`.
- When encountering a `do` keyword, if followed by `{`, we inject a guard counter declaration before the `do`, and increment/check the counter inside the `{` block.
- Using a full parser: Adds significant bundle size and parsing overhead, which is not suitable for a lightweight, self-contained desktop sidecar client.
- Simple regex: Fails on complex nested structures. The backward scanning approach is extremely reliable and lightweight.
- We will add a `useEffect` inside `UnifiedSandboxViewer` that checks if the active chapter has `sandboxSpec` but is missing `sandbox` code.
- To prevent duplicate compilation triggers, a ref `compilingSpecsRef = useRef<Set<string>>(new Set())` will track active compiles.
- If a compile succeeds, we update the version using `addVersion`. If it fails, we record the error using `recordCompileError`.
- We will update the `handleOfflineRetry` function to clear the active `compileError` of the active artifact so that the `useEffect` can re-trigger compilation.

## Blockers
- None recorded.

## Next Agent Should
- Execute: `sdlc-verify perfect-artifacts`
