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
