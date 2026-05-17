# Production Remediation Plan: Ater Ecosystem v32.4

This document defines the comprehensive engineering plan to fix all identified blockers, security vulnerabilities, and platform alignment issues across the Ater desktop, admin dashboard, landing page, and CI/CD release pipeline.

---

## 🛠️ Project Definition
*   **Project Type:** WEB (React, Next.js, Vite) + BACKEND (Tauri v2, Rust, Python/FastAPI Sidecar)
*   **Target Architectures:** macOS Silicon (`aarch64`), macOS Intel (`x86_64`), Windows (`x86_64`)
*   **Core Systems:**
    1.  `apps/desktop`: Tauri v2 application interface.
    2.  `apps/admin`: Next.js waitlist and user management dashboard.
    3.  `apps/landing-page`: Next.js web presence and waiting list signup.
    4.  `.github/workflows/release.yml`: Release compilation and artifact generation.

---

## 📋 Phase 1: Core Authentication & Local State Stability

### Task 1.1: Resolve the Onboarding/Login Loop
*   **Problem:** The `activate()` flow in `auth-context.tsx` resets `isProgramConfigured` to `false` unconditionally.
*   **Affected File:** [auth-context.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/context/auth-context.tsx)
*   **Remediation:** Remove hardcoded `isProgramConfigured: false` from `saveConfig` in the `activate()` function. Trust the remote profile state to determine if onboarding needs to be re-run.

### Task 1.2: Unify Machine ID Concepts
*   **Problem:** `ConfigContext.tsx` generates a random UUID for `machineId`, while the DRM activation expects the SHA-256 hash of the hardware ID from Rust (`get_machine_id`).
*   **Affected File:** [ConfigContext.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src/lib/ConfigContext.tsx)
*   **Remediation:** Remove the random UUID generator from `ConfigContext` and synchronize it with the hardware ID obtained via `sidecarApi.getMachineId()`.

---

## 💻 Phase 2: Sidecar & Native Tauri Hardening

### Task 2.1: Upgrade Tauri Dependencies & Plugins
*   **Problem:** `tauri-plugin-stronghold` uses a stale prerelease `2.0.0-rc.0` causing compile issues. `tauri-plugin-process` is missing from `Cargo.toml` but referenced in `package.json`, which makes updater relaunch panic at runtime.
*   **Affected Files:**
    *   [Cargo.toml](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src-tauri/Cargo.toml)
    *   [lib.rs](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src-tauri/src/lib.rs)
*   **Remediation:** Update `tauri-plugin-stronghold` to `"2"`. Add `tauri-plugin-process = "2"`. Register the process plugin inside `lib.rs`.

### Task 2.2: Platform-Safe Logs Export
*   **Problem:** `export_logs` command in Rust calls native `zip` executable, which is missing by default on Windows.
*   **Affected File:** [lib.rs](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/desktop/src-tauri/src/lib.rs)
*   **Remediation:** Implement Windows compatibility using PowerShell `Compress-Archive` or safe conditional compilation fallback.

---

## 🔐 Phase 3: Administrative Security & Dashboard Polish

### Task 3.1: Secure the Admin Dashboard
*   **Problem:** The Next.js Admin app is completely public and uses public client-side Supabase keys for privileged operations.
*   **Affected File:** [supabase.ts](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/admin/src/lib/supabase.ts)
*   **Remediation:** Implement a middleware redirect in `apps/admin` requiring an authorized user with `Admin` role to access any routes.

### Task 3.2: Repair Table Button Visibility CSS
*   **Problem:** Action buttons in waitlist entries are hidden due to a conflicting Tailwind class specification (`hidden group-hover:flex` specificity conflict).
*   **Affected File:** [page.tsx](file:///Users/dabodestroyer/code/Antigravity/Ater/apps/admin/src/app/waitlist/page.tsx)
*   **Remediation:** Replace the `hidden` pattern with class opacity control (`opacity-0 group-hover:opacity-100 transition-opacity`).

---

## 🚀 Phase 4: Release Pipeline & Auto-Updater Verification

### Task 4.1: Add Intel macOS Compilations to Matrix
*   **Problem:** GitHub Actions only builds `macos-14` (aarch64 Silicon), completely excluding older Intel Macs.
*   **Affected File:** [.github/workflows/release.yml](file:///Users/dabodestroyer/code/Antigravity/Ater/.github/workflows/release.yml)
*   **Remediation:** Extend the matrix runner configurations to compile for `macos-13` (x86_64).

### Task 4.2: Repair Auto-Updater Signatures
*   **Problem:** The `generate_update_json.js` utility fails to locate `.sig` files because they are uploaded to the release first and not downloaded to the runner workspace.
*   **Affected Files:**
    *   [release.yml](file:///Users/dabodestroyer/code/Antigravity/Ater/.github/workflows/release.yml)
    *   [generate_update_json.js](file:///Users/dabodestroyer/code/Antigravity/Ater/scripts/generate_update_json.js)
*   **Remediation:** Ensure signature files are properly pulled in CI before update manifest generation.

---

## 🏁 Verification Protocol
1.  Verify the desktop builds with strict typechecks (`pnpm run typecheck`).
2.  Audit RLS policy enforcement on waitlist tables via supabase.
3.  Simulate a local package build to confirm process/stronghold plugin inclusion.
