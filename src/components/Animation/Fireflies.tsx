import React, { useMemo } from 'react';
import './Fireflies.css';

interface FirefliesProps {
  count?: number;
}

const Fireflies: React.FC<FirefliesProps> = ({ count = 7 }) => {
  const fireflies = useMemo(() => {
    const validCount = Math.max(1, count);
    
    return Array.from({ length: validCount }).map((_, i) => {
      // Spread them evenly across the entire planet horizon
      const fraction = i / (validCount - 1 || 1); // 0 to 1
      const uniformPosition = fraction * 2 - 1; // -1 to 1
      
      // Pull positions strongly towards the center
      let randNorm = Math.sign(uniformPosition) * Math.pow(Math.abs(uniformPosition), 1.8);
      randNorm += (Math.random() - 0.5) * 0.15; // Random jitter
      randNorm = Math.max(-1, Math.min(1, randNorm)); 
      
      const distanceFromCenter = Math.abs(randNorm); 
      const numericLeft = 50 + randNorm * 48; // 2% to 98%
      
      // Horizon curve offset
      const planetCurveOffset = Math.pow(distanceFromCenter, 2) * 11.5; 
      const topOffset = Math.random() * 2 + planetCurveOffset + 2;
      
      // Simulate them floating up
      const maxFloatHeight = 25 - (distanceFromCenter * 15);
      const floatHeight = Math.random() * maxFloatHeight;
      
      // Colors
      let isPurple = false;
      if (randNorm < -0.2) {
        isPurple = false;
      } else if (randNorm > 0.2) {
        isPurple = true;
      } else {
        isPurple = Math.random() > 0.5;
      }

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
        whitePct,
      };
    });
  }, [count]);

  return (
    <div className="fireflies-container" aria-hidden="true">
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
            '--white-pct': fly.whitePct,
            '--star-rotation': fly.starRotation,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default Fireflies;
