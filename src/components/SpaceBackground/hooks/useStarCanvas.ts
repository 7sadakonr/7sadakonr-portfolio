import { useEffect } from "react";
import { createStars, createStarSprite } from "../utils/stars";
import type { SpaceMotion } from "../SpaceBackground";

interface UseStarCanvasOptions {
  starCount: number;
  seed: number;
  motion: SpaceMotion;
}

/**
 * Hook to manage the canvas rendering logic for the space background.
 */
export function useStarCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  rootRef: React.RefObject<HTMLDivElement | null>,
  { starCount, seed, motion }: UseStarCanvasOptions
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root || starCount <= 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const isMobile = window.innerWidth <= 768;
    const count = Math.max(0, Math.min(isMobile ? 300 : 2000, Math.round(starCount)));
    const stars = createStars(count, seed);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let start = performance.now();
    let reducedMotion = media.matches;
    let isVisible = !document.hidden;

    // Pre-render star sprites
    const sprites = new Map<typeof stars[0], HTMLCanvasElement>();
    for (const star of stars) {
      sprites.set(
        star,
        createStarSprite(star.radius, star.warmth, star.radius > 1.55)
      );
    }

    const draw = (now: number) => {
      if (!isVisible) return;
      
      context.clearRect(0, 0, width, height);
      const elapsed = (now - start) / 1000;

      for (const star of stars) {
        const twinkle =
          motion === "none" || reducedMotion
            ? 1
            : 0.72 + Math.sin(elapsed * star.speed + star.phase) * 0.28;
        const alpha = Math.max(0.06, star.alpha * twinkle);
        const x = star.x * width;
        const y = star.y * height;
        const sprite = sprites.get(star);

        if (sprite && typeof context.drawImage === "function") {
          context.globalAlpha = alpha;
          context.drawImage(
            sprite,
            x - sprite.width / 2,
            y - sprite.height / 2
          );
        }
      }

      context.globalAlpha = 1.0; // Reset alpha

      if (motion !== "none" && !reducedMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = 1; // Force 1x pixel ratio for performance
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      cancelAnimationFrame(frame);
      if (isVisible) {
        start = performance.now();
        draw(start);
      }
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      resize();
    };

    const onVisibilityChange = () => {
      // document.hidden check handled by IntersectionObserver
    };

    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const isIntersecting = entry.isIntersecting;
      
      if (isIntersecting && !document.hidden) {
        if (!isVisible) {
          isVisible = true;
          if (motion !== "none" && !reducedMotion) {
            start = performance.now();
            frame = requestAnimationFrame(draw);
          }
        }
      } else {
        isVisible = false;
        cancelAnimationFrame(frame);
      }
    }, { threshold: 0, rootMargin: '1000px 0px 1000px 0px' });

    const observer = new ResizeObserver(resize);
    observer.observe(root);
    intersectionObserver.observe(root);
    media.addEventListener("change", onMotionChange, { passive: true });
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && root.getBoundingClientRect().top < window.innerHeight && root.getBoundingClientRect().bottom > 0) {
            if (!isVisible) {
                isVisible = true;
                if (motion !== "none" && !reducedMotion) {
                    start = performance.now();
                    frame = requestAnimationFrame(draw);
                }
            }
        } else {
            isVisible = false;
            cancelAnimationFrame(frame);
        }
    });
    resize();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersectionObserver.disconnect();
      media.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [starCount, motion, seed, canvasRef, rootRef]);
}
