# Life OS - Personal Intelligence Operating System

**Tier 3: The Agency Standard (Offline-First)**

## Architecture Overview

Life OS is a local-first desktop application built as a polyglot monorepo following the Autonomous Software Factory template. It operates fully without internet connectivity for all core functions, using the network only when explicitly invoking external APIs (Notion, Google Gemini).

## Multi-Agent Development Workflow

This repository strictly adheres to the `AGENTS.md` protocol. It uses a `.system/` directory to manage agent prompts, system states, and architectural constraints. If you are an AI agent, you **MUST** read `AGENTS.md` and adopt your specific persona before modifying code.

## Key Features

- **Notion Hub**: Consolidated workspace for managing **Academics** and **Goals**.
- **Obsidian Intelligence**: A high-fidelity reasoning engine and vault explorer.
    - **System Instructions**: Custom-tuned AI behavior permanently docked for precise reasoning.
    - **Vault Explorer**: Hierarchical folder navigation with a professional single-pane Markdown reader.
    - **AI File Uploads**: Real-time document analysis (PDF, Code, Text) powered by **Gemini 2.5 Flash**.
    - **OKA (Obsidian Knowledge Architect)**: Fully automated multi-batch academic ingestion. It supports the complete lifecycle from plan generation to unattended deployment of planned notes.

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
