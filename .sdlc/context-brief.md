# Context Brief

Updated: 2026-06-27T19:29:09.493006+00:00

## Current Objective
- Status: `implemented`
- Active change: `perfect-ci-cd`
- Associated changes: `None`
- Current phase: `2`
- Git branch: `feat/perfect-ci-cd`
- GitHub issue: `#11`

## OpenSpec Artifacts
- `perfect-ci-cd`: 7/7 tasks complete
- `openspec/changes/perfect-ci-cd/proposal.md`
- `openspec/changes/perfect-ci-cd/design.md`
- `openspec/changes/perfect-ci-cd/tasks.md`
- `openspec/changes/perfect-ci-cd/specs/perfect-ci-cd/spec.md`

## Phase State
- Phase 1: Optimizing CI/CD Caching (completed, attempts=1)
- Phase 2: Hardening Windows CI & Environment Defaults (completed, attempts=1)

## Verification State
- Last verification: not run

## Decisions Made
- **Why**: `actions/setup-node` can automatically cache pnpm packages, but only if the `pnpm` executable is present first.
- **Decision**: Install `pnpm` first via `pnpm/action-setup@v3`, and then call `actions/setup-node@v4` with `cache: 'pnpm'`.
- **Why**: Rust release-mode compilation of the Tauri app and sidecar bindings takes several minutes. `swatinem/rust-cache` is highly optimized, handles multiple workspaces/cargo targets automatically, and avoids cache bloat.
- **Decision**: Replace manual `actions/cache` steps with `swatinem/rust-cache@v2` across macOS and Windows runners.
- **Why**: Windows is an official release target. Only running `cargo check` fails to catch linking issues (e.g. `ort` ONNX runtime libraries, Arrow/LanceDB DLLs) or test suite failures.
- **Decision**: Rename `check-rust-windows` to `test-rust-windows`, compile using `cargo build --release`, and execute `cargo test` using the Windows host runner.
- **Why**: `npx playwright install` downloads about 100-150MB of browser binaries on every run.
- **Decision**: Cache `~/.cache/ms-playwright` using `actions/cache@v4` keyed on lockfile hash, and only install browser binaries if there is a cache miss.

## Blockers
- None recorded.

## Next Agent Should
- Execute: `sdlc-verify perfect-ci-cd`
