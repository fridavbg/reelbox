import { z } from "zod";
import { db } from "@/lib/db";

/**
 * One of a user's saves, for its own page: everything the card shows, the
 * full caption, its tags in alphabetical order, and the names of the
 * Instagram collections it's in.
 *
 * @param userId - The signed-in user; only their saves are found.
 * @param postId - The id from the URL. Untrusted: Postgres refuses an id
 *   that isn't a UUID with an error, so it's checked first.
 * @returns The save, or null if the id isn't one of the user's saves.
 */
export async function getSave(userId: string, postId: string) {
  if (!z.uuid().safeParse(postId).success) return null;
  const save = await db().post.findFirst({
    where: { id: postId, userId },
    select: {
      id: true,
      url: true,
      kind: true,
      caption: true,
      creatorUsername: true,
      creatorName: true,
      creatorUrl: true,
      savedAt: true,
      noLongerSavedAt: true,
      tags: {
        select: { tag: { select: { id: true, name: true } } },
        orderBy: { tag: { nameKey: "asc" } },
      },
      collections: {
        select: { collection: { select: { name: true } } },
        orderBy: { collection: { name: "asc" } },
      },
    },
  });
  if (!save) return null;
  return {
    ...save,
    tags: save.tags.map(({ tag }) => tag),
    collections: save.collections.map(({ collection }) => collection.name),
  };
}

/** A save as its own page shows it. */
export type SaveDetails = NonNullable<Awaited<ReturnType<typeof getSave>>>;
