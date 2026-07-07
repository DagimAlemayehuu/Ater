# Security Audit: Supabase RLS & DRM System

**Date:** 2025-05-15
**Status:** Complete
**Scope:** Supabase RLS Policies, Database Triggers, Client Security Store, and Rust DRM enforcement.

---

## 1. RLS Policy Coverage

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Risk Level |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `public.profiles` | YES | Owner (Active) | Restricted | Owner (Active) | Admin Only | LOW |
| `public.waiting_list` | YES | Owner (Email) | Anyone | Admin Only | Admin Only | LOW |
| `public.hardware_blacklist` | YES | Admin Only | Admin Only | Admin Only | Admin Only | LOW |
| `public.system_config` | YES | Authenticated | Admin Only | Admin Only | Admin Only | LOW |
| `public.credit_ledger` | YES | Owner | Admin Only | Admin Only | Admin Only | LOW |

### Findings:
- **`public.profiles`**: RLS is strictly enforced. SELECT and UPDATE are restricted to the owner where `account_status = 'active'`. Admins have full access via the `is_admin()` helper.
- **`public.waiting_list`**: Allows anyone to INSERT (to join the waitlist). SELECT is restricted to users matching their JWT email.
- **`public.hardware_blacklist`**: No `anon` or `authenticated` access except for Admins. This is critical as it prevents attackers from probing the blacklist.
- **`public.system_config` / `public.credit_ledger`**: Properly restricted to authenticated users (read-only for config) or owners (ledger).

---

## 2. Profile State Mutation Check

Verification of protection for administrative fields in `public.profiles`.

| Field | Status | Explanation |
| :--- | :---: | :--- |
| `is_approved` | **SAFE** | Protected by `trg_verify_profile_state_transitions`; only Admin or `service_role` can modify. |
| `waitlist_status` | **SAFE** | Protected by `trg_verify_profile_state_transitions`; restricted to Admin/`service_role`. |
| `role` | **SAFE** | Protected by `trg_verify_profile_state_transitions`; restricted to Admin/`service_role`. |
| `credits` (`credit_balance`) | **SAFE** | Protected by transition trigger. Also gated by `deduct_user_credits` RPC which validates `target_user_id`. |
| `locked_features` | **SAFE** | Protected by `trg_verify_profile_state_transitions`; restricted to Admin/`service_role`. |
| `machine_id` | **SAFE** | Set once during activation; transition trigger blocks all subsequent changes for non-admins. |

---

## 3. Hardware Blacklist Trigger

The `check_hardware_blacklist` function and associated trigger (`trg_check_hardware_blacklist`) provide database-level enforcement against banned devices.

- **Target Table**: `public.profiles`
- **Firing Event**: `BEFORE INSERT OR UPDATE OF machine_id`
- **Cryptographic Check**: **IMPLEMENTED**. The trigger checks both the raw `machine_id` and its **SHA-256** hash:
  ```sql
  WHERE machine_id_hash = NEW.machine_id
     OR machine_id_hash = encode(digest(NEW.machine_id, 'sha256'), 'hex')
  ```
- **Result**: **IMPLEMENTED**. Effectively blocks activation attempts from blacklisted hardware signatures.

---

## 4. Client Anon Key Exposure

Audit of `apps/desktop/src/lib/supabase.ts` and `apps/desktop/src/context/securityStore.ts`.

- **Key Usage**: The client strictly uses `VITE_SUPABASE_ANON_KEY` (referenced in `supabase.ts` L7).
- **Service Role**: No exposure of `service_role` keys found in the frontend codebase.
- **RLS Bypass**: No attempts to bypass RLS via hardcoded headers or elevated keys. The client relies on the JWT-based identity provided by Supabase Auth.
- **Result**: **SAFE**.

---

## 5. Unapproved User Access Gap

### Scenario A: User is_approved = false
- **Supabase Level**: The user can still `SELECT` their own profile row if `account_status` is 'active' (`drm_lockout_system.sql` L50). However, they cannot upgrade their own status due to the transition trigger.
- **Client Path**:
  1. `securityStore.ts` L127 calls `supabase.from('profiles').select(...)`.
  2. L151: `isBricked` evaluates to `true` because `profile.is_approved === false`.
  3. L158: `set({ status: 'Bricked' })`.
  4. `PageGuard.tsx` L61: Detects `Bricked` status and renders `LockoutScreen`, blocking app usage.

### Scenario B: machine_id mismatch
- **Supabase Level**: `profiles` UPDATE policy (`drm_lockout_system.sql` L55) includes a `WITH CHECK` that enforces `profiles.machine_id = machine_id` if already set. This prevents the client from updating the profile with a new ID.
- **Rust/DRM Path**:
  1. `securityStore.ts` L178: Invokes Rust command `get_machine_id`.
  2. L190: Calls Edge Function `generate-security-lease`.
  3. L202: Rust `process_security_heartbeat` calls `verify_lease_internal`.
  4. `commands.rs` L1525: `if lease.machine_id_hash != machine_hash` returns `Err("ACCESS DENIED: Hardware binding violation")`.
  5. The app remains in `LeaseExpired` or `Bricked` state.

### Scenario C: User in hardware_blacklist
- **Supabase Level**: `trg_check_hardware_blacklist` fires `BEFORE INSERT OR UPDATE OF machine_id`.
- **Path**:
  1. During activation/sync, client attempts to update `machine_id`.
  2. Supabase raises exception `D0001`: "This device signature has been permanently blacklisted".
  3. `securityStore.ts` L118: Catches the error. If it receives a 403 or specific error code, it bricks the UI.

---

## 6. Gaps & Recommendations

1. **Gap**: `profiles` SELECT policy allows unapproved users to read their profile.
   - **Severity**: LOW
   - **Description**: While they can't *do* anything, unapproved users can still poll their profile row.
   - **Fix**: Update `SELECT` policy on `profiles` to also require `is_approved = true`.

2. **Gap**: `waiting_list` spam.
   - **Severity**: LOW
   - **Description**: `Anyone can join waitlist` policy has `WITH CHECK (true)`, allowing bot spam.
   - **Fix**: Implement rate limiting at the Supabase level or use a CAPTCHA-protected Edge Function for waitlist signups.

3. **Gap**: `is_simulation_mode()` bypass in `PageGuard`.
   - **Severity**: MEDIUM
   - **Description**: `PageGuard.tsx` L17 returns early if `isSimulationMode()` is true. If a user can force this flag in local storage, they bypass UI gates.
   - **Fix**: Ensure the Rust layer (`verify_licensing!` macro) remains the absolute source of truth for all sensitive sidecar actions, as it cannot be bypassed by frontend state tampering. (Confirmed: `commands.rs` uses the macro on all critical paths).

**No critical gaps found.** The security model correctly implements a "Defense in Depth" strategy combining Database RLS, Triggers, Cryptographic Leases (Rust), and Frontend Guards.
