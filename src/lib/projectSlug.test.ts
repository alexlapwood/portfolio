import { describe, expect, it } from "vitest";
import { projectSlug } from "./projectSlug";

// projectSlug maps a human project title to the underscore slug shown in the
// modal's terminal caption (//<slug>). It must be lowercase, collapse spaces +
// punctuation to single underscores, and trim the ends — matching the legacy
// asset-folder ids so the caption reads like a real path.
describe("projectSlug", () => {
  it("lowercases and joins words with a single underscore", () => {
    expect(projectSlug("Build It")).toBe("build_it");
    expect(projectSlug("Spotify Playlist")).toBe("spotify_playlist");
    expect(projectSlug("Dirty South")).toBe("dirty_south");
  });

  it("collapses runs of punctuation/whitespace and trims the ends", () => {
    expect(projectSlug("  Wumpa — Time!  ")).toBe("wumpa_time");
    expect(projectSlug("Stardew   Planner")).toBe("stardew_planner");
  });
});
