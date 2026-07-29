import React, { useMemo } from 'react';
import './Fireflies.css';

interface FirefliesProps {
  count?: number;
}

const Fireflies: React.FC<FirefliesProps> = ({ count = 7 }) => {
  // Generate random properties for each firefly to ensure organic movement
  const fireflies = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Spread them evenly across the entire planet horizon, guaranteeing perfect left/right balance!
      const fraction = i / (count - 1 || 1); // 0 to 1 (left to right)
      const uniformPosition = fraction * 2 - 1; // -1 to 1
      
      // Pull positions strongly towards the center (x^1.8 curve) to make the center much denser
      let randNorm = Math.sign(uniformPosition) * Math.pow(Math.abs(uniformPosition), 1.8);
      
      // Add a tiny bit of random jitter so they look organic and not like a rigid grid
      randNorm += (Math.random() - 0.5) * 0.15;
      randNorm = Math.max(-1, Math.min(1, randNorm)); // Clamp just in case
      
      const distanceFromCenter = Math.abs(randNorm); // 0 (center) to 1 (edge)
      
      const leftStart = 50 + randNorm * 48; // Spans 2% to 98% of the screen width
      
      // The planet is curved (ellipse). Outer edges are lower than the center.
      // The planet is curved (ellipse). Outer edges are lower than the center.
      // At 16:9 aspect ratio, the desktop horizon is 77.4% and the curve drop is 11.5%.
      const planetCurveOffset = Math.pow(distanceFromCenter, 2) * 11.5; 
      // Add +2 to ensure they spawn just exactly behind the horizon line
      const topOffset = Math.random() * 2 + planetCurveOffset + 2;  
      
      // Center fireflies live ~18s, but duration drops off SHARPLY as they move away from the center.
      // Edges live only ~3s, disappearing almost immediately!
      const duration = 18 - Math.pow(distanceFromCenter, 0.5) * 15 + (Math.random() * 2);
      
      // Calculate distance based on duration so they all move at the same smooth speed
      // Increased speed slightly so they escape the planet's white glow faster
      const speedY = -1.5 - Math.random() * 0.3; // vh per second
      const ty = duration * speedY; 
      
      // Fan outwards slightly
      const speedX = distanceFromCenter * 0.7 + Math.random() * 0.3; // vw per second
      const directionX = randNorm >= 0 ? 1 : -1;
      const tx = directionX * (duration * speedX);
      
      // Perfectly space out their start times so there are NO gaps or clumps.
      // Use a prime multiplier (7) to shuffle the index so it doesn't sweep from left to right!
      const shuffledIndex = (i * 7) % count;
      const delay = -((shuffledIndex / count) * 10) - (Math.random() * 1);

      // Left side is strictly pink, right side is strictly purple.
      // Only the direct center (-0.2 to 0.2) is a mix of both colors.
      let isPurple = false;
      if (randNorm < -0.2) {
        isPurple = false;
      } else if (randNorm > 0.2) {
        isPurple = true;
      } else {
        isPurple = Math.random() > 0.5;
      }

      // Calculate how much white color they start with. 
      // Center starts 100% white. Outer edges start 0% white (immediately their target color).
      const whitePct = `${Math.max(0, (1 - distanceFromCenter * 1.5) * 100).toFixed(0)}%`;

      return {
        id: i,
        // Keep the sparkle shapes evenly distributed across the horizon.
        isStar: i % 3 === 1,
        starRotation: `${(Math.random() * 70 - 35).toFixed(1)}deg`,
        isPurple,
        left: `${leftStart}%`,
        topOffset: topOffset,
        animationDuration: `${duration.toFixed(2)}s`,
        animationDelay: `${delay.toFixed(2)}s`,  
        sizeScale: (Math.random() * 0.8 + 0.5).toFixed(2), // Smaller size ("ตัวน้อยๆ")
        tx: `${tx}vw`, ty: `${ty}vh`,
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
            '--size-scale': fly.sizeScale,
            '--float-duration': fly.animationDuration,
            '--float-delay': fly.animationDelay,
            '--tx': fly.tx,
            '--ty': fly.ty,
            '--white-pct': fly.whitePct,
            '--star-rotation': fly.starRotation,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default Fireflies;
