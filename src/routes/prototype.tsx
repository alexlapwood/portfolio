import {
  createSignal,
  createUniqueId,
  For,
  Match,
  onCleanup,
  Show,
  Switch,
} from "solid-js";
// Mirror index.tsx's imports so this route renders in JetBrains Mono with the
// same scoped tokens (--line/--line2 + the .st font), then layer on the
// throwaway prototype styles. app.css (global --rainbow, Tailwind, Preflight)
// is already pulled in by src/app.tsx for every route.
import "../styles/shader-terminal.css";
import "../styles/prototype.css";

/*
  /prototype — a throwaway design sandbox for evaluating the contact-form "sent"
  screen. Fully self-contained: it never imports or calls the real contact form
  or its server action (src/server/contact.ts). On submit it runs a LOCAL
  two-beat animation only — no network, no FormData round-trip.

  State machine (two Solid signals):

    selected : 1 | 2 | 3 | 4   — which centrepiece the "sent" screen shows.
    phase    : "form"          — the mini contact form is visible.
             | "collapsing"    — BEAT 1: form body collapses/fades up (~180ms).
             | "sent"          — BEAT 2: "sent" screen fades+rises in (~220ms).

  Transition, driven by one setTimeout so it stays robust:
    submit → phase="collapsing"; then after 180ms collapse + 120ms gap = 300ms
    → phase="sent". Resetting (send_another / replay) clears the timer and
    returns to "form". The centrepiece is keyed on `selected()` so switching the
    option (or re-entering "sent") remounts it and replays its entrance.
*/

type Option = 1 | 2 | 3 | 4;
type Phase = "form" | "collapsing" | "sent";

const OPTIONS: { n: Option; label: string }[] = [
  { n: 1, label: "draw-on check" },
  { n: 2, label: "typed line" },
  { n: 3, label: "spinning ring" },
  { n: 4, label: "departing ↗" },
];

// The 8 rainbow stops, red pinned at both ends — the site's single accent.
const RAINBOW_STOPS = [
  "#ff004d",
  "#ff6a00",
  "#ffd500",
  "#00e08a",
  "#00b8ff",
  "#7a5cff",
  "#ff00c8",
  "#ff004d",
];

// Shared field styling, copied from index.tsx so the mini form matches the real
// one (dead-black surface, hairline border, white inset-glow focus).
const field =
  "block w-full bg-[#060606] border border-[var(--line2)] text-[0.9rem] px-[0.85rem] py-[0.7rem] text-white caret-white focus:outline-none focus:border-[var(--accent)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]";
const fieldLabel =
  "block text-[0.74rem] mb-[0.45rem] tracking-[0.02em] text-neutral-300";
// Small terminal control (used by send_another / replay): bordered, muted,
// white on hover.
const ctrl =
  "inline-flex items-center border border-[var(--line2)] bg-transparent px-[0.8rem] py-[0.45rem] text-[0.78rem] text-neutral-400 cursor-pointer transition-colors duration-150 hover:text-white hover:border-neutral-600";

// ── Centrepiece 1 — draw-on rainbow check ──────────────────────────────────
// Inline SVG check; stroke is a per-instance rainbow gradient (unique id so
// multiple instances on the page don't collide). Draw-on lives in prototype.css.
function CheckMark() {
  const id = createUniqueId();
  return (
    <svg
      class="pt-check"
      viewBox="0 0 32 24"
      width="64"
      height="48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="32"
          y2="0"
        >
          <For each={RAINBOW_STOPS}>
            {(c, i) => (
              <stop
                offset={`${(i() / (RAINBOW_STOPS.length - 1)) * 100}%`}
                stop-color={c}
              />
            )}
          </For>
        </linearGradient>
      </defs>
      <path
        class="pt-check-path"
        d="M4 13 L12 21 L28 4"
        stroke={`url(#${id})`}
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

// ── Centrepiece 2 — typed terminal line ─────────────────────────────────────
function TypedLine() {
  return (
    <div class="pt-typed" aria-hidden="true">
      <span class="pt-typed-text">✓ sent</span>
      <span class="pt-cursor">▌</span>
    </div>
  );
}

// ── Centrepiece 3 — spinning rainbow ring ───────────────────────────────────
function SpinRing() {
  return (
    <div class="pt-ring-wrap" aria-hidden="true">
      <div class="pt-ring" />
      <span class="pt-ring-check">✓</span>
    </div>
  );
}

// ── Centrepiece 4 — departing ↗ ─────────────────────────────────────────────
function DepartArrow() {
  return (
    <div class="pt-depart-wrap" aria-hidden="true">
      <span class="pt-depart">↗</span>
    </div>
  );
}

// Dispatch to the selected centrepiece. Mounting/remounting this element is what
// (re)starts its CSS entrance.
function Centrepiece(props: { n: Option }) {
  return (
    <Switch>
      <Match when={props.n === 1}>
        <CheckMark />
      </Match>
      <Match when={props.n === 2}>
        <TypedLine />
      </Match>
      <Match when={props.n === 3}>
        <SpinRing />
      </Match>
      <Match when={props.n === 4}>
        <DepartArrow />
      </Match>
    </Switch>
  );
}

// Titlebar traffic-light dots (#262626, #2a2a2a, #262626), reused by the demo
// window and the comparison cards.
function Dots() {
  return (
    <>
      <span class="h-[9px] w-[9px] rounded-full bg-[#262626]" aria-hidden="true" />
      <span class="h-[9px] w-[9px] rounded-full bg-[#2a2a2a]" aria-hidden="true" />
      <span class="h-[9px] w-[9px] rounded-full bg-[#262626]" aria-hidden="true" />
    </>
  );
}

// A comparison card: one centrepiece auto-looping on its own ~4s cadence (pure
// CSS), plus a replay link that remounts the centrepiece to restart it now. Its
// own local `key` signal keeps each card's replay independent.
function CompareCard(props: { n: Option; label: string }) {
  const [key, setKey] = createSignal(1);
  return (
    <div class="w-[280px] shrink-0 border border-[var(--line2)] bg-[#050505]">
      <div class="flex items-center gap-[0.6ch] px-[1rem] py-[0.6rem] text-[0.68rem]">
        <Dots />
        <span class="ml-[0.6ch] tracking-[0.06em] text-neutral-500">
          {props.n} {props.label}
        </span>
      </div>
      <div class="pt-hairline" />
      <div class="flex flex-col items-center gap-[0.9rem] px-[1rem] py-[1.4rem]">
        <div class="flex h-[58px] items-center justify-center">
          {/* keyed on `key()` so a replay recreates the DOM → restarts the CSS
              animation from 0. */}
          <Show when={key()} keyed>
            {() => <Centrepiece n={props.n} />}
          </Show>
        </div>
        <button
          type="button"
          class="text-[0.72rem] text-neutral-500 transition-colors duration-150 hover:text-white"
          onClick={() => setKey((k) => k + 1)}
        >
          replay
        </button>
      </div>
    </div>
  );
}

export default function Prototype() {
  const [selected, setSelected] = createSignal<Option>(1);
  const [phase, setPhase] = createSignal<Phase>("form");
  let formRef: HTMLFormElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  onCleanup(clearTimer);

  // LOCAL two-beat transition — no network. BEAT 1 collapse (180ms) + gap
  // (120ms) → BEAT 2 "sent" at 300ms.
  function runTransition(e: Event) {
    e.preventDefault();
    if (phase() !== "form") return; // already mid-flight or shown
    setPhase("collapsing");
    clearTimer();
    timer = setTimeout(() => {
      timer = undefined;
      setPhase("sent");
    }, 300);
  }

  // Return to the form. `clear` wipes the fields (send_another); replay keeps
  // them so re-running the transition is a single click away.
  function resetToForm(clear: boolean) {
    clearTimer();
    setPhase("form");
    if (clear) formRef?.reset();
  }

  return (
    // Same .st terminal root + black background as index.tsx, so JetBrains Mono
    // and the scoped tokens apply. This route owns no shared chrome.
    <div class="st min-h-dvh overflow-x-hidden bg-black leading-normal text-white selection:bg-white selection:text-black">
      <main class="mx-auto w-full max-w-[720px] px-[clamp(1rem,4vw,2.5rem)] py-[clamp(2.5rem,8vw,5rem)]">
        {/* A) heading line — terminal voice */}
        <h1 class="text-[0.9rem] tracking-[0.04em]">
          <span class="text-[#5a5a5a]" aria-hidden="true">
            //
          </span>{" "}
          prototype — contact "sent" screen
        </h1>
        <p class="mt-[0.6rem] text-[0.76rem] text-[#5a5a5a]">
          local-only sandbox · nothing is sent
        </p>

        {/* B) PRIMARY — centrepiece selector + working two-beat demo */}
        <section class="mt-[2.4rem]">
          {/* centrepiece selector (segmented row) */}
          <div class="mb-[0.7rem] text-[0.7rem] tracking-[0.06em] text-[#5a5a5a]">
            centrepiece
          </div>
          <div
            role="radiogroup"
            aria-label="Centrepiece"
            class="inline-flex flex-wrap border border-[var(--line2)] bg-[#050505]"
          >
            <For each={OPTIONS}>
              {(o, i) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected() === o.n}
                  onClick={() => setSelected(o.n)}
                  class="px-[0.9rem] py-[0.5rem] text-[0.76rem] tracking-[0.01em] transition-colors duration-150"
                  classList={{
                    "border-l border-[var(--line2)]": i() > 0,
                    "bg-white/[0.06] text-white": selected() === o.n,
                    "text-neutral-500 hover:text-neutral-300":
                      selected() !== o.n,
                  }}
                >
                  <span class="text-[#5a5a5a]" aria-hidden="true">
                    {o.n}
                  </span>{" "}
                  {o.label}
                </button>
              )}
            </For>
          </div>

          {/* replay — resets to the form so the transition can be re-run */}
          <div class="mt-[0.9rem]">
            <button type="button" class={ctrl} onClick={() => resetToForm(false)}>
              <span aria-hidden="true">{"> "}</span>replay
            </button>
          </div>

          {/* the terminal window: titlebar → rainbow hairline → body. The shell
              is kept; only its contents swap between form and "sent". */}
          <div class="mt-[1.2rem] w-full max-w-[560px] border border-[var(--line2)] bg-[#050505]">
            {/* titlebar — caption flips //contact → //sent on the "sent" beat */}
            <div class="flex items-center gap-[0.6ch] px-[1.4rem] py-[0.7rem] text-[0.72rem]">
              <Dots />
              <span
                class="ml-[0.6ch] tracking-[0.06em] text-neutral-500"
                aria-hidden="true"
              >
                {phase() === "sent" ? "//sent" : "//contact"}
              </span>
            </div>
            {/* 3px rainbow hairline — replays a scaleX wipe on the "sent" beat */}
            <div
              class="pt-hairline"
              classList={{ "pt-hairline--wipe": phase() === "sent" }}
            />

            {/* body — min-height keeps the shell from jumping as contents swap */}
            <div class="min-h-[300px] p-[1.4rem]">
              <Show when={phase() !== "sent"}>
                <form
                  ref={formRef}
                  onSubmit={runTransition}
                  prop:noValidate={true}
                  class="flex flex-col gap-[1.1rem]"
                  classList={{
                    "pt-form-body--collapsing": phase() === "collapsing",
                  }}
                >
                  <div>
                    <label class={fieldLabel} for="p-name">
                      <span class="mr-[0.4ch] text-white" aria-hidden="true">
                        {">"}
                      </span>
                      name
                    </label>
                    <input
                      id="p-name"
                      name="name"
                      type="text"
                      class={field}
                      autocomplete="off"
                    />
                  </div>
                  <div>
                    <label class={fieldLabel} for="p-email">
                      <span class="mr-[0.4ch] text-white" aria-hidden="true">
                        {">"}
                      </span>
                      email
                    </label>
                    <input
                      id="p-email"
                      name="email"
                      type="email"
                      class={field}
                      autocomplete="off"
                    />
                  </div>
                  <div>
                    <label class={fieldLabel} for="p-msg">
                      <span class="mr-[0.4ch] text-white" aria-hidden="true">
                        {">"}
                      </span>
                      message
                    </label>
                    <textarea
                      id="p-msg"
                      name="message"
                      class={`${field} min-h-[116px] resize-y leading-[1.55]`}
                    />
                  </div>
                  {/* Styled like the real .send button (shader-terminal.css) —
                      the --magnet ring falls back to --rainbow with no JS. */}
                  <div>
                    <button
                      type="submit"
                      class="send relative isolate cursor-pointer border border-[var(--line2)] bg-transparent px-[1.15rem] py-[0.6rem] text-[0.86rem] font-bold tracking-[0.02em] text-white transition-[border-color] duration-200"
                    >
                      <span aria-hidden="true">{"> "}</span>send_message
                    </button>
                  </div>
                </form>
              </Show>

              <Show when={phase() === "sent"}>
                <div class="pt-sent flex min-h-[268px] flex-col items-center justify-center text-center">
                  <div class="flex h-[58px] items-center justify-center">
                    {/* keyed on the selected option: entering "sent" mounts it,
                        and switching the selector remounts it — either way the
                        entrance plays inside the real transition. */}
                    <Show when={selected()} keyed>
                      {(n) => <Centrepiece n={n} />}
                    </Show>
                  </div>
                  <div class="pt-sent-meta mt-[1.4rem] flex flex-col items-center gap-[0.5rem]">
                    <div class="text-[1.05rem] font-bold text-white">
                      message sent
                    </div>
                    <div class="text-[0.82rem] text-neutral-500">
                      i'll get back to you soon.
                    </div>
                    <button
                      type="button"
                      class={`${ctrl} mt-[0.8rem]`}
                      onClick={() => resetToForm(true)}
                    >
                      <span aria-hidden="true">{"> "}</span>send_another
                    </button>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </section>

        {/* C) SECONDARY — side-by-side comparison strip */}
        <section class="mt-[3.2rem]">
          <div class="mb-[1rem] text-[0.8rem] tracking-[0.04em]">
            <span class="text-[#5a5a5a]" aria-hidden="true">
              //
            </span>{" "}
            compare — all four, auto-looping
          </div>
          <div class="flex flex-wrap gap-[1rem]">
            <For each={OPTIONS}>
              {(o) => <CompareCard n={o.n} label={o.label} />}
            </For>
          </div>
        </section>
      </main>
    </div>
  );
}
