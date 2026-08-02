import React, { useEffect, useState, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { getClassroomMembers, getClassroomExperiments } from '../services/supabase';
import AILoader from './AILoader';
import {
  FlaskConical,
  Users,
  BarChart3,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  LogOut,
  School,
  Building2,
  Sparkles,
  TrendingUp,
  Zap,
  BookOpen,
  Award
} from 'lucide-react';

const SUBJECT_COLORS = [
  ['#6366f1', '#8b5cf6'],
  ['#06b6d4', '#0891b2'],
  ['#10b981', '#059669'],
  ['#f59e0b', '#d97706'],
  ['#f97316', '#ea580c'],
  ['#ec4899', '#db2777'],
];

function hashColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

export default function FacultyDashboard() {
  const setScreen = useGameStore((s) => s.setScreen);
  const studentName = useGameStore((s) => s.studentName);
  const classroom = useGameStore((s) => s.classroom);
  const [members, setMembers] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'analytics'
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (!classroom?.id) return;
    setLoading(true);
    try {
      const [membersData, experimentsData] = await Promise.all([
        getClassroomMembers(classroom.id),
        getClassroomExperiments(classroom.id),
      ]);
      setMembers(membersData);
      setExperiments(experimentsData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch classroom data:', err);
    }
    setLoading(false);
  }, [classroom?.id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const studentStats = members.map((member) => {
    const studentExps = experiments.filter(e => e.student_id === member.student_id);
    const chemExps = studentExps.filter(e => e.domain === 'chemistry');
    const physExps = studentExps.filter(e => e.domain === 'physics');
    const avgScore = studentExps.length > 0
      ? Math.round(studentExps.reduce((sum, e) => sum + (e.score || e.ai_report?.score || 0), 0) / studentExps.length)
      : null;

    return {
      ...member,
      totalExperiments: studentExps.length,
      chemistryDone: chemExps.length > 0,
      physicsDone: physExps.length > 0,
      chemistryCount: chemExps.length,
      physicsCount: physExps.length,
      avgScore,
      bestChemScore: chemExps.length > 0 ? Math.max(...chemExps.map(e => e.score || e.ai_report?.score || 0)) : null,
      bestPhysScore: physExps.length > 0 ? Math.max(...physExps.map(e => e.score || e.ai_report?.score || 0)) : null,
      experiments: studentExps,
    };
  });

  const totalStudents = members.length;
  const completedBoth = studentStats.filter(s => s.chemistryDone && s.physicsDone).length;
  const completedChem = studentStats.filter(s => s.chemistryDone).length;
  const completedPhys = studentStats.filter(s => s.physicsDone).length;
  const classAvg = studentStats.filter(s => s.avgScore !== null).length > 0
    ? Math.round(studentStats.filter(s => s.avgScore !== null).reduce((sum, s) => sum + s.avgScore, 0) / studentStats.filter(s => s.avgScore !== null).length)
    : 0;

  const scoreClass = (score) => score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const [clr1, clr2] = hashColor(classroom?.name);

  const handleCopy = () => {
    navigator.clipboard?.writeText(classroom?.code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const getStatusInfo = (student) => {
    if (student.chemistryDone && student.physicsDone) return { label: 'Complete', color: '#10b981', icon: <CheckCircle2 size={14} /> };
    if (student.totalExperiments > 0) return { label: 'In Progress', color: '#f59e0b', icon: <Clock size={14} /> };
    return { label: 'Not Started', color: '#64748b', icon: null };
  };

  return (
    <div className="fd-root" id="faculty-dashboard">
      {/* ── Sidebar ── */}
      <aside className="fd-sidebar">
        <div className="fd-sidebar-top">
          <div className="fd-brand">
            <span className="fd-brand-icon" style={{ color: '#8b5cf6', display: 'inline-flex' }}><FlaskConical size={22} /></span>
            <span className="fd-brand-name">VirtuLab</span>
          </div>
          <nav className="fd-nav">
            <button
              className={`fd-nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <Users size={18} /> Students
            </button>
            <button
              className={`fd-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={18} /> Analytics
            </button>
          </nav>
        </div>
        <div className="fd-sidebar-bottom">
          <div className="fd-user-info">
            <div className="fd-user-avatar">{getInitials(studentName)}</div>
            <div>
              <div className="fd-user-name">{studentName}</div>
              <div className="fd-user-role">Faculty</div>
            </div>
          </div>
          <button className="fd-logout-btn" onClick={() => setScreen('start')} id="logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="fd-main">
        {/* ── Top Header ── */}
        <header className="fd-header">
          <div className="fd-header-left">
            <h1 className="fd-header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <School size={24} style={{ color: '#818cf8' }} /> {classroom?.name || 'My Classroom'}
            </h1>
            <div className="fd-header-meta">
              <span className="fd-meta-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><School size={14} /> {studentName}</span>
              {lastRefresh && (
                <span className="fd-meta-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> {lastRefresh.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          <div className="fd-header-right">
            <button className="fd-refresh-btn" onClick={fetchData} disabled={loading} id="refresh-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </header>

        {/* ── Classroom Card (Google Classroom style) ── */}
        <div className="fd-classroom-card" style={{ background: `linear-gradient(135deg, ${clr1}, ${clr2})` }}>
          <div className="fd-classroom-card-bg" />
          <div className="fd-classroom-card-content">
            <div className="fd-classroom-card-top">
              <div>
                <div className="fd-cc-name">{classroom?.name || 'Virtual Lab'}</div>
                <div className="fd-cc-teacher" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <School size={16} /> {studentName}
                </div>
              </div>
              <div className="fd-cc-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><School size={36} /></div>
            </div>
            <div className="fd-classroom-card-bottom">
              <div className="fd-cc-code-section">
                <div className="fd-cc-code-label">Class Code</div>
                <div className="fd-cc-code">{classroom?.code || '------'}</div>
              </div>
              <button className="fd-copy-btn" onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="fd-stats-grid">
          <div className="fd-stat-card">
            <div className="fd-stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <div className="fd-stat-body">
              <div className="fd-stat-value">{totalStudents}</div>
              <div className="fd-stat-label">Total Students</div>
            </div>
          </div>
          <div className="fd-stat-card">
            <div className="fd-stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} />
            </div>
            <div className="fd-stat-body">
              <div className="fd-stat-value">{completedBoth}<span className="fd-stat-denom">/{totalStudents}</span></div>
              <div className="fd-stat-label">Completed Both</div>
            </div>
          </div>
          <div className="fd-stat-card">
            <div className="fd-stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={22} />
            </div>
            <div className="fd-stat-body">
              <div className="fd-stat-value">{completedChem}<span className="fd-stat-denom">/{totalStudents}</span></div>
              <div className="fd-stat-label">Chemistry Done</div>
            </div>
          </div>
          <div className="fd-stat-card">
            <div className="fd-stat-icon" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={22} />
            </div>
            <div className="fd-stat-body">
              <div className="fd-stat-value">{completedPhys}<span className="fd-stat-denom">/{totalStudents}</span></div>
              <div className="fd-stat-label">Physics Done</div>
            </div>
          </div>
          <div className="fd-stat-card">
            <div className="fd-stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} />
            </div>
            <div className="fd-stat-body">
              <div className="fd-stat-value">{classAvg}<span className="fd-stat-denom">/100</span></div>
              <div className="fd-stat-label">Class Average</div>
            </div>
          </div>
          <div className="fd-stat-card">
            <div className="fd-stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} />
            </div>
            <div className="fd-stat-body">
              <div className="fd-stat-value">{experiments.length}</div>
              <div className="fd-stat-label">Total Experiments</div>
            </div>
          </div>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'students' && (
          <div className="fd-tab-content">
            {/* Progress Section */}
            {totalStudents > 0 && (
              <div className="fd-progress-section">
                <div className="fd-section-title">Overall Completion</div>
                <div className="fd-progress-row">
                  <span className="fd-progress-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FlaskConical size={14} style={{ color: '#22d3ee' }} /> Chemistry</span>
                  <div className="fd-progress-track">
                    <div className="fd-progress-fill fd-chem" style={{ width: `${(completedChem / totalStudents) * 100}%` }} />
                  </div>
                  <span className="fd-progress-pct">{Math.round((completedChem / totalStudents) * 100)}%</span>
                </div>
                <div className="fd-progress-row">
                  <span className="fd-progress-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} style={{ color: '#fb923c' }} /> Physics</span>
                  <div className="fd-progress-track">
                    <div className="fd-progress-fill fd-phys" style={{ width: `${(completedPhys / totalStudents) * 100}%` }} />
                  </div>
                  <span className="fd-progress-pct">{Math.round((completedPhys / totalStudents) * 100)}%</span>
                </div>
              </div>
            )}

            {/* Student Cards Grid */}
            <div className="fd-section-title" style={{ marginBottom: '1rem' }}>
              Students ({totalStudents})
              {loading && <span className="fd-loading-dot" />}
            </div>

            {loading && totalStudents === 0 ? (
              <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                <AILoader label="Synchronizing Classroom Roster & AI Analytics..." />
              </div>
            ) : totalStudents === 0 ? (
              <div className="fd-empty-state">
                <div className="fd-empty-icon" style={{ display: 'flex', justifyContent: 'center', color: '#818cf8' }}><School size={48} /></div>
                <h3>No students yet</h3>
                <p>Share the code <strong className="fd-code-inline">{classroom?.code}</strong> with your students to let them join.</p>
              </div>
            ) : (
              <div className="fd-student-grid">
                {studentStats.map((student, i) => {
                  const status = getStatusInfo(student);
                  const isSelected = selectedStudent?.student_id === student.student_id;
                  return (
                    <div
                      key={student.id || i}
                      className={`fd-student-card ${isSelected ? 'fd-student-selected' : ''}`}
                      onClick={() => setSelectedStudent(isSelected ? null : student)}
                    >
                      <div className="fd-student-card-header">
                        <div className="fd-student-avatar" style={{ background: `linear-gradient(135deg, ${hashColor(student.student_name)[0]}, ${hashColor(student.student_name)[1]})` }}>
                          {getInitials(student.student_name)}
                        </div>
                        <div className="fd-student-info">
                          <div className="fd-student-name">{student.student_name}</div>
                          <div className="fd-student-experiments">{student.totalExperiments} experiment{student.totalExperiments !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="fd-student-status-dot" style={{ background: status.color }} title={status.label} />
                      </div>

                      <div className="fd-student-labs">
                        <div className={`fd-lab-pill ${student.chemistryDone ? 'done' : 'pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FlaskConical size={12} /> {student.chemistryDone ? `Chemistry ✓${student.chemistryCount > 1 ? ` (${student.chemistryCount})` : ''}` : 'Chemistry'}
                        </div>
                        <div className={`fd-lab-pill ${student.physicsDone ? 'done' : 'pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Zap size={12} /> {student.physicsDone ? `Physics ✓${student.physicsCount > 1 ? ` (${student.physicsCount})` : ''}` : 'Physics'}
                        </div>
                      </div>

                      <div className="fd-student-card-footer">
                        <span className="fd-status-badge" style={{ color: status.color, borderColor: status.color + '40', background: status.color + '15', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {status.icon} {status.label}
                        </span>
                        {student.avgScore !== null && (
                          <span className={`fd-score-badge ${scoreClass(student.avgScore)}`}>
                            {student.avgScore}/100
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expanded Student Detail */}
            {selectedStudent && (
              <div className="fd-detail-panel">
                <div className="fd-detail-header">
                  <div className="fd-student-avatar lg" style={{ background: `linear-gradient(135deg, ${hashColor(selectedStudent.student_name)[0]}, ${hashColor(selectedStudent.student_name)[1]})` }}>
                    {getInitials(selectedStudent.student_name)}
                  </div>
                  <div>
                    <div className="fd-detail-name">{selectedStudent.student_name}</div>
                    <div className="fd-detail-meta">{selectedStudent.totalExperiments} experiments · Avg: {selectedStudent.avgScore ?? '—'}/100</div>
                  </div>
                  <button className="fd-close-btn" onClick={() => setSelectedStudent(null)}>✕</button>
                </div>

                {selectedStudent.experiments.length === 0 ? (
                  <div className="fd-detail-empty">No experiments yet.</div>
                ) : (
                  <>
                    <div className="fd-exp-table-wrap">
                      <table className="fd-exp-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Domain</th>
                            <th>Score</th>
                            <th>Result</th>
                            <th>AI Summary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudent.experiments.map((exp, i) => {
                            const report = exp.ai_report || {};
                            const score = exp.score || report.score || 0;
                            return (
                              <tr key={exp.id || i}>
                                <td>{new Date(exp.created_at || Date.now()).toLocaleDateString()}</td>
                                <td>
                                  <span className={`fd-domain-tag ${exp.domain}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    {exp.domain === 'chemistry' ? <FlaskConical size={12} /> : <Zap size={12} />} {exp.domain}
                                  </span>
                                </td>
                                <td><span className={`fd-score-badge ${scoreClass(score)}`}>{score}</span></td>
                                <td>
                                  {report.correct ? (
                                    <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                      <CheckCircle2 size={14} /> Pass
                                    </span>
                                  ) : (
                                    <span style={{ color: '#f87171', fontWeight: 600 }}>Fail</span>
                                  )}
                                </td>
                                <td className="fd-summary-cell">{report.summary || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Strengths/Improvements */}
                    {(() => {
                      const latest = selectedStudent.experiments[0];
                      const report = latest?.ai_report;
                      if (!report) return null;
                      return (
                        <div className="fd-ai-insights">
                          <div className="fd-ai-card strengths">
                            <div className="fd-ai-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} /> Strengths</div>
                            <ul>
                              {(report.strengths || []).map((s, i) => <li key={i}>→ {s}</li>)}
                              {(!report.strengths || report.strengths.length === 0) && <li className="muted">—</li>}
                            </ul>
                          </div>
                          <div className="fd-ai-card improvements">
                            <div className="fd-ai-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={14} /> Areas to Improve</div>
                            <ul>
                              {(report.improvements || []).map((s, i) => <li key={i}>→ {s}</li>)}
                              {(!report.improvements || report.improvements.length === 0) && <li className="muted">—</li>}
                            </ul>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === 'analytics' && (
          <div className="fd-tab-content">
            <div className="fd-section-title">Class Performance Overview</div>
            <div className="fd-analytics-grid">
              {/* Score distribution */}
              <div className="fd-analytics-card">
                <div className="fd-analytics-card-title">Score Distribution</div>
                <div className="fd-score-dist">
                  {['high', 'medium', 'low'].map(level => {
                    const count = studentStats.filter(s => s.avgScore !== null && scoreClass(s.avgScore) === level).length;
                    const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                    const colors = { high: '#10b981', medium: '#f59e0b', low: '#ef4444' };
                    const labels = { high: '70-100 (Good)', medium: '40-69 (Average)', low: '0-39 (Needs Help)' };
                    return (
                      <div key={level} className="fd-dist-row">
                        <span className="fd-dist-label" style={{ color: colors[level] }}>{labels[level]}</span>
                        <div className="fd-dist-track">
                          <div className="fd-dist-fill" style={{ width: `${pct}%`, background: colors[level] }} />
                        </div>
                        <span className="fd-dist-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Performers */}
              <div className="fd-analytics-card">
                <div className="fd-analytics-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={16} style={{ color: '#fbbf24' }} /> Top Performers</div>
                {studentStats
                  .filter(s => s.avgScore !== null)
                  .sort((a, b) => b.avgScore - a.avgScore)
                  .slice(0, 5)
                  .map((s, i) => (
                    <div key={s.student_id || i} className="fd-top-row">
                      <span className="fd-top-rank">#{i + 1}</span>
                      <div className="fd-student-avatar sm" style={{ background: `linear-gradient(135deg, ${hashColor(s.student_name)[0]}, ${hashColor(s.student_name)[1]})` }}>
                        {getInitials(s.student_name)}
                      </div>
                      <span className="fd-top-name">{s.student_name}</span>
                      <span className={`fd-score-badge ${scoreClass(s.avgScore)}`}>{s.avgScore}</span>
                    </div>
                  ))}
                {studentStats.filter(s => s.avgScore !== null).length === 0 && (
                  <div className="fd-detail-empty">No scores yet.</div>
                )}
              </div>

              {/* Engagement */}
              <div className="fd-analytics-card">
                <div className="fd-analytics-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart3 size={16} style={{ color: '#818cf8' }} /> Engagement Summary</div>
                <div className="fd-engagement-list">
                  <div className="fd-eng-row">
                    <span>Active Students</span>
                    <strong>{studentStats.filter(s => s.totalExperiments > 0).length}/{totalStudents}</strong>
                  </div>
                  <div className="fd-eng-row">
                    <span>Total Experiments</span>
                    <strong>{experiments.length}</strong>
                  </div>
                  <div className="fd-eng-row">
                    <span>Chemistry Sessions</span>
                    <strong>{experiments.filter(e => e.domain === 'chemistry').length}</strong>
                  </div>
                  <div className="fd-eng-row">
                    <span>Physics Sessions</span>
                    <strong>{experiments.filter(e => e.domain === 'physics').length}</strong>
                  </div>
                  <div className="fd-eng-row">
                    <span>Both Labs Complete</span>
                    <strong>{completedBoth}/{totalStudents}</strong>
                  </div>
                  <div className="fd-eng-row">
                    <span>Class Average Score</span>
                    <strong>{classAvg}/100</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
