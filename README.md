# Life OS - Personal Intelligence Operating System

**Tier 3: The Agency Standard (Offline-First)**

## Architecture Overview

Life OS is a local-first application built as a polyglot monorepo. It operates fully without internet connectivity for all core functions, using the network only when explicitly invoking external AI APIs. It features a unified Desktop experience (Tauri) and a standalone Mobile experience (Scriptable).

## Key Features

- **Agent Workforce Registry**: A centralized hub for specialized autonomous units to monitor and manage every aspect of your life.
- **Obsidian Intelligence**: A high-fidelity reasoning engine and vault explorer.
    - **Local RAG**: ChromaDB-powered indexing for real-time document retrieval (Desktop).
    - **Vault Explorer**: Hierarchical folder navigation with a professional single-pane Markdown reader.
    - **OKA (Obsidian Knowledge Architect)**: Fully automated multi-batch knowledge ingestion.
- **Standalone Mobile OS**: A high-performance iOS client running via **Scriptable**.
    - **Full Parity**: 100% functional alignment with Desktop for Notes, OKA, and Settings.
    - **Universal AI Bridge**: Native iOS support for OpenAI, Anthropic, Gemini, Groq, and OpenRouter.
    - **Offline-First Vault**: Direct local CRUD operations on your mobile Obsidian vault.
- **Monochrome High-Fidelity UI**: A professional, high-contrast aesthetic across all platforms.

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Shell | Tauri v2 (Rust) | Native OS access, filesystem, sidecar management |
| Mobile Shell | Scriptable (iOS) | Native bridge to iOS Filesystem and Request APIs |
| Frontend | React + Vite + TypeScript | UI layer. Monochrome High-Fidelity aesthetic. |
| Backend Sidecar | Python FastAPI | RAG, background automation (Desktop) |
| Native Backend | JavaScript | Standalone local bridge for mobile operations |
| Package Mgr | pnpm, uv | Strict dependency and package management |

## Monorepo Structure

```
/
├── .system/            # Multi-Agent Workflow State & Rules
├── apps/
│   ├── desktop/        # Tauri v2 Desktop application
│   ├── mobile-client/  # React-based iOS frontend
│   └── api/            # Python FastAPI sidecar
├── LifeOs_Mobile.js    # Bundled iOS Scriptable script
├── package.json        # Monorepo root configuration
├── turbo.json          # Build pipelines
└── pnpm-workspace.yaml # Workspace definitions
```

## Security Mandate

- No API keys are hardcoded.
- Desktop: Secrets stored in Tauri's secure store.
- Mobile: Secrets stored in iOS secure filesystem (`lifeos_config.json`).

## Changelog

### 2026-04-22 — Standalone Mobile Overhaul
- **Mobile Feature Parity**: Rebuilt the mobile client to match Desktop's OKA, Notes, and Settings dashboards.
- **Native Config Bridge**: Transitioned mobile settings from localStorage to a resilient iOS filesystem bridge.
- **High-Performance Injection**: Implemented Base64 streaming and URL/Fetch shims to ensure instant boot-up on iOS.
- **Universal AI (Mobile)**: Added Groq and OpenRouter support to the mobile native backend.

### 2026-04-11 — OKA v23.0 "Ironclad Sovereign"
- **Relational Hub Anchoring**: Hardened the ingestion engine with surgical batch deployment and schema normalization.
- **Socratic Mastery**: Finalized the master question bank synthesis pipeline.
