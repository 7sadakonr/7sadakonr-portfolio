import React, { useRef, useEffect } from "react";

export function TiltCard({ children, className = "", cardClassName = "" }: { children: React.ReactNode, className?: string, cardClassName?: string }) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tilt = tiltRef.current;
    const card = cardRef.current;
    if (!tilt || !card) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const MAX = 14; 

    function reset() {
      if (!tilt || !card) return;
      tilt.classList.remove("is-hover");
      card.classList.remove("is-tilting");
      card.style.setProperty("--tilt-rx", "0deg");
      card.style.setProperty("--tilt-ry", "0deg");
    }

    function track(e: PointerEvent) {
      if (reduce.matches || !tilt || !card) return;
      const r = tilt.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      tilt.classList.add("is-hover");
      card.classList.add("is-tilting");
      card.style.setProperty("--tilt-ry", ((px - 0.5) * MAX).toFixed(2) + "deg");
      card.style.setProperty("--tilt-rx", ((0.5 - py) * MAX).toFixed(2) + "deg");
      card.style.setProperty("--tilt-gx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--tilt-gy", (py * 100).toFixed(1) + "%");
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        try { tilt.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };

    const handlePointerLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") reset();
    };

    tilt.addEventListener("pointerdown", handlePointerDown, { passive: true });
    tilt.addEventListener("pointermove", track, { passive: true });
    tilt.addEventListener("pointerup", reset);
    tilt.addEventListener("pointercancel", reset);
    tilt.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      tilt.removeEventListener("pointerdown", handlePointerDown);
      tilt.removeEventListener("pointermove", track);
      tilt.removeEventListener("pointerup", reset);
      tilt.removeEventListener("pointercancel", reset);
      tilt.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <div ref={tiltRef} className={`t-tilt ${className}`}>
      <div ref={cardRef} className={`t-tilt-card ${cardClassName}`} style={{ width: '100%', height: '100%' }}>
        {children}
        <div className="t-tilt-glare"></div>
      </div>
    </div>
  );
}
