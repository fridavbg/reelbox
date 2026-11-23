import { describe, expect, it } from "vitest";
import type { ParsedPost } from "@/lib/export/parse-export";
import { parseImportRequest } from "./import-request";
import {
  MAX_CAPTION_LENGTH,
  MAX_HASHTAGS,
  MAX_IMPORT_POSTS,
  MAX_INVALID_COUNT,
  MAX_TEXT_LENGTH,
} from "./import-settings";

const now = new Date("2026-10-28T12:00:00Z");

const post: ParsedPost = {
  shortcode: "AbC123",
  url: "https://www.instagram.com/reel/AbC123/",
  kind: "REEL",
  caption: "Hur söt får man va? 💕",
  creatorUsername: "some.creator",
  creatorName: "Some Creator",
  creatorUrl: "https://www.instagram.com/some.creator/",
  hashtags: ["fika"],
  fbid: "17900000000000000",
  savedAt: new Date("2026-10-01T08:00:00Z"),
};

const upload = {
  posts: [post],
  collections: [{ externalId: "1790", name: "Fika", shortcodes: ["AbC123"] }],
  invalidCount: 2,
  unreadableShortcodes: ["NoDate1"],
};

/** What parseImportRequest returns for `upload`. */
const parsed = {
  posts: [post],
  collections: upload.collections,
  invalidCount: 2,
  unreadableShortcodes: ["NoDate1"],
};

// What the server receives: the upload after JSON, so dates are strings.
const sent = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const withPost = (changes: Record<string, unknown>) =>
  sent({ ...upload, posts: [{ ...post, ...changes }] });

describe("parseImportRequest", () => {
  it("accepts what the browser's parser produced", () => {
    expect(parseImportRequest(sent(upload), now)).toEqual(parsed);
  });

  it("accepts an upload without unreadable saves, from a page loaded before they were sent", () => {
    // JSON leaves out undefined fields, so the field isn't sent at all.
    const older = { ...upload, unreadableShortcodes: undefined };
    expect(parseImportRequest(sent(older), now)?.unreadableShortcodes).toEqual(
      [],
    );
  });

  it("keeps the shortcodes from the links an older page sends, ignoring links that aren't posts", () => {
    const result = parseImportRequest(
      sent({
        ...upload,
        unreadableShortcodes: undefined,
        invalidCount: 3,
        unreadableLinks: [
          "https://www.instagram.com/reel/Reel1/?igsh=x",
          "https://www.instagram.com/some.creator/",
          "javascript:alert(1)",
        ],
      }),
      now,
    );
    expect(result?.unreadableShortcodes).toEqual(["Reel1"]);
  });

  it("combines shortcodes and links if both are sent", () => {
    const result = parseImportRequest(
      sent({
        ...upload,
        invalidCount: 2,
        unreadableShortcodes: ["Code1"],
        unreadableLinks: ["https://www.instagram.com/p/Code2/"],
      }),
      now,
    );
    expect(result?.unreadableShortcodes).toEqual(["Code1", "Code2"]);
  });

  it("rebuilds links instead of trusting the ones sent", () => {
    const result = parseImportRequest(
      withPost({
        url: "https://instagram.com/reel/AbC123/?utm_source=x",
        creatorUrl: "javascript:alert(1)",
      }),
      now,
    );
    expect(result?.posts[0]).toMatchObject({
      url: "https://www.instagram.com/reel/AbC123/",
      creatorUrl: "https://www.instagram.com/some.creator/",
    });
  });

  it("drops fields it doesn't know", () => {
    const result = parseImportRequest(withPost({ isAdmin: true }), now);
    expect(result?.posts[0]).not.toHaveProperty("isAdmin");
  });

  it.each([
    ["no posts", sent({ ...upload, posts: [] })],
    [
      "too many posts",
      sent({
        ...upload,
        posts: Array.from({ length: MAX_IMPORT_POSTS + 1 }, (_, i) => ({
          ...post,
          shortcode: `Code${i}`,
          url: `https://www.instagram.com/reel/Code${i}/`,
        })),
      }),
    ],
    [
      "a link that isn't a post",
      withPost({ url: "https://evil.example/p/AbC123/" }),
    ],
    [
      "a link to a different post",
      withPost({ url: "https://www.instagram.com/reel/Other1/" }),
    ],
    ["an invalid username", withPost({ creatorUsername: "not a username!" })],
    [
      "a saved date before Instagram existed",
      withPost({ savedAt: "2009-01-01T00:00:00Z" }),
    ],
    [
      "a saved date in the future",
      withPost({ savedAt: "2027-01-01T00:00:00Z" }),
    ],
    ["a saved date that isn't a date", withPost({ savedAt: "yesterday" })],
    [
      "a caption that's too long",
      withPost({ caption: "x".repeat(MAX_CAPTION_LENGTH + 1) }),
    ],
    [
      "a collection with something that isn't a shortcode",
      sent({
        ...upload,
        collections: [{ ...upload.collections[0], shortcodes: ["<script>"] }],
      }),
    ],
    ["a negative invalid count", sent({ ...upload, invalidCount: -1 })],
    ["a fractional invalid count", sent({ ...upload, invalidCount: 1.5 })],
    [
      "an invalid count too large to store",
      sent({ ...upload, invalidCount: MAX_INVALID_COUNT + 1 }),
    ],
    [
      "too many hashtags",
      withPost({
        hashtags: Array.from({ length: MAX_HASHTAGS + 1 }, (_, i) => `t${i}`),
      }),
    ],
    [
      "more unreadable shortcodes than saves it couldn't read",
      sent({
        ...upload,
        invalidCount: 2,
        unreadableShortcodes: ["A", "B", "C"],
      }),
    ],
    [
      "more unreadable links and shortcodes together than saves it couldn't read",
      sent({
        ...upload,
        invalidCount: 2,
        unreadableShortcodes: ["A", "B"],
        unreadableLinks: ["https://www.instagram.com/p/C/"],
      }),
    ],
    [
      "an unreadable shortcode that isn't one",
      sent({ ...upload, unreadableShortcodes: ["not/a/shortcode"] }),
    ],
    [
      "unreadable shortcodes that aren't a list",
      sent({ ...upload, unreadableShortcodes: "x" }),
    ],
    [
      "an unreadable link that's too long, from an older page",
      sent({ ...upload, unreadableLinks: ["x".repeat(MAX_TEXT_LENGTH + 1)] }),
    ],
    [
      "unreadable links that aren't a list, from an older page",
      sent({ ...upload, unreadableLinks: "x" }),
    ],
    ["something that isn't an upload", "hello"],
  ])("refuses %s", (_, value) => {
    expect(parseImportRequest(value, now)).toBeNull();
  });
});
