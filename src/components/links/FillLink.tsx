import { onMount, type JSX } from "solid-js";
import { useMagnetFill } from "./useMagnetFill";

// Magnet rainbow text-fill: white until hover, then the rainbow shows through
// the glyphs with red pinned at both ends and the spectrum's middle chasing
// the cursor. External-link primitive (plain <a> — works for https:, mailto:,
// etc.); used for outbound links such as the footer email.
export function FillLink(props: {
  href: string;
  children: JSX.Element;
  class?: string;
  target?: string;
  rel?: string;
}) {
  let el!: HTMLAnchorElement;
  onMount(() => useMagnetFill(el));
  return (
    <a
      ref={el}
      href={props.href}
      target={props.target}
      rel={props.rel}
      class={props.class ? `l-fill ${props.class}` : "l-fill"}
    >
      {props.children}
    </a>
  );
}
