# Ater - Personal Intelligence Operating System

**Tier 3: The Agency Standard (Offline-First)**

Ater is a local-first personal intelligence operating system designed as a high-density, secure, polyglot monorepo. It operates fully without internet connectivity for all core functions, utilizing external networks only when executing authorized AI tasks through the Gemini API. It connects a unified React + Tauri v2 Desktop client, a FastAPI Python sidecar, a remote Next.js Admin dashboard, and a Next.js waitlist landing page around a zero-trust Supabase PostgreSQL security system.

---

## 🏛️ System Architecture & Integrated Data Flow

Ater's components operate in a hub-and-spoke topology centered around two key database nodes: a local SQLite caching/FSRS vector store (`ater.db`) and a remote, secure Supabase PostgreSQL database holding profiles, RLS policies, billing credit functions, and active device clearance locks.

```
                              +----------------------------+
                              |        Landing Page        |
                              |  Registers waitlist profiles|
                              +-------------+--------------+
                                            |
                                            | inserts profile
                                            v
+--------------------------+  auth  +-------+--------------+  locks  +--------------------------+
|  Tauri Desktop Client    +------->|   Supabase Postgres  |<--------+  Admin Dashboard (NextJS) |
| (React + Vite + Rust)    |  read  | Profiles, DRM Locks, |  write  | Approvals, Blacklist,    |
+------------+-------------+        | Blacklist, Credits   |         | Credits, Revocations     |
             |                      +----------------------+         +--------------------------+
             | IPC / HTTP
             v
+------------+-------------+
|    FastAPI Python sidecar|
|  RAG Sync, Notion Synapse|
|  Local ONNX Runtime ML   |
+--------------------------+
```

### End-to-End Operational Lifecycle:
1.  **Registration**: Users signup via the **Landing Page**. The profile is initiated in `public.profiles` in the `pending` state.
2.  **Approval & Clearance**: An administrator uses the **Admin Dashboard** to review waitlist entries. Approving a user flips `is_approved = true`, updates `waitlist_status = 'approved'`, and assigns initial billing credits.
3.  **Client Binding (DRM Lock)**: On first-time activation inside the **Desktop Client**, the app queries the host system's hardware fingerprint via Tauri's native `get_machine_id` command. This signature is bound to `profiles.machine_id` in Supabase. Subsequent connections verify this signature. If the user's hardware signature or its SHA-256 hash exists in `public.hardware_blacklist`, access is blocked at the database level.
4.  **Local Ingestion & Study Loop**:
    *   The user imports a PDF or source text via **Ater Architect** (`academic.tsx`).
    *   The React client initiates parsing by calling the **FastAPI Sidecar** (`apps/api`).
    *   The sidecar processes the text, performs semantic indexing using the **ONNX local runtime**, and queries the Google Generative SDK (Gemini 2.0/3.5) with strict prompt constraints (Sentence Case rules, 4-section pedagogical locks, etc.) to generate structural study-note models.
    *   The generated markdown is saved to the user's local **Obsidian Vault** folder while FSRS telemetry is logged in both the local SQLite database (`ater.db`) and Supabase.

---

## 📦 Deep-Dive: The Sub-Applications

### 1. High-Density Desktop Client (`apps/desktop`)
*   **Technology Stack**: Tauri v2, React 18, Vite, TypeScript, Tailwind CSS, Monaco Editor, Zustand.
*   **Architectural Features**:
    *   **Obsidian Vault Explorer (`routes/obsidian.tsx`)**: Integrates Monaco Editor for clean markdown authoring, coupled with interactive force-graphs representing notes as node links.
    *   **Ater Architect (`routes/academic.tsx`)**: Ingests files through the custom sidebar. Displays real-time progress indicators as the Python sidecar and local vector store parse files.
    *   **Academic Tabs Layout (`academic-tabs/`)**: Organized into `CoursesTab`, `AssignmentsTab`, `ExamsTab`, `StudyPlannerTab`, and `ProgramTab`, rendering a consolidated view of academic schedules.
    *   **Active Recall Engine (`routes/practice.tsx`)**: An advanced practice canvas supporting 13 question modalities (MCQ, True/False, Fill in the Blank, Code Synthesis, Ordering, Matching, Scenario Analysis, Math, etc.). Contains a **Cognitive Lock overlay** (Feynman Challenge) that blocks progression if telemetry logs indicate memory decays (stability decay or retrievability $< 70\%$).
    *   **Security Guard Rails (`PageGuard.tsx` & `App.tsx`)**: Wraps key views (Obsidian, Academic, Practice) to verify dynamic licensing parameters. The `useSecurityStore` hooks intercept local system execution if the profile status returns `Bricked` or `LeaseExpired`.

### 2. Monochrome Landing Page (`apps/landing-page`)
*   **Technology Stack**: Next.js (App Router), React, Tailwind CSS, PostCSS.
*   **Architectural Features**:
    *   **Visual Direction**: Sleek monochrome visuals aligned with the brand identity. High typography density, smooth micro-animations, and minimal decorative framing.
    *   **Waitlist Signup Pipeline**: Contains asynchronous state handlers connecting to Supabase auth/profile insertion endpoints.

### 3. Admin & Licensing Panel (`apps/admin`)
*   **Technology Stack**: Next.js (App Router), React, Tailwind CSS.
*   **Architectural Features**:
    *   **Clearing House Dashboard (`page.tsx`)**: A premium high-density command center allowing administrators to search users, check live waitlist registrations, and view API usage metrics.
    *   **Granular Profile Licensing**: Admin UI to adjust billing credits, toggle feature flags (`locked_features` arrays), clear locked `machine_id` bindings, and trigger the remote kill switch (`revoke_user_access`).
    *   **Hardware Hash Registry**: Direct table to append malicious machine signatures straight to `public.hardware_blacklist` with automated security verification.

### 4. High-Performance Sidecar API (`apps/api`)
*   **Technology Stack**: Python FastAPI, Uvicorn, SQLite, Notion Client (Async), Google GenAI SDK, ONNX Runtime.
*   **Architectural Features**:
    *   **ONNX Local Embeddings**: Built-in ONNX runtime (`export_onnx.py`, `onnx_model/`, `test_onnx.py`) to run ultra-fast, local-first embedding models, enabling fully offline semantic searches and local RAG indexing.
    *   **Ater Ingestion Engine (v33.0)**: Manages file pre-analysis via `MetaScannerAgent` briefings, multi-batch parallel note generation loops regulated by the `TokenGovernor`, and strict cognitive taxonomy locks.
    *   **Sync Interfaces**:
        *   `GET /api/academics/dashboard`: Async connector pulling schedules, goals, and assignments directly from Notion workspace databases.
        *   `GET /api/obsidian/files`: Recursively crawls and indexes the user's local Obsidian Vault files, serving a fast, structured directory tree to the Tauri desktop client.

---

## 🔒 Shared Supabase Database & Security Schema

The shared database contains rigorous constraints to protect user profiles, credit pools, and hardware licenses:

### 1. Hardware Blacklist Verification (`drm_lockout_system.sql`)
Protects features and activation locks using database-level hardware tracking:
*   **Blacklist Check Trigger (`check_hardware_blacklist`)**: Enforces hardware bans before updating `profiles.machine_id`. Validates if the machine ID or its SHA-256 hash is present in the `hardware_blacklist` table:
    ```sql
    IF NEW.machine_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.hardware_blacklist 
        WHERE machine_id_hash = NEW.machine_id 
           OR machine_id_hash = encode(digest(NEW.machine_id, 'sha256'), 'hex')
      )
    ) THEN
      RAISE EXCEPTION 'This device signature has been permanently blacklisted by administration.' USING ERRCODE = 'D0001';
    END IF;
    ```

### 2. Profile State-Transition Verification (`drm_rls_policies.sql`)
Prevents users from bypassing RLS rules via client-side API manipulation:
*   **Zero-Trust Guard (`verify_profile_state_transitions`)**: A trigger running `BEFORE UPDATE ON public.profiles`. Restricts changes to critical fields unless initiated by an authenticated Admin or the Postgres `service_role`:
    ```sql
    IF (NEW.role IS DISTINCT FROM OLD.role OR 
        NEW.is_approved IS DISTINCT FROM OLD.is_approved OR 
        NEW.waitlist_status IS DISTINCT FROM OLD.waitlist_status OR 
        NEW.locked_features IS DISTINCT FROM OLD.locked_features OR
        NEW.credit_balance IS DISTINCT FROM OLD.credit_balance) THEN
      
      IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'Admin'
      ) AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Action restricted: Unauthorized modification of administrative columns.' USING ERRCODE = 'P0001';
      END IF;
    END IF;
    ```

### 3. Credit & Billing System (`credit_billing_system.sql`)
Handles credit deductions atomically using bounds checks:
*   **`deduct_user_credits(target_user_id, target_feature_slug)`**: Maps custom credit costs (e.g., `oracle-chat` = 2 credits, `ater_generation` = 5 credits) and processes mutations with a safety check preventing balances from dropping below 0, while allowing unlimited status for administrative roles (balance $\ge 99999999$).

---

## 🛠️ Tauri IPC Command Reference

The Tauri desktop client interfaces with the native Rust system using specific typed commands. Developers can find these calls implemented inside `apps/desktop/src/lib/sidecarApi.ts`:

*   `read_obsidian_note(path)`: Reads markdown notes from the vault.
*   `update_obsidian_note(path, content)`: Saves modifications.
*   `delete_obsidian_item(path)`: Removes notes or directories.
*   `create_obsidian_file(path, content, overwrite)`: Scaffolds new notes.
*   `get_machine_id()`: Invokes Tauri core native command to extract hardware footprints.
*   `ater_process(payload)`: Initiates background ingestion processes in the sidecar.
*   `list_hubs()`: Scans indices to return the current hub configurations.
*   `generate_practice(hubId, config)`: Triggers practice generators.
*   `srs_review(notePath, rating)`: Saves FSRS ratings and updates stability metrics.
*   `srs_feynman_validate(notePath, explanation)`: Triggers semantic validations to verify Feynman explanations.

---

## 🏛️ Comprehensive Directory Layout

```
/
├── .system/            # Multi-Agent Workflow State, Command Center & Rules
├── .agent/             # Developer Agents, Persona Rules, and Verification scripts
├── apps/
│   ├── desktop/        # Tauri v2 React Desktop application
│   │   ├── src/        # React, Zustand stores, Monaco layouts, custom PageGuards
│   │   └── src-tauri/  # Rust native core workspace & system controllers
│   ├── api/            # Python FastAPI sidecar
│   │   ├── src/        # FastAPI endpoint handlers, RAG pipelines
│   │   └── onnx_model/ # Local embedding weights and model loaders
│   ├── admin/          # Next.js Supabase Admin Panel (Waitlists, DRM panel)
│   └── landing-page/   # Next.js high-contrast monochrome landing page
├── docs/               # System architecture and agent briefings
├── scripts/            # Shared database migrations, seed data, and vault templates
├── package.json        # Monorepo root configuration
├── turbo.json          # Turborepo build pipelines
└── pnpm-workspace.yaml # Monorepo workspace definitions
```

---

## 🔐 Security & Operations Mandate

1.  **API Key Encapsulation**: Local configuration parameters are written to environment files (`.env`). No keys are hardcoded in the frontend.
2.  **Encryption**: Client-side storage uses Tauri's native secure store. Local SQLite databases (`ater.db`) are restricted by local user OS permissions.
3.  **RLS Policies**: Remote database actions utilize row-level security ensuring users can only read or modify their own profiles if `account_status = 'active'`.

---

## 📜 Monorepo Changelog

### 2026-05-28 — Ater v33.0 "LLM Optimization & Spaced Repetition"
*   **2B LLM Engine Optimization**: Tuned local note-generation loops for lightweight offline execution using optimized 2B parameter models.
*   **Spaced-Repetition Sync**: Built bidirectional synchronization of active recall history between Obsidian markdown vault logs and Tauri client store.
*   **Hostile Senior Persona**: Enforced strict pedagogical accuracy and domain locking parameters across the Ater authoring engine.

### 2026-05-20 — Ater v32.0 "Oracle Architecture"
*   **Oracle Context Briefing**: Integrated `MetaScannerAgent` for global-scale document pre-analysis and primary discipline anchoring.
*   **Native Rust Migration**: Completed native ML inference integration and transitioned vector index store to LanceDB within Tauri v2.
*   **Cognitive Anchoring**: Enforced strict domain routing against a canonical LLM-assisted taxonomy to block amnesia and hallucinations.
*   **Singularity Concurrency**: Parallel batch generation loops with high-throughput rate limiting regulated by the `TokenGovernor`.
*   **System Cleanup**: Wiped deprecated codebases, design mockups, and stale configuration cache files to secure a 100% typecheck-passing state.

### 2026-05-12 — Ater v1.0 "Sovereign Brevity"
*   **Evolutionary Rebrand**: Transitioned from Life OS to Ater, focusing on surgical brevity and precision.
*   **Domain Matrix Hardening**: Decoupled domain matrix hierarchies to prevent conceptual drift.
*   **Pedagogical Casing Law**: Enforced Sentence Case across all generated questions.
*   **UI/UX Compaction**: Reduced visual padding and text sizes across core lists for high-density fit.
