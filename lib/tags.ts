/**
 * The key tags are matched by, so "Recipes" and " recipes " are one tag.
 * Stored as `tags.name_key`, which is unique per user.
 *
 * @param name - A tag or collection name as written.
 * @returns The name trimmed and lowercased.
 */
export const tagKey = (name: string) => name.trim().toLowerCase();
