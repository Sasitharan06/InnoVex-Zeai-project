const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient(token) {
  return createClient(
    process.env.VITE_SUPABASE_URL || 'https://xtvzwmkfwxqxyyxarcql.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}

function generateClassroomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ── CLASSROOMS ──

router.post('/classrooms', requireAuth, requireRole(['faculty']), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Classroom name is required.' });

    const code = generateClassroomCode();
    const supabase = getSupabaseClient(req.token);

    const { data, error } = await supabase
      .from('classrooms')
      .insert([{
        name: name.trim(),
        code: code,
        faculty_name: req.user.full_name,
        faculty_id: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Create Classroom Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/classrooms/faculty', requireAuth, requireRole(['faculty']), async (req, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('faculty_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/classrooms/join', requireAuth, requireRole(['student']), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required.' });

    const supabase = getSupabaseClient(req.token);
    
    // Using service role or letting students read classrooms based on code?
    // Assuming classrooms table allows reading by code
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (classroomError || !classroom) {
      return res.status(404).json({ error: 'Classroom not found.' });
    }
    
    // Check if already a member
    const { data: existing } = await supabase
      .from('classroom_members')
      .select('id')
      .eq('classroom_id', classroom.id)
      .eq('student_id', req.user.id)
      .single();

    if (!existing) {
      const { error: insertError } = await supabase
        .from('classroom_members')
        .insert([{
          classroom_id: classroom.id,
          student_id: req.user.id,
          student_name: req.user.full_name
        }]);
      if (insertError) throw insertError;
    }

    res.json(classroom);
  } catch (error) {
    console.error('Join Classroom Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/classrooms/student', requireAuth, requireRole(['student']), async (req, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    
    const { data: member, error: memberError } = await supabase
      .from('classroom_members')
      .select('classroom_id')
      .eq('student_id', req.user.id)
      .limit(1)
      .single();
      
    if (memberError || !member) return res.json(null);

    const { data: classroom, error: clsError } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', member.classroom_id)
      .single();

    if (clsError) throw clsError;
    res.json(classroom || null);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/classrooms/:classroomId/members', requireAuth, requireRole(['faculty']), async (req, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    
    // Verify faculty owns this classroom
    const { data: cls } = await supabase
      .from('classrooms')
      .select('id')
      .eq('id', req.params.classroomId)
      .eq('faculty_id', req.user.id)
      .single();
      
    if (!cls) return res.status(403).json({ error: 'Forbidden' });

    const { data, error } = await supabase
      .from('classroom_members')
      .select('*')
      .eq('classroom_id', req.params.classroomId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── EXPERIMENTS ──

router.post('/experiments', requireAuth, requireRole(['student']), async (req, res) => {
  try {
    const { domain, actions, final_state, score, ai_report, classroom_id } = req.body;
    const supabase = getSupabaseClient(req.token);

    const { data, error } = await supabase
      .from('experiments')
      .insert([{
        student_id: req.user.id,
        classroom_id: classroom_id || null,
        domain: domain,
        actions: actions, // Supabase automatically handles JSON fields
        final_state: final_state,
        score: score,
        ai_report: ai_report
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Save Exp Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/experiments/student', requireAuth, requireRole(['student']), async (req, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('student_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/classrooms/:classroomId/experiments', requireAuth, requireRole(['faculty']), async (req, res) => {
  try {
    const supabase = getSupabaseClient(req.token);
    
    // Verify faculty owns this classroom
    const { data: cls } = await supabase
      .from('classrooms')
      .select('id')
      .eq('id', req.params.classroomId)
      .eq('faculty_id', req.user.id)
      .single();
      
    if (!cls) return res.status(403).json({ error: 'Forbidden' });

    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('classroom_id', req.params.classroomId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
