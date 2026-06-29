import { A } from "@solidjs/router";
import { onMount, type JSX } from "solid-js";
import { useMagnetFill } from "./useMagnetFill";

// Expanding-underline link with the shared magnet rainbow fill: the underline
// grows middle-out on hover while the text reveals the gradient, both tracking
// the cursor via the same magnetGradient. Internal nav primitive (router <A>);
// used by the Work / Contact nav items.
export function LineLink(props: {
  href: string;
  children: JSX.Element;
  class?: string;
}) {
  let el!: HTMLAnchorElement;
  onMount(() => useMagnetFill(el));
  return (
    <A
      ref={el}
      href={props.href}
      class={props.class ? `l-line ${props.class}` : "l-line"}
    >
      {props.children}
    </A>
  );
}
