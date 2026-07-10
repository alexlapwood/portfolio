// Derives a project's terminal-caption slug from its title: lowercased, with
// every run of non-alphanumerics collapsed to a single underscore and the ends
// trimmed. Feeds the WorkModal titlebar caption (e.g. "Build It" -> //build_it),
// mirroring the faux-terminal "//contact" treatment on the contact form — and
// happening to match the legacy asset-folder ids. Pure + DOM-free, so it's
// unit-testable in isolation (see projectSlug.test.ts).
export function projectSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
