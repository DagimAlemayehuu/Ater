## ADDED Requirements

### Requirement: Production Resource Packaging and Path Resolution
The system SHALL bundle all system prompts (`Ater.md`, `assistant_oracle.md`) as Tauri application resources, and the frozen sidecar logic SHALL support locating them under the platform-specific resources directory (including the `resources/` folder on Windows) to prevent startup crashes.

#### Scenario: Verify Windows and macOS frozen path resolution
- **WHEN** the application is compiled and executed in frozen production mode
- **THEN** the sidecar SHALL check both the root executable parent folder and the `resources/` subdirectory (on Windows) or the `Resources` directory (on macOS) for system prompts and model files
- **THEN** the sidecar SHALL load the ONNX model and prompt guidelines successfully
