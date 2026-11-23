import { MAX_TAG_LENGTH } from "./tag-settings";

/** Shown under the tag field when the name is empty or only spaces. */
export const TAG_NAME_EMPTY = "Enter a tag name.";

/** Shown under the tag field when the name is longer than allowed. */
export const TAG_NAME_TOO_LONG = `Tag names can be at most ${MAX_TAG_LENGTH} characters.`;

/** Shown when adding or removing a tag failed on the server. */
export const TAG_SAVE_FAILED = "Couldn't save your tag. Try again.";

/**
 * Read out by screen readers as matches appear below the tag field.
 *
 * @param count - How many of the user's tags match what's typed.
 * @returns E.g. "3 matching tags", or nothing when none match.
 */
export function matchingTagsText(count: number) {
  if (count === 0) return "";
  return `${count} matching ${count === 1 ? "tag" : "tags"}`;
}

/** Above the tags offered before anything is typed. */
export const MOST_USED_TAGS = "Most used";

/** Above all the user's tags, once "Show all" is chosen. */
export const ALL_TAGS = "All your tags";

/** Above the tags matching what's typed. */
export const MATCHING_TAGS = "Matching tags";

/**
 * The button that shows all the user's tags below the tag field.
 *
 * @param count - How many tags it would show.
 * @returns E.g. "Show all 55 tags".
 */
export function showAllTagsText(count: number) {
  return `Show all ${count} tags`;
}
