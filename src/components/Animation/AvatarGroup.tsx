import React, { useRef } from "react";

export function AvatarGroup({ items, className = "" }: { items: React.ReactNode[], className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  const setShifts = (activeIdx: number | null, phase: "in" | "out") => {
    if (!rootRef.current) return;
    const cs = getComputedStyle(document.documentElement);
    const num = (name: string, fb: number) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v : fb;
    };
    const ease = (name: string, fb: string) =>
      cs.getPropertyValue(name).trim() || fb;

    const lift    = num("--avatar-lift", -4);
    const falloff = num("--avatar-falloff", 0.45);
    const scale   = num("--avatar-scale", 1.05);
    const tf      = phase === "out"
      ? ease("--avatar-ease-out", "cubic-bezier(0.34, 3.85, 0.64, 1)")
      : ease("--avatar-ease-in",  "cubic-bezier(0.22, 1, 0.36, 1)");

    rootRef.current.querySelectorAll(".t-avatar").forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.transitionTimingFunction = tf;
      if (activeIdx == null) {
        htmlEl.style.setProperty("--shift", "0px");
        htmlEl.style.setProperty("--scale-active", "1");
        return;
      }
      const d = Math.abs(i - activeIdx);
      htmlEl.style.setProperty(
        "--shift",
        (lift * Math.pow(falloff, d)).toFixed(3) + "px"
      );
      htmlEl.style.setProperty(
        "--scale-active",
        i === activeIdx ? String(scale) : "1"
      );
    });
  };

  return (
    <div ref={rootRef} className={className} onMouseLeave={() => setShifts(null, "out")}>
      {items.map((node, i) => (
        <div
          key={i}
          className="t-avatar"
          onMouseEnter={() => setShifts(i, "in")}
        >
          {node}
        </div>
      ))}
    </div>
  );
}
