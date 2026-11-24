/** Longest name for a new tag, in characters; an emoji counts as one. */
export const MAX_TAG_LENGTH = 30;

/**
 * Longest tag name an import can create: tags made from Instagram
 * collections keep the collection's full name. The import refuses longer
 * collection names, and existing tags up to this length can be added to
 * other saves.
 */
export const MAX_IMPORTED_TAG_LENGTH = 500;
