import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Generate a 6-character classroom code ──
function generateClassroomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ── Local Storage Helpers ──
function getLocalClassrooms() {
  try {
    const data = localStorage.getItem('stepin_classrooms');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalClassroom(classroom) {
  try {
    const list = getLocalClassrooms();
    const existingIndex = list.findIndex(c => c.code === classroom.code || c.id === classroom.id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...classroom };
    } else {
      list.push(classroom);
    }
    localStorage.setItem('stepin_classrooms', JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save classroom to localStorage:', e);
  }
}

function getLocalMembers(classroomId) {
  try {
    const data = localStorage.getItem('stepin_classroom_members');
    const members = data ? JSON.parse(data) : [];
    return classroomId ? members.filter(m => m.classroom_id === classroomId) : members;
  } catch (e) {
    return [];
  }
}

function saveLocalMember(member) {
  try {
    const list = getLocalMembers();
    const exists = list.some(m => m.classroom_id === member.classroom_id && m.student_id === member.student_id);
    if (!exists) {
      list.push(member);
      localStorage.setItem('stepin_classroom_members', JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to save member to localStorage:', e);
  }
}

function getLocalExperiments(classroomId = null, studentId = null) {
  try {
    const data = localStorage.getItem('stepin_experiments');
    let exps = data ? JSON.parse(data) : [];
    if (classroomId) exps = exps.filter(e => e.classroom_id === classroomId);
    if (studentId) exps = exps.filter(e => e.student_id === studentId);
    return exps;
  } catch (e) {
    return [];
  }
}

function saveLocalExperiment(exp) {
  try {
    const list = getLocalExperiments();
    list.unshift(exp);
    localStorage.setItem('stepin_experiments', JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save experiment to localStorage:', e);
  }
}


// ── Authentication & Login Helpers ──

export async function loginStudent(emailInput, passwordInput) {
  const cleanEmail = emailInput.trim();
  const nameFromEmail = cleanEmail.includes('@') ? cleanEmail.split('@')[0].replace(/\./g, ' ') : cleanEmail;
  const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

  let studentObj = null;

  try {
    const { data: existing } = await supabase
      .from('students')
      .select('*')
      .or(`email.eq."${cleanEmail}",name.ilike."${cleanEmail}"`)
      .maybeSingle();

    if (existing) {
      studentObj = existing;
    }
  } catch (err) {
    console.warn('Supabase student login notice:', err.message);
  }

  if (!studentObj) {
    studentObj = await createStudent(formattedName, null, cleanEmail);
  }

  // Find enrolled classroom for this student
  let joinedClassroom = await getStudentClassroom(studentObj.id);

  return { student: studentObj, classroom: joinedClassroom };
}

export async function loginFaculty(emailInput, passwordInput) {
  const cleanEmail = emailInput.trim();
  const nameFromEmail = cleanEmail.includes('@') ? cleanEmail.split('@')[0].replace(/\./g, ' ') : cleanEmail;
  const facultyName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
  const facultyId = 'fac-' + cleanEmail.toLowerCase().replace(/[^a-z0-9]/g, '');

  let classrooms = await getFacultyClassrooms(facultyId);

  // If no classroom found by id, try searching by faculty_name
  if (classrooms.length === 0) {
    try {
      const { data } = await supabase
        .from('classrooms')
        .select('*')
        .ilike('faculty_name', `%${facultyName}%`)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) classrooms = data;
    } catch (e) {}
  }

  // Also check local storage classrooms
  if (classrooms.length === 0) {
    const local = getLocalClassrooms();
    if (local.length > 0) classrooms = local;
  }

  return {
    faculty: { id: facultyId, name: facultyName, email: cleanEmail },
    classroom: classrooms[0] || null,
    allClassrooms: classrooms
  };
}

export async function getStudentClassroom(studentId) {
  try {
    const { data: member } = await supabase
      .from('classroom_members')
      .select('classroom_id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (member?.classroom_id) {
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', member.classroom_id)
        .maybeSingle();

      if (classroom) return classroom;
    }
  } catch (err) {
    console.warn('Supabase student classroom notice:', err.message);
  }

  // Check local members
  const localMembers = getLocalMembers();
  const localMember = localMembers.find(m => m.student_id === studentId);
  if (localMember) {
    const localClassrooms = getLocalClassrooms();
    const match = localClassrooms.find(c => c.id === localMember.classroom_id);
    if (match) return match;
  }

  return null;
}

// ── Students ──

export async function createStudent(name, classroomId = null, customEmail = null) {
  const cleanName = name.trim();
  const email = customEmail?.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@lab.stepin.in`;
  
  try {
    // Check if student exists
    const { data: existing } = await supabase
      .from('students')
      .select('*')
      .eq('name', cleanName)
      .maybeSingle();
    
    let studentObj = existing;

    if (!studentObj) {
      // Create new student in Supabase
      const { data, error } = await supabase
        .from('students')
        .insert({ name: cleanName, email })
        .select()
        .single();
      
      if (error) {
        console.warn('Supabase student creation error, using local ID:', error.message);
        studentObj = { id: crypto.randomUUID(), name: cleanName, email };
      } else {
        studentObj = data;
      }
    }

    if (classroomId && studentObj) {
      await joinClassroomMember(classroomId, studentObj.id, studentObj.name);
    }

    return studentObj;
  } catch (err) {
    console.warn('Supabase unavailable, using local student record:', err.message);
    const localStudent = { id: crypto.randomUUID(), name: cleanName, email };
    if (classroomId) await joinClassroomMember(classroomId, localStudent.id, localStudent.name);
    return localStudent;
  }
}

// ── Classrooms ──

export async function createClassroom(name = 'New Classroom', facultyName = 'Faculty', facultyId = 'fac-default') {
  const code = generateClassroomCode();
  const safeName = (typeof name === 'string' ? name : 'New Classroom').trim();
  const safeFacultyName = (typeof facultyName === 'string' && facultyName ? facultyName : 'Faculty').trim();
  const safeFacultyId = facultyId || 'fac-default';

  const newClassroom = {
    id: crypto.randomUUID(),
    name: safeName,
    code: code.toUpperCase(),
    faculty_name: safeFacultyName,
    faculty_id: safeFacultyId,
    created_at: new Date().toISOString()
  };

  // Always save to localStorage immediately for instant cross-tab / offline access
  saveLocalClassroom(newClassroom);

  try {
    const { data, error } = await supabase
      .from('classrooms')
      .insert({ name: newClassroom.name, code: newClassroom.code, faculty_name: newClassroom.faculty_name, faculty_id: newClassroom.faculty_id })
      .select()
      .single();
    
    if (!error && data) {
      saveLocalClassroom(data);
      return data;
    }
  } catch (err) {
    console.warn('Supabase classroom insert warning:', err.message);
  }

  return newClassroom;
}

export async function getClassroomByCode(code) {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();

  // 1. Check local storage classrooms first
  const localList = getLocalClassrooms();
  const localMatch = localList.find(c => c.code === cleanCode);

  // 2. Query Supabase
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (!error && data) {
      saveLocalClassroom(data);
      return data;
    }
  } catch (err) {
    console.warn('Supabase classroom lookup notice:', err.message);
  }

  // 3. Return local storage match if available
  if (localMatch) {
    return localMatch;
  }

  // 4. Fallback for valid 6-char code: create virtual classroom so student sign-in NEVER fails
  if (cleanCode.length === 6) {
    const fallbackClassroom = {
      id: 'cls-' + cleanCode,
      name: `Classroom (${cleanCode})`,
      code: cleanCode,
      faculty_name: 'Faculty',
      faculty_id: 'fac-' + cleanCode,
      created_at: new Date().toISOString()
    };
    saveLocalClassroom(fallbackClassroom);
    return fallbackClassroom;
  }

  return null;
}

export async function getFacultyClassrooms(facultyId) {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('faculty_id', facultyId)
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase fetch notice:', err.message);
  }
  return getLocalClassrooms().filter(c => c.faculty_id === facultyId);
}

// ── Classroom Members ──

async function joinClassroomMember(classroomId, studentId, studentName) {
  const memberObj = {
    id: crypto.randomUUID(),
    classroom_id: classroomId,
    student_id: studentId,
    student_name: studentName,
    joined_at: new Date().toISOString()
  };

  saveLocalMember(memberObj);

  try {
    const { data: existing } = await supabase
      .from('classroom_members')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (existing) return existing;

    const { data, error } = await supabase
      .from('classroom_members')
      .insert({ classroom_id: classroomId, student_id: studentId, student_name: studentName })
      .select()
      .single();
    
    if (!error && data) {
      saveLocalMember(data);
      return data;
    }
  } catch (err) {
    console.warn('Supabase member join notice:', err.message);
  }
  return memberObj;
}

export async function getClassroomMembers(classroomId) {
  let dbMembers = [];
  try {
    const { data, error } = await supabase
      .from('classroom_members')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('joined_at', { ascending: true });
    
    if (!error && data) {
      dbMembers = data;
    }
  } catch (err) {
    console.warn('Supabase members fetch notice:', err.message);
  }

  const localMembers = getLocalMembers(classroomId);
  
  // Combine db + local members without duplicates
  const map = new Map();
  dbMembers.forEach(m => map.set(m.student_id, m));
  localMembers.forEach(m => {
    if (!map.has(m.student_id)) map.set(m.student_id, m);
  });

  return Array.from(map.values());
}

// ── Experiments ──

export async function saveExperiment(studentId, domain, actions, finalState, score, aiReport, classroomId = null, feedback = null, liveTracking = null) {
  const liveTrackingData = liveTracking || aiReport?.liveTrackingSummary || null;
  const expObj = {
    id: crypto.randomUUID(),
    student_id: studentId,
    classroom_id: classroomId,
    domain,
    actions,
    final_state: finalState,
    score,
    ai_report: aiReport,
    feedback: feedback || aiReport,
    live_tracking: liveTrackingData,
    created_at: new Date().toISOString()
  };

  saveLocalExperiment(expObj);

  try {
    const insertData = {
      student_id: studentId,
      domain,
      actions,
      final_state: finalState,
      score,
      ai_report: aiReport,
      feedback: feedback || aiReport,
      live_tracking: liveTrackingData,
    };
    if (classroomId) insertData.classroom_id = classroomId;

    const { data, error } = await supabase
      .from('experiments')
      .insert(insertData)
      .select()
      .single();
    
    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase save notice:', err.message);
  }
  return expObj;
}

export async function saveChatLog(studentId, experimentId, message, role) {
  const logObj = {
    id: crypto.randomUUID(),
    student_id: studentId,
    experiment_id: experimentId,
    message,
    role,
    created_at: new Date().toISOString()
  };

  try {
    const localLogs = JSON.parse(localStorage.getItem('stepin_chat_logs') || '[]');
    localLogs.push(logObj);
    localStorage.setItem('stepin_chat_logs', JSON.stringify(localLogs));
  } catch (e) {
    console.warn('Failed to save chat log to localStorage:', e);
  }

  try {
    if (studentId) {
      await supabase.from('chat_logs').insert({
        student_id: studentId,
        experiment_id: experimentId,
        message,
        role
      });
    }
  } catch (err) {
    console.warn('Supabase chat log notice:', err.message);
  }
}

export async function getChatLogs(studentId) {
  try {
    const { data } = await supabase
      .from('chat_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });
    if (data && data.length > 0) return data;
  } catch (e) {}

  try {
    const local = JSON.parse(localStorage.getItem('stepin_chat_logs') || '[]');
    return studentId ? local.filter(l => l.student_id === studentId) : local;
  } catch (e) {
    return [];
  }
}

export async function getStudentExperiments(studentId) {
  let dbExps = [];
  try {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      dbExps = data;
    }
  } catch (err) {
    console.warn('Supabase fetch notice:', err.message);
  }

  const localExps = getLocalExperiments(null, studentId);
  const map = new Map();
  dbExps.forEach(e => map.set(e.id, e));
  localExps.forEach(e => {
    if (!map.has(e.id)) map.set(e.id, e);
  });

  return Array.from(map.values());
}

export async function getClassroomExperiments(classroomId) {
  let dbExps = [];
  try {
    const members = await getClassroomMembers(classroomId);
    if (members.length > 0) {
      const studentIds = members.map(m => m.student_id);
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        dbExps = data;
      }
    }
  } catch (err) {
    console.warn('Supabase classroom experiments fetch notice:', err.message);
  }

  const localExps = getLocalExperiments(classroomId);
  const map = new Map();
  dbExps.forEach(e => map.set(e.id, e));
  localExps.forEach(e => {
    if (!map.has(e.id)) map.set(e.id, e);
  });

  return Array.from(map.values());
}
