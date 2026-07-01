## Why

The current CI/CD pipelines lack optimization (dependency caching, target build caching) and are missing complete unit test gates on Windows. Specifically:
1. CI does not cache Node (`pnpm`) dependencies or Rust (`cargo`) registry and target, causing unnecessarily long run times.
2. CI only performs a basic `cargo check` on Windows instead of verifying linking and running the actual test suite (`cargo test`), leaving Windows builds vulnerable to runtime failures.
3. CD (`release.yml`) builds macOS aarch64 and Windows x86_64, but lacks Node dependency caching and Rust compilation caching. This results in slow builds and increases the risk of timeout/failure.
4. Fork PRs in CI do not have access to repo secrets, and could fail if Supabase variables are empty and no defaults are provided.

Perfecting both workflows ensures faster feedback loops, absolute code confidence on both Apple Silicon macOS and Windows x86_64, and smooth, cached release packaging.

## What Changes

- **Optimization**: Swapped setup order in workflows to support `actions/setup-node` native `pnpm` cache. Integrated `swatinem/rust-cache` to speed up Tauri Rust builds.
- **Windows Test Coverage**: Upgraded Windows CI job from `cargo check` to a full build and test suite (`cargo test`) to match macOS test coverage.
- **Playwright Caching**: Integrated Playwright browser binary caching to avoid redundant downloads.
- **Defensive Build Vars**: Injected safe mock fallback values (`https://placeholder.supabase.co` and `placeholder_key`) for Vite Supabase env variables in `ci.yml` to prevent build issues in PRs from forks.

## Capabilities

### New Capabilities
- `perfect-ci-cd`: Defines constraints and validation for the perfected CI/CD pipelines including cross-platform caching and full test coverage.

### Modified Capabilities
- None

## Impact

- `.github/workflows/ci.yml`: Modified jobs `test-desktop`, `test-rust`, `test-e2e`, and renamed `check-rust-windows` to `test-rust-windows`.
- `.github/workflows/release.yml`: Re-ordered `setup-node` and `pnpm-setup` to enable pnpm caching. Integrated `swatinem/rust-cache` for the `publish` job.
