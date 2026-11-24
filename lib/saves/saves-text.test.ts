import { describe, expect, it } from "vitest";
import { noMatchText, noMatchTitle, savesCountText } from "./saves-text";

describe("savesCountText", () => {
  it.each([
    [1, "1 save · newest first"],
    [2, "2 saves · newest first"],
    [412, "412 saves · newest first"],
  ])("counts %i", (count, expected) => {
    expect(savesCountText(count, { kind: "all" })).toBe(expected);
  });

  it("names the tag", () => {
    expect(savesCountText(12, { kind: "tag", key: "recipes" }, "Recipes")).toBe(
      "12 saves tagged Recipes · newest first",
    );
    expect(savesCountText(1, { kind: "tag", key: "recipes" }, "Recipes")).toBe(
      "1 save tagged Recipes · newest first",
    );
  });

  it("counts untagged saves", () => {
    expect(savesCountText(380, { kind: "untagged" })).toBe(
      "380 untagged saves · newest first",
    );
  });
});

describe("no matching saves", () => {
  it("names the tag", () => {
    expect(noMatchTitle({ kind: "tag", key: "recipes" }, "Recipes")).toBe(
      "No saves tagged Recipes",
    );
    expect(noMatchText({ kind: "tag", key: "recipes" })).toBe(
      "Add this tag to a save on the save's page to see it here.",
    );
  });

  it("says every save has a tag", () => {
    expect(noMatchTitle({ kind: "untagged" })).toBe("Every save has a tag");
    expect(noMatchText({ kind: "untagged" })).toBe(
      "Saves without a tag show up here.",
    );
  });
});
