# Verification Profile

## Local Commands
- **Install**: `pnpm install` (Node/Tauri dependencies) and `cd apps/api && uv sync` (Python dependencies)
- **Lint**: `pnpm lint` (runs `turbo run lint` across all packages)
- **Typecheck**: `pnpm typecheck` (runs `turbo run typecheck` across Next.js and React packages)
- **Unit tests**:
  - Frontend (React): `pnpm --filter @ater/desktop test`
  - Backend (Python): `cd apps/api && uv run python -m pytest tests/ -v`
  - Rust (Tauri Core): `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml`
- **Integration tests**: Included in pytest and cargo test suites.
- **E2E tests**:
  - Desktop: `pnpm --filter @ater/desktop test:e2e` (requires dummy sidecar binary or active sidecar)
  - Admin: `cd apps/admin && npx playwright test`
  - Landing Page: `cd apps/landing-page && npx playwright test`
- **Build**: `pnpm build` (runs `turbo run build` across all workspace apps)
- **Eval suite**: N/A

## CI Gates
- **Required**:
  - `test-backend`: Pytest suite run on Ubuntu/macOS/Windows.
  - `test-desktop`: Vitest run, typechecks, and production build run on Ubuntu/macOS/Windows.
  - `test-rust`: Rust cargo test run on macos-14.
  - `test-e2e`: Playwright E2E suite run on ubuntu-latest.
  - `check-rust-windows`: Cargo check run on windows-latest.
- **Optional**: N/A
- **Missing**: N/A

## Test Strategy
- **Fast PR gate**: Run `pnpm lint`, `pnpm typecheck`, `pnpm --filter @ater/desktop test`, and `cd apps/api && uv run python -m pytest tests/`.
- **Full pre-merge gate**: Full suite including E2E and Rust cargo builds.
- **Nightly/expensive gate**: N/A
- **Manual verification**: Run Tauri desktop dev environment via `pnpm run dev:all` and test note ingestion and FSRS scheduler functionality manually inside the mock `Vault_Test` directory.

## Notes
- Tests reduce risk; they do not prove perfection.
- Every OpenSpec requirement should map to at least one automated, manual, or explicitly waived verification check.
