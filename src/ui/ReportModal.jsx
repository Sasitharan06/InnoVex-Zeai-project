import React from 'react';
import useGameStore from '../store/gameStore';

export default function ReportModal() {
  const showReport = useGameStore((s) => s.showReport);
  const report = useGameStore((s) => s.currentReport);
  const closeReport = useGameStore((s) => s.closeReport);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!showReport || !report) return null;

  const scoreClass = report.score >= 70 ? 'high' : report.score >= 40 ? 'medium' : 'low';

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeReport()}>
      <div className="report-modal" id="report-modal">
        <h2>Lab Report — AI Assessment</h2>
        <div className="report-domain">
          {report.domain === 'chemistry' ? '🧪 Chemistry' : '⚡ Physics'} Experiment
        </div>

        {/* Score */}
        <div className="report-score">
          <div className={`score-circle ${scoreClass}`}>
            {report.score}
          </div>
          <div className="score-summary">{report.summary}</div>
        </div>

        {/* Strengths */}
        <div className="report-section">
          <h3>✅ Strengths</h3>
          <ul>
            {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>

        {/* Improvements */}
        <div className="report-section">
          <h3>📈 Areas for Improvement</h3>
          <ul>
            {report.improvements.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>

        {/* Concept Explanation */}
        <div className="report-section">
          <h3>📚 Concept Explanation</h3>
          <div className="concept-text">{report.concept_explanation}</div>
        </div>

        {/* Next Experiment */}
        <div className="report-section">
          <h3>🔬 Suggested Next Experiment</h3>
          <div className="concept-text" style={{ borderLeftColor: '#8b5cf6' }}>
            {report.next_suggested_experiment}
          </div>
        </div>

        {/* Actions */}
        <div className="report-actions">
          <button className="btn-primary" onClick={closeReport} id="continue-lab-btn">
            ← Back to Lab
          </button>
          <button className="btn-secondary" onClick={() => { closeReport(); setScreen('dashboard'); }} id="view-dashboard-btn">
            📊 View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
