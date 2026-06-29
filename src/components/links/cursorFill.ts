// cursorFill — pure cursor→f mapping for the magnet-fill links. Given the
// cursor's viewport x and the link's box (left, width), returns the magnet
// position `f` to feed magnetGradient. The link is the *consumer* that owns
// this mapping; magnetGradient itself stays geometry-free.
// A fixed pixel reference (not the link's own width) so short links don't
// sweep the whole spectrum under tiny cursor moves — they drift only gently.
const REFERENCE = 240;
// Clamp keeps the magnet off the very ends so the red anchors always read as
// anchors, not as the moving band (prototype: f ∈ [0.12, 0.88]).
const MIN = 0.12;
const MAX = 0.88;

export function cursorFill(clientX: number, left: number, width: number): number {
  const centre = left + width / 2;
  const ref = Math.max(width, REFERENCE);
  const f = 0.5 + (clientX - centre) / ref;
  return Math.max(MIN, Math.min(MAX, f));
}
