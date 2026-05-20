# Ater Desktop Client

The primary user-facing desktop application for Ater, built with Tauri v2 and React. It follows a professional monochromatic aesthetic (Ater Industrial) and serves as the personal intelligence operations console.

## Architecture & Data Flow

- **Native Rust Core**: Incorporates Tauri v2 native filesystem operations, secure state storage, native ML inference, and a highly efficient local **LanceDB** vector store.
- **Python sidecar**: Utilizes a FastAPI sidecar (`apps/api`) running locally to orchestrate Google Gemini model APIs and sync Notion databases.
- **Cognitive Anchoring (v32.0)**: Employs an Oracle architecture with deep document pre-analysis (`MetaScannerAgent`) for context preservation during RAG operations.

## Hubs

### 1. Dashboard
- **Strategic Overview**: Real-time stats on goals, deadlines, and active study plans.
- **Deep Navigation**: Direct entry points to Notion syncs and local Obsidian vaults.

### 2. Notion Hub
- **Consolidated Tabbed View**: Switch between Academics and Goals directly in-app.
- **Database Synchronization**: Synchronizes tables for courses, study sessions, and milestones.

### 3. Obsidian Hub
- **Intelligence View**:
    - **System Instructions**: Define custom system prompt states for Gemini reasoning models.
    - **Multimodal Chat**: Fully local context chat with support for file attachments and prompt anchoring.
- **Vault Explorer**:
    - **Folder Tree**: Familiar tree-structured navigation mapping direct Obsidian filesystem layout.
    - **Prose Reader**: Single-pane Markdown reader with professional typography and vertical list alignment.

## Technology Stack

- **Shell Framework**: Tauri v2 (Rust)
- **Frontend Stack**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI (Monochrome Industrial Theme)
- **Typography**: Tailwind `prose` (Typography) for native Obsidian Markdown rendering.
- **Icons**: Lucide React

## Development

1. Run `pnpm install` in the monorepo root.
2. Run `pnpm dev` from the root to start the sidecar and Tauri dev environment concurrently.
