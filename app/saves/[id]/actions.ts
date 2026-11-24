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
import { TAG_SAVE_FAILED } from "@/lib/tags-text";

/** What the tag form gets back: done, or the message to show. */
export type TagResult = { ok: true } | { ok: false; error: string };

const failed: TagResult = { ok: false, error: TAG_SAVE_FAILED };

/**
 * Adds a tag to one of the signed-in user's saves. A tag with the same name
 * in any capitals is reused and keeps its name; otherwise it's created as
 * typed. A tag already on the save is left as it is.
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
    const nameError = typeof name === "string" ? tagNameError(name) : undefined;
    return nameError ? { ok: false, error: nameError } : failed;
  }

  try {
    const post = await db().post.findFirst({
      where: { id: input.postId, userId: user.id },
      select: { id: true },
    });
    if (!post) return failed;

    const nameKey = tagKey(input.name);
    // One query that creates the tag or finds the existing one, so two quick
    // adds of a new name can't both try to create it.
    const tag = await db().tag.upsert({
      where: { userId_nameKey: { userId: user.id, nameKey } },
      create: { userId: user.id, name: input.name, nameKey },
      update: {},
      select: { id: true },
    });
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
 * Sends the saved tags to the page that's open, and drops the browser's
 * copies of the other saves pages, so going back to a filtered grid shows
 * its new counts and saves instead of the ones from before the change.
 * `refresh()` would only update the open page.
 */
function showTagChange() {
  revalidatePath("/saves", "layout");
}
