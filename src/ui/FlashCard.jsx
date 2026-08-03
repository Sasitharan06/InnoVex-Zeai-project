import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import './FlashCard.css';

export default function FlashCard({ data, index, onViewMore }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <motion.div
      className="flashcard-container"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div
        className="flashcard"
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        style={{
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* FRONT SIDE */}
        <div className="flashcard-front">
          <div className="flashcard-image-wrapper">
            <img 
              src={data.illustration} 
              alt={data.title} 
              loading="lazy"
              className="flashcard-image"
            />
            <div className="flashcard-image-overlay" />
          </div>
          <div className="flashcard-content-front">
            <h3 className="flashcard-title">{data.title}</h3>
            <p className="flashcard-subtitle">{data.subtitle}</p>
          </div>
        </div>

        {/* BACK SIDE */}
        <div 
          className="flashcard-back"
          style={{
            background: `linear-gradient(135deg, ${data.theme.from}, ${data.theme.to})`
          }}
        >
          <div className="flashcard-content-back">
            <h3 className="flashcard-title-back">{data.title}</h3>
            <ul className="flashcard-features-list">
              {data.bullets.map((bullet, i) => (
                <li key={i}>
                  <Check size={16} className="flashcard-check" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <button 
              className="flashcard-btn"
              onClick={(e) => {
                e.stopPropagation();
                onViewMore(data);
              }}
            >
              {data.buttonText}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
