import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { useAction } from "@solidjs/router";
import { cursorFill } from "~/components/links/cursorFill";
import { useMagnetFill } from "~/components/links/useMagnetFill";
import { NameHero } from "~/components/name";
import { WorkModal, type Project } from "~/components/WorkModal";
import { magnetGradient } from "~/lib/magnetGradient";
import { submitContact } from "~/server/contact";
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

// Per-project screenshots for the detail modal. Copied out of the legacy
// `old/public/img/<id>/screenshots` set into src/assets/work/<id>/ and imported
// the same way as the favicons above — Vite bundles + fingerprints each and
// hands back a resolved URL, so nothing reaches into the un-served `old/` folder
// at runtime. Ordered narratively (the sequence the modal shows them in).
import spotifyShot1 from "../assets/work/spotify_playlist/page-1.png";
import spotifyShot2 from "../assets/work/spotify_playlist/page-2.png";
import spotifyShot3 from "../assets/work/spotify_playlist/page-3.png";
import wumpaShot1 from "../assets/work/wumpa_time/page-1.png";
import wumpaShot2 from "../assets/work/wumpa_time/page-2.png";
import stardewShot1 from "../assets/work/stardew_planner/planner.png";
import buildItShot1 from "../assets/work/build_it/login.jpg";
import buildItShot2 from "../assets/work/build_it/projects.jpg";
import buildItShot3 from "../assets/work/build_it/project.jpg";
import buildItShot4 from "../assets/work/build_it/project-settings.jpg";
import dirtySouthShot1 from "../assets/work/dirty_south/home.jpg";
import dirtySouthShot2 from "../assets/work/dirty_south/product-category.jpg";
import dirtySouthShot3 from "../assets/work/dirty_south/product.jpg";
import dirtySouthShot4 from "../assets/work/dirty_south/cart.jpg";
import dirtySouthShot5 from "../assets/work/dirty_south/checkout.jpg";

// The Work index. Every row is a live project. The `Project` shape is owned by
// WorkModal (its data contract); a row is now a <button> that opens that in-page
// detail modal — which holds the write-up, screenshots, and the links-out — so
// the summary table itself no longer navigates straight to the live site.
// TODO(Alex): add `repo` URLs (public source) so the modal's repo link-out shows
// — left off here rather than guessing URLs.

const WORK: Project[] = [
  {
    title: "Spotify Playlist",
    kind: "PWA",
    summary:
      "Generate a fresh playlist from the artists of any Spotify playlist.",
    // Drafted from the legacy site's own copy — Alex's words, but confirm before
    // publishing. // TODO(Alex): confirm copy
    description:
      "Use the artists on any Spotify playlist as the template for a brand-new one. A friendly UI over the Spotify API, shipped as a progressive web app for Android, iOS, macOS and the web.",
    href: "https://spotifyplaylist.app",
    thumb: spotifyThumb,
    alt: "Spotify Playlist icon",
    screenshots: [spotifyShot1, spotifyShot2, spotifyShot3],
  },
  {
    title: "Wumpa Time",
    kind: "PWA",
    summary:
      "Time tracker for Crash Team Racing Nitro-Fueled — chase max Wumpa Coins.",
    // Drafted from the legacy site's own copy. // TODO(Alex): confirm copy
    description:
      "A time tracker for Crash Team Racing Nitro-Fueled that shows how long is left to collect the day's maximum Wumpa Coins. Built as a progressive web app for Android, iOS, macOS and the web.",
    href: "https://wumpa.app",
    thumb: wumpaThumb,
    alt: "Wumpa Time icon",
    screenshots: [wumpaShot1, wumpaShot2],
  },
  {
    title: "Stardew Planner",
    kind: "PWA",
    summary:
      "Plan a Stardew Valley farm: crop growth, sprinklers and scarecrow coverage.",
    // Drafted from the legacy site's own copy. // TODO(Alex): confirm copy
    description:
      "A planning tool for Stardew Valley farm layouts: visualise how crops grow across the season and where to place sprinklers and scarecrows for full coverage.",
    href: "https://stardewplanner.app",
    thumb: stardewThumb,
    alt: "Stardew Planner icon",
    // 16×16 pixel-art favicon scaled to 42px — render with crisp pixel scaling.
    pixelated: true,
    screenshots: [stardewShot1],
  },
  {
    title: "Build It",
    kind: "WEB APP",
    summary: "Material-Design web app for teams to discuss project documents.",
    // Real copy from old/public/projects.json (Build-It entry).
    description:
      "Build-It is a web application I created to help teams discuss project documents. By following Google’s Material Design guidelines it gives users a clean interface and an intuitive experience, and it’s fully responsive with significant mobile optimisation.",
    href: "https://host-it.co.nz/~buildit",
    thumb: buildItThumb,
    alt: "Build It icon",
    screenshots: [buildItShot1, buildItShot2, buildItShot3, buildItShot4],
  },
  {
    title: "Dirty South",
    kind: "STORE",
    summary: "Online store taking a kiwi clothing brand to customers worldwide.",
    // Real copy from old/public/projects.json (Dirty South entry).
    description:
      "Dirty South’s online store is designed to promote their unique kiwi branding and help reach customers across the globe. The site is fully responsive, making it mobile friendly and easily accessible for shoppers.",
    href: "https://dirtysouth.co.nz",
    thumb: dirtySouthThumb,
    alt: "Dirty South icon",
    screenshots: [
      dirtySouthShot1,
      dirtySouthShot2,
      dirtySouthShot3,
      dirtySouthShot4,
      dirtySouthShot5,
    ],
  },
];

type FormStatus = { kind: "info" | "ok" | "err"; text: string };

// Shared Tailwind clusters, declared once so every reuse stays in sync.
// `col` is the page's content column (the single --gutter inset, capped at
// --col); `screen` is a full-viewport section that reserves the fixed bar (top)
// and footer (bottom) as padding and flex-centres its content between them.
const col = "w-full max-w-[var(--col)] mx-auto px-[var(--gutter)]";
const screen =
  "min-h-dvh flex flex-col justify-center pt-[var(--bar-h)] pb-[var(--footer-h)]";
// Shared field styling for the contact inputs + textarea: dead-black surface, a
// hairline resting border, and the white inset-glow focus treatment.
const field =
  "block w-full bg-[#060606] border border-[var(--line2)] text-[0.9rem] px-[0.85rem] py-[0.7rem] text-white caret-white focus:outline-none focus:border-[var(--accent)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]";
const fieldLabel =
  "block text-[0.74rem] mb-[0.45rem] tracking-[0.02em] text-neutral-300";
// The Work table's grid template (thumb · name · summary · arrow) — shared by the
// header legend and every row so the columns line up down the table. Below 820px
// it collapses to a two-line card (thumb · title/summary · arrow) via grid areas.
const rowGrid =
  "grid grid-cols-[42px_15rem_minmax(0,1fr)_2.1rem] items-center gap-[1.1rem] px-[0.6rem] py-[0.85rem]";

// Home (/) — the single scrolling page: command bar + WebGL paint-reveal hero +
// Work table + terminal contact form + footer, with hash-anchor nav between the
// sections. This route owns ALL of its chrome (Shell.tsx is a pass-through). The
// whole page is wrapped in a single `.st` root so the co-located stylesheet stays
// scoped to it; all layout/spacing/typography is Tailwind on the elements, and
// only the bespoke chrome Tailwind can't express lives in styles/shader-terminal.css.
export default function Home() {
  let rootRef!: HTMLDivElement;
  let homeRef!: HTMLAnchorElement;
  let sendRef!: HTMLButtonElement;
  const [status, setStatus] = createSignal<FormStatus | null>(null);
  // Tracks the in-flight server request so the button can disable while sending.
  const [sending, setSending] = createSignal(false);
  // The Work project whose detail modal is open (null = closed). Setting it opens
  // the modal; the modal captures/returns focus and locks page scroll itself.
  const [active, setActive] = createSignal<Project | null>(null);
  // useAction gives us a plain awaitable bound to the SolidStart server action.
  const sendContact = useAction(submitContact);
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  onMount(() => {
    // The home wordmark is a plain <a class="l-fill"> (not <FillLink>, which
    // doesn't forward onClick) so it can intercept the click and smooth-scroll
    // to the top instead of triggering a full reload of "/". useMagnetFill gives
    // it the same cursor-tracked rainbow text-fill FillLink would have applied.
    useMagnetFill(homeRef);

    const root = rootRef;
    // The page scrolls inside .st (not the document — see app.css), so on
    // classic scrollbars (Windows) the scrollbar lives inside .st while the fixed
    // bars are viewport-relative (right:0) and would overlap it. Measure the
    // scrollbar width into --sbw and inset the bars by it (0 on overlay-scrollbar
    // platforms, so it's a no-op there). Also keeps the bar content aligned with
    // the scrolling content, both centred in the scrollbar-excluded width.
    const setScrollbarWidth = () =>
      root.style.setProperty("--sbw", `${root.offsetWidth - root.clientWidth}px`);
    setScrollbarWidth();
    window.addEventListener("resize", setScrollbarWidth);
    onCleanup(() => window.removeEventListener("resize", setScrollbarWidth));
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

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (sending()) return; // ignore double-submits while a send is in flight
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const honey = String(data.get("company") ?? "");

    if (honey) return; // bot tripped the honeypot — silently ignore
    // Fast client-side pre-check so obvious mistakes get instant feedback; the
    // server action re-runs the same policy and is the authoritative gate.
    if (!name || !email || !message) {
      setStatus({ kind: "err", text: "! all fields are required." });
      return;
    }
    if (!emailRe.test(email)) {
      setStatus({ kind: "err", text: "! that email looks malformed." });
      return;
    }
    // The real delivery path: the server action validates again, applies the
    // spam policy, and emails via Resend, returning { ok, text } we surface
    // straight to the user (keeping the "› sending…" → "✓ sent." beat).
    setSending(true);
    setStatus({ kind: "info", text: "› sending…" });
    try {
      const result = await sendContact(data);
      if (result.ok) {
        setStatus({ kind: "ok", text: result.text });
        form.reset();
      } else {
        setStatus({ kind: "err", text: result.text });
      }
    } catch {
      setStatus({ kind: "err", text: "! couldn't send — please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      ref={rootRef}
      // The page root is the scroll container (not the document): the document is
      // locked in app.css so mobile browser chrome can't collapse on scroll. h-dvh
      // caps it to the viewport; overflow-y:auto scrolls the sections inside;
      // overscroll-y-none stops scroll-chaining; scroll-smooth drives the nav hash
      // jumps + the wordmark scroll-to-top. (The fixed bar/footer/rails stay pinned
      // to the viewport — overflow doesn't contain fixed positioning.)
      //
      // `isolate` makes .st a stacking context so the z-40 fixed bars become its
      // stacking descendants (stacking membership follows DOM ancestry, not the
      // containing block) instead of escaping to the root context. A scroll
      // container paints its scrollbar above its whole subtree, so the indicator
      // now lands ON TOP of the blurred bars — on iOS, where overlay scrollbars
      // can't be insetted with --sbw, they were painting behind the chrome.
      // isolation never establishes a containing block for position:fixed (only
      // transform/filter/will-change do), so the bars stay viewport-pinned: no
      // scroll-jank, the document stays locked.
      class="st relative isolate h-dvh overflow-x-hidden overflow-y-auto overscroll-y-none scroll-smooth bg-black leading-normal text-white selection:bg-white selection:text-black"
    >
      <div class="rails" aria-hidden="true" />

      {/* ───────────── Command bar ───────────── */}
      <header class="fixed top-0 left-0 right-[var(--sbw,0px)] z-40 flex h-[var(--bar-h)] items-center border-b border-[var(--line2)] bg-black/72 backdrop-blur-[10px]">
        <div class={`${col} flex items-center gap-[1.4rem]`}>
          {/* Home wordmark. A plain <a class="l-fill"> rather than a <FillLink>
              (which doesn't forward onClick): since this page IS "/", clicking
              it should smooth-scroll to the top, not trigger a full reload. The
              l-fill class + useMagnetFill (wired in onMount) reproduce the
              cursor-tracked rainbow text-fill. href="/" is kept for semantics. */}
          <a
            ref={homeRef}
            href="/"
            class="l-fill text-[0.95rem] font-extrabold tracking-[-0.02em] whitespace-nowrap"
            onClick={(e) => {
              e.preventDefault();
              // Scroll the .st root (the scroll container), not the window —
              // the document itself no longer scrolls (see app.css).
              rootRef.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Alex Lapwood
          </a>
          <nav
            aria-label="Sections"
            data-rainbow-group
            class="ml-auto flex gap-[1.6rem] text-[0.82rem]"
          >
            <a class="l-line" href="#projects" data-rainbow-item>
              projects
            </a>
            <a class="l-line" href="#contact" data-rainbow-item>
              contact
            </a>
          </nav>
        </div>
      </header>

      <main class="relative z-[1]">
        {/* Hero — the real WebGL paint-reveal name. <NameHero> renders its own
            <section> + <h1>, so this is just a full-screen layout wrapper that
            flex-centres it between the fixed bar + footer. glowOpacity bumps the
            rainbow bloom a touch brighter than the default 0.12. */}
        <div class={screen}>
          <NameHero glowOpacity={0.14} />
        </div>

        {/* ───────────── Work ───────────── */}
        <section
          id="projects"
          class={`${screen} scroll-mt-[var(--bar-h)]`}
          aria-labelledby="projects-title"
        >
          <div class={col}>
            <header class="flex items-baseline gap-[1ch] border-b border-[var(--line2)] pt-[2.6rem] pb-[1.4rem] text-[0.8rem] tracking-[0.04em]">
              <span class="text-neutral-500" aria-hidden="true">
                //
              </span>
              <h2
                id="projects-title"
                class="text-[0.85rem] font-bold lowercase tracking-[0.04em]"
              >
                projects
              </h2>
            </header>

            {/* decorative column legend — the rows below carry their own visible
                labels, so it's hidden from assistive tech (and from the mobile
                card layout) */}
            <div
              class={`${rowGrid} border-b border-[var(--line)] text-[0.66rem] tracking-[0.18em] text-neutral-500 uppercase max-[820px]:hidden`}
              aria-hidden="true"
            >
              <span />
              <span>project</span>
              <span>summary</span>
              <span />
            </div>

            {/* divide-y draws the line between rows (--line); the ul's own
                border-b closes the table (--line2) — no per-row border needed,
                so the last row isn't doubled. */}
            <ul class="list-none divide-y divide-[var(--line)] border-b border-[var(--line2)]">
              <For each={WORK}>
                {(p) => (
                  <li>
                    {/* The row is now a <button> that opens the in-page detail
                        modal (it no longer navigates out — the modal owns the
                        links-out). All the table visuals — grid, .flow-ring
                        hover border, thumb/title/summary/arrow — are preserved;
                        the extra classes just neutralise the native button chrome
                        (full-width, transparent, borderless, left-aligned). */}
                    <button
                      type="button"
                      onClick={() => setActive(p)}
                      class={`row group relative isolate w-full cursor-pointer appearance-none border-0 bg-transparent text-left text-inherit ${rowGrid} max-[820px]:grid-cols-[52px_minmax(0,1fr)_1.4rem] max-[820px]:gap-x-[0.9rem] max-[820px]:gap-y-[0.15rem] max-[820px]:[grid-template-areas:'thumb_title_arrow'_'thumb_summ_arrow']`}
                    >
                      {/* shared flowing-rainbow border, hover-only for cards
                          (position:absolute, so it's out of the row's grid) */}
                      <span class="flow-ring" aria-hidden="true" />
                      <img
                        class={`h-[42px] w-[42px] border border-[var(--line2)] object-contain transition-[border-color] duration-200 group-hover:border-[rgba(0,0,0,0.5)] max-[820px]:h-[52px] max-[820px]:w-[52px] max-[820px]:self-center max-[820px]:[grid-area:thumb]${p.pixelated ? " [image-rendering:pixelated]" : ""}`}
                        src={p.thumb}
                        alt={p.alt}
                        width={42}
                        height={42}
                        loading="lazy"
                      />
                      <span class="text-[1.02rem] font-bold tracking-[-0.01em] whitespace-nowrap max-[820px]:whitespace-normal max-[820px]:[grid-area:title]">
                        {p.title}
                      </span>
                      <span class="overflow-hidden text-[0.82rem] text-ellipsis whitespace-nowrap text-neutral-300 max-[820px]:whitespace-normal max-[820px]:[grid-area:summ]">
                        {p.summary}
                      </span>
                      <span
                        class="text-right text-[0.95rem] text-neutral-500 transition-transform duration-150 group-hover:[transform:translate(2px,-2px)] max-[820px]:self-start max-[820px]:[grid-area:arrow]"
                        aria-hidden="true"
                      >
                        ↗
                      </span>
                      <span class="sr-only"> — view details</span>
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </section>

        {/* ───────────── Contact ───────────── */}
        <section
          id="contact"
          class={`${screen} scroll-mt-[var(--bar-h)]`}
          aria-labelledby="contact-title"
        >
          <div class={col}>
            {/* The visible "// contact" header was removed — the command bar's
                //contact indicator now names this screen. A visually-hidden
                heading is kept so the section's accessible name
                (aria-labelledby) and the document outline stay intact. */}
            <h2 id="contact-title" class="sr-only">
              contact
            </h2>

            {/* faux-terminal window, centred in the column. prop:noValidate sets
                the DOM property directly — native validation stays off so our JS
                validation owns the messaging. */}
            <form
              class="mx-auto w-full max-w-[640px] border border-[var(--line2)] bg-white/[0.012]"
              onSubmit={handleSubmit}
              prop:noValidate={true}
            >
              {/* terminal-window titlebar: traffic-light dots then a left-aligned
                  //contact caption. Purely decorative (aria-hidden) — the
                  section's accessible name is the sr-only <h2> above. The middle
                  dot is a touch lighter (#2a2a2a) than the outer two (--line2). */}
              <div class="flex items-center gap-[0.6ch] border-b border-[var(--line2)] px-[1.4rem] py-[0.7rem] text-[0.72rem]">
                <span
                  class="h-[9px] w-[9px] rounded-full bg-[#262626]"
                  aria-hidden="true"
                />
                <span
                  class="h-[9px] w-[9px] rounded-full bg-[#2a2a2a]"
                  aria-hidden="true"
                />
                <span
                  class="h-[9px] w-[9px] rounded-full bg-[#262626]"
                  aria-hidden="true"
                />
                <span
                  class="ml-[0.6ch] tracking-[0.06em] text-neutral-500"
                  aria-hidden="true"
                >
                  //contact
                </span>
              </div>
              <div class="flex flex-col gap-[1.2rem] p-[1.4rem]">
                <div>
                  <label class={fieldLabel} for="f-name">
                    <span class="mr-[0.4ch] text-white" aria-hidden="true">
                      {">"}
                    </span>
                    name
                  </label>
                  <input
                    id="f-name"
                    name="name"
                    type="text"
                    class={field}
                    autocomplete="name"
                  />
                </div>
                <div>
                  <label class={fieldLabel} for="f-email">
                    <span class="mr-[0.4ch] text-white" aria-hidden="true">
                      {">"}
                    </span>
                    email
                  </label>
                  <input
                    id="f-email"
                    name="email"
                    type="email"
                    class={field}
                    autocomplete="email"
                  />
                </div>
                <div>
                  <label class={fieldLabel} for="f-msg">
                    <span class="mr-[0.4ch] text-white" aria-hidden="true">
                      {">"}
                    </span>
                    message
                  </label>
                  <textarea
                    id="f-msg"
                    name="message"
                    class={`${field} min-h-[116px] resize-y leading-[1.55]`}
                  />
                </div>
                {/* honeypot — visually hidden + hidden from AT, untabbable; a
                    real human never fills it, so a non-empty value means a bot */}
                <div
                  class="absolute left-[-9999px] h-px w-px opacity-0"
                  aria-hidden="true"
                >
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
                <div class="flex flex-wrap items-center gap-[1.2rem]">
                  <button
                    ref={sendRef}
                    class="send relative isolate cursor-pointer border border-[var(--line2)] bg-transparent px-[1.15rem] py-[0.6rem] text-[0.86rem] font-bold tracking-[0.02em] text-white transition-[border-color] duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={sending()}
                  >
                    <span aria-hidden="true">{"> "}</span>send_message
                  </button>
                  <span
                    class="min-h-[1.2em] text-[0.78rem] whitespace-pre-wrap text-neutral-300"
                    role="status"
                  >
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

      <footer class="fixed bottom-0 left-0 right-[var(--sbw,0px)] z-40 flex h-[var(--footer-h)] items-center border-t border-[var(--line2)] bg-black/72 backdrop-blur-[10px]">
        <div class={`${col} flex flex-wrap items-center gap-[0.6rem_1.6rem] text-[0.78rem]`}>
          {/* GitHub — icon only, far-left. The icon is a masked <span>
              (.ic-github) — its box background paints through the glyph, going
              rainbow on its own hover (see .links-left a:hover .ic). */}
          <ul class="links-left mr-auto flex list-none items-center gap-[1.4rem]">
            <li>
              <a
                class="inline-flex items-center"
                href="https://github.com/alexlapwood"
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
              >
                <span class="ic ic-github block" aria-hidden="true" />
              </a>
            </li>
          </ul>
          {/* LinkedIn (icon only) + email, grouped right. data-rainbow-group +
              the per-leaf data-rainbow-item marks make each link a slice of one
              continuous rainbow; only the hovered link lights (see onMount + the
              scoped CSS). */}
          <ul
            class="flex list-none items-center gap-[1.4rem]"
            data-rainbow-group
          >
            <li>
              <a
                class="inline-flex items-center"
                href="https://www.linkedin.com/in/alexlapwood"
                target="_blank"
                rel="noopener"
                aria-label="LinkedIn"
              >
                <span
                  class="ic ic-linkedin block"
                  aria-hidden="true"
                  data-rainbow-item
                />
              </a>
            </li>
            <li>
              {/* Email — a plain <a>; each link is a contiguous slice of one
                  continuous var(--rainbow) spanning the right group, but only the
                  hovered link lights (its icon + text together). Resting state
                  stays white (text-white + the icon's currentColor box). */}
              <a
                class="inline-flex items-center text-white"
                href="mailto:contact@alexlapwood.com"
                data-rainbow-item
              >
                <span
                  class="ic ic-mail mr-[0.9ch] inline-block align-[-0.18em]"
                  aria-hidden="true"
                  data-rainbow-item
                />
                contact@alexlapwood.com
              </a>
            </li>
          </ul>
        </div>
      </footer>

      {/* In-page project detail modal. Always mounted so it can play its own
          exit animation; `active()` (null = closed) is the open project. It's a
          child of `.st` so its fixed backdrop shares this stacking context and
          can lock this element's scroll. Closing just clears `active` — the modal
          restores focus to the triggering row itself. */}
      <WorkModal project={active()} onClose={() => setActive(null)} />
    </div>
  );
}
