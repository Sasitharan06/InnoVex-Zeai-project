-- ==========================================
-- SUPABASE SCHEMA FOR INNOVEX-ZEAI
-- ==========================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Students Table (used by supabase.js directly)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Classrooms Table
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  faculty_name TEXT NOT NULL,
  faculty_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Classroom Members Table
CREATE TABLE IF NOT EXISTS public.classroom_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);

-- 5. Experiments Table
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  actions JSONB,
  final_state JSONB,
  score INTEGER,
  ai_report JSONB,
  feedback JSONB,
  live_tracking JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Chat Logs Table
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  experiment_id UUID,
  message TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- DISABLE RLS FOR DEVELOPMENT (anon key access)
-- ==========================================
-- The app uses the anon key directly from the frontend.
-- For development, we disable RLS so all operations work.
-- In production, you should enable RLS with proper policies.

ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs DISABLE ROW LEVEL SECURITY;
