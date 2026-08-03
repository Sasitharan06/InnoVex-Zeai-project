-- ZAED-004: AI Laboratory Simulator — Supabase Schema
-- Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ── Students Table ──
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  created_at timestamp with time zone default now()
);

-- ── Classrooms Table ──
create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  faculty_name text not null,
  faculty_id uuid not null,
  created_at timestamp with time zone default now()
);

-- ── Classroom Members Table ──
create table if not exists classroom_members (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid references classrooms(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  student_name text,
  joined_at timestamp with time zone default now(),
  unique(classroom_id, student_id)
);

-- ── Experiments Table ──
create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  classroom_id uuid references classrooms(id) on delete set null,
  domain text not null, -- 'chemistry' | 'physics'
  actions jsonb,
  final_state jsonb,
  score integer,
  ai_report jsonb,
  feedback jsonb,
  live_tracking jsonb,
  created_at timestamp with time zone default now()
);

alter table experiments add column if not exists feedback jsonb;
alter table experiments add column if not exists live_tracking jsonb;

-- ── Chat Logs Table ──
create table if not exists chat_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  experiment_id uuid references experiments(id) on delete set null,
  message text not null,
  role text not null, -- 'user' | 'assistant'
  created_at timestamp with time zone default now()
);

-- ── Indexes ──
create index if not exists idx_experiments_student_id on experiments(student_id);
create index if not exists idx_experiments_classroom_id on experiments(classroom_id);
create index if not exists idx_classroom_members_classroom_id on classroom_members(classroom_id);
create index if not exists idx_classrooms_code on classrooms(code);
create index if not exists idx_chat_logs_student_id on chat_logs(student_id);

-- ── Enable RLS (Row Level Security) — allow all for anon key (hackathon MVP) ──
alter table students enable row level security;
alter table classrooms enable row level security;
alter table classroom_members enable row level security;
alter table experiments enable row level security;
alter table chat_logs enable row level security;

-- Allow all operations for anon users (hackathon only — NOT for production)
create policy "Allow all for students" on students for all using (true) with check (true);
create policy "Allow all for classrooms" on classrooms for all using (true) with check (true);
create policy "Allow all for classroom_members" on classroom_members for all using (true) with check (true);
create policy "Allow all for experiments" on experiments for all using (true) with check (true);
create policy "Allow all for chat_logs" on chat_logs for all using (true) with check (true);
