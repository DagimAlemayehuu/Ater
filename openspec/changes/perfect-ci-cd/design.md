## Context

The Ater desktop app is a Tauri-based application that executes a FastAPI Python sidecar for local ML tasks.
- The CI pipeline (`ci.yml`) runs linting, typechecking, frontend tests, backend pytest, and Rust cargo tests.
- The CD pipeline (`release.yml`) builds the compiled sidecar (using PyInstaller) and packages the Tauri application for macOS (aarch64) and Windows (x86_64).
- The current workflows suffer from lack of caching (specifically Node dependencies, Playwright browsers, and Rust targets), which results in slow runtimes. Furthermore, Windows Rust verification in CI is limited to `cargo check` only, leaving Windows-specific linking or unit test bugs undetected.

## Goals / Non-Goals

**Goals:**
- Implement Node (`pnpm`) caching in all CI/CD jobs using `actions/setup-node@v4`.
- Implement Rust compilation caching in CI/CD jobs using `swatinem/rust-cache@v2`.
- Cache Playwright browser binaries in CI E2E jobs.
- Enable full build and test (`cargo build --release` and `cargo test`) on Windows CI to match macOS coverage.
- Add defensive fallback environment variables for Supabase vars in frontend tests to ensure fork PR compatibility.

**Non-Goals:**
- Upgrading main Tauri or Rust compiler versions.
- Changing release repository details (`DagimAlemayehuu/Ater_Releases`).
- Altering code signing identities.

## Decisions

### 1. Re-order Node and pnpm setup for cache integration
- **Why**: `actions/setup-node` can automatically cache pnpm packages, but only if the `pnpm` executable is present first.
- **Decision**: Install `pnpm` first via `pnpm/action-setup@v3`, and then call `actions/setup-node@v4` with `cache: 'pnpm'`.

### 2. Implement `swatinem/rust-cache@v2`
- **Why**: Rust release-mode compilation of the Tauri app and sidecar bindings takes several minutes. `swatinem/rust-cache` is highly optimized, handles multiple workspaces/cargo targets automatically, and avoids cache bloat.
- **Decision**: Replace manual `actions/cache` steps with `swatinem/rust-cache@v2` across macOS and Windows runners.

### 3. Upgrade Windows CI to full Cargo build and test
- **Why**: Windows is an official release target. Only running `cargo check` fails to catch linking issues (e.g. `ort` ONNX runtime libraries, Arrow/LanceDB DLLs) or test suite failures.
- **Decision**: Rename `check-rust-windows` to `test-rust-windows`, compile using `cargo build --release`, and execute `cargo test` using the Windows host runner.

### 4. Cache Playwright Browsers in E2E
- **Why**: `npx playwright install` downloads about 100-150MB of browser binaries on every run.
- **Decision**: Cache `~/.cache/ms-playwright` using `actions/cache@v4` keyed on lockfile hash, and only install browser binaries if there is a cache miss.

## Risks / Trade-offs

- **Risk**: Rust cache bloat exceeding GHA 10GB limits.
  - **Mitigation**: `swatinem/rust-cache` automatically cleans up unused artifacts, minimizing storage bloat.
- **Risk**: OS-specific path differences in Playwright cache keys.
  - **Mitigation**: Specify the path as `~/.cache/ms-playwright` since E2E only runs on `ubuntu-latest` in CI.
