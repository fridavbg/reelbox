import { describe, expect, it } from "vitest";
import { MAX_IMPORTED_TAG_LENGTH, MAX_TAG_LENGTH } from "./tag-settings";
import {
  matchingTags,
  mostUsedTags,
  parseAddTagInput,
  parseRemoveTagInput,
  tagKey,
  tagNameError,
} from "./tags";
import { TAG_NAME_EMPTY, TAG_NAME_TOO_LONG } from "./tags-text";

const postId = "00000000-0000-4000-8000-000000000001";
const tagId = "00000000-0000-4000-8000-000000000002";

describe("tagKey", () => {
  it("matches tags whatever their capitals and surrounding spaces", () => {
    expect(tagKey(" Recipes ")).toBe(tagKey("recipes"));
  });
});

describe("tagNameError", () => {
  it.each(["", "   ", "\n\t"])("refuses an empty name: %j", (name) => {
    expect(tagNameError(name)).toBe(TAG_NAME_EMPTY);
  });

  it("accepts a name of up to 30 characters", () => {
    expect(MAX_TAG_LENGTH).toBe(30);
    expect(tagNameError("a".repeat(30))).toBeUndefined();
  });

  it("accepts an existing tag's name up to the longest an import creates", () => {
    expect(MAX_IMPORTED_TAG_LENGTH).toBe(500);
    expect(tagNameError("a".repeat(500), { existing: true })).toBeUndefined();
    expect(tagNameError("a".repeat(501), { existing: true })).toBe(
      TAG_NAME_TOO_LONG,
    );
    expect(tagNameError("   ", { existing: true })).toBe(TAG_NAME_EMPTY);
  });

  it("refuses a name of 31 characters, saying what the limit is", () => {
    expect(tagNameError("a".repeat(31))).toBe(TAG_NAME_TOO_LONG);
    expect(TAG_NAME_TOO_LONG).toBe("Tag names can be at most 30 characters.");
  });

  it("counts an emoji as one character", () => {
    expect(tagNameError("🍜".repeat(30))).toBeUndefined();
    expect(tagNameError("🍜".repeat(31))).toBe(TAG_NAME_TOO_LONG);
  });

  it("ignores surrounding spaces when counting", () => {
    expect(tagNameError(`  ${"a".repeat(30)}  `)).toBeUndefined();
  });
});

describe("parseAddTagInput", () => {
  it("returns the post and the trimmed name", () => {
    expect(parseAddTagInput(postId, "  Recipes ")).toEqual({
      postId,
      name: "Recipes",
    });
  });

  it("returns a name longer than a new tag allows: it may be an existing tag's", () => {
    const name = "a".repeat(500);
    expect(parseAddTagInput(postId, name)).toEqual({ postId, name });
  });

  it.each([
    ["a post id that isn't a UUID", "abc", "Recipes"],
    ["a missing post id", undefined, "Recipes"],
    ["a name that isn't text", postId, 42],
    ["a missing name", postId, undefined],
    ["an empty name", postId, "   "],
    ["a name longer than any tag", postId, "a".repeat(501)],
  ])("refuses %s", (_, id, name) => {
    expect(parseAddTagInput(id, name)).toBeNull();
  });
});

describe("parseRemoveTagInput", () => {
  it("returns the post and the tag", () => {
    expect(parseRemoveTagInput(postId, tagId)).toEqual({ postId, tagId });
  });

  it.each([
    ["a post id that isn't a UUID", "abc", tagId],
    ["a tag id that isn't a UUID", postId, "abc"],
    ["a missing tag id", postId, undefined],
    ["ids that aren't text", 1, 2],
  ])("refuses %s", (_, post, tag) => {
    expect(parseRemoveTagInput(post, tag)).toBeNull();
  });
});

describe("matchingTags", () => {
  const names = [
    "Bread",
    "Dinner",
    "Recipes",
    "Rec room",
    "Travel",
    "Weeknight",
  ];

  it("offers nothing until something is typed", () => {
    expect(matchingTags(names, "  ", [])).toEqual([]);
  });

  it("finds tags containing the text, whatever its capitals", () => {
    expect(matchingTags(names, "EA", [])).toEqual(["Bread"]);
  });

  it("lists tags starting with the text first", () => {
    expect(matchingTags(names, "re", [])).toEqual([
      "Recipes",
      "Rec room",
      "Bread",
    ]);
  });

  it("leaves out tags already on the save, whatever their capitals", () => {
    expect(matchingTags(names, "rec", ["recipes"])).toEqual(["Rec room"]);
  });

  it("offers at most 6", () => {
    const many = Array.from({ length: 10 }, (_, i) => `Tag ${i}`);
    expect(matchingTags(many, "tag", [])).toHaveLength(6);
  });
});

describe("mostUsedTags", () => {
  const tags = [
    { name: "Bread", count: 2 },
    { name: "Dinner", count: 9 },
    { name: "Recipes", count: 9 },
    { name: "Travel", count: 0 },
    { name: "Weeknight", count: 4 },
  ];

  it("lists the tags used on most saves first, then alphabetically", () => {
    expect(mostUsedTags(tags, [])).toEqual([
      "Dinner",
      "Recipes",
      "Weeknight",
      "Bread",
      "Travel",
    ]);
  });

  it("leaves out tags already on the save, whatever their capitals", () => {
    expect(mostUsedTags(tags, ["dinner"])).toEqual([
      "Recipes",
      "Weeknight",
      "Bread",
      "Travel",
    ]);
  });

  it("offers at most 6", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      name: `Tag ${i}`,
      count: i,
    }));
    expect(mostUsedTags(many, [])).toEqual([
      "Tag 9",
      "Tag 8",
      "Tag 7",
      "Tag 6",
      "Tag 5",
      "Tag 4",
    ]);
  });
});
