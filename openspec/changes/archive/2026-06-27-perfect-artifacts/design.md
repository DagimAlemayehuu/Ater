## Context

The sandbox code preprocessor in Ater processes LLM-generated JavaScript to inject infinite loop guards. Currently, it only detects `for` and `while` loops. However, if a `do-while` loop is generated, the ending `while` keyword is incorrectly rewritten with a guard block, which breaks JavaScript compilation due to a syntax error.

Additionally, the `UnifiedSandboxViewer` renders the interactive simulator pane. In the Obsidian note route, if a note contains a `<sandbox-spec>` block that has not been compiled into runnable HTML/JS, it shows a permanent loading spinner. No auto-compilation triggers. Also, clicking "Retry Connection" updates network status but does not clear `compileError`, preventing the user from attempting to re-compile the sandbox once connectivity is restored.

## Goals / Non-Goals

**Goals:**
- Fix `do-while` loop detection and guarding in `injectLoopGuardToJS` to prevent syntax errors.
- Implement auto-compilation of `sandbox-spec` blocks inside `UnifiedSandboxViewer` under the Obsidian Note route.
- Make the "Retry Connection" button clear active compile errors to re-trigger compilation.

**Non-Goals:**
- Integrating a full-scale heavy AST parser (like Babel or Acorn) on the frontend. The preprocessor should remain lightweight and fast.
- Rewriting the Tauri sidecar generation logic.

## Decisions

### Decision 1: Do-While Loop Detection via Backward Brace-Matching
We will detect whether a `while` keyword is the ending condition of a `do-while` loop by scanning backward in the JS string from the `while` index:
- Finding the first non-whitespace character before `while`.
- If it is `}`, we track brace depth backward to locate the matching `{`.
- Once `{` is found, we scan backward to check if the word before `{` is `do`.
- We also handle single-statement `do-while` loops without braces by scanning backward for `do` without crossing other block delimiters (`{`, `}`, `;`).
- If it is a `do-while` ending, we skip injecting a loop guard block on that specific `while`.
- When encountering a `do` keyword, if followed by `{`, we inject a guard counter declaration before the `do`, and increment/check the counter inside the `{` block.

*Alternatives considered:*
- Using a full parser: Adds significant bundle size and parsing overhead, which is not suitable for a lightweight, self-contained desktop sidecar client.
- Simple regex: Fails on complex nested structures. The backward scanning approach is extremely reliable and lightweight.

### Decision 2: Auto-Compilation and Compile Error Resetting inside UnifiedSandboxViewer
- We will add a `useEffect` inside `UnifiedSandboxViewer` that checks if the active chapter has `sandboxSpec` but is missing `sandbox` code.
- To prevent duplicate compilation triggers, a ref `compilingSpecsRef = useRef<Set<string>>(new Set())` will track active compiles.
- If a compile succeeds, we update the version using `addVersion`. If it fails, we record the error using `recordCompileError`.
- We will update the `handleOfflineRetry` function to clear the active `compileError` of the active artifact so that the `useEffect` can re-trigger compilation.

## Risks / Trade-offs

- **Risk:** Complex nested brace matching edge cases.
  - *Mitigation:* Ensure unit tests cover nested blocks inside do-while loops, regular loops, and standard blocks.
- **Risk:** Infinite compilation loops on persistent failure.
  - *Mitigation:* Keep a strict list of active compile actions in a Ref Set, and do not retry if there is a compile error unless the user explicitly retries.
