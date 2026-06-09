# System Overview: Ater Project Structure & Rationale

This document serves as the primary entry point for understanding the structural composition and technical foundations of Ater. It synthesizes the individual ADRs and architecture docs into a single comprehensive map.

## 1. Core Essence
Ater is an offline-first personal intelligence operating system. It is designed to move the user from passive content consumption to active cognitive mastery via a high-density, secure, and polyglot architecture.

## 2. High-Level Technical Stack

| Layer | Technology | Role | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite + Tailwind | UI/UX | High-density layout, fast iteration, and type-safety via TypeScript. |
| **Shell** | Tauri v2 (Rust) | Native Bridge | Minimal memory footprint, Rust-level system security, and native OS integration. (See ADR-0005) |
| **Sidecar** | Python FastAPI | Intelligence Engine | Access to ML libraries, RAG pipelines, and local file watchdogs. (See ADR-0002) |
| **Local DB** | SQLite / LanceDB | Fast Cache/Vector | Offline-first persistence and ultra-fast semantic search. (See ADR-0003) |
| **Cloud DB** | Supabase (Postgres) | Identity & DRM | Zero-trust security, hardware blacklisting, and user profile management. (See ADR-0006) |
| **Intelligence** | ONNX + Gemini API | Hybrid LLM | Local embeddings for privacy/speed; Gemini for high-reasoning generation. (See ADR-0004) |

## 3. Project Directory Map

```
/
├── apps/
│   ├── desktop/        # Tauri + React client. The user interface and native system bridge.
│   │   └── src-tauri/  # Rust core. Handles IPC, Licensing, and Sidecar management.
│   ├── api/            # FastAPI Sidecar. The 'Brain' handling RAG, FSRS, and File I/O.
│   │   └── src/domains/ # Domain-driven design (Obsidian, Academics, AI, Ater).
│   ├── admin/          # Next.js Admin Panel. For waitlist and DRM management.
│   └── landing-page/   # Next.js Landing Page. Public-facing acquisition.
├── docs/
│   ├── Architecture/   # System blueprints (PRODUCT, DESIGN, ARCHITECTURE).
│   ├── Decisions/      # ADRs (The 'Why' behind the technical choices).
│   ├── Specs/          # The contracts (Active vs. Archived).
│   └── Sprints/        # Operational logs (active.md, micro-log.md).
├── scripts/            # SQL migrations and seed data for Supabase and Local DB.
└── .agent/             # Persona rules and verification scripts for AI agents.
```

## 4. The "Why": Core Architectural Rationale

- **Why a Sidecar?**: JavaScript is insufficient for heavy ML tasks and file system watchdogs. Python FastAPI allows Ater to use the full Python AI ecosystem without compromising the lightweight nature of the Tauri shell.
- **Why Obsidian?**: By using a folder of markdown files as the primary database, Ater ensures the user has total ownership of their data (Sovereignty). If Ater disappears, the notes remain usable in any markdown editor.
- **Why local ONNX?**: Cloud embeddings are slow, expensive, and a privacy risk. Local ONNX runtimes allow for instant, private semantic search.
- **Why Tauri v2?**: Electron is too resource-heavy. Tauri provides a secure Rust-based bridge that consumes a fraction of the RAM.

## 5. Operational Workflow (The SDD Mandate)
This project follows Spec-Driven Development (SDD) v1.0. 
- **No code changes without a signed-off spec** for any structural or feature modification.
- **Truth Chain**: Research $ightarrow$ Decision $ightarrow$ Spec $ightarrow$ Code.
- **Constraint**: All documentation must be monochrome (zero emojis) to maintain professional engineering standards.