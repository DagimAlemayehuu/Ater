-- Create dedicated isolated schema for Ater
-- This guarantees zero interference with other apps sharing this Supabase project
create schema if not exists ater;

-- Grant usage to authenticated and service_role
grant usage on schema ater to anon, authenticated, service_role;

-- 1. COURSES TABLE
create table if not exists ater.courses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    topic text not null,
    source_type text check (source_type in ('prompt', 'pdf', 'scholarxiv')) default 'prompt',
    target_goal text,
    learner_baseline text,
    language text check (language in ('en', 'am')) default 'en',
    teacher_walkthrough text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. LESSONS TABLE
create table if not exists ater.lessons (
    id text primary key, -- e.g. lesson-01, lesson-02
    course_id uuid references ater.courses(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    order_index integer not null,
    title text not null,
    slug text not null,
    summary text,
    description text,
    status text check (status in ('active', 'locked', 'completed', 'needs_remediation')) default 'locked',
    estimated_minutes integer default 15,
    concepts_covered jsonb default '[]'::jsonb,
    is_remediation boolean default false,
    remediation_parent_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. COMPILED LESSON NOTES
create table if not exists ater.lesson_notes (
    id uuid default gen_random_uuid() primary key,
    lesson_id text not null,
    course_id uuid references ater.courses(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    sections jsonb not null default '[]'::jsonb,
    checkpoint_question text,
    checkpoint_options jsonb,
    checkpoint_answer text,
    checkpoint_explanation text,
    feynman_prompt text,
    taboo_words jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(lesson_id, user_id)
);

-- 4. FEYNMAN EVALUATIONS & AUDIT
create table if not exists ater.evaluations (
    id uuid default gen_random_uuid() primary key,
    lesson_id text not null,
    course_id uuid references ater.courses(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    user_explanation text not null,
    score integer check (score between 0 and 100) not null,
    verdict text check (verdict in ('passed', 'taboo_violation', 'shallow_parroting', 'misconception', 'incomplete')) not null,
    critique text not null,
    feedback text not null,
    taboo_words_used jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ROW LEVEL SECURITY (RLS) FOR MULTI-TENANT ISOLATION
alter table ater.courses enable row level security;
alter table ater.lessons enable row level security;
alter table ater.lesson_notes enable row level security;
alter table ater.evaluations enable row level security;

-- Policies for courses
create policy "Users can only access their own courses"
on ater.courses for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies for lessons
create policy "Users can only access their own lessons"
on ater.lessons for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies for lesson_notes
create policy "Users can only access their own lesson notes"
on ater.lesson_notes for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies for evaluations
create policy "Users can only access their own evaluations"
on ater.evaluations for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Expose ater schema to postgrest API
grant all on all tables in schema ater to anon, authenticated, service_role;
