import { describe, expect, it } from "vitest";
import { glyphHalfExtent } from "./glyphHalfExtent";

// glyphHalfExtent turns the measured text metrics (in mask-canvas pixels) into
// the name's half-extent in 0..1 uv space — the u_half uniform the shader uses
// to remap the rainbow across exactly the glyphs and to size the paint sweep to
// the text's real extent. Pure: metrics + mask size → { halfW, halfH }.
describe("glyphHalfExtent", () => {
  it("halves the measured width/height into uv space against the mask", () => {
    // width 600 of a 1000px-wide mask → half-width 0.3 uv
    // ascent 160 + descent 40 = 200 of a 1000px-tall mask → half-height 0.1 uv
    const { halfW, halfH } = glyphHalfExtent(600, 160, 40, 1000, 1000, 200);
    expect(halfW).toBeCloseTo(0.3);
    expect(halfH).toBeCloseTo(0.1);
  });

  it("falls back to font-size-proportional ascent/descent when box metrics are absent", () => {
    // browsers/jsdom that don't report actualBoundingBox give 0 (or NaN);
    // height then comes from the font size: ascent 0.7·size, descent 0.2·size.
    // size 200 → asc 140 + desc 40 = 180 of a 1000px mask → half-height 0.09 uv
    const zero = glyphHalfExtent(600, 0, 0, 1000, 1000, 200);
    expect(zero.halfH).toBeCloseTo(0.09);
    const nan = glyphHalfExtent(600, NaN, NaN, 1000, 1000, 200);
    expect(nan.halfH).toBeCloseTo(0.09);
    // the width axis is independent of the height fallback
    expect(zero.halfW).toBeCloseTo(0.3);
  });
});
