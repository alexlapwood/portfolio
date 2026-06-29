// proximityFill — the name hero's own cursor→f mapping (the links use the
// separate cursorFill). The cursor is read against the name's box grown by
// PROXIMITY_RADIUS on each side: at the zone's left edge f is MIN, at its right
// edge f is MAX, linear between, clamped so the red anchors at both ends of the
// magnet spectrum never become the moving band. The result f feeds both the
// shader's u_fill and the glow gradient (magnetGradient). Pure, DOM-free.

// The reveal/magnet proximity radius — the prototype's "Proximity" slider sat
// at its default of 150 (prototype/index.html:425,707), so it's baked in here.
// Shared with the shader's "near" test so the zone and the trigger agree.
export const PROXIMITY_RADIUS = 150;

// f stays within [0.2, 0.8] (prototype/index.html:761), keeping red pinned at
// both ends of the spectrum rather than letting it read as the moving band.
const MIN = 0.2;
const MAX = 0.8;

export function proximityFill(clientX: number, left: number, width: number): number {
  const leftBound = left - PROXIMITY_RADIUS;
  const rightBound = left + width + PROXIMITY_RADIUS;
  const t = (clientX - leftBound) / (rightBound - leftBound);
  const clamped = Math.max(0, Math.min(1, t));
  return MIN + clamped * (MAX - MIN);
}
