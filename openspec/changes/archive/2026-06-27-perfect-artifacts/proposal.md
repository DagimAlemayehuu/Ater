## Why

The Ater simulator sandbox system currently has two functional gaps:
1. The JavaScript loop guard preprocessor generates syntax errors when wrapping `do-while` loops (rewriting the ending `while` keyword incorrectly as a block), breaking dynamically generated sandbox simulators.
2. The `UnifiedSandboxViewer` does not automatically compile `<sandbox-spec>` blocks when opened inside the Obsidian note viewer, leading to a permanent loading spinner. Additionally, the "Retry Connection" action updates connectivity status but does not clear active compile errors to trigger a re-compilation.

## What Changes

- Add robust support for `do-while` loop detection and guarding in the sandbox preprocessor without causing syntax errors.
- Implement automatic client-side compilation of `sandbox-spec` nodes in `UnifiedSandboxViewer` for the Obsidian note route, using loaded note content for LLM generation context.
- Update the "Retry Connection" error state click handler to clear the active `compileError` status, allowing the preprocessor to try compiling again.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `interactive-artifacts`: Support robust `do-while` loops in the JavaScript loop guard preprocessor.
- `interactive-artifacts-expansion`: Implement automatic compilation of `sandbox-spec` blocks inside the Obsidian Note Viewer and clear compile errors on retry.

## Impact

- `apps/desktop/src/lib/artifacts/sandbox.ts`: Loop guard helper functions.
- `apps/desktop/src/components/obsidian/UnifiedSandboxViewer.tsx`: Sandbox viewer lifecycle, compiling hooks, and retry handlers.
- `apps/desktop/src/tests/sandboxFrame.test.ts`: Added unit tests for do-while loops in the preprocessor.
