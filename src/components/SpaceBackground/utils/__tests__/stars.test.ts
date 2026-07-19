import { describe, it, expect } from "vitest";
import { createStars, createStarSprite } from "../stars";

describe("stars utils", () => {
  describe("createStars", () => {
    it("should generate the requested number of stars", () => {
      const stars = createStars(100, 42);
      expect(stars).toHaveLength(100);
    });

    it("should be deterministic based on seed", () => {
      const stars1 = createStars(10, 42);
      const stars2 = createStars(10, 42);
      expect(stars1).toEqual(stars2);
    });
    
    it("should generate stars with expected properties", () => {
      const stars = createStars(1, 42);
      expect(stars[0]).toHaveProperty("x");
      expect(stars[0]).toHaveProperty("y");
      expect(stars[0]).toHaveProperty("radius");
      expect(stars[0]).toHaveProperty("alpha");
      expect(stars[0]).toHaveProperty("phase");
      expect(stars[0]).toHaveProperty("speed");
      expect(stars[0]).toHaveProperty("warmth");
    });
  });

  describe("createStarSprite", () => {
    it("should create a canvas element", () => {
      const sprite = createStarSprite(1, 0.5, false);
      expect(sprite).toBeInstanceOf(HTMLCanvasElement);
    });

    it("should calculate correct size based on radius and glow", () => {
      const radius = 2;
      const spriteNoGlow = createStarSprite(radius, 0.5, false);
      // Math.ceil(radius * 2)
      expect(spriteNoGlow.width).toBe(4);
      expect(spriteNoGlow.height).toBe(4);

      const spriteWithGlow = createStarSprite(radius, 0.5, true);
      // Math.ceil(radius * 8)
      expect(spriteWithGlow.width).toBe(16);
      expect(spriteWithGlow.height).toBe(16);
    });
  });
});
