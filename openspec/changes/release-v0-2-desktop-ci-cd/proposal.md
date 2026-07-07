## Why

Ater v0.2 needs production-critical desktop release infrastructure. Current CI and release packaging are not reliable enough to publish cross-platform desktop builds with the FastAPI Sidecar, Tauri updater signatures, and required offline resources.

## What Changes

- Repair known CI failures in backend tests, desktop unit tests, and Playwright E2E tests.
- Bump release versions to `0.2.0` across workspace, desktop, Tauri, and Cargo release metadata.
- Harden the GitHub release workflow for macOS Apple Silicon, Windows x64, and Linux x64 AppImage/deb outputs.
- Build and verify PyInstaller sidecars for each Tauri external binary target name.
- Require updater signing inputs and generate an updater manifest covering macOS, Windows, and Linux.
- Add release confidence checks for sidecar health, bundled resources, updater manifest integrity, and packaged startup where practical.

## Non-goals

- macOS code signing or notarization.
- Windows Authenticode signing.
- Deleting unrelated git history, branches, or non-release artifacts.

## Impact

- **Affected files**:
  - `.github/workflows/ci.yml`
  - `.github/workflows/release.yml`
  - `scripts/generate_update_json.js`
  - `package.json`
  - `apps/desktop/package.json`
  - `apps/desktop/src-tauri/tauri.conf.json`
  - `apps/desktop/src-tauri/Cargo.toml`
  - `apps/api/src/domains/ater/**`
  - `apps/api/tests/**`
  - `apps/desktop/src/components/obsidian/PdfViewer.tsx`
  - `apps/desktop/src/tests/PdfViewer.test.tsx`
  - `apps/desktop/e2e/**`
- **Systems**: Gatekeeper CI, desktop packaging, Tauri updater, FastAPI Sidecar release bundle.
