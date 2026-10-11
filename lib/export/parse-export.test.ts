import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  IMPOSSIBLE_SAVED_DATE,
  NO_COLLECTION_ID,
  NO_CREATOR,
  NO_LINK,
  NO_SAVED_DATE,
  NO_SAVES,
  NOT_A_POST_LINK,
  NOT_AN_EXPORT,
  NOT_IN_SAVED_POSTS,
  UNREADABLE_ENTRY,
} from "./export-messages";
import { type ParsedExport, parseExport } from "./parse-export";
import type { ExportTexts } from "./read-export-files";

// A made-up export in Instagram's format, with its encoding bug and the
// broken entries found in a real export. No real accounts.
const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", name), "utf8");
const files: ExportTexts = {
  posts: fixture("saved_posts.json"),
  collections: fixture("saved_collections.json"),
};

function parsed(input: ExportTexts = files): ParsedExport {
  const result = parseExport(input);
  if (!result.ok) throw new Error(result.error);
  return result.export;
}
const post = (shortcode: string) =>
  parsed().posts.find((p) => p.shortcode === shortcode);

describe("parseExport: posts", () => {
  it("reads every valid post once", () => {
    expect(
      parsed()
        .posts.map((p) => p.shortcode)
        .sort(),
    ).toEqual(["DemoHome002", "DemoMove003", "DemoRcp0001"]);
  });

  it("reads a reel with all its fields and repaired text", () => {
    expect(post("DemoRcp0001")).toEqual({
      shortcode: "DemoRcp0001",
      url: "https://www.instagram.com/reel/DemoRcp0001/",
      kind: "REEL",
      caption: "Kanelbullar på söndag 🍝",
      creatorUsername: "demo.kitchen",
      creatorName: "Demo Kök",
      creatorUrl: "https://www.instagram.com/demo.kitchen/",
      hashtags: ["baking", "fika"],
      fbid: "10000000000000001",
      savedAt: new Date("2025-10-02T09:00:00Z"),
    });
  });

  it("reads a post link as a post", () => {
    expect(post("DemoHome002")?.kind).toBe("POST");
  });

  // In Meta's format, "\u00a0" can be the last byte of a character like "à"
  // or "😠", not a space, so text must be repaired before it's trimmed.
  it.each([
    ["à", "Voilà"],
    ["an emoji", "So annoyed 😠"],
  ])("repairs a caption ending in %s", (_, caption) => {
    const asExported = String.fromCharCode(
      ...new TextEncoder().encode(caption),
    );
    const posts = JSON.stringify([
      {
        timestamp: 1759395600,
        label_values: [
          { label: "URL", value: "https://www.instagram.com/p/DemoEnds01/" },
          { label: "Caption", value: asExported },
          {
            title: "Owner",
            dict: [{ dict: [{ label: "Username", value: "demo.kitchen" }] }],
          },
        ],
      },
    ]);
    expect(parsed({ posts, collections: null }).posts[0].caption).toBe(caption);
  });

  it("uses the first non-empty caption when there are several", () => {
    expect(post("DemoHome002")?.caption).toBe("Small hallway, big ideas");
  });

  it("takes the creator from Owner, never from Brand partner", () => {
    expect(post("DemoMove003")?.creatorUsername).toBe("demo.movement");
  });

  // The fixture lists DemoRcp0001 twice: newest first, an older copy fourth.
  // Both orders are tested, so "keep the first copy" can't pass by luck.
  it.each([
    ["newest copy first", (entries: unknown[]) => entries],
    ["older copy first", (entries: unknown[]) => [...entries].reverse()],
  ])(
    "keeps a post listed twice once, with its latest saved date (%s)",
    (_, order) => {
      const posts = JSON.stringify(order(JSON.parse(files.posts)));
      const copies = parsed({ posts, collections: null }).posts.filter(
        (p) => p.shortcode === "DemoRcp0001",
      );
      expect(copies).toHaveLength(1);
      expect(copies[0].savedAt).toEqual(new Date("2025-10-02T09:00:00Z"));
    },
  );

  it("computes the earliest and latest saved dates", () => {
    const { earliestSavedAt, latestSavedAt } = parsed();
    expect(earliestSavedAt).toEqual(new Date("2024-01-01T10:00:00Z"));
    expect(latestSavedAt).toEqual(new Date("2025-10-02T09:00:00Z"));
  });
});

describe("parseExport: invalid entries", () => {
  const invalid = () => parsed().invalid;

  it.each([
    [5, NO_LINK],
    [6, NOT_A_POST_LINK],
    [7, NO_SAVED_DATE],
    [8, NO_CREATOR],
    [9, UNREADABLE_ENTRY],
  ])("lists saved post %i with the reason %s", (position, reason) => {
    expect(invalid()).toContainEqual(
      expect.objectContaining({ file: "saved_posts.json", position, reason }),
    );
  });

  it("includes the link when there is one", () => {
    expect(
      invalid().find((entry) => entry.reason === NOT_A_POST_LINK)?.url,
    ).toBe("https://www.instagram.com/demo.wanderer/");
  });

  it("lists nothing else", () => {
    // 5 broken saved posts, 1 collection post without a save, 1 collection without id.
    expect(invalid()).toHaveLength(7);
  });
});

describe("parseExport: collections", () => {
  const collection = (name: string) =>
    parsed().collections.find((c) => c.name === name);

  it("reads names, ids and posts, with repaired text", () => {
    expect(collection("Middagstips 🍝")).toEqual({
      externalId: "20000000000000001",
      name: "Middagstips 🍝",
      shortcodes: ["DemoRcp0001"],
    });
  });

  it("links a post by its link alone, even without creator fields", () => {
    expect(collection("Home")?.shortcodes).toEqual(["DemoHome002"]);
  });

  it("reports a missing post once, even if it's in several collections", () => {
    const missing = parsed().invalid.filter(
      (entry) => entry.reason === NOT_IN_SAVED_POSTS,
    );
    expect(missing).toHaveLength(1);
  });

  it("keeps empty collections", () => {
    expect(collection("Empty")?.shortcodes).toEqual([]);
  });

  it("lists posts that are only in a collection as invalid", () => {
    expect(parsed().invalid).toContainEqual({
      file: "saved_collections.json",
      position: 1,
      reason: NOT_IN_SAVED_POSTS,
      url: "https://www.instagram.com/p/DemoOnlyHere/",
    });
  });

  it("lists a collection without id as invalid", () => {
    expect(parsed().invalid).toContainEqual({
      file: "saved_collections.json",
      position: 3,
      reason: NO_COLLECTION_ID,
    });
    expect(collection("No id")).toBeUndefined();
  });

  it("works without a collections file", () => {
    const result = parsed({ posts: files.posts, collections: null });
    expect(result.collections).toEqual([]);
    expect(result.posts).toHaveLength(3);
  });
});

describe("parseExport: files that aren't an export", () => {
  it.each([
    ["not JSON", "{oops"],
    ["an object instead of a list", '{"saved_saved_media": []}'],
  ])("rejects %s", (_, posts) => {
    expect(parseExport({ posts, collections: null })).toEqual({
      ok: false,
      error: NOT_AN_EXPORT,
    });
  });

  it("rejects an export without readable saved posts", () => {
    expect(parseExport({ posts: '["broken"]', collections: null })).toEqual({
      ok: false,
      error: NO_SAVES,
    });
  });

  it("rejects a broken collections file", () => {
    expect(
      parseExport({ posts: files.posts, collections: "not json" }),
    ).toEqual({ ok: false, error: NOT_AN_EXPORT });
  });
});

describe("parseExport: manipulated or random files", () => {
  // One saved post, with the owner fields replaced.
  const withOwner = (owner: object[]) =>
    JSON.stringify([
      {
        timestamp: 1759395600,
        label_values: [
          { label: "URL", value: "https://www.instagram.com/p/DemoFake01/" },
          { title: "Owner", dict: [{ dict: owner }] },
        ],
      },
    ]);

  it("never keeps the profile link from the file", () => {
    const result = parsed({
      posts: withOwner([
        { label: "URL", value: "javascript:alert(1)" },
        { label: "Username", value: "demo.kitchen" },
      ]),
      collections: null,
    });
    expect(result.posts[0].creatorUrl).toBe(
      "https://www.instagram.com/demo.kitchen/",
    );
  });

  it("rejects a username that isn't an Instagram username", () => {
    const result = parseExport({
      posts: withOwner([{ label: "Username", value: "<script>" }]),
      collections: null,
    });
    // The only post is invalid, so there's nothing to import.
    expect(result).toEqual({ ok: false, error: NO_SAVES });
  });

  it("rejects a list of random values", () => {
    expect(
      parseExport({ posts: '[1, "x", {"a": 1}, null]', collections: null }),
    ).toEqual({ ok: false, error: NO_SAVES });
  });
});

describe("parseExport: saved dates", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  // Two saved posts: one valid, one saved at `date`.
  const postsSavedAt = (date: string) =>
    JSON.stringify(
      [
        ["DemoValid01", "2026-01-01T00:00:00Z"],
        ["DemoDated01", date],
      ].map(([shortcode, saved]) => ({
        timestamp: new Date(saved).getTime() / 1000,
        label_values: [
          { label: "URL", value: `https://www.instagram.com/p/${shortcode}/` },
          {
            title: "Owner",
            dict: [{ dict: [{ label: "Username", value: "demo.kitchen" }] }],
          },
        ],
      })),
    );
  const outcome = (date: string) => {
    const result = parseExport(
      { posts: postsSavedAt(date), collections: null },
      now,
    );
    if (!result.ok) throw new Error(result.error);
    return result.export;
  };

  it.each([
    ["before Instagram launched", "2010-10-05T23:59:59Z"],
    ["more than a day in the future", "2026-10-12T12:00:01Z"],
  ])("rejects a date %s", (_, date) => {
    const result = outcome(date);
    expect(result.posts.map((p) => p.shortcode)).toEqual(["DemoValid01"]);
    expect(result.invalid).toEqual([
      expect.objectContaining({ position: 2, reason: IMPOSSIBLE_SAVED_DATE }),
    ]);
  });

  it.each([
    ["on Instagram's launch day", "2010-10-06T00:00:00Z"],
    ["up to a day in the future", "2026-10-12T12:00:00Z"],
  ])("accepts a date %s", (_, date) => {
    expect(outcome(date).posts).toHaveLength(2);
  });

  it("keeps impossible dates out of the import's date range", () => {
    const result = outcome("1990-01-01T00:00:00Z");
    expect(result.earliestSavedAt).toEqual(new Date("2026-01-01T00:00:00Z"));
  });
});
