## Context

Tauri bundles resources in a platform-dependent manner:
- macOS: inside `Contents/Resources/` inside the app bundle.
- Windows/Linux: inside a `resources/` folder next to the main executable.

In the current code, the sidecar path resolution logic for Windows does not account for the `resources/` directory, expecting the files to be directly alongside the executable (which matches dev layout but not production installs). Additionally, the system prompts and instruction markdown files are not bundled in `tauri.conf.json`.

## Goals / Non-Goals

**Goals:**
- Bundle all prompts (`Ater.md`, `.system/prompts/*`) in `tauri.conf.json` resources.
- Correct the Windows path resolution logic in `embeddings_linker.py`, `service.py`, and `assistant.py` to check the `resources/` directory.

**Non-Goals:**
- Changing file names or directory layouts.

## Decisions

### Decision 1: Bundle all prompts in `tauri.conf.json`
Update `tauri.conf.json`'s resources array to:
```json
"resources": [
  "../../api/onnx_model",
  "../../Ater.md",
  "../../.system/prompts/*"
]
```

### Decision 2: Update path resolvers to check `resources/` on Windows
- In `embeddings_linker.py`: Add `exe_path.parent / "resources" / "onnx_model"` check.
- In `service.py`: Add `exe_path.parent / "resources" / "Ater.md"` and `exe_path.parent / "resources" / ".system/prompts/ATER_System_Instruction.md"` checks.
- In `assistant.py`: Add `exe_path.parent / "resources" / ".system/prompts/assistant_oracle.md"` check.

### Decision 3: Update E2E test mocks to prevent walkthrough modal blockers
- **Rationale**: The newly added walkthrough simulation entry modal shows up in step 1 of onboarding if `walkthroughCompleted` is false and `walkthroughMilestone` is `'1.6'`. This overlay intercepts pointer events and blocks the E2E onboarding tests. We will update the mock stores in `student.spec.ts` and `app.spec.ts` to return `walkthroughCompleted: true` and `walkthroughStatus: 'skipped'` to prevent this overlay from rendering.
- **Alternatives Considered**: Modifying tests to close the modal. However, the onboarding tests are focused on manual configuration, so bypassing the tour via mocks is the cleaner approach.

## Risks / Trade-offs

- **[Risk]**: None. This is standard Tauri and PyInstaller packaging practices.

