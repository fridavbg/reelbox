import {
  COLLECTIONS_FILE,
  MAX_JSON_MB,
  MAX_ZIP_MB,
  POSTS_FILE,
} from "./export-settings";

const SMALLER_EXPORT =
  "Request a new export with only Saved selected, in JSON format, or a shorter date range.";

export const NO_FILE = `Choose your export ZIP or ${POSTS_FILE}.`;
export const WRONG_TYPE = `Choose a .zip file or ${POSTS_FILE} (and ${COLLECTIONS_FILE}).`;
export const MIXED_FILES = "Choose either the ZIP or the JSON files, not both.";
export const ONE_ZIP = "Choose one ZIP at a time.";
export const ZIP_TOO_LARGE = `This ZIP is larger than ${MAX_ZIP_MB} MB. ${SMALLER_EXPORT}`;
export const JSON_TOO_LARGE = `This file is larger than ${MAX_JSON_MB} MB. ${SMALLER_EXPORT}`;
export const NOT_A_ZIP =
  "We couldn't open this ZIP. Download the export again and try once more.";
export const HTML_EXPORT =
  "This export is in HTML format. Request a new export in JSON format.";
export const NO_POSTS_FILE = `We couldn't find ${POSTS_FILE}. ${SMALLER_EXPORT}`;
export const NOT_AN_EXPORT =
  "We couldn't find your saves in this file. Check that you chose JSON format and ticked Saved.";
export const NO_SAVES =
  "This export doesn't contain any saved posts we could read.";

// Why a single entry couldn't be read; shown in the import summary.
export const NO_LINK = "No link to the post.";
export const NOT_A_POST_LINK = "The link isn't an Instagram post or reel.";
export const NO_SAVED_DATE = "No saved date.";
export const IMPOSSIBLE_SAVED_DATE =
  "The saved date is before Instagram existed, or in the future.";
export const NO_CREATOR = "No creator.";
export const UNREADABLE_ENTRY = "This entry isn't in the expected format.";
export const NOT_IN_SAVED_POSTS =
  "In a collection, but missing from your saved posts, so it has no saved date.";
export const NO_COLLECTION_ID = "This collection has no id.";
