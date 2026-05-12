# Ater Desktop (Admin UI)

The frontend application for Ater, built with Tauri v2 and React. It follows a professional monochromatic aesthetic and serves as the primary interface for personal intelligence.

## Hubs

### 1. Dashboard
- **Strategic Overview**: Real-time stats on goals, deadlines, and active courses.
- **Deep Navigation**: Quick links to the Notion and Obsidian workspaces.

### 2. Notion Hub
- **Consolidated Tabbed View**: Switch between **Academics** and **Goals** without leaving the page.
- **Database Synchronization**: Integrated tables for managing courses, study plans, and personal milestones.

### 3. Obsidian Hub
- **Intelligence View**:
    - **System Instructions**: Left-docked editor to define exactly how Gemini should reason.
    - **Multimodal Chat**: Chat with Gemini using your instructions and uploaded file context.
- **Vault Explorer**:
    - **Folder Tree**: Browse your Obsidian vault with a familiar hierarchical file tree.
    - **Prose Reader**: Single-pane Markdown reader with professional typography and independent scroll zones.

## Stack

- **Framework**: Tauri v2 + React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Typography**: Tailwind `prose` (Typography) plugin for high-fidelity Markdown rendering.
- **Icons**: Lucide React

## Development

1. Run `pnpm install`.
2. Run `pnpm dev` from the root to start both the desktop UI and the sidecar.
