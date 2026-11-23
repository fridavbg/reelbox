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
