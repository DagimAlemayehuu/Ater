## MODIFIED Requirements

### Requirement: Cross-platform Desktop Release
Ater SHALL publish v0.2 desktop release artifacts for macOS Apple Silicon, Windows x64, and Linux x64.

#### Scenario: Release workflow builds all target platforms
- **WHEN** the release workflow runs for tag `v0.2.0`
- **THEN** it builds macOS Apple Silicon, Windows x64, and Linux x64 desktop bundles
- **AND** the Linux output includes AppImage and deb installers
- **AND** each target includes the matching FastAPI Sidecar external binary.

### Requirement: Tauri Updater Manifest Integrity
Ater SHALL generate a Tauri updater manifest with valid platform entries and non-empty updater signatures.

#### Scenario: Generate update manifest for v0.2.0
- **WHEN** release artifacts are available for macOS, Windows, and Linux
- **THEN** `update.json` contains Tauri-compatible platform keys for each supported updater target
- **AND** every platform entry has a URL and non-empty signature
- **AND** the manifest version matches the release tag version.

### Requirement: Release Confidence Gates
Ater SHALL verify sidecar health and bundled offline resources before publishing release artifacts.

#### Scenario: Verify release package readiness
- **WHEN** a release runner finishes building the sidecar and before packaging/publishing
- **THEN** CI verifies the sidecar starts or reports health on that runner
- **AND** CI verifies `onnx_model`, `Ater.md`, `.system/prompts`, and the expected sidecar binary are present in the package resources
- **AND** packaged startup smoke runs where supported by the CI operating system.
