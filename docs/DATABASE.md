# Database Architecture & Supabase Contracts

Ater uses **Supabase** (PostgreSQL) for cloud persistence, authentication, and real-time synchronization, coupled with local browser caching for offline-first resilience.

---

## 1. Schema Tables Overview

All tables in the database use the `ater_` prefix to isolate Ater data within shared Supabase environments.

```text
public.ater_courses
  ├── id (UUID, PK)
  ├── user_id (UUID, FK -> auth.users)
  ├── title (TEXT)
  ├── description (TEXT)
  ├── created_at (TIMESTAMPTZ)
  └── updated_at (TIMESTAMPTZ)

public.ater_lessons
  ├── id (UUID, PK)
  ├── course_id (UUID, FK -> ater_courses.id ON DELETE CASCADE)
  ├── user_id (UUID, FK -> auth.users)
  ├── title (TEXT)
  ├── order_index (INT)
  ├── status (TEXT: 'locked' | 'active' | 'mastered' | 'remediation')
  └── created_at (TIMESTAMPTZ)

public.ater_notes
  ├── id (UUID, PK)
  ├── lesson_id (UUID, FK -> ater_lessons.id ON DELETE CASCADE)
  ├── user_id (UUID, FK -> auth.users)
  ├── title (TEXT)
  ├── sections (JSONB: Array of 5 pedagogical sections)
  ├── checkpoints (JSONB: Interactive recall questions)
  └── updated_at (TIMESTAMPTZ)

public.ater_gate_sessions
  ├── id (UUID, PK)
  ├── lesson_id (UUID, FK -> ater_lessons.id ON DELETE CASCADE)
  ├── user_id (UUID, FK -> auth.users)
  ├── score (INT)
  ├── passed (BOOLEAN)
  ├── feedback (TEXT)
  ├── taboo_words (TEXT[])
  └── completed_at (TIMESTAMPTZ)

public.ater_waiting_list
  ├── id (UUID, PK)
  ├── email (TEXT, UNIQUE)
  ├── role (TEXT)
  ├── created_at (TIMESTAMPTZ)
```

---

## 2. Row-Level Security (RLS) Policies

Every table has Row-Level Security enabled to guarantee strict tenant isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE public.ater_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ater_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ater_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ater_gate_sessions ENABLE ROW LEVEL SECURITY;

-- Standard User Isolation Policies
CREATE POLICY "Users can only read their own courses"
  ON public.ater_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own courses"
  ON public.ater_courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own courses"
  ON public.ater_courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own courses"
  ON public.ater_courses FOR DELETE
  USING (auth.uid() = user_id);
```
*(Identical policies apply to `ater_lessons`, `ater_notes`, and `ater_gate_sessions` referencing `auth.uid() = user_id`.)*

---

## 3. Client Storage Layer (`lib/sync/store.ts`)

The client application implements an offline-first hybrid synchronization store:

1. **Authenticated Users:**
   - Reads first query the local cache prefixed with the active user ID (`ater_courses_${uid}`).
   - Asynchronous sync reconciles with Supabase PostgreSQL tables in the background.
   - Any writes update the local cache immediately for 0ms UI latency, then push to Supabase.
2. **Guest Mode:**
   - When no Supabase session exists, data is stored strictly in `localStorage` under `ater_guest_*` keys.
   - Upon sign-in, the client automatically offers to migrate guest courses into the authenticated user profile.
