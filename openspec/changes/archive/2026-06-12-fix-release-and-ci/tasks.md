## 1. Dependency Verification & Sync

- [x] 1.1 Add missing ML and Langchain runtime dependencies to `apps/api/requirements.txt` to match `pyproject.toml`
- [x] 1.2 Verify that the packages are importable and versioned correctly

## 2. CI/CD Pipeline Configuration

- [x] 2.1 Update `.github/workflows/release.yml` to specify `cache-dependency-path` for `setup-python` action
- [x] 2.2 Ensure the build scripts match target platform binary names

## 3. Local Verification

- [x] 3.1 Run the release dry-run audit script to confirm system safety
- [x] 3.2 Run backend Pytest and frontend Vitest suites to ensure local codebase health
