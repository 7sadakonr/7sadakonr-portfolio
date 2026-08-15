import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Fireflies.css';

interface FirefliesProps {
  count?: number;
  enabled?: boolean;
}

const Fireflies: React.FC<FirefliesProps> = ({ count = 7, enabled = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => !document.hidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { rootMargin: '250px 0px', threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateVisibility = () => setIsDocumentVisible(!document.hidden);
    const updateMotion = () => setPrefersReducedMotion(motionQuery.matches);

    document.addEventListener('visibilitychange', updateVisibility);
    motionQuery.addEventListener('change', updateMotion);
    updateVisibility();
    updateMotion();

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      motionQuery.removeEventListener('change', updateMotion);
    };
  }, []);

  const isActive = enabled && isInView && isDocumentVisible && !prefersReducedMotion;

  const fireflies = useMemo(() => {
    const validCount = Math.max(1, count);
    
    return Array.from({ length: validCount }).map((_, i) => {
      const fraction = i / (validCount - 1 || 1);
      const uniformPosition = fraction * 2 - 1;
      
      let randNorm = Math.sign(uniformPosition) * Math.pow(Math.abs(uniformPosition), 1.8);
      randNorm += (Math.random() - 0.5) * 0.15;
      randNorm = Math.max(-1, Math.min(1, randNorm)); 
      
      const distanceFromCenter = Math.abs(randNorm); 
      const numericLeft = 50 + randNorm * 48;
      const planetCurveOffset = Math.pow(distanceFromCenter, 2) * 11.5; 
      const topOffset = Math.random() * 2 + planetCurveOffset + 2;
      const maxFloatHeight = 25 - (distanceFromCenter * 15);
      const floatHeight = Math.random() * maxFloatHeight;
      
      let isPurple = false;
      if (randNorm < -0.2) isPurple = false;
      else if (randNorm > 0.2) isPurple = true;
      else isPurple = Math.random() > 0.5;

      const whitePct = `${Math.max(0, (1 - distanceFromCenter * 1.5) * 100).toFixed(0)}%`;
      const sizeScale = (Math.random() * 0.8 + 0.5).toFixed(2);
      const twinkleDuration = 3 + Math.random() * 4; 
      const twinkleDelay = -(Math.random() * 5); 

      return {
        id: i,
        isStar: i % 3 === 1,
        starRotation: `${(Math.random() * 70 - 35).toFixed(1)}deg`,
        isPurple,
        left: `${numericLeft.toFixed(2)}%`,
        topOffset,
        floatHeight,
        sizeScale,
        twinkleDuration: `${twinkleDuration.toFixed(2)}s`,
        twinkleDelay: `${twinkleDelay.toFixed(2)}s`,
        introDelay: `${i * 60}ms`,
        whitePct,
      };
    });
  }, [count]);

  return (
    <div
      ref={containerRef}
      className={`fireflies-container${isActive ? ' is-active' : ''}`}
      aria-hidden="true"
    >
      {fireflies.map((fly) => (
        <div
          key={fly.id}
          className={`firefly ${fly.isStar ? 'firefly-star' : ''} ${fly.isPurple ? 'firefly-purple' : 'firefly-pink'}`}
          style={{
            left: fly.left,
            '--top-offset': fly.topOffset,
            '--float-height': fly.floatHeight,
            '--size-scale': fly.sizeScale,
            '--twinkle-duration': fly.twinkleDuration,
            '--twinkle-delay': fly.twinkleDelay,
            '--intro-delay': fly.introDelay,
            '--white-pct': fly.whitePct,
            '--star-rotation': fly.starRotation,
            animationPlayState: isActive ? 'running' : 'paused',
            willChange: isActive ? 'transform, opacity' : 'auto',
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default Fireflies;
