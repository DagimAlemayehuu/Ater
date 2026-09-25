# Collaborator Onboarding Guide

Welcome to the **Ater** engineering team. Follow this guide to set up your local development environment and run the application in under 5 minutes.

---

## 1. Prerequisites

Ensure your system has the following tools installed:

- **Node.js:** `v20.x` or later (LTS recommended)
- **pnpm:** `v9.x` or later (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Git:** Standard CLI with GitHub SSH or HTTPS access
- **Browser:** Chromium-based (Chrome, Brave, Edge) or Firefox with microphone access enabled

---

## 2. Quickstart Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:DagimAlemayehuu/Ater.git
   cd Ater
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```
   *Note: We use `pnpm` exclusively. Do not run `npm install` or `yarn install`, and do not commit `package-lock.json` or `yarn.lock`.*

3. **Configure Environment Variables:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and configure your credentials:
   ```env
   # Gemini API Key (Required for AI pedagogical generation and transcription)
   GEMINI_API_KEY="your-gemini-api-key"

   # Supabase Configuration (Required for Auth & Cloud Sync)
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

   # Application URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Verify Local Setup:**
   Run the test suite to ensure all contracts pass:
   ```bash
   pnpm test
   ```
   Expected output: **All 12 test suites passing, 81/81 tests green.**

5. **Start Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Key Project Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Starts Next.js development server on `http://localhost:3000`. |
| `pnpm test` | Runs the full Vitest suite in single-run mode. |
| `pnpm test:watch` | Runs Vitest in interactive watch mode for TDD. |
| `pnpm build` | Compiles production Next.js build and verifies TypeScript/ESLint. |
| `pnpm start` | Runs the compiled production build locally. |

---

## 4. Architecture Invariants & Rules

1. **Single Next.js Root:** The repository is a unified Next.js 15 App Router project. Do **not** attempt monorepo splits (`website/` vs `app/`) or introduce secondary `package.json` files.
2. **Path Aliases:** Always use `@/*` for root imports (e.g. `@/components/...`, `@/lib/...`, `@/types/...`).
3. **Environment Security:** Never commit `.env.local` or raw API keys to Git.
4. **Tenant Isolation:** Always use the active user's UUID when querying or caching user courses and notes via `lib/sync/store.ts`.

If you run into issues, ask in our official team channel or check [WORKFLOW.md](./WORKFLOW.md).
