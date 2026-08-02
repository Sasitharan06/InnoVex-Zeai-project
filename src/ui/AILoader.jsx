import React from 'react';
import { FlaskConical, Sparkles } from 'lucide-react';

export default function AILoader({ label = "Loading Virtual Laboratory..." }) {
  return (
    <div className="ai-loader-container">
      <div className="ai-loader-glow-bg" />
      <div className="ai-loader-graphic">
        <div className="ai-ring outer-ring" />
        <div className="ai-ring middle-ring" />
        <div className="ai-ring inner-ring" />
        <div className="ai-core-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
          <FlaskConical size={32} />
        </div>
        <div className="ai-orbiting-dot dot-1" />
        <div className="ai-orbiting-dot dot-2" />
        <div className="ai-orbiting-dot dot-3" />
      </div>
      <div className="ai-loader-text">
        <Sparkles size={16} style={{ marginRight: '6px', color: '#06b6d4' }} />
        <span className="ai-loader-label">{label}</span>
        <span className="ai-loader-dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </div>
    </div>
  );
}

