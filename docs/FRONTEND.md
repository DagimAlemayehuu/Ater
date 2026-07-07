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
* **`/agents` (Ater Chat / Oracle):** The primary conversational interface. Houses the Ater Oracle agent for contextual RAG and active learning support.
* **`/academic` (Ater Architect):** Core ingestion pipeline. Processes PDFs and raw text into atomic markdown notes within the vault.
* **`/practice` (Active Recall Engine):** Spaced-repetition study canvas. Renders adaptive quizzes and Feynman writing challenges.
* **`/obsidian` (Vault):** Local file explorer and markdown editor for the user's Obsidian-compatible knowledge base.
* **`/calendar`:** Visual timeline of study sessions, upcoming exams, and academic milestones.
* **`/settings`:** Manages API keys, local vault pathing, Pomodoro durations, and system diagnostics.
* **`/onboarding`:** Initialization sequence for first-time setup and hardware binding.

---

## 3. Client State & Integrations
* **Global State (Zustand):**
  * `context/securityStore.ts`: Manages device authorization, lease signatures, and DRM check statuses.
* **Tauri IPC Bridge (`apps/desktop/src/lib/sidecarApi.ts`):**
  * Houses all RPC calls that invoke Tauri commands in Rust or proxy requests to the FastAPI sidecar (e.g., `srsDue()`, `logPracticeAttempt()`).
* **Route Protection (`components/PageGuard.tsx`):**
  * Intercepts route rendering. If the security store reports unauthorized or blacklisted status, it redirects to a lockout interface.

---

## 4. Visual Design Rules
For visual consistency, all developers/agents must conform to the token system in **[docs/DESIGN.md](file:///Users/dabodestroyer/code/Antigravity/Ater/docs/DESIGN.md)**:
* **Anti-Generic Policy:** Never introduce bright, standard SaaS gradients (purple-to-blue) or card-nesting bloat. The UI is a "scientific laboratory console."
* **Industrial Hues:** Use only HSL 240-scale de-warmed grays (`--background: hsl(240, 5%, 7%)`).
* **Typography:** Use the Outfit font globally for all elements (body, buttons, and code blocks). No secondary font families allowed.
* **Spacing:** Strict Bento-box gaps of `12px` (`gap-3` / `p-3`).
