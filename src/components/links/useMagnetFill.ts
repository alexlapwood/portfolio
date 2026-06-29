import { onCleanup } from "solid-js";
import { magnetGradient } from "~/lib/magnetGradient";
import { cursorFill } from "./cursorFill";

// Wires a magnet-fill anchor's per-frame cursor work. Each pointer move maps
// the cursor to f (cursorFill) and writes the matching gradient
// (magnetGradient) straight to element.style — both as the text-fill image and
// as --ul-grad for the underline (LineLink). Moves are coalesced into a single
// requestAnimationFrame so at most one write runs per frame; onCleanup removes
// the listener and cancels any pending frame, so nothing leaks when the link
// unmounts (e.g. on client-side navigation). Call from onMount (browser only,
// after the element exists).
export function useMagnetFill(el: HTMLElement): void {
  const apply = (g: string) => {
    el.style.backgroundImage = g; // shows through the text on hover
    el.style.setProperty("--ul-grad", g); // matching underline (LineLink)
  };
  apply(magnetGradient(0.5)); // rest at the centre until the cursor moves

  let frame = 0;
  let lastX = 0;
  const onMove = (e: MouseEvent) => {
    lastX = e.clientX;
    if (frame) return; // a write is already scheduled for this frame
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = el.getBoundingClientRect();
      apply(magnetGradient(cursorFill(lastX, r.left, r.width)));
    });
  };
  el.addEventListener("mousemove", onMove);

  onCleanup(() => {
    el.removeEventListener("mousemove", onMove);
    if (frame) cancelAnimationFrame(frame);
  });
}
