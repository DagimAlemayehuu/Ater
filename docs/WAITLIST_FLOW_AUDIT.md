# Waitlist Flow Audit: Landing Page to Supabase Profile Insert

This document provides a comprehensive audit of Ater's user acquisition and approval flow, covering the transition from the landing page waitlist signup to the Supabase profile management and admin approval process.

## 1. Landing Page Signup Flow

The landing page signup flow is primarily handled in the `auth` route of the landing page application.

- **Component**: `AuthContent` in `apps/landing-page/app/(landing)/auth/page.tsx`
- **Function**: `handleAuth`
- **Supabase Calls**:
    - `supabase.auth.signUp`: Creates the user in Supabase Auth. It passes the `email`, `password`, and `full_name` (in `options.data`).
    - `supabase.from('waiting_list').upsert`: Attempts to create or update a record in the `public.waiting_list` table with `{ email, full_name, status: 'pending' }`.
- **Profile Creation**: Profile creation is **not** handled directly by the frontend. It is managed by a PostgreSQL trigger `trg_create_profile_on_signup` on the `auth.users` table (defined in `supabase/migrations/drm_lockout_system.sql`).
- **Fields set at signup (via trigger)**:
    - `id`: `NEW.id` (from auth.users)
    - `email`: `NEW.email`
    - `full_name`: `COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')`
    - `role`: `'Student'` (Default)
    - `credit_balance`: `100` (Default welcome credits)
    - `account_status`: `'active'`
    - `waitlist_status`: `'pending'` (unless already approved in `waiting_list` table)
    - `is_approved`: `false` (unless already approved in `waiting_list` table)
    - `activation_code`: `null` (unless already present in `waiting_list` table)
- **Waitlist Status**: `waitlist_status` is set to `'pending'` and `is_approved` is set to `false` by default in the trigger.
- **Email Confirmation**: If email confirmation is enabled in Supabase, `data.session` will be null after `signUp`. The `AuthContent` component shows a success message asking the user to check their email. The profile insert happens as soon as the record is created in `auth.users`, which typically happens before verification.

**Result: WORKING (with Gaps)**
The flow technically works but relies on a database trigger that might not have the most up-to-date information from the `waiting_list` table if the upsert from the frontend fails or is delayed.

## 2. Admin Approval Flow

**Beta policy: Set credit_balance = 0 when approving users in beta. The desktop app runs in beta mode and shows ∞ regardless. When production billing is activated, admins will top up accounts with real credits.**

The admin approval process is managed in the Admin dashboard.

- **Component**: `WaitlistManager` in `apps/admin/src/app/waitlist/page.tsx`
- **Function**: `handleUpdate(id, action)`
- **Supabase Calls**:
    - `supabase.from("waiting_list").update({ status: action, activation_code }).eq("id", id)`: Updates the waitlist record.
    - `supabase.from("profiles").update({ activation_code, is_approved: action === "approved", waitlist_status: action }).eq("email", current.email)`: Updates the user profile.
- **Atomicity**: The updates are **NOT** atomic. They are two separate client-side calls. If the first succeeds and the second fails, the system will be in an inconsistent state.
- **Credits**: Credits are **NOT** assigned or updated during the approval flow in `handleUpdate`.
- **Key Usage**: The Admin dashboard uses the **anon key** (via `apps/admin/src/lib/supabase.ts`), which relies on RLS policies. The `is_admin()` check in `supabase/migrations/drm_rls_policies.sql` allows the admin to perform these updates. It does **NOT** use the `service_role` key.

**Result: PARTIAL**
The flow updates the necessary fields to grant access but lacks atomicity and does not assign credits as expected during the approval step.

## 3. Profile Schema Consistency

Based on migration files (`supabase/migrations/`):

- **Columns and Defaults**:
    - `id`: `uuid` (Primary Key)
    - `email`: `text` (Unique)
    - `full_name`: `text`
    - `role`: `text` (Default: 'Student' in trigger)
    - `credit_balance`: `integer` (Default: 100 in trigger, 20 in mock)
    - `account_status`: `account_status` (Default: 'active')
    - `waitlist_status`: `text` (Default: 'pending')
    - `is_approved`: `boolean` (Default: false)
    - `activation_code`: `text` (Default: null)
    - `locked_features`: `text[]` (Default: '{}')
- **Consistency**: The schema matches the fields used in the landing page and admin app. However, the `public.profiles` and `public.waiting_list` table creation statements are missing from the provided migration files.
- **Unique Constraint**: The `email` column in `auth.users` is unique. The `waiting_list` table uses an upsert on `email`, implying a unique constraint or primary key on `email`.

**Result: CONSISTENT (with Missing Migrations)**
The fields used in code align with the schema described in triggers and policies, but the base table definitions are missing from the migrations.

## 4. Race Conditions & Edge Cases

- **Duplicate Signups**: The landing page uses `upsert` on the `waiting_list` table with `onConflict: 'email'`, so duplicate signups will update the existing record rather than creating a new one. `supabase.auth.signUp` will return an error if the email is already registered.
- **Supabase Insert Failure**: If the `waiting_list` upsert fails (e.g., due to RLS), a warning is logged to the console, but the flow continues because the record will be created/checked during the first login in `AuthContent.fetchUserStatus`.
- **Client-side Validation**: Basic validation exists (required fields, email format via HTML5, password length min 6).

## 5. Gaps & Broken Steps

1. **Severity: HIGH**
   - **Description**: Admin approval is not atomic.
   - **Exact fix needed**: Move the approval logic to a PostgreSQL RPC or a Supabase Edge Function that updates both `waiting_list` and `profiles` tables in a single transaction.

2. **Severity: MEDIUM**
   - **Description**: Credits are not assigned upon approval.
   - **Exact fix needed**: Update the approval logic (ideally in the new RPC/Edge Function) to set the `credit_balance` to the desired initial amount (e.g., 1000) when a user is approved.

3. **Severity: MEDIUM**
   - **Description**: Admin dashboard does not use `service_role` key.
   - **Exact fix needed**: For sensitive administrative operations, the Admin dashboard should ideally use a backend API or Edge Function that utilizes the `service_role` key to bypass RLS and ensure integrity, rather than relying on the client-side `anon` key.

4. **Severity: LOW**
   - **Description**: Missing table creation migrations.
   - **Exact fix needed**: Add migration files that explicitly create the `public.profiles` and `public.waiting_list` tables with all necessary constraints and indices.

**Summary**: The waitlist flow is functional for v0.2 but has significant risks regarding data consistency (non-atomicity) and security (client-side administrative updates).

## 6. Admin Bulk Approval Runbook

To bulk-approve friends during the beta phase, follow these steps in the Supabase Dashboard:

1.  Open the **SQL Editor** in the Supabase Dashboard.
2.  Paste the following SQL snippet.
3.  Replace the placeholder emails in the `IN` clause with the actual emails you wish to approve.
4.  Run the query.

```sql
-- Bulk Approval for Beta Friends
-- This query approves users and sets their credit balance to 0 (Unlimited Beta Mode)

BEGIN;

-- 1. Update the waiting list status
UPDATE public.waiting_list
SET status = 'approved'
WHERE email IN (
  'friend1@example.com',
  'friend2@example.com'
);

-- 2. Update user profiles to grant access
UPDATE public.profiles
SET
    is_approved = true,
    waitlist_status = 'approved',
    credit_balance = 0 -- Beta accounts use 0 to signal unlimited access
WHERE email IN (
  'friend1@example.com',
  'friend2@example.com'
);

COMMIT;
```

**Verification**:
After running the query, you can verify the status by running:
```sql
SELECT email, is_approved, waitlist_status, credit_balance
FROM public.profiles
WHERE email IN ('friend1@example.com', 'friend2@example.com');
```
