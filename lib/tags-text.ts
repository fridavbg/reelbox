import { MAX_TAG_LENGTH } from "./tag-settings";

/** Shown under the tag field when the name is empty or only spaces. */
export const TAG_NAME_EMPTY = "Enter a tag name.";

/** Shown under the tag field when the name is longer than allowed. */
export const TAG_NAME_TOO_LONG = `Tag names can be at most ${MAX_TAG_LENGTH} characters.`;

/** Shown when adding or removing a tag failed on the server. */
export const TAG_SAVE_FAILED = "Couldn't save your tag. Try again.";
