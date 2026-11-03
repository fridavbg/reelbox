import { db } from "@/lib/db";
import {
  afterCursor,
  SAVES_PAGE_SIZE,
  toPage,
  type SavesCursor,
} from "./saves-page";

/**
 * One page of a user's saves, newest first, with each save's tags in
 * alphabetical order.
 *
 * @param userId - The signed-in user; only their saves are read.
 * @param cursor - The last save already shown, or undefined for the first page.
 * @returns The saves to show, and the cursor for the next page or null.
 */
export async function listSaves(userId: string, cursor?: SavesCursor) {
  const rows = await db().post.findMany({
    where: { userId, ...afterCursor(cursor) },
    orderBy: [{ savedAt: "desc" }, { id: "desc" }],
    take: SAVES_PAGE_SIZE + 1,
    select: {
      id: true,
      url: true,
      kind: true,
      creatorUsername: true,
      savedAt: true,
      tags: {
        select: { tag: { select: { name: true } } },
        orderBy: { tag: { nameKey: "asc" } },
      },
    },
  });
  const page = toPage(rows, SAVES_PAGE_SIZE);
  return {
    saves: page.saves.map(({ tags, ...save }) => ({
      ...save,
      tags: tags.map(({ tag }) => tag.name),
    })),
    nextCursor: page.nextCursor,
  };
}

/** A save as the grid shows it. */
export type SaveListItem = Awaited<
  ReturnType<typeof listSaves>
>["saves"][number];
