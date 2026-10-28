import { describe, expect, it } from "vitest";
import type { ParsedPost } from "@/lib/export/parse-export";
import { parseImportRequest } from "./import-request";
import {
  MAX_CAPTION_LENGTH,
  MAX_HASHTAGS,
  MAX_IMPORT_POSTS,
  MAX_INVALID_COUNT,
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
};

/** What the server receives: the upload after JSON, so dates are strings. */
const sent = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const withPost = (changes: Record<string, unknown>) =>
  sent({ ...upload, posts: [{ ...post, ...changes }] });

describe("parseImportRequest", () => {
  it("accepts what the browser's parser produced", () => {
    expect(parseImportRequest(sent(upload), now)).toEqual(upload);
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
    ["something that isn't an upload", "hello"],
  ])("refuses %s", (_, value) => {
    expect(parseImportRequest(value, now)).toBeNull();
  });
});
