import { createRandom } from "./random";

export interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
  speed: number;
  warmth: number;
}

/**
 * Generates an array of star data based on a seed.
 * @param count - The number of stars to generate.
 * @param seed - The seed for the random number generator.
 * @returns An array of star objects.
 */
export function createStars(count: number, seed: number): Star[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => {
    const bright = random() > 0.91;
    return {
      x: random(),
      y: Math.pow(random(), 0.84),
      radius: bright ? 0.9 + random() * 1.35 : 0.25 + random() * 0.75,
      alpha: 0.18 + random() * 0.72,
      phase: random() * Math.PI * 2,
      speed: 0.25 + random() * 0.85,
      warmth: random(),
    };
  });
}

/**
 * Creates a canvas element containing a prerendered star sprite.
 * @param radius - The radius of the star.
 * @param warmth - The warmth of the star (affects color).
 * @param withGlow - Whether the star should have a glow effect.
 * @returns A canvas element representing the star sprite.
 */
export function createStarSprite(
  radius: number,
  warmth: number,
  withGlow: boolean
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const size = Math.ceil(radius * (withGlow ? 8 : 2));
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const center = size / 2;
  ctx.beginPath();
  ctx.fillStyle = warmth > 0.86 ? "#ffdeee" : "#eeefff";
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  if (withGlow) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillRect(center - radius * 3, center - 0.35, radius * 6, 0.7);
    ctx.fillRect(center - 0.35, center - radius * 3, 0.7, radius * 6);
  }

  return canvas;
}
