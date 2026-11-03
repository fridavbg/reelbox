import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

/** Saves per page: 6 rows on desktop (4 columns), 12 on mobile (2 columns). */
export const SAVES_PAGE_SIZE = 24;

/** Where the last page ended: the last save shown. */
export type SavesCursor = { savedAt: Date; id: string };

/** Between the date and the id; neither of them contains it. */
const SEPARATOR = "_";

const cursorSchema = z.tuple([z.iso.datetime(), z.uuid()]);

/**
 * Writes a cursor for the browser to send back with "Load more".
 *
 * @param cursor - The last save shown.
 * @returns The cursor as text, e.g. "2026-09-30T12:34:56.789Z_<id>".
 */
export function encodeCursor(cursor: SavesCursor) {
  return `${cursor.savedAt.toISOString()}${SEPARATOR}${cursor.id}`;
}

/**
 * Reads a cursor sent by the browser. Untrusted, so anything malformed is
 * rejected instead of reaching the query.
 *
 * @param value - The cursor as sent.
 * @returns The cursor, or null if it isn't one.
 */
export function parseCursor(value: unknown): SavesCursor | null {
  if (typeof value !== "string") return null;
  const parsed = cursorSchema.safeParse(value.split(SEPARATOR));
  if (!parsed.success) return null;
  const [savedAt, id] = parsed.data;
  return { savedAt: new Date(savedAt), id };
}

/**
 * The filter for saves after the cursor, newest first. Saves with the same
 * saved date are ordered by id, so none is skipped or shown twice.
 *
 * @param cursor - The last save shown, or undefined for the first page.
 * @returns A filter to combine with the user's id.
 */
export function afterCursor(cursor?: SavesCursor): Prisma.PostWhereInput {
  if (!cursor) return {};
  return {
    OR: [
      { savedAt: { lt: cursor.savedAt } },
      { savedAt: cursor.savedAt, id: { lt: cursor.id } },
    ],
  };
}

/**
 * Cuts the rows into one page. The query asks for one row more than a page,
 * so a next page exists only if that row came back.
 *
 * @param rows - Up to `pageSize + 1` rows, newest first.
 * @param pageSize - How many saves a page shows.
 * @returns The page's saves, and the cursor for the next page or null.
 */
export function toPage<T extends SavesCursor>(rows: T[], pageSize: number) {
  const saves = rows.slice(0, pageSize);
  const last = saves.at(-1);
  const nextCursor = rows.length > pageSize && last ? encodeCursor(last) : null;
  return { saves, nextCursor };
}
