import { A } from "@solidjs/router";
import type { JSX } from "solid-js";

// Angle-bracket reveal: at rest the label stands alone; on hover cyan `<` and
// `>` slide in and fade up around it. Pure CSS (.l-bracket) — no cursor work.
// Internal nav primitive (router <A>); used by the header home wordmark.
export function BracketLink(props: {
  href: string;
  children: JSX.Element;
  class?: string;
}) {
  return (
    <A
      href={props.href}
      class={props.class ? `l-bracket ${props.class}` : "l-bracket"}
    >
      {props.children}
    </A>
  );
}
