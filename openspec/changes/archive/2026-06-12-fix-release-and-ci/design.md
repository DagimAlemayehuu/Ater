## Context

During GitHub Actions runs, the Ater release pipeline has failed to compile a fully functional Python sidecar executable because key runtime dependencies (such as ONNX Runtime, Optimum, and Transformers) are not present in the environment when PyInstaller runs. Because the PyInstaller Spec (`ater-api.spec`) omits heavy runtime libraries from dynamic collection but still relies on standard imports, these modules must be pre-installed on the runner.

## Goals / Non-Goals

**Goals:**
- Add all missing sidecar imports (ONNX, ONNX Runtime, Optimum, Transformers, Numpy, Langchain) to `apps/api/requirements.txt`.
- Set the correct `cache-dependency-path` in `.github/workflows/release.yml` so that pip caching works perfectly for subfolder configurations.
- Verify the build and release flow configuration is robust and consistent.

**Non-Goals:**
- Changing the application packaging format (keeping PyInstaller onefile).
- Modifying backend code or changing runtime algorithms.

## Decisions

### Decision 1: Sync `requirements.txt` with `pyproject.toml`
- **Rationale**: The FastAPI sidecar code imports `onnxruntime` and `transformers` lazily for embedding generation. However, these are defined in `pyproject.toml` (used by `uv` during local testing) but missing from `requirements.txt` (used by `pip` during CI packaging). We will add them to `requirements.txt` to guarantee their presence during packaging.
- **Alternatives Considered**: Modifying the release workflow to use `uv run pyinstaller` instead of `pip`. However, standardizing on `pip` for PyInstaller packaging is more straightforward for stable runners and avoids introducing extra toolchains.

### Decision 2: Set `cache-dependency-path` in setup-python
- **Rationale**: Setting `cache-dependency-path: 'apps/api/requirements.txt'` is required by `setup-python@v5` when caching is enabled (`cache: 'pip'`) and the requirements file is located in a sub-directory.
- **Alternatives Considered**: Disabling pip caching. However, caching significantly reduces run times on Windows and macOS runners.

## Risks / Trade-offs

- **[Risk]**: Increased installer/sidecar binary size.
  - **Mitigation**: PyInstaller spec already excludes very heavy packages (like PyTorch, TensorFlow, etc.) that are not required for ONNX inference. We keep these exclusions intact, keeping the final binary size reasonable while ensuring all required lightweight runtime dependencies are present.
