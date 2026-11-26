import { describe, expect, it } from "vitest";
import { demoAnchor } from "./demo-anchor";

describe("demoAnchor", () => {
  it("rounds the demo's start down to a whole second, like export dates", () => {
    expect(demoAnchor(new Date("2026-11-26T10:00:05.987Z"))).toEqual(
      new Date("2026-11-26T10:00:05.000Z"),
    );
  });
});
