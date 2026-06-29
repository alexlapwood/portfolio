import { defineConfig } from "@solidjs/start/config";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Treat .mdx/.md as routeable + run them through the Solid JSX transform.
  extensions: ["mdx", "md"],
  server: {
    // SolidStart's Vercel preset: prerendered content routes + serverless
    // functions (e.g. the future contact action) on the same deploy.
    preset: "vercel",
    prerender: {
      // SSG every content route to a standalone HTML document.
      routes: ["/"],
      crawlLinks: true,
    },
  },
  vite: {
    plugins: [
      // MDX must compile to JSX *before* vite-plugin-solid transforms it,
      // hence enforce: "pre". `extensions` above tells Solid to handle .mdx.
      {
        enforce: "pre",
        ...mdx({
          jsx: true,
          jsxImportSource: "solid-js",
          providerImportSource: "solid-mdx",
          remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        }),
      },
      tailwindcss(),
    ],
  },
});
