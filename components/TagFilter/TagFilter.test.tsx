import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SavesFilter } from "@/lib/saves/saves-filter";
import type { UserTag } from "@/lib/tags";
import { TagFilter } from "./TagFilter";

const tags: UserTag[] = [
  { name: "Date night", count: 3 },
  { name: "Old", count: 0 },
  { name: "Recipes", count: 12 },
];

const render = (filter: SavesFilter, userTags = tags) =>
  renderToStaticMarkup(
    <TagFilter
      filter={filter}
      tags={userTags}
      totalCount={20}
      untaggedCount={6}
    />,
  );

/** The links in order, as [href, text, current]. */
const links = (html: string) =>
  [...html.matchAll(/<a([^>]*)>(.*?)<\/a>/g)].map(([, attrs, inner]) => [
    attrs.match(/href="([^"]*)"/)?.[1],
    inner.replace(/<[^>]+>/g, ""),
    attrs.includes('aria-current="page"'),
  ]);

describe("TagFilter", () => {
  it("is a named navigation landmark", () => {
    expect(render({ kind: "all" })).toMatch(
      /^<nav[^>]*aria-label="Filter by tag"/,
    );
  });

  it("links to all saves, untagged saves and each tag with saves, with counts", () => {
    expect(links(render({ kind: "all" }))).toEqual([
      ["/saves", "All 20 saves", true],
      ["/saves?untagged=1", "Untagged 6 saves", false],
      ["/saves?tag=date+night", "Date night 3 saves", false],
      ["/saves?tag=recipes", "Recipes 12 saves", false],
    ]);
  });

  it("marks the tag in the URL as current", () => {
    const current = links(render({ kind: "tag", key: "recipes" })).filter(
      ([, , isCurrent]) => isCurrent,
    );
    expect(current).toEqual([["/saves?tag=recipes", "Recipes 12 saves", true]]);
  });

  it("marks untagged as current", () => {
    const current = links(render({ kind: "untagged" })).filter(
      ([, , isCurrent]) => isCurrent,
    );
    expect(current.map(([href]) => href)).toEqual(["/saves?untagged=1"]);
  });

  it("keeps a tag on no saves while it's the one in the URL", () => {
    expect(links(render({ kind: "tag", key: "old" }))).toContainEqual([
      "/saves?tag=old",
      "Old 0 saves",
      true,
    ]);
  });

  it("says 1 save, not 1 saves", () => {
    const html = render({ kind: "all" }, [{ name: "Solo", count: 1 }]);
    expect(links(html)).toContainEqual([
      "/saves?tag=solo",
      "Solo 1 save",
      false,
    ]);
  });

  it("shows nothing while no tag is on a save", () => {
    expect(render({ kind: "all" }, [])).toBe("");
    expect(render({ kind: "all" }, [{ name: "Old", count: 0 }])).toBe("");
  });
});
