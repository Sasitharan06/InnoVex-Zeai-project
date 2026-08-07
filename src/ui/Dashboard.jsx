import React, { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';
import { getStudentExperiments, joinClassroom, logout } from '../services/api';
import AILoader from './AILoader';
import {
  FlaskConical,
  Zap,
  BarChart3,
  School,
  Microscope,
  LogOut,
  Rocket,
  Award,
  CheckCircle2,
  XCircle,
  KeyRound,
  GraduationCap,
  User,
  Sparkles,
  Check
} from 'lucide-react';

export default function Dashboard() {
  const setScreen = useGameStore((s) => s.setScreen);
  const studentName = useGameStore((s) => s.studentName);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);
  const setClassroom = useGameStore((s) => s.setClassroom);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const experiments = useGameStore((s) => s.experiments);
  const setExperiments = useGameStore((s) => s.setExperiments);

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'classroom' | 'labs'
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function fetchExperiments() {
      try {
        if (studentId) {
          const data = await getStudentExperiments(studentId);
          if (data && data.length > 0) setExperiments(data);
        }
      } catch (err) {
        console.warn('Could not fetch experiments:', err.message);
      }
      setLoading(false);
    }
    fetchExperiments();
  }, [studentId]);

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) {
      setJoinError('Please enter a 6-character classroom code');
      return;
    }
    setJoining(true);
    setJoinError('');
    setJoinSuccess('');
    try {
      const cls = await joinClassroom(joinCode.trim().toUpperCase());
      setClassroom(cls);
      setJoinSuccess(`Successfully joined ${cls.name}!`);
      setJoinCode('');
    } catch (err) {
      console.error(err);
      setJoinError(err.message || 'Failed to join classroom. Please try again.');
    }
    setJoining(false);
  };

  const launchLab = (roomType) => {
    setCurrentRoom(roomType);
    setScreen('lab');
  };

  const avgScore = experiments.length > 0
    ? Math.round(experiments.reduce((sum, e) => sum + (e.score || (e.ai_report?.score) || 0), 0) / experiments.length)
    : 0;

  const chemCount = experiments.filter(e => e.domain === 'chemistry').length;
  const physCount = experiments.filter(e => e.domain === 'physics').length;

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'ST';

  return (
    <div className="fd-root" id="student-portal">
      {/* ── Sidebar ── */}
      <aside className="fd-sidebar">
        <div className="fd-sidebar-top">
          <div className="fd-brand">
            <span className="fd-brand-icon" style={{ color: '#8b5cf6', display: 'inline-flex' }}><FlaskConical size={22} /></span>
            <span className="fd-brand-name">StepIn</span>
          </div>
          <nav className="fd-nav">
            <button
              className={`fd-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 size={18} /> Dashboard
            </button>
            <button
              className={`fd-nav-item ${activeTab === 'classroom' ? 'active' : ''}`}
              onClick={() => setActiveTab('classroom')}
            >
              <School size={18} /> My Classroom
            </button>
            <button
              className={`fd-nav-item ${activeTab === 'labs' ? 'active' : ''}`}
              onClick={() => setActiveTab('labs')}
            >
              <Microscope size={18} /> Virtual Labs
            </button>
          </nav>
        </div>

        <div className="fd-sidebar-bottom">
          <div className="fd-user-info">
            <div className="fd-user-avatar">{getInitials(studentName)}</div>
            <div>
              <div className="fd-user-name">{studentName || 'Student'}</div>
              <div className="fd-user-role">Student Portal</div>
            </div>
          </div>
          <button className="fd-logout-btn" onClick={async () => { await logout(); setScreen('start'); }} id="logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="fd-main">
        {/* Header */}
        <header className="fd-header">
          <div>
            <h1 className="fd-header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeTab === 'dashboard' && <><BarChart3 size={24} style={{ color: '#818cf8' }} /> My Learning Dashboard</>}
              {activeTab === 'classroom' && <><School size={24} style={{ color: '#22d3ee' }} /> Classroom & Course</>}
              {activeTab === 'labs' && <><Microscope size={24} style={{ color: '#34d399' }} /> 3D Virtual Science Labs</>}
            </h1>
            <div className="fd-header-meta">
              <span className="fd-meta-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><GraduationCap size={14} /> {studentName || 'Student'}</span>
              {classroom && <span className="fd-meta-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><School size={14} /> {classroom.name}</span>}
            </div>
          </div>
          <button className="auth-btn auth-btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => launchLab('hallway')}>
            <Rocket size={18} /> Enter 3D Lab
          </button>
        </header>


        {/* ── TAB 1: DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="fd-tab-content">
            <div className="fd-stats-grid">
              <div className="fd-stat-card">
                <div className="fd-stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Microscope size={22} />
                </div>
                <div className="fd-stat-body">
                  <div className="fd-stat-value">{experiments.length}</div>
                  <div className="fd-stat-label">Experiments Completed</div>
                </div>
              </div>
              <div className="fd-stat-card">
                <div className="fd-stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={22} />
                </div>
                <div className="fd-stat-body">
                  <div className="fd-stat-value">{avgScore}<span className="fd-stat-denom">/100</span></div>
                  <div className="fd-stat-label">Average Score</div>
                </div>
              </div>
              <div className="fd-stat-card">
                <div className="fd-stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FlaskConical size={22} />
                </div>
                <div className="fd-stat-body">
                  <div className="fd-stat-value">{chemCount}</div>
                  <div className="fd-stat-label">Chemistry Labs</div>
                </div>
              </div>
              <div className="fd-stat-card">
                <div className="fd-stat-icon" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={22} />
                </div>
                <div className="fd-stat-body">
                  <div className="fd-stat-value">{physCount}</div>
                  <div className="fd-stat-label">Physics Labs</div>
                </div>
              </div>
            </div>

            {/* Experiment History */}
            <div className="fd-section-title" style={{ marginTop: '0.5rem' }}>Experiment History & AI Reports</div>
            <div className="fd-exp-table-wrap">
              {loading ? (
                <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                  <AILoader label="Retrieving AI Experiment Reports..." />
                </div>
              ) : experiments.length === 0 ? (
                <div className="fd-empty-state">
                  <div className="fd-empty-icon" style={{ color: '#818cf8', display: 'flex', justifyContent: 'center' }}><Microscope size={48} /></div>
                  <h3>No experiments completed yet</h3>
                  <p>Go to the Virtual Labs section to perform your first experiment!</p>
                  <button className="auth-btn auth-btn-primary" style={{ width: 'auto', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => setActiveTab('labs')}>
                    <Rocket size={18} /> Launch Virtual Lab
                  </button>
                </div>
              ) : (
                <table className="fd-exp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Domain</th>
                      <th>Score</th>
                      <th>Result</th>
                      <th>AI Performance Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experiments.map((exp, i) => {
                      const report = exp.ai_report || {};
                      const score = exp.score || report.score || 0;
                      const scoreClass = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
                      return (
                        <tr key={exp.id || i}>
                          <td>{new Date(exp.created_at || Date.now()).toLocaleDateString()}</td>
                          <td>
                            <span className={`fd-domain-tag ${exp.domain}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {exp.domain === 'chemistry' ? <FlaskConical size={12} /> : <Zap size={12} />} {exp.domain}
                            </span>
                          </td>
                          <td>
                            <span className={`fd-score-badge ${scoreClass}`}>{score}</span>
                          </td>
                          <td>
                            {report.correct ? (
                              <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <CheckCircle2 size={16} /> Pass
                              </span>
                            ) : (
                              <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <XCircle size={16} /> Fail
                              </span>
                            )}
                          </td>
                          <td className="fd-summary-cell">
                            {report.summary || 'Completed experiment session.'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: MY CLASSROOM ── */}
        {activeTab === 'classroom' && (
          <div className="fd-tab-content">
            {classroom ? (
              <div className="fd-classroom-card" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <div className="fd-classroom-card-bg" />
                <div className="fd-classroom-card-content">
                  <div className="fd-classroom-card-top">
                    <div>
                      <div className="fd-cc-name">{classroom.name}</div>
                      <div className="fd-cc-teacher" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <School size={16} /> Faculty: {classroom.faculty_name || 'Prof. Sharma'}
                      </div>
                    </div>
                    <div className="fd-cc-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><School size={36} /></div>
                  </div>
                  <div className="fd-classroom-card-bottom">
                    <div className="fd-cc-code-section">
                      <div className="fd-cc-code-label">Classroom Code</div>
                      <div className="fd-cc-code">{classroom.code}</div>
                    </div>
                    <span className="fd-status-badge completed" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Enrolled
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fd-analytics-card" style={{ padding: '2rem' }}>
                <div className="fd-section-title">Join a Classroom</div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: '0.5rem 0 1rem' }}>
                  Enter the 6-character code provided by your teacher to connect your lab results to your teacher's dashboard.
                </p>

                <div className="auth-field" style={{ maxWidth: '350px' }}>
                  <label className="auth-label">6-Digit Code</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><KeyRound size={18} /></span>
                    <input
                      type="text"
                      className="auth-input code-input"
                      placeholder="e.g. XK7P2M"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                </div>

                {joinError && <div className="auth-error" style={{ marginTop: '0.75rem', maxWidth: '350px' }}>{joinError}</div>}
                {joinSuccess && <div className="auth-info-box" style={{ marginTop: '0.75rem', maxWidth: '350px', background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' }}>{joinSuccess}</div>}

                <button
                  className="auth-btn auth-btn-primary"
                  style={{ width: 'auto', marginTop: '1rem', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleJoinClassroom}
                  disabled={!joinCode.trim() || joining}
                >
                  <School size={18} /> {joining ? 'Joining...' : 'Join Classroom'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: VIRTUAL LABS ── */}
        {activeTab === 'labs' && (
          <div className="fd-tab-content">
            <div className="fd-section-title">Choose Virtual Laboratory</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
              {/* Chemistry Lab Card */}
              <div className="fd-student-card lab-card-3d" style={{ padding: '0', overflow: 'hidden', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <div className="lab-card-img-wrap">
                  <img src="/chemistry_3d_card.png" alt="Chemistry Titration Lab" className="lab-card-img" />
                  <span className="lab-card-badge chem" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FlaskConical size={14} /> Chemistry
                  </span>
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>Chemistry Titration Lab</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Perform acid-base titration, add phenolphthalein indicator, measure volume added, and analyze equivalence point using AI.
                  </p>
                  <button className="auth-btn auth-btn-primary" style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => launchLab('chemistry')}>
                    <FlaskConical size={18} /> Launch Chemistry Lab
                  </button>
                </div>
              </div>

              {/* Physics Lab Card */}
              <div className="fd-student-card lab-card-3d" style={{ padding: '0', overflow: 'hidden', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <div className="lab-card-img-wrap">
                  <img src="/physics_3d_card.png" alt="Physics Circuit Lab" className="lab-card-img" />
                  <span className="lab-card-badge phys" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={14} /> Physics
                  </span>
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>Physics Circuit Lab</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Assemble electronic components into a slot breadboard, connect battery & switch, verify current flow, and turn on the LED.
                  </p>
                  <button className="auth-btn auth-btn-faculty" style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => launchLab('physics')}>
                    <Zap size={18} /> Launch Physics Lab
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

