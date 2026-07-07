## 1. CI Failure Repair

- [x] 1.1 Reproduce or inspect failing backend tests for source-learning roadmap refinement and strict AI validation fallback.
- [x] 1.2 Fix backend implementation/tests so the failing pytest cases pass without weakening source-grounded fallback behavior.
- [x] 1.3 Fix `PdfViewer` unit tests or implementation around current iframe/blob-token behavior.
- [x] 1.4 Fix strict `Semester 1` E2E locator behavior.
- [x] 1.5 Remove or convert noisy debug Playwright tests into real smoke coverage.

## 2. Version and Release Workflow

- [x] 2.1 Bump root, desktop, Tauri, and Cargo package versions to `0.2.0`.
- [x] 2.2 Add Linux release matrix coverage and Linux system dependencies.
- [x] 2.3 Build PyInstaller sidecars for macOS arm64, Windows x64, and Linux x64 using Tauri external binary names.
- [x] 2.4 Extend release-side sidecar verification to include every target OS.
- [x] 2.5 Enforce Tauri updater signing inputs and document the public key update path if a new keypair is used.
- [x] 2.6 Generate macOS, Windows, and Linux updater manifest entries and fail if required signatures are missing.

## 3. Release Confidence Checks

- [x] 3.1 Add sidecar binary health checks on each release OS before Tauri packaging.
- [x] 3.2 Add bundle/resource checks for `onnx_model`, `Ater.md`, `.system/prompts`, and the expected sidecar binary.
- [x] 3.3 Add updater manifest validation for URLs, non-empty signatures, expected platform keys, and tag/version consistency.
- [x] 3.4 Add packaged startup smoke where practical in CI.

## 4. Verification

- [x] 4.1 Run `pnpm lint`.
- [x] 4.2 Run `pnpm typecheck`.
- [x] 4.3 Run `pnpm --filter @ater/desktop test`.
- [x] 4.4 Run `cd apps/api && uv run python -m pytest tests/ -v`.
- [ ] 4.5 Run `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml` in GitHub Actions.
- [x] 4.6 Run `pnpm --filter @ater/desktop test:e2e` if local prerequisites are available.
- [x] 4.7 Record release-time cleanup steps for stale `v0.1.0`/`v0.1.1` tags and draft releases without executing destructive cleanup during orchestration.
