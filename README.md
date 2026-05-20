# Ater - Personal Intelligence Operating System

**Tier 3: The Agency Standard (Offline-First)**

## Architecture Overview

Ater is a local-first application built as a polyglot monorepo. It operates fully without internet connectivity for all core functions, using the network only when explicitly invoking external AI APIs. It features a unified Desktop client (Tauri v2) backed by a Python FastAPI sidecar and native Rust ML infrastructure (including a local LanceDB vector store).

## Key Features

- **Agent Workforce Registry**: A centralized hub for specialized autonomous units to monitor and manage every aspect of your life.
- **Obsidian Intelligence**: A high-fidelity reasoning engine and vault explorer.
    - **Local RAG & ML**: Native Rust Tauri backend migration with 100% native ML inference and LanceDB vector store.
    - **Vault Explorer**: Hierarchical folder navigation with a professional single-pane Markdown reader.
    - **Ater Architect**: Fully automated multi-batch knowledge ingestion (Oracle v32.0).
- **Oracle Context Briefing**: Pre-processing via `MetaScannerAgent` for global document briefing and keyword extraction to eliminate context amnesia.
- **Monochrome High-Fidelity UI**: A professional, high-contrast aesthetic across all modules.

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Client | Tauri v2 (Rust) | Native OS access, secure key storage, local LanceDB vector store, native ML inference |
| Sidecar API | Python FastAPI | Local RAG processing, heavy-duty Notion integrations, background automations |
| Admin Dashboard | Next.js (App Router) | High-fidelity waitlist, hardware activation lock, and user approvals interface |
| Landing Page | Next.js | Modern, monochrome marketing page and waitlist registration |
| Frontend | React + Vite + TypeScript | High-density desktop frontend application |
| Package Mgr | pnpm, uv | Strict monorepo workspace and dependency management |

## Monorepo Structure

```
/
├── .system/            # Multi-Agent Workflow State, Command Center & Rules
├── .agent/             # Developer Agents, Persona Rules, and Verification scripts
├── apps/
│   ├── desktop/        # Tauri v2 React Desktop application
│   ├── api/            # Python FastAPI sidecar
│   ├── admin/          # Next.js Supabase Admin Panel
│   └── landing-page/   # Next.js high-contrast landing page
├── scripts/            # Shared database and vault templates generation utilities
├── package.json        # Monorepo root configuration
├── turbo.json          # Turborepo build pipelines
└── pnpm-workspace.yaml # Monorepo workspace definitions
```

## Security Mandate

- No API keys are hardcoded.
- Secrets are stored in Tauri's native secure store or remote Supabase backend.
- Database access and hardware bindings are protected by Row Level Security (RLS).

## Changelog

### 2026-05-20 — Ater v32.0 "Oracle Architecture"
- **Oracle Context Briefing**: Integrated `MetaScannerAgent` for global-scale document pre-analysis and primary discipline anchoring.
- **Native Rust Migration**: Completed native ML inference integration and transitioned vector index store to LanceDB within Tauri v2.
- **Cognitive Anchoring**: Enforced strict domain routing against a canonical LLM-assisted taxonomy to block amnesia and halluncinations.
- **Singularity Concurrency**: Parallel batch generation loops with high-throughput rate limiting regulated by the `TokenGovernor`.
- **System Cleanup**: Wiped deprecated codebases, design mockups, and stale configuration cache files to secure a 100% typecheck-passing state.

### 2026-05-12 — Ater v1.0 "Sovereign Brevity"
- **Evolutionary Rebrand**: Transitioned from Life OS to Ater, focusing on surgical brevity and precision.
- **Domain Matrix Hardening**: Decoupled domain matrix hierarchies to prevent conceptual drift.
- **Pedagogical Casing Law**: Enforced Sentence Case across all generated questions.
- **UI/UX Compaction**: Reduced visual padding and text sizes across core lists for high-density fit.
