import { describe, expect, it } from "vitest";
import { parsePostLink, profileUrl } from "./instagram-url";

describe("parsePostLink", () => {
  it("reads a reel link", () => {
    expect(parsePostLink("https://www.instagram.com/reel/AbC_12-xy/")).toEqual({
      kind: "REEL",
      shortcode: "AbC_12-xy",
      url: "https://www.instagram.com/reel/AbC_12-xy/",
    });
  });

  it("reads a post link", () => {
    expect(parsePostLink("https://www.instagram.com/p/XyZ789/")).toMatchObject({
      kind: "POST",
      shortcode: "XyZ789",
    });
  });

  it("normalizes host, missing slash, query and /reels/", () => {
    expect(
      parsePostLink("https://instagram.com/reels/AbC123?igsh=share")?.url,
    ).toBe("https://www.instagram.com/reel/AbC123/");
  });

  it("keeps the shortcode's capitals, because they matter", () => {
    expect(parsePostLink("https://www.instagram.com/p/aBc/")?.shortcode).toBe(
      "aBc",
    );
  });

  it.each([
    ["a profile", "https://www.instagram.com/someone/"],
    ["a story", "https://www.instagram.com/stories/someone/123/"],
    ["another site", "https://example.com/p/AbC123/"],
    ["a link without shortcode", "https://www.instagram.com/p/"],
    ["an inherited object name", "https://www.instagram.com/constructor/abc/"],
    ["text", "not a link"],
  ])("rejects %s", (_, link) => {
    expect(parsePostLink(link)).toBeNull();
  });
});

describe("profileUrl", () => {
  it("builds the profile link from a username", () => {
    expect(profileUrl("demo.kitchen_2")).toBe(
      "https://www.instagram.com/demo.kitchen_2/",
    );
  });

  it.each([
    ["a script", "javascript:alert(1)"],
    ["a link", "https://evil.example/"],
    ["markup", "<script>"],
    ["spaces", "demo kitchen"],
    ["more than 30 characters", "a".repeat(31)],
    ["nothing", ""],
  ])("rejects %s", (_, username) => {
    expect(profileUrl(username)).toBeNull();
  });
});
