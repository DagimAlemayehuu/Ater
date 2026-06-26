# DECISIONS.md - Architecture Decisions

This file consolidates the accepted architecture decisions for Ater. New durable decisions should be added here or represented in OpenSpec design artifacts when scoped to a change.


---

# ADR-0001: Adoption of OpenSpec-backed SDLC

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity, Codex

---

## Context

The Ater project was previously developed under an informal, iterative workflow where implementation decisions were made at the point of coding with no prior written contract. This caused context loss across sessions, undocumented reversals of architectural decisions, and no clear definition of done beyond test passage. A durable change system is required for multi-agent work.

## Decision

Adopt the OpenSpec-backed SDLC as the mandatory engineering workflow for product changes. The full procedure is codified in `docs/SOP.md`. Key elements:

- `sdlc-plan` creates or updates OpenSpec artifacts only; no implementation code changes.
- `sdlc-orchestrate` implements in isolated, verified phases, using subagents when useful.
- `sdlc-verify` performs automated checks, local preview, one-by-one manual verification, integration, spec sync, archive, and cleanup.
- `docs/CONTEXT.md` controls domain language and invariants.
- `.sdlc/` files hold current workflow state and verification evidence.

## Alternatives Considered

**Continue ad-hoc workflow**: Rejected. Context loss across multi-session, multi-agent development is unacceptable at the current codebase scale.

**Use GitHub Issues as the spec layer**: Rejected. The project is local-first by principle; GitHub Issues require a remote dependency and break the offline-first engineering philosophy that mirrors the product's own design mandate.

**Use legacy `docs/Specs` and `docs/Sprints`**: Rejected. They duplicated OpenSpec and `.sdlc` state, drifted quickly, and created competing sources of truth.

## Consequences

**What becomes easier**:
- Agents can resume from `AGENTS.md`, `docs/CONTEXT.md`, `.sdlc/state.md`, `.sdlc/context-brief.md`, and the active OpenSpec change.
- Architectural decisions are traceable. No more "why was this changed?" questions.
- "Done" has a binary, verifiable definition.

**What becomes harder**:
- Product changes require planning and verification before implementation is considered complete.
- User-facing changes require a local preview and manual checklist before integration.

**Invariants this ADR does not change**:
- `Ater.md` remains at the project root and is not governed by this doc structure.
- The `openspec/` directory and its existing archive are preserved as historical record.


---

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


---

# ADR-0003: Obsidian Vault as Primary Note Database

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity

---

## Context

Most knowledge management tools lock user data inside binary SQLite databases or remote cloud data centers. This restricts portability, prevents integration with external text editors, and violates the privacy concerns of technical students and engineers. Ater requires a storage mechanism that is offline-first, future-proof, and easily readable by other tools.

## Decision

Use a standard local Obsidian Vault (a directory containing structured Markdown files, images, and PDF assets) as the primary database for notes.
- Ater reads and writes notes directly as plain text `.md` files.
- Metadata (such as course associations, stability scores, tags, and unit links) is serialized into the YAML frontmatter block at the top of each note.
- Quizzes are serialized as JSON data and embedded inside a ````interactive-quiz` markdown code block at the bottom of notes.
- Filesystem folders (e.g. `Notes/`, `Inbox/`, `database/`) establish the data model.

## Alternatives Considered

**Relational SQLite DB for note contents**: Rejected. While SQLite provides easy relational querying, it makes it impossible for users to edit their notes in external applications (like Obsidian, VS Code, or Typora) and risks complete data loss if the application database becomes corrupted.

**Central Cloud Document DB (Supabase/Firestore)**: Rejected. Violates the core offline-first invariant.

## Consequences

**What becomes easier**:
- Complete data portability: Users own their notes. If they stop using Ater, their knowledge vault remains fully functional in any Markdown viewer.
- Interoperability: Users can use external Obsidian plugins (e.g., Dataview, force-graphs) alongside Ater.

**What becomes harder**:
- Search efficiency: Querying notes requires scanning file structures recursively. (Mitigation: metadata is cached in a local SQLite index `ater.db` and searched offline via local vector embeddings).
- Concurrency issues: Writes must be atomic to prevent race conditions with Obsidian's internal filesystem indexers. (Mitigation: files are written to a temp file first and swapped atomically via `os.replace`).


---

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


---

# ADR-0005: Tauri v2 Desktop Shell

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity

---

## Context

Ater is designed as a desktop-native interface. Building cross-platform desktop interfaces requires a framework that compiles to macOS, Windows, and Linux. While Electron is the industry default, it packages the entire Chromium rendering engine, leading to excessive resource consumption and security risks. Ater requires native system security, lightweight execution, and clean access to system APIs (machine ID, cryptographic storage).

## Decision

Utilize **Tauri v2** as the desktop application shell.
- The user interface is built using React and compiled to static assets, which Tauri renders using the operating system's native webview (WebKit on macOS, WebView2 on Windows).
- System-level operations (filesystems, child process control, machine signature retrieval, cryptographic vaults) are implemented in Rust in the `src-tauri` workspace.
- The Rust layer exposes commands to the UI using Tauri's IPC message bus (`invoke` calls).

## Alternatives Considered

**Electron**: Rejected. Electron apps consume substantial memory (often >200MB RAM idle) and produce bundle installers exceeding 150MB. Furthermore, writing secure system calls in JavaScript requires complex Node-native modules, whereas Rust provides memory-safe system APIs out of the box.

**Pure Native App (Swift / C#)**: Rejected. Writing separate codebases for macOS and Windows increases development timelines and makes it impossible to share UI components.

## Consequences

**What becomes easier**:
- Performance: Idle RAM consumption remains low (typically under 50-80MB), and startup is nearly instantaneous.
- Security: Rust provides a memory-safe boundary for accessing sensitive APIs. Tauri's Stronghold integration enables secure local credential caching.
- Installer footprint: The compiled app binary is extremely small (excluding sidecar assets).

**What becomes harder**:
- Webview discrepancies: Because Tauri relies on native OS webviews rather than a bundled Chromium instance, CSS styling and Javascript APIs can behave slightly differently between WebKit (macOS) and WebView2 (Windows). (Mitigation: Comprehensive E2E cross-browser testing is enforced).


---

# ADR-0006: Supabase Hardware DRM Validation

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity

---

## Context

Ater relies on a commercial subscription model. Standard client-side licensing checks (such as verifying a boolean flag in a config file) are easily bypassed by decompiling the client code, patching store files, or intercepting API calls. The licensing checks must be tamper-resistant and verify that a single user subscription is not shared across dozens of computers.

## Decision

Enforce device licensing at the cloud database level using **Supabase triggers, Row-Level Security (RLS), and cryptographic Edge functions**.
- When a user activates Ater, the host machine's hardware signature (retrieved via `get_machine_id` in Rust) is sent to Supabase.
- A database trigger `trg_check_hardware_blacklist` (`drm_lockout_system.sql`) runs before any profile update. It queries the `hardware_blacklist` table and rejects the operation with error `D0001` if the machine signature is blocked.
- Licensing status is verified by calling a Supabase Edge function (`generate-security-lease`), which generates a cryptographic JSON signature.
- The Tauri client checks this signature locally using a stored public key. If the signature does not match or if the lease has expired, features are disabled.

## Alternatives Considered

**Client-only validation**: Rejected. Standard client-side JS checks are vulnerable to memory patching and source-code editing.

**Custom cloud API backend**: Rejected. Running a dedicated Node/Go backend increases server cost and maintenance overhead. Supabase provides native Postgres, Edge Functions, and database triggers.

## Consequences

**What becomes easier**:
- Tamper resistance: Blacklist enforcement occurs inside the secure Postgres database environment, meaning client-side hacks cannot bypass the hardware ban.
- Real-time updates: Administrative changes (suspending accounts, locking features) are synchronized instantly to the client via Supabase real-time channels.

**What becomes harder**:
- Network dependency for activation: Initial registration and lease renewals require an active internet connection. (Mitigation: Cryptographic leases are cached locally with a 365-day expiration window, allowing offline use between renewals).

