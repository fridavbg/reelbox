import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SUGGESTION_IGNORE_FAILED,
  TAG_NAME_EMPTY,
  TAG_NAME_TOO_LONG,
  TAG_SAVE_FAILED,
} from "@/lib/tags-text";

const user = { id: "00000000-0000-4000-8000-0000000000aa" };
const postId = "00000000-0000-4000-8000-000000000001";
const tagId = "00000000-0000-4000-8000-000000000002";

const findFirst = vi.fn();
const findUnique = vi.fn();
const upsert = vi.fn();
const createMany = vi.fn();
const deleteMany = vi.fn();
const ignoreCreateMany = vi.fn();
const collectionFindMany = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/session", () => ({ requireUser: async () => user }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({
  db: () => ({
    post: { findFirst },
    tag: { findUnique, upsert },
    collection: { findMany: collectionFindMany },
    postTag: { createMany, deleteMany },
    ignoredSuggestion: { createMany: ignoreCreateMany },
  }),
}));

const { addTag, ignoreSuggestion, removeTag } = await import("./actions");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  findFirst.mockResolvedValue({ id: postId });
  findUnique.mockResolvedValue(null);
  upsert.mockResolvedValue({ id: tagId });
  collectionFindMany.mockResolvedValue([]);
});

describe("addTag", () => {
  it("finds or creates the tag by its key, keeping an existing tag's name", async () => {
    expect(await addTag(postId, "  Weeknight ")).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_nameKey: { userId: user.id, nameKey: "weeknight" } },
        create: { userId: user.id, name: "Weeknight", nameKey: "weeknight" },
        update: {},
      }),
    );
  });

  it("links the tag to the save, doing nothing if it's already there", async () => {
    await addTag(postId, "Weeknight");
    expect(createMany).toHaveBeenCalledWith({
      data: [{ postId, tagId }],
      skipDuplicates: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/saves", "layout");
  });

  it("only tags the user's own saves", async () => {
    findFirst.mockResolvedValue(null);
    expect(await addTag(postId, "Weeknight")).toEqual({
      ok: false,
      error: TAG_SAVE_FAILED,
    });
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: postId,
      userId: user.id,
    });
    expect(upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("reuses an existing tag of any length, e.g. one made from a collection", async () => {
    const long = "Weekend breakfast ideas for the family";
    findUnique.mockResolvedValue({ id: tagId });
    expect(await addTag(postId, long)).toEqual({ ok: true });
    expect(findUnique.mock.calls[0][0].where).toEqual({
      userId_nameKey: { userId: user.id, nameKey: long.toLowerCase() },
    });
    expect(upsert).not.toHaveBeenCalled();
    expect(createMany).toHaveBeenCalledWith({
      data: [{ postId, tagId }],
      skipDuplicates: true,
    });
  });

  it("refuses a new tag that's too long, saying why", async () => {
    expect(await addTag(postId, "a".repeat(31))).toEqual({
      ok: false,
      error: TAG_NAME_TOO_LONG,
    });
    expect(upsert).not.toHaveBeenCalled();
    expect(createMany).not.toHaveBeenCalled();
  });

  it("creates a long tag named after one of the save's collections", async () => {
    const long = "Weekend breakfast ideas for the family";
    collectionFindMany.mockResolvedValue([{ name: ` ${long.toUpperCase()}` }]);
    expect(await addTag(postId, long)).toEqual({ ok: true });
    expect(collectionFindMany.mock.calls[0][0].where).toEqual({
      userId: user.id,
      posts: { some: { postId } },
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: user.id, name: long, nameKey: long.toLowerCase() },
      }),
    );
  });

  it("refuses a long new tag named after a collection the save isn't in", async () => {
    collectionFindMany.mockResolvedValue([{ name: "Dinner ideas" }]);
    expect(await addTag(postId, "a".repeat(31))).toEqual({
      ok: false,
      error: TAG_NAME_TOO_LONG,
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it.each([
    ["an empty name", "   ", TAG_NAME_EMPTY],
    ["a name longer than any tag", "a".repeat(501), TAG_NAME_TOO_LONG],
    ["a name that isn't text", 42, TAG_SAVE_FAILED],
  ])("refuses %s, saying why", async (_, name, error) => {
    expect(await addTag(postId, name)).toEqual({ ok: false, error });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it.each([
    ["a short name", "Weeknight"],
    ["a name that may be an existing tag's", "a".repeat(31)],
  ])(
    "refuses a post id that isn't a UUID with %s, without asking the database",
    async (_, name) => {
      expect(await addTag("abc", name)).toEqual({
        ok: false,
        error: TAG_SAVE_FAILED,
      });
      expect(findFirst).not.toHaveBeenCalled();
    },
  );

  it("answers with a message when the database fails", async () => {
    upsert.mockRejectedValue(new Error("connection lost"));
    expect(await addTag(postId, "Weeknight")).toEqual({
      ok: false,
      error: TAG_SAVE_FAILED,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("removeTag", () => {
  it("removes the tag from the user's own save only", async () => {
    expect(await removeTag(postId, tagId)).toEqual({ ok: true });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { postId, tagId, post: { userId: user.id } },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/saves", "layout");
  });

  it("refuses ids that aren't UUIDs, without asking the database", async () => {
    expect(await removeTag(postId, "abc")).toEqual({
      ok: false,
      error: TAG_SAVE_FAILED,
    });
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("answers with a message when the database fails", async () => {
    deleteMany.mockRejectedValue(new Error("connection lost"));
    expect(await removeTag(postId, tagId)).toEqual({
      ok: false,
      error: TAG_SAVE_FAILED,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("ignoreSuggestion", () => {
  it("remembers the ignored name on the user's own save, by its key", async () => {
    expect(await ignoreSuggestion(postId, "  Weeknight ")).toEqual({
      ok: true,
    });
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: postId,
      userId: user.id,
    });
    expect(ignoreCreateMany).toHaveBeenCalledWith({
      data: [{ postId, userId: user.id, nameKey: "weeknight" }],
      // Ignoring it twice, e.g. from two tabs, is fine.
      skipDuplicates: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/saves", "layout");
  });

  it("refuses a save that isn't the user's", async () => {
    findFirst.mockResolvedValue(null);
    expect(await ignoreSuggestion(postId, "Weeknight")).toEqual({
      ok: false,
      error: SUGGESTION_IGNORE_FAILED,
    });
    expect(ignoreCreateMany).not.toHaveBeenCalled();
  });

  it.each([
    ["an id that isn't a UUID", "abc", "Weeknight"],
    ["an empty name", postId, "  "],
    ["a name that isn't text", postId, 42],
  ])("refuses %s, without asking the database", async (_, id, name) => {
    expect(await ignoreSuggestion(id, name)).toEqual({
      ok: false,
      error: SUGGESTION_IGNORE_FAILED,
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("answers with a message when the database fails", async () => {
    ignoreCreateMany.mockRejectedValue(new Error("connection lost"));
    expect(await ignoreSuggestion(postId, "Weeknight")).toEqual({
      ok: false,
      error: SUGGESTION_IGNORE_FAILED,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
