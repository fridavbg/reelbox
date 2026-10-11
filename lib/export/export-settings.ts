/** Largest export ZIP accepted. A "Saved only" JSON export is a few MB. */
export const MAX_ZIP_MB = 50;

/** Largest single JSON file accepted, also when found inside a ZIP. */
export const MAX_JSON_MB = 20;

export const POSTS_FILE = "saved_posts.json";
export const COLLECTIONS_FILE = "saved_collections.json";

/**
 * Saved dates before Instagram launched (6 October 2010) can't be real. A
 * fake date would stretch the import's date range, which decides what gets
 * flagged as no longer saved.
 */
export const INSTAGRAM_LAUNCH = new Date("2010-10-06T00:00:00Z");

/** Saved dates may be this far in the future, to allow for clock differences. */
export const FUTURE_SAVE_TOLERANCE_MS = 24 * 60 * 60 * 1000;
