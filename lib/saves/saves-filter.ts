import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { MAX_TEXT_LENGTH } from "@/lib/import/import-settings";
import { tagKey, type UserTag } from "@/lib/tags";

/**
 * Which saves the grid shows: all of them, those with one tag (by its key,
 * e.g. "recipes"), or those without any tag.
 */
export type SavesFilter =
  { kind: "all" } | { kind: "tag"; key: string } | { kind: "untagged" };

/** The filter when the URL has none: every save. */
const ALL: SavesFilter = { kind: "all" };

/**
 * Longest tag key a URL may hold. Tags made from Instagram collections can
 * be as long as the import allows a collection name, longer than a typed
 * tag, and lowercasing can make a key up to twice as long ("İ" becomes two
 * characters).
 */
const MAX_TAG_KEY_LENGTH = 2 * MAX_TEXT_LENGTH;

/** A tag key as `tagKey` writes it: trimmed, lowercased and not empty. */
const tagKeySchema = z
  .string()
  .min(1)
  .max(MAX_TAG_KEY_LENGTH)
  .refine((key) => key === tagKey(key));

/** A filter sent by the browser, checked before it reaches a query. */
const savesFilterSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("all") }),
  z.object({ kind: z.literal("tag"), key: tagKeySchema }),
  z.object({ kind: z.literal("untagged") }),
]);

/**
 * Reads the filter from the saves page's URL: `?tag=recipes` or
 * `?untagged=1`. The URL can be edited by hand, so anything that can't be a
 * filter shows all saves instead of an error. A well-formed tag the user
 * doesn't have stays a filter; the page then shows its empty state.
 *
 * @param params - The page's search params.
 * @returns The filter; the tag wins if both are given.
 */
export function filterFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): SavesFilter {
  const { tag, untagged } = params;
  if (typeof tag === "string") {
    const filter = parseSavesFilter({ kind: "tag", key: tagKey(tag) });
    if (filter) return filter;
  }
  if (untagged === "1") return { kind: "untagged" };
  return ALL;
}

/**
 * Checks a filter sent by the browser with "Load more". Server Functions
 * can be called by anyone with any arguments, so nothing is trusted.
 *
 * @param value - The filter as sent.
 * @returns The filter, or null if it isn't one.
 */
export function parseSavesFilter(value: unknown): SavesFilter | null {
  const result = savesFilterSchema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * The part of the saves query that applies the filter.
 *
 * @param filter - Which saves to show.
 * @param userId - The signed-in user; a tag is only matched among theirs.
 * @returns A filter to combine with the user's id and the cursor.
 */
export function filterWhere(
  filter: SavesFilter,
  userId: string,
): Prisma.PostWhereInput {
  switch (filter.kind) {
    case "all":
      return {};
    case "tag":
      return { tags: { some: { tag: { userId, nameKey: filter.key } } } };
    case "untagged":
      return { tags: { none: {} } };
  }
}

/**
 * The query string that holds a filter, read back by
 * {@link filterFromSearchParams}.
 *
 * @param filter - Which saves to show.
 * @returns E.g. "", "?tag=recipes" or "?untagged=1".
 */
function filterSearch(filter: SavesFilter) {
  switch (filter.kind) {
    case "all":
      return "";
    case "tag":
      return `?${new URLSearchParams({ tag: filter.key })}`;
    case "untagged":
      return "?untagged=1";
  }
}

/**
 * The saves page's address for a filter, for links to it.
 *
 * @param filter - Which saves to show.
 * @returns E.g. "/saves", "/saves?tag=recipes" or "/saves?untagged=1".
 */
export function filterHref(filter: SavesFilter) {
  return `/saves${filterSearch(filter)}`;
}

/**
 * A save's page, carrying the grid's filter along so its "Back to saves"
 * link returns to the same filtered grid.
 *
 * @param id - The save's id.
 * @param filter - The filter the grid shows.
 * @returns E.g. "/saves/<id>?tag=recipes".
 */
export function saveHref(id: string, filter: SavesFilter) {
  return `/saves/${id}${filterSearch(filter)}`;
}

/**
 * Reads the filter from a URL's search params in the browser, the way the
 * server reads `searchParams`: a repeated name becomes a list.
 *
 * @param params - The URL's search params.
 * @returns The filter; all saves if there's none.
 */
export function filterFromURLSearchParams(params: URLSearchParams) {
  const record: Record<string, string | string[]> = {};
  for (const name of new Set(params.keys())) {
    const values = params.getAll(name);
    record[name] = values.length === 1 ? values[0] : values;
  }
  return filterFromSearchParams(record);
}

/**
 * How many saves the filter shows, and for a tag, its name as the user
 * wrote it, for the line above the grid and the empty state. Worked out
 * from counts the page already has, so it needs no query of its own.
 *
 * @param filter - Which saves to show.
 * @param tags - All the user's tags with their counts.
 * @param totalCount - How many saves the user has.
 * @param untaggedCount - How many of them have no tag.
 * @returns The count, and the tag's name; a tag the user doesn't have is
 *   named by its key, with no saves.
 */
export function filterSummary(
  filter: SavesFilter,
  tags: UserTag[],
  totalCount: number,
  untaggedCount: number,
): { count: number; tagName?: string } {
  switch (filter.kind) {
    case "all":
      return { count: totalCount };
    case "untagged":
      return { count: untaggedCount };
    case "tag": {
      const tag = tags.find((tag) => tagKey(tag.name) === filter.key);
      return { count: tag?.count ?? 0, tagName: tag?.name ?? filter.key };
    }
  }
}
