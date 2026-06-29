import { createSignal, onMount } from "solid-js";
import { useNameShader } from "./useNameShader";

// NameHero — the WebGL paint-reveal name, sole content of "/". A permanent
// rainbow glow sits behind a canvas that renders "Alex Lapwood" in white until
// the cursor nears it, then sweeps the rainbow in along the cursor's movement
// vector (see useNameShader for the effect). The shader + rAF loop init in
// onMount and tear down in onCleanup, so they only ever run while "/" is
// mounted. An <h1> carries the accessible/printable name: visually hidden while
// the canvas paints it, and revealed as a plain-text fallback if WebGL is
// unavailable.
//
// `glowOpacity` (optional) tunes the resting brightness of the rainbow bloom
// when the cursor is near. It defaults to undefined, which lets useNameShader
// fall back to its own 0.12 default — so the "/" route (no prop) is unchanged;
// the /prototype route passes a slightly higher value for a touch more glow.
export function NameHero(props: { glowOpacity?: number }) {
  let canvas!: HTMLCanvasElement;
  let glow!: HTMLDivElement;
  const [unsupported, setUnsupported] = createSignal(false);

  onMount(() =>
    useNameShader(canvas, glow, () => setUnsupported(true), props.glowOpacity),
  );

  return (
    <section class="relative isolate flex min-h-[calc(100dvh-8rem)] items-center justify-center overflow-hidden">
      <div
        ref={glow}
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-[-1] bg-center bg-no-repeat opacity-0 blur-[130px] [background-image:var(--rainbow)] [background-size:min(92vw,880px)_60%] [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat] [transition:opacity_0.25s_ease] [will-change:opacity]"
      />
      <canvas
        ref={canvas}
        aria-hidden="true"
        classList={{ hidden: unsupported() }}
        class="relative z-[1] block h-[clamp(110px,20vw,180px)] w-[min(92vw,880px)]"
      />
      <h1
        classList={{ "sr-only": !unsupported() }}
        class="text-center text-[clamp(2.2rem,9vw,6rem)] font-extrabold tracking-tight"
      >
        Alex Lapwood
      </h1>
    </section>
  );
}
