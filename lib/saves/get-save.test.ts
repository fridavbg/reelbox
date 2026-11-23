import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const findMany = vi.fn();
vi.mock("@/lib/db", () => ({
  db: () => ({ post: { findFirst }, tag: { findMany } }),
}));

const { getSave, listTags } = await import("./get-save");

const userId = "00000000-0000-4000-8000-0000000000aa";
const postId = "00000000-0000-4000-8000-000000000001";

const row = {
  id: postId,
  url: "https://www.instagram.com/reel/ABC123/",
  kind: "REEL",
  caption: "Crispy chickpea traybake",
  creatorUsername: "creator_one",
  creatorName: "Creator One",
  creatorUrl: "https://www.instagram.com/creator_one/",
  savedAt: new Date("2026-09-30T12:00:00Z"),
  noLongerSavedAt: null,
  tags: [
    { tag: { id: "tag-1", name: "Recipes" } },
    { tag: { id: "tag-2", name: "weeknight" } },
  ],
  collections: [{ collection: { name: "Dinner ideas" } }],
};

describe("getSave", () => {
  beforeEach(() => findFirst.mockReset());

  it.each(["abc", "", "../import", `${postId}x`])(
    "returns null for an id that isn't a UUID, without asking the database: %j",
    async (id) => {
      expect(await getSave(userId, id)).toBeNull();
      expect(findFirst).not.toHaveBeenCalled();
    },
  );

  it("only looks among the user's own saves", async () => {
    findFirst.mockResolvedValue(null);
    expect(await getSave(userId, postId)).toBeNull();
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: postId, userId });
  });

  it("returns the save with its tags and collection names", async () => {
    findFirst.mockResolvedValue(row);
    expect(await getSave(userId, postId)).toEqual({
      ...row,
      tags: [
        { id: "tag-1", name: "Recipes" },
        { id: "tag-2", name: "weeknight" },
      ],
      collections: ["Dinner ideas"],
    });
  });
});

describe("listTags", () => {
  it("lists the user's own tags with how many saves each is on", async () => {
    findMany.mockResolvedValue([
      { name: "Recipes", _count: { posts: 9 } },
      { name: "Travel", _count: { posts: 0 } },
    ]);
    expect(await listTags(userId)).toEqual([
      { name: "Recipes", count: 9 },
      { name: "Travel", count: 0 },
    ]);
    expect(findMany.mock.calls[0][0].where).toEqual({ userId });
  });
});
