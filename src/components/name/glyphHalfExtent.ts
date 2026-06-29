// glyphHalfExtent — measured text metrics (mask-canvas pixels) → the name's
// half-extent in 0..1 uv space, the shader's u_half uniform. The shader uses it
// to remap the rainbow across exactly the glyph extent (full spectrum on the
// letters) and to size the paint sweep to the text's real extent. Pure.
//
// When a browser (or jsdom) doesn't report the actual glyph box, ascent/descent
// come back as 0 or NaN; we then fall back to font-size-proportional defaults
// (0.7·size ascent, 0.2·size descent), matching prototype/index.html:683-686.
export function glyphHalfExtent(
  textWidth: number,
  ascent: number,
  descent: number,
  maskWidth: number,
  maskHeight: number,
  fontSize: number,
): { halfW: number; halfH: number } {
  const asc = ascent > 0 ? ascent : fontSize * 0.7;
  const desc = descent > 0 ? descent : fontSize * 0.2;
  return {
    halfW: textWidth / 2 / maskWidth,
    halfH: (asc + desc) / 2 / maskHeight,
  };
}
