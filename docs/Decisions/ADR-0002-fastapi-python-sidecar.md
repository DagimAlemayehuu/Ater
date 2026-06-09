# ADR-0002: FastAPI Python Sidecar

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity

---

## Context

Ater requires complex text-processing workflows, AST note validations, filesystem watchdog events, and local machine learning models (ONNX embeddings). Implementing these in pure JavaScript (client-side) or native Rust (Tauri command layer) introduces massive development friction due to the scarcity of mature local NLP libraries, vector search engines, and frontmatter compiler crates compared to the Python ecosystem.

## Decision

Run a local FastAPI Python sidecar process alongside the Tauri application.
- The sidecar is packaged as a compiled binary (`ater-api`) using Nuitka/PyInstaller and placed in `apps/desktop/src-tauri/binaries/`.
- Tauri spawns the process on startup (`lib.rs:L389`) using a dynamically allocated port (starting at 8765) and a cryptographically random access token (`ATER_SIDECAR_TOKEN`) passed in HTTP headers (`X-Ater-Token`) to prevent local port hijacking.
- Tauri proxies complex AI, RAG, and spaced repetition commands to this localhost service, while handling simple file operations and user interface events natively.

## Alternatives Considered

**Implement entirely in Rust**: Rejected. Writing custom AST parser validators, FSRS math schedules, and ONNX tokenizers in Rust is slow to develop and inspect compared to Python's robust AI/NLP tooling.

**Route via a cloud API server**: Rejected. This violates the offline-first core invariant. The core engine must be executable offline.

## Consequences

**What becomes easier**:
- Easy integration of libraries such as `watchdog`, `python-frontmatter`, and `google-genai`.
- Rapid prototyping of AI processing logic.

**What becomes harder**:
- Spawn process management: Tauri must handle sidecar lifecycle, kill zombie instances on port conflicts, and actively drain stdout/stderr pipes to prevent OS buffer overflows.
- Packaging overhead: The application bundle size increases since the sidecar binary must package a Python interpreter footprint.
