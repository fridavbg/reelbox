import { MAX_OFFERED_TAGS, tagKey, type UserTag } from "./tags";

export type SuggestionInput = {
  /** Names of the tags already on the save. */
  onSave: string[];
  /** The user's tags on other saves by the same creator, with how often. */
  creatorTags: UserTag[];
  /** Names of the collections the save is in. */
  collections: string[];
  /** Name keys of suggestions the user ignored on this save. */
  ignored: string[];
};

export type TagSuggestions = {
  /** Tags the user puts on this creator's saves, most used first. */
  fromCreator: string[];
  /** Tags named after the save's collections, in the collections' order. */
  fromCollections: string[];
};

/**
 * Works out which tags to suggest for a save: the tags the user already
 * puts on the same creator's saves, and tags named after the save's
 * collections. Tags already on the save and suggestions the user ignored
 * are left out, and a tag both sources suggest is only offered once, under
 * the creator.
 *
 * @param input - The save's tags, the creator's tags, the save's
 *   collections and the ignored suggestions.
 * @returns At most {@link MAX_OFFERED_TAGS} names from each source.
 */
export function suggestTags(input: SuggestionInput): TagSuggestions {
  const left = new Set([...input.onSave.map(tagKey), ...input.ignored]);

  const fromCreator = input.creatorTags
    .filter((tag) => !left.has(tagKey(tag.name)))
    // Ties in alphabetical order, so the list never jumps around.
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, MAX_OFFERED_TAGS)
    .map((tag) => tag.name);
  for (const name of fromCreator) left.add(tagKey(name));

  const fromCollections: string[] = [];
  for (const collection of input.collections) {
    const name = collection.trim();
    const key = tagKey(name);
    if (!name || left.has(key)) continue;
    left.add(key);
    fromCollections.push(name);
  }

  return {
    fromCreator,
    fromCollections: fromCollections.slice(0, MAX_OFFERED_TAGS),
  };
}
