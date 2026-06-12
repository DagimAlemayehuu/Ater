## Why

The Ater release and Gatekeeper CI pipelines fail to package the application correctly because critical sidecar dependencies (like `onnxruntime`, `transformers`, `optimum`, and `numpy`) are defined in `pyproject.toml` but missing from `apps/api/requirements.txt`. During CI releases, PyInstaller bundles the sidecar using `requirements.txt`, leading to either PyInstaller compilation errors or runtime crashes due to missing modules when users launch the compiled desktop application.

## What Changes

- **Update Python Sidecar Dependencies**: Add `onnx`, `onnxruntime`, `optimum`, `transformers`, `numpy`, and `langchain` to `apps/api/requirements.txt` to match the local development environment and `pyproject.toml`.
- **Refine CI/CD Configurations**: Update `.github/workflows/release.yml` to properly cache Python dependencies with `cache-dependency-path: 'apps/api/requirements.txt'` to prevent cache resolution issues in subdirectory requirements.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `desktop-production-ready-audit`: Enforce successful sidecar dependency resolution during PyInstaller packaging and release pipeline execution.

## Impact

- **Affected files**:
  - `apps/api/requirements.txt`
  - `.github/workflows/release.yml`
- **Systems**: GitHub Actions Release pipeline, compiled macOS (aarch64) and Windows (x86_64) applications.
