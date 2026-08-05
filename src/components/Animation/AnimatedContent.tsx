import React, { useEffect, useRef } from "react";

export type AnimationDirection =
  | 'vertical'
  | 'horizontal'
  | 'up'
  | 'down'
  | 'left'
  | 'right';

export interface AnimatedContentProps {
  children: React.ReactNode;
  distance?: number;
  direction?: AnimationDirection;
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  blur?: number;
  onComplete?: () => void;
  triggerOnce?: boolean;
  className?: string;
}

const DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'; // --ease-out-quint

const getInitialTransform = (
  direction: AnimationDirection = 'vertical',
  distance = 30,
  reverse = false,
  scale = 1
): string => {
  let x = 0;
  let y = 0;

  if (direction === 'vertical' || direction === 'up') {
    y = reverse ? -distance : distance;
  } else if (direction === 'down') {
    y = reverse ? distance : -distance;
  } else if (direction === 'horizontal' || direction === 'left') {
    x = reverse ? -distance : distance;
  } else if (direction === 'right') {
    x = reverse ? distance : -distance;
  }

  const transforms: string[] = [];
  if (x !== 0 || y !== 0) {
    transforms.push(`translate3d(${x}px, ${y}px, 0)`);
  }
  if (scale !== 1) {
    transforms.push(`scale(${scale})`);
  }

  return transforms.length > 0 ? transforms.join(' ') : 'none';
};

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  distance = 30,
  direction = 'vertical',
  reverse = false,
  duration = 0.6,
  ease = DEFAULT_EASING,
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  blur,
  onComplete,
  triggerOnce = true,
  className = ''
}) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Respect user's motion preferences or SSR/fallback
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const startTransform = getInitialTransform(direction, distance, reverse, scale);
    const startOpacity = animateOpacity ? initialOpacity : 1;
    const startFilter = blur ? `blur(${blur}px)` : 'none';

    // Set initial off-screen state immediately without layout shift
    el.style.opacity = String(startOpacity);
    el.style.transform = startTransform;
    if (blur) el.style.filter = startFilter;
    el.style.willChange = 'opacity, transform';

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        if (entry.isIntersecting) {
          if (triggerOnce && hasAnimatedRef.current) return;
          hasAnimatedRef.current = true;

          const animDuration = Math.min(Math.max(duration * 1000, 150), 1000);
          const animDelay = Math.max(delay * 1000, 0);

          try {
            const animation = el.animate(
              [
                {
                  opacity: startOpacity,
                  transform: startTransform,
                  filter: startFilter
                },
                {
                  opacity: 1,
                  transform: 'translate3d(0, 0, 0)',
                  filter: 'none'
                }
              ],
              {
                duration: animDuration,
                delay: animDelay,
                easing: ease,
                fill: 'forwards'
              }
            );

            animation.onfinish = () => {
              el.style.opacity = '1';
              el.style.transform = 'none';
              el.style.filter = 'none';
              el.style.willChange = 'auto';
              try {
                animation.cancel();
              } catch {
                // Ignore cancel errors
              }
              onComplete?.();
            };
          } catch {
            // Fallback for environments lacking Animation constructor
            el.style.transition = `opacity ${animDuration}ms ${ease} ${animDelay}ms, transform ${animDuration}ms ${ease} ${animDelay}ms`;
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.filter = 'none';
            onComplete?.();
          }

          if (triggerOnce) {
            observer.unobserve(el);
            observer.disconnect();
          }
        } else if (!triggerOnce && hasAnimatedRef.current) {
          // Reset if repeatable
          el.style.opacity = String(startOpacity);
          el.style.transform = startTransform;
          if (blur) el.style.filter = startFilter;
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [
    direction,
    distance,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    delay,
    blur,
    onComplete,
    triggerOnce
  ]);

  if (React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      ref?: React.Ref<HTMLElement>;
      className?: string;
    }>;
    const existingRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;

    return React.cloneElement(child, {
      ref: (node: HTMLElement | null) => {
        elementRef.current = node;
        if (typeof existingRef === 'function') {
          existingRef(node);
        } else if (existingRef && typeof existingRef === 'object' && 'current' in existingRef) {
          (existingRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      className: `${child.props.className || ''} ${className}`.trim()
    });
  }

  return (
    <div ref={(node) => { elementRef.current = node; }} className={className}>
      {children}
    </div>
  );
};

export default AnimatedContent;
