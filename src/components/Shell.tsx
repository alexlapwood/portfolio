import { type ParentProps } from "solid-js";

// Pass-through shell. The promoted home page (src/routes/index.tsx) owns ALL of
// its chrome — command bar, footer, the lot — so the shell no longer renders a
// global header/footer/wrapper. It stays in the tree (app.tsx mounts it as the
// router root) purely as a stable mount point; global black bg + white text
// come from src/app.css's body. If a future route needs shared chrome again,
// reintroduce it here.
export default function Shell(props: ParentProps) {
  return <>{props.children}</>;
}
