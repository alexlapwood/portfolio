// magnetGradient — pure, DOM-free: a normalized position `f ∈ [0, 1]` →
// a `linear-gradient(...)` CSS string. Red is pinned at both 0% and 100%;
// the spectrum's middle is offset by `f` (its green centre sits at `f`),
// so as `f` rises the rainbow band slides rightward between the red anchors.
//
// Consumers own the cursor→`f` mapping (see cursorFill for the link variant).
// Shared by the magnet-fill links and (later) the name hero.
export function magnetGradient(f: number): string {
  const p = f * 100; // the green centre, in %, where the spectrum's middle sits
  const q = 100 - p; // the remaining span out to the red anchor at 100%
  return `linear-gradient(90deg,
    #ff004d 0%,
    #ff6a00 ${(p * 0.33).toFixed(1)}%,
    #ffd500 ${(p * 0.66).toFixed(1)}%,
    #00e08a ${p.toFixed(1)}%,
    #00b8ff ${(p + q * 0.33).toFixed(1)}%,
    #7a5cff ${(p + q * 0.66).toFixed(1)}%,
    #ff00c8 ${(p + q * 0.9).toFixed(1)}%,
    #ff004d 100%)`;
}
