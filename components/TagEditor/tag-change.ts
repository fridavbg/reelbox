import { tagKey } from "@/lib/tags";

type Tag = { id: string; name: string };

/** A change the user just made, shown before the server has saved it. */
export type TagChange =
  { type: "add"; name: string } | { type: "remove"; id: string };

// Added tags have no id until the server saves them.
const SAVING = "saving:";

/**
 * The save's tags with a change applied, to show it at once while the
 * server saves it. When the save is done, the server's tags replace these;
 * if it fails, the tags go back to how they were.
 *
 * @param tags - The tags as shown.
 * @param change - The tag added or removed.
 * @returns The tags with the change, in alphabetical order.
 */
export function applyTagChange(tags: Tag[], change: TagChange): Tag[] {
  if (change.type === "remove") {
    return tags.filter((tag) => tag.id !== change.id);
  }
  const key = tagKey(change.name);
  if (tags.some((tag) => tagKey(tag.name) === key)) return tags;
  return [
    ...tags,
    { id: `${SAVING}${key}`, name: change.name.trim() },
  ].toSorted((a, b) => tagKey(a.name).localeCompare(tagKey(b.name)));
}

/**
 * Whether a tag shown was just added and isn't saved yet, so it can't be
 * removed until it has an id.
 *
 * @param tag - A tag as shown.
 * @returns True while it's saving.
 */
export function isSaving(tag: Tag) {
  return tag.id.startsWith(SAVING);
}
