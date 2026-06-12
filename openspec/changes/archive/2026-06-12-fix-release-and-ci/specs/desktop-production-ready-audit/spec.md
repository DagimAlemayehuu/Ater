## ADDED Requirements

### Requirement: PyInstaller Sidecar Dependency Resolution
The release pipeline SHALL ensure that all critical runtime dependencies (including `onnx`, `onnxruntime`, `optimum`, `transformers`, `numpy`, and `langchain`) are installed and packaged in the PyInstaller sidecar binary to prevent runtime import exceptions in the compiled desktop application.

#### Scenario: Verify sidecar dependencies in build environment
- **WHEN** the GitHub Actions release workflow executes the PyInstaller build step
- **THEN** the workflow environment SHALL have all required sidecar packages installed from the updated dependency specification
- **THEN** the resulting `ater-api` executable SHALL include all necessary runtime libraries for offline AI processing and PDF parsing
