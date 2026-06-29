import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import { fileURLToPath } from "node:url";

// Standalone test config — deliberately NOT the vinxi/app.config so the
// production build is unaffected. Uses vite-plugin-solid directly, which is
// the supported recipe for running Solid component tests under Vitest.
export default defineConfig({
  // hot: false disables solid-refresh (HMR) injection, which otherwise pulls in
  // a virtual `/@solid-refresh` module that Node's loader can't resolve under
  // Vitest. In test mode the plugin also auto-applies jsdom + the Solid
  // browser/development resolve conditions and externalizes solid-js.
  plugins: [solid({ hot: false })],
  resolve: {
    // Resolve Solid's browser + development build so reactivity and client
    // rendering work under jsdom (instead of Solid's SSR build).
    conditions: ["development", "browser"],
    alias: {
      // Mirror the app's "~/*" -> "src/*" alias for test imports.
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
