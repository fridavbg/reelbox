import { afterEach } from "vitest";

// Testing Library only cleans up by itself when Vitest's globals are on.
// Unmounts what a test rendered, so the next test starts with an empty page.
// Loaded only in jsdom test files, so plain Node tests never import React DOM.
if (typeof document !== "undefined") {
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}
