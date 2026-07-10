import {
  createEffect,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { FillLink } from "~/components/links";
import { projectSlug } from "~/lib/projectSlug";
import "../styles/work-modal.css";

// The Work index's data contract, owned here beside the component that renders
// its detail view. index.tsx holds the WORK array (typed against this) and hands
// the open project in via the `project` prop; null means "closed".
export type Project = {
  title: string;
  summary: string;
  href: string; // the live site
  thumb: string;
  alt: string;
  // Pixel-art thumbnails get crisp nearest-neighbour scaling (see index.tsx).
  pixelated?: boolean;
  // Uppercase category tag shown beside the title (e.g. "PWA", "WEB APP").
  kind: string;
  // A short write-up — a sentence or two beyond the one-line summary.
  description: string;
  // Imported, fingerprinted Vite asset URLs (src/assets/work/<id>/…).
  screenshots: string[];
  // Optional public source repo; the repo link-out only renders when present.
  repo?: string;
};

// Keep in step with the longest transition in styles/work-modal.css: after the
// `.is-open` class is removed the panel is left mounted for CLOSE_MS so the exit
// transition can play, then it's unmounted.
const CLOSE_MS = 260;

// Tab-cycle members inside the panel — the standard focusable set, minus
// anything explicitly removed from the tab order.
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// In-page project detail modal. Dependency-free enter/exit: the panel mounts in
// its closed state, flips `.is-open` on the next frame to run the CSS transition,
// and unmounts CLOSE_MS after close so the exit animation completes. Owns the
// dialog a11y contract — focus moves in + is trapped, Esc + backdrop-click close,
// focus returns to the opener, and the page's scroll container is locked while
// open. The links-out reuse the shared FillLink primitive.
export function WorkModal(props: {
  project: Project | null;
  onClose: () => void;
}) {
  // `shown` is the project currently in the DOM — it lags props.project by
  // CLOSE_MS on close so the exit animation runs against real content. `open`
  // drives the `.is-open` CSS state that plays the enter/exit transition.
  const [shown, setShown] = createSignal<Project | null>(null);
  const [open, setOpen] = createSignal(false);

  let panelRef: HTMLDivElement | undefined;
  let backdropRef: HTMLDivElement | undefined;
  // Whoever had focus when the modal opened (the triggering Work row): captured
  // before focus moves into the panel, restored to it on close.
  let opener: HTMLElement | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let unlock: (() => void) | undefined;

  // Lock scrolling on the page's OWN scroll container — the `.st` root div, not
  // the document (see app.css) — while the modal is open, falling back to <body>
  // when `.st` isn't present (e.g. under the test harness). Returns the undo.
  const lockScroll = (): (() => void) => {
    const sc =
      backdropRef?.closest<HTMLElement>(".st") ??
      document.querySelector<HTMLElement>(".st") ??
      document.body;
    const prev = sc.style.overflow;
    sc.style.overflow = "hidden";
    return () => {
      sc.style.overflow = prev;
    };
  };

  // React to the parent opening/closing the modal. `on` tracks only
  // props.project (the callback runs untracked), and defer skips the initial
  // null so nothing fires until a project is actually opened.
  createEffect(
    on(
      () => props.project,
      (p) => {
        if (p) {
          // Opening: cancel any pending close, remember the opener, mount closed.
          if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = undefined;
          }
          opener = document.activeElement as HTMLElement | null;
          setShown(p);
          unlock?.();
          unlock = lockScroll();
          // Next frame: force a reflow so the closed styles commit, then flip
          // `.is-open` to run the enter transition and move focus into the panel.
          requestAnimationFrame(() => {
            void panelRef?.offsetHeight;
            setOpen(true);
            panelRef?.focus();
          });
        } else if (shown()) {
          // Closing: play the exit transition, then unmount + restore focus.
          setOpen(false);
          unlock?.();
          unlock = undefined;
          closeTimer = setTimeout(() => {
            setShown(null);
            closeTimer = undefined;
            opener?.focus();
            opener = null;
          }, CLOSE_MS);
        }
      },
      { defer: true },
    ),
  );

  onCleanup(() => {
    if (closeTimer) clearTimeout(closeTimer);
    unlock?.();
  });

  // Esc closes; Tab is trapped so focus cycles within the panel (wrapping at both
  // ends, and pulling focus back in if it has escaped to the panel container).
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const panel = panelRef;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      e.preventDefault();
      panel.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || active === panel || !panel.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Backdrop click closes — but only a click on the backdrop itself, not one
  // that bubbled up from inside the panel.
  const onBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) props.onClose();
  };

  return (
    <Show when={shown()}>
      {(project) => (
        <div
          ref={backdropRef}
          class="wm-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/72 p-[var(--gutter)] backdrop-blur-[2px]"
          classList={{ "is-open": open() }}
          onClick={onBackdropClick}
        >
          {/* terminal-window panel — traffic-light dots + //<slug> caption
              titlebar, matching the contact form; a thin rainbow accent wipes
              across its top edge on open (styles/work-modal.css). */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wm-title"
            tabindex="-1"
            onKeyDown={onKeyDown}
            class="wm-panel relative flex max-h-[85dvh] w-full max-w-[720px] flex-col overflow-hidden border border-[var(--line2)] bg-[#050505] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] outline-none"
          >
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
                //{projectSlug(project().title)}
              </span>
              <button
                type="button"
                class="ml-auto cursor-pointer bg-transparent px-[0.4ch] text-[0.82rem] leading-none text-neutral-500 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-none"
                onClick={() => props.onClose()}
                aria-label="Close project details"
              >
                ✕
              </button>
            </div>

            {/* body — the only scrolling region if content overflows the panel */}
            <div class="flex flex-col gap-[1.4rem] overflow-y-auto p-[1.6rem]">
              <div class="flex flex-col gap-[0.8rem]">
                <div class="flex flex-wrap items-center gap-x-[1ch] gap-y-[0.5rem]">
                  <h2
                    id="wm-title"
                    class="text-[1.5rem] font-bold tracking-[-0.02em]"
                  >
                    {project().title}
                  </h2>
                  <span class="border border-[var(--line2)] px-[0.7ch] py-[0.2rem] text-[0.6rem] tracking-[0.2em] text-neutral-400 uppercase">
                    {project().kind}
                  </span>
                </div>
                <p class="text-[0.92rem] text-neutral-200">{project().summary}</p>
              </div>

              <p class="text-[0.82rem] leading-[1.65] text-neutral-400">
                {project().description}
              </p>

              {/* screenshots — a horizontal filmstrip of fixed-height frames */}
              <Show when={project().screenshots.length > 0}>
                <div class="flex flex-col gap-[0.6rem]">
                  <span
                    class="text-[0.62rem] tracking-[0.18em] text-neutral-500 uppercase"
                    aria-hidden="true"
                  >
                    // screenshots
                  </span>
                  <ul class="flex list-none gap-[0.8rem] overflow-x-auto pb-[0.4rem]">
                    <For each={project().screenshots}>
                      {(shot, i) => (
                        <li class="shrink-0">
                          <img
                            class="h-[220px] w-auto max-w-none border border-[var(--line2)]"
                            src={shot}
                            alt={`${project().title} screenshot ${i() + 1}`}
                            loading="lazy"
                          />
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>

              {/* links out — the modal now owns the outbound links (the row no
                  longer navigates). FillLink is the external-link primitive. */}
              <div class="flex flex-wrap items-center gap-x-[1.8rem] gap-y-[0.6rem] border-t border-[var(--line2)] pt-[1.2rem] text-[0.84rem]">
                <FillLink
                  href={project().href}
                  target="_blank"
                  rel="noopener"
                  class="font-bold"
                >
                  <span aria-hidden="true">↗ </span>live
                </FillLink>
                <Show when={project().repo}>
                  {(repo) => (
                    <FillLink
                      href={repo()}
                      target="_blank"
                      rel="noopener"
                      class="font-bold"
                    >
                      <span aria-hidden="true">↗ </span>repo
                    </FillLink>
                  )}
                </Show>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
