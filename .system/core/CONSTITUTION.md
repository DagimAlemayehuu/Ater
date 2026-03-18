**TARGET AGENT:** Autonomous Coding Assistant / Principal Enterprise Architect
**OPERATIONAL DIRECTIVE:** This document is the **Immutable Constitution** governing the Elastic Polyglot Turborepo. All agents must comply with these technical laws to ensure enterprise-grade security, scalability, and offline-first resilience.

---

## 1. THE ELASTICITY PROTOCOL (Tier Constraints)

Projects are strictly bound to their assigned Tier. Do not over-engineer beyond the Tier's boundaries.

*   **TIER 1 (Web MVP / Internal Tool)**
    *   **Triggers:** "Simple CRUD", "Admin Dashboard", "CMS", "Internal Tool", "Prototype".
    *   **Stack:** Next.js 15 (App Router) + Supabase (Direct Client/SSR integration).
    *   **Constraint:** Purely Online. *No Python Backend. No Desktop App.*
*   **TIER 2 (SaaS / High-Compute Platform)**
    *   **Triggers:** "SaaS", "Subscription", "AI Processing", "Image Generation", "Complex Business Logic", "Background Jobs".
    *   **Stack:** Next.js 15 + FastAPI (Python Compute Layer) + Supabase + Redis.
    *   **Constraint:** Online-First. Enforces CQRS (Next.js reads from Supabase; Next.js mutates via FastAPI).
*   **TIER 3 (The Agency Standard / Offline-First)**
    *   **Triggers:** "Point of Sale (POS)", "Field Data Collection", "Warehouse Management", "Kiosk", "Remote Area", "Hardware Integration".
    *   **Stack:** Tauri v2 (Rust) + React 19 + FastAPI + PowerSync.
    *   **Constraint:** Must function 100% without internet. Relies on Local SQLite encrypted via SQLCipher.

---

## 2. THE POLYGLOT STACK & TOPOLOGY MANDATE

*   **Orchestrator:** `turborepo` (v2).
*   **Node/TypeScript:** `pnpm` (Strict Mode). `npm` and `yarn` are FORBIDDEN.
*   **Python:** `uv` (Astral). Standard `pip` and `poetry` are FORBIDDEN.
*   **The Source of Truth (Database):** Alembic (Python). Manual SQL schema changes in the database GUI are FORBIDDEN. Code-First only.
*   **Environment:** All execution must assume a Dockerized DevContainer environment to prevent host-machine contamination.

### 2.1 The Elastic Monorepo Directory Tree
```text
/
├── .system/                              # AI STATE & MEMORY (CRITICAL)
│   ├── architecture/                     # Architecture blueprints
│   ├── core/                             # Constitution & Rules
│   ├── state/                            # STATE.md & MEMEX.md logs
│   ├── prompts/                          # The "Source of Truth" requirement docs
│   └── workflows/                        # Executable Runbooks for the AI agents
├── apps/                                 # ISOLATED DELIVERY MECHANISMS
│   ├── web/                              # Next.js App Router
│   ├── desktop/                          # Tauri + Vite + React (Local Executable)
│   └── api/                              # PYTHON WORKSPACE (FastAPI & background workers)
├── packages/                             # SHARED INTERNAL LIBRARIES
│   ├── ui/                               # Shared React UI components (Shadcn, Tailwind)
│   └── schemas/                          # AUTO-GENERATED Zod schemas (Synced to Pydantic)
├── references/                           # USER ASSETS (Inspirations, Images, Docs)
└── ops/                                  # DEVOPS & INFRASTRUCTURE
```

---

## 3. UI/UX AND STYLING STANDARDS

*   **Framework:** Tailwind CSS (v3/v4).
*   **Component Library:** Shadcn UI.
*   **Icons:** Lucide React.
*   **Prohibition:** Do NOT write custom CSS modules or inline styles unless absolutely necessary for complex animations. Rely strictly on Tailwind utility classes. Ensure dark/light mode compatibility using `dark:` variants.

---

## 4. THE INTERFACE CONTRACT (Pydantic-to-Zod)

You are FORBIDDEN from manually writing TypeScript interfaces for API responses.
1.  **Define:** Define the Python `pydantic` model in `apps/api/src/core/schemas.py`.
2.  **Generate:** Expose via FastAPI `/openapi.json`.
3.  **Sync:** Use `openapi-ts` to automatically generate TypeScript Zod Schemas into `packages/schemas/src/index.ts`.
    *   *Rule:* If the Frontend `packages/schemas` is out of sync with the Backend, the build MUST FAIL.

---

## 5. THE CQRS DATA FLOW & ASYNC RECONCILIATION

### 5.1 The Read Path (Offline vs Online)
*   **Tier 1 & 2 (Online):** Next.js clients query **Supabase Server Directly** via `@supabase/ssr` wrapped in TanStack Query.
*   **Tier 3 (Offline Edge):** Tauri React UI queries **Local SQLite directly**.

### 5.2 The Write Path & Consistency Worker
*   **Online Systems:** Mutations sent to FastAPI. FastAPI validates, executes business logic, and writes to DB.
*   **Offline Systems:** Edge devices write to Local SQLite. PowerSync syncs the Write-Ahead Log (WAL) to the cloud.
*   **The Consistency Worker (CRITICAL):** Because offline writes bypass FastAPI validation, a Database Trigger or CDC stream places an event onto a Redis Queue whenever a synced row arrives. A Python worker picks this up, validates data integrity, and triggers side effects (e.g., sending an email). Invalid data is marked with `sync_error`.

---

## 6. HARDENED INFRASTRUCTURE LAWS

### 6.1 The "Ethiopia Standard" (Network Resilience)
*   **Assumption:** The network is high-latency with frequent packet loss.
*   **Idempotency:** Every `POST`, `PUT`, and `PATCH` request from Frontend to Backend MUST include an `Idempotency-Key` header (UUIDv4). The Backend must verify this key in Redis/Postgres (24h TTL) to prevent double-execution.
*   **The Retry Protocol:** Clients MUST NOT "blindly retry." Implement **Exponential Backoff with Jitter**: `delay = min(cap, base * 2 ** attempt + random_between(0, 100ms))`.

### 6.2 Database & Multi-Tenancy Rules
*   **IDs:** Primary Keys MUST be **UUIDv4** or **ULID**. Auto-incrementing integers are strictly FORBIDDEN to prevent collision during offline CRDT syncs.
*   **Tenancy:** Enforce multi-tenancy at the Application Layer in Python: `.where(Model.tenant_id == current_user.tenant_id)`. Reliance solely on database RLS for backend queries is unsafe.

### 6.3 Hardware-Bound Licensing (Tier 3)
*   Local SQLite databases are encrypted via SQLCipher. The key is **NOT** stored on disk.
*   On launch, the desktop app sends a heartbeat (Hardware ID + JWT) to FastAPI. If valid, FastAPI returns the Decryption Key (held in memory only).

---

## 7. ANTI-HALLUCINATION & SECURITY PROTOCOLS

*   **Test-Driven Development (TDD):** Automated tests (`pytest`, `vitest`) are mandatory and must be written *before* the business logic to ensure architectural resilience.
*   **Read-Before-Write:** You are forbidden from modifying any file without reading its contents first.
*   **No Magic Imports:** Check `package.json` or `pyproject.toml` before assuming a dependency exists.
*   **The 80/20 Security Rule:** Before Handover, verify:
    1. No exposed `.env` variables (e.g., no `NEXT_PUBLIC_STRIPE_SECRET`).
    2. Supabase RLS is active on all tables.
    3. Auth Middleware protects all private routes.
    4. Server-Side validation exists on all API endpoints.
    5. Database migrations (`alembic`) do not destructively drop production columns without human review.
```
