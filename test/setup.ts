import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only cleans up by itself when Vitest's globals are on.
// Unmounts what a test rendered, so the next test starts with an empty page.
afterEach(cleanup);
