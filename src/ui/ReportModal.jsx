import React from 'react';
import useGameStore from '../store/gameStore';

export default function ReportModal() {
  const showReport = useGameStore((s) => s.showReport);
  const report = useGameStore((s) => s.currentReport);
  const closeReport = useGameStore((s) => s.closeReport);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!showReport || !report) return null;

  const scoreClass = report.score >= 70 ? 'high' : report.score >= 40 ? 'medium' : 'low';
  const wrongList = report.what_went_wrong || [];
  const rightList = report.what_went_right || report.strengths || [];
  const recommendation = report.recommendation || report.next_suggested_experiment;
  const encouragement = report.encouragement;

  // Robust array normalization for Feedback and Improvements
  const feedbackList = Array.isArray(report.feedback)
    ? report.feedback
    : (typeof report.feedback === 'string' && report.feedback ? [report.feedback] : rightList);

  const improvementList = Array.isArray(report.improvement_suggestions)
    ? report.improvement_suggestions
    : (Array.isArray(report.improvements) ? report.improvements : (recommendation ? [recommendation] : []));

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeReport()}>
      <div className="report-modal" id="report-modal">
        <h2>Lab Report — AI Assessment & Guidance</h2>
        <div className="report-domain">
          {report.domain === 'chemistry' ? '🧪 Chemistry' : '⚡ Physics'} Virtual Lab
        </div>

        {/* Score & Summary */}
        <div className="report-score">
          <div className={`score-circle ${scoreClass}`}>
            {report.score}
          </div>
          <div className="score-summary">{report.summary}</div>
        </div>

        {/* Encouragement Banner */}
        {encouragement && (
          <div className="encouragement-banner" style={{
            background: 'rgba(30, 58, 138, 0.35)',
            borderLeft: '4px solid #38bdf8',
            padding: '12px 16px',
            borderRadius: '8px',
            margin: '14px 0 18px 0',
            color: '#7dd3fc',
            fontWeight: 500,
            fontSize: '0.93rem',
            lineHeight: '1.5'
          }}>
            💬 <em>{encouragement}</em>
          </div>
        )}

        {/* What Went Wrong (Detailed Mistakes, Why, How to Fix) */}
        {wrongList.length > 0 && (
          <div className="report-section">
            <h3 style={{ color: '#f87171', fontSize: '0.88rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
              🔍 What Went Wrong & How to Fix
            </h3>
            <div className="mistakes-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              {wrongList.map((item, i) => (
                <div key={i} className="mistake-card" style={{
                  background: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  {/* Issue Title */}
                  <div style={{ fontWeight: 700, color: '#f87171', fontSize: '1.02rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️</span> {typeof item === 'string' ? item : item.issue}
                  </div>

                  {/* Why it happened */}
                  {item.why_it_happened && (
                    <div style={{ fontSize: '0.92rem', color: '#e2e8f0', marginBottom: '8px', lineHeight: '1.55' }}>
                      <strong style={{ color: '#cbd5e1', fontWeight: 700 }}>Why it happened:</strong> {item.why_it_happened}
                    </div>
                  )}

                  {/* How to fix */}
                  {item.how_to_fix && (
                    <div style={{ fontSize: '0.92rem', color: '#a7f3d0', lineHeight: '1.55' }}>
                      <strong style={{ color: '#34d399', fontWeight: 700 }}>How to fix:</strong> {item.how_to_fix}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What Went Right */}
        {rightList.length > 0 && (
          <div className="report-section">
            <h3 style={{ color: '#34d399', fontSize: '0.88rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              ✅ What Went Right
            </h3>
            <ul>
              {rightList.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {/* Confidence Note if present */}
        {report.confidence_note && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            borderLeft: '4px solid #f59e0b',
            padding: '12px 16px',
            borderRadius: '8px',
            margin: '12px 0 16px 0',
            color: '#fef08a',
            fontWeight: 500,
            fontSize: '0.92rem',
            lineHeight: '1.5'
          }}>
            💡 <strong>Confidence & Procedural Note:</strong> {report.confidence_note}
          </div>
        )}

        {/* Step-by-Step Live Tracking Observations & Feedback */}
        {feedbackList.length > 0 && (
          <div className="report-section">
            <h3 style={{ color: '#fbbf24', fontSize: '0.88rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
              📍 Feedback & Live Tracking Observations
            </h3>
            <ul>
              {feedbackList.map((item, i) => (
                <li key={i} style={{ borderLeft: '3px solid #fbbf24' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Practical Improvement Suggestions */}
        {improvementList.length > 0 && (
          <div className="report-section">
            <h3 style={{ color: '#60a5fa', fontSize: '0.88rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
              🚀 Practical Improvement Suggestions
            </h3>
            <ul>
              {improvementList.map((item, i) => (
                <li key={i} style={{ borderLeft: '3px solid #60a5fa' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Scientific Concept if available */}
        {report.concept_explanation && (
          <div className="report-section">
            <h3 style={{ color: '#38bdf8' }}>📚 Scientific Concept</h3>
            <div className="concept-text">{report.concept_explanation}</div>
          </div>
        )}

        {/* Actionable Recommendation */}
        {recommendation && (
          <div className="report-section">
            <h3 style={{ color: '#c084fc' }}>🔬 Actionable Recommendation</h3>
            <div className="concept-text" style={{ borderLeftColor: '#c084fc', background: 'rgba(147, 51, 234, 0.12)', color: '#f1f5f9' }}>
              {recommendation}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="report-actions">
          <button className="btn-primary" onClick={closeReport} id="continue-lab-btn" style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#ffffff',
            fontWeight: '700',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
          }}>
            ← Back to Lab
          </button>
          <button className="btn-secondary" onClick={() => { closeReport(); setScreen('dashboard'); }} id="view-dashboard-btn" style={{
            background: 'rgba(51, 65, 85, 0.8)',
            color: '#f8fafc',
            fontWeight: '600',
            padding: '10px 20px',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            cursor: 'pointer'
          }}>
            📊 View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

