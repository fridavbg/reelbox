import { z } from "zod";
import { MAX_TAG_LENGTH } from "./tag-settings";
import { TAG_NAME_EMPTY, TAG_NAME_TOO_LONG } from "./tags-text";

/**
 * The key tags are matched by, so "Recipes" and " recipes " are one tag.
 * Stored as `tags.name_key`, which is unique per user.
 *
 * @param name - A tag or collection name as written.
 * @returns The name trimmed and lowercased.
 */
export const tagKey = (name: string) => name.trim().toLowerCase();

/**
 * Checks a tag name as typed. Shared by the tag form and the server, so
 * both accept the same names.
 *
 * @param name - The name as typed; surrounding spaces don't count.
 * @returns The message to show, or undefined if the name is fine.
 */
export function tagNameError(name: string) {
  // Spread into characters, so an emoji counts as one, not two.
  const length = [...name.trim()].length;
  if (length === 0) return TAG_NAME_EMPTY;
  if (length > MAX_TAG_LENGTH) return TAG_NAME_TOO_LONG;
  return undefined;
}

/** Most tags offered below the tag field at once, matching or most used. */
const MAX_OFFERED_TAGS = 6;

/** One of the user's tags, with how many of their saves it's on. */
export type UserTag = { name: string; count: number };

/**
 * The user's tags that match what's typed in the tag field, to add with one
 * tap: those starting with the text first, then those containing it.
 *
 * @param tagNames - All the user's tag names, in alphabetical order.
 * @param typed - What's typed so far.
 * @param onSave - Names of the tags already on the save, which are left out.
 * @returns At most {@link MAX_OFFERED_TAGS} names; none while nothing's typed.
 */
export function matchingTags(
  tagNames: string[],
  typed: string,
  onSave: string[],
) {
  const text = tagKey(typed);
  if (!text) return [];
  const taken = new Set(onSave.map(tagKey));
  const matches = tagNames.filter(
    (name) => !taken.has(tagKey(name)) && tagKey(name).includes(text),
  );
  const starts = (name: string) => tagKey(name).startsWith(text);
  return [
    ...matches.filter(starts),
    ...matches.filter((name) => !starts(name)),
  ].slice(0, MAX_OFFERED_TAGS);
}

/**
 * The user's tags offered before anything is typed: those on the most
 * saves first, then alphabetically.
 *
 * @param tags - All the user's tags with their counts, in alphabetical order.
 * @param onSave - Names of the tags already on the save, which are left out.
 * @returns At most {@link MAX_OFFERED_TAGS} names.
 */
export function mostUsedTags(tags: UserTag[], onSave: string[]) {
  const taken = new Set(onSave.map(tagKey));
  return (
    tags
      .filter((tag) => !taken.has(tagKey(tag.name)))
      // A stable sort, so equal counts keep their alphabetical order.
      .toSorted((a, b) => b.count - a.count)
      .slice(0, MAX_OFFERED_TAGS)
      .map((tag) => tag.name)
  );
}

const tagNameSchema = z
  .string()
  .trim()
  .refine((name) => !tagNameError(name));

/**
 * Checks what the browser sent to add a tag. Server Functions can be called
 * by anyone with any arguments, so nothing is trusted.
 *
 * @param postId - The save to tag.
 * @param name - The tag's name as typed.
 * @returns The save's id and the trimmed name, or null if either is wrong.
 */
export function parseAddTagInput(postId: unknown, name: unknown) {
  const result = z
    .object({ postId: z.uuid(), name: tagNameSchema })
    .safeParse({ postId, name });
  return result.success ? result.data : null;
}

/**
 * Checks what the browser sent to remove a tag from a save.
 *
 * @param postId - The save to remove the tag from.
 * @param tagId - The tag to remove.
 * @returns Both ids, or null if either isn't one.
 */
export function parseRemoveTagInput(postId: unknown, tagId: unknown) {
  const result = z
    .object({ postId: z.uuid(), tagId: z.uuid() })
    .safeParse({ postId, tagId });
  return result.success ? result.data : null;
}
