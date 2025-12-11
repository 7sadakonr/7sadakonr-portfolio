import React, { useMemo } from 'react';
import './Loading.css';
import heroSvg from '../../assets/img/hero.svg';

function Loading({ fadeOut }) {
  // Stars generation - Increased to 300
  const stars = useMemo(() => [...Array(300)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() > 0.98 ? '3px' : Math.random() > 0.9 ? '2px' : '1px',
    duration: Math.random() * 6 + 4 + 's',
    delay: Math.random() * 5 + 's'
  })), []);

  return (
    <div className={`deep-space ${fadeOut ? 'fade-out' : ''}`}>
      {/* Background Stars */}
      <div className="star-layer">
        {stars.map((s) => (
          <div
            key={s.id}
            className="tiny-star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDuration: s.duration,
              animationDelay: s.delay
            }}
          />
        ))}
      </div>

      {/* Horizon Glow (Planet Atmosphere) */}
      <div className="horizon-glow"></div>

      {/* Central Logo */}
      <div className="logo-container">
        <img src={heroSvg} alt="Hero Logo" className="hero-logo" />
      </div>
    </div>
  );
}

export default Loading;