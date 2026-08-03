import { supabase } from './supabase';

export { supabase };

const BASE_URL = 'http://localhost:3000/api';

// Helper to get Bearer token for Express Backend
async function getAuthHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
    };
  } catch (e) {
    return { 'Content-Type': 'application/json' };
  }
}

// ── Auth ──

export async function loginStudent(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user.user_metadata.role !== 'student') {
    await supabase.auth.signOut();
    throw new Error('This email is registered as a Faculty account.');
  }
  const name = data.user.user_metadata?.full_name || email.split('@')[0];
  const user = { id: data.user.id, email: data.user.email, role: 'student', full_name: name, name };
  try {
    localStorage.setItem('virtulab_session', JSON.stringify(user));
  } catch(e) {}
  return { user, student: user };
}

export async function loginFaculty(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user.user_metadata.role !== 'faculty') {
    await supabase.auth.signOut();
    throw new Error('This email is registered as a Student account.');
  }
  const name = data.user.user_metadata?.full_name || email.split('@')[0];
  const user = { id: data.user.id, email: data.user.email, role: 'faculty', full_name: name, name };
  try {
    localStorage.setItem('virtulab_session', JSON.stringify(user));
  } catch(e) {}
  return { user, faculty: user };
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
  try {
    localStorage.removeItem('virtulab_session');
  } catch (e) {}
  try {
    if (supabase && supabase.auth) {
      await supabase.auth.signOut();
    }
  } catch (e) {}
  return true;
}

export async function getSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email;
      return {
        id: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role || 'student',
        full_name: name,
        name: name
      };
    }
  } catch (e) {}

  try {
    const localSession = localStorage.getItem('virtulab_session');
    if (localSession) {
      return JSON.parse(localSession);
    }
  } catch(e) {}

  return null;
}

// ── Classrooms & Experiments (Express Backend with Local Offline Fallback) ──

export async function createClassroom(name) {
  try {
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
  } catch (err) {
    console.warn('Backend unavailable, using local classroom fallback:', err.message);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return { id: 'cls-' + Date.now(), name, code, created_at: new Date().toISOString() };
  }
}

export async function getFacultyClassrooms() {
  try {
    const res = await fetch(`${BASE_URL}/data/classrooms/faculty`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function joinClassroom(code) {
  try {
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
  } catch (err) {
    return { classroom: { id: 'cls-' + code, name: `Classroom ${code}`, code } };
  }
}

export async function getStudentClassroom() {
  try {
    const res = await fetch(`${BASE_URL}/data/classrooms/student`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function getClassroomMembers(classroomId) {
  try {
    const res = await fetch(`${BASE_URL}/data/classrooms/${classroomId}/members`, {
      headers: await getAuthHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function saveExperiment(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  let studentId, domain, actions, finalState, score, aiReport, classroomId;
  if (typeof arg1 === 'string' && (arg2 === 'physics' || arg2 === 'chemistry' || arg2 === 'biology')) {
    studentId = arg1;
    domain = arg2;
    actions = arg3;
    finalState = arg4;
    score = arg5;
    aiReport = arg6;
    classroomId = arg7;
  } else {
    domain = arg1;
    actions = arg2;
    finalState = arg3;
    score = arg4;
    aiReport = arg5;
    classroomId = arg6;
  }

  const localSaved = {
    id: 'exp-' + Date.now(),
    student_id: studentId || 'st-default',
    domain,
    actions: actions || [],
    final_state: finalState,
    score: score || 85,
    ai_report: aiReport,
    classroom_id: classroomId || null,
    created_at: new Date().toISOString()
  };

  try {
    const existing = JSON.parse(localStorage.getItem('virtulab_experiments') || '[]');
    existing.unshift(localSaved);
    localStorage.setItem('virtulab_experiments', JSON.stringify(existing));
  } catch (e) {}

  try {
    const res = await fetch(`${BASE_URL}/data/experiments`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        student_id: studentId,
        domain,
        actions,
        final_state: finalState,
        score,
        ai_report: aiReport,
        classroom_id: classroomId
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend server offline; saved experiment locally:', err.message);
  }

  return localSaved;
}

export async function getStudentExperiments() {
  try {
    const res = await fetch(`${BASE_URL}/data/experiments/student`, {
      headers: await getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  try {
    return JSON.parse(localStorage.getItem('virtulab_experiments') || '[]');
  } catch (e) {
    return [];
  }
}

export async function getClassroomExperiments(classroomId) {
  try {
    const res = await fetch(`${BASE_URL}/data/classrooms/${classroomId}/experiments`, {
      headers: await getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  try {
    const all = JSON.parse(localStorage.getItem('virtulab_experiments') || '[]');
    return classroomId ? all.filter(e => e.classroom_id === classroomId) : all;
  } catch (e) {
    return [];
  }
}
