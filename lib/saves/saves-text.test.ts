import { describe, expect, it } from "vitest";
import { savesCountText } from "./saves-text";

describe("savesCountText", () => {
  it.each([
    [1, "1 save · newest first"],
    [2, "2 saves · newest first"],
    [412, "412 saves · newest first"],
  ])("counts %i", (count, expected) => {
    expect(savesCountText(count)).toBe(expected);
  });
});
