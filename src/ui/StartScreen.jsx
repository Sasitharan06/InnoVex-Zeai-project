import React, { useState } from 'react';
import useGameStore from '../store/gameStore';
import { createStudent, createClassroom, getClassroomByCode, loginStudent, loginFaculty } from '../services/supabase';
import {
  FlaskConical,
  Zap,
  Sparkles,
  Microscope,
  School,
  BarChart3,
  GraduationCap,
  KeyRound,
  Users,
  Radio,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  UserCheck,
  UserPlus
} from 'lucide-react';

export default function StartScreen() {
  // 'role' | 'student-login' | 'student-signup' | 'faculty-login' | 'faculty-signup'
  const [step, setStepState] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/signup') return 'student-signup';
      if (path === '/login') return 'student-login';
    }
    return 'role';
  });

  const setStep = (newStep) => {
    setStepState(newStep);
    if (typeof window !== 'undefined') {
      let targetPath = '/login';
      if (newStep === 'student-signup' || newStep === 'faculty-signup') targetPath = '/signup';
      else if (newStep === 'student-login' || newStep === 'faculty-login') targetPath = '/login';
      else targetPath = '/login';

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ screen: 'start' }, '', targetPath);
      }
    }
  };
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classroomCode, setClassroomCode] = useState('');
  const [classroomName, setClassroomName] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setScreen = useGameStore((s) => s.setScreen);
  const setStudent = useGameStore((s) => s.setStudent);
  const setRole = useGameStore((s) => s.setRole);
  const setClassroom = useGameStore((s) => s.setClassroom);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setClassroomCode('');
    setClassroomName('');
    setSubject('');
    setError('');
  };

  // ── Student Login (Email & Password) ──
  const handleStudentLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { student, classroom } = await loginStudent(email.trim(), password);
      setStudent(student.name, student.id);
      setRole('student');
      if (classroom) setClassroom(classroom);
      setScreen('dashboard'); // Takes student directly to Student Portal Dashboard!
    } catch (err) {
      console.error(err);
      setError('Invalid login details. Please try again.');
      setLoading(false);
    }
  };

  // ── Student Sign Up (Register) ──
  const handleStudentSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please enter your full name, email, and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let classroom = null;
      if (classroomCode.trim()) {
        classroom = await getClassroomByCode(classroomCode.trim().toUpperCase());
      }
      const student = await createStudent(name.trim(), classroom?.id || null, email.trim());
      setStudent(student.name, student.id);
      setRole('student');
      if (classroom) setClassroom(classroom);
      setScreen('dashboard'); // Student Portal Dashboard
    } catch (err) {
      console.error(err);
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  // ── Faculty: Login (Email & Password) ──
  const handleFacultyLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { faculty, classroom } = await loginFaculty(email.trim(), password);
      setStudent(faculty.name, faculty.id);
      setRole('faculty');
      if (classroom) setClassroom(classroom);
      setScreen('faculty-dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Please try again.');
      setLoading(false);
    }
  };

  // ── Faculty: Sign Up (Create Account & Classroom) ──
  const handleFacultySignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please enter your name, email, and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const facultyId = 'fac-' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const clsTitle = classroomName.trim() ? (subject.trim() ? `${classroomName.trim()} — ${subject.trim()}` : classroomName.trim()) : `${name.trim()}'s Science Lab`;
      const classroom = await createClassroom(clsTitle, name.trim(), facultyId);
      
      setStudent(name.trim(), facultyId);
      setRole('faculty');
      setClassroom(classroom);
      setScreen('faculty-dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to create classroom. Try again.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (step === 'student-login') handleStudentLogin();
      if (step === 'student-signup') handleStudentSignup();
      if (step === 'faculty-login') handleFacultyLogin();
      if (step === 'faculty-signup') handleFacultySignup();
    }
  };

  // Panel content
  const leftContent = {
    'role': {
      title: 'ZeAI Lab',
      subtitle: 'Virtual Laboratory Simulator',
      desc: 'Experience hands-on science experiments powered by AI in an immersive 3D virtual environment.',
      img: '/hero_3d_lab.png',
      badges: [
        { icon: <FlaskConical size={14} />, text: 'Chemistry' },
        { icon: <Zap size={14} />, text: 'Physics' },
        { icon: <Sparkles size={14} />, text: 'AI Reports' }
      ],
    },
    'student-login': {
      title: 'Student\nPortal',
      subtitle: 'Welcome back to ZeAI Lab',
      desc: 'Sign in to access your student dashboard, view enrolled classrooms, and enter the 3D lab.',
      img: '/hero_3d_lab.png',
      badges: [
        { icon: <Microscope size={14} />, text: '3D Labs' },
        { icon: <School size={14} />, text: 'Classroom' },
        { icon: <BarChart3 size={14} />, text: 'AI Reports' }
      ],
    },
    'student-signup': {
      title: 'Student\nRegistration',
      subtitle: 'Create your Student Account',
      desc: 'Register your student account to get instant access to 3D virtual labs and join your teacher\'s classroom.',
      img: '/hero_3d_lab.png',
      badges: [
        { icon: <GraduationCap size={14} />, text: 'Student Profile' },
        { icon: <KeyRound size={14} />, text: 'Easy Join' },
        { icon: <Zap size={14} />, text: 'Virtual Labs' }
      ],
    },
    'faculty-login': {
      title: 'Teacher\nPortal',
      subtitle: 'Access your Faculty Portal',
      desc: 'Log into your teacher account to manage classrooms, track student progress, and inspect AI analytics.',
      img: '/teacher_3d_card.png',
      badges: [
        { icon: <BarChart3 size={14} />, text: 'AI Analytics' },
        { icon: <Users size={14} />, text: 'Student Roster' },
        { icon: <School size={14} />, text: 'Classrooms' }
      ],
    },
    'faculty-signup': {
      title: 'Teacher\nRegistration',
      subtitle: 'Register Teacher Account',
      desc: 'Set up your teacher account and launch a virtual lab classroom with live student monitoring.',
      img: '/teacher_3d_card.png',
      badges: [
        { icon: <School size={14} />, text: 'Class Setup' },
        { icon: <KeyRound size={14} />, text: 'Unique Code' },
        { icon: <Radio size={14} />, text: 'Live Reports' }
      ],
    },
  };

  const panel = leftContent[step] || leftContent['role'];

  return (
    <div className="auth-page">
      {/* Left Illustration Panel */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <div className="auth-brand-logo">
              <span className="auth-brand-icon" style={{ display: 'inline-flex', color: '#818cf8' }}><FlaskConical size={24} /></span>
              <span className="auth-brand-name">ZeAI</span>
            </div>
            <div className="auth-brand-tagline">Virtual Lab Platform</div>
          </div>

          <div className="auth-hero-text">
            <h1 className="auth-hero-title">{panel.title}</h1>
            <p className="auth-hero-subtitle">{panel.subtitle}</p>
            <p className="auth-hero-desc">{panel.desc}</p>
          </div>

          <div className="auth-left-img-wrap">
            <img src={panel.img} alt="Lab Illustration" className="auth-hero-img" />
          </div>

          <div className="auth-badges">
            {panel.badges.map((b, i) => (
              <span key={i} className="auth-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {b.icon} {b.text}
              </span>
            ))}
          </div>

          <div className="auth-made-in">
            <span style={{ color: '#6366f1', fontWeight: 700 }}>#MadeInIndia</span> — ZeAI Hackathon 2026
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* ── Step 1: Role Selection ── */}
          {step === 'role' && (
            <div className="auth-form-inner">
              <div className="auth-form-header">
                <h2 className="auth-form-title">Welcome to ZeAI Lab</h2>
                <p className="auth-form-desc">Select your role to log in or create an account</p>
              </div>

              <div className="role-cards">
                <button className="role-card student-card" onClick={() => { resetForm(); setStep('student-login'); }} id="role-student-btn">
                  <div className="role-card-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GraduationCap size={26} />
                  </div>
                  <div className="role-card-content">
                    <div className="role-card-title">Student Portal</div>
                    <div className="role-card-desc">Log in with email & password to access lab & classrooms</div>
                  </div>
                  <div className="role-card-arrow" style={{ display: 'flex', alignItems: 'center' }}><ArrowRight size={18} /></div>
                </button>

                <button className="role-card faculty-card" onClick={() => { resetForm(); setStep('faculty-login'); }} id="role-faculty-btn">
                  <div className="role-card-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <School size={26} />
                  </div>
                  <div className="role-card-content">
                    <div className="role-card-title">Teacher / Faculty Portal</div>
                    <div className="role-card-desc">Log in to view classrooms, AI analytics & student progress</div>
                  </div>
                  <div className="role-card-arrow" style={{ display: 'flex', alignItems: 'center' }}><ArrowRight size={18} /></div>
                </button>
              </div>

              <div className="auth-divider">
                <span>Powered by ZeAI + Supabase</span>
              </div>
              <div className="auth-footer-note" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: '#10b981' }} /> Secure Virtual Science Simulator
              </div>
            </div>
          )}


          {/* ── Step 2a: Student Login (Email + Password) ── */}
          {step === 'student-login' && (
            <div className="auth-form-inner">
              <button className="auth-back-btn" onClick={() => { setStep('role'); setError(''); }}>
                <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Roles
              </button>

              {/* Mode Toggle Bar */}
              <div className="auth-tabs">
                <button className="auth-tab active">Log In</button>
                <button className="auth-tab" onClick={() => { resetForm(); setStep('student-signup'); }}>Sign Up</button>
              </div>

              <div className="auth-form-header">
                <div className="auth-role-chip student-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={16} /> Student Login
                </div>
                <h2 className="auth-form-title">Log In to Student Account</h2>
                <p className="auth-form-desc">Enter your student credentials</p>
              </div>

              <div className="auth-field">
                <label htmlFor="student-login-email" className="auth-label">Student Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Mail size={18} /></span>
                  <input
                    id="student-login-email"
                    type="email"
                    className="auth-input"
                    placeholder="e.g. sasi@student.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="student-login-password" className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Lock size={18} /></span>
                  <input
                    id="student-login-password"
                    type="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                className="auth-btn auth-btn-primary"
                onClick={handleStudentLogin}
                disabled={!email.trim() || !password.trim() || loading}
                id="student-enter-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? <><span className="btn-spinner" /> Logging in...</> : <><Microscope size={18} /> Log In to Dashboard</>}
              </button>

              <div className="auth-or">
                <span>Don't have an account?</span>
              </div>

              <button
                className="auth-btn auth-btn-ghost"
                onClick={() => { resetForm(); setStep('student-signup'); }}
                id="goto-student-signup-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Sparkles size={16} /> Create New Student Account
              </button>
            </div>
          )}

          {/* ── Step 2b: Student Sign Up ── */}
          {step === 'student-signup' && (
            <div className="auth-form-inner">
              <button className="auth-back-btn" onClick={() => { setStep('role'); setError(''); }}>
                <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Roles
              </button>

              {/* Mode Toggle Bar */}
              <div className="auth-tabs">
                <button className="auth-tab" onClick={() => { resetForm(); setStep('student-login'); }}>Log In</button>
                <button className="auth-tab active">Sign Up</button>
              </div>

              <div className="auth-form-header">
                <div className="auth-role-chip student-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> Student Sign Up
                </div>
                <h2 className="auth-form-title">Create Student Account</h2>
                <p className="auth-form-desc">Register your student account</p>
              </div>

              <div className="auth-field">
                <label htmlFor="student-signup-name" className="auth-label">Full Name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><User size={18} /></span>
                  <input
                    id="student-signup-name"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Sasi Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="student-signup-email" className="auth-label">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Mail size={18} /></span>
                  <input
                    id="student-signup-email"
                    type="email"
                    className="auth-input"
                    placeholder="e.g. sasi@student.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="student-signup-password" className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Lock size={18} /></span>
                  <input
                    id="student-signup-password"
                    type="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="student-signup-code" className="auth-label">Classroom Code <span className="optional-tag">(optional — can join inside portal)</span></label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><KeyRound size={18} /></span>
                  <input
                    id="student-signup-code"
                    type="text"
                    className="auth-input code-input"
                    placeholder="e.g. XK7P2M"
                    value={classroomCode}
                    onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    maxLength={6}
                  />
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                className="auth-btn auth-btn-primary"
                onClick={handleStudentSignup}
                disabled={!name.trim() || !email.trim() || !password.trim() || loading}
                id="student-signup-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? <><span className="btn-spinner" /> Creating Account...</> : <><GraduationCap size={18} /> Register Account</>}
              </button>

              <div className="auth-or">
                <span>Already registered?</span>
              </div>

              <button
                className="auth-btn auth-btn-ghost"
                onClick={() => { resetForm(); setStep('student-login'); }}
                id="goto-student-login-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <KeyRound size={16} /> Log In to Existing Account
              </button>
            </div>
          )}

          {/* ── Step 3a: Faculty Login (Email + Password) ── */}
          {step === 'faculty-login' && (
            <div className="auth-form-inner">
              <button className="auth-back-btn" onClick={() => { setStep('role'); setError(''); }}>
                <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Roles
              </button>

              {/* Mode Toggle Bar */}
              <div className="auth-tabs">
                <button className="auth-tab active">Log In</button>
                <button className="auth-tab" onClick={() => { resetForm(); setStep('faculty-signup'); }}>Sign Up</button>
              </div>

              <div className="auth-form-header">
                <div className="auth-role-chip faculty-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <School size={16} /> Teacher Login
                </div>
                <h2 className="auth-form-title">Teacher Account Login</h2>
                <p className="auth-form-desc">Enter your faculty credentials</p>
              </div>

              <div className="auth-field">
                <label htmlFor="faculty-login-email" className="auth-label">Teacher Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Mail size={18} /></span>
                  <input
                    id="faculty-login-email"
                    type="email"
                    className="auth-input"
                    placeholder="e.g. prof.nair@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="faculty-login-password" className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Lock size={18} /></span>
                  <input
                    id="faculty-login-password"
                    type="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                className="auth-btn auth-btn-faculty"
                onClick={handleFacultyLogin}
                disabled={!email.trim() || !password.trim() || loading}
                id="faculty-login-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? <><span className="btn-spinner" /> Logging in...</> : <><BarChart3 size={18} /> Open Teacher Dashboard</>}
              </button>

              <div className="auth-or">
                <span>New teacher?</span>
              </div>

              <button
                className="auth-btn auth-btn-ghost"
                onClick={() => { resetForm(); setStep('faculty-signup'); }}
                id="faculty-signup-nav-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <UserPlus size={16} /> Register New Teacher Account
              </button>
            </div>
          )}

          {/* ── Step 3b: Faculty Sign Up ── */}
          {step === 'faculty-signup' && (
            <div className="auth-form-inner">
              <button className="auth-back-btn" onClick={() => { setStep('role'); setError(''); }}>
                <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Roles
              </button>

              {/* Mode Toggle Bar */}
              <div className="auth-tabs">
                <button className="auth-tab" onClick={() => { resetForm(); setStep('faculty-login'); }}>Log In</button>
                <button className="auth-tab active">Sign Up</button>
              </div>

              <div className="auth-form-header">
                <div className="auth-role-chip faculty-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> Teacher Registration
                </div>
                <h2 className="auth-form-title">Create Teacher Account</h2>
                <p className="auth-form-desc">Register teacher account & classroom</p>
              </div>

              <div className="auth-field">
                <label htmlFor="faculty-signup-name" className="auth-label">Full Name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><User size={18} /></span>
                  <input
                    id="faculty-signup-name"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Prof. Meera Nair"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="faculty-signup-email" className="auth-label">Teacher Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Mail size={18} /></span>
                  <input
                    id="faculty-signup-email"
                    type="email"
                    className="auth-input"
                    placeholder="e.g. meera@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="faculty-signup-password" className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Lock size={18} /></span>
                  <input
                    id="faculty-signup-password"
                    type="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="classroom-name" className="auth-label">Classroom Name <span className="optional-tag">(optional)</span></label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><School size={18} /></span>
                  <input
                    id="classroom-name"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Class 11-A, Physics Section"
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                className="auth-btn auth-btn-faculty"
                onClick={handleFacultySignup}
                disabled={!name.trim() || !email.trim() || !password.trim() || loading}
                id="create-classroom-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? <><span className="btn-spinner" /> Registering...</> : <><School size={18} /> Register & Create Teacher Portal</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

