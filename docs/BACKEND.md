# BACKEND.md — Ater Sidecar & ML Architecture

This document defines the backend services, Python structures, and local machine learning execution pathways for the Ater sidecar application.

---

## 1. Core Frameworks
* **Language Runtime:** Python 3.11+ managed via `uv` or virtualenv.
* **Server Framework:** FastAPI (located in `apps/api/`).
* **Agent Engine:** LangChain (Structured Tools and Agent Executors).
* **Local Embeddings:** ONNX Runtime (CPU-bound, offline execution).

---

## 2. Service Architecture
All API services reside in `apps/api/src/domains/`:
* **`AterService` (`ater/service.py`):**
  * The main orchestration service. Handles source document parsing, chapter segmentation, and triggers note generation.
* **`Obsidian Watcher` (`ater/watcher.py`):**
  * Background directory watcher that monitors your Obsidian Vault for manual edits, syncing file changes back to `ater.db` vector tables.
* **`SRS Engine` (`ater/srs.py`):**
  * Implements the FSRS spaced-repetition scheduler calculations (calculates card stability, difficulty, retrievability, and schedules due dates).
* **`Token Governor` (`ater/governor.py`):**
  * Restricts parallel API requests to prevent Gemini API quota rate limits.

---

## 3. Local Machine Learning & RAG
* **ONNX Embedding Engine (`ater/embeddings_linker.py`):**
  * Generates vector embeddings for all generated notes using local ONNX model files cached in `apps/api/onnx_model/`.
  * *Invariant:* Cloud-based embedding APIs (OpenAI/Gemini Embeddings) are strictly forbidden to ensure offline-first compliance.
* **Semantic Search:**
  * Uses local SQLite database tables with cosine similarity helpers to search and link related Atomic Notes.

---

## 4. Oracle Agent Tools (`ater/assistant.py`)
* Implements the LangChain assistant that powers the Ater Oracle chat interface.
* Exposes Structured Tools that wrap CLI capabilities:
  * `notebooklm_query`: Executes search queries on imported Google notebooks.
  * `notebooklm_research`: Compiles research dossiers from notebook sources.
  * `notebooklm_studio_create`: Triggers studio asset generation.
* Prompt directives and guidelines are stored in `templates.py`.
