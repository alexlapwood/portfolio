import { describe, expect, it } from "vitest";
import { proximityFill } from "./proximityFill";

// proximityFill maps the cursor's viewport x against the name's box to a magnet
// position f ∈ [0.2, 0.8] — the name's own cursor→f mapping (distinct from the
// links' cursorFill). The zone the cursor is read against is the name box grown
// by the proximity radius on each side. Pure: (clientX, left, width) → f.
describe("proximityFill", () => {
  it("sits at 0.5 when the cursor is over the centre of the name box", () => {
    const left = 100;
    const width = 600;
    const centre = left + width / 2;
    expect(proximityFill(centre, left, width)).toBeCloseTo(0.5);
  });

  it("clamps to [0.2, 0.8] so red stays pinned at both ends of the spectrum", () => {
    const left = 100;
    const width = 600;
    expect(proximityFill(50_000, left, width)).toBeCloseTo(0.8);
    expect(proximityFill(-50_000, left, width)).toBeCloseTo(0.2);
  });

  it("reaches the ends exactly 150px outside the box and rises monotonically across the zone", () => {
    const left = 100;
    const width = 600;
    const right = left + width;
    // the proximity zone is the box grown by the baked 150px radius on each side
    expect(proximityFill(left - 150, left, width)).toBeCloseTo(0.2);
    expect(proximityFill(right + 150, left, width)).toBeCloseTo(0.8);
    // still inside the box edge the cursor hasn't yet reached the end anchor
    expect(proximityFill(left, left, width)).toBeGreaterThan(0.2);
    expect(proximityFill(right, left, width)).toBeLessThan(0.8);
    // sampling left→right across the zone climbs without reversing
    const xs = [-150, 0, 150, 300, 450, 600, 750].map((dx) =>
      proximityFill(left + dx, left, width),
    );
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
  });
});
