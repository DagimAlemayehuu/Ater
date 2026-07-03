## 1. Optimizing CI/CD Caching

- [x] 1.1 Re-order setup steps in `.github/workflows/ci.yml` and add `cache: 'pnpm'`
- [x] 1.2 Re-order setup steps in `.github/workflows/release.yml` and add `cache: 'pnpm'`
- [x] 1.3 Integrate `swatinem/rust-cache@v2` into `.github/workflows/ci.yml` for macOS and Windows jobs
- [x] 1.4 Integrate `swatinem/rust-cache@v2` into `.github/workflows/release.yml` for macOS and Windows jobs
- [x] 1.5 Cache Playwright browser binaries in `.github/workflows/ci.yml`

## 2. Hardening Windows Verification in CI

- [x] 2.1 Upgrade Windows CI job `check-rust-windows` to `test-rust-windows` to run a full build and test suite (`cargo test`)

## 3. Environment Configuration and Defaults

- [x] 3.1 Add default fallback values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.github/workflows/ci.yml`
