import { db } from "@/lib/db";
import { cardCaption } from "./save-card-text";
import { filterWhere, type SavesFilter } from "./saves-filter";
import {
  afterCursor,
  SAVES_PAGE_SIZE,
  toPage,
  type SavesCursor,
} from "./saves-page";

/**
 * One page of a user's saves, newest first, with each save's tags in
 * alphabetical order and its caption shortened for the card.
 *
 * @param userId - The signed-in user; only their saves are read.
 * @param filter - Which saves to show: all, one tag's, or the untagged ones.
 * @param cursor - The last save already shown, or undefined for the first page.
 * @returns The saves to show, and the cursor for the next page or null.
 */
export async function listSaves(
  userId: string,
  filter: SavesFilter,
  cursor?: SavesCursor,
) {
  const rows = await db().post.findMany({
    // AND keeps the filter and the cursor apart; both may grow an OR.
    where: { userId, AND: [filterWhere(filter, userId), afterCursor(cursor)] },
    orderBy: [{ savedAt: "desc" }, { id: "desc" }],
    take: SAVES_PAGE_SIZE + 1,
    select: {
      id: true,
      url: true,
      kind: true,
      caption: true,
      creatorUsername: true,
      creatorName: true,
      creatorUrl: true,
      savedAt: true,
      noLongerSavedAt: true,
      tags: {
        select: { tag: { select: { name: true } } },
        orderBy: { tag: { nameKey: "asc" } },
      },
    },
  });
  const page = toPage(rows, SAVES_PAGE_SIZE);
  return {
    saves: page.saves.map(({ tags, caption, ...save }) => ({
      ...save,
      caption: cardCaption(caption),
      tags: tags.map(({ tag }) => tag.name),
    })),
    nextCursor: page.nextCursor,
  };
}

/** A save as the grid shows it. */
export type SaveListItem = Awaited<
  ReturnType<typeof listSaves>
>["saves"][number];
