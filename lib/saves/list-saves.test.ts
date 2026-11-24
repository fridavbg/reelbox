import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({ db: () => ({ post: { findMany } }) }));

const { listSaves } = await import("./list-saves");

const userId = "00000000-0000-4000-8000-0000000000aa";
const cursor = {
  savedAt: new Date("2026-09-30T12:00:00Z"),
  id: "00000000-0000-4000-8000-000000000001",
};

describe("listSaves", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it("reads the user's own saves, filtered and after the cursor", async () => {
    await listSaves(userId, { kind: "tag", key: "recipes" }, cursor);
    expect(findMany.mock.calls[0][0].where).toEqual({
      userId,
      AND: [
        { tags: { some: { tag: { userId, nameKey: "recipes" } } } },
        {
          OR: [
            { savedAt: { lt: cursor.savedAt } },
            { savedAt: cursor.savedAt, id: { lt: cursor.id } },
          ],
        },
      ],
    });
  });

  it("reads all the user's saves on the first page", async () => {
    await listSaves(userId, { kind: "all" });
    expect(findMany.mock.calls[0][0].where).toEqual({
      userId,
      AND: [{}, {}],
    });
  });
});
