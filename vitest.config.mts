import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/" alias as tsconfig.json, so tests can import app code.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    // Tests run in plain Node. Component tests that click and type opt in
    // to a browser-like DOM with `// @vitest-environment jsdom` at the top.
    environment: "node",
    // Cleans up after each test that rendered a component.
    setupFiles: ["./test/setup.ts"],
  },
});
