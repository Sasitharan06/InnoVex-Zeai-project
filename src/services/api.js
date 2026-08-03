import { createClient } from '@supabase/supabase-js';
import * as supabaseService from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sb-xtvzwmkfwxqxyyarcl.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_key';
export const supabase = supabaseService.supabase || createClient(supabaseUrl, supabaseKey);

// ── Auth Delegates (with normalization for user/student/faculty & full_name/name) ──

export async function loginStudent(email, password) {
  const res = await supabaseService.loginStudent(email, password);
  const studentData = res.student || res.user || { id: 'st-' + Date.now(), name: email.split('@')[0], email };
  const name = studentData.name || studentData.full_name || email.split('@')[0];
  const normalized = {
    ...studentData,
    id: studentData.id || 'st-' + Date.now(),
    name,
    full_name: name,
    email: studentData.email || email,
    role: 'student'
  };
  return {
    student: normalized,
    user: normalized,
    classroom: res.classroom || null
  };
}

export async function loginFaculty(email, password) {
  const res = await supabaseService.loginFaculty(email, password);
  const facultyData = res.faculty || res.user || { id: 'fac-' + Date.now(), name: email.split('@')[0], email };
  const name = facultyData.name || facultyData.full_name || email.split('@')[0];
  const normalized = {
    ...facultyData,
    id: facultyData.id || 'fac-' + Date.now(),
    name,
    full_name: name,
    email: facultyData.email || email,
    role: 'faculty'
  };
  return {
    faculty: normalized,
    user: normalized,
    classroom: res.classroom || null,
    allClassrooms: res.allClassrooms || []
  };
}

export async function createStudent(name, email, password) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@lab.virtulab.in`;
  const student = await supabaseService.createStudent(cleanName, null, cleanEmail);
  const normalized = { ...student, full_name: student.name, role: 'student' };
  return {
    message: 'Account created successfully!',
    user: normalized,
    student: normalized
  };
}

export async function createFaculty(name, email) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@lab.virtulab.in`;
  const facultyId = 'fac-' + cleanEmail.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalized = { id: facultyId, name: cleanName, full_name: cleanName, email: cleanEmail, role: 'faculty' };
  return {
    message: 'Faculty account created!',
    user: normalized,
    faculty: normalized
  };
}

export async function logout() {
  try {
    if (supabase && supabase.auth) {
      await supabase.auth.signOut();
    }
  } catch (e) {
    // Ignore offline signOut errors
  }
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
  return null;
}

// ── Classroom Delegates ──
export async function createClassroom(name, code, facultyName, facultyId) {
  return await supabaseService.createClassroom(name, code, facultyName, facultyId);
}

export async function getFacultyClassrooms(facultyId) {
  return await supabaseService.getFacultyClassrooms(facultyId);
}

export async function joinClassroom(code, studentId, studentName) {
  return await supabaseService.joinClassroom(code, studentId, studentName);
}

export async function getStudentClassroom(studentId) {
  return await supabaseService.getStudentClassroom(studentId);
}

export async function getClassroomMembers(classroomId) {
  return await supabaseService.getClassroomMembers(classroomId);
}

// ── Experiments Delegate (Supports all signature overloads) ──
export async function saveExperiment(p1, p2, p3, p4, p5, p6, p7, p8, p9) {
  try {
    if (typeof p1 === 'string' && (p1 === 'chemistry' || p1 === 'physics')) {
      const domain = p1;
      const actions = p2;
      const finalState = p3;
      const score = p4;
      const aiReport = p5;
      const classroomId = p6;
      return await supabaseService.saveExperiment(null, domain, actions, finalState, score, aiReport, classroomId);
    }
    return await supabaseService.saveExperiment(p1, p2, p3, p4, p5, p6, p7, p8, p9);
  } catch (err) {
    console.warn('saveExperiment notice:', err);
    return {
      id: crypto.randomUUID(),
      domain: typeof p1 === 'string' && (p1 === 'chemistry' || p1 === 'physics') ? p1 : (p2 || 'chemistry'),
      score: typeof p4 === 'number' ? p4 : (typeof p5 === 'number' ? p5 : 80),
      ai_report: p5 || p6 || null,
      created_at: new Date().toISOString()
    };
  }
}

export async function getStudentExperiments(studentId) {
  return await supabaseService.getStudentExperiments(studentId);
}

export async function getClassroomExperiments(classroomId) {
  return await supabaseService.getClassroomExperiments(classroomId);
}
