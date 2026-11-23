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
 * The line above the grid, e.g. "412 saves · newest first".
 *
 * @param count - How many saves the user has.
 * @returns The line, with "save" or "saves" to match the count.
 */
export function savesCountText(count: number) {
  return `${count} ${count === 1 ? "save" : "saves"} · newest first`;
}

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
