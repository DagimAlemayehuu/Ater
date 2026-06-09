# ARCHITECTURE.md - System boundaries and Data Flows

This document details the architectural boundaries, communications protocols, and data flows of Ater.

---

## 1. System Boundaries and Component Map

Ater is structured as a hybrid local-first architecture. It combines a native Tauri desktop container, a React-based user interface, an offline FastAPI sidecar for local ML and processing, and a remote cloud database for profile and licensing synchronization.

```
+-------------------------------------------------------------+
|                     Ater Desktop App (Client)               |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   |   React UI Context    |     |  Zustand Security     |   |
|   |  (practice, academic) |     |  Store (Memory State) |   |
|   +-----------+-----------+     +-----------+-----------+   |
|               |                             |               |
|               | (IPC Invocation)            |               |
|               v                             v               |
|   +-----------------------------------------------------+   |
|   |                 Tauri Rust Backend                  |   |
|   |  (Stronghold, get_machine_id, port management)      |   |
|   +-----------+-----------------------------+-----------+   |
+---------------|-----------------------------|---------------+
                |                             |
                | (Local HTTP Proxy on Port)  | (Cloud Sync)
                v                             v
+-------------------------------+   +-------------------+
|        FastAPI Sidecar        |   |     Supabase      |
|  (RAG Indexer, srs, agents)   |   |  (Remote DB, RLS, |
|                               |   |  Edge Functions)  |
+---------------+---------------+   +-------------------+
                |
        (Reads / Writes)
                v
+-------------------------------+
|      Local File System        |
|  (Obsidian Vault, ater.db)    |
+-------------------------------+
```

### Components

1. **React UI (Frontend)**: Implements routes (`App.tsx`, `routes/`) and views (Monaco Editor instance, Active Recall practice canvas). UI actions invoke sidecar APIs via the Tauri IPC client interface (`lib/sidecarApi.ts`).
2. **Tauri Rust Core**: The secure system shell. Orchestrates application startup, spawns the FastAPI sidecar process, manages TCP ports dynamically, generates session auth tokens, and provides native dialog and filesystem utilities.
3. **FastAPI Sidecar (Python Backend)**: Spawned by Tauri. Performs heavy local operations including ONNX embedding generation, directory watching (`watcher.py`), FSRS algorithm processing (`srs.py`), and sovereign planning agent loops (`service.py`).
4. **Local SQLite (ater.db)**: Local storage for spaced repetition metadata (stability, difficulty, due dates, reps) and document embeddings.
5. **Obsidian Vault**: Local user directory consisting of plain text Markdown files. Serves as the primary notebook database.
6. **Remote Supabase Instance**: The remote persistence layer. Houses user profile settings, waitlist/approval states, credit ledger tables, and hardware blacklists. Enforces security via Row-Level Security (RLS) policies.

---

## 2. Core Data Flows

### A. Ingestion and Note Generation
1. The user imports a PDF file or submits plain text via Ater Architect (`routes/academic.tsx`).
2. The UI sends a payload containing the file path or text to the Tauri Rust command `ater_process` (`commands.rs:L1519`).
3. The Rust backend checks if the `ater_generation` feature is locked, deducts credits via Supabase RPC `deduct_user_credits` if connected, and proxies the payload to the FastAPI sidecar (`POST /api/ater/process`).
4. In the sidecar, `AterService` (`service.py:L269`) loads the text, calls the `MetaScannerAgent` (`agents.py`) to categorize the domain structure, and executes the Sovereign Planner to segment the source material into conceptual nodes.
5. Notes are generated asynchronously using the Gemini LLM API (governed by the `TokenGovernor` rate-limiter in `governor.py` to prevent quota exhaustion).
6. The sidecar validates note outputs against the 4-section note schema (`validator.py`).
7. Once validated, the notes are compiled and saved directly into the Obsidian Vault under `database/courses/` or similar folders (`commands.rs:L1024`).
8. The note content is parsed and indexed locally into the vector index using local ONNX embeddings (`embeddings_linker.py`).

### B. Spaced Repetition (FSRS) and Feynman Gate
1. The user initiates a review session in the UI (`routes/practice.tsx`).
2. The UI requests due cards by calling `srsDue` in the IPC layer. This proxies a request to `/api/srs/due` in the Python sidecar.
3. The Python sidecar queries the local `ater.db` SQLite table `srs_cards` (`srs.py:L131`) to fetch cards whose `due` timestamp is less than or equal to the current time.
4. When a card is scheduled for a Feynman Challenge (where retrievability has fallen below 70%), the UI presents a writing prompt requiring active recall.
5. The user's explanation is sent via `srsFeynmanValidate` to the sidecar `/api/srs/feynman-validate`.
6. The sidecar parses the target note's ````interactive-quiz` JSON block, extracts the required keywords for the writing task, and runs a case-insensitive keyword evaluation (`srs.py:L151`).
7. If the keywords match, the sidecar marks the card status as "Good" (Rating 3) and runs `fsrs_update` (`srs.py:L40`) to update memory stability and reschedule the card's due date. The updated record is saved in `ater.db`.

### C. DRM and Heartbeat Verification
1. On desktop launch, the Zustand store (`context/securityStore.ts`) calls `initializeSecurity()`.
2. It fetches cached security settings from the Rust backend (`get_security_state` in `commands.rs:L232`) and validates online connectivity.
3. If online, the client retrieves user profile information from Supabase and passes hardware parameters (derived from `machine_uid` in Rust) to the Supabase Edge function `generate-security-lease`.
4. The Edge function returns a cryptographically signed lease payload.
5. The UI sends this payload to the Tauri Rust command `process_security_heartbeat` (`commands.rs:L212`), which validates the signature using the device salt and persists it locally to `~/.ater/device.lease`.
6. If offline or if the signature verification fails, the Rust backend restricts features. `PageGuard.tsx` intercepts route routing and renders a lockout screen or enforces read-only mode depending on which feature slug is locked.

---

## 3. Anti-Corruption Layers (ACL)

To protect the integrity of the local filesystem and database against anomalous LLM generations or external network drops, Ater enforces three Anti-Corruption Layers:

1. **LLM Schema Validator (`validator.py`)**: All structured outputs (such as JSON quizzes or formatted note sections) generated by the Gemini API are intercepted by the sidecar. The sidecar validates the syntax and layout against the strict rules in `Ater.md`. If the validation fails, a repair loop (`healer.py`) is triggered before the note is allowed to be written to the Obsidian Vault.
2. **Atomic Note Compiler (`service.py:L4019`)**: Notes are never written directly from LLM text blocks. Instead, they are parsed into abstract models (frontmatter dictionary + content paragraphs) and rewritten via a standardized compiler to guarantee that frontmatter values (e.g., wikilinks and hubs) conform to Ater's naming conventions.
3. **Cryptographic Signature Gate (`commands.rs:L212`)**: The local DRM state inside Tauri Rust accepts security lease updates only when signed by the administration private key. This prevents client-side manipulation of the Zustand memory store from unlocking features locally.

---

## 4. Technical Dependency Map

### Internal Code Dependencies
- **Tauri command router** (`apps/desktop/src-tauri/src/commands.rs`) depends on the FastAPI Python sidecar port (`SidecarConfig.port`) for proxying AI and SRS features.
- **Python sidecar services** (`apps/api/src/domains/ater/service.py`) depend on the local SQLite DB (`ater.db`) and the active Obsidian Vault path (passed via `X-Vault-Path` HTTP headers).
- **Frontend views** (`apps/desktop/src/routes/`) depend on `PageGuard` and `useSecurityStore` to check permissions before rendering.

### External Dependencies
- **Gemini API (Google)**: Invoked by the sidecar for planning and note generation.
- **Supabase Cloud Service**: Invoked by the desktop client for authentication, billing credit synchronization, and hardware blacklist queries.
- **Local ONNX runtime / embedding models**: Packages within the desktop resources (`apps/api/onnx_model`) for computing local vectors without cloud dependencies.
- **Rust Stronghold**: Used by Tauri to securely store credentials locally.
- **SQLite**: Local persistence library.
