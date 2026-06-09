# ADR-0006: Supabase Hardware DRM Validation

**Date**: 2026-06-08  
**Status**: ACCEPTED  
**Deciders**: Hermes, Antigravity

---

## Context

Ater relies on a commercial subscription model. Standard client-side licensing checks (such as verifying a boolean flag in a config file) are easily bypassed by decompiling the client code, patching store files, or intercepting API calls. The licensing checks must be tamper-resistant and verify that a single user subscription is not shared across dozens of computers.

## Decision

Enforce device licensing at the cloud database level using **Supabase triggers, Row-Level Security (RLS), and cryptographic Edge functions**.
- When a user activates Ater, the host machine's hardware signature (retrieved via `get_machine_id` in Rust) is sent to Supabase.
- A database trigger `trg_check_hardware_blacklist` (`drm_lockout_system.sql`) runs before any profile update. It queries the `hardware_blacklist` table and rejects the operation with error `D0001` if the machine signature is blocked.
- Licensing status is verified by calling a Supabase Edge function (`generate-security-lease`), which generates a cryptographic JSON signature.
- The Tauri client checks this signature locally using a stored public key. If the signature does not match or if the lease has expired, features are disabled.

## Alternatives Considered

**Client-only validation**: Rejected. Standard client-side JS checks are vulnerable to memory patching and source-code editing.

**Custom cloud API backend**: Rejected. Running a dedicated Node/Go backend increases server cost and maintenance overhead. Supabase provides native Postgres, Edge Functions, and database triggers.

## Consequences

**What becomes easier**:
- Tamper resistance: Blacklist enforcement occurs inside the secure Postgres database environment, meaning client-side hacks cannot bypass the hardware ban.
- Real-time updates: Administrative changes (suspending accounts, locking features) are synchronized instantly to the client via Supabase real-time channels.

**What becomes harder**:
- Network dependency for activation: Initial registration and lease renewals require an active internet connection. (Mitigation: Cryptographic leases are cached locally with a 365-day expiration window, allowing offline use between renewals).
