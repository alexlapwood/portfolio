import { describe, expect, it } from "vitest";
import { magnetGradient } from "~/lib/magnetGradient";

describe("magnetGradient", () => {
  it("is a linear-gradient with red pinned at 0% and 100% across the f range", () => {
    for (const f of [0, 0.12, 0.5, 0.88, 1]) {
      const g = magnetGradient(f);
      expect(g.startsWith("linear-gradient(")).toBe(true);
      expect(g.trimEnd().endsWith(")")).toBe(true);
      // red is the spectrum's anchor — locked at both ends for every f
      expect(g).toContain("#ff004d 0%");
      expect(g).toContain("#ff004d 100%");
    }
  });

  it("slides the spectrum's middle rightward as f grows, keeping stops ordered", () => {
    // the green centre marks the middle of the spectrum; it should advance
    // monotonically with f
    const greenStop = (f: number) => {
      const m = magnetGradient(f).match(/#00e08a\s+(\d+(?:\.\d+)?)%/);
      if (!m) throw new Error(`no green stop in gradient for f=${f}`);
      return parseFloat(m[1]);
    };
    const centres = [0.1, 0.3, 0.5, 0.7, 0.9].map(greenStop);
    for (let i = 1; i < centres.length; i++) {
      expect(centres[i]).toBeGreaterThan(centres[i - 1]);
    }

    // every emitted gradient is renderable: stops run 0% → 100%, non-decreasing
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const pcts = [...magnetGradient(f).matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) =>
        parseFloat(m[1]),
      );
      expect(pcts[0]).toBe(0);
      expect(pcts[pcts.length - 1]).toBe(100);
      for (let i = 1; i < pcts.length; i++) {
        expect(pcts[i]).toBeGreaterThanOrEqual(pcts[i - 1]);
        expect(pcts[i]).toBeLessThanOrEqual(100);
      }
    }
  });
});
