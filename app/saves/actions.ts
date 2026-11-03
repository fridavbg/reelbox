"use server";

import { listSaves } from "@/lib/saves/list-saves";
import { parseCursor } from "@/lib/saves/saves-page";
import { requireUser } from "@/lib/session";

/**
 * The next page of the signed-in user's saves, for "Load more".
 *
 * A Server Action can be called by anyone with any argument, like an API
 * route, so the session and the cursor are both checked here.
 *
 * @param cursor - The cursor from the previous page.
 * @returns The next saves, and the cursor for the page after or null.
 * @throws If the cursor isn't one; an unchecked cursor must never fall back
 *   to the first page, which would add saves the user already sees.
 */
export async function loadMoreSaves(cursor: unknown) {
  const user = await requireUser();
  const after = parseCursor(cursor);
  if (!after) throw new Error("Invalid cursor.");
  return listSaves(user.id, after);
}
