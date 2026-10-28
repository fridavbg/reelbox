import { MAX_JSON_MB } from "@/lib/export/export-settings";

/**
 * Largest request body the hosting accepts. Vercel documents "4.5 MB"; the
 * lower reading is used so an upload is stopped early rather than late.
 */
export const MAX_REQUEST_BYTES = 4_500_000;

/** Largest unpacked upload accepted, the same as one export JSON file. */
export const MAX_UPLOAD_BYTES = MAX_JSON_MB * 1024 * 1024;

/**
 * Most saves accepted in one import, which bounds how long the import's
 * transaction can take. On the hosting, {@link MAX_REQUEST_BYTES} usually
 * stops a large upload first.
 */
export const MAX_IMPORT_POSTS = 20_000;

/** Most collections accepted in one import. */
export const MAX_COLLECTIONS = 1_000;

/** Instagram allows 2,200 characters; the rest is margin. */
export const MAX_CAPTION_LENGTH = 5_000;

/** Instagram allows 30 hashtags per post; the rest is margin. */
export const MAX_HASHTAGS = 100;

/** Longest name, link or hashtag accepted. */
export const MAX_TEXT_LENGTH = 500;

/** Stays far below the largest number the `invalid_count` column can hold. */
export const MAX_INVALID_COUNT = 1_000_000;
