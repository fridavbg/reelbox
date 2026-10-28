import { describe, expect, it } from "vitest";
import { tagKey } from "./tags";

describe("tagKey", () => {
  it("matches tags whatever their capitals and surrounding spaces", () => {
    expect(tagKey(" Recipes ")).toBe(tagKey("recipes"));
  });
});
