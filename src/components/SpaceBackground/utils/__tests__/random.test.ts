import { describe, it, expect } from "vitest";
import { createRandom } from "../random";

describe("createRandom", () => {
  it("should return deterministic values for the same seed", () => {
    const random1 = createRandom(42);
    const random2 = createRandom(42);

    expect(random1()).toBe(random2());
    expect(random1()).toBe(random2());
    expect(random1()).toBe(random2());
  });

  it("should return different values for different seeds", () => {
    const random1 = createRandom(42);
    const random2 = createRandom(43);

    expect(random1()).not.toBe(random2());
  });

  it("should return values between 0 and 1", () => {
    const random = createRandom(12345);
    for (let i = 0; i < 100; i++) {
      const val = random();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});
