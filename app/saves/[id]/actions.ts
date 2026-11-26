"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  parseAddTagInput,
  parseRemoveTagInput,
  tagKey,
  tagNameError,
} from "@/lib/tags";
import { SUGGESTION_IGNORE_FAILED, TAG_SAVE_FAILED } from "@/lib/tags-text";

/** What the tag form gets back: done, or the message to show. */
export type TagResult = { ok: true } | { ok: false; error: string };

const failed: TagResult = { ok: false, error: TAG_SAVE_FAILED };
const ignoreFailed: TagResult = { ok: false, error: SUGGESTION_IGNORE_FAILED };

/**
 * Adds a tag to one of the signed-in user's saves. A tag with the same name
 * in any capitals is reused and keeps its name, whatever its length;
 * otherwise it's created as typed, within the length limit for new tags. A
 * tag already on the save is left as it is.
 *
 * Server Functions can be called by anyone with any arguments, like an API
 * route, so the session and both arguments are checked here.
 *
 * @param postId - The save to tag.
 * @param name - The tag's name as typed.
 * @returns Done, or the message to show.
 */
export async function addTag(
  postId: unknown,
  name: unknown,
): Promise<TagResult> {
  const user = await requireUser();
  const input = parseAddTagInput(postId, name);
  if (!input) {
    // Only a name no tag can have is the user's to fix; anything else is a
    // broken request.
    const nameError =
      typeof name === "string"
        ? tagNameError(name, { existing: true })
        : undefined;
    return nameError ? { ok: false, error: nameError } : failed;
  }

  try {
    const post = await db().post.findFirst({
      where: { id: input.postId, userId: user.id },
      select: { id: true },
    });
    if (!post) return failed;

    const nameKey = tagKey(input.name);
    const where = { userId_nameKey: { userId: user.id, nameKey } };
    let tag = await db().tag.findUnique({ where, select: { id: true } });
    if (!tag) {
      // Only a new tag has to fit the length limit.
      const nameError = tagNameError(input.name);
      if (nameError) return { ok: false, error: nameError };
      // Creates the tag or finds it, so two quick adds of a new name can't
      // both try to create it.
      tag = await db().tag.upsert({
        where,
        create: { userId: user.id, name: input.name, nameKey },
        update: {},
        select: { id: true },
      });
    }
    await db().postTag.createMany({
      data: [{ postId: post.id, tagId: tag.id }],
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Failed to add a tag", error);
    return failed;
  }
  showTagChange();
  return { ok: true };
}

/**
 * Removes a tag from one of the signed-in user's saves. The tag itself stays,
 * so it's still offered when typing and can be filtered by.
 *
 * @param postId - The save to remove the tag from.
 * @param tagId - The tag to remove.
 * @returns Done, also if the tag wasn't on the save; or the message to show.
 */
export async function removeTag(
  postId: unknown,
  tagId: unknown,
): Promise<TagResult> {
  const user = await requireUser();
  const input = parseRemoveTagInput(postId, tagId);
  if (!input) return failed;

  try {
    await db().postTag.deleteMany({
      where: {
        postId: input.postId,
        tagId: input.tagId,
        post: { userId: user.id },
      },
    });
  } catch (error) {
    console.error("Failed to remove a tag", error);
    return failed;
  }
  showTagChange();
  return { ok: true };
}

/**
 * Stops suggesting a tag on one of the signed-in user's saves. It's stored
 * by the name's key, since a suggestion named after a collection may not be
 * a tag yet; the tag is still suggested on the creator's other saves.
 *
 * Like the other actions, it checks the session and both arguments itself.
 *
 * @param postId - The save the suggestion was on.
 * @param name - The suggested tag's name.
 * @returns Done, or the message to show.
 */
export async function ignoreSuggestion(
  postId: unknown,
  name: unknown,
): Promise<TagResult> {
  const user = await requireUser();
  // Any name a tag could have, existing ones included.
  const input = parseAddTagInput(postId, name);
  if (!input) return ignoreFailed;

  try {
    const post = await db().post.findFirst({
      where: { id: input.postId, userId: user.id },
      select: { id: true },
    });
    if (!post) return ignoreFailed;
    await db().ignoredSuggestion.createMany({
      data: [{ postId: post.id, userId: user.id, nameKey: tagKey(input.name) }],
      // Ignoring it twice, e.g. from two tabs, is fine.
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Failed to ignore a suggestion", error);
    return ignoreFailed;
  }
  showTagChange();
  return { ok: true };
}

/**
 * Sends the saved tags to the page that's open, and drops the browser's
 * copies of the other saves pages, so going back to a filtered grid shows
 * its new counts and saves instead of the ones from before the change.
 * `refresh()` would only update the open page.
 */
function showTagChange() {
  revalidatePath("/saves", "layout");
}
