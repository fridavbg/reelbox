import { describe, expect, it } from "vitest";
import {
  filterFromSearchParams,
  filterFromURLSearchParams,
  filterSummary,
  filterHref,
  filterWhere,
  parseSavesFilter,
  saveHref,
  type SavesFilter,
} from "./saves-filter";

const all: SavesFilter = { kind: "all" };
const untagged: SavesFilter = { kind: "untagged" };
const recipes: SavesFilter = { kind: "tag", key: "recipes" };

describe("filterFromSearchParams", () => {
  it("shows all saves without a filter in the URL", () => {
    expect(filterFromSearchParams({})).toEqual(all);
  });

  it("reads a tag by its key, whatever its case and spaces", () => {
    expect(filterFromSearchParams({ tag: "Recipes" })).toEqual(recipes);
    expect(filterFromSearchParams({ tag: " recipes " })).toEqual(recipes);
  });

  it("keeps spaces and emoji inside a tag", () => {
    expect(filterFromSearchParams({ tag: "Date night 🍝" })).toEqual({
      kind: "tag",
      key: "date night 🍝",
    });
  });

  it("reads a tag made from a long collection name", () => {
    const name = "Weeknight dinner ideas for the whole family";
    expect(filterFromSearchParams({ tag: name })).toEqual({
      kind: "tag",
      key: name.toLowerCase(),
    });
  });

  it("reads a key that lowercasing made longer than its name", () => {
    const name = "İ".repeat(500);
    expect(filterFromSearchParams({ tag: name })).toEqual({
      kind: "tag",
      key: name.toLowerCase(),
    });
  });

  it("reads untagged", () => {
    expect(filterFromSearchParams({ untagged: "1" })).toEqual(untagged);
  });

  it("prefers the tag when both are given", () => {
    expect(filterFromSearchParams({ tag: "recipes", untagged: "1" })).toEqual(
      recipes,
    );
  });

  it.each([
    ["an empty tag", { tag: "" }],
    ["a blank tag", { tag: "   " }],
    ["a tag too long to exist", { tag: "a".repeat(1001) }],
    ["a repeated tag", { tag: ["recipes", "travel"] }],
    ["untagged with another value", { untagged: "yes" }],
  ])("shows all saves for %s", (_, params) => {
    expect(filterFromSearchParams(params)).toEqual(all);
  });
});

describe("parseSavesFilter", () => {
  it.each([all, untagged, recipes])("accepts %j", (filter) => {
    expect(parseSavesFilter(filter)).toEqual(filter);
  });

  it.each([
    ["nothing", undefined],
    ["a string", "recipes"],
    ["an unknown kind", { kind: "starred" }],
    ["a tag without a key", { kind: "tag" }],
    ["a tag key that isn't one", { kind: "tag", key: " Recipes" }],
  ])("rejects %s", (_, value) => {
    expect(parseSavesFilter(value)).toBeNull();
  });
});

describe("filterWhere", () => {
  const userId = "00000000-0000-4000-8000-0000000000aa";

  it("adds nothing for all saves", () => {
    expect(filterWhere(all, userId)).toEqual({});
  });

  it("matches saves with the user's tag", () => {
    expect(filterWhere(recipes, userId)).toEqual({
      tags: { some: { tag: { userId, nameKey: "recipes" } } },
    });
  });

  it("matches saves without tags", () => {
    expect(filterWhere(untagged, userId)).toEqual({ tags: { none: {} } });
  });
});

describe("filterHref", () => {
  it.each([
    [all, "/saves"],
    [untagged, "/saves?untagged=1"],
    [recipes, "/saves?tag=recipes"],
    [
      { kind: "tag", key: "date night 🍝" },
      "/saves?tag=date+night+%F0%9F%8D%9D",
    ],
  ] satisfies [SavesFilter, string][])("links %j to %s", (filter, href) => {
    expect(filterHref(filter)).toBe(href);
  });

  it("is read back as the same filter", () => {
    const filter: SavesFilter = { kind: "tag", key: "a&b=c" };
    const params = Object.fromEntries(
      new URL(filterHref(filter), "http://x").searchParams,
    );
    expect(filterFromSearchParams(params)).toEqual(filter);
  });
});

describe("filterSummary", () => {
  const tags = [
    { name: "Recipes", count: 12 },
    { name: "Travel", count: 0 },
  ];
  const summary = (filter: SavesFilter) => filterSummary(filter, tags, 20, 6);

  it("counts all saves", () => {
    expect(summary(all)).toEqual({ count: 20 });
  });

  it("counts untagged saves", () => {
    expect(summary(untagged)).toEqual({ count: 6 });
  });

  it("counts the tag's saves and names it as the user wrote it", () => {
    expect(summary(recipes)).toEqual({ count: 12, tagName: "Recipes" });
  });

  it("names a tag the user doesn't have by its key, with no saves", () => {
    expect(summary({ kind: "tag", key: "nope" })).toEqual({
      count: 0,
      tagName: "nope",
    });
  });
});

describe("saveHref", () => {
  const id = "00000000-0000-4000-8000-000000000001";

  it.each([
    [all, `/saves/${id}`],
    [untagged, `/saves/${id}?untagged=1`],
    [recipes, `/saves/${id}?tag=recipes`],
  ] satisfies [SavesFilter, string][])("carries %j along", (filter, href) => {
    expect(saveHref(id, filter)).toBe(href);
  });
});

describe("filterFromURLSearchParams", () => {
  it("reads the filter like the server does", () => {
    expect(
      filterFromURLSearchParams(new URLSearchParams("tag=Recipes")),
    ).toEqual(recipes);
    expect(
      filterFromURLSearchParams(new URLSearchParams("untagged=1")),
    ).toEqual(untagged);
  });

  it("shows all saves for a repeated tag, like the server", () => {
    expect(
      filterFromURLSearchParams(new URLSearchParams("tag=a&tag=b")),
    ).toEqual(all);
  });
});
