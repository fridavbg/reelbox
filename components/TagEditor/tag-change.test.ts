import { describe, expect, it } from "vitest";
import { applyTagChange, isSaving } from "./tag-change";

const tags = [
  { id: "1", name: "Bread" },
  { id: "2", name: "Weeknight" },
];

describe("applyTagChange", () => {
  it("adds a tag in alphabetical order, marked as still saving", () => {
    const next = applyTagChange(tags, { type: "add", name: "recipes" });
    expect(next.map((tag) => tag.name)).toEqual([
      "Bread",
      "recipes",
      "Weeknight",
    ]);
    expect(isSaving(next[1])).toBe(true);
    expect(isSaving(next[0])).toBe(false);
  });

  it("leaves the tags as they are when the tag is already there, whatever its capitals", () => {
    expect(applyTagChange(tags, { type: "add", name: "BREAD" })).toBe(tags);
  });

  it("removes a tag", () => {
    expect(applyTagChange(tags, { type: "remove", id: "1" })).toEqual([
      { id: "2", name: "Weeknight" },
    ]);
  });
});
