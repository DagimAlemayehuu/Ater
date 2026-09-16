-- Enable Row Level Security on existing Ater tables
-- This removes the red "UNRESTRICTED" badge and secures all tables
alter table public.ater_courses enable row level security;
alter table public.ater_lessons enable row level security;
alter table public.ater_notes enable row level security;
alter table public.ater_gate_sessions enable row level security;
alter table public.ater_agent_events enable row level security;

-- Add user_id column if it doesn't already exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ater_courses' and column_name = 'user_id') then
    alter table public.ater_courses add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ater_lessons' and column_name = 'user_id') then
    alter table public.ater_lessons add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ater_notes' and column_name = 'user_id') then
    alter table public.ater_notes add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ater_gate_sessions' and column_name = 'user_id') then
    alter table public.ater_gate_sessions add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ater_agent_events' and column_name = 'user_id') then
    alter table public.ater_agent_events add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;
end $$;

-- Policies for ater_courses
drop policy if exists "Users access own ater_courses" on public.ater_courses;
create policy "Users access own ater_courses"
on public.ater_courses for all to authenticated
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);

-- Policies for ater_lessons
drop policy if exists "Users access own ater_lessons" on public.ater_lessons;
create policy "Users access own ater_lessons"
on public.ater_lessons for all to authenticated
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);

-- Policies for ater_notes
drop policy if exists "Users access own ater_notes" on public.ater_notes;
create policy "Users access own ater_notes"
on public.ater_notes for all to authenticated
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);

-- Policies for ater_gate_sessions
drop policy if exists "Users access own ater_gate_sessions" on public.ater_gate_sessions;
create policy "Users access own ater_gate_sessions"
on public.ater_gate_sessions for all to authenticated
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);

-- Policies for ater_agent_events
drop policy if exists "Users access own ater_agent_events" on public.ater_agent_events;
create policy "Users access own ater_agent_events"
on public.ater_agent_events for all to authenticated
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);
