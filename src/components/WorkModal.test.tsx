import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { WorkModal, type Project } from "./WorkModal";

// A representative project with a repo, so the test also exercises the repo
// link-out branch (the real WORK data currently leaves repo undefined).
const project: Project = {
  title: "Build It",
  kind: "WEB APP",
  summary: "Material-Design web app for teams to discuss project documents.",
  description:
    "Build-It is a web application I created to help teams discuss project documents.",
  href: "https://host-it.co.nz/~buildit",
  thumb: "thumb.png",
  alt: "Build It icon",
  screenshots: ["shot-1.png", "shot-2.png"],
  repo: "https://github.com/alexlapwood/build-it",
};

// Harness mirroring index.tsx's wiring: a trigger toggles the open project, and
// closing just clears it — exactly what a Work row + onClose do in the route.
function Harness() {
  const [active, setActive] = createSignal<Project | null>(null);
  return (
    <>
      <button type="button" onClick={() => setActive(project)}>
        open
      </button>
      <WorkModal project={active()} onClose={() => setActive(null)} />
    </>
  );
}

describe("WorkModal", () => {
  it("opens the detail dialog from a trigger and closes on Escape", async () => {
    render(() => <Harness />);

    // Closed to start: no dialog in the tree.
    expect(screen.queryByRole("dialog")).toBeNull();

    // Activating the trigger opens the modal with the project's title visible.
    fireEvent.click(screen.getByText("open"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("heading", { name: "Build It" }),
    ).toBeInTheDocument();

    // The modal owns the links-out (live + repo), pointed at the real URLs.
    expect(screen.getByRole("link", { name: "live" })).toHaveAttribute(
      "href",
      project.href,
    );
    expect(screen.getByRole("link", { name: "repo" })).toHaveAttribute(
      "href",
      project.repo,
    );

    // Escape closes it (after the exit animation the panel unmounts).
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on a backdrop click", async () => {
    render(() => <Harness />);

    fireEvent.click(screen.getByText("open"));
    const dialog = await screen.findByRole("dialog");

    // The backdrop is the dialog's parent; a click on it (not the panel) closes.
    const backdrop = dialog.parentElement as HTMLElement;
    fireEvent.click(backdrop);
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
