import { describe, expect, it } from "vitest";
import { cursorFill } from "./cursorFill";

// cursorFill maps a cursor's viewport x against a link's box to a magnet
// position f for magnetGradient. Pure: (clientX, left, width) → f.
describe("cursorFill", () => {
  it("sits at 0.5 over the link's centre and rises as the cursor moves right", () => {
    // a wide link (>= the reference) isolates this from the reference/clamp rules
    const left = 0;
    const width = 480;
    const centre = left + width / 2;
    expect(cursorFill(centre, left, width)).toBeCloseTo(0.5);
    expect(cursorFill(centre + 120, left, width)).toBeGreaterThan(0.5);
    expect(cursorFill(centre - 120, left, width)).toBeLessThan(0.5);
  });

  it("clamps to [0.12, 0.88] so red never fully reaches an end", () => {
    const left = 0;
    const width = 480;
    expect(cursorFill(10_000, left, width)).toBeCloseTo(0.88);
    expect(cursorFill(-10_000, left, width)).toBeCloseTo(0.12);
  });

  it("maps against a fixed 240px reference so short links drift only gently", () => {
    // a narrow 100px link: 24px past centre is ~24% of its own width, but should
    // map against the 240px reference → 0.5 + 24/240 = 0.6, not 0.5 + 24/100
    const left = 0;
    const width = 100;
    const centre = left + width / 2;
    expect(cursorFill(centre + 24, left, width)).toBeCloseTo(0.6);
  });
});
