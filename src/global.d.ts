/// <reference types="@solidjs/start/env" />

// Lets later slices import `.mdx` project pages as Solid components and read
// their parsed frontmatter (via remark-mdx-frontmatter).
declare module "*.mdx" {
  import type { Component } from "solid-js";
  const MDXComponent: Component;
  export default MDXComponent;
  export const frontmatter: Record<string, unknown>;
}
