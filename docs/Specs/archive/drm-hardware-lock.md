---
title: "DRM Hardware Lock"
slug: "drm-hardware-lock"
status: ARCHIVED
author: Antigravity
created: 2026-06-08
signed_off_date: 2026-06-08
---

## Context

To protect intellectual property and prevent credential leakage, Ater enforces seat licensing bounds by tying user accounts to specific physical hardware device profiles.

## Goals

1. Compute a stable, unique device signature hash.
2. Prevent activation for blacklisted device IDs.
3. Cache lease metrics locally to support offline verification.
4. Restrict application features based on license status.

## Non-Goals

1. Wiping user markdown vaults on lease expiration (files are kept intact, only edit access is restricted).

## Actual Behavior

The system boundaries are defined as follows:
- **Device Fingerprint**: The Tauri Rust backend computes a unique signature using the `machine-uid` crate, hashed with SHA-256 in `get_machine_id` (`lib.rs:L165`).
- **Database Blacklist Trigger**: The remote Supabase DB runs trigger `trg_check_hardware_blacklist` (`drm_lockout_system.sql`) when the `machine_id` is updated in `public.profiles`. If the fingerprint matches a blacklisted hash in `public.hardware_blacklist`, the query is aborted with error `D0001`.
- **Cryptographic Leases**: The Zustand security store (`securityStore.ts`) fetches a signed lease payload from the Supabase edge function `generate-security-lease` and passes it to the Tauri command `process_security_heartbeat` (`commands.rs:L212`).
  - In Rust, the signature is verified using the device salt.
  - The lease json is cached in `~/.ater/device.lease`.
  - In offline mode, Rust decrypts and validates the lease expiry directly.
- **Routing Gatekeepers**: `PageGuard.tsx` checks feature states via `isFeatureLocked` (`securityStore.ts:L260`).
  - SUSPENDED/BANNED accounts are marked as `Bricked`, causing a full application lockout.
  - `LeaseExpired` locks server-dependent AI tools and forces Obsidian Explorer and Academics views to read-only mode, blocking file writing.

## Decisions

- **Database-Level Blacklist Enforcement**: Checking machine IDs at the Supabase trigger level ensures security cannot be bypassed by direct API updates.
- **Read-Only Fallback**: Rather than blocking the entire application on license expiration, Ater allows local notes to remain accessible in read-only mode to prevent user data loss.

## Acceptance Criteria

| AC# | Criterion | Mapped Test |
|-----|-----------|-------------|
| AC-1 | Generates a consistent, hashed hardware-level machine signature. | `apps/desktop/src-tauri/src/lib.rs > "get_machine_id"` |
| AC-2 | Rejects profile updates and activations if machine signature is blacklisted. | `drm_lockout_system.sql > "trg_check_hardware_blacklist"` |
| AC-3 | Verifies cryptographic signatures of local lease files to allow offline operation. | `apps/desktop/src-tauri/src/commands.rs > "process_security_heartbeat"` |
| AC-4 | Intercepts UI route rendering if features are restricted by the security store. | `apps/desktop/src/components/PageGuard.tsx > "PageGuard"` |

## Risks & Trade-offs

- **Offline Clock Drift**: Users can modify their system clock to bypass offline lease expiration checks. (Mitigation: Rust checks monotonic timers and logs discrepancies).
