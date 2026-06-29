import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { cursorFill } from "~/components/links/cursorFill";
import { useMagnetFill } from "~/components/links/useMagnetFill";
import { NameHero } from "~/components/name";
import { magnetGradient } from "~/lib/magnetGradient";
import "../styles/shader-terminal.css";

// Each project's "thumbnail" is now its live site's favicon, imported as a Vite
// asset rather than referenced by URL — Vite bundles + fingerprints each file
// and hands back a resolved URL. (These live in src/assets/favicons/ so there's
// no longer any fragile cross-import into the legacy `old/` folder, which the
// dev server doesn't serve.)
import spotifyThumb from "../assets/favicons/spotify_playlist.png";
import wumpaThumb from "../assets/favicons/wumpa_time.png";
import stardewThumb from "../assets/favicons/stardew_planner.png";
import buildItThumb from "../assets/favicons/build_it.png";
import dirtySouthThumb from "../assets/favicons/dirty_south.png";

// The Work index. Every row is a live project: a navigable <a> opening the site
// in a new tab, with an imported, fingerprinted thumbnail image.
type Project = {
  title: string;
  summary: string;
  href: string;
  thumb: string;
  alt: string;
  // Marks the thumbnail as pixel-art so its <img> gets crisp nearest-neighbour
  // scaling (image-rendering: pixelated) instead of the browser's default smooth
  // resampling. Only Stardew Planner's favicon is a tiny 16×16 sprite scaled up
  // to 42px; the other four are real high-res PNGs that must stay smooth.
  pixelated?: boolean;
};

const WORK: Project[] = [
  {
    title: "Spotify Playlist",
    summary:
      "Generate a fresh playlist from the artists of any Spotify playlist.",
    href: "https://spotifyplaylist.app",
    thumb: spotifyThumb,
    alt: "Spotify Playlist icon",
  },
  {
    title: "Wumpa Time",
    summary:
      "Time tracker for Crash Team Racing Nitro-Fueled — chase max Wumpa Coins.",
    href: "https://wumpa.app",
    thumb: wumpaThumb,
    alt: "Wumpa Time icon",
  },
  {
    title: "Stardew Planner",
    summary:
      "Plan a Stardew Valley farm: crop growth, sprinklers and scarecrow coverage.",
    href: "https://stardewplanner.app",
    thumb: stardewThumb,
    alt: "Stardew Planner icon",
    // 16×16 pixel-art favicon scaled to 42px — render with crisp pixel scaling.
    pixelated: true,
  },
  {
    title: "Build It",
    summary: "Material-Design web app for teams to discuss project documents.",
    href: "https://host-it.co.nz/~buildit",
    thumb: buildItThumb,
    alt: "Build It icon",
  },
  {
    title: "Dirty South",
    summary: "Online store taking a kiwi clothing brand to customers worldwide.",
    href: "https://dirtysouth.co.nz",
    thumb: dirtySouthThumb,
    alt: "Dirty South icon",
  },
];

type FormStatus = { kind: "info" | "ok" | "err"; text: string };

// Home (/) — the single scrolling page: command bar + WebGL paint-reveal hero +
// Work table + terminal contact form + footer, with hash-anchor nav between the
// sections. This route owns ALL of its chrome (Shell.tsx is a pass-through), so
// the bar / hero / work / contact / footer render bare. The whole page is
// wrapped in a single `.st` root so the co-located stylesheet stays scoped to
// it; plain text colours are Tailwind utilities on the elements (text-white by
// default here), the bespoke chrome is in styles/shader-terminal.css.
export default function Home() {
  let rootRef!: HTMLDivElement;
  let homeRef!: HTMLAnchorElement;
  let sendRef!: HTMLButtonElement;
  const [status, setStatus] = createSignal<FormStatus | null>(null);
  let sendTimer: number | undefined;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  onMount(() => {
    // The home wordmark is a plain <a class="l-fill"> (not <FillLink>, which
    // doesn't forward onClick) so it can intercept the click and smooth-scroll
    // to the top instead of triggering a full reload of "/". useMagnetFill gives
    // it the same cursor-tracked rainbow text-fill FillLink would have applied.
    useMagnetFill(homeRef);

    const root = rootRef;
    // Grouped rainbow: the nav and the footer-right list each share ONE
    // continuous rainbow, but only the link under the cursor lights at a time —
    // every member still painting its own contiguous slice of the shared static
    // var(--rainbow). For each [data-rainbow-group] we measure its box and write
    // two CSS vars onto every [data-rainbow-item]: --grp-w (the group's pixel
    // width) and --grp-x (the member's negative offset within the group). The
    // scoped CSS feeds those into background-size / background-position so each
    // item is a window onto the same gradient, anchored to the group's left
    // edge. The nav hash anchors stay plain <a href="#…"> so the global
    // scroll-behavior: smooth handles the in-page jump. (Singular links — the
    // home wordmark <a> and the send button — keep their own cursor-tracked
    // magnet; the lone GitHub icon keeps its per-item rainbow.)
    const paintRainbowGroup = (group: HTMLElement) => {
      const g = group.getBoundingClientRect();
      group
        .querySelectorAll<HTMLElement>("[data-rainbow-item]")
        .forEach((item) => {
          const r = item.getBoundingClientRect();
          item.style.setProperty("--grp-w", `${g.width}px`);
          item.style.setProperty("--grp-x", `${-(r.left - g.left)}px`);
        });
    };
    const groups = Array.from(
      root.querySelectorAll<HTMLElement>("[data-rainbow-group]"),
    );
    const paintAll = () => groups.forEach(paintRainbowGroup);
    // First paint once layout has settled; pointerenter recomputes a group's
    // geometry right before it's shown, so it stays correct after font load /
    // reflow / resize (the rainbow only ever appears on hover anyway).
    requestAnimationFrame(paintAll);
    const onEnter = (e: Event) =>
      paintRainbowGroup(e.currentTarget as HTMLElement);
    groups.forEach((g) => g.addEventListener("pointerenter", onEnter));
    window.addEventListener("resize", paintAll);
    onCleanup(() => {
      window.removeEventListener("resize", paintAll);
      groups.forEach((g) => g.removeEventListener("pointerenter", onEnter));
    });

    // The Work cards' flowing-rainbow borders are pure CSS (shared .flow-ring,
    // gated on :hover). The send button is the one exception: it wears the same
    // cursor-tracked magnet rainbow as the nav links, so we keep its --magnet
    // custom property in sync with the cursor here. The CSS reads --magnet for
    // both the label text fill and the .send::before border ring on hover/focus;
    // until the first move it falls back to the global --rainbow. Moves are
    // coalesced into one rAF (matching useMagnetFill) and the listener is removed
    // on cleanup.
    const btn = sendRef;
    let frame = 0;
    let lastX = 0;
    const onSendMove = (e: MouseEvent) => {
      lastX = e.clientX;
      if (frame) return; // a write is already scheduled for this frame
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = btn.getBoundingClientRect();
        btn.style.setProperty(
          "--magnet",
          magnetGradient(cursorFill(lastX, r.left, r.width)),
        );
      });
    };
    btn.addEventListener("mousemove", onSendMove);
    onCleanup(() => {
      btn.removeEventListener("mousemove", onSendMove);
      if (frame) cancelAnimationFrame(frame);
    });
  });

  onCleanup(() => {
    if (sendTimer) clearTimeout(sendTimer);
  });

  function handleSubmit(e: Event) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const honey = String(data.get("company") ?? "");

    if (honey) return; // bot tripped the honeypot
    if (!name || !email || !message) {
      setStatus({ kind: "err", text: "! all fields are required." });
      return;
    }
    if (!emailRe.test(email)) {
      setStatus({ kind: "err", text: "! that email looks malformed." });
      return;
    }
    // The form validates only — it never actually delivers (real sending is a
    // separate issue). The brief "sending…" → "queued." beat is just UI feedback.
    setStatus({ kind: "info", text: "› sending…" });
    sendTimer = window.setTimeout(() => {
      setStatus({ kind: "ok", text: "✓ queued." });
      form.reset();
    }, 520);
  }

  return (
    <div ref={rootRef} class="st text-white">
      <div class="rails" aria-hidden="true" />

      {/* ───────────── Command bar ───────────── */}
      <header class="bar">
        <div class="col">
          {/* Home wordmark. A plain <a class="l-fill"> rather than a <FillLink>
              (which doesn't forward onClick): since this page IS "/", clicking
              it should smooth-scroll to the top, not trigger a full reload. The
              l-fill class + useMagnetFill (wired in onMount) reproduce FillLink's
              cursor-tracked rainbow text-fill. href="/" is kept for semantics. */}
          <a
            ref={homeRef}
            href="/"
            class="l-fill home-link"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Alex Lapwood
          </a>
          <nav aria-label="Sections" data-rainbow-group>
            <a class="l-line" href="#projects" data-rainbow-item>
              projects
            </a>
            <a class="l-line" href="#contact" data-rainbow-item>
              contact
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero — the real WebGL paint-reveal name. <NameHero> renders its own
            <section> + <h1>, so this is just a layout wrapper (no extra section). */}
        {/* glowOpacity bumps the name's rainbow bloom a touch brighter than the
            default 0.12 — the whole visible site lives under .st, so this is the
            site-wide glow. */}
        <div class="hero">
          <NameHero glowOpacity={0.14} />
        </div>

        {/* ───────────── Work ───────────── */}
        <section id="projects" class="work" aria-labelledby="projects-title">
          <div class="col">
            <header class="sec-head">
              <span class="hash text-neutral-500" aria-hidden="true">
                //
              </span>
              <h2 id="projects-title">projects</h2>
            </header>

            {/* decorative column legend — the rows below carry their own visible
                labels, so it's hidden from assistive tech */}
            <div class="row-head text-neutral-500" aria-hidden="true">
              <span />
              <span>project</span>
              <span>summary</span>
              <span />
            </div>

            <ul class="rows">
              <For each={WORK}>
                {(p) => (
                  <li>
                    <a
                      class="row"
                      href={p.href}
                      target="_blank"
                      rel="noopener"
                    >
                      {/* shared flowing-rainbow border, hover-only for cards
                          (position:absolute, so it's out of the row's grid) */}
                      <span class="flow-ring" aria-hidden="true" />
                      <img
                        class={`thumb${p.pixelated ? " thumb--pixel" : ""}`}
                        src={p.thumb}
                        alt={p.alt}
                        width={42}
                        height={42}
                        loading="lazy"
                      />
                      <span class="title">{p.title}</span>
                      <span class="summary text-neutral-300">{p.summary}</span>
                      <span class="arrow text-neutral-500" aria-hidden="true">
                        ↗
                      </span>
                      <span class="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </section>

        {/* ───────────── Contact ───────────── */}
        <section id="contact" class="contact" aria-labelledby="contact-title">
          <div class="col">
            {/* The visible "// contact" header was removed — the command bar's
                //contact indicator now names this screen. A visually-hidden
                heading is kept so the section's accessible name
                (aria-labelledby) and the document outline stay intact. */}
            <h2 id="contact-title" class="sr-only">
              contact
            </h2>

            {/* prop:noValidate sets the DOM property directly — native
                validation stays off so our JS validation owns the messaging. */}
            <form class="term" onSubmit={handleSubmit} prop:noValidate={true}>
              {/* terminal-window titlebar: traffic-light dots on the left, then a
                  left-aligned //contact window caption just after them (normal
                  flow). Purely decorative chrome (aria-hidden) — the section's
                  accessible name comes from the sr-only <h2 id="contact-title">
                  above. */}
              <div class="term-bar">
                <span class="tdot" aria-hidden="true" />
                <span class="tdot" aria-hidden="true" />
                <span class="tdot" aria-hidden="true" />
                <span class="term-title text-neutral-500" aria-hidden="true">
                  //contact
                </span>
              </div>
              <div class="term-body">
                <div class="field">
                  <label class="text-neutral-300" for="f-name">
                    <span class="pr text-white" aria-hidden="true">
                      {">"}
                    </span>
                    name
                  </label>
                  <input
                    id="f-name"
                    name="name"
                    type="text"
                    class="text-white"
                    autocomplete="name"
                  />
                </div>
                <div class="field">
                  <label class="text-neutral-300" for="f-email">
                    <span class="pr text-white" aria-hidden="true">
                      {">"}
                    </span>
                    email
                  </label>
                  <input
                    id="f-email"
                    name="email"
                    type="email"
                    class="text-white"
                    autocomplete="email"
                  />
                </div>
                <div class="field">
                  <label class="text-neutral-300" for="f-msg">
                    <span class="pr text-white" aria-hidden="true">
                      {">"}
                    </span>
                    message
                  </label>
                  <textarea id="f-msg" name="message" class="text-white" />
                </div>
                {/* honeypot — visually hidden + hidden from AT, untabbable; a
                    real human never fills it, so a non-empty value means a bot */}
                <div class="hp" aria-hidden="true">
                  <label>
                    Leave this empty
                    <input
                      type="text"
                      name="company"
                      tabindex="-1"
                      autocomplete="off"
                    />
                  </label>
                </div>
                <div class="send-row">
                  <button ref={sendRef} class="send" type="submit">
                    <span aria-hidden="true">{"> "}</span>send_message
                  </button>
                  <span class="form-status text-neutral-300" role="status">
                    <Show when={status()}>
                      {(s) => (
                        <span
                          classList={{
                            "text-emerald-400": s().kind === "ok",
                            "text-rose-500": s().kind === "err",
                          }}
                        >
                          {s().text}
                        </span>
                      )}
                    </Show>
                  </span>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer>
        <div class="col">
          {/* GitHub — icon only, far-left. Not a FillLink: that component renders
              no accessible name for an icon-only link, so a plain <a> carries the
              aria-label. The icon is a masked <span> (.ic-github) — its box
              background paints through the glyph, going rainbow on hover. */}
          <ul class="links links-left">
            <li>
              <a
                class="foot-ic"
                href="https://github.com/alexlapwood"
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
              >
                <span class="ic ic-github" aria-hidden="true" />
              </a>
            </li>
          </ul>
          {/* LinkedIn (icon only) + email, grouped right. data-rainbow-group +
              the per-leaf data-rainbow-item marks make each link a slice of one
              continuous rainbow; only the hovered link lights (see onMount + the
              scoped CSS). */}
          <ul class="links links-right" data-rainbow-group>
            <li>
              <a
                class="foot-ic"
                href="https://www.linkedin.com/in/alexlapwood"
                target="_blank"
                rel="noopener"
                aria-label="LinkedIn"
              >
                <span class="ic ic-linkedin" aria-hidden="true" data-rainbow-item />
              </a>
            </li>
            <li>
              {/* Email is a plain <a> (was a FillLink): dropping FillLink stops
                  its self-applied cursor-tracked magnet from fighting the group
                  rainbow. Each link is a contiguous slice of one continuous
                  var(--rainbow) spanning the right group — this address + its
                  envelope icon, plus the LinkedIn icon — but only the hovered
                  link lights (its icon + text together). Resting state stays
                  white (text-white + the icon's currentColor box). */}
              <a
                class="mail text-white"
                href="mailto:contact@alexlapwood.com"
                data-rainbow-item
              >
                <span class="ic ic-mail" aria-hidden="true" data-rainbow-item />
                contact@alexlapwood.com
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
