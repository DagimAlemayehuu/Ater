## Context

Ater v0.2 release infrastructure must produce downloadable desktop builds for macOS Apple Silicon, Windows x64, and Linux x64. The release flow must package the FastAPI Sidecar as a Tauri external binary, include local-first resources, and generate a signed updater manifest.

## Goals / Non-Goals

**Goals:**
- Restore green local/CI gates for backend, desktop unit, Rust, and E2E coverage.
- Publish version `0.2.0` metadata consistently across Node, Tauri, and Cargo.
- Build sidecar binaries with the platform-specific names Tauri expects.
- Add Linux release packaging and updater manifest coverage.
- Fail releases early when updater signatures, sidecar binaries, or offline resources are missing.

**Non-Goals:**
- OS-level signing, notarization, or Windows Authenticode signing.
- Runtime product redesign.
- Destructive cleanup of release tags or draft releases during orchestration.

## Decisions

### Decision 1: Keep updater signing as a required release input
- **Rationale**: Tauri updater signing is independent of OS signing and is required for update integrity.
- **Implication**: The release workflow must require `TAURI_PRIVATE_KEY` and fail when a signature is missing.

### Decision 2: Use Tauri external binary target names for sidecars
- **Rationale**: Tauri resolves external binaries by target triple. Release packaging must create the exact sidecar file for each target OS.
- **Implication**: Sidecar verification should check the platform-specific filename before packaging.

### Decision 3: Validate release artifacts before publishing manifests
- **Rationale**: `update.json` is a public contract. Missing URLs, signatures, or platform keys create broken update checks.
- **Implication**: Manifest generation must be strict and fail fast.

## Risks / Trade-offs

- **[Risk]**: Packaged GUI startup smoke may be limited on headless Linux or unsigned macOS runners.
  - **Mitigation**: Run practical startup/log checks where available and keep bundle/resource checks mandatory everywhere.
- **[Risk]**: Full local verification may be expensive.
  - **Mitigation**: Use focused tests during debugging, then run the documented fast gate and record any environment limitations.

## Release-Time Cleanup

Only during the final release cut, after the release branch has green CI and the operator intentionally starts release publication:

```bash
git tag -d v0.1.0 v0.1.1 || true
git push origin :refs/tags/v0.1.0 :refs/tags/v0.1.1 || true
gh release delete v0.1.0 --repo DagimAlemayehuu/Ater_Releases --cleanup-tag --yes || true
gh release delete v0.1.1 --repo DagimAlemayehuu/Ater_Releases --cleanup-tag --yes || true
```

Do not delete unrelated branches, non-release tags, or repository history.
