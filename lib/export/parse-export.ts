import {
  COLLECTIONS_FILE,
  FUTURE_SAVE_TOLERANCE_MS,
  INSTAGRAM_LAUNCH,
  POSTS_FILE,
} from "./export-settings";
import {
  IMPOSSIBLE_SAVED_DATE,
  NO_COLLECTION_ID,
  NO_CREATOR,
  NO_LINK,
  NO_SAVED_DATE,
  NO_SAVES,
  NOT_A_POST_LINK,
  NOT_AN_EXPORT,
  NOT_IN_SAVED_POSTS,
  UNREADABLE_ENTRY,
} from "./export-messages";
import { entrySchema, type Field, fileSchema } from "./export-schema";
import { fixEncoding } from "./fix-encoding";
import { type PostKind, parsePostLink, profileUrl } from "./instagram-url";
import type { ExportTexts } from "./read-export-files";

export type ParsedPost = {
  shortcode: string;
  url: string;
  kind: PostKind;
  caption: string | null;
  creatorUsername: string;
  creatorName: string | null;
  creatorUrl: string;
  hashtags: string[];
  fbid: string | null;
  savedAt: Date;
};

export type ParsedCollection = {
  /** Meta's id, so a renamed collection is still recognised. */
  externalId: string;
  name: string;
  shortcodes: string[];
};

export type InvalidEntry = {
  file: typeof POSTS_FILE | typeof COLLECTIONS_FILE;
  /** Position in the file, starting at 1. */
  position: number;
  reason: string;
  /** The link as found in the file. Untrusted: show it as text, never as a link. */
  url?: string;
};

export type ParsedExport = {
  posts: ParsedPost[];
  collections: ParsedCollection[];
  invalid: InvalidEntry[];
  earliestSavedAt: Date;
  latestSavedAt: Date;
};

export type ParseResult =
  { ok: true; export: ParsedExport } | { ok: false; error: string };

const text = (field: Field | undefined) => {
  // Repaired before trimming: in Meta's format "\u00a0" may be the last byte
  // of a character like "à", which trim() would cut off as a space.
  const value = field?.value === undefined ? "" : fixEncoding(field.value);
  return value.trim() || null;
};
const byLabel = (fields: Field[], label: string) =>
  fields.filter((field) => field.label === label);
/** The first link in a list of fields; Meta fills either `value` or `href`. */
const linkOf = (fields: Field[]) =>
  byLabel(fields, "URL").map((field) => field.value ?? field.href)[0];
/** The fields of every item in a titled group, like "Owner" or "Hashtags". */
const groupItems = (fields: Field[], title: string) =>
  fields
    .filter((field) => field.title === title)
    .flatMap((field) => field.dict ?? [])
    .map((item) => item.dict ?? []);

type PostFields =
  | { ok: true; post: Omit<ParsedPost, "fbid" | "savedAt"> }
  | { ok: false; reason: string; url?: string };

// Shared by saved posts and the posts listed inside collections.
function readPostFields(fields: Field[]): PostFields {
  const link = linkOf(fields);
  if (!link) return { ok: false, reason: NO_LINK };
  const parsed = parsePostLink(link);
  if (!parsed) return { ok: false, reason: NOT_A_POST_LINK, url: link };

  // Brand partners use the same fields, so only "Owner" is the creator.
  const owner = groupItems(fields, "Owner")[0] ?? [];
  const username = text(byLabel(owner, "Username")[0]);
  const creatorUrl = username ? profileUrl(username) : null;
  if (!username || !creatorUrl) {
    return { ok: false, reason: NO_CREATOR, url: parsed.url };
  }

  // "#" is stripped before empty tags are dropped, so a lone "#" goes too.
  const hashtags = groupItems(fields, "Hashtags")
    .map((item) => text(byLabel(item, "Name")[0])?.replace(/^#/, ""))
    .filter((tag): tag is string => Boolean(tag))
    .map((tag) => tag.toLowerCase());

  return {
    ok: true,
    post: {
      ...parsed,
      // Some posts list their caption twice; the first one is used.
      caption: byLabel(fields, "Caption").map(text).find(Boolean) ?? null,
      creatorUsername: username,
      creatorName: text(byLabel(owner, "Name")[0]),
      creatorUrl,
      hashtags: [...new Set(hashtags)],
    },
  };
}

function readPosts(entries: unknown[], invalid: InvalidEntry[], now: Date) {
  const latestPossible = now.getTime() + FUTURE_SAVE_TOLERANCE_MS;
  const posts = new Map<string, ParsedPost>();
  entries.forEach((raw, index) => {
    const position = index + 1;
    const entry = entrySchema.safeParse(raw);
    if (!entry.success) {
      invalid.push({ file: POSTS_FILE, position, reason: UNREADABLE_ENTRY });
      return;
    }
    const fields = readPostFields(entry.data.label_values);
    if (!fields.ok) {
      invalid.push({
        file: POSTS_FILE,
        position,
        reason: fields.reason,
        url: fields.url,
      });
      return;
    }
    const { timestamp } = entry.data;
    if (!timestamp || !Number.isFinite(timestamp) || timestamp <= 0) {
      invalid.push({
        file: POSTS_FILE,
        position,
        reason: NO_SAVED_DATE,
        url: fields.post.url,
      });
      return;
    }
    const savedAt = new Date(timestamp * 1000);
    if (savedAt < INSTAGRAM_LAUNCH || savedAt.getTime() > latestPossible) {
      invalid.push({
        file: POSTS_FILE,
        position,
        reason: IMPOSSIBLE_SAVED_DATE,
        url: fields.post.url,
      });
      return;
    }
    const post: ParsedPost = {
      ...fields.post,
      fbid: entry.data.fbid ?? null,
      savedAt,
    };
    // A post listed twice in the same file is kept once, with its latest save.
    const existing = posts.get(post.shortcode);
    if (!existing || existing.savedAt < post.savedAt) {
      posts.set(post.shortcode, post);
    }
  });
  return posts;
}

function readCollections(
  entries: unknown[],
  posts: Map<string, ParsedPost>,
  invalid: InvalidEntry[],
) {
  const collections: ParsedCollection[] = [];
  // Shared by all collections, so a missing post is reported only once.
  const missing = new Set<string>();
  entries.forEach((raw, index) => {
    const position = index + 1;
    const entry = entrySchema.safeParse(raw);
    if (!entry.success) {
      invalid.push({
        file: COLLECTIONS_FILE,
        position,
        reason: UNREADABLE_ENTRY,
      });
      return;
    }
    if (!entry.data.fbid) {
      invalid.push({
        file: COLLECTIONS_FILE,
        position,
        reason: NO_COLLECTION_ID,
      });
      return;
    }
    const fields = entry.data.label_values;
    const shortcodes = new Set<string>();
    // Membership only needs the link; the post's details come from saved_posts.json.
    for (const item of groupItems(fields, "Media")) {
      const link = linkOf(item);
      const post = link ? parsePostLink(link) : null;
      if (!post) {
        invalid.push({
          file: COLLECTIONS_FILE,
          position,
          reason: link ? NOT_A_POST_LINK : NO_LINK,
          url: link,
        });
      } else if (posts.has(post.shortcode)) {
        shortcodes.add(post.shortcode);
      } else if (!missing.has(post.shortcode)) {
        missing.add(post.shortcode);
        invalid.push({
          file: COLLECTIONS_FILE,
          position,
          reason: NOT_IN_SAVED_POSTS,
          url: post.url,
        });
      }
    }
    collections.push({
      externalId: entry.data.fbid,
      name: text(byLabel(fields, "Name")[0]) ?? "Untitled collection",
      shortcodes: [...shortcodes],
    });
  });
  return collections;
}

/**
 * Reads Instagram's saved_posts.json and, if given, saved_collections.json.
 * Broken entries don't stop the import: they're returned in `invalid` with a
 * reason. Only a file that isn't an export at all, or has no readable saved
 * posts, fails as a whole.
 */
export function parseExport(files: ExportTexts, now = new Date()): ParseResult {
  const postEntries = readJsonList(files.posts);
  if (!postEntries) return { ok: false, error: NOT_AN_EXPORT };
  const collectionEntries =
    files.collections === null ? [] : readJsonList(files.collections);
  if (!collectionEntries) return { ok: false, error: NOT_AN_EXPORT };

  const invalid: InvalidEntry[] = [];
  const posts = readPosts(postEntries, invalid, now);
  if (posts.size === 0) return { ok: false, error: NO_SAVES };
  const collections = readCollections(collectionEntries, posts, invalid);

  const list = [...posts.values()];
  let earliest = list[0].savedAt;
  let latest = list[0].savedAt;
  for (const { savedAt } of list) {
    if (savedAt < earliest) earliest = savedAt;
    if (savedAt > latest) latest = savedAt;
  }
  return {
    ok: true,
    export: {
      posts: list,
      collections,
      invalid,
      earliestSavedAt: earliest,
      latestSavedAt: latest,
    },
  };
}

function readJsonList(json: string): unknown[] | null {
  try {
    const parsed = fileSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
