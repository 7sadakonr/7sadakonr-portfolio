import React, { useEffect, useRef, useState } from 'react';
import './TextReveal.css';

export interface TextRevealProps {
  children?: React.ReactNode;
  text?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  isRevealed?: boolean;
  delay?: number;
  stagger?: number;
  duration?: number;
  ease?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  text,
  as: Component = 'div',
  className = '',
  isRevealed: controlledRevealed,
  delay = 0,
  stagger = 0.055,
  duration = 0.95,
  ease = 'cubic-bezier(0.16, 1, 0.3, 1)',
  threshold = 0.15,
  triggerOnce = true,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (controlledRevealed !== undefined) return;
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setInView(false);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [controlledRevealed, threshold, triggerOnce]);

  const active = controlledRevealed !== undefined ? controlledRevealed : inView;

  const rawText = text ?? (typeof children === 'string' ? children : null);

  let contentNodes: React.ReactNode;

  if (rawText) {
    const words = rawText.trim().split(/\s+/);
    contentNodes = words.map((word, idx) => (
      <React.Fragment key={`${word}-${idx}`}>
        <span className="text-reveal-mask">
          <span
            className={`text-reveal-word ${active ? 'is-revealed' : ''}`}
            style={{
              transitionDuration: `${duration}s`,
              transitionTimingFunction: ease,
              transitionDelay: `${delay + idx * stagger}s`,
            }}
          >
            {word}
          </span>
        </span>
        {idx < words.length - 1 && <span className="text-reveal-space"> </span>}
      </React.Fragment>
    ));
  } else {
    const childrenArray = React.Children.toArray(children);
    contentNodes = childrenArray.map((child, idx) => {
      const isGradient =
        React.isValidElement(child) &&
        (typeof child.props.className === 'string' &&
          child.props.className.includes('gradient-text'));

      return (
        <React.Fragment key={idx}>
          <span className={`text-reveal-mask ${isGradient ? 'has-gradient' : ''}`}>
            <span
              className={`text-reveal-word ${isGradient ? 'is-gradient-word' : ''} ${active ? 'is-revealed' : ''}`}
              style={{
                transitionDuration: `${duration}s`,
                transitionTimingFunction: ease,
                transitionDelay: `${delay + idx * stagger}s`,
              }}
            >
              {child}
            </span>
          </span>
          {idx < childrenArray.length - 1 && <span className="text-reveal-space"> </span>}
        </React.Fragment>
      );
    });
  }

  return (
    // @ts-expect-error dynamic component type
    <Component ref={containerRef} className={`text-reveal-container ${className}`}>
      {contentNodes}
    </Component>
  );
};

export default TextReveal;
