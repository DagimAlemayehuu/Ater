-- Create waitlist table
create table if not exists public.waitlist (
    id uuid default gen_random_uuid() primary key,
    contact text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.waitlist enable row level security;

-- Allow public anonymous insert
create policy "Allow public anonymous insert"
on public.waitlist
for insert
to anon, authenticated
with check (true);

-- Allow authenticated/service role select
create policy "Allow read access to authenticated service role"
on public.waitlist
for select
to authenticated
using (true);
