import React, { useMemo } from 'react';
import './Fireflies.css';

interface FirefliesProps {
  count?: number;
}

const Fireflies: React.FC<FirefliesProps> = ({ count = 25 }) => {
  // Generate random properties for each firefly to ensure organic movement
  const fireflies = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      isPurple: i % 2 === 0,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 5 + 5}s`, // 5s to 10s
      animationDelay: `${Math.random() * 5}s`,
      sizeScale: (Math.random() * 1.2 + 0.6).toFixed(2), // 0.6 to 1.8 multiplier
    }));
  }, [count]);

  return (
    <div className="fireflies-container" aria-hidden="true">
      {fireflies.map((fly) => (
        <div
          key={fly.id}
          className={`firefly ${fly.isPurple ? 'firefly-purple' : 'firefly-pink'}`}
          style={{
            left: fly.left,
            top: fly.top,
            '--size-scale': fly.sizeScale,
            '--float-duration': fly.animationDuration,
            '--float-delay': fly.animationDelay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default Fireflies;
