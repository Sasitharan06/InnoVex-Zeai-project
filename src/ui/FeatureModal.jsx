import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, Star } from 'lucide-react';
import './FeatureModal.css';

export default function FeatureModal({ data, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!data) return null;

  return (
    <motion.div 
      className="fm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="fm-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="fm-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={24} />
        </button>

        <div className="fm-header">
          <img src={data.illustration} alt={data.title} className="fm-image" />
          <div className="fm-header-overlay">
            <h2 className="fm-title">{data.title}</h2>
          </div>
        </div>

        <div className="fm-body">
          <p className="fm-description">{data.description}</p>
          
          <div className="fm-sections">
            <div>
              <h3 className="fm-section-title" style={{ color: data.theme.from }}>
                <CheckCircle2 size={20} /> Key Features
              </h3>
              <ul className="fm-list">
                {data.keyFeatures.map((feat, i) => (
                  <li key={i}>
                    <CheckCircle2 size={16} className="fm-check" style={{ color: data.theme.to }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="fm-section-title" style={{ color: data.theme.to }}>
                <Star size={20} /> Benefits
              </h3>
              <ul className="fm-list">
                {data.benefits.map((benefit, i) => (
                  <li key={i}>
                    <Star size={16} className="fm-check" style={{ color: data.theme.from }} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
