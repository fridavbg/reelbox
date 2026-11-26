import { describe, expect, it } from "vitest";
import {
  NO_LINK,
  NOT_A_POST_LINK,
  NOT_IN_SAVED_POSTS,
  UNREADABLE_ENTRY,
} from "@/lib/export/export-messages";
import { COLLECTIONS_FILE, POSTS_FILE } from "@/lib/export/export-settings";
import type { ParsedExport } from "@/lib/export/parse-export";
import { buildUpload } from "./build-upload";

const savedAt = new Date("2026-10-01T08:00:00.000Z");

const parsed: ParsedExport = {
  posts: [
    {
      shortcode: "AbC123",
      url: "https://www.instagram.com/reel/AbC123/",
      kind: "REEL",
      caption: null,
      creatorUsername: "creator",
      creatorName: null,
      creatorUrl: "https://www.instagram.com/creator/",
      hashtags: [],
      fbid: null,
      savedAt,
    },
  ],
  collections: [{ externalId: "c-1", name: "Recipes", shortcodes: ["AbC123"] }],
  invalid: [
    {
      file: POSTS_FILE,
      position: 2,
      reason: NOT_A_POST_LINK,
      url: "https://www.instagram.com/someone/",
    },
    { file: POSTS_FILE, position: 3, reason: NO_LINK },
    // A save listed only in a collection still counts.
    {
      file: COLLECTIONS_FILE,
      position: 1,
      reason: NOT_IN_SAVED_POSTS,
      url: "https://www.instagram.com/p/Unread1/",
    },
    // A whole collection that couldn't be read isn't a save.
    { file: COLLECTIONS_FILE, position: 2, reason: UNREADABLE_ENTRY },
  ],
  earliestSavedAt: savedAt,
  latestSavedAt: savedAt,
};

describe("buildUpload", () => {
  it("sends the saves and collections, the unreadable count, and the shortcodes of unreadable post links", () => {
    expect(buildUpload(parsed)).toEqual({
      posts: parsed.posts,
      collections: parsed.collections,
      invalidCount: 3,
      unreadableShortcodes: ["Unread1"],
    });
  });
});
