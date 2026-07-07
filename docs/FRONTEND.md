# FRONTEND.md — Ater Client Architecture & UI Rules

This document defines the client-side frameworks, route structure, state management, and visual guidelines for the Ater desktop application.

---

## 1. Core Frameworks
* **Desktop Container:** Tauri v2 (Rust-to-Webview windowing).
* **UI Library:** React (TypeScript, functional components).
* **Build System:** Vite + pnpm workspace.
* **UI Components:** Radix UI primitives (accessible dialogs, select dropdowns) + custom Bento-box panels.
* **Code Editor:** Monaco Editor (packaged for offline use, used for markdown and quiz JSON editing).

---

## 2. Page Routes & Components
All client-side routes reside in `apps/desktop/src/routes/`:
* **`/academic` (Ater Architect):** Ingests PDFs and raw text, showing real-time note generation logs and compiler progress.
* **`/practice` (Active Recall Engine):** The study canvas. Renders quizzes and Feynman writing challenges.
* **`/agents` (Oracle Chat):** Interface for the Socratic tutor and learning agents.
* **`/settings`:** Handles database configuration, Supabase sync status, and local Obsidian Vault pathing.

---

## 3. Client State & Security

### Zustand Security Store (`securityStore.ts`)
The `useSecurityStore` manages the application's DRM and licensing state. It is initialized on app startup and maintains the following state:
- **`status`**: Current lockout status (`Active`, `FeatureLocked`, `Bricked`, `LeaseExpired`).
- **`lockedFeatures`**: Array of feature slugs (e.g., `ai_locked`, `academic_locked`) restricted by administration.
- **`creditBalance`**: Remaining AI generation credits synced from Supabase.
- **`checkOnlineLockout`**: Periodically synchronizes the local lease with Supabase and applies cryptographic signatures via the Tauri Rust layer.

### PageGuard Wrapper (`PageGuard.tsx`)
All protected routes are wrapped in the `PageGuard` component. It enforces access control based on the security store's state:
1. **Absolute Lockout**: If status is `Bricked`, it renders a full-screen `LockoutScreen`.
2. **AI Lockout**: If a feature slug (like `ai-ingestion`) is locked or credits are ≤ 0, it blocks access and offers a "Verify Access" sync button.
3. **Read-Only Mode**: For Academic or Explorer locks, it renders a warning banner at the top but allows the user to view existing data in a non-interactive mode.

### Tauri IPC Bridge (`apps/desktop/src/lib/sidecarApi.ts`)
Houses all RPC calls that invoke Tauri commands in Rust or proxy requests to the FastAPI sidecar (e.g., `srsDue()`, `logPracticeAttempt()`).

---

## 4. Visual Design Rules
For visual consistency, all developers/agents must conform to the token system in **[docs/DESIGN.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/DESIGN.md)**:
* **Anti-Generic Policy:** Never introduce bright, standard SaaS gradients (purple-to-blue) or card-nesting bloat. The UI is a "scientific laboratory console."
* **Industrial Hues:** Use only HSL 240-scale de-warmed grays (`--background: hsl(240, 5%, 7%)`).
* **Typography:** Use the Outfit font globally for all elements (body, buttons, and code blocks). No secondary font families allowed.
* **Spacing:** Strict Bento-box gaps of `12px` (`gap-3` / `p-3`).
