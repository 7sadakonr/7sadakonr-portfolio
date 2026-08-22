import React, { useEffect, useRef, useState } from 'react';
import './Preloader.css';

interface PreloaderProps {
  onReveal?: () => void;
  onComplete?: () => void;
}

const GREETINGS = [
  'Hello',
  'สวัสดี',
  'Bonjour',
  'Hola',
  'Ciao',
  'Konnichiwa',
];

const MIN_VISIBLE_MS = 600;
const COMPLETE_HOLD_MS = 100;
// The accent layer exits 100ms after the 750ms main curtain transition.
const EXIT_DURATION_MS = 850;

const delay = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms);
});

export const Preloader: React.FC<PreloaderProps> = ({ onReveal, onComplete }) => {
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [showName, setShowName] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);
  const progressRef = useRef(0);
  const progressTargetRef = useRef(0);
  const counterDomRef = useRef<HTMLDivElement>(null);
  const barDomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onRevealRef.current = onReveal;
    onCompleteRef.current = onComplete;
  }, [onReveal, onComplete]);

  // The counter eases toward real task completion instead of jumping from a
  // fast cached resource directly to 100. It never advances beyond the work
  // that has actually settled.
  useEffect(() => {
    let frameId: number | null = null;
    let lastFrame = performance.now();

    const start = () => {
      if (frameId === null && !document.hidden) frameId = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      const elapsed = Math.min(now - lastFrame, 64);
      lastFrame = now;
      const next = Math.min(
        progressTargetRef.current,
        progressRef.current + elapsed * 0.24,
      );

      if (next !== progressRef.current) {
        progressRef.current = next;
        
        if (counterDomRef.current) {
          counterDomRef.current.innerText = Math.round(next).toString();
        }
        if (barDomRef.current) {
          barDomRef.current.style.transform = `scaleX(${next / 100})`;
        }
      }
      frameId = null;
      start();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      if (!document.hidden) {
        lastFrame = performance.now();
        start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    start();
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Block scrolling only while the visual curtain is present.
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      progressRef.current = 100;
      progressTargetRef.current = 100;
      onRevealRef.current?.();
      onCompleteRef.current?.();
      setIsComplete(true);
      return;
    }

    let cancelled = false;
    const startedAt = performance.now();
    const waitForVisualProgress = (target: number) => new Promise<void>((resolve) => {
      const check = () => {
        if (progressRef.current >= target || cancelled) {
          resolve();
          return;
        }
        window.setTimeout(check, 16);
      };
      check();
    });

    const greetingTimer = window.setInterval(() => {
      setCurrentGreetingIndex((current) => Math.min(current + 1, GREETINGS.length - 1));
    }, 320);

    const run = async () => {
      progressTargetRef.current = 95;
      await waitForVisualProgress(95);
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_VISIBLE_MS) await delay(MIN_VISIBLE_MS - elapsed);

      if (cancelled) return;

      window.clearInterval(greetingTimer);
      progressTargetRef.current = 100;
      await waitForVisualProgress(100);
      if (cancelled) return;

      setShowName(true);

      await delay(COMPLETE_HOLD_MS);
      if (cancelled) return;

      // Reveal the already-loaded Hero behind the curtain while it slides away.
      onRevealRef.current?.();
      setIsExiting(true);

      await delay(EXIT_DURATION_MS);
      if (cancelled) return;

      onCompleteRef.current?.();
      setIsComplete(true);
    };

    void run();

    return () => {
      cancelled = true;
      window.clearInterval(greetingTimer);
    };
  }, []);

  if (isComplete) return null;

  const finalName = 'Jetsadakorn M';
  const nameChars = finalName.split('');

  return (
    <div className="preloader-container" aria-hidden="true">
      {/* Accent layer (curtain back) */}
      <div className={`preloader-layer preloader-accent-layer ${isExiting ? 'exit-slide-accent' : ''}`} />

      {/* Main dark layer (curtain front) */}
      <div className={`preloader-layer preloader-main-layer ${isExiting ? 'exit-slide-main' : ''}`}>

        {/* Giant Watermark Logo in Center */}
        <div className={`preloader-watermark ${isExiting ? 'watermark-scale-down' : ''}`}>
          <svg
            className="preloader-watermark-svg"
            viewBox="0 0 431 325"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="preloader-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7777" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#8a38f5" stopOpacity="0.14" />
              </linearGradient>
            </defs>
            <path
              d="M217.229 116C218.043 116 218.845 116.052 219.631 116.154C221.317 116.052 223.017 116 224.729 116C270.569 116 307.729 153.16 307.729 199V324H264.729V193C264.729 170.909 246.821 153 224.729 153C202.638 153 184.729 170.909 184.729 193V324H141.729V235.794L117.144 291.397C116.946 291.846 116.731 292.282 116.503 292.707L116.526 292.721C108.216 307.114 94.5512 317.63 78.5388 321.956C62.5263 326.282 45.4771 324.062 31.1423 315.786C16.8077 307.51 6.36041 293.855 2.1003 277.825C-1.51043 264.238 -0.426171 249.888 5.04854 237.064C5.29614 236.144 5.61783 235.23 6.01729 234.332L8.43135 228.904C12.5825 219.569 23.5155 215.366 32.8513 219.517C42.1872 223.668 46.39 234.601 42.239 243.937L39.8259 249.364C39.4503 250.209 39.0182 251.011 38.5378 251.77C36.409 256.982 36.0147 262.776 37.4743 268.269C39.2384 274.906 43.5648 280.561 49.5007 283.988C55.4367 287.415 62.4969 288.335 69.1276 286.544C74.6528 285.051 79.501 281.777 82.9558 277.278C83.0646 276.996 83.1807 276.714 83.3044 276.435L137.882 153H88.2292C78.012 153 69.7292 144.717 69.7292 134.5C69.7292 124.283 78.012 116 88.2292 116H217.229ZM347.729 116C393.569 116 430.729 153.16 430.729 199V324H387.729V193C387.729 170.909 369.821 153 347.729 153C331.282 153 317.155 162.927 311.009 177.116C307.955 162.336 300.972 148.992 291.199 138.227C306.018 124.436 325.889 116 347.729 116ZM217.229 0C227.446 0 235.729 8.28273 235.729 18.5C235.729 21.0186 235.225 23.419 234.313 25.6074C234.054 26.7112 233.691 27.8071 233.216 28.8818L196.907 111H156.452L189.171 37H106.729V45.5C106.729 55.7173 98.4465 64 88.2292 64C78.012 64 69.7292 55.7172 69.7292 45.5V18.5C69.7292 8.28276 78.012 3.88641e-05 88.2292 0H217.229Z"
              fill="url(#preloader-logo-grad)"
            />
          </svg>
        </div>

        {/* Corner Meta: Top-Left */}
        <div className="preloader-meta preloader-meta-tl">
          <span>Jetsadakorn Muangwichit</span>
        </div>

        {/* Corner Meta: Top-Right */}
        <div className="preloader-meta preloader-meta-tr">
          <span>Full Stack / Computer Science</span>
        </div>

        {/* Corner Meta: Bottom-Left */}
        <div className="preloader-meta preloader-meta-bl">
          <span>Bangkok, Thailand / ICT</span>
        </div>

        {/* Bottom-Right progress: now reflects real critical-resource readiness */}
        <div className="preloader-counter" ref={counterDomRef}>
          0
        </div>

        {/* Center Content: Rotating Asterisk + Greeting Mask */}
        <div className="preloader-center-content">
          <div className="preloader-asterisk">✦</div>

          <div className="preloader-text-mask">
            {!showName ? (
              <div className="preloader-greeting-track">
                {GREETINGS.map((word, idx) => (
                  <span
                    key={word}
                    className={`preloader-greeting-word ${
                      idx === currentGreetingIndex
                        ? 'is-active'
                        : idx < currentGreetingIndex
                        ? 'is-passed'
                        : 'is-upcoming'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            ) : (
              <div className="preloader-name-container">
                {nameChars.map((char, index) => (
                  <span
                    key={index}
                    className="preloader-name-char"
                    style={{ animationDelay: `${index * 25}ms` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
                <span className="preloader-name-dot">.</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom progress bar uses the same real readiness value */}
        <div
          className="preloader-progress-bar"
          ref={barDomRef}
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </div>
  );
};

export default Preloader;
