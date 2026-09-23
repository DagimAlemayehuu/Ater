-- Migration 003: Strict Multi-Tenant Row Level Security
-- Disallows unauthenticated reads/writes and removes 'or user_id is null' leak

-- 1. Ensure RLS is active on all core tables
alter table public.ater_courses enable row level security;
alter table public.ater_lessons enable row level security;
alter table public.ater_notes enable row level security;
alter table public.ater_gate_sessions enable row level security;
alter table public.ater_agent_events enable row level security;

-- 2. Strict tenancy policies for ater_courses
drop policy if exists "Users access own ater_courses" on public.ater_courses;
create policy "Users access own ater_courses"
on public.ater_courses for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3. Strict tenancy policies for ater_lessons
drop policy if exists "Users access own ater_lessons" on public.ater_lessons;
create policy "Users access own ater_lessons"
on public.ater_lessons for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4. Strict tenancy policies for ater_notes
drop policy if exists "Users access own ater_notes" on public.ater_notes;
create policy "Users access own ater_notes"
on public.ater_notes for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 5. Strict tenancy policies for ater_gate_sessions
drop policy if exists "Users access own ater_gate_sessions" on public.ater_gate_sessions;
create policy "Users access own ater_gate_sessions"
on public.ater_gate_sessions for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6. Strict tenancy policies for ater_agent_events
drop policy if exists "Users access own ater_agent_events" on public.ater_agent_events;
create policy "Users access own ater_agent_events"
on public.ater_agent_events for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
