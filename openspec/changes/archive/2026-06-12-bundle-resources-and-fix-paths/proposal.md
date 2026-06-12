## Why

The compiled production builds on macOS and Windows will crash or fail at runtime because critical system prompt files (`Ater.md`, `assistant_oracle.md`) are not bundled in `tauri.conf.json` resources. Furthermore, the path resolution logic in `embeddings_linker.py`, `service.py`, and `assistant.py` does not check the `resources/` folder on Windows (where Tauri copies packaged assets), leading to missing model and prompt errors at runtime.

## What Changes

- **Tauri Resource Bundling**: Update `tauri.conf.json` to bundle `Ater.md` and `.system/prompts/*` as resources.
- **Windows Path Resolution Fixes**: Update `embeddings_linker.py`, `service.py`, and `assistant.py` to check `exe_path.parent / "resources" / ...` on Windows before executing fallback resolutions.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `desktop-production-ready-audit`: Ensure correct asset bundling and path resolution on both macOS and Windows in frozen execution.

## Impact

- **Affected files**:
  - `apps/desktop/src-tauri/tauri.conf.json`
  - `apps/api/src/domains/ater/embeddings_linker.py`
  - `apps/api/src/domains/ater/service.py`
  - `apps/api/src/domains/ater/assistant.py`
- **Systems**: Production application runtime on Windows and macOS.
