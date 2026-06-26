# DATABASE.md — Ater Database & DRM Schema

This document defines Ater's hybrid storage schema, including the local offline SQLite database (`ater.db`) and the remote cloud persistence layer (Supabase PostgreSQL).

---

## 1. Local SQLite Database (`ater.db`)
Located locally in the user's application support directory. It acts as the local index cache.

### Key Tables
* **`srs_cards`:**
  * Tracks review histories for all Atomic Notes.
  * Columns:
    * `note_path` (TEXT, Primary Key) — Path to the Obsidian Markdown file.
    * `stability` (REAL) — Memory retention factor.
    * `difficulty` (REAL) — Card complexity.
    * `repetitions` (INTEGER) — Total review loops.
    * `due` (TIMESTAMP) — Next scheduled practice time.
* **`vector_embeddings`:**
  * Houses semantic float arrays calculated by the ONNX embedding engine.
  * Columns:
    * `note_path` (TEXT)
    * `embedding` (BLOB) — Serialized float vector.
    * `updated_at` (TIMESTAMP)

---

## 2. Remote Cloud Database (Supabase PostgreSQL)
The source of truth for licensing, DRM hardware locks, and account profiles.

### Key Tables
* **`public.profiles`:**
  * Stores user subscription ranks and API usage permissions.
  * Columns:
    * `id` (UUID, Primary Key) — Linked to Supabase Auth.
    * `role` (TEXT) — `user` | `admin` | `developer`.
    * `credits` (INTEGER) — Remaining note generation balance.
    * `machine_id` (TEXT) — Hardware signature of the registered machine.
* **`public.hardware_blacklist`:**
  * Banned machine signatures.
  * Columns:
    * `machine_id` (TEXT, Primary Key)
    * `reason` (TEXT)

---

## 3. Row-Level Security (RLS) & Triggers
* **RLS Policies:**
  * The `profiles` table enables RLS. Users can read their own profile, but writes/mutations to `role` or `credits` are blocked.
  * *Constraint:* Changing account credits or subscription roles is restricted to Supabase edge functions or `service_role` execution.
* **Blacklist Trigger (`check_hardware_blacklist`):**
  * Database trigger that intercepts authentication requests. If the client machine ID is found on the `hardware_blacklist` table, Auth returns a `403 Forbidden` DRM error.

---

## 4. Heartbeat Sync Mechanism
1. On client launch, the React app pulls the user's Supabase profile details.
2. The Rust backend calls `generate-security-lease` (Supabase Edge function) passing the local machine ID.
3. The Edge function verifies the profile, locks the lease, and returns a signed payload which is saved locally to `~/.ater/device.lease`.
