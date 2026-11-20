import { describe, expect, it } from "vitest";
import {
  NO_COLLECTION_ID,
  NOT_IN_SAVED_POSTS,
  UNREADABLE_ENTRY,
} from "@/lib/export/export-messages";
import { COLLECTIONS_FILE, POSTS_FILE } from "@/lib/export/export-settings";
import type {
  InvalidEntry,
  ParsedCollection,
  ParsedPost,
} from "@/lib/export/parse-export";
import {
  buildImport,
  splitUnreadable,
  type ExistingLibrary,
  type ImportInput,
} from "./build-import";

const userId = "11111111-1111-4111-8111-111111111111";
const now = new Date("2026-10-28T12:00:00Z");

const post = (shortcode: string, savedAt = "2026-10-01T00:00:00Z") =>
  ({
    shortcode,
    url: `https://www.instagram.com/reel/${shortcode}/`,
    kind: "REEL",
    caption: null,
    creatorUsername: "creator",
    creatorName: null,
    creatorUrl: "https://www.instagram.com/creator",
    hashtags: [],
    fbid: null,
    savedAt: new Date(savedAt),
  }) satisfies ParsedPost;

const collection = (
  externalId: string,
  name: string,
  shortcodes: string[],
): ParsedCollection => ({ externalId, name, shortcodes });

const empty: ExistingLibrary = { posts: [], tags: [], collections: [] };

/** A post already in the library; not flagged unless `noLongerSavedAt` is given. */
const libraryPost = (
  shortcode: string,
  savedAt = "2026-10-01T00:00:00Z",
  noLongerSavedAt: string | null = null,
): ExistingLibrary["posts"][number] => ({
  id: `id-${shortcode}`,
  shortcode,
  savedAt: new Date(savedAt),
  noLongerSavedAt: noLongerSavedAt ? new Date(noLongerSavedAt) : null,
});

function build(
  input: Partial<ImportInput>,
  existing: Partial<ExistingLibrary> = {},
) {
  return buildImport(
    userId,
    {
      posts: [],
      collections: [],
      invalidCount: 0,
      unreadableShortcodes: [],
      ...input,
    },
    { ...empty, ...existing },
    now,
  );
}

const tagNamesOf = (
  result: ReturnType<typeof buildImport>,
  shortcode: string,
  existingTags: ExistingLibrary["tags"] = [],
) => {
  const postId = result.posts.find((p) => p.shortcode === shortcode)?.id;
  const names = new Map(
    [...existingTags, ...result.tags].map((tag) => [tag.id, tag.name]),
  );
  return result.postTags
    .filter((link) => link.postId === postId)
    .map((link) => names.get(link.tagId));
};

describe("buildImport", () => {
  it("refuses an import without posts", () => {
    expect(() => build({ posts: [] })).toThrow("at least one post");
  });

  it("only copies the post columns, not every field the parser returns", () => {
    const parsed = { ...post("A"), thumbnailUrl: "https://example.com/a.jpg" };
    const result = build({ posts: [parsed] });
    expect(result.posts[0]).not.toHaveProperty("thumbnailUrl");
    expect(result.posts[0]).toMatchObject({ ...post("A"), userId });
  });

  it("adds posts that aren't in the library yet", () => {
    const result = build({ posts: [post("A"), post("B")] });
    expect(result.posts.map((p) => p.shortcode)).toEqual(["A", "B"]);
    expect(result.summary.newCount).toBe(2);
  });

  it("skips posts already in the library and counts them", () => {
    const result = build(
      { posts: [post("A"), post("B")] },
      { posts: [libraryPost("A")] },
    );
    expect(result.posts.map((p) => p.shortcode)).toEqual(["B"]);
    expect(result.summary).toMatchObject({ newCount: 1, duplicateCount: 1 });
  });

  it("counts a shortcode repeated in the same upload once", () => {
    const result = build({ posts: [post("A"), post("A")] });
    expect(result.posts).toHaveLength(1);
    expect(result.summary).toMatchObject({ newCount: 1, duplicateCount: 1 });
  });

  it("makes every row belong to the importing user", () => {
    const result = build({
      posts: [post("A")],
      collections: [collection("c1", "Recipes", ["A"])],
    });
    for (const rows of [
      result.posts,
      result.tags,
      result.collections,
      [result.import],
    ]) {
      expect(rows.every((row) => row.userId === userId)).toBe(true);
    }
  });

  it("turns a collection into a tag on its new posts", () => {
    const result = build({
      posts: [post("A"), post("B")],
      collections: [collection("c1", "Recipes", ["A"])],
    });
    expect(result.tags).toMatchObject([
      { name: "Recipes", nameKey: "recipes" },
    ]);
    expect(tagNamesOf(result, "A")).toEqual(["Recipes"]);
    expect(tagNamesOf(result, "B")).toEqual([]);
    expect(result.summary.tagsAddedCount).toBe(1);
  });

  it("never tags posts that were already in the library", () => {
    const result = build(
      {
        posts: [post("A"), post("B")],
        collections: [collection("c1", "Recipes", ["A", "B"])],
      },
      { posts: [libraryPost("A")] },
    );
    expect(result.posts.map((p) => p.shortcode)).toEqual(["B"]);
    expect(result.postTags).toHaveLength(1);
    expect(tagNamesOf(result, "B")).toEqual(["Recipes"]);
  });

  it("reuses an existing tag whatever its capitals, keeping its name", () => {
    const existingTags = [{ id: "tag-1", name: "recipes", nameKey: "recipes" }];
    const result = build(
      {
        posts: [post("A")],
        collections: [collection("c1", " Recipes ", ["A"])],
      },
      { tags: existingTags },
    );
    expect(result.tags).toEqual([]);
    expect(tagNamesOf(result, "A", existingTags)).toEqual(["recipes"]);
    expect(result.summary.tagsAddedCount).toBe(0);
  });

  it("makes one tag for collections that share a name", () => {
    const result = build({
      posts: [post("A"), post("B")],
      collections: [
        collection("c1", "Recipes", ["A"]),
        collection("c2", "recipes", ["A", "B"]),
      ],
    });
    expect(result.tags).toHaveLength(1);
    expect(tagNamesOf(result, "A")).toEqual(["Recipes"]);
    expect(tagNamesOf(result, "B")).toEqual(["Recipes"]);
  });

  it("makes no tag for a collection without new posts", () => {
    const result = build(
      {
        posts: [post("A")],
        collections: [collection("c1", "Recipes", ["A"])],
      },
      { posts: [libraryPost("A")] },
    );
    expect(result.tags).toEqual([]);
    expect(result.summary.tagsAddedCount).toBe(0);
  });

  it("links a post once, even if its collection lists it twice", () => {
    const result = build({
      posts: [post("A")],
      collections: [collection("c1", "Recipes", ["A", "A"])],
    });
    expect(result.postCollections).toHaveLength(1);
    expect(result.postTags).toHaveLength(1);
  });

  it("adds new collections and links their new posts", () => {
    const result = build({
      posts: [post("A")],
      collections: [collection("c1", "Recipes", ["A"])],
    });
    expect(result.collections).toMatchObject([
      { externalId: "c1", name: "Recipes" },
    ]);
    expect(result.postCollections).toEqual([
      { postId: result.posts[0].id, collectionId: result.collections[0].id },
    ]);
  });

  it("links new posts to collections the user already has", () => {
    const result = build(
      {
        posts: [post("A")],
        collections: [collection("c1", "Recipes", ["A"])],
      },
      { collections: [{ id: "col-1", externalId: "c1", name: "Recipes" }] },
    );
    expect(result.collections).toEqual([]);
    expect(result.postCollections).toEqual([
      { postId: result.posts[0].id, collectionId: "col-1" },
    ]);
  });

  it("renames a collection that was renamed on Instagram", () => {
    const result = build(
      { posts: [post("A")], collections: [collection("c1", "Dinner", [])] },
      { collections: [{ id: "col-1", externalId: "c1", name: "Recipes" }] },
    );
    expect(result.collectionRenames).toEqual([{ id: "col-1", name: "Dinner" }]);
  });

  it("records the import with its date range and counts", () => {
    const result = build(
      {
        posts: [
          post("A", "2021-03-14T08:00:00Z"),
          post("B", "2026-09-30T20:00:00Z"),
          post("C", "2024-01-01T00:00:00Z"),
        ],
        invalidCount: 2,
      },
      { posts: [libraryPost("C")] },
    );
    expect(result.import).toMatchObject({
      userId,
      importedAt: now,
      earliestSavedAt: new Date("2021-03-14T08:00:00Z"),
      latestSavedAt: new Date("2026-09-30T20:00:00Z"),
      newCount: 2,
      duplicateCount: 1,
      invalidCount: 2,
    });
  });
});

describe("buildImport: no longer saved on Instagram", () => {
  // The export's saves span 1 January to 1 June 2026.
  const first = "2026-01-01T00:00:00Z";
  const last = "2026-06-01T00:00:00Z";
  const exported = [post("First", first), post("Last", last)];

  /** Imports `exported` (plus `input`) into a library with `library`. */
  const reimport = (
    library: ExistingLibrary["posts"],
    input: Partial<ImportInput> = {},
  ) =>
    build(
      { ...input, posts: [...exported, ...(input.posts ?? [])] },
      { posts: library },
    );

  it("flags a post missing from the export when it was saved inside its range", () => {
    const result = reimport([libraryPost("Gone", "2026-03-01T00:00:00Z")]);
    expect(result.flagPostIds).toEqual(["id-Gone"]);
    expect(result.summary.noLongerSavedCount).toBe(1);
  });

  it("counts the export's first and last saved time as inside the range", () => {
    const result = reimport([
      libraryPost("GoneFirst", first),
      libraryPost("GoneLast", last),
    ]);
    expect(result.flagPostIds).toEqual(["id-GoneFirst", "id-GoneLast"]);
  });

  it("leaves posts saved outside the range unchanged", () => {
    const result = reimport([
      libraryPost("Older", "2025-12-31T23:59:59Z"),
      libraryPost("Newer", "2026-06-01T00:00:01Z"),
    ]);
    expect(result.flagPostIds).toEqual([]);
    expect(result.summary.noLongerSavedCount).toBe(0);
  });

  it("never flags a post the browser couldn't read", () => {
    const result = reimport([libraryPost("Broken", "2026-03-01T00:00:00Z")], {
      unreadableShortcodes: ["Broken"],
    });
    expect(result.flagPostIds).toEqual([]);
  });

  it("keeps a post that's already flagged as it is", () => {
    const result = reimport([
      libraryPost("Gone", "2026-03-01T00:00:00Z", "2026-07-01T00:00:00Z"),
    ]);
    expect(result.flagPostIds).toEqual([]);
    expect(result.clearPostIds).toEqual([]);
    expect(result.summary.noLongerSavedCount).toBe(0);
  });

  it("clears the flag on a post that's in the export again", () => {
    const result = reimport(
      [libraryPost("Back", "2026-03-01T00:00:00Z", "2026-07-01T00:00:00Z")],
      { posts: [post("Back", "2026-03-01T00:00:00Z")] },
    );
    expect(result.clearPostIds).toEqual(["id-Back"]);
    expect(result.flagPostIds).toEqual([]);
  });

  it("gives a post saved again its new saved date", () => {
    const result = reimport(
      [libraryPost("Again", "2022-05-01T00:00:00Z", "2024-01-01T00:00:00Z")],
      { posts: [post("Again", "2026-05-01T00:00:00Z")] },
    );
    expect(result.savedAtUpdates).toEqual([
      { id: "id-Again", savedAt: new Date("2026-05-01T00:00:00Z") },
    ]);
    expect(result.clearPostIds).toEqual(["id-Again"]);
  });

  it("leaves saved dates that haven't changed", () => {
    const result = reimport([libraryPost("First", first)]);
    expect(result.savedAtUpdates).toEqual([]);
    expect(result.flagPostIds).toEqual([]);
  });

  it("never flags or changes a post that's only new in this import", () => {
    const result = reimport([]);
    expect(result.flagPostIds).toEqual([]);
    expect(result.clearPostIds).toEqual([]);
    expect(result.savedAtUpdates).toEqual([]);
  });
});

describe("splitUnreadable", () => {
  it("separates problems with saves from problems with whole collections", () => {
    const save: InvalidEntry = {
      file: POSTS_FILE,
      position: 1,
      reason: UNREADABLE_ENTRY,
    };
    const missing: InvalidEntry = {
      file: COLLECTIONS_FILE,
      position: 2,
      reason: NOT_IN_SAVED_POSTS,
    };
    const broken: InvalidEntry = {
      file: COLLECTIONS_FILE,
      position: 3,
      reason: UNREADABLE_ENTRY,
    };
    const noId: InvalidEntry = {
      file: COLLECTIONS_FILE,
      position: 4,
      reason: NO_COLLECTION_ID,
    };
    expect(splitUnreadable([save, missing, broken, noId])).toEqual({
      saves: [save, missing],
      collections: [broken, noId],
    });
  });
});
