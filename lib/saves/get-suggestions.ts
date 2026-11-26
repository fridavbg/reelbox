import { db } from "@/lib/db";
import { suggestTags, type TagSuggestions } from "@/lib/tag-suggestions";

/** What the suggestions need to know about the save, from `getSave`. */
type SaveForSuggestions = {
  id: string;
  creatorUsername: string;
  tags: { name: string }[];
  collections: string[];
};

/**
 * The tags to suggest on a save's page: the user's tags on the same
 * creator's other saves, and the save's collections, without the ones the
 * user ignored on this save.
 *
 * @param userId - The signed-in user; only their tags and saves count.
 * @param save - The save, as `getSave` returns it.
 * @returns The suggestions from each source.
 */
export async function getSuggestions(
  userId: string,
  save: SaveForSuggestions,
): Promise<TagSuggestions> {
  const otherSaves = {
    userId,
    creatorUsername: save.creatorUsername,
    id: { not: save.id },
  };
  const [creatorTags, ignored] = await Promise.all([
    db().tag.findMany({
      where: { userId, posts: { some: { post: otherSaves } } },
      select: {
        name: true,
        _count: { select: { posts: { where: { post: otherSaves } } } },
      },
    }),
    db().ignoredSuggestion.findMany({
      where: { userId, postId: save.id },
      select: { nameKey: true },
    }),
  ]);
  return suggestTags({
    onSave: save.tags.map((tag) => tag.name),
    creatorTags: creatorTags.map((tag) => ({
      name: tag.name,
      count: tag._count.posts,
    })),
    collections: save.collections,
    ignored: ignored.map((row) => row.nameKey),
  });
}
