import {
  NO_COLLECTION_ID,
  UNREADABLE_ENTRY,
} from "@/lib/export/export-messages";
import { COLLECTIONS_FILE } from "@/lib/export/export-settings";
import type {
  InvalidEntry,
  ParsedCollection,
  ParsedPost,
} from "@/lib/export/parse-export";
import { tagKey } from "@/lib/tags";

/** What the browser sends after parsing the export. */
export type ImportInput = {
  posts: ParsedPost[];
  collections: ParsedCollection[];
  invalidCount: number;
};

/** What the user already has, read inside the import's transaction. */
export type ExistingLibrary = {
  shortcodes: string[];
  tags: { id: string; name: string; nameKey: string }[];
  collections: { id: string; externalId: string; name: string }[];
};

/**
 * Counts the saves that couldn't be read, for "Couldn't read" in the summary.
 * Problems with a whole collection are still listed to the user, but aren't
 * counted, since they aren't a single save.
 *
 * @param invalid - Everything the parser couldn't read, from both files.
 * @returns How many of those entries are about a single save.
 */
export function countUnreadableSaves(invalid: InvalidEntry[]) {
  return invalid.filter(
    (entry) =>
      entry.file !== COLLECTIONS_FILE ||
      (entry.reason !== UNREADABLE_ENTRY && entry.reason !== NO_COLLECTION_ID),
  ).length;
}

/**
 * Works out every row an import adds, ready to insert. Posts already in the
 * library are skipped, and only new posts get collection tags, so a
 * re-import never changes the tags on posts the user already had.
 *
 * @param userId - The importing user; every row belongs to them.
 * @param input - The cleaned export sent by the browser.
 * @param existing - The user's library, read in the same transaction.
 * @param now - Used for `createdAt` and `importedAt`.
 * @returns The rows to insert, collections to rename, and the summary counts.
 * @throws If the upload has no posts, since an import needs a date range.
 */
export function buildImport(
  userId: string,
  input: ImportInput,
  existing: ExistingLibrary,
  now: Date,
) {
  if (input.posts.length === 0) {
    throw new Error("An import needs at least one post.");
  }
  const posts = newPostRows(userId, input.posts, existing.shortcodes);
  const postId = new Map(posts.map((post) => [post.shortcode, post.id]));
  const { collections, collectionRenames, collectionId } = collectionRows(
    userId,
    input.collections,
    existing.collections,
    now,
  );
  const { tags, postTags } = collectionTagRows(
    userId,
    input.collections,
    postId,
    existing.tags,
    now,
  );
  const summary = {
    newCount: posts.length,
    duplicateCount: input.posts.length - posts.length,
    invalidCount: input.invalidCount,
    tagsAddedCount: tags.length,
  };

  return {
    posts,
    collections,
    collectionRenames,
    tags,
    postTags,
    postCollections: postCollectionRows(
      input.collections,
      postId,
      collectionId,
    ),
    import: importRow(userId, input.posts, summary, now),
    summary,
  };
}

/**
 * A new row id. Ids are made here instead of by the database, so links
 * between new rows can use them before anything is inserted.
 *
 * @returns A random UUID.
 */
const newId = () => crypto.randomUUID();

/**
 * Posts the library doesn't have yet, with new ids. A shortcode repeated in
 * the upload is added once.
 *
 * @param userId - The importing user.
 * @param posts - Every post in the upload.
 * @param existingShortcodes - Shortcodes already in the user's library.
 * @returns Rows for the posts to insert.
 */
function newPostRows(
  userId: string,
  posts: ParsedPost[],
  existingShortcodes: string[],
) {
  const seen = new Set(existingShortcodes);
  const rows = [];
  for (const post of posts) {
    if (seen.has(post.shortcode)) continue;
    seen.add(post.shortcode);
    // Columns are listed one by one, so a new field from the parser doesn't
    // reach the database by accident.
    rows.push({
      id: newId(),
      userId,
      shortcode: post.shortcode,
      url: post.url,
      kind: post.kind,
      caption: post.caption,
      creatorUsername: post.creatorUsername,
      creatorName: post.creatorName,
      creatorUrl: post.creatorUrl,
      hashtags: post.hashtags,
      fbid: post.fbid,
      savedAt: post.savedAt,
      noLongerSavedAt: null,
    });
  }
  return rows;
}

/**
 * Collections to add or rename. They're matched by Meta's id, so a collection
 * renamed on Instagram keeps its posts here.
 *
 * @param userId - The importing user.
 * @param collections - Every collection in the upload.
 * @param existing - The user's collections already in the database.
 * @param now - Used for `createdAt`.
 * @returns Rows to insert, renames to apply, and every collection's id by
 * Meta's id, old and new.
 */
function collectionRows(
  userId: string,
  collections: ParsedCollection[],
  existing: ExistingLibrary["collections"],
  now: Date,
) {
  const known = new Map(existing.map((c) => [c.externalId, c]));
  const collectionId = new Map(existing.map((c) => [c.externalId, c.id]));
  const rows = [];
  const renames = [];
  for (const { externalId, name } of collections) {
    const current = known.get(externalId);
    if (current && current.name !== name) {
      renames.push({ id: current.id, name });
    } else if (!current && !collectionId.has(externalId)) {
      const row = { id: newId(), userId, externalId, name, createdAt: now };
      rows.push(row);
      collectionId.set(externalId, row.id);
    }
  }
  return { collections: rows, collectionRenames: renames, collectionId };
}

/**
 * The ids of a collection's posts that are new in this import.
 *
 * @param collection - A collection from the upload.
 * @param postId - New posts' ids by shortcode.
 * @returns Ids of the collection's new posts, each once; posts already in the
 * library are left out.
 */
const newPostIdsIn = (
  collection: ParsedCollection,
  postId: Map<string, string>,
) => [
  ...new Set(
    collection.shortcodes.flatMap((shortcode) => postId.get(shortcode) ?? []),
  ),
];

/**
 * Tags a collection's new posts with a tag named after it. An existing tag
 * with the same name is reused, and a collection without new posts makes no
 * tag.
 *
 * @param userId - The importing user.
 * @param collections - Every collection in the upload.
 * @param postId - New posts' ids by shortcode.
 * @param existingTags - The user's tags already in the database.
 * @param now - Used for `createdAt`.
 * @returns New tags to insert, and the links between new posts and tags.
 */
function collectionTagRows(
  userId: string,
  collections: ParsedCollection[],
  postId: Map<string, string>,
  existingTags: ExistingLibrary["tags"],
  now: Date,
) {
  const tagId = new Map(existingTags.map((tag) => [tag.nameKey, tag.id]));
  const tags = [];
  // Keyed by post and tag: collections with the same name share a tag.
  const postTags = new Map<
    string,
    { postId: string; tagId: string; createdAt: Date }
  >();
  for (const collection of collections) {
    const newPostIds = newPostIdsIn(collection, postId);
    if (newPostIds.length === 0) continue;

    const nameKey = tagKey(collection.name);
    if (!tagId.has(nameKey)) {
      const name = collection.name.trim();
      const tag = { id: newId(), userId, name, nameKey, createdAt: now };
      tags.push(tag);
      tagId.set(nameKey, tag.id);
    }
    for (const id of newPostIds) {
      const link = { postId: id, tagId: tagId.get(nameKey)!, createdAt: now };
      postTags.set(`${link.postId}:${link.tagId}`, link);
    }
  }
  return { tags, postTags: [...postTags.values()] };
}

/**
 * Links each new post to the collections it's in.
 *
 * @param collections - Every collection in the upload.
 * @param postId - New posts' ids by shortcode.
 * @param collectionId - Every collection's id by Meta's id.
 * @returns Rows for `post_collections`.
 */
function postCollectionRows(
  collections: ParsedCollection[],
  postId: Map<string, string>,
  collectionId: Map<string, string>,
) {
  return collections.flatMap((collection) =>
    newPostIdsIn(collection, postId).map((id) => ({
      postId: id,
      collectionId: collectionId.get(collection.externalId)!,
    })),
  );
}

/**
 * The `imports` row. Its date range covers the whole export, duplicates
 * included, since a post is only flagged as no longer saved if its saved date
 * is inside the range of the latest import.
 *
 * @param userId - The importing user.
 * @param posts - Every post in the upload, duplicates included.
 * @param summary - The counts to store.
 * @param now - Stored as `importedAt`.
 * @returns The row for `imports`.
 */
function importRow(
  userId: string,
  posts: ParsedPost[],
  summary: { newCount: number; duplicateCount: number; invalidCount: number },
  now: Date,
) {
  const savedDates = posts.map((post) => post.savedAt.getTime());
  return {
    id: newId(),
    userId,
    importedAt: now,
    earliestSavedAt: new Date(Math.min(...savedDates)),
    latestSavedAt: new Date(Math.max(...savedDates)),
    newCount: summary.newCount,
    duplicateCount: summary.duplicateCount,
    invalidCount: summary.invalidCount,
  };
}
