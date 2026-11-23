import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SaveListItem } from "@/lib/saves/list-saves";
import {
  EDIT_TAGS_CONTEXT,
  PROFILE_LINK_CONTEXT,
} from "@/lib/saves/save-card-text";
import { SaveCard } from "./SaveCard";

const save: SaveListItem = {
  id: "00000000-0000-4000-8000-000000000001",
  url: "https://www.instagram.com/reel/ABC123/",
  kind: "REEL",
  caption: "Crispy chickpea traybake",
  creatorUsername: "creator_one",
  creatorName: "Creator One",
  creatorUrl: "https://www.instagram.com/creator_one/",
  savedAt: new Date("2026-09-30T12:00:00Z"),
  noLongerSavedAt: null,
  tags: [],
};

const render = (changes: Partial<SaveListItem> = {}, demo = false) =>
  renderToStaticMarkup(
    <SaveCard save={{ ...save, ...changes }} timeZone="UTC" demo={demo} />,
  );

/** The visible and hidden text of some markup, on one line. */
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** The markup of the card's heading. */
const heading = (html: string) => html.match(/<h2[^>]*>(.*?)<\/h2>/)?.[1];

/** The markup of the link to the creator's profile, if there is one. */
const profileLink = (html: string) =>
  html.match(
    /<a[^>]*href="https:\/\/www.instagram.com\/creator_one\/".*?<\/a>/,
  )?.[0];

describe("SaveCard", () => {
  it("says when a save is no longer saved on Instagram, in words and not only with an icon", () => {
    const html = render({ noLongerSavedAt: new Date("2026-11-01T12:00:00Z") });
    expect(text(html)).toContain("No longer saved on Instagram");
    expect(html).toContain("lucide-bookmark-x");
  });

  it("has no badge while the save is still saved", () => {
    expect(text(render())).not.toContain("No longer saved");
  });

  it("shows the caption", () => {
    expect(render()).toContain("Crispy chickpea traybake");
  });

  it("shows the caption as plain text", () => {
    const html = render({ caption: "<b>bold</b> & more" });
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt; &amp; more");
  });

  it("leaves the caption out when there is none", () => {
    expect(render({ caption: null })).not.toMatch(/<p[^>]*><\/p>/);
  });

  it("has the creator's display name as its heading", () => {
    expect(text(heading(render())!)).toBe(`Creator One${EDIT_TAGS_CONTEXT}`);
  });

  it("links its heading to the save's own page, saying what it's for", () => {
    const link = heading(render())!.match(/<a[^>]*>.*<\/a>/)?.[0];
    expect(link).toContain(`href="/saves/${save.id}"`);
    expect(link).not.toContain("target=");
    expect(text(link!)).toBe(`Creator One${EDIT_TAGS_CONTEXT}`);
  });

  it("links demo saves to their page too, since demo visitors can tag", () => {
    expect(heading(render({}, true))).toContain(`href="/saves/${save.id}"`);
  });

  it("keeps the profile link and Open on Instagram outside the heading's link", () => {
    const html = render();
    expect(profileLink(heading(html)!)).toBeUndefined();
    expect(profileLink(html)).toBeDefined();
    expect(text(heading(html)!)).not.toContain("Open on Instagram");
    expect(text(html)).toContain("Open on Instagram");
  });

  it("links @username to the creator's profile in a new tab", () => {
    const link = profileLink(render())!;
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
    expect(text(link)).toBe(`@creator_one${PROFILE_LINK_CONTEXT} ↗`);
  });

  // Every card has the same rows, so the heading is plain text and the
  // profile link keeps its own row below it.
  it.each([
    ["no display name", null],
    ["an empty display name", ""],
  ])("uses @username as its heading when there's %s", (_, creatorName) => {
    const html = render({ creatorName });
    expect(text(heading(html)!)).toBe(`@creator_one${EDIT_TAGS_CONTEXT}`);
    expect(profileLink(heading(html)!)).toBeUndefined();
    expect(profileLink(html)).toBeDefined();
  });

  it("shows @username as plain text in the demo", () => {
    const html = render({}, true);
    expect(profileLink(html)).toBeUndefined();
    expect(text(html)).toContain("@creator_one");
  });

  it("shows @username as plain text when there's no profile link", () => {
    const html = render({ creatorUrl: null });
    expect(profileLink(html)).toBeUndefined();
    expect(text(html)).toContain("@creator_one");
  });

  it("shows a clapperboard for reels and an image for posts", () => {
    expect(render({ kind: "REEL" })).toContain("lucide-clapperboard");
    expect(render({ kind: "POST" })).toContain("lucide-image");
  });

  it("hides the kind icon from screen readers", () => {
    expect(render()).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(text(render())).toContain("Reel");
  });
});
