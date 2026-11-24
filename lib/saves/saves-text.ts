import type { SavesFilter } from "./saves-filter";

/** Empty state: the user has no saves yet. */
export const NO_SAVES_TITLE = "No saves yet";
export const NO_SAVES_TEXT =
  "Import your Instagram export to see your saved reels and posts here.";

/** Shown when the next page couldn't be loaded; the saves already shown stay. */
export const LOAD_MORE_FAILED =
  "More saves couldn't be loaded. Check your connection and try again.";

/** Shown by the error page when the saves couldn't be loaded at all. */
export const SAVES_LOAD_FAILED =
  "Your saves couldn't be loaded. This can happen when the app has been idle; trying again usually works.";

/** Shown while the page loads; waking the database can take a few seconds. */
export const SAVES_LOADING =
  "Loading your saves… The first visit after a quiet spell can take a few seconds.";

/**
 * The line above the grid, e.g. "412 saves · newest first", "12 saves
 * tagged Recipes · newest first" or "380 untagged saves · newest first".
 *
 * @param count - How many saves the grid shows in all.
 * @param filter - Which saves the grid shows.
 * @param tagName - The tag's name as the user wrote it, for a tag filter;
 *   without it, the tag's key from the URL.
 * @returns The line, with "save" or "saves" to match the count.
 */
export function savesCountText(
  count: number,
  filter: SavesFilter,
  tagName?: string,
) {
  const saves = count === 1 ? "save" : "saves";
  const which =
    filter.kind === "tag"
      ? `${saves} tagged ${tagName ?? filter.key}`
      : filter.kind === "untagged"
        ? `untagged ${saves}`
        : saves;
  return `${count} ${which} · newest first`;
}

/** Empty state: no save matches the filter; links back to all saves. */
export const SHOW_ALL_SAVES = "Show all saves";

/**
 * The empty state's title when no save matches the filter.
 *
 * @param filter - A tag or untagged filter.
 * @param tagName - The tag's name as the user wrote it, for a tag filter;
 *   without it, the tag's key from the URL.
 * @returns E.g. "No saves tagged Recipes" or "Every save has a tag".
 */
export function noMatchTitle(
  filter: Exclude<SavesFilter, { kind: "all" }>,
  tagName?: string,
) {
  return filter.kind === "tag"
    ? `No saves tagged ${tagName ?? filter.key}`
    : "Every save has a tag";
}

/**
 * The empty state's text when no save matches the filter.
 *
 * @param filter - A tag or untagged filter.
 * @returns What would make saves show up here.
 */
export function noMatchText(filter: Exclude<SavesFilter, { kind: "all" }>) {
  return filter.kind === "tag"
    ? "Add this tag to a save on the save's page to see it here."
    : "Saves without a tag show up here.";
}

/** The link from a save's page back to the grid. */
export const BACK_TO_SAVES = "← Back to saves";

/** Shown while a save's own page loads. */
export const SAVE_LOADING = "Loading this save…";

/** Shown when the address isn't one of the user's saves. */
export const SAVE_NOT_FOUND_TITLE = "Save not found";
export const SAVE_NOT_FOUND_TEXT =
  "This save isn't in your library. It may have been deleted, or the link is wrong.";

/** Shown on a save's page when it has no tags yet. */
export const NO_TAGS = "No tags yet";

/**
 * The line after the saved date naming the save's Instagram collections,
 * e.g. "Instagram collections: Dinner ideas, Home".
 *
 * @param names - The collections' names, at least one.
 * @returns The line, with "collection" or "collections" to match.
 */
export function collectionsText(names: string[]) {
  const word = names.length === 1 ? "collection" : "collections";
  return `Instagram ${word}: ${names.join(", ")}`;
}

/** The tag filter above the grid: its name, and its first two choices. */
export const TAG_FILTER_LABEL = "Filter by tag";
export const ALL_SAVES = "All";
export const UNTAGGED_SAVES = "Untagged";

/**
 * The words read after a filter chip's count, e.g. " saves" in "Recipes 12
 * saves"; hidden on screen, where the number alone is clear.
 *
 * @param count - How many saves the chip leads to.
 * @returns " save" or " saves", to match the count.
 */
export function chipCountWords(count: number) {
  return count === 1 ? " save" : " saves";
}
