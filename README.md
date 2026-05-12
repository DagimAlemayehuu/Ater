# Ater - Personal Intelligence Operating System

**Tier 3: The Agency Standard (Offline-First)**

## Architecture Overview

Ater is a local-first application built as a polyglot monorepo. It operates fully without internet connectivity for all core functions, using the network only when explicitly invoking external AI APIs. It features a unified Desktop experience (Tauri) and a standalone Mobile experience (Scriptable).

## Key Features

- **Agent Workforce Registry**: A centralized hub for specialized autonomous units to monitor and manage every aspect of your life.
- **Obsidian Intelligence**: A high-fidelity reasoning engine and vault explorer.
    - **Local RAG**: ChromaDB-powered indexing for real-time document retrieval (Desktop).
    - **Vault Explorer**: Hierarchical folder navigation with a professional single-pane Markdown reader.
    - **Ater Architect**: Fully automated multi-batch knowledge ingestion.
- **Standalone Mobile OS**: A high-performance iOS client running via **Scriptable**.
    - **Full Parity**: 100% functional alignment with Desktop for Notes, Ater, and Settings.
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
├── Ater_Mobile.js      # Bundled iOS Scriptable script
├── package.json        # Monorepo root configuration
├── turbo.json          # Build pipelines
└── pnpm-workspace.yaml # Workspace definitions
```

## Security Mandate

- No API keys are hardcoded.
- Desktop: Secrets stored in Tauri's secure store.
- Mobile: Secrets stored in iOS secure filesystem (`ater_config.json`).

## Changelog

### 2026-05-12 — Ater v1.0 "Sovereign Brevity"
- **Evolutionary Rebrand**: Transitioned from Ater to Ater, focusing on surgical brevity and precision.
- **Domain Matrix Hardening**: Fully decoupled `ECON-MICRO` from `ECON-MACRO` with domain-specific agent protocols to prevent conceptual drift.
- **Pedagogical Casing Law**: Enforced Sentence Case across all generated questions and options to ensure professional, non-aggressive UI content.
- **Stateful Entropy**: Implemented batch-level topic hinting in `QuestionAgent` to guarantee 100% semantic diversity within practice sets.
- **UI/UX Compaction**: Optimized `MiniPracticeUI.tsx` with reduced text sizes and inline MCQ option layouts for high-density screen fit.
- **Graph Synchronization**: Updated the knowledge graph with `graphify` to reflect latest structural improvements.

### 2026-04-23 — UI/UX & Markdown High-Fidelity Overhaul
- **Hardened Markdown Engine**: Implemented robust AST-based code block detection with blended UI, language tags, and "ghost" copy buttons.
- **Topologies Navigation**: Overhauled the Connections sidebar with nested collapsible tree structures, depth-aware auto-expansion, and indentation guides.
- **Dynamic WikiLink Normalization**: Implemented global path/underscore stripping for WikiLink labels to ensure a clean, "Obsidian-native" reading experience.
- **Connection List Repair**: Added automatic detection and nesting repair for collapsed connection lists in Hub notes.

### 2026-04-22 — Standalone Mobile Overhaul
- **Mobile Feature Parity**: Rebuilt the mobile client to match Desktop's Ater, Notes, and Settings dashboards.
- **Native Config Bridge**: Transitioned mobile settings from localStorage to a resilient iOS filesystem bridge.
- **High-Performance Injection**: Implemented Base64 streaming and URL/Fetch shims to ensure instant boot-up on iOS.
- **Universal AI (Mobile)**: Added Groq and OpenRouter support to the mobile native backend.

### 2026-04-11 — Ater v23.0 "Ironclad Sovereign"
- **Relational Hub Anchoring**: Hardened the ingestion engine with surgical batch deployment and schema normalization.
- **Socratic Mastery**: Finalized the master question bank synthesis pipeline.
