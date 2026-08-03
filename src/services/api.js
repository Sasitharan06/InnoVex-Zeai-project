import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:3000/api';

// Helper to get Bearer token for Express Backend
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
  };
}

// ── Auth (Supabase Auth directly) ──

export async function loginStudent(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user.user_metadata.role !== 'student') {
    await supabase.auth.signOut();
    throw new Error('This email is registered as a Faculty account.');
  }
  return { user: { id: data.user.id, email: data.user.email, role: 'student', full_name: data.user.user_metadata.full_name } };
}

export async function loginFaculty(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user.user_metadata.role !== 'faculty') {
    await supabase.auth.signOut();
    throw new Error('This email is registered as a Student account.');
  }
  return { user: { id: data.user.id, email: data.user.email, role: 'faculty', full_name: data.user.user_metadata.full_name } };
}

export async function createStudent(fullName, email, password, confirmPassword) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'student' }
    }
  });
  if (error) throw error;
  return { message: 'Account created! Please check your email to verify before logging in.' };
}

export async function createFaculty(fullName, email, password, confirmPassword) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: 'faculty' }
    }
  });
  if (error) throw error;
  return { message: 'Account created! Please check your email to verify before logging in.' };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.user_metadata.role,
    full_name: session.user.user_metadata.full_name
  };
}

// ── Classrooms & Experiments (Express Backend) ──

export async function createClassroom(name) {
  const res = await fetch(`${BASE_URL}/data/classrooms`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create classroom');
  }
  return await res.json();
}

export async function getFacultyClassrooms() {
  const res = await fetch(`${BASE_URL}/data/classrooms/faculty`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) return [];
  return await res.json();
}

export async function joinClassroom(code) {
  const res = await fetch(`${BASE_URL}/data/classrooms/join`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ code })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to join classroom');
  }
  return await res.json();
}

export async function getStudentClassroom() {
  const res = await fetch(`${BASE_URL}/data/classrooms/student`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function getClassroomMembers(classroomId) {
  const res = await fetch(`${BASE_URL}/data/classrooms/${classroomId}/members`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) return [];
  return await res.json();
}

export async function saveExperiment(domain, actions, finalState, score, aiReport, classroomId) {
  const res = await fetch(`${BASE_URL}/data/experiments`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ domain, actions, final_state: finalState, score, ai_report: aiReport, classroom_id: classroomId })
  });
  if (!res.ok) throw new Error('Failed to save experiment');
  return await res.json();
}

export async function getStudentExperiments() {
  const res = await fetch(`${BASE_URL}/data/experiments/student`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) return [];
  return await res.json();
}

export async function getClassroomExperiments(classroomId) {
  const res = await fetch(`${BASE_URL}/data/classrooms/${classroomId}/experiments`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) return [];
  return await res.json();
}
