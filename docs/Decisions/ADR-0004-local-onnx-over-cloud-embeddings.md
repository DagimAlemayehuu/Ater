# ADR-0004: Local ONNX embedding Engine

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity

---

## Context

Ater relies on Retrieval-Augmented Generation (RAG) to perform semantic search, find note relationships, and inject relevant context into AI explainers. To generate semantic vectors, text must be processed by an embedding model. Conventional approaches use cloud-based APIs (such as OpenAI Embeddings or Cohere). However, sending local notes to remote servers for every search or file update compromises user privacy and breaks offline functionality.

## Decision

Enforce local-only embedding generation using the **ONNX Runtime** and a local text embedding model.
- The model weights and tokenizer configurations are packaged directly in the application resources (`apps/api/onnx_model/`).
- The Python sidecar (`apps/api/src/domains/ater/embeddings_linker.py`) loads the model locally on startup.
- Vector indices are stored in the local SQLite database (`ater.db`) for instant retrieval.
- Cloud-based embedding APIs are strictly forbidden.

## Alternatives Considered

**Cloud Embedding APIs (OpenAI/Gemini)**: Rejected. This violates the offline-first core invariant, creates API cost overheads, and exposes private note content to third-party providers.

**Pure-Javascript local embeddings**: Rejected. Running tokenizers and tensor operations in standard JS threads inside the webview is slow and blocks the UI thread. Moving it to the Python sidecar utilizing the ONNX runtime ensures native, hardware-accelerated thread processing.

## Consequences

**What becomes easier**:
- Zero ongoing cost: Users can run semantic searches and RAG queries indefinitely without paying for API calls.
- Hard offline capability: Notes can be scanned, indexed, and queried without an internet connection.
- Maximum privacy: Note text never leaves the user's physical machine for vectorization.

**What becomes harder**:
- Application bundle footprint: Shipping the ONNX model files adds approximately 50-100MB to the installer package.
- First-run compilation: Initial database setup compiles and indexes the model, which can cause CPU spikes for a few seconds.
