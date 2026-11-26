import { beforeEach, describe, expect, it, vi } from "vitest";

const tagFindMany = vi.fn();
const ignoredFindMany = vi.fn();
vi.mock("@/lib/db", () => ({
  db: () => ({
    tag: { findMany: tagFindMany },
    ignoredSuggestion: { findMany: ignoredFindMany },
  }),
}));

const { getSuggestions } = await import("./get-suggestions");

const userId = "00000000-0000-4000-8000-0000000000aa";
const save = {
  id: "00000000-0000-4000-8000-000000000001",
  creatorUsername: "demo.kitchen",
  tags: [{ id: "tag-1", name: "Recipes" }],
  collections: ["Dinner ideas", "Trips"],
};

beforeEach(() => {
  tagFindMany.mockReset().mockResolvedValue([]);
  ignoredFindMany.mockReset().mockResolvedValue([]);
});

describe("getSuggestions", () => {
  it("counts only the user's tags on this creator's other saves", async () => {
    await getSuggestions(userId, save);
    const query = tagFindMany.mock.calls[0][0];
    const otherSaves = {
      userId,
      creatorUsername: "demo.kitchen",
      id: { not: save.id },
    };
    expect(query.where).toEqual({
      userId,
      posts: { some: { post: otherSaves } },
    });
    expect(query.select._count.select.posts.where).toEqual({
      post: otherSaves,
    });
  });

  it("reads only the user's ignored suggestions on this save", async () => {
    await getSuggestions(userId, save);
    expect(ignoredFindMany.mock.calls[0][0].where).toEqual({
      userId,
      postId: save.id,
    });
  });

  it("suggests from the creator and the collections, leaving out tags on the save and ignored ones", async () => {
    tagFindMany.mockResolvedValue([
      { name: "Recipes", _count: { posts: 5 } },
      { name: "Weeknight", _count: { posts: 2 } },
    ]);
    ignoredFindMany.mockResolvedValue([{ nameKey: "trips" }]);
    expect(await getSuggestions(userId, save)).toEqual({
      fromCreator: ["Weeknight"],
      fromCollections: ["Dinner ideas"],
    });
  });
});
