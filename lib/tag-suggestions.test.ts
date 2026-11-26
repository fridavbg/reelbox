import { describe, expect, it } from "vitest";
import { suggestTags } from "./tag-suggestions";
import { MAX_OFFERED_TAGS } from "./tags";

const none = { onSave: [], creatorTags: [], collections: [], ignored: [] };

describe("suggestTags", () => {
  it("suggests nothing when there's nothing to suggest", () => {
    expect(suggestTags(none)).toEqual({ fromCreator: [], fromCollections: [] });
  });

  it("suggests the tags used on the creator's other saves, most used first", () => {
    const { fromCreator } = suggestTags({
      ...none,
      creatorTags: [
        { name: "Weeknight", count: 1 },
        { name: "Recipes", count: 4 },
        { name: "Baking", count: 1 },
      ],
    });
    // Ties in alphabetical order, so the list never jumps around.
    expect(fromCreator).toEqual(["Recipes", "Baking", "Weeknight"]);
  });

  it("suggests the tag named after each collection the save is in", () => {
    const { fromCollections } = suggestTags({
      ...none,
      collections: ["Dinner ideas", "Trips"],
    });
    expect(fromCollections).toEqual(["Dinner ideas", "Trips"]);
  });

  it("leaves out tags already on the save, whatever their case or spaces", () => {
    const result = suggestTags({
      onSave: ["recipes", " dinner ideas "],
      creatorTags: [
        { name: "Recipes", count: 4 },
        { name: "Weeknight", count: 2 },
      ],
      collections: ["Dinner ideas"],
      ignored: [],
    });
    expect(result).toEqual({ fromCreator: ["Weeknight"], fromCollections: [] });
  });

  it("leaves out suggestions ignored on this save", () => {
    const result = suggestTags({
      onSave: [],
      creatorTags: [
        { name: "Recipes", count: 4 },
        { name: "Weeknight", count: 2 },
      ],
      collections: ["Dinner ideas"],
      // Stored as name keys.
      ignored: ["weeknight", "dinner ideas"],
    });
    expect(result).toEqual({ fromCreator: ["Recipes"], fromCollections: [] });
  });

  it("suggests a tag from both sources once, under the creator", () => {
    const result = suggestTags({
      ...none,
      creatorTags: [{ name: "Dinner ideas", count: 3 }],
      collections: ["dinner ideas"],
    });
    expect(result).toEqual({
      fromCreator: ["Dinner ideas"],
      fromCollections: [],
    });
  });

  it("suggests collections with the same name once", () => {
    const { fromCollections } = suggestTags({
      ...none,
      collections: ["Trips", " trips"],
    });
    expect(fromCollections).toEqual(["Trips"]);
  });

  it("suggests at most as many tags per source as Most used offers", () => {
    const many = Array.from({ length: MAX_OFFERED_TAGS + 2 }, (_, i) => ({
      name: `Tag ${i}`,
      count: 1,
    }));
    const result = suggestTags({
      ...none,
      creatorTags: many,
      collections: many.map((tag) => `Collection ${tag.name}`),
    });
    expect(result.fromCreator).toHaveLength(MAX_OFFERED_TAGS);
    expect(result.fromCollections).toHaveLength(MAX_OFFERED_TAGS);
  });

  it("skips collection names that are only spaces", () => {
    const { fromCollections } = suggestTags({ ...none, collections: ["  "] });
    expect(fromCollections).toEqual([]);
  });
});
