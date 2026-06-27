# Phase Ledger: perfect-ci-cd

## Phase 1: Optimizing CI/CD Caching
Status: completed
OpenSpec source:
- Main change: openspec/changes/perfect-ci-cd/
- Phase spec/change: none
OpenSpec tasks:
- [x] 1.1 Re-order setup steps in `.github/workflows/ci.yml` and add `cache: 'pnpm'`
- [x] 1.2 Re-order setup steps in `.github/workflows/release.yml` and add `cache: 'pnpm'`
- [x] 1.3 Integrate `swatinem/rust-cache@v2` into `.github/workflows/ci.yml` for macOS and Windows jobs
- [x] 1.4 Integrate `swatinem/rust-cache@v2` into `.github/workflows/release.yml` for macOS and Windows jobs
- [x] 1.5 Cache Playwright browser binaries in `.github/workflows/ci.yml`
OpenSpec requirements/scenarios:
- `Cross-platform Caching in CI/CD`: The CI/CD workflows SHALL cache Node (`pnpm`) dependencies and Rust (`cargo`) build target directories to optimize execution time.
Allowed files/areas:
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
Forbidden scope:
- unrelated refactors
- upgrading main Tauri or Rust compiler versions
- changing release repository details
Verification:
- Validate GHA workflow syntax using local validator or lint checks.
Manual preview impact:
- None (CI workflow changes).
Completion report:
- Successfully optimized Node/pnpm dependency caching and Rust compiler target/registry caching using `swatinem/rust-cache@v2` on both macOS and Windows runners. Configured Playwright browser binary caching to speed up E2E workflow runs.


## Phase 2: Hardening Windows CI & Environment Defaults
Status: pending
OpenSpec source:
- Main change: openspec/changes/perfect-ci-cd/
- Phase spec/change: none
OpenSpec tasks:
- [ ] 2.1 Upgrade Windows CI job `check-rust-windows` to `test-rust-windows` to run a full build and test suite (`cargo test`)
- [ ] 3.1 Add default fallback values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.github/workflows/ci.yml`
OpenSpec requirements/scenarios:
- `Windows Test Validation`: The CI workflow SHALL perform full build and unit testing (`cargo test`) for Rust code on the Windows runner.
Allowed files/areas:
- `.github/workflows/ci.yml`
Forbidden scope:
- unrelated refactors
- upgrading main Tauri or Rust compiler versions
- changing release repository details
Verification:
- Validate GHA workflow syntax.
Manual preview impact:
- None.
