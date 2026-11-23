import { describe, expect, it } from "vitest";
import { MAX_TAG_LENGTH } from "./tag-settings";
import {
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

  it.each([
    ["a post id that isn't a UUID", "abc", "Recipes"],
    ["a missing post id", undefined, "Recipes"],
    ["a name that isn't text", postId, 42],
    ["a missing name", postId, undefined],
    ["an empty name", postId, "   "],
    ["a name that's too long", postId, "a".repeat(31)],
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
