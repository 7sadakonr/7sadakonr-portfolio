import React, { useMemo, useState, useEffect } from 'react';
import './Loading.css';
import heroSvg from '../../assets/img/hero.svg';
import heroPng from '../../assets/img/logo-7m.png';

function Loading({ fadeOut }) {
  // Detect Apple devices for PNG fallback (SVG has issues on iOS)
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    setIsApple(isIOS || isIPadOS);
  }, []);

  const heroImg = isApple ? heroPng : heroSvg;
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
      {/* Base Dark Background */}
      <div className="loading-bg"></div>

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

      {/* Shooting Stars */}
      <div className="loading-shooting-stars">
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
      </div>

      {/* Mesh Gradients */}
      <div className="loading-mesh"></div>
      <div className="loading-mesh-extra"></div>

      {/* Floor Glow */}
      <div className="loading-floor-glow"></div>

      {/* Vignette */}
      <div className="loading-vignette"></div>

      {/* Horizon Glow (Planet Atmosphere) */}
      <div className="horizon-glow"></div>

      {/* Central Logo */}
      <div className="logo-container">
        <img src={heroImg} alt="Hero Logo" className="hero-logo" />
      </div>
    </div>
  );
}

export default Loading;