import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TAG_NAME_EMPTY,
  TAG_NAME_TOO_LONG,
  TAG_SAVE_FAILED,
} from "@/lib/tags-text";

const user = { id: "00000000-0000-4000-8000-0000000000aa" };
const postId = "00000000-0000-4000-8000-000000000001";
const tagId = "00000000-0000-4000-8000-000000000002";

const findFirst = vi.fn();
const upsert = vi.fn();
const createMany = vi.fn();
const deleteMany = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/session", () => ({ requireUser: async () => user }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({
  db: () => ({
    post: { findFirst },
    tag: { upsert },
    postTag: { createMany, deleteMany },
  }),
}));

const { addTag, removeTag } = await import("./actions");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  findFirst.mockResolvedValue({ id: postId });
  upsert.mockResolvedValue({ id: tagId });
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

  it.each([
    ["an empty name", "   ", TAG_NAME_EMPTY],
    ["a name that's too long", "a".repeat(31), TAG_NAME_TOO_LONG],
    ["a name that isn't text", 42, TAG_SAVE_FAILED],
  ])("refuses %s, saying why", async (_, name, error) => {
    expect(await addTag(postId, name)).toEqual({ ok: false, error });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("refuses a post id that isn't a UUID, without asking the database", async () => {
    expect(await addTag("abc", "Weeknight")).toEqual({
      ok: false,
      error: TAG_SAVE_FAILED,
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

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
