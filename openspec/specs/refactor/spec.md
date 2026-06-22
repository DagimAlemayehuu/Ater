# Refactor Spec

## Purpose
This specification defines the codebase refactoring requirements and structural updates for Ater, including compliance with React Hooks rules and streaming static asset files directly from disk.

## Requirements

### Requirement: Rules of Hooks Compliance
The `UnifiedSandboxViewer` component MUST call React hooks (`useMemo`, `useEffect`) at the top level, before any early returns.

#### Scenario: Active simulator changes
- **WHEN** the simulator changes state
- **THEN** React does not throw hook order mismatch errors

### Requirement: Static Asset File Serving
The FastAPI sidecar SHALL serve the PDF.js assets directly from disk.

#### Scenario: PDF viewer requests assets
- **WHEN** the frontend requests `/api/obsidian/assets/pdf.min.js`
- **THEN** the backend streams the raw file from disk instead of base64-decoding it
