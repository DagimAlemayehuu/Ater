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

* **`AterService` (`ater/service.py`)**: The main orchestration service. Handles source document parsing, chapter segmentation, and triggers note generation.
* **`SourceLearningJobService` (`ater/source_service.py`)**: Manages the lifecycle of ingestion jobs, including roadmap refinement and background batch generation.
* **`AterQueueManager` (`ater/watcher.py`)**: Background directory watcher that monitors the `Inbox/` folder for new source materials and auto-deploys them if configured.
* **`SRSEngine` (`ater/srs.py`)**: Implements the FSRS spaced-repetition scheduler calculations and the Feynman Gate validation logic.
* **`TokenGovernor` (`ater/governor.py`)**: Regulates parallel API requests to prevent Gemini API quota exhaustion.
* **`ArtifactService` (`ater/artifact_service.py`)**: Generates and manages interactive sandbox components (React/HTML/JS) for Atomic Notes.

---

## 3. Route Mapping Table

| Router | Prefix | Responsibility | Implementation |
|---|---|---|---|
| **Ater** | `/api/ater` | Note generation, queue management, and Obsidian file operations. | `src/api/routers/ater.py` |
| **AI** | `/api/ai` | Assistant chat (SSE), model testing, and rate limit tracking. | `src/api/routers/ai.py` |
| **Obsidian** | `/api/obsidian` | Vault file listing, reading, and static asset serving (PDF.js). | `src/domains/obsidian/router.py` |
| **Academics** | `/api/academics` | Dashboard metrics and semester/course organization. | `src/domains/academics/router.py` |
| **NotebookLM** | `/api/notebooklm` | Legacy interface for Google NotebookLM (Retired). | `src/api/routers/notebooklm.py` |

---

## 4. Local Machine Learning & RAG
* **ONNX Embedding Engine (`ater/embeddings_linker.py`):**
  * Generates vector embeddings for all generated notes using local ONNX model files cached in `apps/api/onnx_model/`.
  * *Invariant:* Cloud-based embedding APIs (OpenAI/Gemini Embeddings) are strictly forbidden to ensure offline-first compliance.
* **Semantic Search:**
  * Uses local SQLite database tables with cosine similarity helpers to search and link related Atomic Notes.

---

## 5. Oracle Agent Tools (`ater/assistant.py`)
* Implements the LangChain assistant that powers the Ater Oracle chat interface.
* Uses `StreamingManager` to orchestrate turns, tool calls, and memory extraction.
* *Note:* All NotebookLM-related tools have been retired in v0.2.0.
* Prompt directives and guidelines are stored in `templates.py`.

---

## 6. Persistent Chat Runtime (`ater/chat_runtime/`)
* **`ChatStorage` (`store.py`):**
  * Manages the SQLite database schemas for conversations, messages, branches, attachments, memories, stream runs, and tool call logs.
* **`ContextPacker` (`context.py`):**
  * Assembles system prompt, memories, historical messages, and attached source chunks under a strict token budget.
* **`MemoryManager` (`memory.py`):**
  * Extracts preferences, facts, and settings from assistant turns and manages durable/session memory records.
* **`AttachmentManager` (`attachments.py`):**
  * Handles PDF robust extraction, Markdown paragraph chunking, Obsidian note resolution, and ingestion promotion to source-grounded planner.
* **`StreamingManager` (`streaming.py`):**
  * Orchestrates turn-based SSE stream generation, cancellation checks, message regeneration, branching edit paths, and audits tool calls with automatic sensitive argument redaction.

---

## 7. Binary Distribution (PyInstaller)

In production release builds, the FastAPI sidecar is bundled into a single executable (`ater-api`) using PyInstaller. This ensures the Python environment is self-contained.

### Build Configuration (`ater-api.spec`)
- **Hidden Imports**: Explicitly includes `uvicorn`, `fastapi`, `pydantic`, `langchain`, `pypdf`, and `httpx` to ensure the frozen binary can resolve all dynamic dependencies.
- **Data Collection**: Bundles LangChain YAML templates, ONNX model files, and static PDF.js assets into the `_MEIPASS` runtime directory.
- **Exclusions**: Heavy ML packages like `torch`, `tensorflow`, and `sklearn` are explicitly excluded to keep the binary size under 300MB.
- **Entry Point**: The `ater-api.py` wrapper handles UTF-8 reconfiguration and initializes the `ServerLifespanManager` before starting the Uvicorn server.
