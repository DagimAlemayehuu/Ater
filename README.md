# Life OS - Personal Intelligence Operating System

**Tier 3: The Agency Standard (Offline-First)**

## Architecture Overview

Life OS is a local-first desktop application built as a polyglot monorepo following the Autonomous Software Factory template. It operates fully without internet connectivity for all core functions, using the network only when explicitly invoking external APIs (Notion, Google Gemini).

## Multi-Agent Development Workflow

This repository strictly adheres to the `AGENTS.md` protocol. It uses a `.system/` directory to manage agent prompts, system states, and architectural constraints. If you are an AI agent, you **MUST** read `AGENTS.md` and adopt your specific persona before modifying code.

## Key Features

- **Agent Workforce Registry**: A centralized hub for specialized autonomous units (Chronos, Scholar, Wealth Strategist, Gym Coach, Scribe, Librarian, DevOps) to monitor and manage every aspect of your life.
- **Orchestrator Control**: The **Zap-powered** master planner that coordinates all specialized agents and executes complex strategic workflows.
- **Notion Hub**: Consolidated workspace for managing **Academics** and **Goals**.
- **Obsidian Intelligence**: A high-fidelity reasoning engine and vault explorer with a local **RAG (Retrieval-Augmented Generation)** pipeline.
    - **Local RAG**: ChromaDB-powered indexing for real-time document retrieval and context-aware chatting.
    - **Vault Explorer**: Hierarchical folder navigation with a professional single-pane Markdown reader.
    - **AI File Uploads**: Real-time document analysis (PDF, Code, Text) powered by **Gemini 2.5 Flash**.
    - **OKA (Obsidian Knowledge Architect)**: Fully automated multi-batch academic ingestion.
- **Notion Mirror (V2)**: Modernized, numbered, and hierarchical mirroring of Notion databases into Obsidian (1-NotionMirror, 2-Academic).
- **Full Autonomous Agent Permissions**: Specialized AI units have programmatic read, write, edit, and delete access to local Obsidian vaults and cloud-based Notion databases via an integrated backend toolset.

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Shell | Tauri v2 (Rust) | Native OS access, filesystem, secure store, sidecar management |
| Frontend | React + Vite + TypeScript | UI layer. Shadcn-admin aesthetic. |
| Backend Sidecar | Python FastAPI | AI logic, Gemini 2.5 Flash, Notion API calls |
| Orchestration | Turborepo v2 | Build pipelines, caching, dependency graph |
| Package Mgr | pnpm (Node), uv (Python) | Strict dependency management |

## Monorepo Structure

```
/
├── .system/            # Multi-Agent Workflow State & Rules (DO NOT IGNORE)
│   ├── agents/         # Role-specific instructions
│   ├── architecture/   # System design constraints
│   ├── state/          # Global task & error registry
│   └── prompts/        # System and AI persona prompt masterplans
├── apps/
│   ├── desktop/        # Tauri v2 + React/Vite frontend application
│   ├── api/            # Python FastAPI sidecar
│   └── e2e-tests/      # Playwright end-to-end tests
├── packages/
│   ├── config-eslint/  # Shared ESLint configuration
│   ├── config-typescript/# Shared tsconfig base
│   └── schemas/        # API-first contracts and types
├── AGENTS.md           # Supreme Law for Autonomous Development
├── turbo.json          # Turborepo pipeline configuration
└── pnpm-workspace.yaml # pnpm workspace definition
```

## Security Mandate

- No API keys are hardcoded. Ever.
- All secrets are stored in Tauri's secure local store, fetched by the frontend and passed per-request to the Python sidecar.

## Changelog

### 2026-03-23 — System Decoupling & Unified Chronos
- **Obsidian Vault Explorer Decoupled**: The primary Obsidian workspace is now a dedicated, professional side-by-side Markdown file explorer, fully separated from AI ingestion tasks.
- **Dedicated OKA Agent Hub**: The Obsidian Knowledge Architect (OKA) now resides securely within the Agent Registry, acting as a focused workspace for autonomous ingestion and multi-batch deployment.
- **Chronos Unified Timeline**: The Chronos Agent now autonomously aggregates events from all accessible Notion databases and merges them with Google Calendar for a consolidated, life-wide timeline.
- **UI/UX Polished**: Standardized professional aesthetic (eliminated aggressive sci-fi themes), fixed native directory picking for academic folder selection, and improved overall layout constraints.

### 2026-03-21 — Agent Autonomy & UI Refactor
- **Agent Console**: Every specialist dashboard now includes a direct execution interface — type a natural language directive and the agent executes it autonomously.
- **Full Agent Permissions**: All agents (Librarian, Scribe, Chronos, Scholar, Wealth, Gym, DevOps) have unrestricted read/write/edit/delete access to their data domains via `/api/ai/execute/{agent_name}`.
- **Orchestrator Hardened**: Always plans before delegating. Logs reflected in real-time in Mission Control.
- **Chat UI Fixed**: Scrollable message pane, removed double dark-mode toggles and non-functional sidebar toggle.
- **Mission Control Live**: Stage label and last log line updated dynamically during execution.
- **RAG System**: `remove_file` and `clear_all` methods added to `VaultIndexer` for full lifecycle management.
- **Shell Cleaned**: Sidebar navigation has no numeric prefixes. Redundant header toggles removed.
