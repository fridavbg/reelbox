import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SaveListItem } from "@/lib/saves/list-saves";
import { PROFILE_LINK_CONTEXT } from "@/lib/saves/save-card-text";
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
    expect(text(heading(render())!)).toBe("Creator One");
  });

  it("links @username to the creator's profile in a new tab", () => {
    const link = profileLink(render())!;
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
    expect(text(link)).toBe(`@creator_one${PROFILE_LINK_CONTEXT} ↗`);
  });

  it("uses the @username link as its heading when there's no display name", () => {
    const html = render({ creatorName: null });
    expect(profileLink(heading(html)!)).toBeDefined();
    expect(html.match(/@creator_one/g)).toHaveLength(2); // the link and "Open on Instagram"
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

  it("hides the kind icon from screen readers", () => {
    expect(render()).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(text(render())).toContain("Reel");
  });
});
