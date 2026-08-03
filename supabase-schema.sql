-- ==========================================
-- SUPABASE SCHEMA (Using Supabase Auth)
-- ==========================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Classrooms Table
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  faculty_name TEXT NOT NULL,
  faculty_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Classroom Members Table
CREATE TABLE IF NOT EXISTS public.classroom_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);

-- 4. Create Experiments Table
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  domain TEXT NOT NULL,
  actions JSONB,
  final_state JSONB,
  score INTEGER,
  ai_report JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- Faculty can manage their own classrooms
CREATE POLICY "Faculty can read own classrooms" 
  ON public.classrooms FOR SELECT 
  USING (auth.uid() = faculty_id);

CREATE POLICY "Faculty can insert own classrooms" 
  ON public.classrooms FOR INSERT 
  WITH CHECK (auth.uid() = faculty_id);

-- Students can read a classroom if they know the code (for joining)
CREATE POLICY "Anyone can read classrooms" 
  ON public.classrooms FOR SELECT 
  USING (true);

-- Classroom Members Policies
CREATE POLICY "Students can read their own memberships" 
  ON public.classroom_members FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own memberships" 
  ON public.classroom_members FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Faculty can read members of their classrooms" 
  ON public.classroom_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms 
      WHERE classrooms.id = classroom_members.classroom_id 
      AND classrooms.faculty_id = auth.uid()
    )
  );

-- Experiments Policies
CREATE POLICY "Students can read own experiments" 
  ON public.experiments FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own experiments" 
  ON public.experiments FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Faculty can read experiments in their classrooms" 
  ON public.experiments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms 
      WHERE classrooms.id = experiments.classroom_id 
      AND classrooms.faculty_id = auth.uid()
    )
  );
