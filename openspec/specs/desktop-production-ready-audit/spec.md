# desktop-production-ready-audit Specification

## Purpose
TBD - created by archiving change desktop-production-ready-audit. Update Purpose after archive.
## Requirements
### Requirement: Resilient Supabase Offline Mock realtime updates
The system SHALL support chaining multiple `.on()` event listener bindings on the offline mock Supabase client to prevent TypeError exceptions.

#### Scenario: Mock subscription chaining
- **WHEN** the offline mock Supabase client is initialized and `.channel().on().on().subscribe()` is called
- **WHEN** the application is run in offline mock mode
- **THEN** the subscription chain SHALL evaluate without throwing any TypeError or method undefined exceptions

### Requirement: Visual Error Alerts for Critical Failures
The system SHALL display clean visual feedback (e.g. via toast notifications) when the user's waitlist status, activation status, or DRM lease verification fails.

#### Scenario: Activation DRM Failure
- **WHEN** the activation fails due to RLS rejection, invalid waitlist status, or incorrect code
- **THEN** a clear visual alert message SHALL be presented to the user with the specific constraint that was violated

### Requirement: Dynamic Chart Layout Dimensions
The system SHALL provide explicit minimum width and height bounds for analytics dashboards and graphs to prevent Recharts aspect ratio errors in the unit test logs.

#### Scenario: Chart Rendering
- **WHEN** the Practice session dashboard is mounted and rendered
- **THEN** the Recharts components SHALL be wrapped in container structures with defined dimensions to avoid console dimension warnings
### Requirement: Production Resource Packaging and Path Resolution
The system SHALL bundle all system prompts (`Ater.md`, `assistant_oracle.md`) as Tauri application resources, and the frozen sidecar logic SHALL support locating them under the platform-specific resources directory (including the `resources/` folder on Windows) to prevent startup crashes.

#### Scenario: Verify Windows and macOS frozen path resolution
- **WHEN** the application is compiled and executed in frozen production mode
- **THEN** the sidecar SHALL check both the root executable parent folder and the `resources/` subdirectory (on Windows) or the `Resources` directory (on macOS) for system prompts and model files
- **THEN** the sidecar SHALL load the ONNX model and prompt guidelines successfully

### Requirement: PyInstaller Sidecar Dependency Resolution
The release pipeline SHALL ensure that all critical runtime dependencies (including `onnx`, `onnxruntime`, `optimum`, `transformers`, `numpy`, and `langchain`) are installed and packaged in the PyInstaller sidecar binary to prevent runtime import exceptions in the compiled desktop application.

#### Scenario: Verify sidecar dependencies in build environment
- **WHEN** the GitHub Actions release workflow executes the PyInstaller build step
- **THEN** the workflow environment SHALL have all required sidecar packages installed from the updated dependency specification
- **THEN** the resulting `ater-api` executable SHALL include all necessary runtime libraries for offline AI processing and PDF parsing
